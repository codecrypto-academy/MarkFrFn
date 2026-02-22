#!/usr/bin/env bash
# ============================================================================
# restart-all.sh — P03 E-Commerce Blockchain
# Arranca Anvil, deploya contratos, actualiza .env.local y levanta 4 apps web.
# ============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
FORGE="$HOME/.foundry/bin/forge"
ANVIL="$HOME/.foundry/bin/anvil"
RPC_URL="http://localhost:8545"

DEPLOYER_KEY="0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
DEPLOYER_ADDR="0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"

CHAIN_ID=31337
PUBLIC_RPC="http://127.0.0.1:8545"

# ─── Colores ─────────────────────────────────────────────────────────────────
G='\033[0;32m'; Y='\033[1;33m'; R='\033[0;31m'; B='\033[0;34m'; NC='\033[0m'
log()  { echo -e "${G}[OK]${NC} $1"; }
info() { echo -e "${B}[..] $1${NC}"; }
warn() { echo -e "${Y}[!!] $1${NC}"; }
err()  { echo -e "${R}[ER] $1${NC}"; exit 1; }

# ─── PIDs de procesos hijos ───────────────────────────────────────────────────
CHILD_PIDS=()

# ─── Cleanup: matar todo al salir (Ctrl+C o fin del script) ──────────────────
cleanup() {
  echo ""
  warn "Deteniendo todos los servicios…"
  for pid in "${CHILD_PIDS[@]:-}"; do
    kill "$pid" 2>/dev/null || true
  done
  if command -v taskkill &>/dev/null; then
    taskkill //F //IM node.exe  //T 2>/dev/null || true
    taskkill //F //IM anvil.exe //T 2>/dev/null || true
  fi
  pkill -f "next dev" 2>/dev/null || true
  pkill -f "anvil"    2>/dev/null || true
  log "Servicios detenidos."
}
trap cleanup EXIT INT TERM

# ─── Detectar npm ─────────────────────────────────────────────────────────────
if command -v npm &>/dev/null; then
  NPM_CMD="npm"
elif command -v npm.cmd &>/dev/null; then
  NPM_CMD="npm.cmd"
else
  err "npm no encontrado. Instala Node.js."
fi

# ─── 1. Matar procesos anteriores ────────────────────────────────────────────
info "Deteniendo procesos anteriores…"
# Windows: taskkill mata el exe; Linux/Mac: pkill
if command -v taskkill &>/dev/null; then
  taskkill //F //IM anvil.exe //T 2>/dev/null || true
  taskkill //F //IM node.exe  //T 2>/dev/null || true
fi
pkill -f "anvil"    2>/dev/null || true
pkill -f "next dev" 2>/dev/null || true
sleep 2

# ─── 2. Iniciar Anvil ────────────────────────────────────────────────────────
info "Iniciando Anvil (chainId $CHAIN_ID)…"
"$ANVIL" --port 8545 --silent > /tmp/anvil-p03.log 2>&1 &
ANVIL_PID=$!
CHILD_PIDS+=($ANVIL_PID)

# Esperar a que Anvil esté listo
for i in $(seq 1 30); do
  if curl -sf -X POST "$RPC_URL" \
    -H "Content-Type: application/json" \
    -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' > /dev/null 2>&1; then
    break
  fi
  sleep 1
  if [ "$i" -eq 30 ]; then err "Anvil no respondió en 30 segundos."; fi
done
log "Anvil corriendo en $RPC_URL (PID: $ANVIL_PID)"

# ─── Limpiar caches de broadcast (evita conflictos con Anvil fresco) ──────────
info "Limpiando caches de broadcast…"
rm -rf "$SCRIPT_DIR/stablecoin/sc/broadcast"
rm -rf "$SCRIPT_DIR/stablecoin/sc/cache"
rm -rf "$SCRIPT_DIR/sc-ecommerce/broadcast"
rm -rf "$SCRIPT_DIR/sc-ecommerce/cache"

