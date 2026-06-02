'use client';

import React, { useState, useMemo } from 'react';

import SearchSummaryBar from './SearchSummaryBar';
import FiltersPanel from './FiltersPanel';
import TripCard from './TripCard';
import ResultsHeader from './ResultsHeader';
import { MOCK_TRIPS, Trip } from './mockTrips';

export type SortOption = 'preco-asc' | 'preco-desc' | 'hora-asc' | 'hora-desc' | 'duracao-asc';

export interface FilterState {
  priceMin: number;
  priceMax: number;
  horarios: string[];
  classes: string[];
  carriers: string[];
}

const INITIAL_FILTERS: FilterState = {
  priceMin: 0,
  priceMax: 20000,
  horarios: [],
  classes: [],
  carriers: [],
};

export default function ResultsContent() {
  const [sort, setSort] = useState<SortOption>('hora-asc');
  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTERS);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const filteredAndSorted = useMemo<Trip[]>(() => {
    let result = MOCK_TRIPS.filter((trip) => {
      if (trip.price < filters.priceMin || trip.price > filters.priceMax) return false;
      if (filters.classes.length > 0 && !filters.classes.includes(trip.class)) return false;
      if (filters.carriers.length > 0 && !filters.carriers.includes(trip.carrier)) return false;
      if (filters.horarios.length > 0) {
        const hour = parseInt(trip.departureTime.split(':')[0]);
        const inRange = filters.horarios.some((h) => {
          if (h === 'manha') return hour >= 5 && hour < 12;
          if (h === 'tarde') return hour >= 12 && hour < 18;
          if (h === 'noite') return hour >= 18 || hour < 5;
          return false;
        });
        if (!inRange) return false;
      }
      return true;
    });

    result = [...result].sort((a, b) => {
      if (sort === 'preco-asc') return a.price - b.price;
      if (sort === 'preco-desc') return b.price - a.price;
      if (sort === 'hora-asc') return a.departureTime.localeCompare(b.departureTime);
      if (sort === 'hora-desc') return b.departureTime.localeCompare(a.departureTime);
      if (sort === 'duracao-asc') return a.durationMinutes - b.durationMinutes;
      return 0;
    });

    return result;
  }, [filters, sort]);

  return (
    <div className="bg-background min-h-screen">
      <SearchSummaryBar />

      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-6 lg:py-8">
        <div className="flex gap-6 lg:gap-8">
          {/* Filters Panel */}
          <aside className="hidden lg:block w-64 xl:w-72 flex-shrink-0">
            <FiltersPanel filters={filters} setFilters={setFilters} trips={MOCK_TRIPS} />
          </aside>

          {/* Results Column */}
          <div className="flex-1 min-w-0">
            <ResultsHeader
              count={filteredAndSorted.length}
              sort={sort}
              setSort={setSort}
              filtersOpen={filtersOpen}
              setFiltersOpen={setFiltersOpen}
            />

            {/* Mobile Filters Drawer */}
            {filtersOpen && (
              <div className="lg:hidden mb-4 bg-card border border-border rounded-2xl p-4 animate-slide-up">
                <FiltersPanel filters={filters} setFilters={setFilters} trips={MOCK_TRIPS} />
              </div>
            )}

            {filteredAndSorted.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
                  <svg
                    width="28"
                    height="28"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-muted-foreground"
                  >
                    <path d="M3 12h18M3 6h18M3 18h18" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Nenhuma viagem encontrada
                </h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Nenhuma viagem corresponde aos filtros selecionados. Tente ajustar os filtros ou
                  escolha outra data.
                </p>
                <button
                  onClick={() => setFilters(INITIAL_FILTERS)}
                  className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-accent transition-colors"
                >
                  Limpar filtros
                </button>
              </div>
            ) : (
              <div className="space-y-3 lg:space-y-4">
                {filteredAndSorted.map((trip) => (
                  <TripCard key={trip.id} trip={trip} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
