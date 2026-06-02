'use client';

import React from 'react';
import { RotateCcw } from 'lucide-react';
import { FilterState } from './ResultsContent';
import { Trip, ALL_CARRIERS, ALL_CLASSES } from './mockTrips';

interface FiltersPanelProps {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  trips: Trip[];
}

const HORARIO_OPTIONS = [
  { value: 'manha', label: 'Manhã', sublabel: '05:00 – 11:59', key: 'hor-manha' },
  { value: 'tarde', label: 'Tarde', sublabel: '12:00 – 17:59', key: 'hor-tarde' },
  { value: 'noite', label: 'Noite', sublabel: '18:00 – 04:59', key: 'hor-noite' },
];

const CLASS_LABELS: Record<string, string> = {
  economica: 'Económica',
  executiva: 'Executiva',
  vip: 'VIP',
};

export default function FiltersPanel({ filters, setFilters, trips }: FiltersPanelProps) {
  const toggleArrayFilter = (key: keyof FilterState, value: string) => {
    setFilters((prev) => {
      const arr = prev[key] as string[];
      return {
        ...prev,
        [key]: arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value],
      };
    });
  };

  const resetFilters = () => {
    setFilters({
      priceMin: 0,
      priceMax: 20000,
      horarios: [],
      classes: [],
      carriers: [],
    });
  };

  const hasActiveFilters =
    filters.horarios.length > 0 ||
    filters.classes.length > 0 ||
    filters.carriers.length > 0 ||
    filters.priceMin > 0 ||
    filters.priceMax < 20000;

  // Count trips per carrier for display
  const carrierCounts: Record<string, number> = {};
  trips.forEach((t) => {
    carrierCounts[t.carrier] = (carrierCounts[t.carrier] || 0) + 1;
  });

  return (
    <div className="bg-card border border-border rounded-2xl filter-shadow overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-border">
        <h3 className="text-sm font-semibold text-foreground">Filtros</h3>
        {hasActiveFilters && (
          <button
            onClick={resetFilters}
            className="flex items-center gap-1 text-xs text-primary hover:text-accent font-medium transition-colors"
          >
            <RotateCcw size={12} />
            Limpar tudo
          </button>
        )}
      </div>

      <div className="p-4 space-y-5">
        {/* Price Range */}
        <div>
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Preço (AOA)
          </h4>
          <div className="flex items-center justify-between text-sm font-medium text-foreground mb-2 tabular-nums">
            <span>{filters.priceMin.toLocaleString('pt-AO')} Kz</span>
            <span>{filters.priceMax.toLocaleString('pt-AO')} Kz</span>
          </div>
          <input
            type="range"
            min={0}
            max={20000}
            step={500}
            value={filters.priceMax}
            onChange={(e) => setFilters((f) => ({ ...f, priceMax: Number(e.target.value) }))}
            className="w-full accent-primary"
          />
        </div>

        {/* Departure Time */}
        <div>
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Horário de Saída
          </h4>
          <div className="space-y-2">
            {HORARIO_OPTIONS.map((opt) => (
              <label key={opt.key} className="flex items-center gap-2.5 cursor-pointer group">
                <div
                  onClick={() => toggleArrayFilter('horarios', opt.value)}
                  className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all duration-150 cursor-pointer ${
                    filters.horarios.includes(opt.value)
                      ? 'bg-primary border-primary'
                      : 'border-input group-hover:border-primary'
                  }`}
                >
                  {filters.horarios.includes(opt.value) && (
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                      <path
                        d="M1 4L3.5 6.5L9 1"
                        stroke="white"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </div>
                <div
                  onClick={() => toggleArrayFilter('horarios', opt.value)}
                  className="cursor-pointer"
                >
                  <div className="text-sm font-medium text-foreground">{opt.label}</div>
                  <div className="text-xs text-muted-foreground">{opt.sublabel}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Class */}
        <div>
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Classe
          </h4>
          <div className="space-y-2">
            {ALL_CLASSES.map((cls) => (
              <label
                key={`filter-class-${cls}`}
                className="flex items-center gap-2.5 cursor-pointer group"
              >
                <div
                  onClick={() => toggleArrayFilter('classes', cls)}
                  className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all duration-150 cursor-pointer ${
                    filters.classes.includes(cls)
                      ? 'bg-primary border-primary'
                      : 'border-input group-hover:border-primary'
                  }`}
                >
                  {filters.classes.includes(cls) && (
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                      <path
                        d="M1 4L3.5 6.5L9 1"
                        stroke="white"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </div>
                <span
                  onClick={() => toggleArrayFilter('classes', cls)}
                  className="text-sm text-foreground cursor-pointer"
                >
                  {CLASS_LABELS[cls] || cls}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Carrier */}
        <div>
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Transportadora
          </h4>
          <div className="space-y-2">
            {ALL_CARRIERS.map((carrier) => (
              <label
                key={`filter-carrier-${carrier}`}
                className="flex items-center gap-2.5 cursor-pointer group"
              >
                <div
                  onClick={() => toggleArrayFilter('carriers', carrier)}
                  className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all duration-150 cursor-pointer ${
                    filters.carriers.includes(carrier)
                      ? 'bg-primary border-primary'
                      : 'border-input group-hover:border-primary'
                  }`}
                >
                  {filters.carriers.includes(carrier) && (
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                      <path
                        d="M1 4L3.5 6.5L9 1"
                        stroke="white"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </div>
                <div
                  onClick={() => toggleArrayFilter('carriers', carrier)}
                  className="flex items-center justify-between flex-1 cursor-pointer"
                >
                  <span className="text-sm text-foreground">{carrier}</span>
                  <span className="text-xs text-muted-foreground">
                    {carrierCounts[carrier] || 0}
                  </span>
                </div>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
