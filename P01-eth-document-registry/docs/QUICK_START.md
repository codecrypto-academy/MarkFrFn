# ⚡ QUICK START - Comandos Rápidos

**Proyecto:** ETH Database Document  
**Última Actualización:** 13 de febrero de 2026

---

## 🚀 Iniciar el Sistema Completo

### Opción 1: Inicio Manual (Recomendado para desarrollo)

```bash
# Terminal 1 - Iniciar Anvil
cd /mnt/d/MAFL_Bibliotecas/Documentos/Proyectos/CodeCrypto/Practica/eth-database-document
nohup anvil > /tmp/anvil.log 2>&1 &

# Terminal 2 - Iniciar dApp
cd /mnt/d/MAFL_Bibliotecas/Documentos/Proyectos/CodeCrypto/Practica/eth-database-document/dapp
npm run dev

# Terminal 3 - Opcional: Ver logs de Anvil
tail -f /tmp/anvil.log
```

### Opción 2: Verificación Rápida

```bash
# Verificar Anvil está corriendo
ps aux | grep anvil

# Verificar dApp responde
curl http://localhost:3000

# Verificar RPC está activo
curl -X POST http://127.0.0.1:8545 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}'
```

---

## 🔧 Comandos Útiles

### Anvil

```bash
# Iniciar Anvil en background
cd /mnt/d/.../eth-database-document && \
nohup anvil > /tmp/anvil.log 2>&1 &

# Ver logs
tail -f /tmp/anvil.log

# Detener Anvil
pkill anvil

# Reiniciar Anvil
pkill anvil && \
nohup anvil > /tmp/anvil.log 2>&1 &

# Ver estado del proceso
ps aux | grep anvil | grep -v grep
```

### dApp (Next.js)

```bash
# Instalar dependencias
cd .../eth-database-document/dapp && npm install

# Ejecutar en desarrollo
npm run dev

# Build de producción
npm run build

# Ver output del build
npm run build 2>&1 | tail -20

# Limpiar cache
rm -rf .next node_modules && npm install

# Auditar vulnerabilidades
npm audit

# Arreglar vulnerabilidades
npm audit fix
```

### Contrato (Solidity)

```bash
# Compilar contrato
cd .../eth-database-document && forge build

# Ejecutar tests
forge test -vv

# Deploy en Anvil
forge script contracts/script/Deploy.s.sol \
  --rpc-url http://127.0.0.1:8545 \
  --broadcast \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

# Ver formato de gas
forge test --gas-report
```

---

## 📍 URLs & Endpoints

```
Frontend:       http://localhost:3000
Anvil RPC:      http://127.0.0.1:8545
Chain ID:       31337
```

---

## 🔐 Primeras Wallets

### Wallet 1 (Predeterminada)
```
Address:    0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
Balance:    10,000 ETH
```

### Wallet 2
```
Address:    0x70997970C51812dc3A010C7d01b50e0d17dc79C8
Private Key: 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d
Balance:    10,000 ETH
```

---

## 📋 Troubleshooting Rápido

### Anvil no responde
```bash
# Verificar si está corriendo
ps aux | grep anvil

# Ver los últimos logs
tail -20 /tmp/anvil.log

# Reiniciar
pkill anvil && sleep 2
nohup anvil > /tmp/anvil.log 2>&1 &
```

### dApp no compila
```bash
# Limpiar todo
cd .../eth-database-document/dapp
rm -rf .next node_modules package-lock.json

# Reinstalar
npm install

# Compilar
npm run build
```

### Wallet no conecta
```bash
# Verificar MetaMaskProvider está en layout.tsx
# Verificar useMetaMask está disponible
# Verificar .env.local existe y tiene RPC_URL

# Si persiste: Recarga la página F5
```

### Balance muestra 0
```bash
# Usar Wallet 1 (la predeterminada)
# Verificar que Anvil está corriendo
# Recarga la página F5
# Desconecta y vuelve a conectar
```

---

