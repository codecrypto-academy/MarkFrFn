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
└── P02-dao/
    ├── sc/                   ← Solidity + Foundry (MinimalForwarder + DAOVoting)
    ├── web/                  ← Next.js 15 + TypeScript + ethers.js v6
    ├── foundry.toml
    └── start.sh
```

**Convención de nombres:** `P##-descripcion-del-proyecto` (ej: `P01-eth-document-registry`)

---

## Decisiones técnicas tomadas

### Git / Monorepo
- Un único `.git` en la raíz — cada práctica es una carpeta, no un subrepositorio.
- Los proyectos se ejecutan de forma independiente desde su propia carpeta.
- Git se gestiona siempre desde la raíz del monorepo.

### Foundry (P01)
- El `foundry.toml` **raíz de P01** apunta rutas relativas a la carpeta `contracts/`:
  ```toml
  src = "contracts/src"
  out = "out"
  libs = ["contracts/lib"]
  test = "contracts/test"
  script = "contracts/script"
  remappings = ["openzeppelin-contracts/=contracts/lib/openzeppelin-contracts/"]
  ```
- OpenZeppelin instalado como submódulo en `contracts/lib/openzeppelin-contracts/`.
- El `remappings` fue ajustado al migrar al monorepo para que Foundry resuelva correctamente los imports desde la raíz de P01.

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

## Stack común del curso

- **Solidity** + **Foundry** (forge, anvil) para contratos
- **Next.js 14** + **TypeScript** + **ethers.js v6** para frontends
- **Tailwind CSS** para estilos
- **Node.js v18+** requerido

---

## Preferencias de trabajo

- Nombres de carpetas cortos: `P##-descripcion` en lugar de `practica-##-descripcion`.
- Cada práctica tiene su propio `README.md` y `start.sh`.
- Documentación adicional en subcarpeta `docs/` dentro de cada práctica.

---

## Documentación transversal

- [docs/LECCIONES_APRENDIDAS.md](./docs/LECCIONES_APRENDIDAS.md) — patrones y antipatrones acumulados de todos los proyectos. **Leer antes de iniciar un nuevo proyecto.**

---

## Progreso del curso

| # | Carpeta | Estado |
|---|---------|--------|
| P01 | `P01-eth-document-registry` | Completado |
| P02 | `P02-dao` | Completado |
| P03 | — | Pendiente |

**Al iniciar o completar cada práctica, actualizar:**
1. La tabla de progreso de este archivo (`CLAUDE.md`)
2. El `README.md` raíz — agregar fila en la tabla de prácticas
3. `docs/LECCIONES_APRENDIDAS.md` — añadir nuevos patrones aprendidos
