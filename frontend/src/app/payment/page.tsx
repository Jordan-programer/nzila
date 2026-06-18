'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

import { toast } from 'sonner';

interface Trip {
  id: string | number;
  carrier: string;
  carrierCode: string;
  carrierColor: string;
  rating: number;
  reviews: number;
  origin: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  durationLabel: string;
  class: string;
  classLabel: string;
  availableSeats: number;
  totalSeats: number;
  price: number;
  amenities: string[];
}
import {
  User,
  CreditCard,
  CheckCircle2,
  Users,
  Compass,
  ArrowRight,
  ShieldCheck,
  Check,
  AlertCircle,
  Copy,
  Loader2,
  Smartphone,
  Phone,
  Lock,
} from 'lucide-react';

function getCurrentUser() {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem('nzila_current_user');
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tripId = searchParams.get('trip');

  const [trip, setTrip] = useState<Trip | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [processingMessage, setProcessingMessage] = useState('');

  // Form State
  const [passengerName, setPassengerName] = useState('');
  const [passengerEmail, setPassengerEmail] = useState('');
  const [passengerPhone, setPassengerPhone] = useState('');
  const [passengerDocument, setPassengerDocument] = useState('');

  // Seats State
  const [selectedSeat, setSelectedSeat] = useState<string>('');
  const [occupiedSeats, setOccupiedSeats] = useState<string[]>([]);

  // Payment State
  const [paymentMethod, setPaymentMethod] = useState<
    'express' | 'referencia' | 'unitel' | 'paypay'
  >('express');
  const [expressPhone, setExpressPhone] = useState('');
  const [unitelPhone, setUnitelPhone] = useState('');
  const [unitelPin, setUnitelPin] = useState('');
  const [paypayPhone, setPaypayPhone] = useState('');
  const [expressWaiting, setExpressWaiting] = useState(false);
  const [expressTimer, setExpressTimer] = useState(60);

  // Reference Payment state
  const [mockRef, setMockRef] = useState({ entidad: '00324', ref: '', valor: 0 });

  // Load trip and user session
  useEffect(() => {
    // 1. Check authentication
    const user = getCurrentUser();
    if (!user) {
      toast.error('Por favor, inicie sessão para concluir a reserva.');
      router.push(`/sign-up-login-screen?trip=${tripId || ''}`);
      return;
    }
    setCurrentUser(user);

    // Fill form
    setPassengerName(user.name);
    setPassengerEmail(user.email);
    setPassengerPhone(user.phone || '');
    setPassengerDocument(user.document || '');
    setExpressPhone(user.phone?.replace('+244 ', '') || '');
    setUnitelPhone(user.phone?.replace('+244 ', '') || '');
    setPaypayPhone(user.phone?.replace('+244 ', '') || '');

    // 2. Load trip from backend API
    if (!tripId) {
      toast.error('Nenhuma viagem selecionada!');
      router.push('/results-page');
      return;
    }

    const fetchTrip = async () => {
      try {
        const res = await fetch(`/api/trips/${tripId}/`);
        if (!res.ok) throw new Error('Viagem não encontrada no servidor.');
        const data = await res.json();
        setTrip(data);

        // Load occupied seats dynamically from API
        setOccupiedSeats(data.occupiedSeats || []);

        // Setup Reference details
        const randomRef = Math.floor(100000000 + Math.random() * 900000000)
          .toString()
          .replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3');
        setMockRef({
          entidad: '00294',
          ref: randomRef,
          valor: data.price,
        });
      } catch (err: any) {
        toast.error(err.message || 'Erro ao carregar detalhes da viagem.');
        router.push('/results-page');
      }
    };

    fetchTrip();
  }, [tripId, router]);

  // Express countdown timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (expressWaiting && expressTimer > 0) {
      timer = setTimeout(() => setExpressTimer(expressTimer - 1), 1000);
    } else if (expressWaiting && expressTimer === 0) {
      setExpressWaiting(false);
      handlePaymentSuccess();
    }
    return () => clearTimeout(timer);
  }, [expressWaiting, expressTimer]);

  const handleNextStep = () => {
    if (step === 1) {
      if (
        !passengerName.trim() ||
        !passengerEmail.trim() ||
        !passengerPhone.trim() ||
        !passengerDocument.trim()
      ) {
        toast.warning('Por favor, preencha todos os dados do passageiro.');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!selectedSeat) {
        toast.warning('Por favor, selecione um assento no mapa.');
        return;
      }
      setStep(3);
    }
  };

  const handleSeatClick = (seat: string) => {
    if (occupiedSeats.includes(seat)) {
      toast.error('Este assento já está ocupado. Por favor, escolha outro.');
      return;
    }
    setSelectedSeat(seat);
    toast.success(`Assento ${seat} selecionado!`);
  };

  const handlePaymentSuccess = () => {
    setExpressWaiting(false);
    setLoading(true);

    const messages = [
      'A ligar à rede segura de pagamentos...',
      'A verificar autenticidade da transacção...',
      'A debitar na conta bancária/carteira digital...',
      'A registar e gerar o seu Bilhete Digital...',
      'Pagamento Aprovado com Sucesso! A redireccionar...',
    ];

    let currentIdx = 0;
    setProcessingMessage(messages[0]);

    const interval = setInterval(async () => {
      currentIdx++;
      if (currentIdx < messages.length) {
        setProcessingMessage(messages[currentIdx]);
      } else {
        clearInterval(interval);

        // Save reservation in DB
        if (trip) {
          const user = getCurrentUser();
          const token = user?.token;

          try {
            const res = await fetch('/api/reservations/', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Token ${token}`,
              },
              body: JSON.stringify({
                tripId: trip.id,
                seat: selectedSeat,
                paymentMethod:
                  paymentMethod === 'express'
                    ? 'Multicaixa Express'
                    : paymentMethod === 'referencia'
                      ? 'Pagamento por referência'
                      : paymentMethod === 'unitel'
                        ? 'Unitel Money'
                        : 'PayPay',
                passengerName,
                passengerEmail,
                passengerPhone,
                passengerDocument,
              }),
            });

            const resData = await res.json();

            if (res.ok) {
              toast.success('Reserva confirmada com sucesso!');
              router.push(`/confirmation?code=${resData.codigo_reserva}`);
            } else {
              toast.error(resData.error || 'Erro ao realizar reserva no servidor.');
              setLoading(false);
            }
          } catch (err) {
            toast.error('Erro ao comunicar com o servidor.');
            setLoading(false);
          }
        }
      }
    }, 1200);
  };

  const handleConfirmPayment = () => {
    if (paymentMethod === 'express') {
      if (!expressPhone || expressPhone.length < 9) {
        toast.error('Número de telefone do Multicaixa Express inválido.');
        return;
      }
      setExpressWaiting(true);
      setExpressTimer(15); // Short wait for demo
      toast.info('Pedido enviado para o seu telemóvel. Por favor, confirme na app.');
    } else if (paymentMethod === 'unitel') {
      if (!unitelPhone || unitelPhone.length < 9 || !unitelPin) {
        toast.error('Por favor, preencha o número Unitel Money e o PIN.');
        return;
      }
      handlePaymentSuccess();
    } else if (paymentMethod === 'paypay') {
      if (!paypayPhone || paypayPhone.length < 9) {
        toast.error('Por favor, introduza o seu número de conta PayPay.');
        return;
      }
      handlePaymentSuccess();
    } else {
      // Reference
      handlePaymentSuccess();
    }
  };

  const copyRefData = () => {
    navigator.clipboard.writeText(
      `Entidade: ${mockRef.entidad}\nReferência: ${mockRef.ref}\nValor: ${mockRef.valor} Kz`
    );
    toast.success('Dados de pagamento copiados para a área de transferência!');
  };

  if (!trip) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="animate-spin text-primary w-12 h-12" />
      </div>
    );
  }

  // Generate seats grid
  const renderSeatsGrid = () => {
    const isVip = trip.class === 'vip';
    const isExec = trip.class === 'executiva';
    const numSeats = isVip ? 12 : isExec ? 28 : 44;

    const rows = [];
    const seatsPerRow = 4; // 2 left, Aisle, 2 right

    for (let r = 0; r < Math.ceil(numSeats / seatsPerRow); r++) {
      const rowSeats = [];
      for (let s = 0; s < seatsPerRow; s++) {
        const seatIdx = r * seatsPerRow + s + 1;
        if (seatIdx > numSeats) break;

        const seatNum = seatIdx < 10 ? `0${seatIdx}` : `${seatIdx}`;
        // Letters A, B (Left side) C, D (Right side)
        const seatLetter = String.fromCharCode(65 + s);
        const seatLabel = `${seatNum}${seatLetter}`;

        const isOccupied = occupiedSeats.includes(seatLabel);
        const isSelected = selectedSeat === seatLabel;

        rowSeats.push(
          <button
            key={seatLabel}
            type="button"
            disabled={isOccupied}
            onClick={() => handleSeatClick(seatLabel)}
            className={`w-10 h-10 lg:w-11 lg:h-11 rounded-lg text-xs font-bold border transition-all flex flex-col items-center justify-center select-none ${
              isOccupied
                ? 'bg-danger/10 border-danger/25 text-danger/50 cursor-not-allowed'
                : isSelected
                  ? 'bg-primary text-white border-primary shadow-md scale-105 ring-2 ring-primary/20'
                  : 'bg-card border-border hover:border-primary/50 text-foreground hover:bg-primary/5 active:scale-95'
            }`}
          >
            <span>{seatLabel}</span>
          </button>
        );
      }
      rows.push(rowSeats);
    }

    return (
      <div className="flex flex-col items-center gap-3 bg-muted/40 border border-border p-6 rounded-3xl relative overflow-hidden">
        {/* Front of bus indicator */}
        <div className="w-full flex items-center justify-between border-b border-border pb-4 mb-4 text-xs font-semibold text-muted-foreground">
          <div className="flex items-center gap-1.5 bg-card px-2.5 py-1 rounded-md border border-border">
            <span className="w-1.5 h-1.5 rounded-full bg-danger animate-pulse" />
            <span>Cabine do Motorista</span>
          </div>
          <span>Entrada / Porta</span>
        </div>

        {/* Bus Grid Layout */}
        <div className="flex flex-col gap-3.5 max-h-[420px] overflow-y-auto w-full px-2">
          {rows.map((row, rIdx) => (
            <div
              key={`row-${rIdx}`}
              className="flex items-center justify-between gap-2 max-w-sm mx-auto w-full"
            >
              {/* Left seats (A & B) */}
              <div className="flex gap-2.5">
                {row[0]}
                {row[1]}
              </div>

              {/* Aisle */}
              <div className="w-8 flex items-center justify-center">
                <span className="text-[10px] text-muted-foreground font-black tracking-widest uppercase rotate-90 opacity-25 pointer-events-none">
                  Corredor
                </span>
              </div>

              {/* Right seats (C & D) */}
              <div className="flex gap-2.5">
                {row[2]}
                {row[3]}
              </div>
            </div>
          ))}
        </div>

        {/* Legends */}
        <div className="flex items-center justify-center gap-4 mt-6 flex-wrap border-t border-border pt-4 w-full">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
            <span className="w-3.5 h-3.5 rounded bg-card border border-border inline-block" />
            <span>Disponível</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
            <span className="w-3.5 h-3.5 rounded bg-primary border border-primary inline-block" />
            <span>Selecionado</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
            <span className="w-3.5 h-3.5 rounded bg-danger/10 border border-danger/25 text-danger/50 inline-block" />
            <span>Ocupado</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-background relative">
      <Header />

      {/* Processing Loader Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-4">
          <div className="w-full max-w-md bg-card border border-border rounded-3xl p-8 text-center shadow-2xl animate-bounce-in">
            <Loader2 className="animate-spin text-primary w-16 h-16 mx-auto mb-6" />
            <h3 className="text-xl font-bold text-foreground mb-2">Processamento de Pagamento</h3>
            <p className="text-sm text-muted-foreground font-medium animate-pulse">
              {processingMessage}
            </p>
            <div className="w-full bg-muted h-1 rounded-full overflow-hidden mt-6">
              <div
                className="bg-primary h-full rounded-full animate-progress-fill"
                style={{ width: '100%' }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Multicaixa Express Simulated Push notification waiting modal */}
      {expressWaiting && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-card border border-border rounded-3xl p-6 shadow-2xl animate-bounce-in">
            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Smartphone size={24} className="text-primary animate-bounce" />
            </div>
            <h3 className="text-lg font-bold text-foreground text-center mb-1">
              Aprovação Pendente
            </h3>
            <p className="text-sm text-muted-foreground text-center mb-6">
              Enviámos uma notificação de pagamento no valor de{' '}
              <strong className="text-foreground">{trip.price.toLocaleString('pt-AO')} Kz</strong>{' '}
              para o número <strong className="text-foreground">+244 {expressPhone}</strong>.
            </p>

            <div className="p-4 bg-muted/40 rounded-2xl border border-border flex flex-col items-center mb-6">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1">
                A aguardar resposta
              </span>
              <span className="text-3xl font-black text-foreground tabular-nums">
                00:{expressTimer < 10 ? `0${expressTimer}` : expressTimer}
              </span>
            </div>

            <p className="text-xs text-muted-foreground text-center mb-4">
              Abra a aplicação <strong className="text-foreground">Multicaixa Express</strong> no
              seu telemóvel, vá a Notificações/Pagamentos Autorizados e confirme a transação.
            </p>

            <button
              onClick={() => {
                setExpressWaiting(false);
                toast.error('Pagamento cancelado pelo utilizador.');
              }}
              className="w-full py-2.5 border border-border rounded-xl text-sm font-semibold hover:bg-muted text-muted-foreground transition-colors"
            >
              Cancelar Transação
            </button>
          </div>
        </div>
      )}

      <main className="flex-1 pt-24 pb-16" style={{ paddingBottom: '4rem' }}>
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">
          {/* Page Title */}
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground mb-1.5">
              Conclusão da Reserva
            </h1>
            <p className="text-sm text-muted-foreground">
              Preencha os dados, selecione o seu assento preferido e realize o pagamento seguro.
            </p>
          </div>

          {/* Steps Indicator */}
          <div className="flex items-center justify-between max-w-2xl mb-8 bg-card border border-border p-4 rounded-2xl">
            <div className="flex items-center gap-2">
              <span
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-150 ${step >= 1 ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}
              >
                {step > 1 ? <Check size={14} /> : '1'}
              </span>
              <span
                className={`text-sm font-semibold ${step >= 1 ? 'text-foreground' : 'text-muted-foreground'}`}
              >
                Passageiro
              </span>
            </div>
            <div className="flex-1 h-px bg-border mx-4 hidden sm:block" />
            <div className="flex items-center gap-2">
              <span
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-150 ${step >= 2 ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}
              >
                {step > 2 ? <Check size={14} /> : '2'}
              </span>
              <span
                className={`text-sm font-semibold ${step >= 2 ? 'text-foreground' : 'text-muted-foreground'}`}
              >
                Assento
              </span>
            </div>
            <div className="flex-1 h-px bg-border mx-4 hidden sm:block" />
            <div className="flex items-center gap-2">
              <span
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-150 ${step >= 3 ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}
              >
                3
              </span>
              <span
                className={`text-sm font-semibold ${step >= 3 ? 'text-foreground' : 'text-muted-foreground'}`}
              >
                Pagamento
              </span>
            </div>
          </div>

          {/* Grid Layout: Main Columns vs Sidebar summary */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Steps Panels */}
            <div className="lg:col-span-8 space-y-6">
              {step === 1 && (
                <div className="bg-card border border-border rounded-3xl p-6 lg:p-8 animate-fade-in">
                  <div className="flex items-center gap-2.5 mb-6 border-b border-border pb-4">
                    <User className="text-primary w-5 h-5" />
                    <h2 className="text-lg font-bold text-foreground">
                      Identificação do Passageiro
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-semibold text-foreground mb-1.5">
                        Nome Completo
                      </label>
                      <input
                        type="text"
                        value={passengerName}
                        onChange={(e) => setPassengerName(e.target.value)}
                        placeholder="Ex: Fátima Manuel Teixeira"
                        className="w-full px-4 py-3 border border-input rounded-xl text-sm bg-background focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-1.5">
                        Email
                      </label>
                      <input
                        type="email"
                        value={passengerEmail}
                        onChange={(e) => setPassengerEmail(e.target.value)}
                        placeholder="fatima.manuel@transbook.ao"
                        className="w-full px-4 py-3 border border-input rounded-xl text-sm bg-background focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-1.5">
                        Nº de Telefone
                      </label>
                      <input
                        type="tel"
                        value={passengerPhone}
                        onChange={(e) => setPassengerPhone(e.target.value)}
                        placeholder="+244 923 456 789"
                        className="w-full px-4 py-3 border border-input rounded-xl text-sm bg-background focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-semibold text-foreground mb-1.5">
                        Bilhete de Identidade (B.I. / Passaporte)
                      </label>
                      <input
                        type="text"
                        value={passengerDocument}
                        onChange={(e) => setPassengerDocument(e.target.value)}
                        placeholder="005432168LA045"
                        className="w-full px-4 py-3 border border-input rounded-xl text-sm bg-background focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
                      />
                      <p className="text-xs text-muted-foreground mt-1.5">
                        Necessário para validação de embarque nas estações.
                      </p>
                    </div>
                  </div>

                  <div className="mt-8 flex items-center justify-end border-t border-border pt-6">
                    <button
                      onClick={handleNextStep}
                      className="flex items-center gap-1.5 px-6 py-3 bg-primary text-primary-foreground hover:bg-accent rounded-xl font-bold text-sm transition-all shadow-sm active:scale-95"
                    >
                      Continuar para Escolha de Assento
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="bg-card border border-border rounded-3xl p-6 lg:p-8 animate-fade-in">
                  <div className="flex items-center gap-2.5 mb-6 border-b border-border pb-4">
                    <Users className="text-primary w-5 h-5" />
                    <h2 className="text-lg font-bold text-foreground">
                      Escolha de Assento Preferido
                    </h2>
                  </div>

                  <p className="text-sm text-muted-foreground mb-6">
                    Selecione a poltrona desejada no mapa do autocarro. Poltronas cinzentas já estão
                    ocupadas.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                    <div>{renderSeatsGrid()}</div>

                    <div className="space-y-4 bg-muted/20 border border-border p-5 rounded-2xl">
                      <h4 className="font-bold text-foreground text-sm">Resumo da Seleção</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between text-xs font-medium border-b border-border/60 pb-2">
                          <span className="text-muted-foreground">Classe:</span>
                          <span className="text-foreground font-semibold">{trip.classLabel}</span>
                        </div>
                        <div className="flex justify-between text-xs font-medium border-b border-border/60 pb-2">
                          <span className="text-muted-foreground">Preço do assento:</span>
                          <span className="text-foreground font-semibold">
                            {trip.price.toLocaleString('pt-AO')} Kz
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-xs font-medium">
                          <span className="text-muted-foreground">Assento Selecionado:</span>
                          {selectedSeat ? (
                            <span className="px-2.5 py-1 bg-primary/10 text-primary text-xs font-bold border border-primary/20 rounded-md">
                              Poltrona {selectedSeat}
                            </span>
                          ) : (
                            <span className="text-danger font-semibold">Nenhum selecionado</span>
                          )}
                        </div>
                      </div>
                      <div className="pt-2">
                        <p className="text-[11px] text-muted-foreground">
                          * A taxa de reserva é gratuita e o seguro de viagem está incluído nas
                          tarifas.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 flex items-center justify-between border-t border-border pt-6">
                    <button
                      onClick={() => setStep(1)}
                      className="px-5 py-3 border border-border text-foreground hover:bg-muted rounded-xl font-bold text-sm transition-colors active:scale-95"
                    >
                      Voltar
                    </button>
                    <button
                      onClick={handleNextStep}
                      disabled={!selectedSeat}
                      className="flex items-center gap-1.5 px-6 py-3 bg-primary text-primary-foreground hover:bg-accent rounded-xl font-bold text-sm transition-all shadow-sm active:scale-95 disabled:opacity-55 disabled:cursor-not-allowed"
                    >
                      Prosseguir para Pagamento
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="bg-card border border-border rounded-3xl p-6 lg:p-8 animate-fade-in">
                  <div className="flex items-center gap-2.5 mb-6 border-b border-border pb-4">
                    <CreditCard className="text-primary w-5 h-5" />
                    <h2 className="text-lg font-bold text-foreground">
                      Método de Pagamento Seguro
                    </h2>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
                    {[
                      { id: 'express', name: 'Multicaixa Express', logo: '💳' },
                      { id: 'referencia', name: 'Referência Pagamento', logo: '🧾' },
                      { id: 'unitel', name: 'Unitel Money', logo: '📱' },
                      { id: 'paypay', name: 'PayPay', logo: '👛' },
                    ].map((method) => (
                      <button
                        key={method.id}
                        type="button"
                        onClick={() => setPaymentMethod(method.id as any)}
                        className={`flex flex-col items-center justify-center p-4 border rounded-2xl transition-all ${
                          paymentMethod === method.id
                            ? 'border-primary bg-primary/5 text-primary shadow-sm scale-102 ring-1 ring-primary'
                            : 'border-border bg-card hover:border-primary/40 text-foreground'
                        }`}
                      >
                        <span className="text-2xl mb-1">{method.logo}</span>
                        <span className="text-xs font-semibold text-center">{method.name}</span>
                      </button>
                    ))}
                  </div>

                  {/* Payment Details forms */}
                  <div className="p-5 border border-border rounded-2xl bg-muted/10 mb-8 min-h-[160px]">
                    {paymentMethod === 'express' && (
                      <div className="space-y-3 animate-fade-in">
                        <h4 className="font-bold text-sm text-foreground">Multicaixa Express</h4>
                        <p className="text-xs text-muted-foreground">
                          Introduza o número de telefone associado ao seu cartão de débito no
                          Multicaixa Express. Receberá uma notificação instantânea para aprovação no
                          telemóvel.
                        </p>
                        <div className="max-w-xs mt-3">
                          <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                            Telemóvel Express
                          </label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-semibold">
                              +244
                            </span>
                            <input
                              type="tel"
                              value={expressPhone}
                              onChange={(e) => setExpressPhone(e.target.value)}
                              placeholder="9XX XXX XXX"
                              className="w-full pl-14 pr-4 py-2.5 border border-input rounded-xl text-sm bg-background focus:outline-none focus:border-primary"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {paymentMethod === 'referencia' && (
                      <div className="space-y-4 animate-fade-in">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-bold text-sm text-foreground">
                              Pagamento por Referência Bancária
                            </h4>
                            <p className="text-xs text-muted-foreground">
                              Pague em qualquer caixa eletrónico (Multicaixa) ou através do Internet
                              Banking (Homebanking) da sua conta.
                            </p>
                          </div>
                          <button
                            onClick={copyRefData}
                            className="flex items-center gap-1 px-3 py-1.5 border border-border hover:bg-muted text-xs font-semibold text-muted-foreground rounded-lg transition-colors"
                          >
                            <Copy size={12} />
                            Copiar dados
                          </button>
                        </div>

                        <div className="grid grid-cols-3 gap-2 border border-border rounded-xl bg-card p-4 text-center max-w-lg">
                          <div className="border-r border-border">
                            <span className="block text-[10px] text-muted-foreground font-black uppercase tracking-wider mb-1">
                              Entidade
                            </span>
                            <span className="text-sm font-bold text-foreground tabular-nums">
                              {mockRef.entidad}
                            </span>
                          </div>
                          <div className="border-r border-border">
                            <span className="block text-[10px] text-muted-foreground font-black uppercase tracking-wider mb-1">
                              Referência
                            </span>
                            <span className="text-sm font-bold text-primary tracking-wide tabular-nums">
                              {mockRef.ref}
                            </span>
                          </div>
                          <div>
                            <span className="block text-[10px] text-muted-foreground font-black uppercase tracking-wider mb-1">
                              Valor Total
                            </span>
                            <span className="text-sm font-bold text-foreground tabular-nums">
                              {mockRef.valor.toLocaleString('pt-AO')} Kz
                            </span>
                          </div>
                        </div>

                        <div className="p-3 bg-primary/5 rounded-xl border border-primary/20 flex gap-2 max-w-lg">
                          <AlertCircle size={15} className="text-primary flex-shrink-0 mt-0.5" />
                          <p className="text-[11px] text-primary font-medium leading-relaxed">
                            Pode clicar no botão &quot;Confirmar Pagamento&quot; abaixo para simular
                            a liquidação automática deste pagamento de referência.
                          </p>
                        </div>
                      </div>
                    )}

                    {paymentMethod === 'unitel' && (
                      <div className="space-y-3 animate-fade-in">
                        <h4 className="font-bold text-sm text-foreground">Unitel Money</h4>
                        <p className="text-xs text-muted-foreground">
                          Introduza o número Unitel e o PIN da sua carteira móvel digital Unitel
                          Money.
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md mt-3">
                          <div>
                            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                              Número Unitel
                            </label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-semibold">
                                +244
                              </span>
                              <input
                                type="tel"
                                value={unitelPhone}
                                onChange={(e) => setUnitelPhone(e.target.value)}
                                placeholder="9XX XXX XXX"
                                className="w-full pl-14 pr-4 py-2.5 border border-input rounded-xl text-sm bg-background focus:outline-none focus:border-primary"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                              PIN Carteira
                            </label>
                            <div className="relative">
                              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4 pointer-events-none" />
                              <input
                                type="password"
                                value={unitelPin}
                                onChange={(e) => setUnitelPin(e.target.value)}
                                placeholder="••••"
                                maxLength={4}
                                className="w-full pl-9 pr-4 py-2.5 border border-input rounded-xl text-sm bg-background focus:outline-none focus:border-primary tracking-widest"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {paymentMethod === 'paypay' && (
                      <div className="space-y-3 animate-fade-in">
                        <h4 className="font-bold text-sm text-foreground">PayPay Angola</h4>
                        <p className="text-xs text-muted-foreground">
                          Insira o número de telemóvel registado na sua aplicação PayPay. A
                          transação será processada instantaneamente.
                        </p>
                        <div className="max-w-xs mt-3">
                          <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                            Número de Conta PayPay
                          </label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-semibold">
                              +244
                            </span>
                            <input
                              type="tel"
                              value={paypayPhone}
                              onChange={(e) => setPaypayPhone(e.target.value)}
                              placeholder="9XX XXX XXX"
                              className="w-full pl-14 pr-4 py-2.5 border border-input rounded-xl text-sm bg-background focus:outline-none focus:border-primary"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-8 flex items-center justify-between border-t border-border pt-6">
                    <button
                      onClick={() => setStep(2)}
                      className="px-5 py-3 border border-border text-foreground hover:bg-muted rounded-xl font-bold text-sm transition-colors active:scale-95"
                    >
                      Voltar
                    </button>
                    <button
                      onClick={handleConfirmPayment}
                      className="flex items-center gap-1.5 px-7 py-3.5 bg-primary text-primary-foreground hover:bg-accent rounded-xl font-black text-sm transition-all shadow-md active:scale-95 hover:shadow-lg"
                    >
                      <ShieldCheck size={18} />
                      Confirmar Pagamento
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar Summary */}
            <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
              <div className="bg-card border border-border rounded-3xl p-5 lg:p-6 shadow-sm">
                <h3 className="font-bold text-foreground text-base border-b border-border pb-3 mb-4">
                  Resumo da Viagem
                </h3>

                {/* Journey Info */}
                <div className="space-y-4">
                  {/* Origin -> Dest */}
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="block text-[10px] text-muted-foreground font-black uppercase tracking-wider">
                        Origem
                      </span>
                      <span className="text-sm font-bold text-foreground">{trip.origin}</span>
                    </div>
                    <ArrowRight size={16} className="text-muted-foreground" />
                    <div className="text-right">
                      <span className="block text-[10px] text-muted-foreground font-black uppercase tracking-wider">
                        Destino
                      </span>
                      <span className="text-sm font-bold text-foreground">{trip.destination}</span>
                    </div>
                  </div>

                  {/* Date / Time */}
                  <div className="grid grid-cols-2 gap-4 border-t border-b border-border/60 py-3 my-2">
                    <div>
                      <span className="block text-[10px] text-muted-foreground font-black uppercase tracking-wider">
                        Data de Partida
                      </span>
                      <span className="text-xs font-bold text-foreground">15 de Junho, 2026</span>
                    </div>
                    <div className="text-right">
                      <span className="block text-[10px] text-muted-foreground font-black uppercase tracking-wider">
                        Horário
                      </span>
                      <span className="text-xs font-bold text-foreground">
                        {trip.departureTime} às {trip.arrivalTime}
                      </span>
                    </div>
                  </div>

                  {/* Details carrier / seat */}
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Operadora:</span>
                      <span className="font-semibold text-foreground">{trip.carrier}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Classe:</span>
                      <span className="font-semibold text-foreground">{trip.classLabel}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Assento Escolhido:</span>
                      <span className="font-bold text-primary">
                        {selectedSeat ? `Poltrona ${selectedSeat}` : 'Não selecionado'}
                      </span>
                    </div>
                  </div>

                  {/* Price Total */}
                  <div className="border-t border-border pt-4 mt-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-foreground">Preço Total:</span>
                      <span className="text-xl font-black text-primary tabular-nums">
                        {trip.price.toLocaleString('pt-AO')} Kz
                      </span>
                    </div>
                    <span className="text-[10px] text-muted-foreground mt-1 block">
                      Todos os impostos e taxas bancárias incluídos
                    </span>
                  </div>
                </div>
              </div>

              {/* Guarantees */}
              <div
                className="bg-primary/5 border border-primary/25 rounded-2xl p-4 flex gap-3 shadow-xs"
                style={{ marginTop: '24px' }}
              >
                <ShieldCheck size={24} className="text-primary flex-shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-primary mb-1">Compra 100% Protegida</h4>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Os seus dados bancários são encriptados e processados sob certificação de
                    segurança EMIS / Multicaixa Express.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <Loader2 className="animate-spin text-primary w-12 h-12" />
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
