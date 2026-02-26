'use client';

import { useState, useEffect } from 'react';
import { useMetaMask } from '@/contexts/MetaMaskContext';
import { Wallet, ChevronDown } from 'lucide-react';

export function WalletSelector() {
  const { isConnected, currentAccount, currentWallet, wallets, connect, disconnect, getBalance } =
    useMetaMask();
  const [isOpen, setIsOpen] = useState(false);
  const [balance, setBalance] = useState<string>('0');
  const [loadingBalance, setLoadingBalance] = useState(false);

  useEffect(() => {
    if (isConnected && currentWallet) {
      const fetchBalance = async () => {
        setLoadingBalance(true);
        try {
          const bal = await getBalance();
          setBalance(bal);
        } catch (error) {
          console.error('Error fetching balance:', error);
        } finally {
          setLoadingBalance(false);
        }
      };

      fetchBalance();
    }
  }, [isConnected, currentWallet, getBalance]);

  const handleConnect = async (index: number) => {
    try {
      await connect(index);
      setIsOpen(false);
      // Balance will be fetched by the useEffect
    } catch (error) {
      alert(`Error connecting wallet: ${error}`);
    }
  };

  const handleDisconnect = () => {
    disconnect();
    setBalance('0');
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
      >
        <Wallet size={18} />
        {isConnected && currentAccount ? (
          <div className="flex flex-col items-start">
            <span className="text-sm font-semibold">
              {currentWallet?.name}
            </span>
            <span className="text-xs opacity-90">
              {`${currentAccount.slice(0, 6)}...${currentAccount.slice(-4)}`}
            </span>
          </div>
        ) : (
          'Connect Wallet'
        )}
        <ChevronDown size={16} className={`ml-2 transition ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-14 right-0 bg-white border border-gray-300 rounded-lg shadow-xl z-50 w-80">
          {/* Header with balance */}
          {isConnected && currentWallet && (
            <div className="px-4 py-3 border-b bg-blue-50">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs text-gray-600 font-semibold">CURRENT WALLET</p>
                  <p className="font-mono text-sm font-semibold text-gray-900 mt-1">
                    {currentWallet.address}
                  </p>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <span className="text-sm text-gray-700">Balance:</span>
                <span className={`font-bold text-green-600 ${loadingBalance ? 'opacity-50' : ''}`}>
                  {loadingBalance ? '...' : `${parseFloat(balance).toFixed(2)} ETH`}
                </span>
              </div>
            </div>
          )}

          {/* Wallets list */}
          <div className="p-2 max-h-96 overflow-y-auto">
            {!isConnected && (
              <div className="mb-2 pb-2 border-b px-3 py-2">
                <p className="text-xs font-semibold text-gray-600">
                  {wallets.length} Anvil Test Wallets Available
                </p>
              </div>
            )}

            {wallets.map((wallet, index) => (
              <button
                key={index}
                onClick={() => handleConnect(index)}
                className={`w-full text-left px-3 py-3 text-sm rounded hover:bg-gray-100 transition border-l-4 ${
                  isConnected && currentWallet?.address === wallet.address
                    ? 'bg-blue-50 border-l-blue-600'
                    : 'border-l-transparent'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{wallet.name}</p>
                    <p className="text-xs text-gray-600 font-mono mt-1">
                      {wallet.address.slice(0, 12)}...{wallet.address.slice(-10)}
                    </p>
                  </div>
                  {isConnected && currentWallet?.address === wallet.address && (
                    <span className="text-blue-600 font-bold">✓</span>
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Footer with disconnect */}
          {isConnected && (
            <div className="border-t p-3 bg-gray-50">
              <button
                onClick={handleDisconnect}
                className="w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded transition font-semibold"
              >
                🔌 Disconnect
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
