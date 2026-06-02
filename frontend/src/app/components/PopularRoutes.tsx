import React from 'react';
import Link from 'next/link';
import { ArrowRight, Clock, TrendingUp } from 'lucide-react';

const popularRoutes = [
  {
    key: 'route-lda-hbo',
    origin: 'Luanda',
    destination: 'Huambo',
    duration: '8h 30min',
    priceFrom: 4500,
    trending: true,
    frequency: 'Diário',
    image: 'bg-gradient-to-br from-blue-500 to-blue-700',
  },
  {
    key: 'route-lda-bge',
    origin: 'Luanda',
    destination: 'Benguela',
    duration: '6h 00min',
    priceFrom: 3800,
    trending: true,
    frequency: 'Diário',
    image: 'bg-gradient-to-br from-indigo-500 to-indigo-700',
  },
  {
    key: 'route-lda-nam',
    origin: 'Luanda',
    destination: 'Namibe',
    duration: '12h 00min',
    priceFrom: 6200,
    trending: false,
    frequency: '3x por semana',
    image: 'bg-gradient-to-br from-sky-500 to-sky-700',
  },
  {
    key: 'route-hbo-lbo',
    origin: 'Huambo',
    destination: 'Lubango',
    duration: '5h 30min',
    priceFrom: 3200,
    trending: false,
    frequency: 'Diário',
    image: 'bg-gradient-to-br from-violet-500 to-violet-700',
  },
  {
    key: 'route-lda-mal',
    origin: 'Luanda',
    destination: 'Malanje',
    duration: '4h 00min',
    priceFrom: 2800,
    trending: true,
    frequency: 'Diário',
    image: 'bg-gradient-to-br from-emerald-500 to-emerald-700',
  },
  {
    key: 'route-lda-uig',
    origin: 'Luanda',
    destination: 'Uíge',
    duration: '5h 00min',
    priceFrom: 3100,
    trending: false,
    frequency: '2x por semana',
    image: 'bg-gradient-to-br from-amber-500 to-amber-700',
  },
];

export default function PopularRoutes() {
  return (
    <section className="py-14 lg:py-20 bg-background" id="destinos">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">
        <div className="flex items-end justify-between mb-8 lg:mb-10">
          <div>
            <p className="text-primary text-sm font-semibold uppercase tracking-wider mb-2">
              Destinos
            </p>
            <h2 className="text-2xl lg:text-3xl font-bold text-foreground">Rotas Mais Populares</h2>
            <p className="text-muted-foreground mt-2">As viagens mais procuradas pelos angolanos</p>
          </div>
          <Link
            href="/results-page"
            className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-primary hover:text-accent transition-colors"
          >
            Ver todas as rotas
            <ArrowRight size={16} />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-3 gap-4 lg:gap-5">
          {popularRoutes?.map((route) => (
            <Link
              key={route?.key}
              href="/results-page"
              className="group bg-card border border-border rounded-2xl overflow-hidden card-hover block"
            >
              {/* Color Banner */}
              <div className={`h-24 ${route?.image} relative`}>
                <div className="absolute inset-0 bg-black/20" />
                {route?.trending && (
                  <div className="absolute top-3 right-3 flex items-center gap-1 bg-warning text-warning-foreground text-xs font-semibold px-2 py-1 rounded-full">
                    <TrendingUp size={11} />
                    Popular
                  </div>
                )}
                <div className="absolute bottom-3 left-4 right-4">
                  <div className="flex items-center gap-2 text-white font-bold text-lg">
                    <span>{route?.origin}</span>
                    <ArrowRight size={18} className="opacity-80" />
                    <span>{route?.destination}</span>
                  </div>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock size={14} />
                      <span>{route?.duration}</span>
                    </div>
                    <span className="text-border">|</span>
                    <span>{route?.frequency}</span>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-muted-foreground">A partir de</span>
                    <div className="text-lg font-bold text-foreground tabular-nums">
                      {route?.priceFrom?.toLocaleString('pt-AO')} Kz
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-primary text-sm font-medium group-hover:gap-2 transition-all duration-150">
                    Ver viagens
                    <ArrowRight size={14} />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-6 text-center sm:hidden">
          <Link
            href="/results-page"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary"
          >
            Ver todas as rotas <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}
