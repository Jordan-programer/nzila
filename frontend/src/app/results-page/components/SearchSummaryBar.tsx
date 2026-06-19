'use client';

import React from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowRight, Calendar, Pencil } from 'lucide-react';

export default function SearchSummaryBar() {
  const searchParams = useSearchParams();
  const origin = searchParams.get('origem') || searchParams.get('origin') || '';
  const destination = searchParams.get('destino') || searchParams.get('destination') || '';
  const date = searchParams.get('data') || '';
  const returnDate = searchParams.get('volta') || '';
  const travelClass = searchParams.get('classe') || 'economica';
  const tripType = searchParams.get('tipo') || 'ida';

  const classLabels: Record<string, string> = {
    economica: 'Económica',
    executiva: 'Executiva',
    vip: 'VIP',
  };

  const formatDate = (d: string) => {
    if (!d) return '';
    const parts = d.split('-');
    if (parts.length !== 3) return d;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  };

  return (
    <div className="bg-primary text-primary-foreground">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-sm">
            <div className="flex items-center gap-2 font-semibold text-base">
              <span>{origin}</span>
              <ArrowRight size={16} />
              <span>{destination}</span>
            </div>
            <span className="hidden sm:block text-white/40">•</span>
            <div className="flex items-center gap-1.5 text-white/80">
              <Calendar size={14} />
              <span>{formatDate(date)}</span>
              {tripType === 'ida-volta' && returnDate && <span>→ {formatDate(returnDate)}</span>}
            </div>
            <span className="hidden sm:block text-white/40">•</span>
            <span className="text-white/80">{classLabels[travelClass] || travelClass}</span>
            <span className="hidden sm:block text-white/40">•</span>
            <span className="text-white/80">
              {tripType === 'ida-volta' ? 'Ida e Volta' : 'Apenas Ida'}
            </span>
          </div>
          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm font-medium bg-white/15 hover:bg-white/25 px-3 py-1.5 rounded-lg transition-colors duration-150 flex-shrink-0"
          >
            <Pencil size={14} />
            Modificar pesquisa
          </Link>
        </div>
      </div>
    </div>
  );
}
