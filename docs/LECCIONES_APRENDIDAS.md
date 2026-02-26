# Lecciones Aprendidas — ETH Document Registry

Referencia para proyectos futuros de dApp con Foundry + Next.js + ethers.js.

---

## 1. Smart Contract — Diseño

### No añadir campos redundantes al struct
Un campo `bool exists` junto a `address signer` es redundante: si `signer == address(0)` el documento no existe. Cada campo extra cuesta un slot de storage (~20 000 gas de escritura).

```solidity
// MAL — campo redundante
struct Document {
    bytes32 hash;
    uint256 timestamp;
    address signer;
    bytes signature;
    bool exists;        // redundante
}

// BIEN — existencia inferida del signer
mapping(bytes32 => Document) private documents;
function isStored(bytes32 h) external view returns (bool) {
    return documents[h].signer != address(0);
}
```

### Usar modifiers para guards de existencia
Centraliza la lógica de revert y hace las funciones más legibles:

```solidity
modifier documentNotExists(bytes32 _hash) {
    require(documents[_hash].signer == address(0), "Document already exists");
    _;
}
modifier documentExists(bytes32 _hash) {
    require(documents[_hash].signer != address(0), "Document does not exist");
    _;
}
```

### Exponer siempre funciones de iteración
Sin `getDocumentCount()` + `getDocumentHashByIndex(i)` el frontend no puede listar documentos sin un indexador externo (subgraph). Añadirlas siempre:

```solidity
bytes32[] private documentHashes;   // push en cada storeDocumentHash

function getDocumentCount() external view returns (uint256) {
    return documentHashes.length;
}
function getDocumentHashByIndex(uint256 index) external view returns (bytes32) {
    require(index < documentHashes.length, "Index out of bounds");
    return documentHashes[index];
}
```

### Activar el optimizer desde el inicio

```toml
# foundry.toml
[profile.default]
optimizer        = true
optimizer_runs   = 200
```

---

## 2. ABI — Sincronización Frontend / Contrato

### El ABI debe seguir el contrato, no al revés
Cada vez que se modifica una función en Solidity (firma, parámetros, valores de retorno) hay que actualizar el ABI en el frontend. Si no se hace, los errores son silenciosos o producen resultados incorrectos.

### Los structs se mapean como `tuple` en el ABI
Una función que retorna un struct en Solidity debe declararse así en el ABI de ethers.js:

```typescript
{
  name: 'getDocumentInfo',
  outputs: [
    {
      type: 'tuple',
      internalType: 'struct DocumentRegistry.Document',
      components: [
        { name: 'hash',      type: 'bytes32'  },
        { name: 'timestamp', type: 'uint256'  },
        { name: 'signer',    type: 'address'  },
        { name: 'signature', type: 'bytes'    },
      ],
    },
  ],
  stateMutability: 'view',
  type: 'function',
}
```

ethers.js v6 expone los campos como propiedades nombradas: `doc.signer`, `doc.timestamp`, etc.

### Funciones `view` vs `nonpayable` importan
- Una función que emite eventos NO puede ser `view`.
- Llamar una función `nonpayable` con ethers.js envía una transacción y devuelve un `ContractTransactionResponse`, no el valor de retorno.
- Para leer el retorno de una función no-view sin gastar gas: usar `contract.functionName.staticCall(...)`.

---

## 3. Flujo de Verificación ECDSA

### No pedir la firma al verificador
La firma ya está almacenada en el contrato. El verificador no necesita volver a firmar nada. El flujo correcto es:

```
1. Calcular hash del archivo
2. isDocumentStored(hash)  →  si false: "no encontrado"
3. getDocumentInfo(hash)   →  leer doc.signer almacenado
4. Comparar doc.signer.toLowerCase() === inputAddress.toLowerCase()
```

Pedir la firma al verificador es un antipatrón: requiere que el usuario tenga la firma original y no aporta seguridad adicional ya que el contrato ya tiene la fuente de verdad.

### Comparar addresses en lowercase
Las direcciones Ethereum pueden venir en checksum (EIP-55) o en minúsculas. Siempre normalizar antes de comparar:

```typescript
const isValid = doc.signer.toLowerCase() === signer.trim().toLowerCase();
```

---

## 4. Frontend — ethers.js v6

### JsonRpcProvider en lugar de BrowserProvider para dev local
Para desarrollo con Anvil no se necesita MetaMask. Usar `JsonRpcProvider` con el mnemónico público de Anvil y derivar wallets por índice:

