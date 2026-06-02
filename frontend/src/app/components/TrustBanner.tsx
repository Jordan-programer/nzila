import React from 'react';
import { Shield, Zap, Headphones, Award } from 'lucide-react';

const trustItems = [
  {
    key: 'trust-seguro',
    icon: Shield,
    title: 'Pagamento Seguro',
    description: 'Transações protegidas com criptografia SSL',
    color: 'text-success',
    bg: 'bg-success/10',
  },
  {
    key: 'trust-rapido',
    icon: Zap,
    title: 'Confirmação Imediata',
    description: 'Bilhete digital enviado em segundos',
    color: 'text-primary',
    bg: 'bg-primary/10',
  },
  {
    key: 'trust-suporte',
    icon: Headphones,
    title: 'Suporte 24/7',
    description: 'Equipe disponível para ajudar sempre',
    color: 'text-warning',
    bg: 'bg-warning/10',
  },
  {
    key: 'trust-confiavel',
    icon: Award,
    title: 'Plataforma Certificada',
    description: 'Reconhecida pelas melhores transportadoras',
    color: 'text-danger',
    bg: 'bg-danger/10',
  },
];

export default function TrustBanner() {
  return (
    <section className="bg-card border-b border-border">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {trustItems?.map(({ key, icon: Icon, title, description, color, bg }) => (
            <div key={key} className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}
              >
                <Icon size={20} className={color} />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{title}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
