import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Shield, Sparkles, Compass, Users, Globe, Mail, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sobre Nós — Nzila',
  description:
    'Saiba mais sobre a nossa missão de transformar a mobilidade e o transporte interprovincial em Angola, e conheça o corpo administrativo por trás da Nzila.',
};

const teamMembers = [
  {
    name: 'Arnaldo Francisco',
    role: 'Director Geral & Co-Fundador',
    image: '/assets/people/ArnaldoFrancisco.png',
    bio: 'Visionário com foco em desmaterialização de processos e criação de soluções de mobilidade nacional. Lidera a estratégia global e o crescimento da plataforma Nzila.',
    linkedin: '#',
    email: 'arnaldo.francisco@epia.com',
  },
  {
    name: 'Jordan Pedro',
    role: 'Director de Tecnologia (CTO) & Co-Fundador',
    image: '/assets/people/JordanPedro.jpeg',
    bio: 'Engenheiro de Software e inteligência de dados. Lidera o desenvolvimento e inovação tecnológica na plataforma.',
    linkedin: 'https://www.linkedin.com/in/jordan-pedro-a9b009351?utm_source=share_via&utm_content=profile&utm_medium=member_android',
    email: 'jordanpedro2005@gmail.com',
  },
  {
    name: 'Fadário Sabino',
    role: 'Director de Tecnologia Adjunto',
    image: '/assets/people/FadarioSabino.jpeg',
    bio: 'Especialista em segurança de informação, arquitetura de sistemas escaláveis distribuídos. ',
    linkedin: 'https://www.linkedin.com/me?trk=p_mwlite_feed-secondary_nav',
    email: 'fadario.sabino11@gmail.com',
  },
  {
    name: 'Nsimba Suami',
    role: 'Director de Operações (COO)',
    image: '/assets/people/NsimbaSuami.jpeg',
    bio: 'Especialista em gestão logística e parcerias corporativas. Garante a perfeita integração com as operadoras de transporte rodoviário e a excelência no atendimento ao passageiro.',
    linkedin: '#',
    email: 'nsimba.suami@nzila.ao',
  },
];

const values = [
  {
    title: 'Segurança & Confiança',
    description: 'Trabalhamos exclusivamente com transportadoras licenciadas e seguras. As suas viagens e transações financeiras são totalmente protegidas.',
    icon: Shield,
    color: 'text-emerald-600 bg-emerald-50',
  },
  {
    title: 'Inovação Contínua',
    description: 'Desenvolvemos soluções tecnológicas de ponta — bilhetes digitais com QR Code e confirmação automática — para simplificar a sua vida.',
    icon: Sparkles,
    color: 'text-blue-600 bg-blue-50',
  },
  {
    title: 'Conectividade Nacional',
    description: 'Encurtamos as distâncias entre as 18 províncias de Angola, facilitando a circulação de pessoas e bens de forma integrada e transparente.',
    icon: Compass,
    color: 'text-purple-600 bg-purple-50',
  },
];

