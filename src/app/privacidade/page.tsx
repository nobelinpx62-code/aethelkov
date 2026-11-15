import React from 'react';
import type { Metadata } from 'next';
import { InstitutionalLayout } from '@/components/InstitutionalLayout';
import { ShieldCheck, Lock, Database, UserCheck, EyeOff, Key } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Política de Privacidade & Proteção de Dados (LGPD/GDPR) | Aethelkov',
  description: 'Política de Privacidade da Aethelkov (linkthelkov.online). Compromisso rigoroso de privacidade, criptografia AES-256 de credenciais e conformidade com a LGPD.',
  alternates: {
    canonical: 'https://linkthelkov.online/privacidade',
  },
};

export default function PrivacidadePage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Política de Privacidade da Aethelkov',
    url: 'https://linkthelkov.online/privacidade',
    description: 'Diretrizes de proteção e tratamento de dados pessoais em conformidade com a LGPD e GDPR na Aethelkov.',
  };

  return (
    <InstitutionalLayout
      activePath="/privacidade"
      badgeTitle="Privacidade & Segurança de Dados"
      pageTitle="Política de Privacidade"
      pageDescription="Última atualização: Novembro de 2026. Transparência absoluta sobre como seus dados e credenciais de bots são protegidos e tratados na Aethel Cloud."
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="space-y-8 text-neutral-300 text-sm sm:text-base leading-relaxed">
        {/* Compromisso Fundamental */}
        <div className="apple-glass-card rounded-3xl p-6 sm:p-8 border border-white/12 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-white">1. Princípio Fundamental de Sigilo</h2>
          </div>
          <p>
            A <strong>Aethelkov</strong> (operando no domínio oficial <code className="text-emerald-400 font-mono text-xs">linkthelkov.online</code>) foi estruturada com base no princípio de <em>Privacy by Design</em>. Não comercializamos, compartilhamos, mineramos ou monetizamos dados pessoais, tráfego de bots ou código-fonte de nossos desenvolvedores sob nenhuma circunstância.
          </p>
        </div>

        {/* Proteção de Tokens e Credenciais */}
        <div className="apple-glass-card rounded-3xl p-6 sm:p-8 border border-white/12 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400">
              <Key className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-white">2. Criptografia de Tokens e Variáveis de Ambiente</h2>
          </div>
          <p>
            Entendemos que tokens de bots Discord e Telegram representam o coração da sua aplicação. Por isso:
          </p>
          <ul className="space-y-2.5 pl-2 text-xs sm:text-sm">
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 font-bold">•</span>
              <span><strong>Criptografia em Repouso:</strong> Todas as variáveis sensíveis e tokens são armazenados com encriptação AES-256 no banco de dados.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 font-bold">•</span>
              <span><strong>Zero Leitura por Operadores:</strong> Membros da equipe de suporte e nós adjacentes não possuem acesso a tokens em texto puro.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 font-bold">•</span>
              <span><strong>Injeção Segura no Container:</strong> As credenciais são injetadas estritamente em tempo de execução dentro do ambiente isolado da sua aplicação.</span>
            </li>
          </ul>
        </div>

        {/* Quais dados coletamos */}
        <div className="apple-glass-card rounded-3xl p-6 sm:p-8 border border-white/12 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400">
              <Database className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-white">3. Dados Coletados e Finalidade</h2>
          </div>
          <p>Coletamos unicamente os dados indispensáveis para o fornecimento do serviço:</p>
          <ul className="space-y-2 pl-2 text-xs sm:text-sm">
            <li><strong>Autenticação:</strong> Endereço de e-mail ou identificador público da conta Discord (ID, nome de usuário e avatar público) via OAuth2.</li>
            <li><strong>Logs Operacionais:</strong> Saída do console (stdout / stderr) do seu bot, retida temporariamente para permitir seu diagnóstico técnico no painel.</li>
            <li><strong>Telemetria de Sistema:</strong> Consumo de memória RAM e CPU da sua aplicação para garantir o cumprimento das cotas estipuladas.</li>
            <li><strong>Pagamentos:</strong> Identificadores de transação Pix gerados pela API do Mercado Pago. Dados de pagamento sensíveis nunca transitam ou ficam armazenados em nossos servidores.</li>
          </ul>
        </div>

        {/* Direitos LGPD */}
        <div className="apple-glass-card rounded-3xl p-6 sm:p-8 border border-white/12 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-purple-500/15 border border-purple-500/30 text-purple-400">
              <UserCheck className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-white">4. Seus Direitos (LGPD Art. 18 / GDPR)</h2>
          </div>
          <p>
            Você é titular soberano de suas informações. A qualquer momento, você pode:
          </p>
          <ul className="space-y-2 pl-2 text-xs sm:text-sm">
            <li>• Confirmar a existência de tratamento de dados e acessar seus registros;</li>
            <li>• Solicitar a exclusão definitiva e irreversível de sua conta, código-fonte e backups de nossos discos;</li>
            <li>• Exportar seus arquivos e arquivos de configuração (<code className="text-emerald-400 font-mono">aethel.config</code>).</li>
          </ul>
        </div>

        {/* Contato do Encarregado */}
        <div className="apple-glass-card rounded-3xl p-6 sm:p-8 border border-white/12 space-y-3">
          <h2 className="text-lg font-bold text-white">5. Canal do Encarregado de Proteção de Dados (DPO)</h2>
          <p className="text-xs sm:text-sm text-neutral-300">
            Para exercer seus direitos de privacidade ou esclarecer dúvidas sobre o tratamento de dados pessoais, contate diretamente:
          </p>
          <p className="font-mono text-emerald-400 text-xs sm:text-sm">
            E-mail: privacidade@linkthelkov.online / suporte@linkthelkov.online
          </p>
        </div>
      </div>
    </InstitutionalLayout>
  );
}
