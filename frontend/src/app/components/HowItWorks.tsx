import React from 'react';
import { Search, MousePointerClick, CreditCard, QrCode } from 'lucide-react';

const steps = [
  {
    key: 'step-1',
    number: '01',
    icon: Search,
    title: 'Pesquise a sua Viagem',
    description:
      'Insira a origem, destino e data. Veja todas as opções disponíveis com preços e horários.',
    color: 'bg-primary/10 text-primary',
    borderColor: 'border-primary/20',
  },
  {
    key: 'step-2',
    number: '02',
    icon: MousePointerClick,
    title: 'Escolha o seu Lugar',
    description:
      'Selecione o assento preferido no mapa visual do autocarro. Económica, Executiva ou VIP.',
    color: 'bg-warning/10 text-warning',
    borderColor: 'border-warning/20',
  },
  {
    key: 'step-3',
    number: '03',
    icon: CreditCard,
    title: 'Pague com Segurança',
    description:
      'Multicaixa Express, Unitel Money, PayPay ou referência bancária. Rápido e protegido.',
    color: 'bg-success/10 text-success',
    borderColor: 'border-success/20',
  },
  {
    key: 'step-4',
    number: '04',
    icon: QrCode,
    title: 'Receba o Bilhete Digital',
    description: 'QR Code único enviado ao seu email. Apresente no embarque. Sem papel necessário.',
    color: 'bg-violet-100 text-violet-600',
    borderColor: 'border-violet-200',
  },
];

export default function HowItWorks() {
  return (
    <section className="py-14 lg:py-20 bg-card border-y border-border" id="como-funciona">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">
        <div className="text-center mb-10 lg:mb-14">
          <p className="text-primary text-sm font-semibold uppercase tracking-wider mb-2">
            Simples e Rápido
          </p>
          <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-3">Como Funciona</h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Reserve a sua viagem em 4 passos simples. Todo o processo demora menos de 5 minutos.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 relative">
          {steps?.map((step, idx) => {
            const Icon = step?.icon;
            return (
              <div key={step?.key} className="relative flex flex-col items-center text-center">
                {/* Connector line */}
                {idx < steps?.length - 1 && (
                  <div className="hidden lg:block absolute top-10 left-1/2 w-full h-0.5 bg-gradient-to-r from-border to-transparent z-0" />
                )}
                <div
                  className={`relative z-10 w-20 h-20 rounded-2xl ${step?.color} border-2 ${step?.borderColor} flex items-center justify-center mb-5 shadow-sm`}
                >
                  <Icon size={28} />
                  <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-foreground text-background text-xs font-bold flex items-center justify-center">
                    {idx + 1}
                  </div>
                </div>
                <h3 className="text-base font-semibold text-foreground mb-2">{step?.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step?.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
