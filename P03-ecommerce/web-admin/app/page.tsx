'use client';

import { useState } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import { useMyCompany } from '@/hooks/useContract';
import ConnectWallet from '@/components/ConnectWallet';
import RegisterCompany from '@/components/RegisterCompany';
import CompanyDashboard from '@/components/CompanyDashboard';

export default function Home() {
  const { address } = useWallet();
  const { company, loading } = useMyCompany();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">🏪 Panel de Administración</h1>
          <p className="text-xs text-gray-500">E-Commerce Blockchain</p>
        </div>
        <ConnectWallet />
      </header>

      <main className="flex-1 p-6 max-w-5xl mx-auto w-full">
        {!address && (
          <div className="flex flex-col items-center justify-center h-64 text-center space-y-4">
            <p className="text-gray-400 text-lg">Conecta tu wallet para gestionar tu empresa</p>
            <p className="text-gray-600 text-sm">Usa la cuenta owner de la empresa (Anvil #1)</p>
          </div>
        )}

        {address && loading && (
          <div className="flex items-center justify-center h-32">
            <p className="text-gray-400">Cargando datos de empresa…</p>
          </div>
        )}

        {address && !loading && !company && (
          <RegisterCompany />
        )}

        {address && !loading && company && (
          <CompanyDashboard company={company} />
        )}
      </main>
    </div>
  );
}
