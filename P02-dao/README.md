# DAO Voting — Gasless (ERC-2771)

dApp de Organización Autónoma Descentralizada con votación sin gas, usando meta-transacciones ERC-2771 y un relayer server-side.

## Stack

| Capa | Tecnología |
|------|-----------|
| Smart Contracts | Solidity 0.8.24, Foundry, OpenZeppelin v5 (ERC2771Context, ReentrancyGuard, EIP712) |
| Frontend | Next.js 15, TypeScript, ethers.js v6, Tailwind CSS |
| Relayer | Next.js API Route (server-side, paga el gas) |
| Red local | Anvil (Foundry) |

## Estructura del proyecto

```
P02-dao/
├── start.sh                        # Script para arrancar todo el stack de desarrollo
├── foundry.toml                    # Configuración Foundry raíz
├── sc/                             # Smart contracts (Foundry)
│   ├── src/
│   │   ├── MinimalForwarder.sol    # Forwarder EIP-712 con nonces anti-replay
│   │   └── DAOVoting.sol           # DAO con ERC2771Context (votación gasless)
│   ├── test/
│   │   └── DAOVoting.t.sol         # 27 tests (fondos, propuestas, votación, ejecución)
│   ├── script/
│   │   └── Deploy.s.sol            # Despliega Forwarder + DAO
│   ├── foundry.toml
│   └── run_tests.sh                # Script con descripciones legibles por test
├── web/                            # Frontend (Next.js 15)
│   ├── app/
│   │   ├── page.tsx                # Página principal con tabs (Fondear / Propuesta / Votar)
│   │   ├── layout.tsx
│   │   └── api/
│   │       ├── relay/route.ts      # Relayer: recibe meta-tx firmada, paga el gas
│   │       └── daemon/route.ts     # Daemon: ejecuta propuestas aprobadas cada 30s
│   ├── components/
│   │   ├── ConnectWallet.tsx       # Conexión MetaMask + validación chainId
│   │   ├── FundingPanel.tsx        # Depositar ETH al DAO
│   │   ├── CreateProposal.tsx      # Crear propuesta (gasless via EIP-712)
│   │   ├── ProposalList.tsx        # Lista de propuestas con skeleton loader
│   │   ├── ProposalCard.tsx        # Card con estado, votos y deadline
│   │   └── VoteButtons.tsx         # FOR / AGAINST / ABSTAIN (gasless)
│   ├── contexts/
│   │   └── WalletContext.tsx       # Estado global de MetaMask
│   ├── hooks/
│   │   └── useContract.ts          # Hooks de lectura: balances, propuestas, votos
│   └── lib/
│       ├── abi.ts                  # ABIs de DAOVoting y MinimalForwarder
│       ├── contracts.ts            # Factories y constantes de contratos
│       └── metaTx.ts               # buildMetaTxRequest / signMetaTxRequest
└── docs/                           # Documentación
    ├── GUIA_DE_USO.md
    ├── GUION_VIDEO.md
    ├── META_TRANSACCIONES.md
    └── TAREA PARA ESTUDIANTE.md
```

## Requisitos

