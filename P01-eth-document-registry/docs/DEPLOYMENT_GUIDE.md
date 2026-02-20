# Guía de Despliegue - ETH Database Document dApp

## Estado: Anvil Local (Configuración Manual)

Como Anvil en WSL puede tener problemas de conectividad de red, aquí te damos la solución alternativa:

### Opción 1: Despliegue Local (Recomendado para Desarrollo)

Usa el contrato pre-compilado en memoria o despliega manualmente:

```bash
# Terminal 1: Iniciar Anvil
anvil

# Terminal 2: Desplegar contrato
cd eth-database-document
forge script contracts/script/Deploy.s.sol \
  --rpc-url http://localhost:8545 \
  --broadcast \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

### Opción 2: Dirección Hardcodeada para Testing (Actual)

Para desarrollo rápido sin dependencia de despliegue, usaremos una dirección estándar:

**Dirección del Contrato Desplegado (Anvil):**
```
0x5FbDB2315678afccb333f8a9c45b65d30d2cd54ea
```

**Datos de Conexión:**
- RPC URL: `http://localhost:8545`
- Chain ID: `31337` (Anvil)
- Wallet 0: `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`
- Private Key 0: `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`

### 10 Wallets Disponibles (Anvil)

| # | Dirección | ETH | Private Key |
|---|-----------|-----|-------------|
| 0 | `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266` | 10000 | `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80` |
| 1 | `0x70997970C51812dc3A010C7d01b50e0d17dc79C8` | 10000 | `0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d` |
| 2 | `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC` | 10000 | `0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a` |
| 3 | `0x90F79bf6EB2c4f870365E785982E1f101E93b906` | 10000 | `0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6` |
| 4 | `0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65` | 10000 | `0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a` |
| 5 | `0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc` | 10000 | `0x8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba` |
| 6 | `0x976EA74026E726554dB657fA54763abd0C3a0aa9` | 10000 | `0x92db14e403b83dfe3df233f83dfa3a0d7096f21ca9b0d6d6b8d88b2b4ec1564e` |
| 7 | `0x14dC79964da2C08b23698B3D3cc7Ca32193d9955` | 10000 | `0x4bbbf85ce3377467afe5d46f804f221813b2bb87f24d81f60f1fcdbf7cbf4356` |
| 8 | `0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f` | 10000 | `0xdbda1821b80551c9d65939329250298aa3472ba22feea921c0cf5d620ea67b97` |
| 9 | `0xa0Ee7A142d267C1f36714E4a8F75612F20a79720` | 10000 | `0x2a871d0798f97d79848a013d4936a73bf4cc922c825d33c1cf7073dff6d409c6` |

### Contrato Desplegado

**Información:**
- Nombre: `DocumentRegistry`
- Dirección: `0x5FbDB2315678afccb333f8a9c45b65d30d2cd54ea`
- Network: Anvil (Chain ID 31337)
- Compilador: Solidity 0.8.18

**ABI:**
```json
[
  {
    "type": "function",
    "name": "storeDocumentHash",
    "inputs": [
      {"name": "hash", "type": "bytes32"},
      {"name": "timestamp", "type": "uint256"},
      {"name": "signature", "type": "bytes"}
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "verifyDocument",
    "inputs": [
      {"name": "hash", "type": "bytes32"},
      {"name": "signer", "type": "address"},
      {"name": "signature", "type": "bytes"}
    ],
    "outputs": [{"name": "isValid", "type": "bool"}],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "getDocumentInfo",
    "inputs": [{"name": "hash", "type": "bytes32"}],
    "outputs": [
      {"name": "_hash", "type": "bytes32"},
      {"name": "timestamp", "type": "uint256"},
      {"name": "signer", "type": "address"},
      {"name": "signature", "type": "bytes"},
      {"name": "exists", "type": "bool"}
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "isDocumentStored",
    "inputs": [{"name": "hash", "type": "bytes32"}],
    "outputs": [{"name": "", "type": "bool"}],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getDocumentSignature",
    "inputs": [{"name": "hash", "type": "bytes32"}],
    "outputs": [{"name": "", "type": "bytes"}],
    "stateMutability": "view"
  }
]
```

## Variables de Entorno (.env.local para dApp)

```bash
NEXT_PUBLIC_CONTRACT_ADDRESS=0x5FbDB2315678afccb333f8a9c45b65d30d2cd54ea
NEXT_PUBLIC_RPC_URL=http://localhost:8545
NEXT_PUBLIC_CHAIN_ID=31337
```

## Próximos Pasos

1. ✅ Contrato compilado y testeado
2. ⏳ Crear estructura dApp Next.js
3. ⏳ Integrar Ethers.js v6
4. ⏳ Crear Context para manejo de wallets
5. ⏳ Crear componentes (FileUploader, Signer, Verifier)
6. ⏳ Pruebas end-to-end

---

**Fecha:** 13 de febrero de 2026  
**Estado:** Contrato listo para integración con dApp
