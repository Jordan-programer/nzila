'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, Calendar, ChevronDown, Search, ArrowLeftRight, Star } from 'lucide-react';

const PROVINCES = [
  // Bengo
  'Caxito',
  // Benguela
  'Benguela',
  // Bié
  'Kuito',
  // Cabinda
  'Cabinda',
  // Cuando Cubango
  'Menongue',
  // Cuanza Norte
  "N'dalatando",
  // Cuanza Sul
  'Sumbe',
  // Cunene
  'Ondjiva',
  // Huambo
  'Huambo',
  // Huíla
  'Lubango',
  // Luanda
  'Luanda',
  // Lunda Norte
  'Dundo',
  // Lunda Sul
  'Saurimo',
  // Malanje
  'Malanje',
  // Moxico
  'Luena',
  // Namibe
  'Namibe',
  // Uíge
  'Uíge',
  // Zaire
  'Mbanza Kongo',
  'Soyo',
];

const CLASSES = [
  { value: 'economica', label: 'Económica', description: 'Conforto básico' },
  { value: 'executiva', label: 'Executiva', description: 'Mais espaço e conforto' },
  { value: 'vip', label: 'VIP', description: 'Máximo luxo e privacidade' },
];

type TripType = 'ida' | 'ida-volta';

export default function HeroSection() {
  const router = useRouter();
  const [tripType, setTripType] = useState<TripType>('ida');
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [departureDate, setDepartureDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [travelClass, setTravelClass] = useState('economica');
  const [originOpen, setOriginOpen] = useState(false);
  const [destOpen, setDestOpen] = useState(false);
  const [classOpen, setClassOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const swapRoutes = () => {
    const temp = origin;
    setOrigin(destination);
    setDestination(temp);
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!origin) newErrors.origin = 'Selecione a origem';
    if (!destination) newErrors.destination = 'Selecione o destino';
    if (origin && destination && origin === destination)
      newErrors.destination = 'Destino deve ser diferente da origem';
    if (!departureDate) newErrors.departureDate = 'Selecione a data de ida';
    if (tripType === 'ida-volta' && !returnDate) newErrors.returnDate = 'Selecione a data de volta';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSearch = () => {
    if (!validate()) return;
    const params = new URLSearchParams({
      origem: origin,
      destino: destination,
      data: departureDate,
      classe: travelClass,
      tipo: tripType,
    });
    if (tripType === 'ida-volta' && returnDate) {
      params.append('volta', returnDate);
    }
    router.push(`/results-page?${params.toString()}`);
  };

  const selectedClass = CLASSES.find((c) => c.value === travelClass);

  return (
    <section
      className="relative min-h-[580px] lg:min-h-[640px] flex items-center pt-24 lg:pt-28 bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: `linear-gradient(135deg, rgba(5, 150, 105, 0.65) 0%, rgba(4, 120, 87, 0.7) 40%, rgba(6, 78, 59, 0.8) 100%), url('/assets/hero/hero-nzila.jpg')`,
      }}
    >
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute bottom-0 -left-24 w-72 h-72 rounded-full bg-white/5 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-12 lg:py-16">
        <div className="max-w-2xl mb-8 lg:mb-10">
          <div className="inline-flex items-center gap-2 bg-white/15 text-white text-sm font-medium px-3 py-1.5 rounded-full mb-5">
            <Star size={14} className="text-warning" />
            <span>Mais de 50.000 viagens reservadas em Angola</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight mb-4">
            Viaje entre províncias
            <br />
            <span className="text-blue-200">com conforto e segurança</span>
          </h1>
          <p className="text-white/80 text-lg">Reserve a sua passagem online em poucos minutos.</p>
        </div>

        {/* Search Card */}
        <div className="bg-card rounded-2xl search-card-shadow p-5 lg:p-7 max-w-4xl">
          {/* Trip Type Toggle */}
          <div className="flex items-center gap-1 p-1 bg-muted rounded-xl w-fit mb-5">
            {(
              [
                { value: 'ida', label: 'Apenas Ida', key: 'trip-ida' },
                { value: 'ida-volta', label: 'Ida e Volta', key: 'trip-ida-volta' },
              ] as { value: TripType; label: string; key: string }[]
            ).map((opt) => (
              <button
                type="button"
                key={opt.key}
                onClick={() => setTripType(opt.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                  tripType === opt.value
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Form Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
            {/* Origin */}
            <div className="relative sm:col-span-2 lg:col-span-1">
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                Origem
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setOriginOpen(!originOpen);
                    setDestOpen(false);
                    setClassOpen(false);
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-3 border rounded-xl text-sm text-left transition-all duration-150 bg-background ${
                    errors.origin
                      ? 'border-danger'
                      : 'border-input hover:border-primary focus:border-primary'
                  } ${origin ? 'text-foreground' : 'text-muted-foreground'}`}
                >
                  <MapPin size={16} className="text-primary flex-shrink-0" />
                  <span className="flex-1 truncate">{origin || 'Selecionar cidade'}</span>
                  <ChevronDown
                    size={14}
                    className={`text-muted-foreground transition-transform ${originOpen ? 'rotate-180' : ''}`}
                  />
                </button>
                {errors.origin && <p className="text-danger text-xs mt-1">{errors.origin}</p>}
                {originOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-modal z-20 max-h-52 overflow-y-auto animate-fade-in">
                    {PROVINCES.filter((p) => p !== destination).map((province) => (
                      <button
                        type="button"
                        key={`origin-${province}`}
                        onClick={() => {
                          setOrigin(province);
                          setOriginOpen(false);
                          setErrors((e) => ({ ...e, origin: '' }));
                        }}
                        className="w-full text-left px-4 py-2.5 text-sm hover:bg-primary/5 hover:text-primary transition-colors"
                      >
                        {province}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Swap + Destination */}
            <div className="relative sm:col-span-2 lg:col-span-1">
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                Destino
              </label>
              <div className="relative">
                {/* Swap button — only visible on larger screens between origin/dest */}
                <button
                  type="button"
                  onClick={swapRoutes}
                  className="absolute -left-5 top-3 z-10 hidden lg:flex w-8 h-8 items-center justify-center bg-card border border-border rounded-full shadow-sm hover:bg-primary hover:text-white hover:border-primary transition-all duration-150"
                  title="Trocar origem e destino"
                >
                  <ArrowLeftRight size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDestOpen(!destOpen);
                    setOriginOpen(false);
                    setClassOpen(false);
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-3 border rounded-xl text-sm text-left transition-all duration-150 bg-background ${
                    errors.destination
                      ? 'border-danger'
                      : 'border-input hover:border-primary focus:border-primary'
                  } ${destination ? 'text-foreground' : 'text-muted-foreground'}`}
                >
                  <MapPin size={16} className="text-danger flex-shrink-0" />
                  <span className="flex-1 truncate">{destination || 'Selecionar cidade'}</span>
                  <ChevronDown
                    size={14}
                    className={`text-muted-foreground transition-transform ${destOpen ? 'rotate-180' : ''}`}
                  />
                </button>
                {errors.destination && (
                  <p className="text-danger text-xs mt-1">{errors.destination}</p>
                )}
                {destOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-modal z-20 max-h-52 overflow-y-auto animate-fade-in">
                    {PROVINCES.filter((p) => p !== origin).map((province) => (
                      <button
                        type="button"
                        key={`dest-${province}`}
                        onClick={() => {
                          setDestination(province);
                          setDestOpen(false);
                          setErrors((e) => ({ ...e, destination: '' }));
                        }}
                        className="w-full text-left px-4 py-2.5 text-sm hover:bg-primary/5 hover:text-primary transition-colors"
                      >
                        {province}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Departure Date */}
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                Data de Ida
              </label>
              <div className="relative">
                <Calendar
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-primary pointer-events-none"
                />
                <input
                  type="date"
                  value={departureDate}
                  onChange={(e) => {
                    setDepartureDate(e.target.value);
                    setErrors((err) => ({ ...err, departureDate: '' }));
                  }}
                  min="2026-06-01"
                  className={`w-full pl-9 pr-3 py-3 border rounded-xl text-sm bg-background transition-all duration-150 ${
                    errors.departureDate
                      ? 'border-danger'
                      : 'border-input hover:border-primary focus:border-primary'
                  } focus:outline-none`}
                />
                {errors.departureDate && (
                  <p className="text-danger text-xs mt-1">{errors.departureDate}</p>
                )}
              </div>
            </div>

            {/* Return Date or Class */}
            {tripType === 'ida-volta' ? (
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                  Data de Volta
                </label>
                <div className="relative">
                  <Calendar
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-success pointer-events-none"
                  />
                  <input
                    type="date"
                    value={returnDate}
                    onChange={(e) => {
                      setReturnDate(e.target.value);
                      setErrors((err) => ({ ...err, returnDate: '' }));
                    }}
                    min={departureDate || '2026-06-01'}
                    className={`w-full pl-9 pr-3 py-3 border rounded-xl text-sm bg-background transition-all duration-150 ${
                      errors.returnDate
                        ? 'border-danger'
                        : 'border-input hover:border-primary focus:border-primary'
                    } focus:outline-none`}
                  />
                  {errors.returnDate && (
                    <p className="text-danger text-xs mt-1">{errors.returnDate}</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="relative">
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                  Classe
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setClassOpen(!classOpen);
                    setOriginOpen(false);
                    setDestOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-3 border border-input rounded-xl text-sm text-left bg-background hover:border-primary transition-all duration-150"
                >
                  <span className="flex-1 text-foreground">{selectedClass?.label}</span>
                  <ChevronDown
                    size={14}
                    className={`text-muted-foreground transition-transform ${classOpen ? 'rotate-180' : ''}`}
                  />
                </button>
                {classOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-modal z-20 animate-fade-in">
                    {CLASSES.map((cls) => (
                      <button
                        type="button"
                        key={`class-${cls.value}`}
                        onClick={() => {
                          setTravelClass(cls.value);
                          setClassOpen(false);
                        }}
                        className={`w-full text-left px-4 py-3 transition-colors ${
                          travelClass === cls.value ? 'bg-primary/5 text-primary' : 'hover:bg-muted'
                        }`}
                      >
                        <div className="text-sm font-medium">{cls.label}</div>
                        <div className="text-xs text-muted-foreground">{cls.description}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Class selector when ida-volta (5th field) */}
          {tripType === 'ida-volta' && (
            <div className="mt-3 relative max-w-xs">
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                Classe
              </label>
              <button
                type="button"
                onClick={() => {
                  setClassOpen(!classOpen);
                  setOriginOpen(false);
                  setDestOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-3 border border-input rounded-xl text-sm text-left bg-background hover:border-primary transition-all duration-150"
              >
                <span className="flex-1 text-foreground">{selectedClass?.label}</span>
                <ChevronDown
                  size={14}
                  className={`text-muted-foreground transition-transform ${classOpen ? 'rotate-180' : ''}`}
                />
              </button>
              {classOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-modal z-20 animate-fade-in">
                  {CLASSES.map((cls) => (
                    <button
                      type="button"
                      key={`class-alt-${cls.value}`}
                      onClick={() => {
                        setTravelClass(cls.value);
                        setClassOpen(false);
                      }}
                      className={`w-full text-left px-4 py-3 transition-colors ${
                        travelClass === cls.value ? 'bg-primary/5 text-primary' : 'hover:bg-muted'
                      }`}
                    >
                      <div className="text-sm font-medium">{cls.label}</div>
                      <div className="text-xs text-muted-foreground">{cls.description}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Search Button */}
          <div className="mt-5 flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <button
              type="button"
              onClick={handleSearch}
              className="flex items-center gap-2 px-8 py-3.5 bg-primary text-primary-foreground rounded-xl font-semibold text-base hover:bg-accent active:scale-95 transition-all duration-150 shadow-sm"
            >
              <Search size={18} />
              Pesquisar Viagens
            </button>
            <p className="text-xs text-muted-foreground">
              Sem taxa de reserva • Bilhete digital instantâneo
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
