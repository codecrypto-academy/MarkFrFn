# Guión del Video — DAO Voting Gasless (ERC-2771)

Presentación del proyecto para el curso de Desarrollo de dApps con Ethereum — CODECRYPTO.

**Formato**: PPT + Demo en vivo + Tests y documentación
**Duración estimada**: 15-18 minutos

---

## Bloque 1 — Contexto y arquitectura (PPT) · ~5 min

### Diapositiva 1 — Portada
- Nombre del proyecto: **DAO Voting Gasless**
- Curso, fecha, nombre del estudiante
- Nota: _"Desarrollado con asistencia de IA (Claude Code) bajo supervisión del autor"_

### Diapositiva 2 — ¿Qué problema resuelve?
- Las votaciones en DAO requieren gas → barrera de entrada para usuarios nuevos
- Meta-transacciones (ERC-2771) permiten votar **sin ETH**: el relayer paga el gas
- La firma EIP-712 garantiza que el usuario aprueba exactamente lo que firma
- El contrato DAOVoting identifica al usuario original aunque la tx la envíe el relayer

### Diapositiva 3 — Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Smart Contracts | Solidity 0.8.24, Foundry, OpenZeppelin v5 |
| Frontend | Next.js 15, TypeScript, ethers.js v6, Tailwind CSS |
| Relayer | Next.js API Route server-side |
| Red local | Anvil (Foundry) |

### Diapositiva 4 — Arquitectura del sistema

```
Usuario (MetaMask)           Servidor (Next.js)         Blockchain (Anvil)
       │                            │                          │
       │  1. Firma EIP-712          │                          │
       │     (sin gas)              │                          │
       ├──────────────────────────► │                          │
       │                            │  2. execute(req, sig)    │
       │                            │     RELAYER paga gas     │
       │                            ├─────────────────────────►│
       │                            │                          │
       │                            │  3. DAOVoting._msgSender()│
       │                            │     == usuario original  │
       │                            │                          │
       │  4. txHash (éxito)         │                          │
       │◄───────────────────────────┤                          │
```

### Diapositiva 5 — Decisiones de diseño de los contratos

**MinimalForwarder:**
- Implementa EIP-712 para firmas estructuradas tipadas
- Nonces por usuario para prevenir ataques de replay
- `verify()` + `execute()` — el relayer solo puede ejecutar transacciones válidas

**DAOVoting:**
- Hereda de `ERC2771Context` (OpenZeppelin v5)
- Usa `_msgSender()` en lugar de `msg.sender` en todas partes
- Reglas: 10% de balance mínimo para crear propuestas, balance > 0 para votar
- `ReentrancyGuard` en `executeProposal` protege contra reentrada

Punto a destacar: en OZ v5 ya **no es necesario** redefinir `_msgSender()` ni `_msgData()` en el contrato hijo.

### Diapositiva 6 — Proceso de desarrollo asistido por IA
- **Rol del estudiante**: decisiones de diseño, validación del flujo gasless, pruebas manuales en el browser
- **Rol de Claude Code**: generación de código, detección de bugs de compilación, documentación, scripts
- Mencionar los bugs encontrados (ver Bloque 2)

---

## Bloque 2 — Demo en vivo · ~8 min

Seguir este guión exacto en pantalla:

### Paso 1 — Arrancar el stack
```bash
bash start.sh
```
Mostrar en terminal:
- Anvil iniciando en `http://localhost:8545`
- MinimalForwarder y DAOVoting desplegándose
- `.env.local` actualizado con ambas direcciones
- Frontend arrancando en `http://localhost:3000`

_"Un solo comando arranca Anvil, despliega dos contratos y lanza el frontend"_

---

### Paso 2 — Conectar MetaMask
- Abrir `http://localhost:3000`
- Mostrar el mensaje "Red incorrecta" al estar en mainnet → ilustra la validación de chainId
- Cambiar a red **Anvil Local** (chainId 31337)
- Clic en **"Conectar MetaMask"**
- Mostrar la dirección y balance en el header

---

### Paso 3 — Fondear el DAO
- Ir al tab **"Fondear DAO"**
- Ingresar `1` ETH
- Clic en **"Depositar"**
- MetaMask abre confirmación de **transacción** (con gas)
- Confirmar
- Mostrar que el balance del DAO sube a 1 ETH y la barra de participación al 100%

_"Esta es la única operación que requiere gas. El resto del flujo es totalmente gasless."_

---

