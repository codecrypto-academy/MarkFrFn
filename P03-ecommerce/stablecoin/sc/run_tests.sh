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

# Deploy
TEST_DESC["testDeploy_Name"]="[01/19] [DEPLOY]      Nombre del token es 'EuroToken'"
TEST_DESC["testDeploy_Symbol"]="[02/19] [DEPLOY]      Símbolo del token es 'EURT'"
TEST_DESC["testDeploy_Decimals"]="[03/19] [DEPLOY]      Decimales son 6 (stablecoin)"
TEST_DESC["testDeploy_Owner"]="[04/19] [DEPLOY]      Owner inicial es el deployer"
TEST_DESC["testDeploy_InitialSupplyZero"]="[05/19] [DEPLOY]      Supply inicial es cero"

# Mint
TEST_DESC["testMint_ByOwner_UpdatesBalance"]="[06/19] [MINT]        Owner acuña y balance se actualiza"
TEST_DESC["testMint_ByOwner_UpdatesTotalSupply"]="[07/19] [MINT]        Supply total se incrementa correctamente"
TEST_DESC["testMint_EmitsMintedEvent"]="[08/19] [MINT]        Evento Minted emitido correctamente"
TEST_DESC["testMint_ByNonOwner_Reverts"]="[09/19] [MINT]        No-owner no puede acuñar"
TEST_DESC["testMint_ToZeroAddress_Reverts"]="[10/19] [MINT]        Acuñar a address(0) revierte"
TEST_DESC["testMint_ZeroAmount_Reverts"]="[11/19] [MINT]        Acuñar cantidad cero revierte"

# Transfer
TEST_DESC["testTransfer_BetweenAccounts"]="[12/19] [TRANSFER]    Transferencia entre cuentas actualiza balances"
TEST_DESC["testTransferFrom_WithApproval"]="[13/19] [TRANSFER]    transferFrom con approve correcto funciona"
TEST_DESC["testTransfer_InsufficientBalance_Reverts"]="[14/19] [TRANSFER]    Transferir más del balance revierte"

# Ownership
TEST_DESC["testTransferOwnership"]="[15/19] [OWNERSHIP]   Transferir ownership actualiza owner"
TEST_DESC["testTransferOwnership_ByNonOwner_Reverts"]="[16/19] [OWNERSHIP]   No-owner no puede transferir ownership"
TEST_DESC["testTransferOwnership_ToZeroAddress_Reverts"]="[17/19] [OWNERSHIP]   Transferir ownership a address(0) revierte"
TEST_DESC["testNewOwner_CanMint"]="[18/19] [OWNERSHIP]   Nuevo owner puede acuñar"
TEST_DESC["testOldOwner_CannotMintAfterTransfer"]="[19/19] [OWNERSHIP]   Ex-owner no puede acuñar tras transferir"

# ─── Header ──────────────────────────────────────────────────────────────────

echo ""
echo -e "${BOLD}${CYAN}+========================================================+"
echo -e "|   EuroToken (EURT)  .  Test Runner                   |"
echo -e "|   Solidity 0.8.24  .  ERC20  .  6 decimals           |"
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

OUTPUT=$("$FORGE" test -vvv --match-contract EuroTokenTest 2>&1)
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
