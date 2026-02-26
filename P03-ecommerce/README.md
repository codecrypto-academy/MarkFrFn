# P03 — E-Commerce Blockchain con EuroToken y Stripe

Sistema completo de e-commerce descentralizado con stablecoin ERC20, pagos con tarjeta y cuatro aplicaciones web.

## Stack

| Capa | Tecnología |
|------|-----------|
| Smart Contracts | Solidity 0.8.24 · Foundry · OpenZeppelin |
| Stablecoin | ERC20 · EuroToken (EURT, 6 decimales) |
| Pagos fiat | Stripe Elements + Webhooks |
| Frontend | Next.js 15 · TypeScript · Tailwind v4 |
| Blockchain local | Anvil (chainId 31337) |
| Wallet | MetaMask · ethers.js v6 |

## Estructura

```
P03-ecommerce/
├── stablecoin/
│   ├── sc/                    # EuroToken ERC20 (Foundry)
│   ├── compra-stablecoin/     # App: comprar EURT con tarjeta  :6001
│   └── pasarela-de-pago/      # App: pagar facturas con EURT   :6002
├── sc-ecommerce/              # 6 contratos e-commerce (Foundry)
├── web-admin/                 # App: panel de empresa           :6003
├── web-customer/              # App: tienda para clientes       :6004
└── restart-all.sh             # Script de arranque completo
```

## Contratos

### EuroToken (stablecoin/sc/)
- ERC20 estándar · 6 decimales (1 EURT = 1 EUR)
- `mint(address, amount)` — solo owner

### E-Commerce (sc-ecommerce/)
| Contrato | Función |
|----------|---------|
| `CompanyRegistry` | Registro de empresas (1 empresa por wallet) |
| `ProductCatalog` | Catálogo de productos con stock |
| `ShoppingCart` | Carrito en blockchain por customer |
| `InvoiceSystem` | Facturas creadas desde el carrito |
| `PaymentGateway` | Transferencia EURT + marca factura pagada |
| `EcommerceMain` | Coordinador — punto de entrada único del frontend |

## Inicio rápido

### Requisitos
- [Foundry](https://book.getfoundry.sh/getting-started/installation)
- Node.js 18+
- MetaMask

```bash
# 1. Arrancar todo el sistema
chmod +x restart-all.sh
./restart-all.sh

# 2. Para webhooks de Stripe en local (terminal separada)
stripe listen --forward-to localhost:6001/api/webhooks
```

### Variables de entorno (Stripe)
Copia los `.env.local.example` a `.env.local` en cada app y añade tus claves de Stripe test:
```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Tests de smart contracts
```bash
# EuroToken (19 tests)
cd stablecoin/sc && forge test --summary

# E-Commerce integración (27 tests)
cd sc-ecommerce && forge test --summary
```

## Flujo de uso

```
1. Comprar EURT en :6001 con tarjeta de prueba Stripe
   → webhook hace mint de tokens a tu wallet

2. Registrar empresa en :6003 (cuenta MetaMask #1)
   → agregar productos con precio y stock

3. En :6004 (cuenta MetaMask #2 = cliente):
   → ver catálogo → agregar al carrito → checkout
   → se crea factura en blockchain
   → redirige a :6002 (pasarela)

4. En :6002:
   → verificar saldo EURT
   → approve + processPayment
   → tokens van al comerciante, stock se reduce, factura = Pagada

5. En :6004/orders: ver factura marcada como Pagada ✅
6. En :6003: ver factura recibida + balance EURT aumentado
```

## Cuentas Anvil de prueba

| # | Dirección | Uso sugerido |
|---|-----------|--------------|
| 0 | `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266` | Deployer / Owner EuroToken |
| 1 | `0x70997970C51812dc3A010C7d01b50e0d17dc79C8` | Empresa (merchant) |
| 2 | `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC` | Cliente #1 |
| 3 | `0x90F79bf6EB2c4f870365E785982E1f101E93b906` | Cliente #2 |

## Tarjeta de prueba Stripe

```
Número:   4242 4242 4242 4242
Caducidad: cualquier fecha futura (ej. 12/29)
CVC:      cualquier 3 dígitos
```

## Documentación

- [1-PROYECTO_ESTUDIANTE.md](docs/1-PROYECTO_ESTUDIANTE.md) — Especificación completa del proyecto
- [2-ARCHITECTURE.md](docs/2-ARCHITECTURE.md) — Diagramas de arquitectura
- [3-DEPLOYED_ADDRESSES.md](docs/3-DEPLOYED_ADDRESSES.md) — Addresses de referencia (deploy anterior)
