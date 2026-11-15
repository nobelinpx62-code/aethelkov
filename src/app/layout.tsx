import type { Metadata, Viewport } from 'next';
import './globals.css';

export const viewport: Viewport = {
  themeColor: '#07080a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  metadataBase: new URL('https://linkthelkov.online'),
  title: {
    default: 'Aethelkov — Hospedagem de Bots Discord 24/7 & Cloud Grid',
    template: '%s | Aethelkov',
  },
  description: 'Aethelkov é a plataforma definitiva para hospedagem de bots Discord e Telegram com infraestrutura de alta velocidade 24/7. Suporte a Python, Node.js e Java com zero restrições de código e ativação imediata.',
  keywords: [
    'Aethelkov',
    'aethelkov',
    'aethel kov',
    'hospedagem discord bot',
    'host bot discord',
    'hospedar bot discord',
    'bot discord 24/7',
    'discloud alternativa',
    'linkethelkov',
    'linkthelkov',
    'hospedagem python bot',
    'hospedagem nodejs bot',
    'aethel cloud'
  ],
  authors: [{ name: 'Aethelkov' }],
  creator: 'Aethelkov',
  publisher: 'Aethelkov',
  applicationName: 'Aethelkov',
  alternates: {
    canonical: 'https://linkthelkov.online',
  },
  openGraph: {
    title: 'Aethelkov — Hospedagem de Bots Discord 24/7',
    description: 'Hospedagem de alta performance para bots Discord em Python, Node.js e Java. Zero restrições de código e ativação imediata via Pix.',
    url: 'https://linkthelkov.online',
    siteName: 'Aethelkov',
    locale: 'pt_BR',
    type: 'website',
    images: [
      {
        url: '/icon.svg',
        width: 512,
        height: 512,
        alt: 'Aethelkov Logo',
      },
    ],
  },
  twitter: {
    card: 'summary',
    title: 'Aethelkov — Hospedagem de Bots Discord 24/7',
    description: 'Hospede seus bots Discord sem restrições com suporte a Python, Node.js e Java.',
    images: ['/icon.svg'],
  },
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    shortcut: '/icon.svg',
    apple: [
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Aethelkov',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'yEzGUI3EeeBT2QaCQilR7w9mBw6_x-TtZ0-rzwpG5hM',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': 'https://linkthelkov.online/#website',
      url: 'https://linkthelkov.online/',
      name: 'Aethelkov',
      alternateName: ['Aethel Kov', 'Aethelkov Cloud', 'Linkethelkov', 'Linkthelkov'],
      description: 'Plataforma oficial de infraestrutura em nuvem e hospedagem 24/7 de alta performance para bots Discord, Telegram, microsserviços e aplicações web.',
      inLanguage: 'pt-BR',
    },
    {
      '@type': 'Organization',
      '@id': 'https://linkthelkov.online/#organization',
      name: 'Aethelkov',
      legalName: 'Aethelkov Cloud Computing & Hosting',
      url: 'https://linkthelkov.online/',
      logo: 'https://linkthelkov.online/icon.svg',
      description: 'Provedor legítimo de infraestrutura em nuvem distribuída, conteinerização e execução 24/7 para desenvolvedores de software, bots e serviços digitais.',
      email: 'suporte@linkthelkov.online',
      contactPoint: [
        {
          '@type': 'ContactPoint',
          contactType: 'customer support',
          email: 'suporte@linkthelkov.online',
          availableLanguage: ['Portuguese', 'English'],
          url: 'https://linkthelkov.online/contato',
        },
        {
          '@type': 'ContactPoint',
          contactType: 'security',
          email: 'seguranca@linkthelkov.online',
          availableLanguage: ['Portuguese', 'English'],
          url: 'https://linkthelkov.online/.well-known/security.txt',
        },
      ],
      termsOfService: 'https://linkthelkov.online/termos',
      privacyPolicy: 'https://linkthelkov.online/privacidade',
      sameAs: [
        'https://linkthelkov.online',
        'https://github.com/nobelinpx62-code/aethelkov',
      ],
    },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <head>
        <meta name="google-site-verification" content="yEzGUI3EeeBT2QaCQilR7w9mBw6_x-TtZ0-rzwpG5hM" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="antialiased selection:bg-emerald-500/30 selection:text-emerald-200">
        {children}
      </body>
    </html>
  );
}
