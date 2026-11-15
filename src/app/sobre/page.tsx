import React from 'react';
import type { Metadata } from 'next';
import { InstitutionalLayout } from '@/components/InstitutionalLayout';
import { 
  Server, 
  Cpu, 
  ShieldCheck, 
  Zap, 
  Terminal, 
  CheckCircle2, 
  Globe, 
  Layers, 
  Lock, 
  Mail, 
  ExternalLink 
} from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Sobre Nós — Infraestrutura em Nuvem & Hospedagem 24/7 | Aethelkov',
  description: 'Conheça a Aethelkov (linkthelkov.online): infraestrutura moderna em nuvem dedicada à hospedagem contínua 24/7 de bots para Discord e Telegram, microsserviços e aplicações web.',
  alternates: {
    canonical: 'https://linkthelkov.online/sobre',
  },
};

export default function SobrePage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    name: 'Sobre a Aethelkov',
    url: 'https://linkthelkov.online/sobre',
    description: 'Aethelkov é uma plataforma de computação em nuvem distribuída dedicada à execução e gerenciamento de bots de Discord e Telegram e aplicações web.',
    publisher: {
      '@type': 'Organization',
      name: 'Aethelkov',
      url: 'https://linkthelkov.online/',
      logo: 'https://linkthelkov.online/icon.svg',
    },
  };

  return (
    <InstitutionalLayout
      activePath="/sobre"
      badgeTitle="Institucional & Transparência"
      pageTitle="Sobre a Aethelkov"
      pageDescription="Desenvolvemos infraestrutura de nuvem moderna, veloz e acessível para desenvolvedores independentes e criadores de comunidades digitais em todo o mundo."
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="space-y-8">
        {/* Bloco 1: Quem Somos e Missão */}
        <section className="apple-glass-card rounded-3xl p-6 sm:p-8 border border-white/12 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400">
              <Globe className="w-5 h-5" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">
              Nossa Missão & Identidade
            </h2>
          </div>
          
          <p className="text-neutral-300 leading-relaxed text-sm sm:text-base">
            A <strong>Aethelkov</strong> (operando sob o domínio verificado <code className="text-emerald-400 bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-500/30 font-mono text-xs">linkthelkov.online</code>) foi criada para solucionar a complexidade e os altos custos de hospedagem de bots e microsserviços. 
          </p>
          <p className="text-neutral-300 leading-relaxed text-sm sm:text-base">
            Tradicionalmente, desenvolvedores precisam configurar servidores VPS manuais, firewalls, gerenciadores de processos (como PM2 ou Docker) e certificados SSL apenas para colocar um bot de Discord ou Telegram em funcionamento. A Aethelkov entrega uma experiência integrada de ponta a ponta: basta fazer o upload do projeto ou conectar o repositório para ter o serviço executando em segundos, com monitoramento ativo 24 horas por dia, 7 dias por semana.
          </p>
        </section>

        {/* Bloco 2: Pilares da Infraestrutura */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="apple-glass-card rounded-2xl p-6 border border-white/10 space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                <Zap className="w-4 h-4" />
              </div>
              <h3 className="font-semibold text-white text-base">Runner Core Otimizado</h3>
            </div>
            <p className="text-neutral-400 text-xs sm:text-sm leading-relaxed">
              Nosso motor de execução é desacoplado e roda em nós de alta performance com processadores AMD EPYC, oferecendo tempos de resposta inferiores a 20ms nos eventos de bots.
            </p>
          </div>

          <div className="apple-glass-card rounded-2xl p-6 border border-white/10 space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400">
                <Lock className="w-4 h-4" />
              </div>
              <h3 className="font-semibold text-white text-base">Isolamento e Segurança</h3>
            </div>
            <p className="text-neutral-400 text-xs sm:text-sm leading-relaxed">
              Cada aplicação roda em contêiner de memória estrita (100 MB dedicados na cota base). Credenciais e chaves de API são protegidas em repouso com algoritmo AES-256.
            </p>
          </div>

          <div className="apple-glass-card rounded-2xl p-6 border border-white/10 space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-400">
                <Server className="w-4 h-4" />
              </div>
              <h3 className="font-semibold text-white text-base">Multi-Linguagem Nativo</h3>
            </div>
            <p className="text-neutral-400 text-xs sm:text-sm leading-relaxed">
              Suporte completo a Node.js (JavaScript/TypeScript), Python 3.10+, Java, Rust e contêineres Docker, sem restrição arbitrária de bibliotecas ou dependências.
            </p>
          </div>

          <div className="apple-glass-card rounded-2xl p-6 border border-white/10 space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-pink-500/15 border border-pink-500/30 text-pink-400">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h3 className="font-semibold text-white text-base">Uptime e Recuperação</h3>
            </div>
            <p className="text-neutral-400 text-xs sm:text-sm leading-relaxed">
              Sistema de telemetria contínua com verificação a cada 0.8s e reinício automático imediato em caso de exceções não tratadas ou reinicialização de nós.
            </p>
          </div>
        </section>

        {/* Bloco 3: Compromisso Anti-Abuso e Integridade */}
        <section className="apple-glass-card rounded-3xl p-6 sm:p-8 border border-white/12 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">
              Compromisso com a Segurança e Política Anti-Fraude
            </h2>
          </div>
          <p className="text-neutral-300 leading-relaxed text-sm sm:text-base">
            A Aethelkov mantém política rígida de tolerância zero contra qualquer atividade ilícita na rede. É expressamente proibido o uso de nossos servidores para:
          </p>
          <ul className="space-y-2 text-neutral-300 text-xs sm:text-sm pl-2">
            <li className="flex items-start gap-2">
              <span className="text-red-400 font-bold">•</span>
              <span>Execução de scripts de phishing, roubo de credenciais ou clonagem de plataformas bancárias e sociais.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-400 font-bold">•</span>
              <span>Disparo de ataques de negação de serviço (DDoS), varredura não autorizada de portas ou redes botnet.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-400 font-bold">•</span>
              <span>Mineração de criptomoedas ou estresse artificial de hardware.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-400 font-bold">•</span>
              <span>Distribuição ou hospedagem de material ilícito, malwares, backdoors ou exploits.</span>
            </li>
          </ul>
          <p className="text-neutral-400 text-xs sm:text-sm pt-2">
            Caso identifique qualquer aplicação violando essas diretrizes em nosso domínio, notifique imediatamente nossa equipe de resposta em <a href="mailto:abuse@linkthelkov.online" className="text-emerald-400 underline hover:text-emerald-300">abuse@linkthelkov.online</a>.
          </p>
        </section>

        {/* Bloco 4: Contato e Links Oficiais */}
        <section className="apple-glass-card rounded-3xl p-6 sm:p-8 border border-white/12 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center sm:text-left">
            <h3 className="text-lg font-bold text-white">Transparência e Suporte</h3>
            <p className="text-neutral-400 text-xs sm:text-sm max-w-md">
              Dúvidas sobre o serviço, parcerias ou solicitações técnicas podem ser direcionadas diretamente aos nossos canais oficiais.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/contato"
              className="px-5 py-2.5 rounded-full bg-white text-black font-semibold text-xs transition-all hover:bg-neutral-200"
            >
              Falar Conosco
            </Link>
            <Link
              href="/termos"
              className="px-5 py-2.5 rounded-full bg-white/10 text-white font-semibold text-xs border border-white/15 transition-all hover:bg-white/15"
            >
              Termos de Uso
            </Link>
          </div>
        </section>
      </div>
    </InstitutionalLayout>
  );
}