export default function SobreNosPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 pt-24 lg:pt-28 pb-16">
        {/* Hero Section */}
        <section className="relative overflow-hidden py-16 lg:py-24 bg-gradient-to-b from-primary/10 via-background to-background">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
            <div className="absolute top-1/2 -left-20 w-80 h-80 rounded-full bg-blue-500/5 blur-3xl" />
          </div>

          <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="inline-flex items-center gap-1.5 bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full mb-6">
              <Users size={12} />
              <span>A Nossa História</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-black text-foreground tracking-tight leading-tight mb-6">
              Ligamos as províncias de Angola <br />
              <span className="text-primary">de forma rápida e moderna</span>
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto">
              O Nzila nasceu de uma necessidade real: tornar a reserva de viagens terrestres interprovinciais simples, fiável e acessível a qualquer pessoa, a partir de qualquer lugar.
            </p>
          </div>
        </section>

        {/* Our Purpose & Mission / Vision */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl font-extrabold text-foreground tracking-tight">
                A nossa missão é encurtar distâncias e unir famílias
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Diariamente, milhares de angolanos viajam por via rodoviária entre as nossas belas províncias. A nossa missão é fornecer uma plataforma tecnológica estável que conecta os passageiros às maiores frotas do país de forma transparente, eliminando filas nas agências e incertezas nas viagens.
              </p>
              
              <div className="space-y-3">
                {[
                  'Compra rápida de passagens sem sair de casa.',
                  'Acesso a várias operadoras rodoviárias numa única plataforma.',
                  'Pagamentos seguros via Referência Multicaixa e Express.',
                  'Emissão imediata de bilhetes digitais com validação via QR Code.'
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <CheckCircle2 className="text-primary flex-shrink-0" size={20} />
                    <span className="text-sm font-medium text-foreground">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative rounded-3xl overflow-hidden shadow-2xl h-80 lg:h-[420px] group bg-emerald-900 flex items-center justify-center">
              {/* Decorative dynamic graphics */}
              <div className="absolute inset-0 bg-gradient-to-tr from-emerald-950/90 to-primary/40 z-10" />
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent group-hover:scale-110 transition-transform duration-700" />
              <div className="relative z-20 text-center p-8">
                <p className="text-5xl font-black text-white mb-2">20</p>
                <p className="text-sm font-bold tracking-widest text-emerald-200 uppercase mb-6">Províncias Conectadas</p>
                <p className="text-white/80 max-w-md mx-auto italic">
                  "Facilitando o comércio, o turismo e o reencontro familiar de Cabinda ao Cunene."
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="bg-card border-y border-border/60 py-16 my-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <h2 className="text-3xl font-extrabold text-foreground">Os Nossos Valores</h2>
              <p className="text-muted-foreground mt-2">Os pilares que sustentam a nossa plataforma e a nossa relação com os passageiros.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {values.map((v, idx) => {
                const IconComponent = v.icon;
                return (
                  <div key={idx} className="bg-background border border-border/80 rounded-2xl p-6 transition-all duration-300 hover:shadow-lg">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${v.color} mb-5`}>
                      <IconComponent size={24} />
                    </div>
                    <h3 className="text-lg font-bold text-foreground mb-2">{v.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{v.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Administrative Council (Team) Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
              Corpo Administrativo
            </h2>
            <p className="text-muted-foreground mt-3 text-base">
              Conheça os líderes e fundadores dedicados a reinventar a mobilidade terrestre interprovincial em Angola.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {teamMembers.map((member, index) => (
              <div 
                key={index} 
                className="bg-card border border-border/80 rounded-2xl overflow-hidden shadow-card transition-all duration-300 hover:shadow-card-hover group"
              >
                {/* Image Wrapper */}
                <div className="relative h-80 bg-muted w-full overflow-hidden">
                  <Image
                    src={member.image}
                    alt={member.name}
                    fill
                    sizes="(max-w-728px) 100vw, 33vw"
                    className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                    <div className="flex gap-2">
                      <Link
                        href={member.linkedin}
                        className="w-8 h-8 rounded-full bg-white/20 hover:bg-primary text-white flex items-center justify-center backdrop-blur-sm transition-colors"
                        title="Website / Portfólio"
                      >
                        <Globe size={14} />
                      </Link>
                      <a
                        href={`mailto:${member.email}`}
                        className="w-8 h-8 rounded-full bg-white/20 hover:bg-primary text-white flex items-center justify-center backdrop-blur-sm transition-colors"
                        title="Enviar Email"
                      >
                        <Mail size={14} />
                      </a>
                    </div>
                  </div>
                </div>

                {/* Info */}
                <div className="p-6">
                  <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                    {member.name}
                  </h3>
                  <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-4">
                    {member.role}
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {member.bio}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Call To Action */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-24">
          <div className="bg-gradient-to-r from-primary to-accent rounded-3xl p-8 lg:p-12 text-center text-white relative overflow-hidden shadow-xl">
            <div className="absolute -bottom-16 -right-16 w-64 h-64 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute -top-16 -left-16 w-64 h-64 rounded-full bg-white/10 blur-2xl" />

            <div className="relative z-10 max-w-2xl mx-auto">
              <h2 className="text-2xl sm:text-3xl font-extrabold mb-4">Quer saber mais sobre as nossas parcerias?</h2>
              <p className="text-white/85 text-sm sm:text-base mb-8">
                Se é uma operadora rodoviária e gostaria de integrar as suas rotas no Nzila, fale diretamente com a nossa equipa operacional.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/sign-up-login-screen"
                  className="bg-white text-primary px-6 py-3 rounded-xl font-bold hover:bg-emerald-50 active:scale-95 transition-all text-sm inline-flex items-center justify-center gap-2 shadow-md"
                >
                  Criar Conta Parceiro
                  <ArrowRight size={14} />
                </Link>
                <a
                  href="mailto:parcerias@nzila.ao"
                  className="bg-transparent border border-white/40 hover:border-white text-white px-6 py-3 rounded-xl font-bold hover:bg-white/5 transition-all text-sm inline-flex items-center justify-center"
                >
                  Contactar Operações
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
