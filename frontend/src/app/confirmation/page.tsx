'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { getReservationById, Reservation } from '@/app/components/mockDb';
import { toast } from 'sonner';
import {
  Check,
  Download,
  Mail,
  Share2,
  Calendar,
  Clock,
  User,
  Ticket,
  ChevronRight,
  Printer,
  X,
  Send,
  Loader2,
} from 'lucide-react';

function ConfirmationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams.get('code');

  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [confetti, setConfetti] = useState<any[]>([]);

  // Initialize confetti particles
  useEffect(() => {
    const colors = ['#059669', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
    const particles = Array.from({ length: 80 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100, // percentage width
      y: Math.random() * -20 - 5, // initial offset top
      size: Math.random() * 8 + 5, // random sizes
      color: colors[Math.floor(Math.random() * colors.length)],
      delay: Math.random() * 3,
      duration: Math.random() * 2 + 2,
    }));
    setConfetti(particles);
  }, []);

  // Load reservation details
  useEffect(() => {
    if (!code) {
      toast.error('Nenhum código de reserva fornecido.');
      router.push('/results-page');
      return;
    }

    const res = getReservationById(code);
    if (!res) {
      toast.error('Reserva não encontrada no sistema.');
      // router.push('/results-page');
      return;
    }
    setReservation(res);
  }, [code, router]);

  const handlePrint = () => {
    window.print();
  };

  const handleSendEmail = () => {
    setSendingEmail(true);
    setTimeout(() => {
      setSendingEmail(false);
      setShowEmailModal(true);
      toast.success(
        `E-mail com o bilhete enviado para ${reservation?.passengerEmail || 'o seu email'}!`
      );
    }, 1500);
  };

  const handleShare = () => {
    if (navigator.share && reservation) {
      navigator
        .share({
          title: `Bilhete Digital Nzila - ${reservation.id}`,
          text: `Olá! Aqui está o meu bilhete de ${reservation.origin} para ${reservation.destination}. Assento: ${reservation.seat}.`,
          url: window.location.href,
        })
        .then(() => toast.success('Bilhete partilhado com sucesso!'))
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link do bilhete digital copiado para a área de transferência!');
    }
  };

  if (!reservation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="animate-spin text-primary w-12 h-12" />
      </div>
    );
  }

  // Stylish detailed SVG QR code generator
  const renderQrCodeSvg = () => {
    return (
      <svg
        width="150"
        height="150"
        viewBox="0 0 29 29"
        className="text-foreground fill-current animate-pulse"
      >
        {/* Anchors (Top-Left) */}
        <rect x="0" y="0" width="7" height="7" />
        <rect x="1" y="1" width="5" height="5" fill="#FFF" />
        <rect x="2" y="2" width="3" height="3" />

        {/* Anchors (Top-Right) */}
        <rect x="22" y="0" width="7" height="7" />
        <rect x="23" y="1" width="5" height="5" fill="#FFF" />
        <rect x="24" y="2" width="3" height="3" />

        {/* Anchors (Bottom-Left) */}
        <rect x="0" y="22" width="7" height="7" />
        <rect x="1" y="23" width="5" height="5" fill="#FFF" />
        <rect x="2" y="24" width="3" height="3" />

        {/* Random QR pixels for simulation */}
        <rect x="9" y="1" width="2" height="1" />
        <rect x="13" y="0" width="1" height="3" />
        <rect x="16" y="2" width="3" height="1" />
        <rect x="20" y="1" width="1" height="2" />

        <rect x="8" y="5" width="3" height="1" />
        <rect x="12" y="4" width="2" height="2" />
        <rect x="15" y="5" width="1" height="4" />
        <rect x="19" y="4" width="2" height="1" />

        <rect x="0" y="9" width="3" height="1" />
        <rect x="4" y="8" width="1" height="3" />
        <rect x="8" y="10" width="2" height="2" />
        <rect x="11" y="9" width="3" height="1" />
        <rect x="16" y="8" width="1" height="3" />
        <rect x="19" y="9" width="4" height="2" />
        <rect x="25" y="8" width="2" height="1" />

        <rect x="2" y="14" width="4" height="1" />
        <rect x="7" y="13" width="1" height="3" />
        <rect x="10" y="15" width="2" height="1" />
        <rect x="13" y="13" width="3" height="2" />
        <rect x="17" y="14" width="1" height="3" />
        <rect x="20" y="13" width="3" height="1" />
        <rect x="24" y="14" width="2" height="3" />

        <rect x="1" y="18" width="2" height="2" />
        <rect x="5" y="19" width="3" height="1" />
        <rect x="9" y="17" width="1" height="3" />
        <rect x="12" y="19" width="4" height="1" />
        <rect x="18" y="18" width="2" height="2" />
        <rect x="21" y="19" width="3" height="1" />
        <rect x="26" y="18" width="2" height="2" />

        <rect x="8" y="23" width="3" height="1" />
        <rect x="12" y="22" width="2" height="2" />
        <rect x="15" y="24" width="3" height="1" />
        <rect x="19" y="22" width="2" height="4" />
      </svg>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-background relative print:bg-white print:p-0">
      <Header />

      {/* Confetti Particles Container */}
      <div className="absolute inset-x-0 top-0 h-[600px] overflow-hidden pointer-events-none z-10 print:hidden">
        {confetti.map((p) => (
          <div
            key={p.id}
            className="absolute rounded-xs rotate-45 opacity-75"
            style={{
              left: `${p.x}%`,
              top: `${p.y}px`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              backgroundColor: p.color,
              transform: `translateY(600px) rotate(${Math.random() * 360}deg)`,
              transition: `transform ${p.duration}s cubic-bezier(0.25, 0.46, 0.45, 0.94) ${p.delay}s`,
            }}
            ref={(el) => {
              if (el) {
                // Trigger reflow to animate
                setTimeout(() => {
                  el.style.transform = `translateY(650px) rotate(${Math.random() * 720}deg)`;
                }, 50);
              }
            }}
          />
        ))}
      </div>

      {/* Email View Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 print:hidden animate-fade-in">
          <div className="w-full max-w-2xl bg-card border border-border rounded-3xl overflow-hidden shadow-2xl animate-bounce-in flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between px-6 py-4 bg-muted border-b border-border">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-danger" />
                <div className="w-2.5 h-2.5 rounded-full bg-warning" />
                <div className="w-2.5 h-2.5 rounded-full bg-success" />
                <span className="text-xs font-bold text-muted-foreground ml-2 font-mono">
                  Caixa de Entrada: Nzila Notificações
                </span>
              </div>
              <button
                onClick={() => setShowEmailModal(false)}
                className="p-1 rounded-lg text-muted-foreground hover:bg-border transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Email Headers */}
            <div className="p-4 border-b border-border bg-card space-y-2 text-xs">
              <div>
                <span className="font-semibold text-muted-foreground inline-block w-16">De:</span>
                <span className="font-semibold text-foreground">
                  Nzila Reservas &lt;reservas@nzila.co.ao&gt;
                </span>
              </div>
              <div>
                <span className="font-semibold text-muted-foreground inline-block w-16">Para:</span>
                <span className="font-semibold text-foreground">{reservation.passengerEmail}</span>
              </div>
              <div>
                <span className="font-semibold text-muted-foreground inline-block w-16">
                  Assunto:
                </span>
                <span className="font-bold text-foreground">
                  Confirmação de Reserva — Bilhete Digital Nzila #{reservation.id}
                </span>
              </div>
            </div>

            {/* Email Body */}
            <div className="p-6 bg-slate-50 flex-1 overflow-y-auto font-sans">
              <div className="max-w-xl mx-auto bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden text-slate-800">
                {/* Logo Header */}
                <div className="bg-emerald-600 p-6 text-center text-white">
                  <h2 className="text-2xl font-black tracking-tight">Nzila</h2>
                  <p className="text-xs text-emerald-100 font-medium tracking-wide mt-1">
                    Viagens Interprovinciais Facilitadas
                  </p>
                </div>

                <div className="p-6 space-y-4 text-sm leading-relaxed">
                  <p className="font-semibold text-base text-slate-900">
                    Olá, {reservation.passengerName}!
                  </p>
                  <p>
                    Agradecemos a sua preferência pelo Nzila. O seu pagamento foi processado com
                    sucesso e o seu lugar está garantido!
                  </p>

                  {/* Summary Box */}
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                    <div className="flex justify-between border-b border-slate-200 pb-1.5 text-xs">
                      <span className="text-slate-500 font-medium">Código da Reserva:</span>
                      <strong className="text-slate-900 font-mono text-emerald-600">
                        {reservation.id}
                      </strong>
                    </div>
                    <div className="flex justify-between border-b border-slate-200 pb-1.5 text-xs">
                      <span className="text-slate-500 font-medium">Viagem:</span>
                      <strong className="text-slate-900">
                        {reservation.origin} para {reservation.destination}
                      </strong>
                    </div>
                    <div className="flex justify-between border-b border-slate-200 pb-1.5 text-xs">
                      <span className="text-slate-500 font-medium">Data:</span>
                      <strong className="text-slate-900">15 de Junho, 2026</strong>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500 font-medium">Poltrona e Classe:</span>
                      <strong className="text-slate-900">
                        Poltrona {reservation.seat} ({reservation.classLabel})
                      </strong>
                    </div>
                  </div>

                  <p>
                    Apresente o <strong className="text-slate-900">QR Code</strong> do seu bilhete
                    digital anexado a este email ou no ecrã do seu telemóvel ao fiscal no momento do
                    embarque.
                  </p>

                  <div className="border-t border-slate-200 pt-4 text-center">
                    <span className="text-xs text-slate-400 font-medium block">
                      Nzila Angola - 2026. Todos os direitos reservados.
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-muted border-t border-border flex items-center justify-end">
              <button
                onClick={() => setShowEmailModal(false)}
                className="px-5 py-2 bg-primary text-primary-foreground font-semibold rounded-xl text-sm hover:bg-accent transition-colors"
              >
                Fechar Visualizador
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Body */}
      <main className="flex-1 pt-24 pb-16 print:p-0">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 print:px-0">
          {/* Confirmação Header */}
          <div className="text-center mb-8 print:hidden">
            {/* Pulsing circular success tick */}
            <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4 border border-success/20 animate-fade-in">
              <Check className="text-success w-8 h-8 stroke-[3]" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
              Pagamento Realizado!
            </h1>
            <p className="text-sm text-muted-foreground mt-1.5 font-medium">
              Obrigado! O seu pagamento foi processado e a sua reserva foi confirmada.
            </p>
          </div>

          {/* Action buttons (Top) */}
          <div className="flex items-center justify-center gap-2.5 mb-8 print:hidden">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2.5 border border-border hover:bg-muted text-foreground rounded-xl text-xs font-bold transition-all hover:border-foreground/30 active:scale-95 shadow-sm"
            >
              <Printer size={14} />
              Imprimir Bilhete
            </button>
            <button
              onClick={handleSendEmail}
              disabled={sendingEmail}
              className="flex items-center gap-1.5 px-4 py-2.5 border border-border hover:bg-muted text-foreground rounded-xl text-xs font-bold transition-all hover:border-foreground/30 active:scale-95 shadow-sm disabled:opacity-50"
            >
              {sendingEmail ? <Loader2 size={14} className="animate-spin" /> : <Mail size={14} />}
              Enviar por E-mail
            </button>
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 px-4 py-2.5 border border-border hover:bg-muted text-foreground rounded-xl text-xs font-bold transition-all hover:border-foreground/30 active:scale-95 shadow-sm"
            >
              <Share2 size={14} />
              Partilhar
            </button>
          </div>

          {/* High-Fidelity Boarding Pass Ticket */}
          <div className="bg-card border border-border rounded-3xl shadow-lg overflow-hidden animate-slide-up print:border-none print:shadow-none print:rounded-none">
            {/* Ticket Header Banner */}
            <div
              className={`p-4 ${reservation.carrierColor} text-white flex items-center justify-between print:bg-emerald-700`}
            >
              <div className="flex items-center gap-2">
                <Ticket className="w-5 h-5 text-white" />
                <span className="font-extrabold text-sm tracking-widest uppercase">
                  Cartão de Embarque
                </span>
              </div>
              <div className="px-2.5 py-0.5 bg-white/10 rounded-md border border-white/20 text-[10px] font-bold tracking-wider uppercase">
                {reservation.classLabel}
              </div>
            </div>

            {/* Main Ticket Card Content */}
            <div className="p-6 lg:p-8 space-y-6">
              {/* Route Summary Row */}
              <div className="flex items-center justify-between border-b border-border pb-6">
                <div>
                  <span className="block text-[10px] text-muted-foreground font-black uppercase tracking-wider mb-1">
                    Origem
                  </span>
                  <h3 className="text-2xl font-black text-foreground">{reservation.origin}</h3>
                  <span className="text-xs text-muted-foreground font-medium">Angola</span>
                </div>
                <div className="flex flex-col items-center gap-1.5 flex-1 max-w-[120px] px-2 text-center">
                  <span className="text-[10px] text-muted-foreground font-bold tracking-wider uppercase">
                    {reservation.carrierCode}
                  </span>
                  <div className="w-full flex items-center gap-1">
                    <div className="flex-1 h-px bg-border" />
                    <ChevronRight size={14} className="text-primary" />
                    <div className="flex-1 h-px bg-border" />
                  </div>
                  <span className="text-[9px] text-muted-foreground font-black uppercase bg-muted px-2 py-0.5 rounded-full border border-border">
                    Interprovincial
                  </span>
                </div>
                <div className="text-right">
                  <span className="block text-[10px] text-muted-foreground font-black uppercase tracking-wider mb-1">
                    Destino
                  </span>
                  <h3 className="text-2xl font-black text-foreground">{reservation.destination}</h3>
                  <span className="text-xs text-muted-foreground font-medium">Angola</span>
                </div>
              </div>

              {/* Passenger & Code info */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 py-2">
                <div>
                  <span className="block text-[10px] text-muted-foreground font-black uppercase tracking-wider mb-1">
                    Passageiro
                  </span>
                  <span className="text-sm font-bold text-foreground">
                    {reservation.passengerName}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] text-muted-foreground font-black uppercase tracking-wider mb-1">
                    B.I. / Documento
                  </span>
                  <span className="text-sm font-semibold text-foreground font-mono">
                    {reservation.passengerDocument}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] text-muted-foreground font-black uppercase tracking-wider mb-1">
                    Nº Reserva
                  </span>
                  <span className="text-sm font-bold text-primary font-mono select-all">
                    {reservation.id}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] text-muted-foreground font-black uppercase tracking-wider mb-1">
                    Lugar / Poltrona
                  </span>
                  <span className="text-sm font-black text-foreground bg-primary/10 border border-primary/20 text-primary px-2.5 py-0.5 rounded-md inline-block">
                    {reservation.seat}
                  </span>
                </div>
              </div>

              {/* Journey Details row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 border-t border-border pt-6">
                <div>
                  <div className="flex items-center gap-1.5 text-muted-foreground mb-1.5">
                    <Calendar size={13} />
                    <span className="text-[10px] font-black uppercase tracking-wider">
                      Data de Partida
                    </span>
                  </div>
                  <span className="text-sm font-bold text-foreground">15 de Junho, 2026</span>
                </div>
                <div>
                  <div className="flex items-center gap-1.5 text-muted-foreground mb-1.5">
                    <Clock size={13} />
                    <span className="text-[10px] font-black uppercase tracking-wider">
                      Hora Partida
                    </span>
                  </div>
                  <span className="text-sm font-bold text-foreground">
                    {reservation.departureTime}
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-1.5 text-muted-foreground mb-1.5">
                    <Clock size={13} />
                    <span className="text-[10px] font-black uppercase tracking-wider">
                      Hora Chegada
                    </span>
                  </div>
                  <span className="text-sm font-bold text-foreground">
                    {reservation.arrivalTime}
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-1.5 text-muted-foreground mb-1.5">
                    <User size={13} />
                    <span className="text-[10px] font-black uppercase tracking-wider">
                      Transportadora
                    </span>
                  </div>
                  <span className="text-sm font-bold text-foreground">{reservation.carrier}</span>
                </div>
              </div>

              {/* Boarding pass tear section separator (visual only) */}
              <div className="flex items-center justify-between my-4 print:hidden">
                <div className="w-4 h-8 bg-background border-r border-border rounded-r-full -ml-8 flex-shrink-0" />
                <div className="flex-1 border-t border-dashed border-border" />
                <div className="w-4 h-8 bg-background border-l border-border rounded-l-full -mr-8 flex-shrink-0" />
              </div>

              {/* QR Code and Terms section */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center pt-2">
                <div className="md:col-span-2 space-y-3.5">
                  <h4 className="font-extrabold text-sm text-foreground uppercase tracking-wider">
                    Termos e Condições de Viagem
                  </h4>
                  <ul className="text-xs text-muted-foreground space-y-1.5 list-disc pl-4 font-medium leading-relaxed">
                    <li>
                      Por favor, compareça no terminal de embarque pelo menos{' '}
                      <strong className="text-foreground">45 minutos</strong> antes do horário de
                      partida.
                    </li>
                    <li>
                      Apresente este bilhete digital e o seu Bilhete de Identidade original ao
                      fiscal para validação.
                    </li>
                    <li>Permitida bagagem de mão até 10kg e bagagem de porão até 20kg.</li>
                    <li>
                      Cancelamentos ou alterações podem ser efetuadas com reembolso integral até 24
                      horas antes na Área do Cliente.
                    </li>
                  </ul>
                </div>

                <div className="flex flex-col items-center justify-center p-4 bg-muted/40 border border-border rounded-2xl">
                  {renderQrCodeSvg()}
                  <span className="text-[9px] text-muted-foreground font-black tracking-widest uppercase mt-3 select-none">
                    Token Único de Embarque
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer note and Area cliente prompt */}
          <div className="text-center mt-8 space-y-4 print:hidden">
            <p className="text-xs text-muted-foreground font-medium max-w-md mx-auto leading-relaxed">
              Deseja gerir as suas viagens ou solicitar cancelamento? Aceda à sua{' '}
              <button
                onClick={() => router.push('/client')}
                className="text-primary font-bold hover:underline"
              >
                Área do Cliente
              </button>{' '}
              onde poderá consultar todos os bilhetes emitidos.
            </p>

            <button
              onClick={() => router.push('/client')}
              className="px-6 py-2.5 bg-primary text-primary-foreground hover:bg-accent rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95"
            >
              Ir para a Minha Área de Cliente
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function ConfirmationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <Loader2 className="animate-spin text-primary w-12 h-12" />
        </div>
      }
    >
      <ConfirmationContent />
    </Suspense>
  );
}
