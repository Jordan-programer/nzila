'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

import SearchSummaryBar from './SearchSummaryBar';
import FiltersPanel from './FiltersPanel';
import TripCard from './TripCard';
import ResultsHeader from './ResultsHeader';
import { Trip } from './mockTrips';

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
  priceMax: 100000,
  horarios: [],
  classes: [],
  carriers: [],
};

export default function ResultsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const originQuery = searchParams.get('origem') || searchParams.get('origin') || '';
  const destQuery = searchParams.get('destino') || searchParams.get('destination') || '';
  const dateQuery = searchParams.get('data') || '';
  const classeQuery = searchParams.get('classe') || '';
  const tipoQuery = searchParams.get('tipo') || 'ida';
  const returnDateQuery = searchParams.get('volta') || '';

  const [trips, setTrips] = useState<Trip[]>([]);
  const [allCarriers, setAllCarriers] = useState<
    { id: number; nome: string; code: string; logo?: string; logo_url?: string }[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sort, setSort] = useState<SortOption>('hora-asc');
  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTERS);
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Round-trip Leg State
  const [currentLeg, setCurrentLeg] = useState<'outbound' | 'inbound'>('outbound');
  const [selectedOutboundTrip, setSelectedOutboundTrip] = useState<Trip | null>(null);
  const [selectedInboundTrip, setSelectedInboundTrip] = useState<Trip | null>(null);

  useEffect(() => {
    fetch('/api/public/carriers/')
      .then((r) => r.json())
      .then((data) => setAllCarriers(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const fetchTrips = async () => {
      setIsLoading(true);
      try {
        let url = '/api/trips/';
        const queryParams = new URLSearchParams();
        
        if (tipoQuery === 'ida-volta' && currentLeg === 'inbound') {
          // Inbound query: origin and destination swapped, using return date
          if (destQuery) queryParams.append('origin', destQuery);
          if (originQuery) queryParams.append('destination', originQuery);
          if (returnDateQuery) queryParams.append('date', returnDateQuery);
        } else {
          // Outbound query (or single trip)
          if (originQuery) queryParams.append('origin', originQuery);
          if (destQuery) queryParams.append('destination', destQuery);
          if (dateQuery) queryParams.append('date', dateQuery);
        }
        
        if (classeQuery) queryParams.append('class', classeQuery);

        if (queryParams.toString()) {
          url += `?${queryParams.toString()}`;
        }

        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          setTrips(data);
        }
      } catch (err) {
        console.error('Error fetching trips:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTrips();
  }, [originQuery, destQuery, dateQuery, returnDateQuery, classeQuery, tipoQuery, currentLeg]);

  const handleTripSelect = (trip: Trip) => {
    if (tipoQuery === 'ida-volta') {
      if (currentLeg === 'outbound') {
        setSelectedOutboundTrip(trip);
        setCurrentLeg('inbound');
      } else {
        setSelectedInboundTrip(trip);
      }
    } else {
      const stored = typeof window !== 'undefined' ? localStorage.getItem('nzila_current_user') : null;
      if (stored) {
        router.push(`/payment?trip=${trip.id}`);
      } else {
        router.push(`/sign-up-login-screen?trip=${trip.id}`);
      }
    }
  };

  const filteredAndSorted = useMemo<Trip[]>(() => {
    let result = trips.filter((trip) => {
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
  }, [filters, sort, trips]);

  if (isLoading) {
    return (
      <div className="bg-background min-h-screen flex flex-col">
        <SearchSummaryBar />
        <div className="flex-1 flex flex-col items-center justify-center py-20 text-center">
          <Loader2 className="animate-spin rounded-full h-12 w-12 text-primary mb-4" />
          <h3 className="text-base font-bold text-foreground">A carregar viagens...</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Por favor, aguarde enquanto consultamos a base de dados.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen">
      <SearchSummaryBar />

      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-8 lg:py-10">
        <div className="flex gap-6 lg:gap-8">
          {/* Filters Panel */}
          <aside className="hidden lg:block w-64 xl:w-72 flex-shrink-0">
            <FiltersPanel
              filters={filters}
              setFilters={setFilters}
              trips={trips}
              allCarriers={allCarriers}
            />
          </aside>

          {/* Results Column */}
          <div className="flex-1 min-w-0">
            {/* Step Stepper for round-trip */}
            {tipoQuery === 'ida-volta' && (
              <div className="mb-5 bg-primary text-white p-4 rounded-3xl flex items-center justify-between font-bold text-sm shadow-sm animate-fade-in">
                <div className="flex items-center gap-2">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-white text-primary text-xs font-black">
                    {currentLeg === 'outbound' ? '1' : '2'}
                  </span>
                  <span>
                    {currentLeg === 'outbound'
                      ? 'Passo 1: Selecione a viagem de Ida'
                      : 'Passo 2: Selecione a viagem de Volta'}
                  </span>
                </div>
                <span className="text-[10px] uppercase font-black bg-white/20 px-2.5 py-0.5 rounded-full">
                  {currentLeg === 'outbound' ? 'Ida' : 'Volta'}
                </span>
              </div>
            )}

            {/* Active outbound summary when in inbound leg */}
            {tipoQuery === 'ida-volta' && selectedOutboundTrip && (
              <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 mb-5 flex items-center justify-between animate-fade-in">
                <div className="text-xs font-semibold">
                  <span className="text-primary block uppercase tracking-wider text-[9px] mb-0.5 font-bold">
                    Viagem de Ida Selecionada
                  </span>
                  <span className="text-foreground font-bold">
                    {selectedOutboundTrip.origin} → {selectedOutboundTrip.destination}
                  </span>
                  <span className="text-muted-foreground ml-3 font-medium">
                    Partida: {selectedOutboundTrip.departureTime} | Preço: {Number(selectedOutboundTrip.preco_ida_volta || selectedOutboundTrip.price).toLocaleString('pt-AO')} Kz
                  </span>
                </div>
                <button
                  onClick={() => {
                    setSelectedOutboundTrip(null);
                    setSelectedInboundTrip(null);
                    setCurrentLeg('outbound');
                  }}
                  className="text-xs font-bold text-danger hover:underline hover:opacity-85 transition-opacity"
                >
                  Alterar Ida
                </button>
              </div>
            )}

            {/* Selection Complete Panel */}
            {tipoQuery === 'ida-volta' && selectedOutboundTrip && selectedInboundTrip && (
              <div className="bg-card border-2 border-primary rounded-3xl p-5 shadow-lg animate-fade-in flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div className="space-y-2">
                  <h3 className="text-base font-bold text-foreground">
                    Percurso de Ida e Volta Selecionado
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold">
                    <div>
                      <span className="text-primary block text-[9px] uppercase font-bold">Ida ({selectedOutboundTrip.departureTime})</span>
                      <span className="text-foreground">{selectedOutboundTrip.origin} → {selectedOutboundTrip.destination}</span>
                    </div>
                    <div>
                      <span className="text-primary block text-[9px] uppercase font-bold">Volta ({selectedInboundTrip.departureTime})</span>
                      <span className="text-foreground">{selectedInboundTrip.origin} → {selectedInboundTrip.destination}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-start md:items-end flex-col gap-1 flex-shrink-0">
                  <span className="text-[10px] text-muted-foreground font-semibold">Total a pagar:</span>
                  <span className="text-xl font-black text-emerald-600 tabular-nums">
                    {(
                      Number(selectedOutboundTrip.preco_ida_volta || selectedOutboundTrip.price) +
                      Number(selectedInboundTrip.preco_ida_volta || selectedInboundTrip.price)
                    ).toLocaleString('pt-AO')} Kz
                  </span>
                  <button
                    onClick={() => {
                      const stored = typeof window !== 'undefined' ? localStorage.getItem('nzila_current_user') : null;
                      const destUrl = `/payment?trip=${selectedOutboundTrip.id}&return_trip=${selectedInboundTrip.id}`;
                      if (stored) {
                        router.push(destUrl);
                      } else {
                        router.push(`/sign-up-login-screen?trip=${selectedOutboundTrip.id}&return_trip=${selectedInboundTrip.id}`);
                      }
                    }}
                    className="mt-1 px-5 py-2.5 bg-primary text-white hover:bg-accent rounded-xl font-bold text-xs shadow-sm active:scale-95 transition-all"
                  >
                    Confirmar e Prosseguir
                  </button>
                </div>
              </div>
            )}

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
                <FiltersPanel
                  filters={filters}
                  setFilters={setFilters}
                  trips={trips}
                  allCarriers={allCarriers}
                />
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
                  <TripCard
                    key={trip.id}
                    trip={trip}
                    isRoundTrip={tipoQuery === 'ida-volta'}
                    onSelect={handleTripSelect}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
