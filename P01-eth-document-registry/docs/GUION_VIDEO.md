# Guión del Video — ETH Document Registry

Presentación del proyecto para el curso de Desarrollo de dApps con Ethereum — CODECRYPTO.

**Formato**: PPT + Demo en vivo + Tests y documentación
**Duración estimada**: 15-18 minutos

---

## Bloque 1 — Contexto y arquitectura (PPT) · ~5 min

### Diapositiva 1 — Portada
- Nombre del proyecto: **ETH Document Registry**
- Curso, fecha, nombre del estudiante
- Nota: _"Desarrollado con asistencia de IA (Claude Code) bajo supervisión del autor"_

### Diapositiva 2 — ¿Qué problema resuelve?
- Autenticidad de documentos sin servidor central
- Inmutabilidad: una vez almacenado, no se puede modificar
- Trazabilidad: registro permanente de quién firmó y cuándo
- Criptografía ECDSA para firmas digitales

### Diapositiva 3 — Stack tecnológico
Tabla del proyecto:

| Capa | Tecnología |
|------|-----------|
| Smart Contract | Solidity 0.8.18, Foundry, OpenZeppelin ECDSA |
| Frontend | Next.js 14, TypeScript, ethers.js v6, Tailwind CSS |
| Red local | Anvil (Foundry) |

Diagrama de flujo simple:
```
Browser → Next.js → ethers.js → Anvil → Smart Contract
```

### Diapositiva 4 — Optimizaciones del contrato
Mostrar la comparación antes / después:

```solidity
// ANTES — campo redundante, gasta un slot de storage extra
struct Document {
    bytes32 hash;
    uint256 timestamp;
    address signer;
    bytes signature;
    bool exists;        // ← redundante, ~39% más de gas
}

// DESPUÉS — existencia inferida del signer
struct Document {
    bytes32 hash;
    uint256 timestamp;
    address signer;
    bytes signature;
}
// documents[hash].signer != address(0)  ← comprobación de existencia
```

Puntos clave a mencionar:
- Modifiers `documentNotExists` / `documentExists` centralizan los guards
- Optimizer habilitado (`optimizer_runs = 200`)
- Ahorro estimado: **~39% en gas de almacenamiento**

### Diapositiva 5 — Proceso de desarrollo asistido por IA
- **Rol del estudiante**: supervisión, decisiones de diseño, pruebas manuales, validación de resultados, correcciones de rumbo
- **Rol de Claude Code**: generación de código, detección de bugs, documentación, scripts de automatización
- Mencionar que el asistente detectó **dos bugs críticos** que se describen en el bloque de demo

---

## Bloque 2 — Demo en vivo · ~8 min

Seguir este guión exacto en pantalla:

### Paso 1 — Arrancar el stack
```bash
bash start.sh
```
Mostrar en terminal:
- Anvil iniciando en `http://localhost:8545`
- Contrato desplegándose automáticamente
- `.env.local` actualizado con la dirección del contrato
- Frontend arrancando en `http://localhost:3000`

_"Un solo comando arranca todo el entorno de desarrollo"_

---

### Paso 2 — Abrir la aplicación
- Abrir `http://localhost:3000`
- Activar **dark mode** con el toggle del header
- Volver a light mode

---

### Paso 3 — Conectar wallet
- Click en el selector de wallet
- Seleccionar **Wallet 0**
- Mostrar que el banner cambia a "✅ Wallet connected"

---

### Paso 4 — Subir y firmar documento (tab "Upload & Sign")
- Arrastrar un archivo al área de carga (**drag & drop**)
- Mostrar el hash keccak256 calculado automáticamente
- Click en **Sign Document** → confirmar el alert con el hash
- Mostrar la firma generada
- Click en **Store on Blockchain** → confirmar → mostrar el transaction hash

---

### Paso 5 — Historial (tab "History")
- Cambiar al tab History → mostrar animación de transición
- El documento aparece cargado directamente desde la blockchain
- Usar el **input de búsqueda** filtrando por los primeros caracteres del hash
- Click en **CSV** → abrir el archivo descargado y mostrar los campos

---

### Paso 6 — Verificar (tab "Verify") · tres casos

**Caso 1 — Documento válido**
- Subir el mismo archivo
- Pegar la dirección de Wallet 0
- Click en Verify → resultado **✅ válido**

**Caso 2 — Firmante incorrecto**
- Mismo archivo
- Pegar la dirección de Wallet 1 (diferente al firmante)
- Click en Verify → resultado **❌ signer mismatch**

**Caso 3 — Documento no registrado**
- Subir un archivo diferente (nunca almacenado)
- Cualquier dirección
- Click en Verify → **"Document not found on blockchain"**

---

### Los dos bugs críticos detectados por la IA (mencionar aquí)

> _"Durante el desarrollo, la IA detectó dos bugs que pasaban desapercibidos a simple vista:"_

**Bug 1 — Verificación siempre devolvía ❌**
El componente pasaba `'0x'` como firma al contrato:
```typescript
// MAL — siempre falla porque ECDSA.recover('0x') = address(0)
const isValid = await verifyDocument(hash, signer, '0x');

// CORRECTO — consultar la blockchain directamente
const stored = await isDocumentStored(hash);
const doc    = await getDocumentInfo(hash);
const isValid = doc.signer.toLowerCase() === signer.toLowerCase();
```

**Bug 2 — ABI desactualizado**
El ABI de `getDocumentInfo` declaraba 5 campos incluyendo `bool exists`, que había sido eliminado del contrato. Error silencioso en runtime.

---

## Bloque 3 — Tests y documentación · ~3 min

### Tests del contrato
```bash
cd contracts && bash run_tests.sh
```
Mostrar:
- Los **11 tests en verde**
- Gas por cada test
- Resumen final del script

### Documentación generada
Abrir en el IDE o explorador de archivos:

1. **README.md** — tabla de funcionalidades, flujo de uso, optimizaciones del contrato
2. **docs/LECCIONES_APRENDIDAS.md** — comentar 2-3 lecciones clave:
   - _"No pedir firma al verificador — la fuente de verdad está en el contrato"_
   - _"Los structs de Solidity son tuples en el ABI de ethers.js"_
   - _"El script anti-FOUC evita el parpadeo al cargar el dark mode"_

### Cierre
Reflexión sobre el flujo humano-IA:
> _"El valor del asistente no fue solo generar código más rápido, sino detectar inconsistencias entre capas — el ABI del frontend no coincidía con el contrato, y la lógica de verificación estaba conceptualmente equivocada. Eso requiere comprensión semántica, no solo sintáctica."_

---

## Recomendaciones técnicas para grabar

| Aspecto | Recomendación |
|---------|--------------|
| Herramienta | OBS Studio (gratuito) o Loom para algo más rápido |
| Resolución | 1920×1080 mínimo |
| Terminal | Fuente grande (18-20 pt), tema oscuro |
| Browser | Zoom al 110%, sin extensiones visibles en la barra |
| PPT | Máximo 6-7 diapositivas, fondo oscuro o neutro |
| Duración total | 15-18 minutos |

---

## Orden de ventanas sugerido

```
1. PPT en pantalla completa        → Bloque 1
2. Terminal (start.sh)             → inicio del Bloque 2
3. Browser (localhost:3000)        → resto del Bloque 2
4. Terminal (run_tests.sh)         → inicio del Bloque 3
5. IDE / explorador de archivos    → documentación, Bloque 3
```
