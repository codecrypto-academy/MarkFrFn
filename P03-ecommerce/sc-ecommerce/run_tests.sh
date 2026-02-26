#!/usr/bin/env bash

# Ejecutar siempre desde la carpeta del script
cd "$(dirname "$0")"

FORGE="$HOME/.foundry/bin/forge"
BOLD="\033[1m"
DIM="\033[2m"
GREEN="\033[0;32m"
RED="\033[0;31m"
CYAN="\033[0;36m"
WHITE="\033[1;37m"
RESET="\033[0m"

# ─── Descripciones legibles ───────────────────────────────────────────────────

declare -A TEST_DESC

# Company Registry
TEST_DESC["testRegisterCompany_StoresData"]="[01/27] [COMPANY]     Registrar empresa guarda datos correctamente"
TEST_DESC["testRegisterCompany_Duplicate_Reverts"]="[02/27] [COMPANY]     Registrar empresa duplicada revierte"
TEST_DESC["testRegisterCompany_EmptyName_Reverts"]="[03/27] [COMPANY]     Nombre vacío al registrar revierte"
TEST_DESC["testIsCompanyOwner"]="[04/27] [COMPANY]     isCompanyOwner devuelve true/false correcto"

# Product Catalog
TEST_DESC["testAddProduct_StoresData"]="[05/27] [PRODUCTO]    Agregar producto guarda datos correctamente"
TEST_DESC["testAddProduct_NotCompanyOwner_Reverts"]="[06/27] [PRODUCTO]    No-empresa no puede agregar producto"
TEST_DESC["testUpdateProduct"]="[07/27] [PRODUCTO]    Actualizar precio y stock funciona"
TEST_DESC["testGetAllProducts_ReturnsBoth"]="[08/27] [PRODUCTO]    getAllProducts devuelve todos los productos"
TEST_DESC["testGetCompanyProducts"]="[09/27] [PRODUCTO]    getCompanyProducts filtra por empresa"

# Shopping Cart
TEST_DESC["testAddToCart_UpdatesCart"]="[10/27] [CARRITO]     Agregar al carrito actualiza items"
TEST_DESC["testAddToCart_CalculatesTotal"]="[11/27] [CARRITO]     Total del carrito calculado correctamente"
TEST_DESC["testAddToCart_ZeroQuantity_Reverts"]="[12/27] [CARRITO]     Cantidad cero al agregar revierte"
TEST_DESC["testRemoveFromCart"]="[13/27] [CARRITO]     Eliminar item del carrito funciona"
TEST_DESC["testRemoveFromCart_NotInCart_Reverts"]="[14/27] [CARRITO]     Eliminar item no existente revierte"

# Invoice System
TEST_DESC["testCreateInvoice_FromCart"]="[15/27] [FACTURA]     Crear factura desde carrito con importes correctos"
TEST_DESC["testCreateInvoice_ClearsCart"]="[16/27] [FACTURA]     Crear factura vacía el carrito"
TEST_DESC["testCreateInvoice_EmptyCart_Reverts"]="[17/27] [FACTURA]     Crear factura con carrito vacío revierte"
TEST_DESC["testGetCustomerInvoices"]="[18/27] [FACTURA]     getCustomerInvoices devuelve facturas del cliente"

# Payment Gateway
TEST_DESC["testProcessPayment_TransfersTokens"]="[19/27] [PAGO]        Pago transfiere tokens al comerciante"
TEST_DESC["testProcessPayment_MarksInvoicePaid"]="[20/27] [PAGO]        Pago marca la factura como pagada"
TEST_DESC["testProcessPayment_UpdatesStock"]="[21/27] [PAGO]        Pago reduce el stock de productos"
TEST_DESC["testProcessPayment_AlreadyPaid_Reverts"]="[22/27] [PAGO]        Pagar factura ya pagada revierte"
TEST_DESC["testProcessPayment_WrongCustomer_Reverts"]="[23/27] [PAGO]        Cliente incorrecto no puede pagar"
TEST_DESC["testProcessPayment_InsufficientAllowance_Reverts"]="[24/27] [PAGO]        Sin allowance el pago revierte"

# EcommerceMain
TEST_DESC["testEcommerceMain_GetAllProducts"]="[25/27] [MAIN]        EcommerceMain.getAllProducts funciona"
TEST_DESC["testEcommerceMain_GetCart"]="[26/27] [MAIN]        EcommerceMain.getCart funciona"
TEST_DESC["testEcommerceMain_GetCompanyByAddress"]="[27/27] [MAIN]        EcommerceMain.getCompanyByAddress funciona"

# ─── Header ──────────────────────────────────────────────────────────────────

echo ""
echo -e "${BOLD}${CYAN}+========================================================+"
echo -e "|   E-Commerce Blockchain  .  Test Runner               |"
echo -e "|   Solidity 0.8.24  .  OpenZeppelin v5  .  6 contratos|"
echo -e "+========================================================+${RESET}"
echo ""

