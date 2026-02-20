'use client';

import ConnectWallet from '@/components/ConnectWallet';
import BuyTokens from '@/components/BuyTokens';
import BalanceDisplay from '@/components/BalanceDisplay';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">💶 Compra EuroToken</h1>
          <p className="text-xs text-gray-500">1 EURT = 1 EUR · Token ERC20</p>
        </div>
        <ConnectWallet />
      </header>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md space-y-6">
          <BalanceDisplay />

          <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700 shadow-xl">
            <h2 className="text-lg font-semibold mb-4">Comprar tokens con tarjeta</h2>
            <BuyTokens />
          </div>

          <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700 text-sm text-gray-400 space-y-1">
            <p className="font-medium text-gray-300">¿Cómo funciona?</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Conecta tu MetaMask (red Anvil Local, chainId 31337)</li>
              <li>Introduce la cantidad de EURT que quieres comprar</li>
              <li>Paga con tarjeta de crédito vía Stripe</li>
              <li>Los tokens se acreditan automáticamente a tu wallet</li>
            </ol>
          </div>
        </div>
      </main>
    </div>
  );
}
