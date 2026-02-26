'use client';

import { useState } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import ConnectWallet from '@/components/ConnectWallet';
import AddToken from '@/components/AddToken';
import CreateOperation from '@/components/CreateOperation';
import OperationsList from '@/components/OperationsList';
import BalanceDebug from '@/components/BalanceDebug';

export default function HomePage() {
  const { address } = useWallet();
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = () => setRefreshKey((k) => k + 1);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">🔐 Escrow DApp</h1>
          <p className="text-xs text-gray-500">Intercambio seguro de tokens ERC20 · Anvil Local</p>
        </div>
        <ConnectWallet />
      </header>

      <main className="flex-1 p-6">
        {!address ? (
          /* Sin conectar */
          <div className="max-w-md mx-auto mt-20 text-center space-y-4">
            <p className="text-4xl">🔐</p>
            <h2 className="text-2xl font-bold">Bienvenido a Escrow DApp</h2>
            <p className="text-gray-400 text-sm">
              Plataforma descentralizada para intercambio seguro de tokens ERC20.
              Conecta MetaMask para comenzar.
            </p>
            <div className="bg-gray-800 rounded-xl p-4 text-left text-sm space-y-2">
              <p className="text-gray-300 font-semibold">Cómo funciona:</p>
              <ol className="text-gray-400 space-y-1 list-decimal list-inside">
                <li>El owner agrega los tokens que se pueden intercambiar</li>
                <li>Usuario A crea una operación: ofrece TKA y pide TKB</li>
                <li>Usuario B acepta: aporta TKB y recibe TKA</li>
                <li>Usuario A puede cancelar antes de que se complete</li>
              </ol>
            </div>
            <p className="text-xs text-gray-600">
              Red: Anvil Local · chainId 31337 · localhost:8545
            </p>
          </div>
        ) : (
          /* Conectado — layout 3 columnas */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
            {/* Columna 1: AddToken + CreateOperation */}
            <div className="space-y-4">
              <AddToken key={`add-${refreshKey}`} onTokenAdded={handleRefresh} />
              <CreateOperation key={`create-${refreshKey}`} onCreated={handleRefresh} />
            </div>

            {/* Columna 2: OperationsList */}
            <div>
              <OperationsList key={`ops-${refreshKey}`} />
            </div>

            {/* Columna 3: BalanceDebug */}
            <div>
              <BalanceDebug key={`debug-${refreshKey}`} />
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-gray-800 px-6 py-3 text-center text-xs text-gray-600">
        P04 · Escrow DApp · CODECRYPTO Academy · Solidity 0.8.24 + Next.js 15 + ethers.js v6
      </footer>
    </div>
  );
}
