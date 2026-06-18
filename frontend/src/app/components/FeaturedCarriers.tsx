'use client';

import React, { useState, useEffect } from 'react';
import { Star, MapPin } from 'lucide-react';

export default function FeaturedCarriers() {
  const [carriers, setCarriers] = useState<any[]>([]);

  useEffect(() => {
    async function fetchCarriers() {
      try {
        const res = await fetch('/api/public/carriers/');
        if (!res.ok) throw new Error('API Error');
        const data = await res.json();
        const mapped = data.map((c: any) => ({
          key: `carrier-db-${c.id}`,
          name: c.nome,
          shortName: c.code || c.nome.substring(0, 3).toUpperCase(),
          rating: c.rating || 4.5,
          reviews: c.reviews || 100,
          routes: 10, // Default fallback count for routes
          color: c.color || 'bg-blue-600',
          textColor: 'text-white',
          description: c.descricao || 'Empresa parceira oficial da rede de transportes Nzila.',
          logo: c.logo_url || c.logo || '',
        }));
        setCarriers(mapped);
      } catch (err) {
        console.warn('Could not fetch carriers from API:', err);
      }
    }
    fetchCarriers();
  }, []);

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
              <div className="h-28 relative overflow-hidden bg-muted">
                {carrier?.logo ? (
                  <img
                    src={carrier?.logo}
                    alt={carrier?.name}
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                  />
                ) : (
                  <div
                    className={`absolute inset-0 ${carrier?.color || 'bg-blue-600'} flex items-center justify-center`}
                  >
                    <span className="text-2xl font-black text-white tracking-wide">
                      {carrier?.shortName}
                    </span>
                  </div>
                )}
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
