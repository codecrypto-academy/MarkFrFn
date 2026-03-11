'use client';

import { useState } from 'react';
import { WalletSelector } from '@/components/WalletSelector';
import { FileUploader } from '@/components/FileUploader';
import { DocumentSigner } from '@/components/DocumentSigner';
import { DocumentVerifier } from '@/components/DocumentVerifier';
import { DocumentHistory } from '@/components/DocumentHistory';
import { useMetaMask } from '@/hooks/useMetaMask';
import { useTheme } from '@/hooks/useTheme';
import { Database, Sun, Moon } from 'lucide-react';

type Tab = 'upload' | 'verify' | 'history';

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileHash, setFileHash] = useState<string>('');
  const [activeTab, setActiveTab] = useState<Tab>('upload');
  const { isConnected } = useMetaMask();
  const { dark, toggle } = useTheme();

  const handleFileSelected = (file: File, hash: string) => {
    setSelectedFile(file);
    setFileHash(hash);
  };

  const handleHashCalculated = (hash: string) => {
    setFileHash(hash);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 transition-colors duration-200">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-md sticky top-0 z-40 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Database size={32} className="text-blue-600 dark:text-blue-400" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              ETH Database Document
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={toggle}
              aria-label="Toggle dark mode"
              className="p-2 rounded-lg text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
            >
              {dark ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <WalletSelector />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Status Banner */}
        <div
          className={`mb-6 p-4 rounded-lg transition-colors duration-200 ${
            isConnected
              ? 'bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800'
              : 'bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800'
          }`}
        >
          <p
            className={`text-sm font-semibold ${
              isConnected
                ? 'text-green-800 dark:text-green-300'
                : 'text-amber-800 dark:text-amber-300'
            }`}
          >
            {isConnected
              ? '✅ Wallet connected - Ready to sign and verify documents'
              : '⚠️ Connect a wallet to get started'}
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-2 bg-white dark:bg-gray-800 rounded-lg p-1 shadow transition-colors duration-200">
          {(['upload', 'verify', 'history'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2 rounded-md font-semibold transition-all duration-200 ${
                activeTab === tab
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {tab === 'upload' && '📤 Upload & Sign'}
              {tab === 'verify' && '✅ Verify'}
              {tab === 'history' && '📜 History'}
            </button>
          ))}
        </div>

        {/* Content — key forces remount on tab change, triggering the CSS animation */}
        <div
          key={activeTab}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 animate-tab-in transition-colors duration-200"
        >
          {activeTab === 'upload' && (
            <div className="space-y-8">
              <FileUploader
                onFileSelected={handleFileSelected}
                onHashCalculated={handleHashCalculated}
              />

              {fileHash && selectedFile && (
                <>
                  <hr className="dark:border-gray-700" />
                  <DocumentSigner fileHash={fileHash} fileName={selectedFile.name} />
                </>
              )}
            </div>
          )}

          {activeTab === 'verify' && <DocumentVerifier />}

          {activeTab === 'history' && <DocumentHistory />}
        </div>

        {/* Footer */}
        <footer className="mt-12 py-6 text-center text-gray-600 dark:text-gray-400 text-sm">
          <p>⚠️ This application is for local development only with Anvil.</p>
          <p>Never use with real private keys or on public networks.</p>
        </footer>
      </div>
    </main>
  );
}