# ─── 3. Deploy EuroToken ─────────────────────────────────────────────────────
info "Desplegando EuroToken…"
EURO_OUTPUT=$(cd "$SCRIPT_DIR/stablecoin/sc" && "$FORGE" script script/Deploy.s.sol \
  --rpc-url "$RPC_URL" \
  --broadcast \
  --private-key "$DEPLOYER_KEY" \
  2>&1) || { echo "$EURO_OUTPUT"; err "Forge falló al desplegar EuroToken."; }

EURO_TOKEN_ADDRESS=$(echo "$EURO_OUTPUT" | grep "EuroToken:" | awk '{print $2}')
[ -z "$EURO_TOKEN_ADDRESS" ] && { echo "$EURO_OUTPUT"; err "No se pudo extraer la dirección de EuroToken."; }
log "EuroToken: $EURO_TOKEN_ADDRESS"

# ─── 4. Deploy E-Commerce Contracts ──────────────────────────────────────────
info "Desplegando contratos e-commerce…"
ECOM_OUTPUT=$(cd "$SCRIPT_DIR/sc-ecommerce" && EURO_TOKEN_ADDRESS="$EURO_TOKEN_ADDRESS" "$FORGE" script script/Deploy.s.sol \
  --rpc-url "$RPC_URL" \
  --broadcast \
  --private-key "$DEPLOYER_KEY" \
  2>&1) || { echo "$ECOM_OUTPUT"; err "Forge falló al desplegar e-commerce."; }

extract() { echo "$ECOM_OUTPUT" | grep "$1:" | awk '{print $2}'; }

ECOMMERCE_MAIN=$(extract "EcommerceMain")
COMPANY_REG=$(extract "CompanyRegistry")
PRODUCT_CAT=$(extract "ProductCatalog")
SHOPPING_CART=$(extract "ShoppingCart")
INVOICE_SYS=$(extract "InvoiceSystem")
PAYMENT_GW=$(extract "PaymentGateway")

[ -z "$ECOMMERCE_MAIN" ] && { echo "$ECOM_OUTPUT"; err "No se pudo extraer la dirección de EcommerceMain."; }
log "EcommerceMain:   $ECOMMERCE_MAIN"
log "CompanyRegistry: $COMPANY_REG"
log "ProductCatalog:  $PRODUCT_CAT"
log "ShoppingCart:    $SHOPPING_CART"
log "InvoiceSystem:   $INVOICE_SYS"
log "PaymentGateway:  $PAYMENT_GW"

# ─── 5. Actualizar .env.local en cada app ────────────────────────────────────

# Preservar claves Stripe del .env.local anterior (no sobreescribir con placeholders)
STRIPE_ENV="$SCRIPT_DIR/stablecoin/compra-stablecoin/.env.local"
STRIPE_PK="pk_test_PLACEHOLDER"
STRIPE_SK="sk_test_PLACEHOLDER"
STRIPE_WH="whsec_PLACEHOLDER"
if [ -f "$STRIPE_ENV" ]; then
  _pk=$(grep "^NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=" "$STRIPE_ENV" 2>/dev/null | cut -d= -f2- || true)
  _sk=$(grep "^STRIPE_SECRET_KEY=" "$STRIPE_ENV" 2>/dev/null | cut -d= -f2- || true)
  _wh=$(grep "^STRIPE_WEBHOOK_SECRET=" "$STRIPE_ENV" 2>/dev/null | cut -d= -f2- || true)
  [ -n "$_pk" ] && STRIPE_PK="$_pk"
  [ -n "$_sk" ] && STRIPE_SK="$_sk"
  [ -n "$_wh" ] && STRIPE_WH="$_wh"
fi

write_env() {
  local dir="$1"
  local content="$2"
  mkdir -p "$dir"
  echo "$content" > "$dir/.env.local"
  log ".env.local → $dir"
}