```typescript
const provider = new ethers.JsonRpcProvider('http://localhost:8545');
const wallet = ethers.HDNodeWallet.fromPhrase(mnemonic, undefined, `m/44'/60'/0'/0/${index}`);
```

### BigInt en ethers.js v6
Los valores `uint256` retornan `bigint` en ethers.js v6 (no `BigNumber`). Convertir explícitamente:

```typescript
const count = Number(await contract.getDocumentCount());  // bigint → number
const ts    = Number(info.timestamp);                     // bigint → number
```

### Gestionar el hook de `useCallback` con dependencias estables
En hooks de contrato, pasar el tipo de hash o cualquier parámetro variable directamente como argumento a la función en lugar de capturarlo del closure, para evitar recreaciones innecesarias:

```typescript
// MAL — hashType capturado del closure, se recrea en cada cambio
const processFile = useCallback(async (file) => { /* usa hashType */ }, [hashType]);

// BIEN — hashType pasado como argumento, dependencias estables
const processFile = useCallback(async (file, type) => { /* usa type */ }, [calculateHash]);
```

---

## 5. Dark Mode en Next.js

### Anti-FOUC obligatorio
Sin el script inline en `<head>`, la página parpadea al cargar (flash of unstyled content). La solución es inyectar un script síncrono que aplica la clase `dark` antes de que React hidrate:

```tsx
// layout.tsx
const themeScript = `
(function() {
  try {
    const t = localStorage.getItem('theme');
    const d = t ? t === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (d) document.documentElement.classList.add('dark');
  } catch(e) {}
})();
`;

<html suppressHydrationWarning>
  <head>
    <script dangerouslySetInnerHTML={{ __html: themeScript }} />
  </head>
```

`suppressHydrationWarning` en `<html>` es necesario porque React detecta que el servidor no tiene la clase `dark` pero el cliente sí.

### Usar `darkMode: 'class'` en Tailwind

```typescript
// tailwind.config.ts
const config: Config = {
  darkMode: 'class',   // activa las variantes dark:
  // ...
}
```

---

## 6. CSV — Exportación correcta (RFC 4180)

Los campos que contienen comas (fechas con hora, hashes, firmas) deben ir entre comillas dobles. Las comillas dobles internas se escapan duplicándolas:

```typescript
const escape = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
const csv = [header, ...rows].map(row => row.map(escape).join(',')).join('\n');
```

---

## 7. Dev Tooling

### Script de arranque único (`start.sh`)
En proyectos con múltiples procesos (nodo local + deploy + frontend) es muy útil tener un script que:
- Mata instancias previas del proceso
- Espera a que cada servicio esté listo antes de continuar (polling con `curl`)
- Extrae datos del deploy (dirección del contrato) y actualiza archivos de configuración
- Limpia al salir con `trap cleanup SIGINT SIGTERM`

### Scripts `.sh` creados desde Windows siempre tienen CRLF
Cualquier archivo `.sh` escrito por una herramienta Windows (VSCode, Claude Code, etc.) tiene terminaciones CRLF. WSL y bash nativo los rechazan con errores como `$'\r': command not found` o `syntax error near unexpected token`. Solución inmediata:

```bash
sed -i 's/\r//' archivo.sh
```

Hacerlo siempre después de crear un `.sh` en Windows antes de ejecutarlo en WSL.

### Compatibilidad WSL / Git Bash / nativo
En entornos Windows hay diferencias entre shells:
- `lsof` no existe → usar `taskkill.exe /IM proceso.exe /F`
- `node` puede no estar en PATH de WSL → detectar `node.exe` como fallback
- `npm` puede ser `npm.cmd` en Git Bash → detectar múltiples variantes
- Los archivos `.sh` creados en Windows tienen CRLF → usar `sed -i 's/\r//'` o escribir con heredoc

### Script de test con descripción humana
`forge test` solo muestra nombres de función. Añadir un script que mapea nombres a descripciones legibles y muestra gas por test ayuda a entender la suite:

```bash
declare -A TEST_DESC
TEST_DESC["testStoreAndVerify"]="Happy path completo"
TEST_DESC["testCannotStoreTwice"]="Duplicado rechazado"
# ...
```

---

## 8. Gestión de Git en proyectos con submodulos

### Submodulos vs dependencias anidadas
OpenZeppelin como submodulo (`forge install`) crea una carpeta `lib/` con su propio `.git`. Si se clona un proyecto existente sin `--recurse-submodules`, la carpeta aparece vacía.

```bash
# Clonar con submodulos
git clone --recurse-submodules <url>

