# GUÍA DE USO — DAO Voting Gasless

**Versión:** 1.0
**Estado:** Completamente Funcional
**Última Actualización:** Febrero 2026

---

## Servicios en Ejecución

### Estado del sistema tras ejecutar `bash start.sh`

```
Anvil Blockchain Local
   └─ Escuchando en: http://127.0.0.1:8545
   └─ Chain ID: 31337
   └─ Cuentas de prueba: 10 disponibles (10,000 ETH c/u)

MinimalForwarder (EIP-712)
   └─ Dirección: 0x5FbDB2315678afecb367f032d93F642f64180aa3
   └─ Rol: recibe meta-transacciones firmadas y las ejecuta

DAOVoting
   └─ Dirección: 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
   └─ Estado: desplegado con balance inicial 0 ETH

dApp Next.js
   └─ Escuchando en: http://localhost:3000
   └─ Relayer activo: /api/relay
   └─ Daemon activo: /api/daemon (polling cada 30s)
```

---

## Configuración de MetaMask (hacer una sola vez)

### 1. Agregar la red Anvil Local

En MetaMask → Agregar red → Agregar red manualmente:

| Campo | Valor |
|-------|-------|
| Nombre de red | `Anvil Local` |
| URL RPC | `http://127.0.0.1:8545` |
| Chain ID | `31337` |
| Símbolo | `ETH` |

### 2. Importar una cuenta de prueba

MetaMask → Importar cuenta → Pegar clave privada:

```
0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a
```

