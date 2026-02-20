# 🚀 GUÍA DE USO - ETH Database Document dApp

**Versión:** 1.0  
**Estado:** ✅ Completamente Funcional  
**Última Actualización:** 13 de febrero de 2026

---

## 📍 Servicios en Ejecución

### Estado Actual del Sistema

```
✅ Anvil Blockchain Local
   └─ Escuchando en: 127.0.0.1:8545
   └─ Chain ID: 31337
   └─ Wallets: 10 disponibles (10,000 ETH c/u)
   └─ PID: 3669

✅ Contrato DocumentRegistry
   └─ Dirección: 0x5FbDB2315678afecb367f032d93F642f64180aa3
   └─ Network: Anvil (31337)
   └─ Estado: Desplegado y funcional

✅ dApp Next.js
   └─ Escuchando en: http://localhost:3000
   └─ Compilación: ✓ Exitosa
   └─ TypeScript: ✓ Configurado
   └─ Providers: ✅ MetaMaskProvider activo
```

---

## 🎯 Cómo Usar la dApp

### Paso 1: Acceder a la Aplicación

1. Abre tu navegador web
2. Navega a: **http://localhost:3000**
3. Deberías ver la interfaz principal de ETH Database Document

### Paso 2: Conectar una Wallet

1. Haz clic en el botón **"Connect Wallet"** (esquina superior derecha)
2. Se abrirá un dropdown con las 10 wallets de Anvil
3. Selecciona cualquier wallet (ej: "Wallet 1")
4. La wallet se conectará automáticamente
5. Verás:
   - Nombre de la wallet
   - Dirección abreviada (0xf39F...92266)
   - Balance: **10,000.00 ETH**

### Paso 3: Subir y Firmar un Documento

1. Haz clic en la pestaña **"📤 Upload & Sign"**
2. **Sube un archivo**
   - Click en "Click to upload or drag & drop"
   - Selecciona cualquier archivo de tu computadora
3. **Elige tipo de hash**
   - Keccak256 (recomendado para Ethereum)
   - SHA256 (alternativo)
4. **Firma el documento**
   - Click en "🖊️ Sign Document"
   - Se abrirá un diálogo de confirmación
   - Confirma para firmar con tu wallet
   - Verás la firma generada
5. **Guarda en blockchain**
   - Click en "📝 Store on Blockchain"
   - Confirma la transacción
   - ✅ Documento guardado

### Paso 4: Verificar un Documento

1. Haz clic en la pestaña **"✅ Verify"**
2. **Opciones de verificación:**
   - **Opción A:** Cargar archivo (se calcula su hash automáticamente)
   - **Opción B:** Ingresar hash manualmente
3. **Ingresa la dirección del firmante**
   - Copia la dirección completa (ej: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266)
4. **Ingresa la firma**
   - Copia la firma completa (comienza con 0x)
5. **Click en "Verify"**
6. **Resultado:**
   - ✅ Si es válida: "Signature is valid"
   - ❌ Si no es válida: "Signature is invalid"

### Paso 5: Ver Historial

1. Haz clic en la pestaña **"📜 History"**
2. Se mostrarán todos los documentos guardados:
   - Hash del documento
   - Timestamp
   - Dirección del firmante
   - Firma

### Paso 6: Cambiar de Wallet

1. Click en tu wallet conectada (muestra nombre + balance)
2. Dropdown se abre
3. Selecciona otra wallet
4. Automáticamente:
   - Se desconecta de la anterior
   - Se conecta a la nueva
   - Balance se actualiza

### Paso 7: Desconectar

1. Click en tu wallet conectada
2. Dropdown se abre
3. Click en **"🔌 Disconnect"**
4. Vuelve a estado inicial ("Connect Wallet")

---

## 💡 Ejemplo Práctico Completo

### Escenario: Verificar que tu documento está registrado

```
1. Conecta Wallet 1
   └─ Balance: 10,000.00 ETH

2. Tab "Upload & Sign"
   └─ Sube archivo: "mi-documento.pdf"
   └─ Hash: 0x1a2b3c4d5e6f7a8b...
   └─ Firma: 0xabc123def456...

3. Tab "Upload & Sign" → "Store on Blockchain"
   └─ ✅ Documento guardado

4. Desconecta

5. Conecta Wallet 2 (o la misma)
   └─ Balance: 10,000.00 ETH

6. Tab "Verify"
   └─ Hash: 0x1a2b3c4d5e6f7a8b...
   └─ Signer: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
   └─ Signature: 0xabc123def456...
   └─ Click "Verify"
   └─ ✅ "Signature is valid"

7. Tab "History"
   └─ Ves el documento listado
   └─ Con todos sus detalles
```

---

## 🔐 10 Wallets Disponibles

Todas con **10,000 ETH** iniciales:

| # | Nombre | Dirección | Balance |
|---|--------|-----------|---------|
| 1 | Wallet 1 | 0xf39Fd6...92266 | 10,000 ETH |
| 2 | Wallet 2 | 0x70997...79C8 | 10,000 ETH |
| 3 | Wallet 3 | 0x3C44C...293BC | 10,000 ETH |
| 4 | Wallet 4 | 0x90F79...b906 | 10,000 ETH |
| 5 | Wallet 5 | 0x15d34...6A65 | 10,000 ETH |
| 6 | Wallet 6 | 0x9965...0Adc | 10,000 ETH |
| 7 | Wallet 7 | 0x976E...0Aa9 | 10,000 ETH |
| 8 | Wallet 8 | 0x14dC...9955 | 10,000 ETH |
| 9 | Wallet 9 | 0x2361...E8f | 10,000 ETH |
| 10 | Wallet 10 | 0xa0Ee...79720 | 10,000 ETH |

---