# Si ya clonaste sin submodulos
git submodule update --init --recursive
```

### Nunca commitear `contracts/.git` por error
Si `contracts/` fue un repo independiente antes de integrarse al monorepo, borrar su `.git` antes del primer commit:

```bash
rm -rf contracts/.git
```

### .gitignore para proyectos Foundry + Next.js
Ignorar siempre:
- `contracts/cache/`, `contracts/out/` (artefactos de compilación)
- `broadcast/*/31337/` (deploys locales — no tienen valor permanente)
- `dapp/node_modules/`, `dapp/.next/`
- `*.log`

Mantener:
- `dapp/.env.local` si solo contiene datos públicos de Anvil (mnemónico estándar)
- `.gitmodules` (necesario para que los submodulos funcionen al clonar)

---

## 9. Animaciones con CSS puro en Next.js / Tailwind

Para animaciones de entrada simples (fade + slide), una keyframe en `globals.css` es suficiente sin instalar librerías:

```css
@keyframes fadeSlideIn {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}
.animate-tab-in {
  animation: fadeSlideIn 0.2s ease-out both;
}
```

Forzar la animación al cambiar de tab: `key={activeTab}` en el contenedor hace que React desmonte y remonte el elemento, disparando la animación en cada cambio.

---

## 10. Meta-Transacciones ERC-2771 (P02)

### EIP-712: firma de datos estructurados
La firma de meta-transacciones usa `signer.signTypedData(domain, types, value)` en ethers.js v6. El dominio debe coincidir **exactamente** con el constructor del contrato `EIP712`:

```typescript
const domain = {
  name: 'MinimalForwarder',
  version: '1',
  chainId: 31337,
  verifyingContract: FORWARDER_ADDRESS,
};
```

Si el nombre, versión o chainId no coinciden, `verify()` en el contrato retorna `false`.

### ERC-2771: no usar `msg.sender` en contratos destino
En contratos que reciben meta-transacciones, siempre usar `_msgSender()` (de `ERC2771Context`), nunca `msg.sender`. El `msg.sender` es la dirección del relayer, no del usuario que firmó.

### OZ v5: los overrides de ERC2771Context ya no son necesarios
En OpenZeppelin v5, `ERC2771Context` implementa `_msgSender()`, `_msgData()` y `_contextSuffixLength()` como finales desde la perspectiva del contrato hijo. Si el contrato solo hereda de `ERC2771Context` y `ReentrancyGuard`, **no hay que redefinirlos**.

### OZ v5 requiere Solidity ^0.8.24
OpenZeppelin v5 (`EIP712.sol`) usa `^0.8.24`. Actualizar `solc_version` en `foundry.toml` y todos los pragmas si se instala OZ v5.

### Relayer server-side: la clave privada nunca llega al cliente
El endpoint `/api/relay` (Next.js API Route) usa `process.env.RELAYER_PRIVATE_KEY` que solo existe en el servidor. El cliente solo envía la request firmada y la firma EIP-712.

### Serializar bigint antes de hacer fetch
Los campos `uint256` de ethers.js son `bigint`. `JSON.stringify` no serializa `bigint` nativamente. Convertir a string antes de enviar al relayer:

```typescript
body: JSON.stringify({
  request: {
    value: req.value.toString(),
    gas:   req.gas.toString(),
    nonce: req.nonce.toString(),
    // ...
  }
})
```

### Daemon de ejecución: API Route + polling client-side
Para ejecutar propuestas aprobadas automáticamente en desarrollo local: API Route `GET /api/daemon` que escanea propuestas y ejecuta las elegibles, invocado cada 30s con `setInterval` en el cliente. En producción usar Vercel Cron.

### Extraer dos direcciones del broadcast de forge
Cuando un script despliega múltiples contratos, los logs de `console.log` son la forma más fiable de extraer las direcciones:

```bash
FORWARDER=$(echo "$DEPLOY_OUT" | grep "MinimalForwarder:" | grep -oE '0x[a-fA-F0-9]{40}')
DAO=$(echo       "$DEPLOY_OUT" | grep "DAOVoting:"        | grep -oE '0x[a-fA-F0-9]{40}')
```

---

## 11. P03 — E-Commerce Blockchain (EuroToken + Stripe + 4 apps)

### Arquitectura multi-contrato con dependencias circulares
Cuando los contratos se necesitan mutuamente (ProductCatalog ↔ PaymentGateway, ShoppingCart ↔ InvoiceSystem), usar el patrón de "conexión post-deploy":

```solidity
// Desplegar primero, conectar después
ProductCatalog productCat = new ProductCatalog(address(companyReg));
PaymentGateway gateway    = new PaymentGateway(euroToken, address(invoiceSys), address(productCat));
productCat.setPaymentGateway(address(gateway));   // conectar al final
```

Cada contrato que acepta direcciones externas en post-deploy necesita un guard de acceso (`onlyOwner`) y solo permite llamarlo una vez.

### Tests de integración multi-contrato: usar MockERC20 local
Si los tests de `sc-ecommerce` importaran `EuroToken` desde `stablecoin/sc/`, crearían una dependencia entre proyectos Foundry. Solución: definir un `MockEuroToken` local en el archivo de test:

```solidity
contract MockEuroToken is ERC20 {
    constructor() ERC20("MockEURO", "MEURT") {}
    function decimals() public pure override returns (uint8) { return 6; }
    function mint(address to, uint256 amount) external { _mint(to, amount); }
}
```

### forge script en Windows: usar `cd` en lugar de `--root`
El flag `--root /unix/path` de `forge script` no funciona con binarios `.exe` de forge en Windows bajo Git Bash. El binario espera paths estilo Windows (`D:\...`) pero Git Bash pasa paths Unix (`/d/...`). El error resultante es genérico e ilegible:

```
Error: contract source info format must be `<path>:<contractname>` or `<contractname>`
```

**Solución:** Cambiar de directorio antes de invocar forge:

```bash
# MAL — incompatible con Windows
forge script script/Deploy.s.sol --root /d/proyecto/stablecoin/sc

# BIEN — funciona en Windows y Linux/Mac
(cd /d/proyecto/stablecoin/sc && forge script script/Deploy.s.sol ...)
```

### pkill no mata procesos `.exe` nativos en Windows
`pkill -f "anvil"` envía SIGTERM al proceso. Los `.exe` Windows (anvil.exe, node.exe) no siempre responden a SIGTERM desde Git Bash. El proceso sigue corriendo invisiblemente y los deploys acumulan estado en el mismo Anvil, desplazando las addresses de los contratos.

**Síntoma:** el `.env.local` dice `EuroToken: 0x5FbDB...` pero en esa dirección hay `CompanyRegistry` de una ejecución anterior.

**Solución:** usar `taskkill` antes de `pkill`:

```bash
if command -v taskkill &>/dev/null; then
  taskkill //F //IM anvil.exe //T 2>/dev/null || true
  taskkill //F //IM node.exe  //T 2>/dev/null || true
fi
pkill -f "anvil" 2>/dev/null || true
```

Nota: en Git Bash, `//F` se pasa al ejecutable Windows como `/F`.

### Limpiar caches de broadcast antes de cada restart
`forge script --broadcast` guarda el resultado en `broadcast/Deploy.s.sol/31337/run-latest.json`. Si Anvil se reinicia (nonce vuelve a 0) pero el cache persiste, forge intenta reconciliar estado viejo con el nuevo nodo y puede fallar o desplegar en addresses incorrectas.

**Solución:** borrar antes de cada deploy:

```bash
rm -rf "$SCRIPT_DIR/stablecoin/sc/broadcast"
rm -rf "$SCRIPT_DIR/stablecoin/sc/cache"
rm -rf "$SCRIPT_DIR/sc-ecommerce/broadcast"
rm -rf "$SCRIPT_DIR/sc-ecommerce/cache"
```

### `set -euo pipefail` + captura de output oculta errores de forge
Con `set -e`, si `forge script` falla dentro de `$()`, bash sale inmediatamente sin mostrar el error capturado:

```bash
# MAL — bash sale silenciosamente si forge falla
EURO_OUTPUT=$(forge script ... 2>&1)
```

**Solución:** exponer el output capturado al fallar:

```bash
EURO_OUTPUT=$(forge script ... 2>&1) \
  || { echo "$EURO_OUTPUT"; err "Forge falló al desplegar."; }
```

### Mintear EURT directamente para pruebas (sin Stripe)
Para probar el flujo de e-commerce sin claves Stripe, mintear directamente con `cast send`:

```bash
cast send "$EURO_TOKEN" "mint(address,uint256)" "$CUSTOMER" 5000000000 \
  --rpc-url "http://localhost:8545" \
  --private-key "$DEPLOYER_KEY"
# 5000000000 = 5000 EURT (6 decimals)
```

---

## 12. Checklist para el próximo proyecto dApp

- [ ] Diseñar el contrato antes de codificarlo — identificar structs, mappings, eventos, funciones view
- [ ] Verificar que no haya campos redundantes en structs
- [ ] Exponer funciones de iteración (`count` + `byIndex`) desde el día 1
- [ ] Activar optimizer en `foundry.toml` desde el inicio
- [ ] Escribir tests antes de integrar con el frontend
- [ ] Mantener el ABI del frontend en sync con el contrato tras cada cambio
- [ ] Usar `staticCall` para funciones no-view cuando solo se necesita leer el retorno
- [ ] Implementar el script `start.sh` desde el inicio del proyecto
- [ ] Añadir el script anti-FOUC en `layout.tsx` si hay dark mode
- [ ] Escapar campos CSV con comillas dobles (RFC 4180)
- [ ] Probar en WSL y en Git Bash nativo si el proyecto se usa en Windows
