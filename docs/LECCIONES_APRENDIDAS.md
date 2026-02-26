# Lecciones Aprendidas — CodeCrypto-MarkFrFn

Patrones y antipatrones acumulados de todas las prácticas.

---

## Organización de archivos

### Convención de Markdown en el monorepo
- **Solo `README.md` en la raíz de cada práctica**
- Todos los demás `.md` van en `docs/` dentro de la práctica
- Usar `git mv` (no `mv`) para mover archivos y preservar historial git
- Archivos de la raíz del monorepo: `CLAUDE.md`, `README.md`, `docs/LECCIONES_APRENDIDAS.md`

---

## Foundry / Solidity

### Versiones y configuración (patrón común P02-P04)
```toml
solc_version = "0.8.24"
optimizer = true
optimizer_runs = 200
remappings = ["@openzeppelin/=lib/openzeppelin-contracts/", "forge-std/=lib/forge-std/src/"]
```

### OpenZeppelin v5 — cambios importantes
- `Ownable` requiere pasar `msg.sender` al constructor: `Ownable(msg.sender)`
- `ERC2771Context`: **no** redefinir `_msgSender()/_msgData()/_contextSuffixLength()` en contratos hijos
- Usar siempre `_msgSender()` (nunca `msg.sender`) en contratos destino ERC-2771

### Custom errors vs require strings
- Preferir `error TokenNotAllowed(address token)` + `revert TokenNotAllowed(token)` sobre `require(cond, "msg")`
- Ventaja: menos gas, mejor DX en el frontend (selector 4 bytes identificable)

### forge install en Windows
- Usar `forge.exe` en lugar de `forge` si está en `~/.foundry/bin/`
- El flag `--no-commit` falla en algunos contextos → omitirlo
- `forge script --legacy` necesario para Anvil (no soporta EIP-1559 por defecto)

### Broadcast cache conflicts
- Borrar `broadcast/` y `cache/` antes de cada deploy fresco en Anvil reiniciado
- Añadir `rm -rf broadcast/ cache/` en `start.sh` antes del script de deploy

---

## Frontend (Next.js 15 + ethers.js v6)

### WalletContext — patrón establecido
```typescript
// Auto-conectar silenciosamente (sin popup) si MetaMask ya autorizó
useEffect(() => {
  if (!window.ethereum) return;
  (async () => {
    const accounts = await window.ethereum.request({ method: 'eth_accounts' });
    if (accounts.length === 0) return;
    const bp = new ethers.BrowserProvider(window.ethereum);
    const network = await bp.getNetwork();
    if (Number(network.chainId) !== CHAIN_ID) return;
    const s = await bp.getSigner();
    setSigner(s); setAddress(await s.getAddress());
  })();
}, []);

// Reaccionar a cambios de cuenta
useEffect(() => {
  if (!window.ethereum) return;
  const h = (accounts: string[]) => { if (accounts.length === 0) disconnect(); else connect(); };
  window.ethereum.on('accountsChanged', h);
  return () => window.ethereum.removeListener('accountsChanged', h);
}, [disconnect, connect]);
```

### Hydration errors
- Añadir `suppressHydrationWarning` en `<html>` del layout.tsx
- Las extensiones de browser modifican el DOM antes de React

### bigint en JSON
- `JSON.stringify` no serializa `bigint` → convertir con `.toString()` antes

### ERC20 approve antes de transferFrom
- Siempre hacer `token.approve(contractAddr, amount)` antes de cualquier `transferFrom`
- En el frontend: primero `approve` → esperar confirmación → luego la operación

---

## Scripts de arranque (start.sh)

### Patrón establecido
1. `trap cleanup EXIT INT TERM` — matar todos los hijos al salir
2. Verificar dependencias (forge, anvil, node, npm) con fallbacks para `.exe`
3. `taskkill //F //IM anvil.exe` + `pkill -f anvil` — matar Anvil previo (Windows + Linux)
4. `rm -rf broadcast/ cache/` — evitar conflictos de deploy
5. `forge script ... --legacy` — necesario para Anvil
6. Extraer addresses con `grep -oE "0x[0-9a-fA-F]{40}"` de stdout de forge
7. Escribir `.env.local` automáticamente
8. `npm install` solo si no hay `node_modules/`
9. `npm run dev &` en background, guardar PID en `CHILD_PIDS`

### Windows — problemas recurrentes
- CRLF en `.sh`: añadir `.gitattributes` con `*.sh text eol=lf`
- `node.exe` y `npm.cmd`: detectar como fallbacks cuando `node`/`npm` no están en PATH
- `pkill` no mata `.exe`: añadir `taskkill //F //IM nombre.exe //T` también
- Puerto ocupado: `lsof -ti:XXXX | xargs kill -9` o `netstat` en Windows

---

## Patrones de contrato por práctica

### P01 — Document Registry
- Verificar existencia via `signer != address(0)` (sin `bool exists` redundante)
- Modifiers `documentNotExists` / `documentExists` para guards reutilizables

### P02 — DAO Voting Gasless
- EIP-712 domain debe coincidir exactamente entre contrato y frontend
- Relayer server-side con `RELAYER_PRIVATE_KEY` en API route de Next.js

### P03 — E-Commerce con EuroToken
- Múltiples contratos: desplegar en orden de dependencias
- `setPaymentGateway()` / `setInvoiceSystem()` para conectar contratos post-deploy
- `EcommerceMain` como punto de entrada único (guarda todas las addresses)
- Stripe webhook: usar IP de host Windows (`172.25.64.1`) desde WSL2
- Auto-payment (mismo address como company y customer) → net balance = 0

### P04 — Escrow DApp
- Patrón escrow: `transferFrom(creator, contract, amountA)` en createOperation
- `completeOperation`: `transferFrom(completer, creator, amountB)` + `transfer(completer, amountA)`
- `cancelOperation`: `transfer(creator, amountA)` → recupera tokens depositados
- `nonReentrant` en complete y cancel (ambas hacen transfers ERC20)
- `getAllOperations()`: iterar desde índice 1 (operaciones empiezan en 1, no en 0)

---

## Debugging

### Decodificar custom errors
```bash
cast keccak "NombreError()"          # obtener selector 4 bytes
cast keccak "NombreError(address)"   # con parámetros
```

### Leer estado del contrato
```bash
cast call $ADDR "funcion()(returnType)" --rpc-url http://localhost:8545
```

### Verificar balance ERC20
```bash
cast call $TOKEN "balanceOf(address)(uint256)" $ADDR --rpc-url http://localhost:8545
```
