'use client';

import React from 'react';
import { SlidersHorizontal, ChevronDown } from 'lucide-react';
import { SortOption } from './ResultsContent';

interface ResultsHeaderProps {
  count: number;
  sort: SortOption;
  setSort: (s: SortOption) => void;
  filtersOpen: boolean;
  setFiltersOpen: (v: boolean) => void;
}

const SORT_OPTIONS: { value: SortOption; label: string; key: string }[] = [
  { value: 'hora-asc', label: 'Hora de saída (mais cedo)', key: 'sort-hora-asc' },
  { value: 'hora-desc', label: 'Hora de saída (mais tarde)', key: 'sort-hora-desc' },
  { value: 'preco-asc', label: 'Preço (menor primeiro)', key: 'sort-preco-asc' },
  { value: 'preco-desc', label: 'Preço (maior primeiro)', key: 'sort-preco-desc' },
  { value: 'duracao-asc', label: 'Duração (mais curta)', key: 'sort-duracao-asc' },
];

export default function ResultsHeader({
  count,
  sort,
  setSort,
  filtersOpen,
  setFiltersOpen,
}: ResultsHeaderProps) {
  const selectedLabel = SORT_OPTIONS.find((o) => o.value === sort)?.label || '';

  return (
    <div className="flex items-center justify-between mb-4 lg:mb-5">
      <div>
        <h1 className="text-lg font-bold text-foreground">
          {count} {count === 1 ? 'viagem disponível' : 'viagens disponíveis'}
        </h1>
        <p className="text-sm text-muted-foreground">Preços em Kwanza angolano (AOA)</p>
      </div>

      <div className="flex items-center gap-2">
        {/* Mobile filter toggle */}
        <button
          onClick={() => setFiltersOpen(!filtersOpen)}
          className="lg:hidden flex items-center gap-1.5 px-3 py-2 border border-border rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors"
        >
          <SlidersHorizontal size={15} />
          Filtros
        </button>

        {/* Sort dropdown */}
        <div className="relative">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortOption)}
            className="appearance-none pl-3 pr-8 py-2 border border-border rounded-lg text-sm bg-card text-foreground hover:border-primary focus:border-primary focus:outline-none transition-colors cursor-pointer"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.key} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown
            size={14}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
          />
        </div>
      </div>
    </div>
  );
}
