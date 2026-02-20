#!/usr/bin/env bash

# Ejecutar siempre desde la carpeta del script
cd "$(dirname "$0")"

FORGE="$HOME/.foundry/bin/forge"
BOLD="\033[1m"
DIM="\033[2m"
GREEN="\033[0;32m"
RED="\033[0;31m"
CYAN="\033[0;36m"
YELLOW="\033[0;33m"
WHITE="\033[1;37m"
RESET="\033[0m"

# ─── Descripciones legibles por grupo ───────────────────────────────────────

declare -A TEST_DESC

# Fondos
TEST_DESC["testFundDAO_UpdatesBalances"]="[01/27] [FONDOS]      Depositar ETH actualiza balances de usuario y total"
TEST_DESC["testFundDAO_MultipleUsers"]="[02/27] [FONDOS]      Multiples usuarios depositan correctamente"
TEST_DESC["testFundDAO_RejectsZeroValue"]="[03/27] [FONDOS]      Deposito de 0 ETH es rechazado"

# Creacion de propuestas
TEST_DESC["testCreateProposal_HappyPath"]="[04/27] [PROPUESTA]   Happy path: crear propuesta exitosamente"
TEST_DESC["testCreateProposal_InsufficientBalance_Reverts"]="[05/27] [PROPUESTA]   Balance < 10% del DAO revierte"
TEST_DESC["testCreateProposal_NoFunds_Reverts"]="[06/27] [PROPUESTA]   DAO sin fondos revierte"
TEST_DESC["testCreateProposal_InvalidRecipient_Reverts"]="[07/27] [PROPUESTA]   Destinatario address(0) revierte"
TEST_DESC["testCreateProposal_PastDeadline_Reverts"]="[08/27] [PROPUESTA]   Deadline en el pasado revierte"
TEST_DESC["testCreateProposal_Gasless"]="[09/27] [PROPUESTA]   Creacion gasless via meta-transaccion (ERC-2771)"

# Votacion
TEST_DESC["testVote_For"]="[10/27] [VOTACION]    Votar A FAVOR registra correctamente"
TEST_DESC["testVote_Against"]="[11/27] [VOTACION]    Votar EN CONTRA registra correctamente"
TEST_DESC["testVote_Abstain"]="[12/27] [VOTACION]    Votar ABSTENCION registra correctamente"
TEST_DESC["testVote_ChangeVote"]="[13/27] [VOTACION]    Cambiar voto antes del deadline"
TEST_DESC["testVote_AfterDeadline_Reverts"]="[14/27] [VOTACION]    Votar despues del deadline revierte"
TEST_DESC["testVote_NoBalance_Reverts"]="[15/27] [VOTACION]    Sin balance no puede votar"
TEST_DESC["testVote_ProposalNotExist_Reverts"]="[16/27] [VOTACION]    Propuesta inexistente revierte"
TEST_DESC["testVote_Gasless"]="[17/27] [VOTACION]    Votacion gasless via meta-transaccion (ERC-2771)"

# Ejecucion
TEST_DESC["testExecuteProposal_Approved"]="[18/27] [EJECUCION]   Propuesta aprobada transfiere fondos"
TEST_DESC["testExecuteProposal_NotApproved_Reverts"]="[19/27] [EJECUCION]   Propuesta no aprobada revierte"
TEST_DESC["testExecuteProposal_BeforeDeadline_Reverts"]="[20/27] [EJECUCION]   Ejecutar antes del deadline revierte"
TEST_DESC["testExecuteProposal_AlreadyExecuted_Reverts"]="[21/27] [EJECUCION]   Doble ejecucion revierte"
TEST_DESC["testExecuteProposal_NonExistent_Reverts"]="[22/27] [EJECUCION]   Propuesta inexistente revierte"

# Forwarder
TEST_DESC["testForwarder_NonceStartsAtZero"]="[23/27] [FORWARDER]  Nonce inicial es cero"
TEST_DESC["testForwarder_NonceIncrements"]="[24/27] [FORWARDER]  Nonce incrementa tras ejecutar meta-tx"
TEST_DESC["testForwarder_InvalidSignature_Reverts"]="[25/27] [FORWARDER]  Firma invalida revierte"
TEST_DESC["testForwarder_Verify_ValidSignature"]="[26/27] [FORWARDER]  verify() retorna true con firma correcta"
TEST_DESC["testForwarder_Verify_WrongNonce_ReturnsFalse"]="[27/27] [FORWARDER]  verify() retorna false con nonce incorrecto"

# ─── Header ─────────────────────────────────────────────────────────────────

echo ""
echo -e "${BOLD}${CYAN}+========================================================+"
echo -e "|   DAO Voting + MinimalForwarder  .  Test Runner       |"
echo -e "|   Solidity 0.8.24  .  OpenZeppelin v5  .  ERC-2771   |"
echo -e "+========================================================+${RESET}"
echo ""

# ─── Compilacion ────────────────────────────────────────────────────────────

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

# ─── Ejecucion de tests ─────────────────────────────────────────────────────

OUTPUT=$("$FORGE" test -vvv --match-contract DAOVotingTest 2>&1)
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

# ─── Detalle de fallos ───────────────────────────────────────────────────────

if [ $FAIL_COUNT -gt 0 ]; then
  echo ""
  echo -e "  ${DIM}--------------------------------------------------------${RESET}"
  echo -e "  ${BOLD}${RED}Detalle de fallos:${RESET}"
  echo "$OUTPUT" | grep -A 10 "\[FAIL" | grep -v "^--$" | grep -v "Warning\|note\[" | sed 's/^/    /'
fi

TOTAL=$((PASS_COUNT + FAIL_COUNT))

# ─── Resumen de gas ─────────────────────────────────────────────────────────

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

# ─── Footer ──────────────────────────────────────────────────────────────────

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
