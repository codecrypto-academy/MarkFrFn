# MarkFrFn — CODECRYPTO Academy
###### Prácticas del curso "Desarrollo de dApps con Ethereum"

## Prácticas

| # | Proyecto | Tecnologías | Estado |
|---|----------|-------------|--------|
| P01 | [ETH Document Registry](P01-eth-document-registry/) | Solidity · ECDSA · Next.js 14 · ethers.js v6 | ✅ Completado |
| P02 | [DAO Voting Gasless](P02-dao/) | ERC-2771 · MinimalForwarder · Meta-tx · Next.js 15 | ✅ Completado |
| P03 | [E-Commerce Blockchain](P03-ecommerce/) | ERC-20 EuroToken · Stripe · 4 apps · Next.js 15 | ✅ Completado |
| P04 | [Escrow DApp](P04-escrow/) | Escrow · ERC-20 swap · Ownable · ReentrancyGuard | 🔧 En progreso |

## Stack común

- **Smart Contracts**: Solidity 0.8.24 · Foundry · OpenZeppelin v5
- **Frontend**: Next.js 15 · TypeScript · ethers.js v6 · Tailwind CSS v4
- **Wallet**: MetaMask · Anvil (chainId 31337)

## Arranque rápido

Cada práctica tiene su propio `start.sh`:

```bash
cd P04-escrow && bash start.sh
```