- Node.js v18+
- [Foundry](https://book.getfoundry.sh/getting-started/installation)
- MetaMask (extensión de navegador)
- Git

```bash
# Verificar
node --version   # v18+
forge --version  # forge 0.2+
```

## Instalación

```bash
# 1. Instalar dependencias del frontend
cd web && npm install && cd ..

# 2. Instalar dependencias de los contratos (OpenZeppelin)
cd sc && forge install && cd ..
```

## Uso

### Opción A — Script todo-en-uno (recomendado)

Un único comando arranca Anvil, despliega ambos contratos y lanza el frontend:

```bash
bash start.sh
```

El script:
1. Verifica que `forge`, `anvil` y `node`/`npm` estén disponibles
2. Mata instancias previas de Anvil y arranca uno nuevo en `http://localhost:8545`
3. Despliega `MinimalForwarder` y `DAOVoting`, actualiza `web/.env.local` con las direcciones
4. Arranca el frontend en `http://localhost:3000`

Presiona `Ctrl+C` para detener todos los servicios.

### Opción B — Pasos manuales

```bash
# Terminal 1 — red local
anvil

# Terminal 2 — desplegar contratos
cd sc
forge script script/Deploy.s.sol \
  --rpc-url http://localhost:8545 \
  --broadcast \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

# Actualizar web/.env.local con las direcciones impresas por el script

# Terminal 3 — frontend
cd web && npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000)

## Flujo de uso

1. **Conectar wallet** — MetaMask con red Anvil Local (chainId 31337) y una cuenta de prueba
2. **Fondear DAO** — depositar ETH en el contrato (única operación que requiere gas)
3. **Crear propuesta** — firmar con MetaMask (EIP-712, sin gas); el relayer ejecuta
4. **Votar** — FOR / AGAINST / ABSTAIN (gasless, solo firma); requiere balance > 0 en el DAO
5. **Ejecución automática** — el daemon revisa cada 30s; ejecuta propuestas con deadline pasado y más votos a favor que en contra

## Funcionalidades de UI

| Feature | Descripción |
|---------|-------------|
| Gasless voting | MetaMask solo pide firma, no transacción; el relayer paga el gas |
| Daemon automático | Propuestas aprobadas se ejecutan solas tras el deadline |
| Barra de participación | Muestra el % del balance del DAO que tiene el usuario conectado |
| VoteBar | Barra visual con porcentaje FOR / AGAINST / ABSTAIN por colores |
| Skeleton loader | Animación mientras se cargan las propuestas desde blockchain |
| Notificación | Banner cuando el daemon ejecuta una propuesta |
| Validación de red | Bloquea conexión si MetaMask no está en chainId 31337 |

## Tests del contrato

```bash
cd sc

# Ejecutar los 27 tests con descripciones legibles
bash run_tests.sh

# Comandos directos de forge
forge test -vv              # tests con logs
forge coverage              # cobertura de código
forge build                 # compilar
```

### Suite de tests (27/27)

| Categoría | Tests |
|-----------|-------|
| Fondos (3) | Depósito, tracking de balance, fondear vía receive() |
| Propuestas (6) | Creación normal, gasless, validaciones de acceso y fondos |
| Votación (8) | FOR/AGAINST/ABSTAIN, cambio de voto, votación gasless, doble voto, sin balance |
| Ejecución (5) | Ejecución normal, gasless, deadline no pasado, propuesta rechazada, fondos insuficientes |
| Forwarder (5) | Nonce correcto, replay attack, firma inválida, ejecución a contrato, nonce post-ejecución |

## Arquitectura de meta-transacciones

```
Usuario (MetaMask)
    │  firma EIP-712 (sin gas)
    ▼
/api/relay  (Next.js API Route — servidor)
    │  RELAYER_PRIVATE_KEY paga el gas
    ▼
MinimalForwarder.execute(req, sig)
    │  verifica firma + nonce, añade `from` al calldata
    ▼
DAOVoting.vote() / createProposal()
    │  _msgSender() == usuario original (no el relayer)
    ▼
Blockchain Anvil (local)
```

## Variables de entorno

`web/.env.local` (actualizado automáticamente por `start.sh`):

```env
NEXT_PUBLIC_DAO_ADDRESS=0x...           # Dirección del contrato DAOVoting
NEXT_PUBLIC_FORWARDER_ADDRESS=0x...     # Dirección del MinimalForwarder
NEXT_PUBLIC_CHAIN_ID=31337
NEXT_PUBLIC_RPC_URL=http://127.0.0.1:8545
RPC_URL=http://localhost:8545
RELAYER_PRIVATE_KEY=0x59c6...           # Anvil key #1 — solo desarrollo local
RELAYER_ADDRESS=0x7099...
```

> Las claves de Anvil son públicas y conocidas por todos. No usar en mainnet ni testnets reales.

## Reglas del contrato DAO

| Regla | Condición |
|-------|-----------|
| Votar | `userBalance > 0` en el DAO |
| Crear propuesta | `userBalance >= 10%` del balance total |
| Ejecutar propuesta | Deadline pasado + `votesFor > votesAgainst` + fondos suficientes |
| Cambiar voto | Permitido antes del deadline |

---

**Curso**: Desarrollo de dApps con Ethereum — CODECRYPTO
