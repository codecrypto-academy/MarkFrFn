#!/usr/bin/env bash

# Ir al directorio del script sin importar desde donde se ejecute
cd "$(dirname "$0")"

FORGE="$HOME/.foundry/bin/forge"
BOLD="\033[1m"
DIM="\033[2m"
GREEN="\033[0;32m"
RED="\033[0;31m"
CYAN="\033[0;36m"
WHITE="\033[1;37m"
RESET="\033[0m"

declare -A TEST_DESC
TEST_DESC["testStoreAndVerify"]="[1/11] Almacenar y verificar documento correctamente"
TEST_DESC["testCannotStoreTwice"]="[2/11] Rechazar documento duplicado"
TEST_DESC["testVerifyWrongSigner"]="[3/11] Verificar con firmante incorrecto devuelve false"
TEST_DESC["testDocumentCount_StartsAtZero"]="[4/11] Contador empieza en cero"
TEST_DESC["testDocumentCount_AfterStore"]="[5/11] Contador incrementa al almacenar"
TEST_DESC["testGetDocumentHashByIndex"]="[6/11] Obtener hash por indice correctamente"
TEST_DESC["testGetDocumentHashByIndex_OutOfBounds"]="[7/11] Indice fuera de rango revierte"
TEST_DESC["testGetDocumentInfo_Reverts_IfNotStored"]="[8/11] getDocumentInfo revierte si no existe"
TEST_DESC["testIsDocumentStored_ReturnsFalse"]="[9/11] isDocumentStored devuelve false si no existe"
TEST_DESC["testVerifyDocument_ReturnsFalse_IfNotStored"]="[10/11] verifyDocument devuelve false si no existe"
TEST_DESC["testStoreMultipleDocuments"]="[11/11] Multiples documentos con distintas wallets"

echo ""
echo -e "${BOLD}${CYAN}+======================================================+"
echo -e "|       DocumentRegistry  .  Test Runner              |"
echo -e "|       Optimizer: ON  .  optimizer_runs: 200         |"
echo -e "+======================================================+${RESET}"
echo ""

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

OUTPUT=$("$FORGE" test -vvv --match-contract DocumentRegistryTest 2>&1)
EXIT_CODE=$?

echo -e "${BOLD}${WHITE}  Resultados:${RESET}"
echo -e "  ${DIM}------------------------------------------------------${RESET}"

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
      echo -e "        ${DIM}gas usado: $GAS${RESET}"
      PASS_COUNT=$((PASS_COUNT + 1))
    else
      echo -e "  ${RED}FAIL${RESET}  ${RED}$DESC${RESET}"
      echo -e "        ${DIM}gas usado: $GAS${RESET}"
      FAIL_COUNT=$((FAIL_COUNT + 1))
    fi
  fi
done <<< "$OUTPUT"

if [ $FAIL_COUNT -gt 0 ]; then
  echo ""
  echo -e "  ${DIM}------------------------------------------------------${RESET}"
  echo -e "  ${BOLD}${RED}Detalle de fallos:${RESET}"
  echo "$OUTPUT" | grep -A 10 "\[FAIL" | grep -v "^--$" | grep -v "Warning\|note\[" | sed 's/^/    /'
fi

TOTAL=$((PASS_COUNT + FAIL_COUNT))

if [ ${#GAS_MAP[@]} -gt 0 ]; then
  echo ""
  echo -e "  ${DIM}------------------------------------------------------${RESET}"
  echo -e "  ${BOLD}${WHITE}Consumo de gas:${RESET}"
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
    printf "        ${DIM}%-52s %6d gas${RESET}\n" "$func" "$g"
  done
  if [ $TOTAL -gt 0 ]; then
    AVG_GAS=$((TOTAL_GAS / TOTAL))
    echo ""
    printf "        ${DIM}Promedio: %d gas   |   Max: %d gas${RESET}\n" "$AVG_GAS" "$MAX_GAS"
    echo -e "        ${DIM}Test mas costoso: $MAX_FUNC${RESET}"
  fi
fi

echo ""
echo -e "${BOLD}${CYAN}+======================================================+${RESET}"
if [ "$EXIT_CODE" -eq 0 ]; then
  echo -e "${BOLD}${CYAN}|  ${GREEN}ALL TESTS PASSED${CYAN}  .  ${WHITE}${PASS_COUNT}/${TOTAL} tests OK${CYAN}                   |${RESET}"
else
  echo -e "${BOLD}${CYAN}|  ${RED}FALLOS: ${FAIL_COUNT}${CYAN}  .  ${GREEN}OK: ${PASS_COUNT}/${TOTAL}${CYAN}                         |${RESET}"
fi
echo -e "${BOLD}${CYAN}+======================================================+${RESET}"
echo ""

exit $EXIT_CODE
