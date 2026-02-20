'use client';

import { useState, useEffect, useCallback } from 'react';
import ConnectWallet  from '@/components/ConnectWallet';
import FundingPanel   from '@/components/FundingPanel';
import CreateProposal from '@/components/CreateProposal';
import ProposalList   from '@/components/ProposalList';
import { useDaoBalances } from '@/hooks/useContract';

type Tab = 'fund' | 'create' | 'proposals';

const TABS: { id: Tab; label: string }[] = [
  { id: 'fund',      label: 'Fondear DAO' },
  { id: 'create',    label: 'Nueva Propuesta' },
  { id: 'proposals', label: 'Propuestas' },
];

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>('proposals');
  const { totalBalance, userBalance, refresh: refreshBalances } = useDaoBalances();
  const [daemonLog, setDaemonLog] = useState<string | null>(null);

  // Daemon: llama /api/daemon cada 30 segundos para ejecutar propuestas aprobadas
  const runDaemon = useCallback(async () => {
    try {
      const res = await fetch('/api/daemon');
      const json = await res.json();
      if (json.executed?.length > 0) {
        setDaemonLog(`Daemon: ${json.executed.length} propuesta(s) ejecutada(s) automáticamente.`);
        refreshBalances();
        setTimeout(() => setDaemonLog(null), 5000);
      }
    } catch {
      // silencioso — Anvil puede no estar corriendo al inicio
    }
  }, [refreshBalances]);

  useEffect(() => {
    runDaemon();
    const interval = setInterval(runDaemon, 30_000);
    return () => clearInterval(interval);
  }, [runDaemon]);

  const handleSuccess = () => {
    refreshBalances();
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="border-b border-gray-800 px-4 py-3">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-lg font-bold">DAO Voting</h1>
            <p className="text-xs text-gray-400">Votación gasless con ERC-2771</p>
          </div>
          <ConnectWallet userBalance={userBalance} totalBalance={totalBalance} />
        </div>
      </header>

      {/* Daemon notification */}
      {daemonLog && (
        <div className="bg-blue-900/30 border-b border-blue-700 px-4 py-2 text-center text-sm text-blue-400">
          {daemonLog}
        </div>
      )}

      {/* Tabs */}
      <nav className="border-b border-gray-800 px-4">
        <div className="max-w-5xl mx-auto flex gap-1">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-gray-400 hover:text-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        {activeTab === 'fund' && (
          <FundingPanel
            userBalance={userBalance}
            totalBalance={totalBalance}
            onSuccess={handleSuccess}
          />
        )}

        {activeTab === 'create' && (
          <CreateProposal
            userBalance={userBalance}
            totalBalance={totalBalance}
            onSuccess={() => { handleSuccess(); setActiveTab('proposals'); }}
          />
        )}

        {activeTab === 'proposals' && (
          <ProposalList />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 mt-8 px-4 py-4 text-center text-xs text-gray-600">
        Curso Desarrollo de dApps con Ethereum — CODECRYPTO · Daemon activo (30s)
      </footer>
    </div>
  );
}
