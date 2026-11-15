import React from 'react';
import Link from 'next/link';
import { 
  ShieldCheck, 
  Terminal, 
  ArrowLeft, 
  ExternalLink, 
  FileText, 
  Lock, 
  Mail, 
  CheckCircle2, 
  Server,
  Globe
} from 'lucide-react';

interface InstitutionalLayoutProps {
  children: React.ReactNode;
  activePath: '/sobre' | '/termos' | '/privacidade' | '/contato';
  badgeTitle: string;
  pageTitle: string;
  pageDescription: string;
}

export const InstitutionalLayout: React.FC<InstitutionalLayoutProps> = ({
  children,
  activePath,
  badgeTitle,
  pageTitle,
  pageDescription,
}) => {
  return (
    <div className="relative min-h-screen bg-black text-neutral-100 flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Luz Ambiente Óptica (Zero GPU Lag) */}
      <div className="ambient-light-layer" aria-hidden="true">
        <div className="light-cyan" />
        <div className="light-indigo" />
        <div className="light-emerald" />
      </div>

      {/* Top Navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-black/40 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <Link 
            href="/" 
            className="flex items-center gap-3 group focus:outline-none"
          >
            <div className="relative w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 via-emerald-400 to-indigo-500 p-[1.5px] transition-transform group-hover:scale-105">
              <div className="w-full h-full bg-black rounded-[10px] flex items-center justify-center">
                <Terminal className="w-4 h-4 text-emerald-400" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="font-bold tracking-tight text-white text-base">Aethelkov</span>
              <span className="text-[10px] font-mono text-neutral-400 -mt-0.5">linkthelkov.online</span>
            </div>
          </Link>

          {/* Links Centrais */}
          <nav className="hidden md:flex items-center gap-1 text-xs font-medium text-neutral-300">
            <Link
              href="/"
              className="px-3 py-1.5 rounded-full hover:text-white hover:bg-white/5 transition-colors"
            >
              Início
            </Link>
            <Link
              href="/sobre"
              className={`px-3 py-1.5 rounded-full transition-colors ${
                activePath === '/sobre' ? 'text-white bg-white/10 font-semibold' : 'hover:text-white hover:bg-white/5'
              }`}
            >
              Sobre Nós
            </Link>
            <Link
              href="/termos"
              className={`px-3 py-1.5 rounded-full transition-colors ${
                activePath === '/termos' ? 'text-white bg-white/10 font-semibold' : 'hover:text-white hover:bg-white/5'
              }`}
            >
              Termos de Uso
            </Link>
            <Link
              href="/privacidade"
              className={`px-3 py-1.5 rounded-full transition-colors ${
                activePath === '/privacidade' ? 'text-white bg-white/10 font-semibold' : 'hover:text-white hover:bg-white/5'
              }`}
            >
              Privacidade
            </Link>
            <Link
              href="/contato"
              className={`px-3 py-1.5 rounded-full transition-colors ${
                activePath === '/contato' ? 'text-white bg-white/10 font-semibold' : 'hover:text-white hover:bg-white/5'
              }`}
            >
              Contato & Suporte
            </Link>
          </nav>

          {/* Botão Ação Painel */}
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="px-4 py-2 rounded-full bg-white text-black font-semibold text-xs transition-all hover:bg-neutral-200 hover:scale-105 active:scale-95 flex items-center gap-1.5 shadow-[0_0_15px_rgba(255,255,255,0.2)]"
            >
              <span>Abrir Painel</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero da Página Institucional */}
      <section className="relative z-10 pt-10 pb-8 px-4 border-b border-white/5">
        <div className="max-w-4xl mx-auto text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-medium border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{badgeTitle}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white">
            {pageTitle}
          </h1>
          <p className="text-sm sm:text-base text-neutral-300 max-w-2xl mx-auto leading-relaxed">
            {pageDescription}
          </p>
        </div>
      </section>

      {/* Conteúdo Principal */}
      <main className="relative z-10 flex-1 max-w-4xl w-full mx-auto px-4 py-10">
        {children}
      </main>

      {/* Rodapé Oficial Institucional */}
      <footer className="relative z-10 border-t border-white/10 bg-black/60 backdrop-blur-md pt-12 pb-10 px-4 mt-16 text-neutral-400 text-xs">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          <div className="space-y-3 md:col-span-2">
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
                <Terminal className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <span className="font-bold text-white text-sm">Aethelkov Cloud</span>
            </div>
            <p className="text-neutral-400 text-xs leading-relaxed max-w-md">
              Aethelkov é a plataforma oficial de computação em nuvem distribuída dedicada à execução ininterrupta (24/7) de bots de Discord e Telegram, microsserviços e aplicações modernas em Node.js, Python, Java e Rust.
            </p>
            <div className="flex items-center gap-2 text-[11px] font-mono text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Domínio Oficial Verificado: linkthelkov.online</span>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-white font-semibold text-xs uppercase tracking-wider font-mono">Institucional</h4>
            <ul className="space-y-1.5">
              <li>
                <Link href="/sobre" className="hover:text-white transition-colors">Sobre a Plataforma</Link>
              </li>
              <li>
                <Link href="/termos" className="hover:text-white transition-colors">Termos de Uso e Serviço</Link>
              </li>
              <li>
                <Link href="/privacidade" className="hover:text-white transition-colors">Política de Privacidade</Link>
              </li>
              <li>
                <Link href="/contato" className="hover:text-white transition-colors">Central de Contato & Suporte</Link>
              </li>
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="text-white font-semibold text-xs uppercase tracking-wider font-mono">Segurança & Legal</h4>
            <ul className="space-y-1.5">
              <li>
                <a href="/.well-known/security.txt" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors inline-flex items-center gap-1">
                  <span>security.txt (RFC 9116)</span>
                  <ExternalLink className="w-3 h-3 text-neutral-500" />
                </a>
              </li>
              <li>
                <a href="mailto:abuse@linkthelkov.online" className="hover:text-white transition-colors">Denúncias (Abuso & Phishing)</a>
              </li>
              <li>
                <a href="mailto:seguranca@linkthelkov.online" className="hover:text-white transition-colors">Reporte de Vulnerabilidades</a>
              </li>
              <li>
                <span className="text-neutral-500">Conformidade LGPD & GDPR</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="max-w-6xl mx-auto pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-neutral-400 font-mono">
          <p>© {new Date().getFullYear()} Aethelkov (linkthelkov.online). Todos os direitos reservados.</p>
          <p className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Rede Operacional &bull; SLA 99.9%</span>
          </p>
        </div>
      </footer>
    </div>
  );
};
