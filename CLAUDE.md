# CLAUDE.md — Contexto del Proyecto

Este archivo es leído automáticamente por Claude Code al inicio de cada sesión.

---

## Quién eres

Estás asistiendo a **MarkFrFn** con sus prácticas del curso **"Desarrollo de dApps con Ethereum"** de CODECRYPTO Academy.

---

## Estructura del repositorio

Monorepo en `d:/MAFL_Bibliotecas/Documentos/Proyectos/CodeCrypto-MarkFrFn/`

```
CodeCrypto-MarkFrFn/          ← raíz del monorepo (único .git aquí)
├── CLAUDE.md                 ← este archivo
├── README.md
├── docs/
│   └── LECCIONES_APRENDIDAS.md
├── P01-eth-document-registry/
│   ├── contracts/            ← Solidity + Foundry
│   ├── dapp/                 ← Next.js 14 + TypeScript + ethers.js v6
│   ├── foundry.toml
│   └── start.sh
├── P02-dao/
│   ├── sc/                   ← Solidity + Foundry (MinimalForwarder + DAOVoting)
│   ├── web/                  ← Next.js 15 + TypeScript + ethers.js v6
│   ├── foundry.toml
│   └── start.sh
├── P03-ecommerce/
│   ├── stablecoin/           ← EuroToken ERC20 + 2 apps web (puertos 6001, 6002)
│   ├── sc-ecommerce/         ← 6 contratos e-commerce
│   ├── web-admin/            ← Next.js 15 (puerto 6003)
│   ├── web-customer/         ← Next.js 15 (puerto 6004)
│   ├── restart-all.sh
│   └── docs/
└── P04-escrow/
    ├── sc/                   ← Solidity + Foundry (Escrow + TestToken)
    ├── web/                  ← Next.js 15 + TypeScript + ethers.js v6
    ├── start.sh
    └── docs/
```

**Convención de nombres:** `P##-descripcion-del-proyecto` (ej: `P04-escrow`)

---

## Convención de archivos Markdown

- Solo `README.md` en la raíz de cada práctica
- Todos los demás `.md` van en `docs/` dentro de cada práctica
- Usar `git mv` para mover archivos y preservar historial
- Al mover, actualizar los enlaces en `README.md` de la práctica

---

## Decisiones técnicas tomadas

### Git / Monorepo
- Un único `.git` en la raíz — cada práctica es una carpeta, no un subrepositorio.
- Los proyectos se ejecutan de forma independiente desde su propia carpeta.
- Git se gestiona siempre desde la raíz del monorepo.
- **Estrategia de ramas acumulativas**: cada nueva rama se crea desde la rama de la práctica anterior (NO desde `main`), para que acumule todo el contenido del monorepo:
  ```bash
  git checkout practica-03-ecommerce
  git checkout -b practica-04-escrow
  ```
- Así `practica-04-escrow` ya contiene P01 + P02 + P03 + P04 sin necesidad de merges posteriores.

### Foundry (configuración común P02-P04)
```toml
[profile.default]
solc_version = "0.8.24"
optimizer = true
optimizer_runs = 200
remappings = [
    "@openzeppelin/=lib/openzeppelin-contracts/",
    "forge-std/=lib/forge-std/src/"
]
```

### Foundry (P01 — estructura especial)
- El `foundry.toml` raíz de P01 apunta rutas relativas a la carpeta `contracts/`:
  ```toml
  src = "contracts/src"
  out = "out"
  libs = ["contracts/lib"]
  test = "contracts/test"
  script = "contracts/script"
  remappings = ["openzeppelin-contracts/=contracts/lib/openzeppelin-contracts/"]
  ```
- OpenZeppelin instalado como submódulo en `contracts/lib/openzeppelin-contracts/`.

---

## P01 — ETH Document Registry

| Aspecto | Detalle |
|---------|---------|
| Objetivo | dApp para almacenar y verificar autenticidad de documentos en Ethereum mediante firmas ECDSA |
| Smart Contract | `DocumentRegistry.sol` — Solidity 0.8.20, OpenZeppelin ECDSA |
| Frontend | Next.js 14, TypeScript, ethers.js v6, Tailwind CSS |
| Red local | Anvil (Foundry) en `http://localhost:8545`, chain ID 31337 |
| Tests | 11/11 pasando — suite completa en `contracts/test/DocumentRegistry.t.sol` |

