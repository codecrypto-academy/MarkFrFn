#!/usr/bin/env bash
# ============================================================
#  start.sh  —  Arranca Anvil + Deploy + Next.js de una vez
#  Uso: bash start.sh   (desde la carpeta P02-dao/)
# ============================================================

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SC_DIR="$SCRIPT_DIR/sc"
WEB_DIR="$SCRIPT_DIR/web"
FORGE="$HOME/.foundry/bin/forge"
ANVIL="$HOME/.foundry/bin/anvil"
# Deployer = Anvil key #0 (pública, solo desarrollo local)
DEPLOYER_KEY="0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
# Relayer  = Anvil key #1 (pública, solo desarrollo local)
RELAYER_KEY="0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d"
RPC_URL="http://localhost:8545"
ANVIL_PID=""

BOLD="\033[1m"
DIM="\033[2m"
GREEN="\033[0;32m"
RED="\033[0;31m"
YELLOW="\033[1;33m"
CYAN="\033[0;36m"
WHITE="\033[1;37m"
RESET="\033[0m"

# ── Cleanup al salir (Ctrl+C o error) ──────────────────────
cleanup() {
  echo ""
  echo -e "${YELLOW}  Deteniendo servicios...${RESET}"
  if [ -n "$ANVIL_PID" ] && kill -0 "$ANVIL_PID" 2>/dev/null; then
    kill "$ANVIL_PID" 2>/dev/null
    echo -e "${DIM}  Anvil detenido (PID $ANVIL_PID)${RESET}"
  fi
  echo -e "${CYAN}  Hasta luego.${RESET}"
  echo ""
  exit 0
}
trap cleanup SIGINT SIGTERM EXIT

# ── Header ─────────────────────────────────────────────────
clear
echo ""
echo -e "${BOLD}${CYAN}+======================================================+"
echo -e "|       DAO Voting Gasless (ERC-2771)  -  Dev Stack   |"
echo -e "+======================================================+${RESET}"
echo ""

# ── Verificar dependencias ──────────────────────────────────
echo -e "${BOLD}${WHITE}[1/4] Verificando dependencias...${RESET}"

MISSING=0
for bin in "$FORGE" "$ANVIL"; do
  if [ ! -f "$bin" ]; then
    echo -e "  ${RED}No encontrado: $bin${RESET}"; MISSING=1
  fi
done

NODE_CMD=""
if   command -v node     &>/dev/null; then NODE_CMD="node"
elif command -v node.exe &>/dev/null; then NODE_CMD="node.exe"
fi
[ -z "$NODE_CMD" ] && { echo -e "  ${RED}No encontrado: node${RESET}"; MISSING=1; }

NPM_CMD=""
if   command -v npm     &>/dev/null; then NPM_CMD="npm"
elif command -v npm.cmd &>/dev/null; then NPM_CMD="npm.cmd"
elif command -v npm.exe &>/dev/null; then NPM_CMD="npm.exe"
fi
[ -z "$NPM_CMD" ] && { echo -e "  ${RED}No encontrado: npm${RESET}"; MISSING=1; }

if [ ! -d "$WEB_DIR/node_modules" ]; then
  echo -e "  ${YELLOW}  node_modules no encontrado. Ejecuta: cd web && npm install${RESET}"
  MISSING=1
fi

[ "$MISSING" -eq 1 ] && { echo -e "${RED}  Faltan dependencias. Abortando.${RESET}"; exit 1; }
echo -e "  ${GREEN}OK — forge, anvil, ${NODE_CMD}, ${NPM_CMD}${RESET}"
echo ""

# ── Arrancar Anvil ──────────────────────────────────────────
echo -e "${BOLD}${WHITE}[2/4] Iniciando Anvil (red local Ethereum)...${RESET}"

if taskkill.exe /IM anvil.exe /F &>/dev/null 2>&1 || \
   taskkill //IM anvil.exe //F &>/dev/null 2>&1; then
  echo -e "  ${YELLOW}Instancia previa de Anvil detenida.${RESET}"
  sleep 0.5
fi

"$ANVIL" --port 8545 --silent > /tmp/anvil-p02.log 2>&1 &
ANVIL_PID=$!

echo -e "  ${DIM}Esperando que Anvil esté listo...${RESET}"
READY=0
for i in $(seq 1 30); do
  if curl -s -X POST -H "Content-Type: application/json" \
    --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
    "$RPC_URL" > /dev/null 2>&1; then
    READY=1; break
  fi
  sleep 0.3
done

