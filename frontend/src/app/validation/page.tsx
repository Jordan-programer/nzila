'use client';

import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import {
  getReservations,
  updateReservationStatus,
  getCurrentUser,
  Reservation,
} from '@/app/components/mockDb';
import { toast } from 'sonner';
import {
  QrCode,
  Search,
  CheckCircle,
  AlertTriangle,
  XCircle,
  User,
  ArrowRight,
  Clock,
  MapPin,
  RefreshCw,
  Camera,
  Loader2,
} from 'lucide-react';

export default function TicketValidationPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [inputCode, setInputCode] = useState('');

  // Scanned Ticket result
  const [scannedTicket, setScannedTicket] = useState<Reservation | null>(null);
  const [validationResult, setValidationResult] = useState<
    'NONE' | 'VALID' | 'ALREADY_USED' | 'INVALID' | 'WRONG_CARRIER'
  >('NONE');
  const [scanning, setScanning] = useState(false);
  const [cameraSupported, setCameraSupported] = useState(true);

  const loadReservations = () => {
    setReservations(getReservations());
  };

  useEffect(() => {
    loadReservations();

    let scanner: any = null;
    let isScanningActive = true;

    const startScanner = async () => {
      try {
        const { Html5Qrcode } = await import('html5-qrcode');

        scanner = new Html5Qrcode('qr-reader');

        await scanner
          .start(
            { facingMode: 'environment' },
            {
              fps: 10,
              qrbox: { width: 220, height: 220 },
            },
            (decodedText: string) => {
              if (!isScanningActive) return;
              setInputCode(decodedText);
              handleValidate(decodedText);
            },
            (error: any) => {
              // Silence scanning errors
            }
          )
          .catch((err: any) => {
            console.warn('Erro ao ligar a câmara:', err);
            setCameraSupported(false);
          });
      } catch (err) {
        console.warn('Erro ao iniciar o leitor QR físico:', err);
        setCameraSupported(false);
      }
    };

    startScanner();

    return () => {
      isScanningActive = false;
      if (scanner) {
        scanner.stop().catch((err: any) => {
          console.warn('Erro ao parar câmara:', err);
        });
      }
    };
  }, []);

  const handleValidate = (codeToValidate: string) => {
    if (!codeToValidate.trim()) return;

    setScanning(true);
    setValidationResult('NONE');
    setScannedTicket(null);

    // Simulate camera/scanner delay
    setTimeout(() => {
      setScanning(false);
      const resList = getReservations();
      const ticket = resList.find(
        (r) => r.id.toLowerCase() === codeToValidate.trim().toLowerCase()
      );

      if (!ticket) {
        setValidationResult('INVALID');
        toast.error('Bilhete Inválido: Código não encontrado!');
        return;
      }

      setScannedTicket(ticket);

      // Verificar se o utilizador atual é um fiscal e se o bilhete pertence à sua transportadora
      const currentUser = getCurrentUser();
      if (currentUser && (currentUser.role === 'fiscal' || currentUser.role === 'FISCAL')) {
        const fiscalCompany = currentUser.company_code || 'TRANSLUX'; // Default to TRANSLUX
        if (ticket.carrierCode !== fiscalCompany) {
          setValidationResult('WRONG_CARRIER');
          toast.error(
            `Acesso Negado: Como fiscal da ${fiscalCompany}, não tem permissão para validar bilhetes da ${ticket.carrier || ticket.carrierCode}!`
          );
          return;
        }
      }

      if (ticket.status === 'CANCELADO') {
        setValidationResult('INVALID');
        toast.error('Bilhete Inválido: Esta reserva foi cancelada!');
      } else if (ticket.status === 'UTILIZADO' || ticket.status === 'EMBARCADO') {
        setValidationResult('ALREADY_USED');
        toast.warning('Atenção: Este bilhete já foi validado anteriormente!');
      } else {
        setValidationResult('VALID');
        toast.success('Bilhete Válido! Pronto para o embarque.');
      }
    }, 1000);
  };

  const handleConfirmBoarding = () => {
    if (scannedTicket && validationResult === 'VALID') {
      const nowStr =
        new Date().toLocaleTimeString('pt-AO', { hour: '2-digit', minute: '2-digit' }) +
        ' ' +
        new Date().toLocaleDateString('pt-AO');

      // Update DB to EMBARCADO / UTILIZADO
      updateReservationStatus(scannedTicket.id, 'EMBARCADO', nowStr);
      toast.success(`Embarque confirmado com sucesso para ${scannedTicket.passengerName}!`);

      // Update local state to mimic "already used" upon check-in
      const updated = { ...scannedTicket, status: 'EMBARCADO' as const, validationDate: nowStr };
      setScannedTicket(updated);
      setValidationResult('ALREADY_USED');

      loadReservations();
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background relative">
      <Header />

      <main className="flex-1 pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          {/* Header Section */}
          <div className="text-center mb-8">
            <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight mb-1.5">
              Validação de Bilhetes
            </h1>
            <p className="text-sm text-muted-foreground font-medium">
              Controlo e validação digital de embarques para fiscais e operadores Nzila nas
              estações.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            {/* Left side: Inputs & Scanning Simulation */}
            <div className="md:col-span-5 space-y-6">
              <div className="bg-card border border-border rounded-3xl p-5 shadow-sm space-y-5">
                {/* Manual Input */}
                <div>
                  <h3 className="text-xs font-black text-foreground uppercase tracking-wider mb-2.5">
                    Código da Reserva
                  </h3>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <input
                        type="text"
                        placeholder="RES-XXX-XXX..."
                        value={inputCode}
                        onChange={(e) => setInputCode(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 border border-input rounded-xl text-xs bg-background text-foreground focus:outline-none focus:border-primary font-mono font-bold"
                      />
                    </div>
                    <button
                      onClick={() => handleValidate(inputCode)}
                      className="px-4 py-2.5 bg-primary text-primary-foreground font-bold rounded-xl text-xs hover:bg-accent transition-colors active:scale-95 flex-shrink-0"
                    >
                      Validar
                    </button>
                  </div>
                </div>
                {/* Real QR Scanner Viewport */}
                <div className="border-t border-border pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-black text-foreground uppercase tracking-wider">
                      Leitor QR Code Câmara
                    </h3>
                    <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                  </div>
                  {/* Camera feed from html5-qrcode */}
                  <div className="aspect-square bg-slate-950 border border-slate-800 rounded-2xl relative overflow-hidden flex items-center justify-center">
                    {cameraSupported ? (
                      <>
                        <div id="qr-reader" className="w-full h-full" />
                        {/* Futuristic Laser Scanner Overlay */}
                        <div className="absolute inset-x-0 h-0.5 bg-success shadow-lg shadow-success z-10 animate-laser pointer-events-none" />
                      </>
                    ) : (
                      <div className="text-center z-10 p-4 space-y-2">
                        <QrCode size={40} className="text-white/20 mx-auto" />
                        <span className="text-[10px] text-amber-500 font-bold uppercase tracking-wider block">
                          Câmara Indisponível (Sem SSL/HTTPS)
                        </span>
                        <span className="text-[9px] text-white/40 max-w-[220px] mx-auto block leading-normal font-medium">
                          O navegador bloqueia a câmara em ligações HTTP simples. Use o simulador
                          rápido abaixo.
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Right side: Scanned Result Card */}
            <div className="md:col-span-7 space-y-6">
              {validationResult === 'NONE' && !scanning && (
                <div className="bg-card border border-border rounded-3xl p-10 shadow-sm text-center min-h-[300px] flex flex-col items-center justify-center">
                  <div className="p-3 bg-muted rounded-2xl text-muted-foreground mb-4">
                    <QrCode size={36} />
                  </div>
                  <h3 className="font-bold text-foreground text-sm mb-1">Aguardando Validação</h3>
                  <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                    Introduza o código da reserva ou selecione uma leitura rápida para analisar os
                    dados e confirmar o embarque do passageiro.
                  </p>
                </div>
              )}

              {scanning && (
                <div className="bg-card border border-border rounded-3xl p-10 shadow-sm text-center min-h-[300px] flex flex-col items-center justify-center">
                  <Loader2 className="animate-spin text-primary w-10 h-10 mb-4" />
                  <h3 className="font-bold text-foreground text-sm">
                    A processar dados da EMIS...
                  </h3>
                </div>
              )}

              {/* Scanned Card Results */}
              {validationResult !== 'NONE' && !scanning && scannedTicket && (
                <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-md animate-fade-in min-h-[300px] flex flex-col justify-between">
                  {/* Status Banner */}
                  {validationResult === 'VALID' && (
                    <div className="bg-success/15 border-b border-success/20 p-4 text-center text-success flex items-center justify-center gap-2">
                      <CheckCircle size={20} className="stroke-[2.5]" />
                      <span className="font-extrabold text-sm tracking-wide uppercase">
                        ✅ Bilhete Válido — Pronto Embarque
                      </span>
                    </div>
                  )}

                  {validationResult === 'ALREADY_USED' && (
                    <div className="bg-warning/15 border-b border-warning/20 p-4 text-center text-warning-foreground flex items-center justify-center gap-2">
                      <AlertTriangle size={20} className="stroke-[2.5]" />
                      <span className="font-extrabold text-sm tracking-wide uppercase">
                        ⚠️ Bilhete Já Utilizado / Validado
                      </span>
                    </div>
                  )}

                  {validationResult === 'INVALID' && (
                    <div className="bg-danger/15 border-b border-danger/20 p-4 text-center text-danger flex items-center justify-center gap-2">
                      <XCircle size={20} className="stroke-[2.5]" />
                      <span className="font-extrabold text-sm tracking-wide uppercase">
                        ❌ Bilhete Inválido / Cancelado
                      </span>
                    </div>
                  )}

                  {validationResult === 'WRONG_CARRIER' && (
                    <div className="bg-danger/15 border-b border-danger/20 p-4 text-center text-danger flex items-center justify-center gap-2">
                      <AlertTriangle size={20} className="stroke-[2.5]" />
                      <span className="font-extrabold text-sm tracking-wide uppercase">
                        ⚠️ Outra Transportadora
                      </span>
                    </div>
                  )}

                  {/* Ticket details */}
                  <div className="p-6 space-y-6 flex-1">
                    {/* Passenger Profile */}
                    <div className="flex items-center gap-3 border-b border-border pb-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center font-black text-primary text-lg">
                        {scannedTicket.passengerName.charAt(0)}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-foreground">
                          {scannedTicket.passengerName}
                        </h3>
                        <span className="text-xs text-muted-foreground font-semibold font-mono">
                          B.I.: {scannedTicket.passengerDocument}
                        </span>
                      </div>
                    </div>

                    {/* Route Details */}
                    <div className="grid grid-cols-2 gap-4 text-xs font-semibold">
                      <div>
                        <span className="block text-[9px] text-muted-foreground uppercase font-black mb-0.5">
                          Origem → Destino
                        </span>
                        <span className="text-foreground text-sm font-bold flex items-center gap-1">
                          {scannedTicket.origin}{' '}
                          <ArrowRight size={12} className="text-muted-foreground" />{' '}
                          {scannedTicket.destination}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[9px] text-muted-foreground uppercase font-black mb-0.5">
                          Nº Reserva
                        </span>
                        <span className="text-foreground font-mono font-bold text-primary text-sm">
                          {scannedTicket.id}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[9px] text-muted-foreground uppercase font-black mb-0.5">
                          Poltrona / Classe
                        </span>
                        <span className="text-foreground font-bold">
                          Poltrona {scannedTicket.seat} ({scannedTicket.classLabel})
                        </span>
                      </div>
                      <div>
                        <span className="block text-[9px] text-muted-foreground uppercase font-black mb-0.5">
                          Transportadora
                        </span>
                        <span className="text-foreground">{scannedTicket.carrier}</span>
                      </div>
                    </div>

                    {/* Wrong carrier warning */}
                    {validationResult === 'WRONG_CARRIER' && (
                      <div className="p-3 bg-danger/5 border border-danger/25 rounded-xl flex gap-2">
                        <AlertTriangle size={16} className="text-danger flex-shrink-0 mt-0.5" />
                        <p className="text-[11px] text-danger leading-relaxed font-semibold">
                          Acesso Negado: Este bilhete pertence à operadora{' '}
                          <strong className="underline">{scannedTicket.carrier}</strong>.<br />
                          Como fiscal da{' '}
                          <strong className="underline">
                            {getCurrentUser()?.company_code || 'TRANSLUX'}
                          </strong>
                          , apenas tem autorização para confirmar embarques da sua própria
                          transportadora.
                        </p>
                      </div>
                    )}

                    {/* Already used timestamps warning */}
                    {validationResult === 'ALREADY_USED' && scannedTicket.validationDate && (
                      <div className="p-3 bg-muted/60 border border-border rounded-xl flex gap-2">
                        <Clock size={16} className="text-muted-foreground flex-shrink-0 mt-0.5" />
                        <p className="text-[11px] text-muted-foreground leading-relaxed font-semibold">
                          Este bilhete foi validado na estação no dia/hora:
                          <br />
                          <strong className="text-foreground font-mono">
                            {scannedTicket.validationDate}
                          </strong>
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Actions Confirm */}
                  <div className="px-6 py-4 bg-muted border-t border-border flex items-center justify-end">
                    {validationResult === 'VALID' ? (
                      <button
                        onClick={handleConfirmBoarding}
                        className="w-full sm:w-auto px-6 py-3 bg-primary text-primary-foreground font-black rounded-xl text-xs hover:bg-accent transition-colors shadow-md active:scale-95"
                      >
                        Confirmar Embarque
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setValidationResult('NONE');
                          setScannedTicket(null);
                          setInputCode('');
                        }}
                        className="w-full sm:w-auto px-6 py-2.5 border border-border rounded-xl text-xs font-bold hover:bg-card text-muted-foreground transition-colors"
                      >
                        Limpar Ecrã
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