write_env "$SCRIPT_DIR/stablecoin/compra-stablecoin" \
"NEXT_PUBLIC_EUROTOKEN_ADDRESS=$EURO_TOKEN_ADDRESS
NEXT_PUBLIC_CHAIN_ID=$CHAIN_ID
NEXT_PUBLIC_RPC_URL=$PUBLIC_RPC
MINTER_PRIVATE_KEY=$DEPLOYER_KEY
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=$STRIPE_PK
STRIPE_SECRET_KEY=$STRIPE_SK
STRIPE_WEBHOOK_SECRET=$STRIPE_WH"

write_env "$SCRIPT_DIR/stablecoin/pasarela-de-pago" \
"NEXT_PUBLIC_EUROTOKEN_ADDRESS=$EURO_TOKEN_ADDRESS
NEXT_PUBLIC_PAYMENT_GATEWAY_ADDRESS=$PAYMENT_GW
NEXT_PUBLIC_CHAIN_ID=$CHAIN_ID
NEXT_PUBLIC_RPC_URL=$PUBLIC_RPC"

write_env "$SCRIPT_DIR/web-admin" \
"NEXT_PUBLIC_ECOMMERCE_MAIN_ADDRESS=$ECOMMERCE_MAIN
NEXT_PUBLIC_CHAIN_ID=$CHAIN_ID
NEXT_PUBLIC_RPC_URL=$PUBLIC_RPC"

write_env "$SCRIPT_DIR/web-customer" \
"NEXT_PUBLIC_ECOMMERCE_MAIN_ADDRESS=$ECOMMERCE_MAIN
NEXT_PUBLIC_CHAIN_ID=$CHAIN_ID
NEXT_PUBLIC_RPC_URL=$PUBLIC_RPC
NEXT_PUBLIC_PAYMENT_GATEWAY_URL=http://localhost:6002"

# ─── 6. Instalar dependencias y arrancar apps ─────────────────────────────────
start_app() {
  local dir="$1"
  local port="$2"
  local name="$3"
  info "Instalando dependencias en $name…"
  (cd "$dir" && "$NPM_CMD" install --silent 2>/dev/null)
  info "Arrancando $name en :$port…"
  (cd "$dir" && "$NPM_CMD" run dev > /tmp/${name}.log 2>&1) &
  CHILD_PIDS+=($!)
  sleep 2
  log "$name → http://localhost:$port"
}

start_app "$SCRIPT_DIR/stablecoin/compra-stablecoin" 6001 "compra-stablecoin"
start_app "$SCRIPT_DIR/stablecoin/pasarela-de-pago" 6002 "pasarela-de-pago"
start_app "$SCRIPT_DIR/web-admin" 6003 "web-admin"
start_app "$SCRIPT_DIR/web-customer" 6004 "web-customer"

# ─── 7. Resumen ───────────────────────────────────────────────────────────────
echo ""
echo -e "${G}═══════════════════════════════════════════════════════${NC}"
echo -e "${G}  P03 E-Commerce Blockchain — Sistema iniciado         ${NC}"
echo -e "${G}═══════════════════════════════════════════════════════${NC}"
echo -e "  Anvil RPC:          ${B}$RPC_URL${NC}"
echo -e "  EuroToken:          ${B}$EURO_TOKEN_ADDRESS${NC}"
echo -e "  EcommerceMain:      ${B}$ECOMMERCE_MAIN${NC}"
echo -e ""
echo -e "  🌐 Compra EURT:     ${B}http://localhost:6001${NC}"
echo -e "  💳 Pasarela pago:   ${B}http://localhost:6002${NC}"
echo -e "  🏪 Panel Admin:     ${B}http://localhost:6003${NC}"
echo -e "  🛒 Tienda:          ${B}http://localhost:6004${NC}"
echo -e ""
echo -e "  Para Stripe webhooks locales:"
echo -e "  ${Y}stripe listen --forward-to localhost:6001/api/webhooks${NC}"
echo -e "${G}═══════════════════════════════════════════════════════${NC}"

wait
