# P04 — Escrow DApp

DApp para intercambio seguro de tokens ERC20. Usuario A deposita TokenA y solicita
TokenB; Usuario B acepta el intercambio aportando TokenB y recibiendo TokenA. El
creador puede cancelar en cualquier momento y recuperar sus tokens.

## Arranque rápido

```bash
cd P04-escrow
bash start.sh
```

El script:
1. Inicia Anvil en `http://localhost:8545`
2. Despliega `Escrow`, `TokenA (TKA)` y `TokenB (TKB)`
3. Agrega ambos tokens al contrato y mintea 1 000 de cada uno a las cuentas de prueba
4. Actualiza `web/.env.local` automáticamente
5. Lanza la app en `http://localhost:3000`

## Flujo de uso

| Paso | Quién | Acción |
|------|-------|--------|
| 1 | Owner (Acct #0) | Conectar MetaMask → agregar tokens permitidos |
| 2 | Usuario 1 | Crear operación: ofrecer TKA, solicitar TKB |
| 3 | Usuario 2 | Cambiar cuenta → completar operación |
| 4 | — | BalanceDebug muestra el intercambio |
| ✗ | Usuario 1 | Cancelar operación (recupera TKA) |

## Estructura

```
P04-escrow/
├── sc/                   ← Solidity + Foundry (Escrow + TestToken)
├── web/                  ← Next.js 15 + ethers.js v6 (puerto 3000)
├── start.sh              ← orquestador
└── docs/
    └── README_ESTUDIANTE.md
```

## Tecnologías

- Solidity 0.8.24 · Foundry · OpenZeppelin v5
- Next.js 15 · TypeScript · ethers.js v6 · Tailwind CSS v4
- MetaMask · Anvil (chainId 31337)
