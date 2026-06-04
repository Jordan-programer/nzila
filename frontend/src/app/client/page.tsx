'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import {
  getReservations,
  getCurrentUser,
  updateReservationStatus,
  getSimulatedEmails,
  addSimulatedEmailNotification,
  SimulatedEmail,
  Reservation,
  UserSession,
} from '@/app/components/mockDb';
import { toast } from 'sonner';
import {
  User,
  Calendar,
  Clock,
  History,
  Lock,
  Mail,
  Bell,
  Ticket,
  Printer,
  X,
  Trash2,
  ChevronRight,
  Eye,
  AlertTriangle,
  FileDown,
  Loader2,
  CheckCircle,
} from 'lucide-react';

export default function ClientDashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<
    'reservas' | 'proximas' | 'historico' | 'perfil' | 'password' | 'notificacoes'
  >('reservas');

  const [user, setUser] = useState<UserSession | null>(null);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [emails, setEmails] = useState<SimulatedEmail[]>([]);

  // Modals state
  const [selectedTicket, setSelectedTicket] = useState<Reservation | null>(null);
  const [cancellationTarget, setCancellationTarget] = useState<Reservation | null>(null);
  const [selectedEmail, setSelectedEmail] = useState<SimulatedEmail | null>(null);

  // Profile forms
  const [profileName, setProfileName] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileDocument, setProfileDocument] = useState('');
  const [profileEmail, setProfileEmail] = useState('');

  // Password forms
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const refreshData = () => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      toast.error('Inicie sessão para aceder ao painel.');
      router.push('/sign-up-login-screen');
      return;
    }
    setUser(currentUser);
    setProfileName(currentUser.name);
    setProfilePhone(currentUser.phone || '');
    setProfileDocument(currentUser.document || '');
    setProfileEmail(currentUser.email);

    // Get reservations filtered by user email
    const allRes = getReservations();
    const userRes = allRes.filter((r) => r.passengerEmail === currentUser.email);
    setReservations(userRes);

    // Get simulated notifications/emails
    const allEmails = getSimulatedEmails();
    const userEmails = allEmails.filter((e) => e.recipient === currentUser.email);
    setEmails(userEmails);
  };

  useEffect(() => {
    refreshData();
  }, [router]);

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileName.trim() || !profilePhone.trim() || !profileDocument.trim()) {
      toast.error('Preencha todos os campos obrigatórios.');
      return;
    }

    if (user) {
      const updatedUser = {
        ...user,
        name: profileName,
        phone: profilePhone,
        document: profileDocument,
      };
      localStorage.setItem('nzila_current_user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      window.dispatchEvent(new Event('storage'));
      toast.success('Perfil atualizado com sucesso!');
    }
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword || !newPassword || !confirmPassword) {
      toast.error('Preencha todos os campos da palavra-passe.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('A confirmação da palavra-passe não coincide.');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('A nova palavra-passe deve ter pelo menos 6 caracteres.');
      return;
    }

    toast.success('Palavra-passe alterada com sucesso!');
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleConfirmCancellation = () => {
    if (cancellationTarget) {
      updateReservationStatus(cancellationTarget.id, 'CANCELADO');
      toast.success(`Reserva ${cancellationTarget.id} cancelada com sucesso!`);
      setCancellationTarget(null);
      refreshData();
    }
  };

  const handleResendEmail = (res: Reservation) => {
    toast.success(`A reenviar bilhete digital por e-mail para ${res.passengerEmail}...`);
    setTimeout(() => {
      addSimulatedEmailNotification(
        res.passengerEmail,
        `Reenvio de Bilhete Digital: ${res.id}`,
        `Pedido de reenvio de bilhete de ${res.origin} para ${res.destination}. Lembrete do código da reserva: ${res.id}`,
        res
      );
      toast.success('Bilhete digital reenviado com sucesso!');
      refreshData();
    }, 1000);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="animate-spin text-primary w-12 h-12" />
      </div>
    );
  }

  // Filters for tabs
  const upcomingRes = reservations.filter(
    (r) => r.status === 'CONFIRMADO' || r.status === 'PENDENTE'
  );
  const pastRes = reservations.filter(
    (r) => r.status === 'UTILIZADO' || r.status === 'EMBARCADO' || r.status === 'CANCELADO'
  );
  const activeReservations =
    activeTab === 'reservas' ? reservations : activeTab === 'proximas' ? upcomingRes : pastRes;

  const getStatusBadgeClass = (status: Reservation['status']) => {
    switch (status) {
      case 'CONFIRMADO':
        return 'bg-success/15 border-success/30 text-success';
      case 'EMBARCADO':
        return 'bg-blue-600/15 border-blue-600/30 text-blue-600';
      case 'UTILIZADO':
        return 'bg-slate-500/15 border-slate-500/30 text-slate-600';
      case 'CANCELADO':
        return 'bg-danger/15 border-danger/30 text-danger';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background relative">
      <div className="no-print">
        <Header />
      </div>

      {/* Ticket Modal Overlay */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in print-overlay">
          <div className="w-full max-w-xl bg-card border border-border rounded-3xl overflow-hidden shadow-2xl animate-bounce-in printable-ticket">
            {/* Header */}
            <div
              className={`p-4 ${selectedTicket.carrierColor} text-white flex items-center justify-between`}
            >
              <div className="flex items-center gap-2">
                <Ticket className="w-5 h-5 text-white" />
                <span className="font-extrabold text-sm tracking-widest uppercase">
                  Cartão de Embarque Digital
                </span>
              </div>
              <button
                onClick={() => setSelectedTicket(null)}
                className="p-1 rounded-lg hover:bg-white/10 text-white transition-colors no-print"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div>
                  <span className="block text-[10px] text-muted-foreground font-black uppercase">
                    Origem
                  </span>
                  <span className="text-xl font-black text-foreground">
                    {selectedTicket.origin}
                  </span>
                </div>
                <div className="text-center font-bold text-xs text-muted-foreground">
                  {selectedTicket.carrierCode}
                </div>
                <div className="text-right">
                  <span className="block text-[10px] text-muted-foreground font-black uppercase">
                    Destino
                  </span>
                  <span className="text-xl font-black text-foreground">
                    {selectedTicket.destination}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs font-semibold">
                <div>
                  <span className="block text-[9px] text-muted-foreground font-black uppercase mb-0.5">
                    Passageiro
                  </span>
                  <span className="text-foreground text-sm font-bold">
                    {selectedTicket.passengerName}
                  </span>
                </div>
                <div>
                  <span className="block text-[9px] text-muted-foreground font-black uppercase mb-0.5">
                    Nº de Reserva
                  </span>
                  <span className="text-primary text-sm font-mono font-bold">
                    {selectedTicket.id}
                  </span>
                </div>
                <div>
                  <span className="block text-[9px] text-muted-foreground font-black uppercase mb-0.5">
                    Data de Partida
                  </span>
                  <span className="text-foreground">15 de Junho, 2026</span>
                </div>
                <div>
                  <span className="block text-[9px] text-muted-foreground font-black uppercase mb-0.5">
                    Poltrona ({selectedTicket.classLabel})
                  </span>
                  <span className="text-foreground font-bold">Poltrona {selectedTicket.seat}</span>
                </div>
              </div>

              {/* Detalhes do Pagamento */}
              <div className="border-t border-border pt-4 mt-4 grid grid-cols-2 gap-4 text-xs font-semibold">
                <div>
                  <span className="block text-[9px] text-muted-foreground font-black uppercase mb-0.5">
                    Valor Pago
                  </span>
                  <span className="text-emerald-600 font-bold text-sm">
                    {selectedTicket.price.toLocaleString('pt-AO')} Kz
                  </span>
                </div>
                <div>
                  <span className="block text-[9px] text-muted-foreground font-black uppercase mb-0.5">
                    Método de Pagamento
                  </span>
                  <span className="text-foreground">
                    {selectedTicket.paymentMethod || 'Multicaixa Express'}
                  </span>
                </div>
              </div>

              {/* QR Code and actions */}
              <div className="flex flex-col items-center justify-center p-4 bg-muted/40 border border-border rounded-2xl">
                {/* Real Dynamic QR code */}
                <div className="p-2.5 bg-white border border-border rounded-xl">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(selectedTicket.id)}`}
                    alt={`QR Code para a reserva ${selectedTicket.id}`}
                    width="120"
                    height="120"
                    className="text-foreground rounded-lg border border-border bg-white p-1"
                  />
                </div>
                <span className="text-[10px] text-muted-foreground font-black tracking-widest uppercase mt-3">
                  Código de Validação Único
                </span>
              </div>
            </div>

            <div className="px-6 py-4 bg-muted border-t border-border flex justify-end gap-2 no-print">
              <button
                onClick={() => {
                  setSelectedTicket(null);
                  window.print();
                }}
                className="flex items-center gap-1.5 px-4 py-2 border border-border bg-card hover:bg-muted text-foreground font-bold rounded-xl text-xs transition-colors"
              >
                <Printer size={13} />
                Imprimir
              </button>
              <button
                onClick={() => setSelectedTicket(null)}
                className="px-4 py-2 bg-primary text-primary-foreground hover:bg-accent font-bold rounded-xl text-xs transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancellation Modal Overlay */}
      {cancellationTarget && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-md bg-card border border-border rounded-3xl p-6 shadow-2xl animate-bounce-in text-center">
            <div className="w-12 h-12 bg-danger/10 border border-danger/20 rounded-2xl flex items-center justify-center mx-auto mb-4 text-danger animate-pulse">
              <AlertTriangle size={24} />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-1">Confirmar Cancelamento</h3>
            <p className="text-xs text-muted-foreground mb-4">
              Está prestes a cancelar a viagem de{' '}
              <strong className="text-foreground">{cancellationTarget.origin}</strong> para{' '}
              <strong className="text-foreground">{cancellationTarget.destination}</strong> (Código:{' '}
              {cancellationTarget.id}).
            </p>

            <div className="p-4 bg-muted/40 rounded-xl border border-border text-left space-y-2 mb-6">
              <h4 className="text-xs font-bold text-foreground">Termos de Reembolso</h4>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                • Cancelamentos realizados até 24h antes da viagem:{' '}
                <strong className="text-success">Reembolso a 100%</strong>.<br />• Cancelamentos em
                menos de 24h: Taxa de retenção de 50% (
                <strong className="text-danger">Reembolso de 50%</strong>).
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setCancellationTarget(null)}
                className="flex-1 py-2.5 border border-border rounded-xl text-sm font-semibold hover:bg-muted text-muted-foreground transition-colors"
              >
                Manter Reserva
              </button>
              <button
                onClick={handleConfirmCancellation}
                className="flex-1 py-2.5 bg-danger text-white hover:bg-red-700 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-1.5"
              >
                <Trash2 size={15} />
                Solicitar Cancelamento
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Email Inbox Reader Modal */}
      {selectedEmail && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-2xl bg-card border border-border rounded-3xl overflow-hidden shadow-2xl animate-bounce-in flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between px-6 py-4 bg-muted border-b border-border">
              <span className="text-xs font-bold text-muted-foreground font-mono">
                NZILA Central de Notificações
              </span>
              <button
                onClick={() => setSelectedEmail(null)}
                className="p-1 rounded-lg text-muted-foreground hover:bg-border transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-4 border-b border-border bg-card space-y-2 text-xs">
              <div>
                <span className="font-semibold text-muted-foreground inline-block w-16">De:</span>
                <span className="font-semibold text-foreground">
                  NZILA &lt;notificacoes@nzila.co.ao&gt;
                </span>
              </div>
              <div>
                <span className="font-semibold text-muted-foreground inline-block w-16">
                  Assunto:
                </span>
                <span className="font-bold text-foreground">{selectedEmail.subject}</span>
              </div>
              <div>
                <span className="font-semibold text-muted-foreground inline-block w-16">Data:</span>
                <span className="font-semibold text-foreground">
                  {new Date(selectedEmail.sentAt).toLocaleString('pt-AO')}
                </span>
              </div>
            </div>

            <div className="p-6 bg-slate-50 flex-1 overflow-y-auto font-sans text-sm">
              <div className="max-w-xl mx-auto bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden text-slate-800">
                <div className="bg-emerald-600 p-6 text-center text-white">
                  <h2 className="text-2xl font-black tracking-tight">NZILA</h2>
                  <p className="text-xs text-emerald-100 font-medium tracking-wide mt-1">
                    Sua Viagem em Segurança
                  </p>
                </div>
                <div className="p-6 space-y-4">
                  <p className="font-bold text-slate-900">Olá Cliente,</p>
                  <p className="leading-relaxed text-slate-600">{selectedEmail.snippet}</p>

                  {selectedEmail.reservationData && (
                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
                      <p className="text-xs text-slate-500 font-semibold mb-2">
                        DETALHES DO BILHETE DIGITAL
                      </p>
                      <table className="w-full text-xs text-slate-600">
                        <tbody>
                          <tr className="border-b border-slate-100">
                            <td className="py-1">Código:</td>
                            <td className="py-1 font-bold text-slate-800 text-right">
                              {selectedEmail.reservationData.id}
                            </td>
                          </tr>
                          <tr className="border-b border-slate-100">
                            <td className="py-1">Percurso:</td>
                            <td className="py-1 font-bold text-slate-800 text-right">
                              {selectedEmail.reservationData.origin} →{' '}
                              {selectedEmail.reservationData.destination}
                            </td>
                          </tr>
                          <tr className="border-b border-slate-100">
                            <td className="py-1">Assento / Classe:</td>
                            <td className="py-1 font-bold text-slate-800 text-right">
                              Poltrona {selectedEmail.reservationData.seat} (
                              {selectedEmail.reservationData.classLabel})
                            </td>
                          </tr>
                          <tr className="border-b border-slate-100">
                            <td className="py-1">Operadora:</td>
                            <td className="py-1 font-bold text-slate-800 text-right">
                              {selectedEmail.reservationData.carrier}
                            </td>
                          </tr>
                          <tr>
                            <td className="py-1">Total Pago:</td>
                            <td className="py-1 font-bold text-emerald-600 text-right">
                              {selectedEmail.reservationData.price.toLocaleString('pt-AO')} Kz
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )}

                  <p className="text-xs text-slate-400 border-t border-slate-200 pt-4 text-center">
                    Este é um e-mail de notificação automático do sistema NZILA. Não responda a esta
                    mensagem.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Dashboard */}
      <main className="flex-1 pt-24 pb-16 no-print" style={{ paddingBottom: '4rem' }}>
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Sidebar Menu */}
            <aside className="lg:col-span-3 bg-card border border-border rounded-3xl p-5 shadow-sm space-y-4">
              {/* User summary card */}
              <div className="flex items-center gap-3 border-b border-border pb-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center font-black text-primary text-lg">
                  {user.name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-foreground truncate">{user.name}</h3>
                  <span className="text-xs text-muted-foreground truncate block">{user.email}</span>
                </div>
              </div>

              {/* Menu Links */}
              <nav className="flex flex-col gap-1.5">
                {[
                  { id: 'reservas', label: 'Minhas Reservas', icon: Ticket },
                  { id: 'proximas', label: 'Próximas Viagens', icon: Calendar },
                  { id: 'historico', label: 'Histórico Completo', icon: History },
                  { id: 'perfil', label: 'Dados de Perfil', icon: User },
                  { id: 'password', label: 'Alterar Palavra-passe', icon: Lock },
                  {
                    id: 'notificacoes',
                    label: 'Central de Notificações',
                    icon: Mail,
                    count: emails.length,
                  },
                ].map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id as any)}
                      className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
                          : 'text-foreground hover:bg-muted'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon size={16} />
                        <span>{item.label}</span>
                      </div>
                      {item.count !== undefined && item.count > 0 && (
                        <span
                          className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${isActive ? 'bg-white text-primary' : 'bg-primary/10 text-primary'}`}
                        >
                          {item.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </aside>

            {/* Main Tabs Panel */}
            <div className="lg:col-span-9 space-y-6">
              {/* Tab: Reservations List */}
              {(activeTab === 'reservas' ||
                activeTab === 'proximas' ||
                activeTab === 'historico') && (
                <div className="bg-card border border-border rounded-3xl p-6 lg:p-8 shadow-sm">
                  <div className="flex items-center justify-between mb-6 border-b border-border pb-4">
                    <h2 className="text-lg font-bold text-foreground">
                      {activeTab === 'reservas'
                        ? 'Minhas Reservas'
                        : activeTab === 'proximas'
                          ? 'Próximas Viagens'
                          : 'Histórico de Viagens'}
                    </h2>
                    <span className="text-xs text-muted-foreground font-semibold">
                      {activeReservations.length}{' '}
                      {activeReservations.length === 1 ? 'reserva' : 'reservas'}
                    </span>
                  </div>

                  {activeReservations.length === 0 ? (
                    <div className="text-center py-16 flex flex-col items-center">
                      <div className="w-12 h-12 bg-muted rounded-2xl flex items-center justify-center mb-3">
                        <Ticket className="text-muted-foreground w-6 h-6" />
                      </div>
                      <h3 className="font-bold text-foreground text-sm mb-1">
                        Nenhuma reserva encontrada
                      </h3>
                      <p className="text-xs text-muted-foreground max-w-xs mx-auto mb-4">
                        Ainda não tem reservas nesta secção. Compre passagens online para começar a
                        viajar.
                      </p>
                      <button
                        onClick={() => router.push('/results-page')}
                        className="px-4 py-2 bg-primary text-primary-foreground font-semibold rounded-xl text-xs hover:bg-accent transition-colors"
                      >
                        Comprar Passagem
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {activeReservations.map((res) => (
                        <div
                          key={res.id}
                          className="border border-border rounded-2xl p-4 lg:p-5 hover:border-primary/20 hover:shadow-xs transition-all bg-card"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-3 mb-3">
                            <div className="flex items-center gap-3">
                              <span
                                className={`px-2.5 py-0.5 border rounded-full text-[10px] font-black ${getStatusBadgeClass(res.status)}`}
                              >
                                {res.status}
                              </span>
                              <span className="text-xs text-muted-foreground font-bold font-mono">
                                {res.id}
                              </span>
                            </div>
                            <div className="text-right sm:text-right">
                              <span className="text-xs text-muted-foreground font-semibold">
                                Preço total:{' '}
                              </span>
                              <strong className="text-foreground text-sm font-black">
                                {res.price.toLocaleString('pt-AO')} Kz
                              </strong>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                            {/* Route details */}
                            <div className="sm:col-span-2 flex items-center gap-4">
                              <div
                                className={`${res.carrierColor} w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-white font-extrabold text-[10px]`}
                              >
                                {res.carrierCode}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <strong className="text-sm text-foreground truncate">
                                    {res.origin}
                                  </strong>
                                  <ChevronRight size={12} className="text-muted-foreground" />
                                  <strong className="text-sm text-foreground truncate">
                                    {res.destination}
                                  </strong>
                                </div>
                                <div className="flex gap-3 text-xs text-muted-foreground mt-0.5 font-medium">
                                  <span>Data: 15/06/2026</span>
                                  <span>Poltrona: {res.seat}</span>
                                </div>
                              </div>
                            </div>

                            {/* Actions panel */}
                            <div className="flex items-center justify-start sm:justify-end gap-1.5 flex-wrap">
                              <button
                                onClick={() => setSelectedTicket(res)}
                                title="Visualizar Bilhete"
                                className="p-2 border border-border hover:bg-muted text-foreground rounded-lg transition-colors"
                              >
                                <Eye size={14} />
                              </button>
                              <button
                                onClick={() => handleResendEmail(res)}
                                title="Reenviar por Email"
                                className="p-2 border border-border hover:bg-muted text-foreground rounded-lg transition-colors"
                              >
                                <Mail size={14} />
                              </button>
                              {res.status === 'CONFIRMADO' && (
                                <button
                                  onClick={() => setCancellationTarget(res)}
                                  title="Solicitar Cancelamento"
                                  className="p-2 border border-danger/20 hover:bg-danger/5 text-danger rounded-lg transition-colors"
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tab: Profile */}
              {activeTab === 'perfil' && (
                <div className="bg-card border border-border rounded-3xl p-6 lg:p-8 shadow-sm">
                  <div className="flex items-center gap-2 mb-6 border-b border-border pb-4">
                    <User className="text-primary w-5 h-5" />
                    <h2 className="text-lg font-bold text-foreground">Dados Pessoais do Cliente</h2>
                  </div>

                  <form onSubmit={handleUpdateProfile} className="space-y-4 max-w-lg">
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                        Nome Completo
                      </label>
                      <input
                        type="text"
                        value={profileName}
                        onChange={(e) => setProfileName(e.target.value)}
                        className="w-full px-4 py-2.5 border border-input rounded-xl text-sm bg-background focus:outline-none focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                        Email (Não editável)
                      </label>
                      <input
                        type="email"
                        disabled
                        value={profileEmail}
                        className="w-full px-4 py-2.5 border border-input rounded-xl text-sm bg-muted text-muted-foreground cursor-not-allowed"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                          Telefone
                        </label>
                        <input
                          type="tel"
                          value={profilePhone}
                          onChange={(e) => setProfilePhone(e.target.value)}
                          className="w-full px-4 py-2.5 border border-input rounded-xl text-sm bg-background focus:outline-none focus:border-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                          Bilhete de Identidade (B.I.)
                        </label>
                        <input
                          type="text"
                          value={profileDocument}
                          onChange={(e) => setProfileDocument(e.target.value)}
                          className="w-full px-4 py-2.5 border border-input rounded-xl text-sm bg-background focus:outline-none focus:border-primary"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-primary text-primary-foreground font-semibold rounded-xl text-xs hover:bg-accent transition-colors active:scale-95 shadow-sm"
                    >
                      Guardar Alterações
                    </button>
                  </form>
                </div>
              )}

              {/* Tab: Change Password */}
              {activeTab === 'password' && (
                <div className="bg-card border border-border rounded-3xl p-6 lg:p-8 shadow-sm">
                  <div className="flex items-center gap-2 mb-6 border-b border-border pb-4">
                    <Lock className="text-primary w-5 h-5" />
                    <h2 className="text-lg font-bold text-foreground">Alterar Palavra-passe</h2>
                  </div>

                  <form onSubmit={handleChangePassword} className="space-y-4 max-w-sm">
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                        Palavra-passe Atual
                      </label>
                      <input
                        type="password"
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-4 py-2.5 border border-input rounded-xl text-sm bg-background focus:outline-none focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                        Nova Palavra-passe
                      </label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Mínimo 6 caracteres"
                        className="w-full px-4 py-2.5 border border-input rounded-xl text-sm bg-background focus:outline-none focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                        Confirmar Nova Palavra-passe
                      </label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirmar"
                        className="w-full px-4 py-2.5 border border-input rounded-xl text-sm bg-background focus:outline-none focus:border-primary"
                      />
                    </div>

                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-primary text-primary-foreground font-semibold rounded-xl text-xs hover:bg-accent transition-colors active:scale-95 shadow-sm"
                    >
                      Alterar Palavra-passe
                    </button>
                  </form>
                </div>
              )}

              {/* Tab: Email Notifications */}
              {activeTab === 'notificacoes' && (
                <div className="bg-card border border-border rounded-3xl p-6 lg:p-8 shadow-sm">
                  <div className="flex items-center gap-2 mb-6 border-b border-border pb-4">
                    <Bell className="text-primary w-5 h-5" />
                    <h2 className="text-lg font-bold text-foreground">
                      Caixa de Correio e Notificações Enviadas
                    </h2>
                  </div>

                  <p className="text-xs text-muted-foreground mb-6">
                    Lista simulada de notificações de transações e emails enviados pela plataforma
                    para a sua caixa de entrada. Clique para abrir os e-mails com o layout HTML real
                    da plataforma!
                  </p>

                  {emails.length === 0 ? (
                    <div className="text-center py-12 flex flex-col items-center">
                      <Mail className="text-muted-foreground w-10 h-10 mb-3 opacity-40" />
                      <h4 className="font-bold text-foreground text-sm">
                        Nenhuma notificação registada
                      </h4>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {emails.map((email) => (
                        <button
                          key={email.id}
                          onClick={() => setSelectedEmail(email)}
                          className="w-full flex items-start gap-4 p-4 border border-border rounded-2xl hover:border-primary/20 hover:bg-primary/5 text-left transition-all"
                        >
                          <div className="p-2 bg-primary/10 rounded-xl text-primary flex-shrink-0">
                            <Mail size={16} />
                          </div>
                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex justify-between items-center">
                              <h4 className="text-xs font-bold text-foreground truncate max-w-xs sm:max-w-md">
                                {email.subject}
                              </h4>
                              <span className="text-[10px] text-muted-foreground font-mono">
                                {new Date(email.sentAt).toLocaleTimeString('pt-AO', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground truncate leading-relaxed">
                              {email.snippet}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <div className="no-print">
        <Footer />
      </div>
    </div>
  );
}