### Optimizaciones del contrato
- Existencia verificada via `signer != address(0)` — sin `bool exists` redundante.
- Modifiers `documentNotExists` / `documentExists` para guards reutilizables.
- Optimizer habilitado (`optimizer_runs = 200`). Ahorro estimado ~39% en gas.

### Arrancar P01
```bash
cd P01-eth-document-registry
bash start.sh   # Anvil + deploy + Next.js en un solo comando
```

---

## P02 — DAO Voting Gasless (ERC-2771)

| Aspecto | Detalle |
|---------|---------|
| Objetivo | DAO con votación y meta-transacciones gasless (ERC-2771) |
| Contratos | `MinimalForwarder.sol` (EIP-712, nonces) + `DAOVoting.sol` (ERC2771Context + ReentrancyGuard) |
| Tests | 27/27 pasando |

### Arrancar P02
```bash
cd P02-dao
bash start.sh
```

---

## P03 — E-Commerce Blockchain

| Aspecto | Detalle |
|---------|---------|
| Objetivo | E-commerce con EuroToken (stablecoin ERC20) + Stripe + 4 apps web |
| Contratos | EuroToken + CompanyRegistry + ProductCatalog + ShoppingCart + InvoiceSystem + PaymentGateway + EcommerceMain |
| Apps | :6001 compra tokens · :6002 pasarela pago · :6003 web-admin · :6004 web-customer |
| Script | `restart-all.sh` — orquesta Anvil + 2 deploys + 4 apps + Stripe CLI |

### Arrancar P03
```bash
cd P03-ecommerce
bash restart-all.sh
# Stripe (terminal separado): stripe.exe listen --forward-to localhost:6001/api/webhooks
```

---

## P04 — Escrow DApp

| Aspecto | Detalle |
|---------|---------|
| Objetivo | Swap seguro de tokens ERC20 usando patrón escrow |
| Contratos | `Escrow.sol` (Ownable + ReentrancyGuard) + `TestToken.sol` (ERC20 con mint) |
| Frontend | Next.js 15, puerto 3000, 5 componentes |
| Tests | 13/13 pasando |
| Script | `start.sh` — Anvil + deploy + Next.js |

### Arrancar P04
```bash
cd P04-escrow
bash start.sh
```

---

## Stack común del curso

- **Solidity** + **Foundry** (forge, anvil) + **OpenZeppelin v5** (`^0.8.24`)
- **Next.js 15** + **TypeScript** + **ethers.js v6** para frontends
- **Tailwind CSS v4** para estilos
- **MetaMask** como wallet · **Anvil** como red local (chainId 31337, puerto 8545)
- Patrón `contexts/WalletContext.tsx` para conexión MetaMask (auto-reconnect con `eth_accounts`)

---

## Preferencias de trabajo

- Nombres de carpetas cortos: `P##-descripcion` en lugar de `practica-##-descripcion`.
- Cada práctica tiene su propio `README.md` y `start.sh`.
- Todos los MDs adicionales van en `docs/` dentro de cada práctica.
- Documentación transversal en `docs/LECCIONES_APRENDIDAS.md` en la raíz.

---

## Documentación transversal

- [docs/LECCIONES_APRENDIDAS.md](./docs/LECCIONES_APRENDIDAS.md) — patrones y antipatrones acumulados de todos los proyectos. **Leer antes de iniciar un nuevo proyecto.**

---

## Progreso del curso

| # | Carpeta | Estado |
|---|---------|--------|
| P01 | `P01-eth-document-registry` | Completado |
| P02 | `P02-dao` | Completado |
| P03 | `P03-ecommerce` | Completado |
| P04 | `P04-escrow` | En progreso |

**Al iniciar o completar cada práctica, actualizar:**
1. La tabla de progreso de este archivo (`CLAUDE.md`)
2. El `README.md` raíz — agregar fila en la tabla de prácticas
3. `docs/LECCIONES_APRENDIDAS.md` — añadir nuevos patrones aprendidos
