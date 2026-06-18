'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, Clock, TrendingUp } from 'lucide-react';

export default function PopularRoutes() {
  const [routes, setRoutes] = useState<any[]>([]);

  useEffect(() => {
    async function fetchPopularRoutes() {
      try {
        const res = await fetch('/api/public/popular-routes/');
        if (!res.ok) throw new Error('API Error');
        const data = await res.json();
        const mapped = data.map((r: any) => ({
          key: `route-db-${r.id}`,
          origin: r.origin,
          destination: r.destination,
          duration: r.duracao,
          priceFrom: parseFloat(r.preco_desde),
          trending: r.trending,
          frequency: r.frequencia,
          image: r.imagem ? (r.imagem.startsWith('http') ? r.imagem : `${r.imagem}`) : '',
          gradient: 'bg-gradient-to-br from-blue-500 to-blue-700', // default gradient fallback
        }));
        setRoutes(mapped);
      } catch (err) {
        console.warn('Could not fetch popular routes from API:', err);
      }
    }
    fetchPopularRoutes();
  }, []);

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
          {routes?.map((route) => (
            <Link
              key={route?.key}
              href={`/results-page?origin=${encodeURIComponent(route?.origin)}&destination=${encodeURIComponent(route?.destination)}`}
              className="group bg-card border border-border rounded-2xl overflow-hidden card-hover block"
            >
              {/* Image Banner */}
              <div className="h-28 relative overflow-hidden bg-muted">
                {route?.image ? (
                  <img
                    src={route?.image}
                    alt={`${route?.origin} para ${route?.destination}`}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div
                    className={`w-full h-full ${route?.gradient || 'bg-gradient-to-br from-blue-500 to-blue-700'}`}
                  />
                )}
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
