#!/usr/bin/env bash
# P04-escrow/start.sh — Arranca Anvil + despliega contratos + lanza Next.js
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SC_DIR="$SCRIPT_DIR/sc"
WEB_DIR="$SCRIPT_DIR/web"

# ─── Colores ──────────────────────────────────────────────────────────────────
BOLD="\033[1m"; DIM="\033[2m"; GREEN="\033[0;32m"; RED="\033[0;31m"
YELLOW="\033[1;33m"; CYAN="\033[0;36m"; WHITE="\033[1;37m"; RESET="\033[0m"

info()  { echo -e "${CYAN}[INFO]${RESET}  $*"; }
ok()    { echo -e "${GREEN}[OK]${RESET}    $*"; }
warn()  { echo -e "${YELLOW}[WARN]${RESET}  $*"; }
error() { echo -e "${RED}[ERROR]${RESET} $*"; exit 1; }

# ─── Proceso hijo tracking ─────────────────────────────────────────────────────
CHILD_PIDS=()

cleanup() {
  echo ""
  warn "Deteniendo todos los servicios…"
  for pid in "${CHILD_PIDS[@]:-}"; do
    kill "$pid" 2>/dev/null || true
  done
  # Windows: matar procesos por nombre
  if command -v taskkill &>/dev/null; then
    taskkill //F //IM anvil.exe //T 2>/dev/null || true
    taskkill //F //IM node.exe  //T 2>/dev/null || true
  fi
  pkill -f "next dev"  2>/dev/null || true
  pkill -f "anvil"     2>/dev/null || true
  echo -e "${CYAN}  Hasta luego.${RESET}"
  echo ""
}
trap cleanup EXIT INT TERM

echo ""
echo -e "${BOLD}${WHITE}╔══════════════════════════════════════════╗${RESET}"
echo -e "${BOLD}${WHITE}║   🔐 P04 · Escrow DApp · start.sh        ║${RESET}"
echo -e "${BOLD}${WHITE}╚══════════════════════════════════════════╝${RESET}"
echo ""

# ─── [1/5] Verificar dependencias ─────────────────────────────────────────────
info "[1/5] Verificando dependencias…"

FORGE_CMD=""
if command -v forge &>/dev/null; then
  FORGE_CMD="forge"
elif command -v forge.exe &>/dev/null; then
  FORGE_CMD="forge.exe"
elif [ -f "/c/Users/$USERNAME/.foundry/bin/forge.exe" ]; then
  FORGE_CMD="/c/Users/$USERNAME/.foundry/bin/forge.exe"
else
  error "forge no encontrado. Instala Foundry: https://book.getfoundry.sh"
fi

ANVIL_CMD=""
if command -v anvil &>/dev/null; then
  ANVIL_CMD="anvil"
elif command -v anvil.exe &>/dev/null; then
  ANVIL_CMD="anvil.exe"
elif [ -f "/c/Users/$USERNAME/.foundry/bin/anvil.exe" ]; then
  ANVIL_CMD="/c/Users/$USERNAME/.foundry/bin/anvil.exe"
else
  error "anvil no encontrado."
fi

NODE_CMD=""
if command -v node &>/dev/null; then
  NODE_CMD="node"
elif command -v node.exe &>/dev/null; then
  NODE_CMD="node.exe"
else
  error "node no encontrado. Instala Node.js 18+"
fi

NPM_CMD=""
if command -v npm &>/dev/null; then
  NPM_CMD="npm"
elif command -v npm.cmd &>/dev/null; then
  NPM_CMD="npm.cmd"
else
  error "npm no encontrado."
fi

ok "forge: $FORGE_CMD | anvil: $ANVIL_CMD | node: $NODE_CMD"

# ─── [2/5] Matar procesos previos ────────────────────────────────────────────
info "[2/5] Limpiando procesos anteriores…"
if command -v taskkill &>/dev/null; then
  taskkill //F //IM anvil.exe //T 2>/dev/null || true
fi
pkill -f "anvil" 2>/dev/null || true
# Matar proceso en puerto 3000
if command -v lsof &>/dev/null; then
  lsof -ti:3000 | xargs kill -9 2>/dev/null || true
elif command -v netstat &>/dev/null; then
  netstat -aon 2>/dev/null | grep ":3000 " | awk '{print $5}' | xargs -r taskkill //F //PID 2>/dev/null || true
fi
sleep 1
ok "Limpieza completada."

# ─── [3/5] Iniciar Anvil ──────────────────────────────────────────────────────
info "[3/5] Iniciando Anvil en http://localhost:8545…"
"$ANVIL_CMD" --host 0.0.0.0 --port 8545 --chain-id 31337 > /tmp/anvil-p04.log 2>&1 &
ANVIL_PID=$!
CHILD_PIDS+=("$ANVIL_PID")
sleep 2

if ! kill -0 "$ANVIL_PID" 2>/dev/null; then
  error "Anvil no pudo arrancar. Ver /tmp/anvil-p04.log"
fi
ok "Anvil PID $ANVIL_PID"

# ─── [4/5] Deploy contratos ───────────────────────────────────────────────────
info "[4/5] Desplegando contratos en Anvil…"

# Instalar dependencias si no existen
if [ ! -d "$SC_DIR/lib/openzeppelin-contracts" ]; then
  warn "  Instalando OpenZeppelin…"
  (cd "$SC_DIR" && "$FORGE_CMD" install OpenZeppelin/openzeppelin-contracts 2>&1) || true