## 🎯 Flujo Típico de Desarrollo

```bash
# 1. Iniciar Anvil
cd /mnt/d/.../eth-database-document
nohup anvil > /tmp/anvil.log 2>&1 &

# 2. Desplegar contrato (si es nuevo)
forge script contracts/script/Deploy.s.sol \
  --rpc-url http://127.0.0.1:8545 \
  --broadcast \
  --private-key 0xac0974...

# 3. Copiar dirección del contrato a .env.local
# NEXT_PUBLIC_CONTRACT_ADDRESS=0x5FbDB...

# 4. Iniciar dApp
cd .../eth-database-document/dapp
npm run dev

# 5. Acceder a http://localhost:3000
# 6. Usar la aplicación
```

---

## 🧪 Testing Rápido

```bash
# Tests unitarios
cd .../eth-database-document
forge test -vv

# Tests con gas report
forge test --gas-report

# Un test específico
forge test -k testStoreAndVerify -vv

# Con traces
forge test -vv --allow-failure
```

---

## 📊 Monitoreo

```bash
# Ver transacciones en Anvil
tail -f /tmp/anvil.log | grep "Transaction"

# Ver bloques
tail -f /tmp/anvil.log | grep "Block"

# Ver logs de error
tail -f /tmp/anvil.log | grep "error"

# Contar líneas de código
find .../eth-database-document -name "*.sol" -o -name "*.tsx" | \
  xargs wc -l | tail -1
```

---

## 🔄 Reinicio Completo

```bash
# Si algo falla, reinicia todo:

# 1. Matar procesos
pkill anvil
pkill -f "npm run dev"

# 2. Limpiar datos
rm -rf .next
rm -rf /tmp/anvil.log

# 3. Reiniciar Anvil
nohup anvil > /tmp/anvil.log 2>&1 &

# 4. Esperar 3 segundos
sleep 3

# 5. Verificar Anvil
tail -5 /tmp/anvil.log

# 6. Reiniciar dApp
cd .../eth-database-document/dapp
npm run dev

# 7. Acceder a http://localhost:3000
```

---

## 📝 Notas Rápidas

- **Anvil corre en background:** `nohup anvil > /tmp/anvil.log 2>&1 &`
- **dApp corre en terminal:** `npm run dev` (ver salida en tiempo real)
- **Logs de Anvil:** `tail -f /tmp/anvil.log`
- **Wallets precargadas:** 10 wallets en `.env.local`
- **Sin MetaMask físico:** Se usan claves privadas directas
- **Todo es local:** No necesita internet
- **Gas es gratis:** Es desarrollo local

---

## ✨ Bonus: Comandos Personalizados

```bash
# Función para iniciar todo rápido
start_dev() {
  echo "🚀 Iniciando Anvil..."
  nohup anvil > /tmp/anvil.log 2>&1 &
  sleep 3
  echo "✅ Anvil iniciado"
  echo "🚀 Iniciando dApp..."
  cd /mnt/d/MAFL_Bibliotecas/Documentos/Proyectos/CodeCrypto/Practica/eth-database-document/dapp
  npm run dev
}

# Función para ver logs
show_anvil_logs() {
  tail -f /tmp/anvil.log
}

# Función para matar todo
kill_all() {
  echo "🛑 Deteniendo servicios..."
  pkill anvil
  pkill -f "npm run dev"
  echo "✅ Servicios detenidos"
}

# Agregar a tu ~/.bashrc para usar globalmente
# source ~/.bashrc
```

---

## 🎯 Objetivos Rápidos

- ✅ Ver la dApp: `http://localhost:3000`
- ✅ Conectar wallet: Click "Connect Wallet" → Selecciona wallet
- ✅ Ver balance: Aparece en dropdown (10,000 ETH)
- ✅ Firmar documento: Upload → Sign → Store
- ✅ Verificar: Tab "Verify" → ingresa datos → Click "Verify"

---

**Última actualización:** 13 de febrero de 2026  
**Estado:** 🟢 Operacional