### Paso 4 — Crear propuesta (gasless)
- Ir al tab **"Nueva Propuesta"**
- Rellenar formulario:
  - Destinatario: `0x90F79bf6EB2c4f870365E785982E1f101E93b906` (Anvil #3)
  - Monto: `0.1` ETH
  - Duración: `3` minutos
  - Descripción: `Pago al proveedor de servicios`
- Clic en **"Crear Propuesta (Gasless)"**
- MetaMask abre solicitud de **firma** (no transacción — sin confirmación de gas)
- Firmar el mensaje
- Mostrar el mensaje de éxito con txHash

_"MetaMask solo pide una firma. El relayer en el servidor construye y envía la transacción pagando el gas."_

---

### Paso 5 — Votar (gasless)
- Ir al tab **"Propuestas"**
- Ver la propuesta con estado **Activa**
- Clic en **"A FAVOR"**
- MetaMask pide **firma** (sin gas)
- Firmar
- Ver el contador de votos actualizarse

_"Mismo patrón: firma off-chain, relayer ejecuta on-chain."_

---

### Paso 6 — Ejecución automática del daemon
- Esperar los 3 minutos del deadline
- El daemon (polling cada 30s) detecta la propuesta aprobada
- Aparece el **banner de notificación** en la app
- La propuesta pasa a estado **"Ejecutada"**
- Opcional: mostrar en MetaMask que la cuenta Anvil #3 recibió 0.1 ETH

---

### Los bugs encontrados durante el desarrollo (mencionar aquí)

> _"Durante el desarrollo, la IA detectó varios bugs que requieren comprensión semántica de Ethereum:"_

**Bug 1 — Overrides de ERC2771Context innecesarios en OZ v5**
```solidity
// MAL — OZ v5 no tiene Context como clase base directa del hijo
function _msgSender() internal view override(Context, ERC2771Context) returns (address) {
    return ERC2771Context._msgSender();
}

// CORRECTO en OZ v5 — no redefinir nada; ERC2771Context ya lo maneja
contract DAOVoting is ERC2771Context, ReentrancyGuard { ... }
```

**Bug 2 — Clave privada inválida en tests**
```solidity
// MAL — 0xRELAY no es hexadecimal válido
uint256 relayerKey = 0xRELAY;

// CORRECTO
uint256 relayerKey = 0xBEEF;
```

**Bug 3 — CRLF en scripts bash**
Scripts creados en Windows tenían terminaciones `\r\n` → WSL los rechazaba con `$'\r': command not found`.
Solución: `sed -i 's/\r//' archivo.sh`

---

## Bloque 3 — Tests y documentación · ~3 min

### Tests del contrato
```bash
cd sc && bash run_tests.sh
```
Mostrar:
- Los **27 tests en verde**, agrupados por categoría
- Gas por cada test
- Resumen final: 5 categorías cubriendo el flujo completo

### Arquitectura del test de votación gasless
Mostrar en el IDE el helper `_buildAndSign()` de `DAOVoting.t.sol`:
```solidity
function _buildAndSign(
    uint256 signerKey,
    address to,
    bytes memory data
) internal view returns (MinimalForwarder.ForwardRequest memory req, bytes memory sig)
```
_"Los tests reproducen exactamente el mismo flujo EIP-712 que el frontend. Garantiza que si los tests pasan, el flujo de usuario funciona."_

### Documentación generada
Abrir en el IDE o explorador:

1. **README.md** — arquitectura, flujo de meta-transacciones, tabla de reglas del DAO
2. **docs/GUIA_DE_USO.md** — paso a paso con cuentas de prueba y troubleshooting
3. **docs/META_TRANSACCIONES.md** — explicación teórica del patrón ERC-2771

### Cierre
Reflexión sobre el flujo humano-IA:
> _"El valor del asistente fue mayor en la capa de integración: detectar que OZ v5 cambió cómo funciona ERC2771Context respecto a versiones anteriores, o que los bigint de ethers.js v6 no se serializan con JSON.stringify. Son errores que pasan desapercibidos en revisión de código pero rompen el sistema en runtime."_

---

## Recomendaciones técnicas para grabar

| Aspecto | Recomendación |
|---------|--------------|
| Herramienta | OBS Studio (gratuito) o Loom |
| Resolución | 1920×1080 mínimo |
| Terminal | Fuente grande (18-20 pt), tema oscuro |
| Browser | Zoom al 110%, sin extensiones visibles (desactivarlas o usar perfil limpio) |
| MetaMask | Usar la cuenta Anvil #2 importada previamente |
| PPT | Máximo 6 diapositivas, fondo oscuro o neutro |
| Duración total | 15-18 minutos |

---

## Orden de ventanas sugerido

```
1. PPT en pantalla completa           → Bloque 1
2. Terminal (start.sh)                → inicio del Bloque 2
3. Browser (localhost:3000)           → pasos 2-6 del Bloque 2
4. Terminal (run_tests.sh)            → inicio del Bloque 3
5. IDE / explorador de archivos       → documentación, cierre Bloque 3
```
