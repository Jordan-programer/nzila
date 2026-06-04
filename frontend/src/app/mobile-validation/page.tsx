'use client';

import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { getReservations, updateReservationStatus, getCurrentUser, Reservation } from '@/app/components/mockDb';
import { toast } from 'sonner';
import {
  QrCode,
  Smartphone,
  Wifi,
  WifiOff,
  RefreshCw,
  Search,
  Check,
  X,
  History,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2,
  Phone,
  Camera,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';

interface LocalValidationLog {
  id: string;
  passengerName: string;
  route: string;
  time: string;
  status: 'SUCESSO' | 'OFFLINE_PENDENTE' | 'DUPLICADO';
}

export default function MobileValidationApp() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [offlineMode, setOfflineMode] = useState(false);
  const [offlineQueue, setOfflineQueue] = useState<string[]>([]); // Reservation IDs validated offline
  const [validationHistory, setValidationHistory] = useState<LocalValidationLog[]>([]);

  // Scanning simulation states
  const [scanCode, setScanCode] = useState('');
  const [activeTab, setActiveTab] = useState<'scan' | 'historico'>('scan');
  const [scanning, setScanning] = useState(false);

  // Validation result overlay
  const [resultTicket, setResultTicket] = useState<Reservation | null>(null);
  const [resultStatus, setResultStatus] = useState<'NONE' | 'VALID' | 'USED' | 'INVALID' | 'WRONG_CARRIER'>('NONE');
  const [syncing, setSyncing] = useState(false);
  const [cameraSupported, setCameraSupported] = useState(true);

  const loadReservations = () => {
    setReservations(getReservations());
  };

  useEffect(() => {
    loadReservations();
    // Load initial validation history
    setValidationHistory([
      {
        id: 'RES-LUA-HUA-20260601-M8Y2P1',
        passengerName: 'Fátima Manuel',
        route: 'LUA→HUA',
        time: '05:48',
        status: 'SUCESSO',
      },
      {
        id: 'RES-LUA-HUA-20260601-A2B3C4',
        passengerName: 'António Gouveia',
        route: 'LUA→HUA',
        time: '05:51',
        status: 'SUCESSO',
      },
    ]);

    let scanner: any = null;
    let isScanningActive = true;

    const startScanner = async () => {
      try {
        const { Html5Qrcode } = await import('html5-qrcode');
        
        scanner = new Html5Qrcode('qr-reader-mobile');
        
        await scanner.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 150, height: 150 },
          },
          (decodedText: string) => {
            if (!isScanningActive) return;
            handleScanCode(decodedText);
          },
          (error: any) => {
            // Silence scanning errors
          }
        ).catch((err: any) => {
          console.warn('Erro ao ligar a câmara:', err);
          setCameraSupported(false);
        });
      } catch (err) {
        console.warn('Erro ao iniciar o leitor QR móvel:', err);
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

  // Handle offline sync transition
  const handleToggleOffline = () => {
    if (offlineMode) {
      // Transitioning from OFFLINE -> ONLINE
      if (offlineQueue.length > 0) {
        setSyncing(true);
        toast.info(`A sincronizar ${offlineQueue.length} validações locais pendentes...`);

        setTimeout(() => {
          setSyncing(false);
          const currentRes = getReservations();
          const nowStr = new Date().toLocaleTimeString('pt-AO', {
            hour: '2-digit',
            minute: '2-digit',
          });

          // Flush offline validations to primary LocalStorage
          offlineQueue.forEach((code) => {
            updateReservationStatus(code, 'EMBARCADO', `${nowStr} (Sincronizado)`);
          });

          // Update validation history UI logs
          const syncedLogs = validationHistory.map((log) => {
            if (log.status === 'OFFLINE_PENDENTE') {
              return { ...log, status: 'SUCESSO' as const };
            }
            return log;
          });

          setValidationHistory(syncedLogs);
          setOfflineQueue([]);
          setOfflineMode(false);
          toast.success('Validações sincronizadas e banco de dados centralizado atualizado!');
          loadReservations();
        }, 2200);
      } else {
        setOfflineMode(false);
        toast.success('Dispositivo Online!');
      }
    } else {
      // ONLINE -> OFFLINE
      setOfflineMode(true);
      toast.warning('Dispositivo em Modo Offline. Validações serão guardadas localmente.');
    }
  };

  const handleScanCode = (code: string) => {
    if (!code) return;
    setScanning(true);
    setResultStatus('NONE');
    setResultTicket(null);

    setTimeout(() => {
      setScanning(false);
      const ticket = reservations.find((r) => r.id.toLowerCase() === code.trim().toLowerCase());

      if (!ticket) {
        setResultStatus('INVALID');
        toast.error('Código inválido ou inexistente.');
        return;
      }

      setResultTicket(ticket);

      // Verificar se o utilizador atual é um fiscal e se o bilhete pertence à sua transportadora
      const currentUser = getCurrentUser();
      if (currentUser && (currentUser.role === 'fiscal' || currentUser.role === 'FISCAL')) {
        const fiscalCompany = currentUser.company_code || 'TRANSLUX'; // Default to TRANSLUX
        if (ticket.carrierCode !== fiscalCompany) {
          setResultStatus('WRONG_CARRIER');
          toast.error(`Acesso Negado: Como fiscal da ${fiscalCompany}, não pode validar bilhetes da ${ticket.carrier || ticket.carrierCode}!`);
          return;
        }
      }

      if (ticket.status === 'CANCELADO') {
        setResultStatus('INVALID');
      } else if (
        ticket.status === 'UTILIZADO' ||
        ticket.status === 'EMBARCADO' ||
        offlineQueue.includes(ticket.id)
      ) {
        setResultStatus('USED');
      } else {
        setResultStatus('VALID');
      }
    }, 800);
  };

  const handleConfirmMobileBoarding = () => {
    if (resultTicket && resultStatus === 'VALID') {
      const nowStr = new Date().toLocaleTimeString('pt-AO', { hour: '2-digit', minute: '2-digit' });

      const newHistoryLog: LocalValidationLog = {
        id: resultTicket.id,
        passengerName: resultTicket.passengerName,
        route: `${resultTicket.origin.substring(0, 3).toUpperCase()}→${resultTicket.destination.substring(0, 3).toUpperCase()}`,
        time: nowStr,
        status: offlineMode ? 'OFFLINE_PENDENTE' : 'SUCESSO',
      };

      if (offlineMode) {
        // Cached locally in queue
        setOfflineQueue([...offlineQueue, resultTicket.id]);
        toast.info('Embarque registado no cache local offline!');
      } else {
        // Direct API update
        updateReservationStatus(resultTicket.id, 'EMBARCADO', `${nowStr} (Fiscal Móvel)`);
        toast.success('Embarque confirmado via central online!');
        loadReservations();
      }

      setValidationHistory([newHistoryLog, ...validationHistory]);

      // Update result state to show as utilized immediately
      setResultStatus('USED');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background relative">
      <Header />

      <main className="flex-1 pt-24 pb-16 flex flex-col items-center justify-center">
        <div className="max-w-md w-full px-4 text-center mb-4">
          <h1 className="text-xl font-black text-foreground">Fiscalização Móvel (Smartphone)</h1>
          <p className="text-xs text-muted-foreground">
            Prototipagem responsiva otimizada para o telemóvel do fiscal de embarque.
          </p>
        </div>

        {/* Smartphone Frame Wrapper */}
        <div className="w-full max-w-[360px] h-[640px] bg-slate-900 border-8 border-slate-950 rounded-[40px] shadow-2xl relative overflow-hidden flex flex-col items-stretch select-none text-slate-800">
          {/* Smartphone Speaker notch */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-32 h-5 bg-slate-950 rounded-full z-30 flex items-center justify-center">
            <div className="w-12 h-1 bg-slate-800 rounded-full" />
          </div>

          {/* Syncing Overlay */}
          {syncing && (
            <div className="absolute inset-0 bg-white/95 z-50 flex flex-col items-center justify-center p-6 text-center">
              <Loader2 className="animate-spin text-primary w-12 h-12 mb-4" />
              <h4 className="font-bold text-sm text-foreground">Sincronização Ativa</h4>
              <p className="text-xs text-muted-foreground mt-1">
                A enviar dados locais de validação para o Painel Central da Macon e Translux...
              </p>
            </div>
          )}

          {/* Phone Header Status Bar */}
          <div className="h-10 bg-slate-100 flex items-end justify-between px-6 pb-2 text-[10px] font-black text-foreground border-b border-border z-20">
            <span className="tabular-nums">19:38</span>
            <div className="flex items-center gap-1.5">
              {offlineMode ? (
                <WifiOff size={11} className="text-danger" />
              ) : (
                <Wifi size={11} className="text-success" />
              )}
              <span>Nzila App</span>
            </div>
          </div>

          {/* App Title & Offline Controller */}
          <div className="bg-card px-4 py-3 border-b border-border flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-1.5">
              <Smartphone size={15} className="text-primary" />
              <span className="text-xs font-bold text-foreground">Fiscal de Pista</span>
            </div>

            {/* Offline Switch */}
            <button
              onClick={handleToggleOffline}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border transition-colors ${
                offlineMode
                  ? 'bg-danger/10 border-danger/25 text-danger'
                  : 'bg-success/10 border-success/25 text-success'
              }`}
            >
              {offlineMode ? (
                <>
                  <WifiOff size={9} />
                  <span>Modo Offline</span>
                </>
              ) : (
                <>
                  <Wifi size={9} />
                  <span>Online</span>
                </>
              )}
            </button>
          </div>

          {/* Offline pending warning ribbon */}
          {offlineMode && (
            <div className="bg-amber-500 text-white text-[9px] font-black tracking-wider uppercase text-center py-1 flex items-center justify-center gap-1 animate-pulse">
              <AlertTriangle size={10} />
              <span>Fila Offline: {offlineQueue.length} bilhetes retidos</span>
            </div>
          )}

          {/* App Core Container (Tabs panels) */}
          <div className="flex-1 bg-slate-50 overflow-y-auto p-4 flex flex-col">
            {activeTab === 'scan' && (
              <div className="flex-1 flex flex-col justify-between">
                {/* QR Scanner Mock */}
                {resultStatus === 'NONE' && !scanning && (
                  <div className="space-y-4">
                    {/* Real Camera scanner feed or Fallback */}
                    <div className="aspect-video bg-slate-950 border border-slate-900 rounded-2xl relative overflow-hidden flex items-center justify-center">
                      {cameraSupported ? (
                        <>
                          <div id="qr-reader-mobile" className="w-full h-full" />
                          {/* Laser scanner visual overlay */}
                          <div className="absolute inset-x-0 h-0.5 bg-success shadow-lg z-10 animate-laser pointer-events-none" />
                        </>
                      ) : (
                        <div className="text-center z-10 p-3 space-y-1">
                          <QrCode size={28} className="text-white/20 mx-auto" />
                          <span className="text-[9px] text-amber-500 font-bold uppercase tracking-wider block">
                            Câmara Indisponível (Sem SSL)
                          </span>
                          <span className="text-[8px] text-white/40 max-w-[200px] mx-auto block leading-normal">
                            Use a simulação rápida de leitura abaixo para testar o fluxo.
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Quick select dropdown simulator */}
                    <div className="bg-card border border-border p-3.5 rounded-2xl space-y-2">
                      <label className="block text-[9px] font-black text-foreground uppercase">
                        Simular Leitura QR
                      </label>
                      <select
                        onChange={(e) => handleScanCode(e.target.value)}
                        defaultValue=""
                        className="w-full px-2.5 py-2 border border-input rounded-xl text-xs bg-background text-foreground focus:outline-none"
                      >
                        <option value="" disabled>
                          Escolha um Passageiro...
                        </option>
                        {reservations.map((r) => (
                          <option key={`mob-opt-${r.id}`} value={r.id}>
                            {r.passengerName.split(' ')[0]} → {r.destination.substring(0, 3)} (
                            {r.status})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Manual Code Input */}
                    <div className="bg-card border border-border p-3.5 rounded-2xl space-y-2">
                      <label className="block text-[9px] font-black text-foreground uppercase">
                        Código Manual
                      </label>
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          placeholder="RES-LUA-..."
                          value={scanCode}
                          onChange={(e) => setScanCode(e.target.value)}
                          className="flex-1 px-2.5 py-2 border border-input rounded-xl text-xs bg-background text-foreground font-mono font-bold uppercase"
                        />
                        <button
                          onClick={() => handleScanCode(scanCode)}
                          className="px-3 bg-primary hover:bg-accent text-white font-bold rounded-xl text-xs active:scale-95"
                        >
                          Ler
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {scanning && (
                  <div className="flex-1 flex flex-col items-center justify-center text-center space-y-2">
                    <Loader2 className="animate-spin text-primary w-8 h-8" />
                    <h4 className="text-xs font-bold text-foreground">A ler QR Code...</h4>
                  </div>
                )}

                {/* Scanned Card UI */}
                {resultStatus !== 'NONE' && !scanning && resultTicket && (
                  <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm animate-fade-in flex flex-col justify-between flex-1">
                    {/* Header check alert */}
                    {resultStatus === 'VALID' && (
                      <div className="bg-success/15 p-2.5 text-center text-success flex items-center justify-center gap-1.5 font-black text-[10px] uppercase">
                        <CheckCircle size={14} />
                        <span>✅ Bilhete Válido</span>
                      </div>
                    )}
                    {resultStatus === 'USED' && (
                      <div className="bg-warning/15 p-2.5 text-center text-warning-foreground flex items-center justify-center gap-1.5 font-black text-[10px] uppercase">
                        <AlertTriangle size={14} />
                        <span>⚠️ Já Utilizado</span>
                      </div>
                    )}
                    {resultStatus === 'INVALID' && (
                      <div className="bg-danger/15 p-2.5 text-center text-danger flex items-center justify-center gap-1.5 font-black text-[10px] uppercase">
                        <XCircle size={14} />
                        <span>❌ Bilhete Inválido</span>
                      </div>
                    )}
                    {resultStatus === 'WRONG_CARRIER' && (
                      <div className="bg-danger/15 p-2.5 text-center text-danger flex items-center justify-center gap-1.5 font-black text-[10px] uppercase">
                        <AlertTriangle size={14} />
                        <span>⚠️ Outra Empresa</span>
                      </div>
                    )}

                    {/* Passenger specs */}
                    <div className="p-4 space-y-4 text-xs font-bold flex-1">
                      <div className="flex items-center gap-2 border-b border-border/60 pb-2.5">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-black">
                          {resultTicket.passengerName.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-foreground truncate">
                            {resultTicket.passengerName}
                          </h4>
                          <span className="text-[9px] text-muted-foreground font-mono block">
                            B.I. {resultTicket.passengerDocument}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1.5 text-[11px]">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground font-medium">Viagem:</span>
                          <span className="text-foreground">
                            {resultTicket.origin} → {resultTicket.destination}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground font-medium">Poltrona:</span>
                          <span className="text-foreground">Poltrona {resultTicket.seat}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground font-medium">Classe:</span>
                          <span className="text-foreground">{resultTicket.classLabel}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground font-medium">Código:</span>
                          <span className="text-primary font-mono">{resultTicket.id}</span>
                        </div>
                      </div>

                      {/* Wrong carrier warning */}
                      {resultStatus === 'WRONG_CARRIER' && (
                        <div className="p-2 bg-danger/5 border border-danger/25 rounded-xl flex gap-1 text-[9px] text-danger leading-relaxed font-semibold">
                          <AlertTriangle size={12} className="text-danger flex-shrink-0 mt-0.5" />
                          <span>
                            Acesso Negado: Este bilhete é da operadora{' '}
                            <strong>{resultTicket.carrier}</strong>. Como fiscal da{' '}
                            <strong>{getCurrentUser()?.company_code || 'TRANSLUX'}</strong>, apenas tem autorização para validar bilhetes da sua própria transportadora.
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Trigger Actions */}
                    <div className="p-3 bg-slate-50 border-t border-border flex items-center gap-1.5">
                      {resultStatus === 'VALID' ? (
                        <button
                          onClick={handleConfirmMobileBoarding}
                          className="w-full py-2 bg-primary text-white font-bold rounded-xl text-xs hover:bg-accent active:scale-95"
                        >
                          Confirmar Embarque
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setResultStatus('NONE');
                            setResultTicket(null);
                            setScanCode('');
                          }}
                          className="w-full py-2 border border-border bg-card rounded-xl text-xs font-bold hover:bg-muted text-muted-foreground"
                        >
                          Voltar ao Leitor
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tab: Local validation history */}
            {activeTab === 'historico' && (
              <div className="flex-1 flex flex-col justify-between">
                <div className="space-y-3.5">
                  <h3 className="text-[10px] font-black text-foreground uppercase tracking-wider border-b border-border pb-1.5">
                    Registo do Turno
                  </h3>

                  {validationHistory.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-10">
                      Nenhum registo de embarque local.
                    </p>
                  ) : (
                    <div className="space-y-2 max-h-[360px] overflow-y-auto">
                      {validationHistory.map((log, lIdx) => (
                        <div
                          key={`log-${lIdx}`}
                          className="bg-card border border-border p-3 rounded-xl flex items-center justify-between text-xs"
                        >
                          <div>
                            <div className="flex items-center gap-1.5">
                              <strong className="font-bold text-foreground">
                                {log.passengerName.split(' ')[0]}
                              </strong>
                              <span className="text-[10px] text-muted-foreground font-mono">
                                ({log.route})
                              </span>
                            </div>
                            <span className="text-[9px] text-muted-foreground font-mono block mt-0.5">
                              ID: {log.id}
                            </span>
                          </div>

                          <div className="text-right">
                            <span className="block text-[9px] font-mono text-muted-foreground font-bold">
                              {log.time}
                            </span>
                            <span
                              className={`text-[8px] font-black tracking-wider uppercase inline-block px-1.5 py-0.5 rounded-md mt-0.5 ${
                                log.status === 'SUCESSO'
                                  ? 'bg-success/15 text-success'
                                  : 'bg-amber-500/15 text-amber-600 animate-pulse'
                              }`}
                            >
                              {log.status === 'SUCESSO' ? 'ONLINE' : 'OFFLINE'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Phone Bottom Tab Navigator Menu */}
          <div className="h-14 bg-card border-t border-border flex items-center justify-around flex-shrink-0 z-20">
            <button
              onClick={() => {
                setActiveTab('scan');
                setResultStatus('NONE');
                setResultTicket(null);
              }}
              className={`flex flex-col items-center gap-1 text-[9px] font-bold ${
                activeTab === 'scan' ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <QrCode size={18} />
              <span>Scanner QR</span>
            </button>

            <button
              onClick={() => setActiveTab('historico')}
              className={`flex flex-col items-center gap-1 text-[9px] font-bold ${
                activeTab === 'historico' ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <History size={18} />
              <span>Histórico ({validationHistory.length})</span>
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
