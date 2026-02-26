'use client';

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { getReadProvider, getEscrowContract, getERC20Contract, ESCROW_ADDRESS, ANVIL_ACCOUNTS } from '@/lib/contracts';

interface TokenInfo {
  address: string;
  symbol: string;
}

interface BalanceRow {
  label: string;
  address: string;
  eth: string;
  tokenBalances: string[];
}

export default function BalanceDebug() {
  const [tokens, setTokens]   = useState<TokenInfo[]>([]);
  const [rows, setRows]       = useState<BalanceRow[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchBalances = async () => {
    setLoading(true);
    try {
      const provider = getReadProvider();
      const escrow = getEscrowContract(provider);
      const addrs: string[] = await escrow.getAllowedTokens();

      const tokenInfos: TokenInfo[] = await Promise.all(
        addrs.map(async (addr) => {
          try {
            const sym: string = await getERC20Contract(addr, provider).symbol();
            return { address: addr, symbol: String(sym) };
          } catch {
            return { address: addr, symbol: addr.slice(0, 6) };
          }
        })
      );
      setTokens(tokenInfos);

      const accounts = [
        { label: 'Escrow', address: ESCROW_ADDRESS },
        { label: 'Acct #0', address: ANVIL_ACCOUNTS[0] },
        { label: 'Acct #1', address: ANVIL_ACCOUNTS[1] },
        { label: 'Acct #2', address: ANVIL_ACCOUNTS[2] },
      ];

      const newRows = await Promise.all(
        accounts.map(async ({ label, address }) => {
          const ethBal = await provider.getBalance(address).catch(() => 0n);
          const tokenBals = await Promise.all(
            tokenInfos.map(async (t) => {
              try {
                const bal: bigint = await getERC20Contract(t.address, provider).balanceOf(address);
                return Number(ethers.formatUnits(bal, 18)).toFixed(2);
              } catch { return '-'; }
            })
          );
          return {
            label,
            address,
            eth: Number(ethers.formatEther(typeof ethBal === 'bigint' ? ethBal : 0n)).toFixed(4),
            tokenBalances: tokenBals,
          };
        })
      );
      setRows(newRows);
    } catch { /* contrato no disponible */ }
    setLoading(false);
  };

  useEffect(() => { fetchBalances(); }, []);

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-lg">🔍 Debug Balances</h2>
        <button
          onClick={fetchBalances}
          disabled={loading}
          className="text-xs text-gray-400 hover:text-white transition"
        >
          {loading ? '↻' : '↻ Refresh'}
        </button>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-gray-500">Cargando…</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-gray-500 border-b border-gray-700">
                <th className="text-left pb-2">Cuenta</th>
                <th className="text-right pb-2">ETH</th>
                {tokens.map((t) => (
                  <th key={t.address} className="text-right pb-2">{t.symbol}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr
                  key={row.address}
                  className={`border-b border-gray-700/50 ${i === 0 ? 'text-blue-300' : 'text-gray-300'}`}
                >
                  <td className="py-2 font-semibold">{row.label}</td>
                  <td className="text-right py-2 font-mono">{row.eth}</td>
                  {row.tokenBalances.map((bal, j) => (
                    <td key={j} className="text-right py-2 font-mono">{bal}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
