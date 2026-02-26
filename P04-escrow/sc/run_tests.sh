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

# addToken
TEST_DESC["testAddToken_ByOwner"]="[01/13] [TOKEN]       Owner agrega token y queda permitido"
TEST_DESC["testAddToken_NotOwner"]="[02/13] [TOKEN]       No-owner no puede agregar token"
TEST_DESC["testAddToken_Duplicate"]="[03/13] [TOKEN]       Agregar token duplicado revierte"

# createOperation
TEST_DESC["testCreateOperation_HappyPath"]="[04/13] [CREATE]      Crear operación deposita tokenA en contrato"
TEST_DESC["testCreateOperation_TokenNotAllowed"]="[05/13] [CREATE]      Token no permitido revierte"
TEST_DESC["testCreateOperation_InsufficientAllowance"]="[06/13] [CREATE]      Sin approve el create revierte"

# completeOperation
TEST_DESC["testCompleteOperation_HappyPath"]="[07/13] [COMPLETE]    Swap atómico: tokenA→completer, tokenB→creador"
TEST_DESC["testCompleteOperation_OwnOperation"]="[08/13] [COMPLETE]    Creador no puede completar su propia operación"
TEST_DESC["testCompleteOperation_InactiveOperation"]="[09/13] [COMPLETE]    Completar operación inactiva revierte"

# cancelOperation
TEST_DESC["testCancelOperation_ByCreator"]="[10/13] [CANCEL]      Creador cancela y recupera tokenA"
TEST_DESC["testCancelOperation_NotCreator"]="[11/13] [CANCEL]      No-creador no puede cancelar"

# getAllOperations
TEST_DESC["testGetAllOperations_Multiple"]="[12/13] [VIEW]        getAllOperations devuelve todas las operaciones"
TEST_DESC["testGetAllOperations_EmptyArray"]="[13/13] [VIEW]        getAllOperations devuelve array vacío sin operaciones"

# ─── Header ──────────────────────────────────────────────────────────────────

echo ""
echo -e "${BOLD}${CYAN}+========================================================+"
echo -e "|   Escrow DApp  .  Test Runner                         |"
echo -e "|   Solidity 0.8.24  .  Ownable  .  ReentrancyGuard    |"
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

OUTPUT=$("$FORGE" test -vvv --match-contract EscrowTest 2>&1)
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
