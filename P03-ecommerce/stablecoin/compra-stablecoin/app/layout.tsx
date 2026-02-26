import type { Metadata } from 'next';
import './globals.css';
import { WalletProvider } from '@/contexts/WalletContext';

export const metadata: Metadata = {
  title: 'Compra EuroToken (EURT)',
  description: 'Compra tokens EURT con tarjeta de crédito',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="bg-gray-900 text-white min-h-screen">
        <WalletProvider>{children}</WalletProvider>
      </body>
    </html>
  );
}