fi
if [ ! -d "$SC_DIR/lib/forge-std" ]; then
  warn "  Instalando forge-std…"
  (cd "$SC_DIR" && "$FORGE_CMD" install foundry-rs/forge-std 2>&1) || true
fi

# Limpiar broadcast anterior para evitar conflictos
rm -rf "$SC_DIR/broadcast" "$SC_DIR/cache"

DEPLOY_LOG=$(cd "$SC_DIR" && "$FORGE_CMD" script script/Deploy.s.sol \
  --rpc-url http://localhost:8545 \
  --broadcast \
  --legacy \
  2>&1)

echo "$DEPLOY_LOG" | grep -E "Escrow:|TokenA:|TokenB:|Error|error" || true

# Extraer addresses
ESCROW_ADDR=$(echo "$DEPLOY_LOG" | grep -oP "(?<=Escrow:  )0x[0-9a-fA-F]{40}" | head -1)
TOKENA_ADDR=$(echo "$DEPLOY_LOG" | grep -oP "(?<=TokenA:  )0x[0-9a-fA-F]{40}" | head -1)
TOKENB_ADDR=$(echo "$DEPLOY_LOG" | grep -oP "(?<=TokenB:  )0x[0-9a-fA-F]{40}" | head -1)

# Fallback: buscar con espacios variables
if [ -z "$ESCROW_ADDR" ]; then
  ESCROW_ADDR=$(echo "$DEPLOY_LOG" | grep "Escrow:" | grep -oE "0x[0-9a-fA-F]{40}" | head -1)
  TOKENA_ADDR=$(echo "$DEPLOY_LOG" | grep "TokenA:" | grep -oE "0x[0-9a-fA-F]{40}" | head -1)
  TOKENB_ADDR=$(echo "$DEPLOY_LOG" | grep "TokenB:" | grep -oE "0x[0-9a-fA-F]{40}" | head -1)
fi

if [ -z "$ESCROW_ADDR" ] || [ -z "$TOKENA_ADDR" ] || [ -z "$TOKENB_ADDR" ]; then
  echo "$DEPLOY_LOG"
  error "No se pudieron extraer las addresses del deploy. Ver output anterior."
fi

ok "Escrow:  $ESCROW_ADDR"
ok "TokenA:  $TOKENA_ADDR"
ok "TokenB:  $TOKENB_ADDR"

# Escribir .env.local
cat > "$WEB_DIR/.env.local" <<EOF
NEXT_PUBLIC_ESCROW_ADDRESS=$ESCROW_ADDR
NEXT_PUBLIC_TOKEN_A_ADDRESS=$TOKENA_ADDR
NEXT_PUBLIC_TOKEN_B_ADDRESS=$TOKENB_ADDR
NEXT_PUBLIC_CHAIN_ID=31337
NEXT_PUBLIC_RPC_URL=http://127.0.0.1:8545
EOF
ok ".env.local actualizado en web/"

# ─── [5/5] Iniciar Next.js ────────────────────────────────────────────────────
info "[5/5] Iniciando Next.js en http://localhost:3000…"

if [ ! -d "$WEB_DIR/node_modules" ]; then
  info "  Instalando dependencias npm…"
  (cd "$WEB_DIR" && "$NPM_CMD" install 2>&1) || error "npm install falló"
fi

(cd "$WEB_DIR" && "$NPM_CMD" run dev 2>&1) &
NEXT_PID=$!
CHILD_PIDS+=("$NEXT_PID")
sleep 4

# ─── Resumen ──────────────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}${WHITE}╔═══════════════════════════════════════════════════════════╗${RESET}"
echo -e "${BOLD}${WHITE}║                 🔐 Escrow DApp — Listo                    ║${RESET}"
echo -e "${BOLD}${WHITE}╠═══════════════════════════════════════════════════════════╣${RESET}"
printf "${WHITE}║${RESET}  %-18s  ${GREEN}%-38s${RESET}${WHITE}║${RESET}\n" "Anvil RPC"    "http://localhost:8545 (chainId 31337)"
printf "${WHITE}║${RESET}  %-18s  ${CYAN}%-38s${RESET}${WHITE}║${RESET}\n"  "Escrow"      "$ESCROW_ADDR"
printf "${WHITE}║${RESET}  %-18s  ${CYAN}%-38s${RESET}${WHITE}║${RESET}\n"  "TokenA (TKA)" "$TOKENA_ADDR"
printf "${WHITE}║${RESET}  %-18s  ${CYAN}%-38s${RESET}${WHITE}║${RESET}\n"  "TokenB (TKB)" "$TOKENB_ADDR"
printf "${WHITE}║${RESET}  %-18s  ${GREEN}%-38s${RESET}${WHITE}║${RESET}\n" "App"          "http://localhost:3000"
echo -e "${BOLD}${WHITE}╚═══════════════════════════════════════════════════════════╝${RESET}"
echo ""
echo -e "${DIM}  Cuentas de prueba (1000 TKA + 1000 TKB cada una):${RESET}"
echo -e "${DIM}  #0  0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 (owner)${RESET}"
echo -e "${DIM}  #1  0x70997970C51812dc3A010C7d01b50e0d17dc79C8${RESET}"
echo -e "${DIM}  #2  0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC${RESET}"
echo ""
echo -e "${YELLOW}  Ctrl+C para detener todos los servicios.${RESET}"
echo ""

# Mantener el script activo
wait "$NEXT_PID" 2>/dev/null || true