# ─── Compilacion ─────────────────────────────────────────────────────────────

echo -e "${DIM}  Compilando...${RESET}"
BUILD_OUT=$("$FORGE" build 2>&1)
BUILD_CODE=$?
if [ $BUILD_CODE -ne 0 ]; then
  echo -e "${RED}  ERROR DE COMPILACION:${RESET}"
  echo "$BUILD_OUT" | grep -E "^Error|^error" | sed 's/^/    /'
  exit 1
fi
echo -e "${GREEN}  Compilacion OK${RESET}"
echo ""

# ─── Ejecucion de tests ───────────────────────────────────────────────────────

OUTPUT=$("$FORGE" test -vvv --match-contract EcommerceTest 2>&1)
EXIT_CODE=$?

echo -e "${BOLD}${WHITE}  Resultados:${RESET}"
echo -e "  ${DIM}--------------------------------------------------------${RESET}"

PASS_COUNT=0
FAIL_COUNT=0
declare -A GAS_MAP

while IFS= read -r line; do
  if [[ "$line" =~ \[(PASS|FAIL.*)\]\ (test[A-Za-z_0-9]+)\(\)\ \(gas:\ ([0-9]+)\) ]]; then
    STATUS="${BASH_REMATCH[1]}"
    FUNC="${BASH_REMATCH[2]}"
    GAS="${BASH_REMATCH[3]}"
    GAS_MAP["$FUNC"]=$GAS
    DESC="${TEST_DESC[$FUNC]:-$FUNC}"
    if [[ "$STATUS" == "PASS" ]]; then
      echo -e "  ${GREEN}PASS${RESET}  $DESC"
      echo -e "        ${DIM}gas: $GAS${RESET}"
      PASS_COUNT=$((PASS_COUNT + 1))
    else
      echo -e "  ${RED}FAIL${RESET}  ${RED}$DESC${RESET}"
      echo -e "        ${DIM}gas: $GAS${RESET}"
      FAIL_COUNT=$((FAIL_COUNT + 1))
    fi
  fi
done <<< "$OUTPUT"

# ─── Detalle de fallos ────────────────────────────────────────────────────────

if [ $FAIL_COUNT -gt 0 ]; then
  echo ""
  echo -e "  ${DIM}--------------------------------------------------------${RESET}"
  echo -e "  ${BOLD}${RED}Detalle de fallos:${RESET}"
  echo "$OUTPUT" | grep -A 10 "\[FAIL" | grep -v "^--$" | grep -v "Warning\|note\[" | sed 's/^/    /'
fi

TOTAL=$((PASS_COUNT + FAIL_COUNT))

# ─── Resumen de gas ───────────────────────────────────────────────────────────

if [ ${#GAS_MAP[@]} -gt 0 ]; then
  echo ""
  echo -e "  ${DIM}--------------------------------------------------------${RESET}"
  echo -e "  ${BOLD}${WHITE}Consumo de gas por test:${RESET}"
  TOTAL_GAS=0
  MAX_GAS=0
  MAX_FUNC=""
  for func in "${!GAS_MAP[@]}"; do
    g=${GAS_MAP[$func]}
    TOTAL_GAS=$((TOTAL_GAS + g))
    if [ "$g" -gt "$MAX_GAS" ]; then
      MAX_GAS=$g
      MAX_FUNC=$func
    fi
    printf "        ${DIM}%-55s %7d gas${RESET}\n" "$func" "$g"
  done
  if [ $TOTAL -gt 0 ]; then
    AVG_GAS=$((TOTAL_GAS / TOTAL))
    echo ""
    printf "        ${DIM}Promedio: %d gas   |   Max: %d gas${RESET}\n" "$AVG_GAS" "$MAX_GAS"
    echo -e "        ${DIM}Test mas costoso: $MAX_FUNC${RESET}"
  fi
fi

# ─── Footer ───────────────────────────────────────────────────────────────────

echo ""
echo -e "${BOLD}${CYAN}+========================================================+${RESET}"
if [ "$EXIT_CODE" -eq 0 ]; then
  echo -e "${BOLD}${CYAN}|  ${GREEN}ALL TESTS PASSED${CYAN}  .  ${WHITE}${PASS_COUNT}/${TOTAL} tests OK${CYAN}                     |${RESET}"
else
  echo -e "${BOLD}${CYAN}|  ${RED}FALLOS: ${FAIL_COUNT}${CYAN}  .  ${GREEN}OK: ${PASS_COUNT}/${TOTAL}${CYAN}                           |${RESET}"
fi
echo -e "${BOLD}${CYAN}+========================================================+${RESET}"
echo ""

exit $EXIT_CODE