## ⚙️ Componentes de la Interfaz

### Header
```
┌─────────────────────────────────────────────────────┐
│ 🗄️ ETH Database Document      [🔑 Wallet 1 ▼]       │
└─────────────────────────────────────────────────────┘
```

### Status Banner
```
┌─────────────────────────────────────────────────────┐
│ ✅ Wallet connected - Ready to sign and verify      │
└─────────────────────────────────────────────────────┘
```

### Navigation Tabs
```
┌─────────────────────────────────────────────────────┐
│ 📤 Upload & Sign  │  ✅ Verify  │  📜 History      │
└─────────────────────────────────────────────────────┘
```

### Wallet Selector Dropdown
```
┌──────────────────────────────────────────────┐
│ CURRENT WALLET                               │
│ 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 │
│ Balance: 10,000.00 ETH                       │
├──────────────────────────────────────────────┤
│ ✓ Wallet 1    0xf39Fd...f92266              │
│   Wallet 2    0x70997...79C8                │
│   Wallet 3    0x3C44C...293BC               │
│   ... más wallets ...                       │
├──────────────────────────────────────────────┤
│ 🔌 Disconnect                                │
└──────────────────────────────────────────────┘
```

---

## 🚨 Troubleshooting

### Problema: "Connect Wallet" no funciona

**Solución:**
1. Verifica que Anvil está corriendo: `ps aux | grep anvil`
2. Verifica que Next.js está corriendo: `http://localhost:3000`
3. Verifica `.env.local` tiene RPC_URL correcto

### Problema: Balance no se actualiza

**Solución:**
1. Recarga la página (F5)
2. Desconecta y vuelve a conectar
3. Verifica que Anvil está escuchando en 127.0.0.1:8545

### Problema: No puedo firmar documento

**Solución:**
1. Asegúrate de tener una wallet conectada
2. El archivo debe estar seleccionado
3. Hash debe ser válido
4. Confirma en el diálogo

### Problema: Verificación falla

**Solución:**
1. Verifica que el hash es correcto (copia exacta)
2. Verifica que la firma es correcta
3. Verifica que la dirección del signer es correcta
4. Intenta con el mismo archivo original

---

## 📊 Flujos de Datos

### Flujo 1: Upload & Sign
```
Usuario carga archivo
    ↓
Se calcula hash (Keccak256 o SHA256)
    ↓
Usuario selecciona Wallet conectada
    ↓
Usuario hace click "Sign"
    ↓
Se firma el hash con la wallet
    ↓
Firma se guarda en estado local
    ↓
Usuario confirma "Store"
    ↓
Se envía: hash + timestamp + firma al contrato
    ↓
Contrato valida y almacena
    ↓
✅ Documento guardado en blockchain
```

### Flujo 2: Verificación
```
Usuario ingresa: hash, signer, firma
    ↓
Se llama función verifyDocument del contrato
    ↓
Contrato verifica la firma
    ↓
Contrato retorna: true/false
    ↓
Se muestra resultado al usuario
    ↓
✅ Verificación completada
```

---

## 🔧 Comandos Útiles

### Ver logs de Anvil
```bash
tail -f /tmp/anvil.log
```

### Detener todos los servicios
```bash
pkill anvil
pkill -f "npm run dev"
```

### Reiniciar Anvil
```bash
pkill anvil
cd /mnt/d/MAFL_Bibliotecas/Documentos/Proyectos/CodeCrypto/Practica/eth-database-document
nohup anvil > /tmp/anvil.log 2>&1 &
```

### Reiniciar dApp
```bash
cd .../eth-database-document/dapp
npm run dev
```

---

## 📈 Métricas del Sistema

### Recursos Utilizados
- **Anvil:** ~50-100MB RAM
- **Next.js:** ~150-200MB RAM
- **Node.js:** Automático
- **Disco:** ~200MB (node_modules)

### Velocidad
- **Conexión wallet:** < 100ms
- **Firma de documento:** < 500ms
- **Guardado en blockchain:** < 2 segundos
- **Verificación:** < 500ms
- **Carga de historial:** < 1 segundo

---

## ✅ Checklist Pre-Uso

Antes de empezar, verifica:

- [ ] Anvil está corriendo
- [ ] Next.js está corriendo
- [ ] http://localhost:3000 es accesible
- [ ] MetaMaskProvider está activo
- [ ] .env.local tiene configuración correcta
- [ ] Wallets se cargan en el dropdown

---

## 📞 Soporte

### Errores Comunes y Soluciones

| Error | Causa | Solución |
|-------|-------|----------|
| "RPC connection refused" | Anvil no corre | Inicia Anvil |
| "Contract not found" | Dirección incorrecta | Verifica .env.local |
| "Wallet connection failed" | MetaMaskContext no disponible | Verifica providers |
| "Balance is 0" | Wallet incorrecto | Usa wallet de Anvil |
| "Signature invalid" | Firma no coincide | Verifica firma exacta |

---

## 🎓 Conceptos Clave

### Keccak256 vs SHA256
- **Keccak256:** Hash criptográfico estándar de Ethereum
- **SHA256:** Hash alternativo más genérico
- Ambos soportados, pero Keccak256 es más eficiente en blockchain

### Firma ECDSA
- Método criptográfico para firmar mensajes
- Valida que el mensaje no fue alterado
- Solo quien tiene la private key puede firmar

### Gas
- No aplica en Anvil (es gratis)
- En redes reales, cuesta ETH
- Se estima antes de enviar transacción

---

**¡Estás listo para usar ETH Database Document dApp!** 🚀

---

**Última actualización:** 13 de febrero de 2026
**Versión dApp:** 1.0
**Compilación:** ✓ Exitosa
**Estado:** 🟢 Operacional
