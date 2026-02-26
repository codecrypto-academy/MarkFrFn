#!/usr/bin/env bash
# ============================================================
#  start.sh  —  Arranca Anvil + Deploy + Next.js de una vez
#  Uso: bash start.sh
# ============================================================

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CONTRACTS_DIR="$SCRIPT_DIR/contracts"
DAPP_DIR="$SCRIPT_DIR/dapp"
FORGE="$HOME/.foundry/bin/forge"
ANVIL="$HOME/.foundry/bin/anvil"
DEPLOYER_KEY="0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
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
echo -e "|          ETH Document Registry  -  Dev Stack        |"
echo -e "+======================================================+${RESET}"
echo ""

# ── Verificar dependencias ──────────────────────────────────
echo -e "${BOLD}${WHITE}[1/4] Verificando dependencias...${RESET}"

MISSING=0
for bin in "$FORGE" "$ANVIL"; do
  if [ ! -f "$bin" ]; then
    echo -e "  ${RED}No encontrado: $bin${RESET}"
    MISSING=1
  fi
done

# Detectar node: primero "node", luego "node.exe" (WSL con Node en Windows)
NODE_CMD=""
if command -v node &>/dev/null; then
  NODE_CMD="node"
elif command -v node.exe &>/dev/null; then
  NODE_CMD="node.exe"
fi
if [ -z "$NODE_CMD" ]; then
  echo -e "  ${RED}No encontrado: node (ni node.exe)${RESET}"; MISSING=1
fi

# Detectar npm: "npm", "npm.cmd" (WSL) o "npm.exe"
NPM_CMD=""
if command -v npm &>/dev/null; then
  NPM_CMD="npm"
elif command -v npm.cmd &>/dev/null; then
  NPM_CMD="npm.cmd"
elif command -v npm.exe &>/dev/null; then
  NPM_CMD="npm.exe"
fi
if [ -z "$NPM_CMD" ]; then
  echo -e "  ${RED}No encontrado: npm (ni npm.cmd ni npm.exe)${RESET}"; MISSING=1
fi

if [ ! -d "$DAPP_DIR/node_modules" ]; then
  echo -e "  ${YELLOW}  node_modules no encontrado. Ejecuta: cd dapp && npm install${RESET}"
  MISSING=1
fi

if [ "$MISSING" -eq 1 ]; then
  echo -e "${RED}  Faltan dependencias. Abortando.${RESET}"
  exit 1
fi
echo -e "  ${GREEN}OK — forge, anvil, ${NODE_CMD}, ${NPM_CMD}${RESET}"
echo ""

# ── Arrancar Anvil ──────────────────────────────────────────
echo -e "${BOLD}${WHITE}[2/4] Iniciando Anvil (red local Ethereum)...${RESET}"

# Matar instancia previa de Anvil si existe
# taskkill.exe funciona tanto en Git Bash como en WSL
if taskkill.exe /IM anvil.exe /F &>/dev/null 2>&1 || \
   taskkill //IM anvil.exe //F &>/dev/null 2>&1; then
  echo -e "  ${YELLOW}Anvil previo detenido.${RESET}"
  sleep 0.5
fi

"$ANVIL" --port 8545 --silent > /tmp/anvil-dev.log 2>&1 &
ANVIL_PID=$!

# Esperar a que Anvil responda
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

if [ "$READY" -eq 0 ]; then
  echo -e "  ${RED}Anvil no respondió. Revisa /tmp/anvil-dev.log${RESET}"
  exit 1
fi
echo -e "  ${GREEN}Anvil listo — PID $ANVIL_PID — RPC: $RPC_URL${RESET}"
echo ""

# ── Desplegar contrato ──────────────────────────────────────
echo -e "${BOLD}${WHITE}[3/4] Desplegando DocumentRegistry...${RESET}"

cd "$CONTRACTS_DIR"
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

# Extraer dirección desde broadcast JSON (más fiable que parsear logs)
# El JSON usa: "contractAddress": "0x..." (con espacio tras los dos puntos)
BROADCAST_JSON="$CONTRACTS_DIR/broadcast/Deploy.s.sol/31337/run-latest.json"
if [ -f "$BROADCAST_JSON" ]; then
  CONTRACT_ADDR=$(grep -o '"contractAddress": *"0x[a-fA-F0-9]*"' "$BROADCAST_JSON" \
    | grep -o '0x[a-fA-F0-9]*' | head -1)
fi

# Fallback: parsear desde los logs de forge
if [ -z "$CONTRACT_ADDR" ]; then
  CONTRACT_ADDR=$(echo "$DEPLOY_OUT" | grep -oE '0x[a-fA-F0-9]{40}' | head -1)
fi

if [ -z "$CONTRACT_ADDR" ]; then
  echo -e "  ${RED}No se pudo obtener la dirección del contrato.${RESET}"
  exit 1
fi

echo -e "  ${GREEN}Contrato desplegado: ${WHITE}$CONTRACT_ADDR${RESET}"

# Actualizar .env.local con la nueva dirección
ENV_FILE="$DAPP_DIR/.env.local"
if grep -q "NEXT_PUBLIC_CONTRACT_ADDRESS" "$ENV_FILE"; then
  sed -i "s|NEXT_PUBLIC_CONTRACT_ADDRESS=.*|NEXT_PUBLIC_CONTRACT_ADDRESS=$CONTRACT_ADDR|" "$ENV_FILE"
else
  echo "NEXT_PUBLIC_CONTRACT_ADDRESS=$CONTRACT_ADDR" >> "$ENV_FILE"
fi
echo -e "  ${DIM}$ENV_FILE actualizado${RESET}"
echo ""

# ── Arrancar frontend ───────────────────────────────────────
echo -e "${BOLD}${WHITE}[4/4] Iniciando frontend Next.js...${RESET}"
echo ""
echo -e "${BOLD}${CYAN}+======================================================+"
echo -e "|  Anvil     ->  $RPC_URL              |"
echo -e "|  Contrato  ->  $CONTRACT_ADDR  |"
echo -e "|  App       ->  http://localhost:3000                 |"
echo -e "|                                                      |"
echo -e "|  Presiona Ctrl+C para detener todo                   |"
echo -e "+======================================================+${RESET}"
echo ""

cd "$DAPP_DIR"
# Desactivar trap EXIT temporalmente para que npm dev maneje su propia señal
trap cleanup SIGINT SIGTERM
"$NPM_CMD" run dev