[ "$READY" -eq 0 ] && { echo -e "  ${RED}Anvil no respondió. Revisa /tmp/anvil-p02.log${RESET}"; exit 1; }
echo -e "  ${GREEN}Anvil listo — PID $ANVIL_PID — RPC: $RPC_URL${RESET}"
echo ""

# ── Desplegar contratos ─────────────────────────────────────
echo -e "${BOLD}${WHITE}[3/4] Desplegando MinimalForwarder + DAOVoting...${RESET}"

cd "$SC_DIR"
DEPLOY_OUT=$("$FORGE" script script/Deploy.s.sol \
  --rpc-url "$RPC_URL" \
  --broadcast \
  --private-key "$DEPLOYER_KEY" 2>&1)
DEPLOY_CODE=$?

if [ "$DEPLOY_CODE" -ne 0 ]; then
  echo -e "  ${RED}Error en el despliegue:${RESET}"
  echo "$DEPLOY_OUT" | grep -E "Error|error|revert" | sed 's/^/    /'
  exit 1
fi

# Extraer direcciones desde los logs de forge (el Deploy.s.sol las imprime en orden)
FORWARDER_ADDR=$(echo "$DEPLOY_OUT" | grep -i "MinimalForwarder:" | grep -oE '0x[a-fA-F0-9]{40}' | head -1)
DAO_ADDR=$(echo       "$DEPLOY_OUT" | grep -i "DAOVoting:"        | grep -oE '0x[a-fA-F0-9]{40}' | head -1)

# Fallback: leer del broadcast JSON (primer y segundo contractAddress)
BROADCAST_JSON="$SC_DIR/broadcast/Deploy.s.sol/31337/run-latest.json"
if [ -z "$FORWARDER_ADDR" ] || [ -z "$DAO_ADDR" ]; then
  if [ -f "$BROADCAST_JSON" ]; then
    ADDRESSES=$(grep -oE '"contractAddress": *"0x[a-fA-F0-9]+"' "$BROADCAST_JSON" \
      | grep -oE '0x[a-fA-F0-9]+')
    FORWARDER_ADDR=$(echo "$ADDRESSES" | sed -n '1p')
    DAO_ADDR=$(echo       "$ADDRESSES" | sed -n '2p')
  fi
fi

if [ -z "$FORWARDER_ADDR" ] || [ -z "$DAO_ADDR" ]; then
  echo -e "  ${RED}No se pudieron obtener las direcciones de los contratos.${RESET}"
  echo "$DEPLOY_OUT" | tail -20
  exit 1
fi

echo -e "  ${GREEN}MinimalForwarder: ${WHITE}$FORWARDER_ADDR${RESET}"
echo -e "  ${GREEN}DAOVoting:        ${WHITE}$DAO_ADDR${RESET}"

# Actualizar web/.env.local con las nuevas direcciones
ENV_FILE="$WEB_DIR/.env.local"

update_env() {
  local key="$1" val="$2"
  if grep -q "^${key}=" "$ENV_FILE"; then
    sed -i "s|^${key}=.*|${key}=${val}|" "$ENV_FILE"
  else
    echo "${key}=${val}" >> "$ENV_FILE"
  fi
}

update_env "NEXT_PUBLIC_FORWARDER_ADDRESS" "$FORWARDER_ADDR"
update_env "NEXT_PUBLIC_DAO_ADDRESS"       "$DAO_ADDR"
update_env "RELAYER_PRIVATE_KEY"           "$RELAYER_KEY"
update_env "RPC_URL"                       "$RPC_URL"

echo -e "  ${DIM}$ENV_FILE actualizado${RESET}"
echo ""

# ── Arrancar frontend ───────────────────────────────────────
echo -e "${BOLD}${WHITE}[4/4] Iniciando frontend Next.js...${RESET}"
echo ""
echo -e "${BOLD}${CYAN}+======================================================+"
printf "${BOLD}${CYAN}|  Anvil       ->  %-35s|\n${RESET}" "$RPC_URL"
printf "${BOLD}${CYAN}|  Forwarder   ->  %-35s|\n${RESET}" "$FORWARDER_ADDR"
printf "${BOLD}${CYAN}|  DAO         ->  %-35s|\n${RESET}" "$DAO_ADDR"
echo -e "${BOLD}${CYAN}|  App         ->  http://localhost:3000               |"
echo -e "|                                                      |"
echo -e "|  Presiona Ctrl+C para detener todo                   |"
echo -e "+======================================================+${RESET}"
echo ""

cd "$WEB_DIR"
trap cleanup SIGINT SIGTERM
"$NPM_CMD" run dev