Dirección resultante: `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC` (Anvil #2, 10 000 ETH)

> Estas claves son públicas y conocidas. Son las cuentas de desarrollo estándar de Anvil. Nunca usarlas en mainnet.

---

## Cómo Usar la dApp

### Paso 1 — Arrancar el stack

```bash
cd P02-dao
bash start.sh
```

Abrir el navegador en **http://localhost:3000**

---

### Paso 2 — Conectar MetaMask

1. Asegúrate de que MetaMask está en la red **Anvil Local** (chainId 31337)
2. Haz clic en el botón **"Conectar MetaMask"**
3. Aprueba la conexión en MetaMask
4. Verás tu dirección y balance en el header

Si aparece el mensaje _"Red incorrecta"_, verifica que el Chain ID de tu red sea exactamente `31337`.

---

### Paso 3 — Fondear el DAO (tab "Fondear DAO")

1. Ir al tab **"Fondear DAO"**
2. Introducir la cantidad de ETH a depositar (ej: `1`)
3. Clic en **"Depositar"**
4. MetaMask mostrará una **transacción** (esta sí paga gas — es la única del flujo)
5. Confirmar en MetaMask
6. Tras la confirmación verás:
   - Tu balance en el DAO actualizado
   - El balance total del DAO actualizado
   - La barra de participación muestra tu porcentaje del total

> Para poder crear propuestas necesitas al menos el **10% del balance total del DAO**.
> Si eres el único que ha depositado, tienes el 100% — puedes crear propuestas.

---

### Paso 4 — Crear una Propuesta (tab "Nueva Propuesta")

1. Ir al tab **"Nueva Propuesta"**
2. Rellenar el formulario:

| Campo | Ejemplo |
|-------|---------|
| Dirección del beneficiario | `0x90F79bf6EB2c4f870365E785982E1f101E93b906` (Anvil #3) |
| Monto (ETH) | `0.1` |
| Duración (minutos) | `5` |
| Descripción | `Pago al proveedor de servicios` |

3. Clic en **"Crear Propuesta (Gasless)"**
4. MetaMask mostrará una petición de **firma** (no una transacción — sin gas)
5. Firmar el mensaje
6. El relayer ejecuta la transacción en segundo plano
7. Aparece el mensaje de éxito con el hash de transacción

> La propuesta aparecerá en el tab "Propuestas" tras unos segundos.

---

### Paso 5 — Votar (tab "Propuestas")

1. Ir al tab **"Propuestas"**
2. Localizar la propuesta activa
3. Ver el estado: destinatario, monto, tiempo restante y votos actuales
4. Hacer clic en uno de los tres botones:
   - **A FAVOR** — vota a favor de ejecutar la propuesta
   - **EN CONTRA** — vota en contra
   - **ABSTENCIÓN** — voto neutral
5. MetaMask pedirá una **firma** (sin gas)
6. Firmar el mensaje
7. Los contadores de votos se actualizan

> Puedes cambiar tu voto cuantas veces quieras **antes del deadline**.

---

### Paso 6 — Ejecución automática

El daemon (`/api/daemon`) se activa cada 30 segundos y busca propuestas que cumplan:
- Deadline ya pasado
- Más votos a favor que en contra
- Fondos suficientes en el DAO

Cuando ejecuta una propuesta, aparece un **banner de notificación** en la app y la propuesta pasa a estado **"Ejecutada"**.

El ETH se transfiere automáticamente al beneficiario indicado en la propuesta.

---

## Estados de las Propuestas

| Estado | Condición |
|--------|-----------|
| **Activa** | Dentro del período de votación |
| **Aprobada (pendiente)** | Deadline pasado, más votos a favor — esperando daemon |
| **Rechazada** | Deadline pasado, más votos en contra o empate |
| **Ejecutada** | Fondos transferidos al beneficiario |

---

## Cuentas de Prueba de Anvil

Todas con **10,000 ETH** iniciales:

| # | Dirección | Clave Privada (pública) |
|---|-----------|------------------------|
| 0 | `0xf39Fd6...92266` | `0xac0974...f2ff80` (deployer) |
| 1 | `0x70997...79C8` | `0x59c699...8690d` (relayer) |
| 2 | `0x3C44C...293BC` | `0x5de411...365a` |
| 3 | `0x90F79...b906` | `0x7c8521...c40d` |
| 4 | `0x15d34...6A65` | `0x47e179...53fa` |

Para importar varias cuentas en MetaMask y simular múltiples usuarios, importa las claves del #2 al #4.

---

## Flujo de una Meta-Transacción (gasless)

```
1. Usuario hace clic en "Votar A FAVOR"
        │
        ▼
2. Frontend construye la petición EIP-712
   { from, to, value, gas, nonce, data }
        │
        ▼
3. MetaMask muestra "Firmar mensaje" (no hay gas)
   Usuario aprueba la firma
        │
        ▼
4. Frontend envía { request, signature } a POST /api/relay
        │
        ▼
5. Relayer (servidor) verifica la firma
   Ejecuta MinimalForwarder.execute(request, signature)
   Paga el gas con RELAYER_PRIVATE_KEY
        │
        ▼
6. MinimalForwarder verifica nonce + firma
   Llama a DAOVoting.vote()
   DAOVoting._msgSender() == dirección del usuario (no el relayer)
        │
        ▼
7. Voto registrado en blockchain
   Frontend recibe txHash y actualiza la UI
```

---

## Troubleshooting

### "Red incorrecta. Conecta a chainId 31337"
- Verifica que MetaMask está en la red **Anvil Local**
- Comprueba que el Chain ID de la red es exactamente `31337` (no otro número)
- Si la red muestra otro chainId, edítala o elimínala y agrégala de nuevo

### "MetaMask no detectado"
- Instala la extensión MetaMask en tu navegador
- Recarga la página tras instalarla

### La propuesta no aparece en el listado
- Espera unos segundos y haz clic en el botón de refrescar
- Verifica que la transacción se confirmó (el mensaje de éxito debe mostrar un txHash)

### El daemon no ejecuta la propuesta
- Verifica que el deadline ya pasó
- Verifica que hay más votos a favor que en contra
- Espera hasta el siguiente ciclo de 30 segundos
- Revisa la consola del servidor (Next.js) en busca de errores en `/api/daemon`

### Balance muestra 0 ETH en el DAO
- Es el estado inicial. Ve al tab "Fondear DAO" y deposita ETH primero.

### Error al crear propuesta: "insufficient balance"
- Necesitas al menos el 10% del balance total del DAO
- El formulario muestra el mínimo requerido si no tienes suficiente

---

## Comandos Útiles

```bash
# Ver logs de Anvil
cat /tmp/anvil-p02.log

# Correr tests del contrato
cd sc && bash run_tests.sh

# Ver la consola del servidor (logs del relayer y daemon)
# Se muestran en el terminal donde está corriendo Next.js

# Reiniciar todo desde cero
# Ctrl+C en el terminal con start.sh, luego:
bash start.sh
```

---

## Conceptos Clave

### Meta-Transacción
Una transacción firmada por el usuario pero ejecutada (y pagada) por un tercero (el relayer). El usuario solo firma un mensaje, sin necesitar ETH para gas.

### EIP-712
Estándar de Ethereum para firmar datos estructurados. Garantiza que el usuario ve exactamente qué está firmando (no solo bytes opacos).

### Nonce
Número secuencial por usuario que previene ataques de replay: si alguien intercepta una firma firmada, no puede reutilizarla porque el nonce ya fue consumido.

### ERC-2771
Estándar que permite a un contrato destino identificar al usuario original de una meta-transacción. El contrato usa `_msgSender()` en lugar de `msg.sender`.

### Relayer
Servidor que recibe la meta-transacción firmada y la ejecuta en la blockchain, pagando el gas. En producción puede ser un servicio externo (OpenZeppelin Defender, Gelato) o propio.

---

**Curso**: Desarrollo de dApps con Ethereum — CODECRYPTO
