import React from 'react';
import { Star, MapPin } from 'lucide-react';

const carriers = [
  {
    key: 'carrier-macon',
    name: 'Macon Transportes',
    shortName: 'MACON',
    rating: 4.7,
    reviews: 1243,
    routes: 18,
    color: 'bg-blue-600',
    textColor: 'text-white',
    description: 'Líder em transporte interprovincial desde 1998. Frota moderna e climatizada.',
  },
  {
    key: 'carrier-sgo',
    name: 'SGO Express',
    shortName: 'SGO',
    rating: 4.5,
    reviews: 876,
    routes: 12,
    color: 'bg-green-600',
    textColor: 'text-white',
    description: 'Especialista em rotas do sul de Angola. Conforto e pontualidade garantidos.',
  },
  {
    key: 'carrier-translux',
    name: 'Translux Angola',
    shortName: 'TRANSLUX',
    rating: 4.8,
    reviews: 2156,
    routes: 24,
    color: 'bg-orange-600',
    textColor: 'text-white',
    description: 'A maior rede de rotas em Angola. Serviço VIP disponível em todas as rotas.',
  },
  {
    key: 'carrier-unitrans',
    name: 'Unitrans Angola',
    shortName: 'UNITRANS',
    rating: 4.4,
    reviews: 654,
    routes: 9,
    color: 'bg-purple-600',
    textColor: 'text-white',
    description: 'Especializada em rotas do norte. Frota renovada com Wi-Fi a bordo.',
  },
];

export default function FeaturedCarriers() {
  return (
    <section className="py-14 lg:py-20 bg-background">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">
        <div className="text-center mb-10">
          <p className="text-primary text-sm font-semibold uppercase tracking-wider mb-2">
            Parceiros
          </p>
          <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-3">
            Transportadoras Parceiras
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Trabalhamos com as melhores empresas de transporte de Angola.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {carriers?.map((carrier) => (
            <div
              key={carrier?.key}
              className="bg-card border border-border rounded-2xl overflow-hidden card-hover"
            >
              {/* Logo area */}
              <div className={`${carrier?.color} h-20 flex items-center justify-center`}>
                <span className={`text-2xl font-black ${carrier?.textColor} tracking-wide`}>
                  {carrier?.shortName}
                </span>
              </div>

              <div className="p-4">
                <h3 className="font-semibold text-foreground text-sm mb-1">{carrier?.name}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                  {carrier?.description}
                </p>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Star size={12} className="text-warning fill-warning" />
                    <span className="font-semibold text-foreground">{carrier?.rating}</span>
                    <span>({carrier?.reviews?.toLocaleString('pt-AO')})</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin size={12} />
                    <span>{carrier?.routes} rotas</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
