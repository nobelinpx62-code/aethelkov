import React from 'react';
import type { Metadata } from 'next';
import { InstitutionalLayout } from '@/components/InstitutionalLayout';
import { Mail, ShieldAlert, MessageSquare, Clock, CheckCircle2, HelpCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Contato, Suporte & Central de Abuso | Aethelkov',
  description: 'Canais oficiais de atendimento da Aethelkov (linkthelkov.online). Suporte a desenvolvedores, reporte de abuso/phishing e segurança da informação.',
  alternates: {
    canonical: 'https://linkthelkov.online/contato',
  },
};

export default function ContatoPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    name: 'Central de Atendimento e Contato da Aethelkov',
    url: 'https://linkthelkov.online/contato',
    description: 'Página oficial de contato para suporte ao desenvolvedor, reporte de abusos e segurança.',
  };

  return (
    <InstitutionalLayout
      activePath="/contato"
      badgeTitle="Atendimento & Suporte"
      pageTitle="Central de Contato e Suporte"
      pageDescription="Estamos prontos para ajudar com dúvidas técnicas, parcerias, solicitações comerciais ou tratamento imediato de incidentes de segurança."
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="space-y-8">
        {/* Cards de Canais Oficiais */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Suporte Técnico */}
          <div className="apple-glass-card rounded-3xl p-6 border border-white/12 space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 flex items-center justify-center">
                <Mail className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-white text-lg">Suporte ao Desenvolvedor</h3>
              <p className="text-neutral-400 text-xs sm:text-sm leading-relaxed">
                Dúvidas sobre o funcionamento de bots, erros de inicialização, configuração de pacotes e cota de RAM.
              </p>
            </div>
            <div className="pt-3 border-t border-white/10 space-y-1">
              <a
                href="mailto:suporte@linkthelkov.online"
                className="text-xs sm:text-sm font-mono text-cyan-400 hover:text-cyan-300 underline break-all"
              >
                suporte@linkthelkov.online
              </a>
              <p className="text-[11px] text-neutral-400">Resposta em até 24 horas úteis</p>
            </div>
          </div>

          {/* Abuso e Phishing */}
          <div className="apple-glass-card rounded-3xl p-6 border border-red-500/30 bg-red-950/10 space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-400 flex items-center justify-center">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-white text-lg">Denúncias & Abuso</h3>
              <p className="text-neutral-400 text-xs sm:text-sm leading-relaxed">
                Reporte imediato de páginas maliciosas, phishing, fraudes ou violação de direitos autorais (DMCA).
              </p>
            </div>
            <div className="pt-3 border-t border-red-500/20 space-y-1">
              <a
                href="mailto:abuse@linkthelkov.online"
                className="text-xs sm:text-sm font-mono text-red-400 hover:text-red-300 underline break-all"
              >
                abuse@linkthelkov.online
              </a>
              <p className="text-[11px] text-red-400/80 font-semibold">Prioridade Máxima (24/7)</p>
            </div>
          </div>

          {/* Segurança da Informação */}
          <div className="apple-glass-card rounded-3xl p-6 border border-white/12 space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-white text-lg">Segurança & Divulgação</h3>
              <p className="text-neutral-400 text-xs sm:text-sm leading-relaxed">
                Relato responsável de vulnerabilidades de segurança na plataforma e conformidade com RFC 9116.
              </p>
            </div>
            <div className="pt-3 border-t border-white/10 space-y-1">
              <a
                href="mailto:seguranca@linkthelkov.online"
                className="text-xs sm:text-sm font-mono text-emerald-400 hover:text-emerald-300 underline break-all"
              >
                seguranca@linkthelkov.online
              </a>
              <p className="text-[11px] text-neutral-400">Ver diretriz security.txt</p>
            </div>
          </div>
        </div>

        {/* Informações Oficiais de Verificação */}
        <div className="apple-glass-card rounded-3xl p-6 sm:p-8 border border-white/12 space-y-4">
          <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-400" />
            <span>Dados Oficiais de Verificação da Plataforma</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
            <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-1">
              <span className="text-neutral-400 font-mono text-xs block">Nome da Plataforma</span>
              <span className="text-white font-semibold">Aethelkov (Aethel Cloud)</span>
            </div>
            <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-1">
              <span className="text-neutral-400 font-mono text-xs block">Domínio Principal Verificado</span>
              <span className="text-emerald-400 font-semibold font-mono">linkthelkov.online</span>
            </div>
            <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-1">
              <span className="text-neutral-400 font-mono text-xs block">Finalidade do Serviço</span>
              <span className="text-white font-semibold">Hospedagem 24/7 de bots e microsserviços</span>
            </div>
            <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-1">
              <span className="text-neutral-400 font-mono text-xs block">Processamento de Pagamento</span>
              <span className="text-white font-semibold">Mercado Pago Oficial (Pix Instantâneo)</span>
            </div>
          </div>
        </div>

        {/* Perguntas Frequentes (FAQ) */}
        <div className="apple-glass-card rounded-3xl p-6 sm:p-8 border border-white/12 space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400">
              <HelpCircle className="w-5 h-5" />
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-white">Dúvidas Frequentes (FAQ)</h2>
          </div>

          <div className="space-y-4 text-xs sm:text-sm">
            <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-1.5">
              <h3 className="font-semibold text-white">O serviço é gratuito para começar?</h3>
              <p className="text-neutral-400 leading-relaxed">
                Sim! Todo desenvolvedor cadastrado recebe cota gratuita de 100 MB de RAM dedicada com terminal em tempo real e monitoramento ativo sem necessidade de inserir cartão de crédito.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-1.5">
              <h3 className="font-semibold text-white">Como sei se o site linkthelkov.online é seguro?</h3>
              <p className="text-neutral-400 leading-relaxed">
                Nosso domínio opera com certificados SSL TLS 1.3 ponta a ponta emitidos e protegidos pela infraestrutura global da Vercel. Não armazenamos senhas de e-mails em texto aberto e seguimos estritamente as diretrizes da LGPD com isolamento total de processos.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-1.5">
              <h3 className="font-semibold text-white">Encontrei um site ou bot suspeito hospedado na plataforma, o que fazer?</h3>
              <p className="text-neutral-400 leading-relaxed">
                Envie imediatamente uma mensagem para <a href="mailto:abuse@linkthelkov.online" className="text-red-400 underline">abuse@linkthelkov.online</a> com a URL ou identificador do serviço. Nossa equipe suspende imediatamente aplicações que violem as políticas de segurança.
              </p>
            </div>
          </div>
        </div>
      </div>
    </InstitutionalLayout>
  );
}
