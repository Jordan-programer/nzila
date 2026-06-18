'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Clock,
  Users,
  Star,
  Wifi,
  Wind,
  Zap,
  Coffee,
  Monitor,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Calendar,
} from 'lucide-react';
import { Trip } from './mockTrips';
import Icon from '@/components/ui/AppIcon';

interface TripCardProps {
  trip: Trip;
}

const AMENITY_ICONS: Record<string, { icon: React.ElementType; label: string }> = {
  'ar-condicionado': { icon: Wind, label: 'Ar condicionado' },
  wifi: { icon: Wifi, label: 'Wi-Fi' },
  tomada: { icon: Zap, label: 'Tomada elétrica' },
  snack: { icon: Coffee, label: 'Snack incluído' },
  refeicao: { icon: Coffee, label: 'Refeição incluída' },
  almofada: { icon: Wind, label: 'Almofada e cobertor' },
  entretenimento: { icon: Monitor, label: 'Entretenimento a bordo' },
};

const CLASS_STYLES: Record<string, string> = {
  economica: 'badge-economica',
  executiva: 'badge-executiva',
  vip: 'badge-vip',
};

function formatDate(dateStr: string) {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  return `${parseInt(day)} ${months[parseInt(month) - 1]} ${year}`;
}

export default function TripCard({ trip }: TripCardProps) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);

  const seatsPercent = Math.round((trip.availableSeats / trip.totalSeats) * 100);
  const seatsUrgent = trip.availableSeats <= 5;

  const handleSelect = () => {
    // If the user is already logged in, skip the login screen
    const stored =
      typeof window !== 'undefined' ? localStorage.getItem('nzila_current_user') : null;
    if (stored) {
      router.push(`/payment?trip=${trip.id}`);
    } else {
      router.push(`/sign-up-login-screen?trip=${trip.id}`);
    }
  };

  return (
    <div className="bg-card border border-border rounded-2xl trip-card-shadow transition-all duration-200 overflow-hidden hover:border-primary/30">
      {/* Main Card Row */}
      <div className="p-4 lg:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          {/* Carrier Badge */}
          <div className="flex-shrink-0">
            <div
              className={`${trip.carrierColor} w-16 h-12 rounded-xl flex items-center justify-center`}
            >
              <span className="text-white text-xs font-black tracking-tight">
                {trip.carrierCode}
              </span>
            </div>
            <div className="flex items-center gap-0.5 mt-1.5 justify-center">
              <Star size={11} className="text-warning fill-warning" />
              <span className="text-xs font-semibold text-foreground">{trip.rating}</span>
              <span className="text-xs text-muted-foreground">({trip.reviews})</span>
            </div>
          </div>

          {/* Route + Times */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 lg:gap-6">
              {/* Departure */}
              <div className="text-center">
                <div className="text-xl lg:text-2xl font-bold text-foreground tabular-nums">
                  {trip.departureTime}
                </div>
                <div className="text-xs font-semibold text-foreground">
                  {trip.origin_provincia || trip.origin}
                </div>
                {trip.origin_provincia && trip.origin !== trip.origin_provincia && (
                  <div className="text-[10px] text-muted-foreground mt-0.5">{trip.origin}</div>
                )}
              </div>

              {/* Duration bar */}
              <div className="flex-1 flex flex-col items-center gap-1 min-w-0">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock size={11} />
                  <span>{trip.durationLabel}</span>
                </div>
                <div className="w-full flex items-center gap-1">
                  <div className="flex-1 h-px bg-border" />
                  <ArrowRight size={12} className="text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 h-px bg-border" />
                </div>
                <div className="text-xs text-muted-foreground">Direto</div>
              </div>

              {/* Arrival */}
              <div className="text-center">
                <div className="text-xl lg:text-2xl font-bold text-foreground tabular-nums">
                  {trip.arrivalTime}
                </div>
                <div className="text-xs font-semibold text-foreground">
                  {trip.destination_provincia || trip.destination}
                </div>
                {trip.destination_provincia && trip.destination !== trip.destination_provincia && (
                  <div className="text-[10px] text-muted-foreground mt-0.5">{trip.destination}</div>
                )}
              </div>
            </div>

            {/* Date row */}
            {trip.date && (
              <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
                <Calendar size={12} className="text-primary" />
                <span>{formatDate(trip.date)}</span>
              </div>
            )}

            {/* Class + Amenities row */}
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <span
                className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${CLASS_STYLES[trip.class] || 'badge-economica'}`}
              >
                {trip.classLabel}
              </span>
              {trip.amenities.slice(0, 4).map((amenity) => {
                const meta = AMENITY_ICONS[amenity];
                if (!meta) return null;
                const Icon = meta.icon;
                return (
                  <span
                    key={`amenity-${trip.id}-${amenity}`}
                    title={meta.label}
                    className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors cursor-default"
                  >
                    <Icon size={13} />
                  </span>
                );
              })}
              {trip.amenities.length > 4 && (
                <span className="text-xs text-muted-foreground">+{trip.amenities.length - 4}</span>
              )}
            </div>
          </div>

          {/* Price + CTA */}
          <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-3 sm:gap-2 flex-shrink-0">
            <div className="text-right">
              <div className="text-xs text-muted-foreground mb-0.5">por passageiro</div>
              <div className="text-2xl font-bold text-foreground tabular-nums">
                {trip.price.toLocaleString('pt-AO')} Kz
              </div>
            </div>

            <div className="flex flex-col items-end gap-2">
              {/* Seats indicator */}
              <div className="flex items-center gap-1.5">
                <Users
                  size={12}
                  className={seatsUrgent ? 'text-danger' : 'text-muted-foreground'}
                />
                <span
                  className={`text-xs font-medium ${seatsUrgent ? 'text-danger' : 'text-muted-foreground'}`}
                >
                  {seatsUrgent
                    ? `Apenas ${trip.availableSeats} lugares!`
                    : `${trip.availableSeats} lugares`}
                </span>
              </div>

              <button
                onClick={handleSelect}
                className="px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-semibold text-sm hover:bg-accent active:scale-95 transition-all duration-150 whitespace-nowrap"
              >
                Selecionar
              </button>
            </div>
          </div>
        </div>

        {/* Seats progress bar */}
        <div className="mt-4 pt-3 border-t border-border">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
            <span>
              {trip.availableSeats} de {trip.totalSeats} lugares disponíveis
            </span>
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1 text-primary hover:text-accent font-medium transition-colors"
            >
              Ver detalhes
              {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>
          </div>
          <div className="progress-bar">
            <div
              className={`progress-fill ${seatsUrgent ? 'bg-danger' : ''}`}
              style={{ width: `${seatsPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="px-4 lg:px-5 pb-4 lg:pb-5 border-t border-border bg-muted/30 animate-slide-up">
          <div className="pt-4 grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                Transportadora
              </p>
              <p className="text-sm font-medium text-foreground">{trip.carrier}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                Duração
              </p>
              <p className="text-sm font-medium text-foreground">{trip.durationLabel}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                Avaliação
              </p>
              <div className="flex items-center gap-1">
                <Star size={13} className="text-warning fill-warning" />
                <span className="text-sm font-semibold text-foreground">{trip.rating}</span>
                <span className="text-xs text-muted-foreground">({trip.reviews} avaliações)</span>
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                Classe
              </p>
              <span
                className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${CLASS_STYLES[trip.class] || 'badge-economica'}`}
              >
                {trip.classLabel}
              </span>
            </div>
          </div>

          <div className="mt-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Comodidades a bordo
            </p>
            <div className="flex flex-wrap gap-2">
              {trip.amenities.map((amenity) => {
                const meta = AMENITY_ICONS[amenity];
                if (!meta) return null;
                const Icon = meta.icon;
                return (
                  <div
                    key={`detail-amenity-${trip.id}-${amenity}`}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 bg-card border border-border rounded-lg text-xs text-foreground"
                  >
                    <Icon size={13} className="text-primary" />
                    {meta.label}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={handleSelect}
              className="flex-1 sm:flex-none px-6 py-2.5 bg-primary text-primary-foreground rounded-xl font-semibold text-sm hover:bg-accent active:scale-95 transition-all duration-150"
            >
              Selecionar este bilhete
            </button>
            <p className="text-xs text-muted-foreground">Sem taxas de reserva adicionais</p>
          </div>
        </div>
      )}
    </div>
  );
}
