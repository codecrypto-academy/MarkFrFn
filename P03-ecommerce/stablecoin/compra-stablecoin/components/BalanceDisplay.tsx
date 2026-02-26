'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import { getReadProvider, getEuroTokenContract, unitsToEur } from '@/lib/contracts';

export default function BalanceDisplay() {
  const { address } = useWallet();
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    if (!address) { setBalance(null); return; }
    const fetch = async () => {
      const contract = getEuroTokenContract(getReadProvider());
      const raw = await contract.balanceOf(address);
      setBalance(unitsToEur(raw));
    };
    fetch();
    const interval = setInterval(fetch, 5000);
    return () => clearInterval(interval);
  }, [address]);

  if (!address || balance === null) return null;

  return (
    <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
      <p className="text-sm text-gray-400 mb-1">Tu balance de EuroToken</p>
      <p className="text-3xl font-bold text-green-400">
        {balance.toLocaleString('es-ES', { minimumFractionDigits: 2 })} EURT
      </p>
    </div>
  );
}
