import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Aethelkov | Autonomous Hybrid Grid Runtime',
  description: 'Hospedagem profissional de bots Discord e Telegram com infraestrutura de custo zero absoluto (R$ 0,00).',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="antialiased selection:bg-emerald-500/30 selection:text-emerald-200">
        {children}
      </body>
    </html>
  );
}

