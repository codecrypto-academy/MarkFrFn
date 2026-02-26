# ETH Document Registry

dApp para almacenar y verificar la autenticidad de documentos en blockchain Ethereum mediante firmas digitales ECDSA.

## Stack

| Capa | Tecnología |
|------|-----------|
| Smart Contract | Solidity 0.8.18, Foundry, OpenZeppelin ECDSA |
| Frontend | Next.js 14, TypeScript, ethers.js v6, Tailwind CSS |
| Red local | Anvil (Foundry) |

## Estructura del proyecto

```
eth-database-document/
├── start.sh                    # Script para arrancar todo el stack de desarrollo
├── contracts/                  # Smart contracts (Foundry)
│   ├── src/
│   │   └── DocumentRegistry.sol
│   ├── test/
│   │   └── DocumentRegistry.t.sol
│   ├── script/
│   │   └── Deploy.s.sol
│   ├── foundry.toml
│   └── run_tests.sh
├── dapp/                       # Frontend (Next.js)
│   ├── app/
│   │   ├── page.tsx            # Página principal con tabs
│   │   ├── layout.tsx
│   │   └── providers.tsx
│   ├── components/
│   │   ├── FileUploader.tsx    # Carga, hash y drag & drop
│   │   ├── DocumentSigner.tsx  # Firma y almacenamiento
│   │   ├── DocumentVerifier.tsx
│   │   ├── DocumentHistory.tsx # Historial on-chain con búsqueda y exportar CSV
│   │   └── WalletSelector.tsx
│   ├── contexts/
│   │   └── MetaMaskContext.tsx # Wallets Anvil via JsonRpcProvider
│   ├── hooks/
│   │   ├── useContract.ts
│   │   ├── useFileHash.ts
│   │   └── useTheme.ts         # Dark mode con persistencia en localStorage
│   └── utils/
│       ├── ethers.ts
│       └── hash.ts
└── docs/                       # Documentación adicional
    ├── DEPLOYMENT_GUIDE.md
    ├── GUIA_DE_USO.md
    ├── QUICK_START.md
    └── LECCIONES_APRENDIDAS.md
```

## Requisitos

- Node.js v18+
- [Foundry](https://book.getfoundry.sh/getting-started/installation)
- Git

```bash
# Verificar
node --version   # v18+
forge --version  # forge 0.2+
```

## Instalación

```bash
# 1. Clonar con submodulos (OpenZeppelin)
git clone --recurse-submodules <url-del-repo>
cd eth-database-document

# 2. Instalar dependencias del frontend
cd dapp && npm install && cd ..
```

## Uso

### Opción A — Script todo-en-uno (recomendado)

Un único comando arranca Anvil, despliega el contrato y lanza el frontend:

```bash
bash start.sh
```

El script:
1. Verifica que `forge`, `anvil` y `node`/`npm` estén disponibles
2. Inicia Anvil en `http://localhost:8545`
3. Despliega `DocumentRegistry` y actualiza `dapp/.env.local` con la dirección
4. Arranca el frontend en `http://localhost:3000`

Presiona `Ctrl+C` para detener todos los servicios.

### Opción B — Pasos manuales

```bash
# Terminal 1 — red local
anvil

# Terminal 2 — desplegar contrato
cd contracts
forge script script/Deploy.s.sol \
  --rpc-url http://localhost:8545 \
  --broadcast \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

# Copiar la dirección del contrato y actualizar dapp/.env.local:
# NEXT_PUBLIC_CONTRACT_ADDRESS=0x<dirección>

# Terminal 3 — frontend
cd dapp && npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000)

## Flujo de uso

1. **Conectar wallet** — seleccionar una de las 10 wallets de Anvil
2. **Upload & Sign** — subir un archivo (click o drag & drop), firmar su hash keccak256
3. **Store** — almacenar hash + firma + timestamp en blockchain
4. **Verify** — subir el mismo archivo, ingresar la dirección del firmante; el frontend consulta `isDocumentStored()` + `getDocumentInfo()` y compara el firmante almacenado
5. **History** — consulta `getDocumentCount()` + `getDocumentHashByIndex(i)` + `getDocumentInfo(hash)` para listar todos los documentos directamente desde la blockchain (hash, firmante, timestamp, firma truncada), ordenados del más reciente al más antiguo

## Funcionalidades de UI

| Feature | Descripción |
|---------|-------------|
| Drag & Drop | Arrastrar archivos directamente al área de carga |
| Dark mode | Toggle sol/luna en el header; persiste en `localStorage`; anti-FOUC |
| Animaciones | Fade + slide al cambiar de tab y al mostrar resultados |
| Exportar CSV | Botón en History descarga todos los documentos (RFC 4180) |
| Búsqueda | Filtro en tiempo real por hash o dirección del firmante |
| Skeleton loader | Filas animadas mientras History carga desde blockchain |

## Tests del contrato

```bash
cd contracts

# Ejecutar los 11 tests con reporte detallado
bash run_tests.sh

# Comandos directos de forge
forge test -vv              # tests con logs
forge coverage              # cobertura de codigo
forge build                 # compilar
```

### Suite de tests (11/11)

| # | Test | Caso |
|---|------|------|
| 1 | `testStoreAndVerify` | Happy path completo |
| 2 | `testCannotStoreTwice` | Duplicado rechazado |
| 3 | `testVerifyWrongSigner` | Firmante incorrecto → false |
| 4 | `testDocumentCount_StartsAtZero` | Contador inicial en 0 |
| 5 | `testDocumentCount_AfterStore` | Contador incrementa |
| 6 | `testGetDocumentHashByIndex` | Iteración por índice |
| 7 | `testGetDocumentHashByIndex_OutOfBounds` | Índice inválido revierte |
| 8 | `testGetDocumentInfo_Reverts_IfNotStored` | Info doc inexistente revierte |
| 9 | `testIsDocumentStored_ReturnsFalse` | Doc inexistente → false |
| 10 | `testVerifyDocument_ReturnsFalse_IfNotStored` | Verificar inexistente → false |
| 11 | `testStoreMultipleDocuments` | Multi-wallet, conteo e iteración |

## Variables de entorno

`dapp/.env.local`:

```env
NEXT_PUBLIC_CONTRACT_ADDRESS=0x...   # Actualizado automáticamente por start.sh
NEXT_PUBLIC_RPC_URL=http://localhost:8545
NEXT_PUBLIC_CHAIN_ID=31337
NEXT_PUBLIC_MNEMONIC="test test test test test test test test test test test junk"
```

> Las wallets de Anvil usan el mnemonic público estándar. No usar en mainnet.

## Optimizaciones del contrato

- Sin campo `bool exists` redundante — existencia verificada via `signer != address(0)`
- Sin mapping `hashExists` separado
- Modifiers `documentNotExists` / `documentExists` para guards reutilizables
- Optimizer habilitado (`optimizer_runs = 200`)
- Ahorro estimado: ~39% en gas de almacenamiento respecto al diseño naive

---

**Curso**: Desarrollo de dApps con Ethereum — CODECRYPTO
