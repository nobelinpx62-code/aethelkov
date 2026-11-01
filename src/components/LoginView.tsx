'use client';

import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle,
  Zap,
  ShieldCheck,
  TrendingUp,
  HardDrive,
  Sparkles,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface LoginViewProps {
  onBackToPresentation: () => void;
  onLoginSuccess: () => void;
}

const DiscordIcon = () => (
  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.893.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
  </svg>
);

export const LoginView: React.FC<LoginViewProps> = ({ 
  onBackToPresentation, 
  onLoginSuccess 
}) => {
  // Estado do Carrossel do Lado Esquerdo
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Estados do Formulário de Login/Cadastro
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [discordLoading, setDiscordLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Slides do Carrossel
  const slides = [
    {
      badge: 'Deploy Relâmpago',
      badgeColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
      title: 'Aplicação ligada em instantes pós upload',
      description: 'Envie seu arquivo .zip ou aethel.config e veja seu bot responder imediatamente. Zero burocracia, zero configuração de VPS manual e sem filas de espera.',
      metrics: [
        { label: 'Tempo de Inicialização', value: '< 2 segundos' },
        { label: 'Formato Suportado', value: 'ZIP ou Config' }
      ],
      icon: <Zap className="w-8 h-8 text-emerald-400" />,
      accentGradient: 'from-emerald-500/20 via-transparent to-transparent'
    },
    {
      badge: 'Hospedagem 24/7',
      badgeColor: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
      title: 'Alta Disponibilidade & Monitoramento Ativo',
      description: 'Seu bot não dorme. Nossa malha conta com heartbeat constante, recuperação instantânea de falhas e loop de eventos redundante para manter sua presença ininterrupta.',
      metrics: [
        { label: 'Disponibilidade (SLA)', value: '99.98%' },
        { label: 'Loop de Sync', value: '0.8s contínuo' }
      ],
      icon: <ShieldCheck className="w-8 h-8 text-cyan-400" />,
      accentGradient: 'from-cyan-500/20 via-transparent to-transparent'
    },
    {
      badge: 'Performance Máxima',
      badgeColor: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30',
      title: 'A infraestrutura mais rápida do mundo',
      description: 'Arquitetura com Runner Core otimizado e despacho de eventos ultrarrápido. Seus comandos slash no Discord e mensagens no Telegram respondem com latência imperceptível.',
      metrics: [
        { label: 'Latência do Runner', value: '< 20 ms' },
        { label: 'Processamento', value: 'AMD Epyc Core' }
      ],
      icon: <TrendingUp className="w-8 h-8 text-indigo-400" />,
      accentGradient: 'from-indigo-500/20 via-transparent to-transparent'
    },
    {
      badge: '100% Gratuito',
      badgeColor: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
      title: 'Cota de 100 MB de RAM Dedicada',
      description: 'Cada usuário conta com 100 MB de cota estrita para hospedar suas aplicações com sandbox isolada, proteção contra travamentos e controle em tempo real.',
      metrics: [
        { label: 'Cota Inicial', value: '100 MB RAM' },
        { label: 'Isolamento', value: '100% Sandbox' }
      ],
      icon: <HardDrive className="w-8 h-8 text-purple-400" />,
      accentGradient: 'from-purple-500/20 via-transparent to-transparent'
    },
    {
      badge: 'Curiosidades & Controle',
      badgeColor: 'text-pink-400 bg-pink-500/10 border-pink-500/30',
      title: 'Painel com Estética Apple Liquid Glass',
      description: 'Acesse terminal interativo com console em tempo real, streaming de logs ao vivo com filtros inteligentes, editor de código integrado e controle de variáveis seguras.',
      metrics: [
        { label: 'Interface', value: 'Apple Glass UI' },
        { label: 'Controles', value: '10 Funções Pro' }
      ],
      icon: <Sparkles className="w-8 h-8 text-pink-400" />,
      accentGradient: 'from-pink-500/20 via-transparent to-transparent'
    }
  ];

  // Auto-play suave a cada 5 segundos
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isPaused, slides.length]);

  // Login com Discord OAuth2
  const handleDiscordLogin = async () => {
    setDiscordLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'discord',
        options: {
          redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/` : undefined,
          scopes: 'identify email guilds',
        },
      });

      if (error) throw error;
    } catch (err: any) {
      setErrorMessage(err.message || 'Falha ao autenticar com o Discord.');
      setDiscordLoading(false);
    }
  };

  // Autenticação com Email e Senha
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email.trim() || !password) {
      setErrorMessage('Preencha seu e-mail e senha.');
      return;
    }

    if (authMode === 'signup') {
      if (password.length < 6) {
        setErrorMessage('A senha precisa ter no mínimo 6 caracteres.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMessage('As senhas digitadas não coincidem.');
        return;
      }
    }

    setLoading(true);

    try {
      if (authMode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
          },
        });

        if (error) throw error;

        if (data?.user && !data.session) {
          setSuccessMessage('Conta criada com sucesso! Enviamos um link de confirmação para o seu e-mail. Confirme para ativar o acesso.');
        } else {
          setSuccessMessage('Conta criada e autenticada com sucesso! Redirecionando...');
          setTimeout(() => {
            onLoginSuccess();
          }, 1000);
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) throw error;

        setSuccessMessage('Login efetuado com sucesso! Entrando no painel...');
        setTimeout(() => {
          onLoginSuccess();
        }, 800);
      }
    } catch (err: any) {
      let msg = err.message || 'Falha na autenticação.';
      if (msg.includes('Invalid login credentials')) {
        msg = 'E-mail ou senha incorretos. Verifique suas credenciais.';
      } else if (msg.includes('Email not confirmed')) {
        msg = 'Seu e-mail ainda não foi confirmado. Verifique sua caixa de entrada e clique no link de ativação.';
      } else if (msg.includes('User already registered')) {
        msg = 'Este e-mail já está cadastrado. Alterne para a aba "Entrar" para fazer login.';
      }
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full space-y-6 py-6 px-2 sm:px-4 animate-fadeIn">
      {/* Botão Superior para Voltar para a Apresentação */}
      <div className="max-w-6xl mx-auto w-full flex items-center justify-between">
        <button
          onClick={onBackToPresentation}
          className="inline-flex items-center gap-2 text-xs font-mono text-neutral-400 hover:text-white px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar para Apresentação da Plataforma</span>
        </button>
      </div>

      {/* Grade Principal Dividida: Carrossel à Esquerda & Quadrado de Login à Direita */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center max-w-6xl mx-auto w-full">
        
        {/* ========================================================
            LADO ESQUERDO: CARROSSEL DE CURIOSIDADES E DESTAQUES
           ======================================================== */}
        <div 
          className="lg:col-span-7 apple-glass-card rounded-[36px] p-6 sm:p-9 border border-white/15 relative overflow-hidden flex flex-col justify-between min-h-[500px] sm:min-h-[560px] shadow-[0_30px_70px_rgba(0,0,0,0.7)]"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <div className="glass-specular pointer-events-none absolute inset-x-12 top-0 h-[1.5px]"></div>
          
          <div className={`absolute inset-0 bg-gradient-to-br ${slides[currentSlide].accentGradient} opacity-60 pointer-events-none transition-all duration-700`}></div>

          {/* Cabeçalho do Carrossel */}
          <div className="relative z-10 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 border border-white/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)]">
                {slides[currentSlide].icon}
              </div>
              <span className={`inline-block px-3 py-0.5 rounded-full font-mono text-[11px] font-semibold uppercase tracking-wider border ${slides[currentSlide].badgeColor}`}>
                {slides[currentSlide].badge}
              </span>
            </div>

            {/* Controles de Navegação */}
            <div className="flex items-center gap-1.5 bg-black/40 p-1 rounded-full border border-white/10 backdrop-blur-md">
              <button
                onClick={() => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)}
                className="p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
                title="Slide anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentSlide((prev) => (prev + 1) % slides.length)}
                className="p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
                title="Próximo slide"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Conteúdo Central */}
          <div className="relative z-10 my-8 space-y-4">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-white leading-tight">
              {slides[currentSlide].title}
            </h2>
            <p className="text-sm sm:text-base text-neutral-300 font-sans leading-relaxed max-w-xl">
              {slides[currentSlide].description}
            </p>

            <div className="grid grid-cols-2 gap-3 pt-3">
              {slides[currentSlide].metrics.map((metric, idx) => (
                <div key={idx} className="apple-glass rounded-2xl p-3 sm:p-4 border border-white/10">
                  <span className="font-mono text-[10px] text-neutral-400 uppercase tracking-wider block mb-1">
                    {metric.label}
                  </span>
                  <span className="font-mono text-base sm:text-lg font-bold text-white">
                    {metric.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Rodapé do Carrossel com Indicadores */}
          <div className="relative z-10 pt-4 border-t border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {slides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    currentSlide === index 
                      ? 'w-8 bg-emerald-400 shadow-[0_0_8px_#34d399]' 
                      : 'w-2 bg-white/20 hover:bg-white/40'
                  }`}
                  title={`Slide ${index + 1}`}
                />
              ))}
            </div>

            <span className="font-mono text-[11px] text-neutral-400">
              {currentSlide + 1} de {slides.length}
            </span>
          </div>
        </div>

        {/* ========================================================
            LADO DIREITO: QUADRADO DE LOGIN & CADASTRO
           ======================================================== */}
        <div className="lg:col-span-5 apple-glass-card rounded-[36px] p-6 sm:p-8 border border-white/15 relative overflow-hidden shadow-[0_30px_70px_rgba(0,0,0,0.7)] flex flex-col justify-between">
          <div className="glass-specular pointer-events-none absolute inset-x-8 top-0 h-[1.5px]"></div>

          <div className="space-y-6">
            {/* Cabeçalho */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-xs font-semibold text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse"></span>
                  Aethel Auth
                </span>

                {/* Alternador Entrar / Criar Conta */}
                <div className="flex rounded-full bg-black/40 p-1 border border-white/10 font-mono text-xs">
                  <button
                    onClick={() => {
                      setAuthMode('login');
                      setErrorMessage(null);
                      setSuccessMessage(null);
                    }}
                    className={`px-3 py-1 rounded-full font-medium transition-all ${
                      authMode === 'login'
                        ? 'bg-white/20 text-white shadow-sm'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    Entrar
                  </button>
                  <button
                    onClick={() => {
                      setAuthMode('signup');
                      setErrorMessage(null);
                      setSuccessMessage(null);
                    }}
                    className={`px-3 py-1 rounded-full font-medium transition-all ${
                      authMode === 'signup'
                        ? 'bg-white/20 text-white shadow-sm'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    Criar Conta
                  </button>
                </div>
              </div>

              <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                {authMode === 'login' ? 'Acesse sua Conta' : 'Crie sua Conta Grátis'}
              </h3>
              <p className="text-xs text-neutral-400 mt-1 font-sans">
                {authMode === 'login' 
                  ? 'Entre para gerenciar seus bots, logs e telemetria 24/7.' 
                  : 'Ganhe 100 MB de cota e hospede suas aplicações em instantes.'}
              </p>
            </div>

            {/* BOTÃO PRINCIPAL: LOGIN COM DISCORD */}
            <div>
              <button
                type="button"
                onClick={handleDiscordLogin}
                disabled={discordLoading}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-2xl bg-[#5865F2] hover:bg-[#4752C4] active:scale-[0.98] text-white font-semibold text-sm transition-all shadow-[0_8px_20px_rgba(88,101,242,0.35)] disabled:opacity-50"
              >
                <DiscordIcon />
                <span>
                  {discordLoading ? 'Conectando ao Discord...' : 'Continuar com Discord'}
                </span>
              </button>
              <p className="font-mono text-[10px] text-neutral-400 text-center mt-1.5">
                Login oficial com 1 clique via Discord OAuth2
              </p>
            </div>

            {/* Separador */}
            <div className="relative flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
              </div>
              <span className="relative bg-[#0d0e14] px-3 font-mono text-[10px] tracking-wider text-neutral-400 uppercase">
                ou continue com e-mail
              </span>
            </div>

            {/* FORMULÁRIO DE E-MAIL E SENHA */}
            <form onSubmit={handleEmailAuth} className="space-y-3.5">
              <div>
                <label className="block font-mono text-[11px] text-neutral-300 mb-1">
                  Endereço de E-mail
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seuemail@exemplo.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-black/50 border border-white/10 text-white placeholder-neutral-500 text-xs font-mono focus:outline-none focus:border-cyan-400/50 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block font-mono text-[11px] text-neutral-300 mb-1">
                  Senha {authMode === 'signup' && <span className="text-neutral-500">(mínimo 6 caracteres)</span>}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 rounded-2xl bg-black/50 border border-white/10 text-white placeholder-neutral-500 text-xs font-mono focus:outline-none focus:border-cyan-400/50 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-neutral-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {authMode === 'signup' && (
                <div>
                  <label className="block font-mono text-[11px] text-neutral-300 mb-1">
                    Confirmar Senha
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-10 py-2.5 rounded-2xl bg-black/50 border border-white/10 text-white placeholder-neutral-500 text-xs font-mono focus:outline-none focus:border-cyan-400/50 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-neutral-400 hover:text-white"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="font-mono text-[10px] text-neutral-400 mt-1.5 flex items-center gap-1">
                    <span>📧</span>
                    <span>Enviaremos uma mensagem para confirmação do seu e-mail.</span>
                  </p>
                </div>
              )}

              {errorMessage && (
                <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono flex items-start gap-2 animate-fadeIn">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {successMessage && (
                <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono flex items-start gap-2 animate-fadeIn">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
                  <span>{successMessage}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-white text-black font-semibold text-xs uppercase tracking-wider hover:bg-neutral-200 active:scale-[0.98] transition-all shadow-[0_4px_16px_rgba(255,255,255,0.2)] disabled:opacity-50"
              >
                <span>
                  {loading 
                    ? 'Processando...' 
                    : authMode === 'login' 
                    ? 'Entrar no Painel' 
                    : 'Criar Minha Conta Grátis'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
