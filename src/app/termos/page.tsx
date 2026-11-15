import React from 'react';
import type { Metadata } from 'next';
import { InstitutionalLayout } from '@/components/InstitutionalLayout';
import { FileText, ShieldAlert, CheckCircle, AlertTriangle, Scale, Mail } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Termos de Uso e Serviço — Diretrizes Oficiais | Aethelkov',
  description: 'Leia os Termos de Uso e Condições de Serviço da plataforma Aethelkov (linkthelkov.online). Regras de uso aceitável, diretrizes de segurança e políticas contra abuso.',
  alternates: {
    canonical: 'https://linkthelkov.online/termos',
  },
};

export default function TermosPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Termos de Uso e Serviço da Aethelkov',
    url: 'https://linkthelkov.online/termos',
    description: 'Diretrizes de uso aceitável, segurança e prestação de serviços de hospedagem em nuvem da Aethelkov.',
  };

  return (
    <InstitutionalLayout
      activePath="/termos"
      badgeTitle="Legal & Diretrizes"
      pageTitle="Termos de Uso e Serviço"
      pageDescription="Última atualização: Novembro de 2026. Leia atentamente as condições que regem a utilização da infraestrutura da Aethel Cloud."
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="space-y-8 text-neutral-300 text-sm sm:text-base leading-relaxed">
        {/* Sumário Executivo */}
        <div className="apple-glass-card rounded-3xl p-6 sm:p-8 border border-white/12 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
              <Scale className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-white">1. Aceitação e Objeto</h2>
          </div>
          <p>
            Ao criar uma conta, utilizar nossa API ou realizar o deploy de qualquer código na plataforma <strong>Aethelkov</strong> (acessível via <code className="text-emerald-400 font-mono text-xs">linkthelkov.online</code>), você concorda integralmente com estes Termos de Serviço e com a nossa Política de Privacidade.
          </p>
          <p>
            A Aethelkov fornece serviços de execução de código em nuvem, orquestração de processos em contêineres e roteamento de tráfego para bots (Discord, Telegram) e aplicações web desenvolvidas por terceiros.
          </p>
        </div>

        {/* Uso Aceitável */}
        <div className="apple-glass-card rounded-3xl p-6 sm:p-8 border border-white/12 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-white">2. Política de Uso Aceitável (AUP)</h2>
          </div>
          <p>
            Nossa infraestrutura foi construída exclusivamente para desenvolvimento legítimo de software. É expressamente <strong>proibido e sujeito a cancelamento imediato sem reembolso</strong> o envio ou execução de qualquer aplicação destinada a:
          </p>
          <ul className="space-y-2.5 pl-2">
            <li className="flex items-start gap-2">
              <span className="text-red-400 font-bold">•</span>
              <span><strong>Phishing e Engenharia Social:</strong> Páginas clonadas de login, formulários para captura de credenciais ou simulação de instituições bancárias/governamentais.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-400 font-bold">•</span>
              <span><strong>Malware e Exploits:</strong> Cavalos de Troia, ransomware, keyloggers, crypters, backdoors ou scripts de controle de botnet.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-400 font-bold">•</span>
              <span><strong>Ataques de Rede (DDoS / DoS):</strong> Ferramentas de estresse de rede, SYN flood, amplificação UDP, scanners agressivos de portas ou ataques a terceiros.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-400 font-bold">•</span>
              <span><strong>Mineração de Criptomoedas:</strong> Scripts de mineração (CPU/GPU) ou processos de carga contínua artificial de hardware.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-400 font-bold">•</span>
              <span><strong>Violação de Termos das Plataformas:</strong> Desrespeito direto aos Termos de Desenvolvedores do Discord (Discord Developer Terms of Service) ou da Telegram Bot API.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-400 font-bold">•</span>
              <span><strong>Conteúdo Ilegal:</strong> Quaisquer materiais que violem a legislação brasileira (Marco Civil da Internet, Lei 12.965/2014) ou tratados internacionais de direitos humanos e propriedade intelectual.</span>
            </li>
          </ul>
        </div>

        {/* Responsabilidades e Chaves */}
        <div className="apple-glass-card rounded-3xl p-6 sm:p-8 border border-white/12 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400">
              <CheckCircle className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-white">3. Responsabilidade do Desenvolvedor</h2>
          </div>
          <p>
            O desenvolvedor é o único e exclusivo responsável pelo código-fonte, dados transitados e ações executadas por suas aplicações em nossa malha. A Aethelkov atua como provedora de infraestrutura intermediária e não monitora ativamente conteúdos privados, exceto quando acionada por mecanismos de segurança ou denúncias fundamentadas de abuso.
          </p>
          <p>
            O usuário deve manter sigilo sobre sua conta e suas chaves de API, abstendo-se de compartilhar tokens de acesso com terceiros não autorizados.
          </p>
        </div>

        {/* Planos e Pagamentos */}
        <div className="apple-glass-card rounded-3xl p-6 sm:p-8 border border-white/12 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
              <FileText className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-white">4. Recursos, Cotas e Pagamentos</h2>
          </div>
          <p>
            A plataforma disponibiliza um plano de cota base de 100 MB de memória RAM dedicada e opções de upgrade de recursos (adicionais de RAM e subdomínios personalizados) processados com segurança via Mercado Pago (Pix com compensação instantânea).
          </p>
          <p>
            Planos contratados concedem acesso aos recursos pelo período correspondente (30 dias ou renovação periódica). Caso o plano expire sem renovação, as instâncias excedentes à cota básica poderão ser suspensas temporariamente até a regularização.
          </p>
        </div>

        {/* Canal de Abuso e DMCA */}
        <div className="apple-glass-card rounded-3xl p-6 sm:p-8 border border-white/12 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-purple-500/15 border border-purple-500/30 text-purple-400">
              <Mail className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-white">5. Denúncias de Abuso, DMCA e Notificações</h2>
          </div>
          <p>
            Mantemos um procedimento rigoroso para tratamento de notificações de violação de direitos autorais (DMCA) ou abuso de rede. Caso acredite que um aplicativo hospedado em nossa infraestrutura viole seus direitos ou represente risco de fraude:
          </p>
          <div className="p-4 rounded-2xl bg-black/50 border border-white/10 font-mono text-xs sm:text-sm space-y-1">
            <p className="text-white font-bold">Canal Oficial de Resposta Rápida (Abuse & Takedown):</p>
            <p className="text-emerald-400">E-mail: abuse@linkthelkov.online</p>
            <p className="text-neutral-400">Tempo médio de análise e mitigação: inferior a 24 horas.</p>
          </div>
        </div>

        {/* Foro */}
        <div className="apple-glass-card rounded-3xl p-6 sm:p-8 border border-white/12 space-y-3">
          <h2 className="text-lg font-bold text-white">6. Legislação Aplicável e Foro</h2>
          <p className="text-xs sm:text-sm text-neutral-400">
            Estes Termos são regidos pelas leis da República Federativa do Brasil, em conformidade com o Marco Civil da Internet (Lei nº 12.965/2014) e a Lei Geral de Proteção de Dados (Lei nº 13.709/2018).
          </p>
        </div>
      </div>
    </InstitutionalLayout>
  );
}
