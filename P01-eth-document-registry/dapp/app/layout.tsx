import type { Metadata } from 'next';
import './globals.css';
import Providers from './providers';

export const metadata: Metadata = {
  title: 'ETH Database Document - dApp',
  description: 'Decentralized document verification using Ethereum blockchain',
};

// Inline script ejecutado antes de la hidratación para evitar flash de tema incorrecto
const themeScript = `
(function() {
  try {
    const t = localStorage.getItem('theme');
    const d = t ? t === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (d) document.documentElement.classList.add('dark');
  } catch(e) {}
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
