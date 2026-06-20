import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import {
  FileText,
  ShieldCheck,
  Calendar,
  Wallet,
  AlertCircle,
  HelpCircle,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Termos e Condições de Uso — Nzila',
  description:
    'Leia atentamente os Termos e Condições de Uso da Nzila, a plataforma líder em venda de bilhetes de autocarro interprovinciais em Angola.',
};

export default function TermosDeUsoPage() {
  const sections = [
    {
      title: '1. Introdução e Âmbito dos Serviços',
      icon: FileText,
      content: (
        <>
          <p className="text-muted-foreground leading-relaxed mb-3">
            Bem-vindo à plataforma **Nzila** (doravante designada por "Nzila", "Plataforma" ou "nós").
            Ao aceder ao nosso website, aplicação ou ao utilizar os nossos serviços de venda de bilhetes
            online, o utilizador (doravante "Cliente", "Passageiro" ou "Utilizador") aceita e compromete-se
            a cumprir na totalidade estes Termos e Condições de Uso.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            A Nzila atua como uma **plataforma agregadora e intermediária**. Nós ligamos os passageiros às
            diversas operadoras de transporte rodoviário licenciadas em Angola (ex: MACON, SGO, Translux,
            entre outras). Não somos proprietários de frotas de autocarros nem operamos rotas diretamente; a
            nossa responsabilidade é limitada à facilitação da reserva, venda e emissão do bilhete digital.
          </p>
        </>
      ),
      color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20',
    },
    {
      title: '2. Registo de Contas e Segurança',
      icon: ShieldCheck,
      content: (
        <>
          <p className="text-muted-foreground leading-relaxed mb-3">
            Para efetuar compras e gerir reservas, o utilizador pode registar-se na plataforma fornecendo
            dados pessoais válidos e atualizados, incluindo nome completo, endereço de correio eletrónico,
            número de telefone e documento de identificação (B.I. ou Passaporte).
          </p>
          <p className="text-muted-foreground leading-relaxed">
            O utilizador é inteiramente responsável por manter a confidencialidade das credenciais de acesso
            à sua conta e por todas as transações financeiras nela realizadas. Qualquer suspeita de uso não
            autorizado deve ser reportada de imediato ao nosso suporte em{' '}
            <a href="mailto:suporte@nzila.online" className="text-primary hover:underline font-bold">
              suporte@nzila.online
            </a>
            .
          </p>
        </>
      ),
      color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/20',
    },
    {
      title: '3. Política de Cancelamento e Pedidos de Reembolso',
      icon: Wallet,
      content: (
        <>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Em conformidade com a nossa arquitetura de gestão de ciclo de vida de bilhetes, os cancelamentos
            devem ser solicitados diretamente através da área do cliente, obedecendo às seguintes regras:
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="p-4 bg-muted/40 rounded-2xl border border-border">
              <h4 className="text-sm font-bold text-foreground flex items-center gap-1.5 mb-2">
                <Clock size={16} className="text-emerald-600" />
                Mais de 24 horas antes da Partida
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                O cliente tem direito ao **reembolso integral (100%)** do preço da passagem. O valor é creditado de forma imediata na sua Carteira Virtual (Wallet) para utilização em futuras viagens.
              </p>
            </div>
            <div className="p-4 bg-muted/40 rounded-2xl border border-border">
              <h4 className="text-sm font-bold text-foreground flex items-center gap-1.5 mb-2">
                <Clock size={16} className="text-amber-600" />
                Menos de 24 horas antes da Partida
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Sujeito às políticas específicas de retenção de cada transportadora parceira. Como regra geral ou fallback, aplica-se uma **taxa de retenção administrativa de 50%**, sendo os restantes 50% creditados na Carteira Virtual.
              </p>
            </div>
          </div>

          <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-xs text-amber-800 dark:text-amber-300 space-y-2">
            <h5 className="font-bold flex items-center gap-1.5">
              <AlertCircle size={14} />
              Processo de Aprovação em Dois Passos:
            </h5>
            <p className="leading-relaxed">
              Ao solicitar o cancelamento, o estado do seu bilhete passa para <strong>PENDENTE_CANCELAMENTO</strong>. O administrador do sistema analisará a solicitação com base nos horários oficiais de partida e procederá à aprovação e lançamento financeiro. Viagens iniciadas ou com menos de 3h para a partida não são elegíveis para reembolso.
            </p>
          </div>
        </>
      ),
      color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20',
    },
    {
      title: '4. Regras Estritas de Remarcação (Alteração de Viagem)',
      icon: Calendar,
      content: (
        <>
          <p className="text-muted-foreground leading-relaxed mb-3">
            Caso o utilizador deseje alterar a data ou a hora da sua viagem, poderá utilizar o botão de
            remarcação disponível junto à sua reserva ativa no painel do cliente.
          </p>
          <p className="text-muted-foreground leading-relaxed mb-3">
            Para garantir a estabilidade das operações e respeitar os acordos contratuais das operadoras:
            <strong className="text-foreground block mt-2">
              • A nova viagem selecionada deve obrigatoriamente pertencer à MESMA transportadora parceira do bilhete original.
            </strong>
            Não é permitido transferir bilhetes entre operadoras distintas (ex: alterar um bilhete da MACON para a Translux).
          </p>
          <p className="text-muted-foreground leading-relaxed">
            Se a nova viagem selecionada for de valor superior, a plataforma exigirá o pagamento da diferença
            tarifária antes de concluir a remarcação. Se for de valor inferior, a diferença a favor será
            creditada automaticamente na sua Carteira Virtual sob a forma de saldo.
          </p>
        </>
      ),
      color: 'text-purple-600 bg-purple-50 dark:bg-purple-950/20',
    },
    {
      title: '5. Cancelamento Operacional pela Transportadora',
      icon: AlertCircle,
      content: (
        <>
          <p className="text-muted-foreground leading-relaxed mb-3">
            Se uma operadora de transportes for forçada a cancelar uma partida devido a falhas operacionais,
            problemas mecânicos, intempéries ou motivos de força maior, todos os passageiros afetados serão
            isentos de quaisquer taxas administrativas.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            Neste cenário, a viagem é declarada cancelada pelo operador, e o valor do bilhete é reembolsado a **100% (integralmente)** na Carteira Virtual do cliente. Uma notificação eletrónica e SMS de alerta serão emitidos imediatamente contendo as explicações e o comprovativo de reembolso.
          </p>
        </>
      ),
      color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/20',
    },
    {
      title: '6. Contactos e Resolução de Litígios',
      icon: HelpCircle,
      content: (
        <>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Para qualquer esclarecimento adicional sobre estes Termos de Uso, dúvidas sobre transações, reclamações de embarque ou problemas técnicos, contacte o suporte oficial da Nzila:
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 p-4 bg-muted/30 border border-border rounded-2xl flex items-center gap-3">
              <span className="p-2.5 bg-primary/10 text-primary rounded-xl">📧</span>
              <div>
                <span className="block text-[10px] text-muted-foreground font-black uppercase">E-mail de Suporte</span>
                <a href="mailto:suporte@nzila.online" className="text-sm font-bold text-foreground hover:underline">
                  suporte@nzila.online
                </a>
              </div>
            </div>
            <div className="flex-1 p-4 bg-muted/30 border border-border rounded-2xl flex items-center gap-3">
              <span className="p-2.5 bg-primary/10 text-primary rounded-xl">📞</span>
              <div>
                <span className="block text-[10px] text-muted-foreground font-black uppercase">Telefone de Apoio</span>
                <span className="text-sm font-bold text-foreground">
                  +244 934 266 089
                </span>
              </div>
            </div>
          </div>
        </>
      ),
      color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/20',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 pt-24 lg:pt-28 pb-16">
        {/* Header Hero Section */}
        <section className="relative overflow-hidden py-16 bg-gradient-to-b from-primary/10 via-background to-background">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
            <div className="absolute top-1/2 -left-20 w-80 h-80 rounded-full bg-blue-500/5 blur-3xl" />
          </div>

          <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="inline-flex items-center gap-1.5 bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full mb-6">
              <FileText size={12} />
              <span>Regulamentos Gerais</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight leading-tight mb-4">
              Termos e Condições de Uso
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto font-medium">
              Por favor, leia estes termos com atenção antes de utilizar a nossa plataforma. Ao reservar ou
              comprar passagens no Nzila, concorda com as políticas descritas abaixo.
            </p>
            <div className="text-[10px] text-muted-foreground/80 mt-4 font-mono font-bold">
              Última Atualização: 20 de Junho de 2026
            </div>
          </div>
        </section>

        {/* Content Section */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-card border border-border rounded-3xl p-6 lg:p-10 shadow-xs space-y-10">
            {sections.map((section, idx) => {
              const Icon = section.icon;
              return (
                <div key={idx} className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl ${section.color}`}>
                      <Icon size={20} />
                    </div>
                    <h2 className="text-lg lg:text-xl font-extrabold text-foreground tracking-tight">
                      {section.title}
                    </h2>
                  </div>
                  <div className="pl-0 sm:pl-14 text-sm leading-relaxed text-muted-foreground">
                    {section.content}
                  </div>
                  {idx < sections.length - 1 && (
                    <hr className="border-border/60 mt-8" />
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Footer CTA */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 text-center">
          <p className="text-xs text-muted-foreground font-medium">
            Precisa de uma versão impressa ou quer esclarecer alguma cláusula?
          </p>
          <a
            href="mailto:suporte@nzila.online"
            className="text-xs font-bold text-primary hover:underline mt-1.5 inline-flex items-center gap-1"
          >
            Fale com a nossa equipa jurídica
            <ArrowRight size={12} />
          </a>
        </section>
      </main>

      <Footer />
    </div>
  );
}
