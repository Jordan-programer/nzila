'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import {
  getReservations,
  updateReservationStatus,
  updateReservationDetails,
  Reservation,
  addSimulatedEmailNotification,
} from '@/app/components/mockDb';
import { toast } from 'sonner';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from 'recharts';
import {
  TrendingUp,
  DollarSign,
  Ticket,
  Percent,
  Calendar,
  Search,
  Filter,
  Eye,
  Edit2,
  Trash2,
  Undo2,
  Building2,
  MapPin,
  Clock,
  Users,
  BarChart3,
  X,
  Plus,
} from 'lucide-react';

export default function AdminDashboardPage() {
  const searchParams = useSearchParams();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');

  // Tabs management
  const [adminTab, setAdminTab] = useState<
    'indicadores' | 'reservas' | 'empresas' | 'rotas' | 'viagens' | 'relatorios' | 'locations'
  >('indicadores');

  // On mount: check ?tab= URL param to deep-link directly to a tab
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['indicadores', 'reservas', 'empresas', 'locations'].includes(tabParam)) {
      setAdminTab(tabParam as any);
      // Refresh carriers when navigating directly to empresas tab
      if (tabParam === 'empresas') {
        fetchCarriers();
      }
    }
  }, [searchParams]);

  // Modals state
  const [editingRes, setEditingRes] = useState<Reservation | null>(null);
  const [viewingRes, setViewingRes] = useState<Reservation | null>(null);

  // Edit fields
  const [editName, setEditName] = useState('');
  const [editSeat, setEditSeat] = useState('');

  // Locations management
  interface Location {
    id: number;
    nome: string;
    provincia: string;
  }
  const [locations, setLocations] = useState<Location[]>([]);
  const [locationSearchTerm, setLocationSearchTerm] = useState('');
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [formNome, setFormNome] = useState('');
  const [formProvincia, setFormProvincia] = useState('');
  const [isLoadingLocations, setIsLoadingLocations] = useState(false);

  // Carrier Reviews management
  const [carriers, setCarriers] = useState<any[]>([]);
  const [isLoadingCarriers, setIsLoadingCarriers] = useState(false);
  const [rejectionModalOpen, setRejectionModalOpen] = useState(false);
  const [rejectionTargetId, setRejectionTargetId] = useState<number | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const fetchCarriers = async () => {
    setIsLoadingCarriers(true);
    try {
      const res = await fetch('http://localhost:8000/api/admin/carriers/');
      if (!res.ok) throw new Error('HTTP error');
      const data = await res.json();
      setCarriers(data);
      localStorage.setItem('nzila_carriers', JSON.stringify(data));
    } catch (err) {
      console.warn('Fallback to localStorage for carriers review:', err);
      const cached = localStorage.getItem('nzila_carriers');
      if (cached) {
        setCarriers(JSON.parse(cached));
      } else {
        const defaultCarriers = [
          {
            id: 1,
            nome: 'Macon Transportes',
            nif: '500012341',
            email: 'macon@macon.ao',
            telefone: '923101010',
            endereco: 'Estrada de Catete, Km 12',
            status: 'APROVADA',
            logo_url: '',
            tipo_empresa: 'Lda',
            ano_fundacao: 2008,
            provincia: 'Luanda',
            municipio: 'Luanda',
            documents: [
              {
                tipo: 'REGISTO_COMERCIAL',
                arquivo_url: 'https://nzila.ao/uploads/registo_comercial.pdf',
                aprovado: true,
              },
              {
                tipo: 'ALVARA',
                arquivo_url: 'https://nzila.ao/uploads/alvara_transporte.pdf',
                aprovado: true,
              },
              {
                tipo: 'CONTRIBUINTE',
                arquivo_url: 'https://nzila.ao/uploads/cartao_contribuinte.pdf',
                aprovado: true,
              },
            ],
            admins: [
              {
                nome: 'Macon Operador',
                email: 'macon.operator@transbook.ao',
                telefone: '923101010',
                cargo: 'Gerente de Frota',
              },
            ],
          },
          {
            id: 2,
            nome: 'Translux Angola',
            nif: '500012342',
            email: 'translux@translux.ao',
            telefone: '912202020',
            endereco: 'Estrada de Catete, Km 12',
            status: 'APROVADA',
            logo_url: '',
            tipo_empresa: 'Lda',
            ano_fundacao: 2008,
            provincia: 'Luanda',
            municipio: 'Luanda',
            documents: [],
            admins: [],
          },
        ];
        setCarriers(defaultCarriers);
        localStorage.setItem('nzila_carriers', JSON.stringify(defaultCarriers));
      }
    } finally {
      setIsLoadingCarriers(false);
    }
  };

  const handleReviewCarrier = async (
    companyId: number,
    statusChoice: 'APROVADA' | 'REJEITADA' | 'SUSPENSA',
    reason = ''
  ) => {
    try {
      const res = await fetch('http://localhost:8000/api/admin/carriers/review/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_id: companyId,
          status: statusChoice,
          motivo_rejeicao: reason,
        }),
      });

      if (!res.ok) throw new Error('API Error');
      toast.success(`Transportadora ${statusChoice.toLowerCase()} com sucesso!`);

      // Send simulated notification
      const companyObj = carriers.find((c) => c.id === companyId);
      const opEmail = companyObj?.admins?.[0]?.email || 'macon.operator@transbook.ao';
      addSimulatedEmailNotification(
        opEmail,
        `Candidatura Nzila: ${statusChoice === 'APROVADA' ? 'Aprovada' : statusChoice === 'REJEITADA' ? 'Rejeitada' : 'Suspensa'}`,
        `O registo da sua transportadora '${companyObj?.nome || 'Parceiro'}' foi avaliado pelo administrador e encontra-se ${statusChoice.toLowerCase()}. ${reason ? 'Motivo: ' + reason : ''}`
      );

      setRejectionModalOpen(false);
      setRejectionReason('');
      setRejectionTargetId(null);
      fetchCarriers();
    } catch (err) {
      console.warn('Fallback to localStorage for review action:', err);
      const list = [...carriers];
      const index = list.findIndex((c) => c.id === companyId);
      if (index !== -1) {
        list[index].status = statusChoice;
        list[index].motivo_rejeicao = reason;
        if (statusChoice === 'APROVADA' && list[index].documents) {
          list[index].documents = list[index].documents.map((d: any) => ({ ...d, aprovado: true }));
        }

        // Send simulated notification offline
        const opEmail = list[index].admins?.[0]?.email || 'macon.operator@transbook.ao';
        addSimulatedEmailNotification(
          opEmail,
          `Candidatura Nzila: ${statusChoice === 'APROVADA' ? 'Aprovada' : statusChoice === 'REJEITADA' ? 'Rejeitada' : 'Suspensa'}`,
          `O registo da sua transportadora '${list[index].nome}' foi avaliado pelo administrador e encontra-se ${statusChoice.toLowerCase()} (Offline). ${reason ? 'Motivo: ' + reason : ''}`
        );

        setCarriers(list);
        localStorage.setItem('nzila_carriers', JSON.stringify(list));
        toast.success(`Transportadora ${statusChoice.toLowerCase()} com sucesso (Offline)!`);
      }
      setRejectionModalOpen(false);
      setRejectionReason('');
      setRejectionTargetId(null);
    }
  };

  const MOCK_LOCATIONS: Location[] = [
    { id: 1, nome: 'Luanda', provincia: 'Luanda' },
    { id: 2, nome: 'Huambo', provincia: 'Huambo' },
    { id: 3, nome: 'Lobito', provincia: 'Benguela' },
    { id: 4, nome: 'Benguela', provincia: 'Benguela' },
  ];

  const fetchLocations = async () => {
    setIsLoadingLocations(true);
    try {
      const res = await fetch('http://localhost:8000/api/locations/');
      if (!res.ok) throw new Error('HTTP error');
      const data = await res.json();
      setLocations(data);
      localStorage.setItem('nzila_locations', JSON.stringify(data));
    } catch (err) {
      console.warn('Failing back to localStorage for locations:', err);
      const cached = localStorage.getItem('nzila_locations');
      if (cached) {
        setLocations(JSON.parse(cached));
      } else {
        setLocations(MOCK_LOCATIONS);
        localStorage.setItem('nzila_locations', JSON.stringify(MOCK_LOCATIONS));
      }
    } finally {
      setIsLoadingLocations(false);
    }
  };

  const handleSaveLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNome.trim() || !formProvincia.trim()) {
      toast.error('Preencha todos os campos da localidade.');
      return;
    }

    const payload = {
      nome: formNome.trim(),
      provincia: formProvincia.trim(),
    };

    try {
      if (editingLocation) {
        const res = await fetch(`http://localhost:8000/api/locations/${editingLocation.id}/`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('Failed to update');
        toast.success('Localidade atualizada com sucesso!');
      } else {
        const res = await fetch('http://localhost:8000/api/locations/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('Failed to create');
        toast.success('Localidade adicionada com sucesso!');
      }
      setIsLocationModalOpen(false);
      setEditingLocation(null);
      setFormNome('');
      setFormProvincia('');
      fetchLocations();
    } catch (err) {
      console.warn('Performing operation locally in localStorage:', err);
      let list = [...locations];
      if (editingLocation) {
        list = list.map((loc) => (loc.id === editingLocation.id ? { ...loc, ...payload } : loc));
        toast.success('Localidade atualizada com sucesso (Offline)!');
      } else {
        const nextId = list.length > 0 ? Math.max(...list.map((l) => l.id)) + 1 : 1;
        list.push({ id: nextId, ...payload });
        toast.success('Localidade adicionada com sucesso (Offline)!');
      }
      setLocations(list);
      localStorage.setItem('nzila_locations', JSON.stringify(list));
      setIsLocationModalOpen(false);
      setEditingLocation(null);
      setFormNome('');
      setFormProvincia('');
    }
  };

  const handleDeleteLocation = async (id: number) => {
    try {
      const res = await fetch(`http://localhost:8000/api/locations/${id}/`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete');
      toast.success('Localidade removida com sucesso!');
      fetchLocations();
    } catch (err) {
      console.warn('Performing delete locally in localStorage:', err);
      const list = locations.filter((loc) => loc.id !== id);
      setLocations(list);
      localStorage.setItem('nzila_locations', JSON.stringify(list));
      toast.success('Localidade removida com sucesso (Offline)!');
    }
  };

  const refreshReservations = () => {
    setReservations(getReservations());
  };

  useEffect(() => {
    refreshReservations();
    fetchLocations();
    fetchCarriers();
  }, []);

  // Calculations
  const totalSalesCount = reservations.length;
  const activeSales = reservations.filter((r) => r.status !== 'CANCELADO');
  const totalRevenue = activeSales.reduce((sum, r) => sum + r.price, 0);

  // Today's Sales
  const todayStr = new Date().toISOString().split('T')[0];
  const todayRes = reservations.filter((r) => r.date === todayStr);
  const todaySalesCount = todayRes.length;
  const todayRevenue = todayRes
    .filter((r) => r.status !== 'CANCELADO')
    .reduce((sum, r) => sum + r.price, 0);

  // Dynamic Occupancy rate (Simulated base + actual)
  const occupancyRate =
    totalSalesCount > 0 ? Math.min(94, Math.round(68 + activeSales.length * 1.5)) : 0;

  // Chart 1: Last 7 days Sales Trend
  const generateSalesData = () => {
    const days = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
    // Hardcoded baseline + dynamic increments
    return [
      { name: 'Seg', Vendas: 18000, Bilhetes: 3 },
      { name: 'Ter', Vendas: 29000, Bilhetes: 5 },
      { name: 'Qua', Vendas: 22000, Bilhetes: 4 },
      { name: 'Qui', Vendas: 31000, Bilhetes: 6 },
      { name: 'Sex', Vendas: 48000, Bilhetes: 9 },
      { name: 'Sáb', Vendas: 55000, Bilhetes: 11 },
      {
        name: 'Dom',
        Vendas: todayRevenue > 0 ? 32000 + todayRevenue : 35000,
        Bilhetes: 7 + todaySalesCount,
      },
    ];
  };

  // Chart 2: Carrier sales breakdown
  const generateCarrierData = () => {
    const carriers = ['MACON', 'TRANSLUX', 'SGO', 'UNITRANS'];
    return carriers.map((code) => {
      const count = reservations.filter(
        (r) => r.carrierCode === code && r.status !== 'CANCELADO'
      ).length;
      const baseCount = code === 'MACON' ? 88 : code === 'TRANSLUX' ? 62 : code === 'SGO' ? 44 : 28;
      return {
        name: code,
        Bilhetes: baseCount + count * 5,
        Receita: (baseCount + count * 5) * 5000,
      };
    });
  };

  const handleEditSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingRes) {
      if (!editName.trim() || !editSeat.trim()) {
        toast.error('Preencha o nome e assento do passageiro.');
        return;
      }
      updateReservationDetails(editingRes.id, {
        passengerName: editName,
        seat: editSeat,
      });
      toast.success('Detalhes da reserva atualizados com sucesso!');
      setEditingRes(null);
      refreshReservations();
    }
  };

  const handleCancelRes = (id: string) => {
    updateReservationStatus(id, 'CANCELADO');
    toast.success(`Reserva ${id} cancelada com sucesso.`);
    refreshReservations();
  };

  const handleRefundRes = (id: string) => {
    updateReservationStatus(id, 'CANCELADO');
    toast.success(`Reserva ${id} reembolsada. Valor devolvido ao passageiro.`);
    refreshReservations();
  };

  // Filtered reservations table
  const filteredReservations = reservations.filter((r) => {
    const matchesSearch =
      r.passengerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.origin.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.destination.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'todos' || r.status.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: Reservation['status']) => {
    switch (status) {
      case 'CONFIRMADO':
        return 'bg-success/10 border-success/20 text-success';
      case 'EMBARCADO':
        return 'bg-blue-600/10 border-blue-600/20 text-blue-600';
      case 'UTILIZADO':
        return 'bg-slate-500/10 border-slate-500/20 text-slate-600';
      case 'CANCELADO':
        return 'bg-danger/10 border-danger/20 text-danger';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background relative">
      <Header />

      {/* View Ticket Modal */}
      {viewingRes && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-xl bg-card border border-border rounded-3xl overflow-hidden shadow-2xl animate-bounce-in">
            <div
              className={`p-4 ${viewingRes.carrierColor} text-white flex items-center justify-between`}
            >
              <span className="font-extrabold text-sm tracking-widest uppercase">
                Visualizador de Bilhete Admin
              </span>
              <button
                onClick={() => setViewingRes(null)}
                className="p-1 rounded-lg hover:bg-white/10 text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-6 space-y-4 text-xs font-semibold text-foreground">
              <div className="flex justify-between border-b border-border pb-3">
                <div>
                  <span className="block text-[9px] text-muted-foreground uppercase">
                    Passageiro
                  </span>
                  <span className="text-sm font-bold">{viewingRes.passengerName}</span>
                </div>
                <div>
                  <span className="block text-[9px] text-muted-foreground uppercase">
                    Nº Reserva
                  </span>
                  <span className="text-sm font-mono font-bold text-primary">{viewingRes.id}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-muted-foreground">Origem:</span> {viewingRes.origin}
                </div>
                <div>
                  <span className="text-muted-foreground">Destino:</span> {viewingRes.destination}
                </div>
                <div>
                  <span className="text-muted-foreground">Poltrona / Classe:</span> Poltrona{' '}
                  {viewingRes.seat} ({viewingRes.classLabel})
                </div>
                <div>
                  <span className="text-muted-foreground">Operadora:</span> {viewingRes.carrier}
                </div>
                <div>
                  <span className="text-muted-foreground">Estado:</span>{' '}
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] ${getStatusBadge(viewingRes.status)}`}
                  >
                    {viewingRes.status}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Método Pagamento:</span>{' '}
                  {viewingRes.paymentMethod}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Booking Modal */}
      {editingRes && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-md bg-card border border-border rounded-3xl p-6 shadow-2xl animate-bounce-in">
            <div className="flex justify-between items-center border-b border-border pb-3 mb-4">
              <h3 className="text-base font-bold text-foreground">Editar Dados da Reserva</h3>
              <button
                onClick={() => setEditingRes(null)}
                className="p-1 text-muted-foreground hover:bg-muted rounded-lg"
              >
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleEditSave} className="space-y-4 text-sm font-semibold">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5 font-sans">
                  Nome do Passageiro
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-4 py-2.5 border border-input rounded-xl bg-background text-foreground"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5 font-sans">
                  Poltrona / Assento
                </label>
                <input
                  type="text"
                  value={editSeat}
                  onChange={(e) => setEditSeat(e.target.value)}
                  className="w-full px-4 py-2.5 border border-input rounded-xl bg-background text-foreground"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-primary text-primary-foreground hover:bg-accent font-bold rounded-xl transition-colors"
              >
                Guardar Alterações
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Location CRUD Modal */}
      {isLocationModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-md bg-card border border-border rounded-3xl p-6 shadow-2xl animate-bounce-in">
            <div className="flex justify-between items-center border-b border-border pb-3 mb-4">
              <h3 className="text-base font-bold text-foreground">
                {editingLocation ? 'Editar Localidade' : 'Adicionar Localidade'}
              </h3>
              <button
                onClick={() => {
                  setIsLocationModalOpen(false);
                  setEditingLocation(null);
                  setFormNome('');
                  setFormProvincia('');
                }}
                className="p-1 text-muted-foreground hover:bg-muted rounded-lg transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSaveLocation} className="space-y-4 text-sm font-semibold">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5 font-sans">
                  Nome da Localidade / Cidade
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Luanda, Lubango..."
                  value={formNome}
                  onChange={(e) => setFormNome(e.target.value)}
                  className="w-full px-4 py-2.5 border border-input rounded-xl bg-background text-foreground focus:outline-none focus:border-primary font-sans"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5 font-sans">
                  Província
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Luanda, Huíla, Benguela..."
                  value={formProvincia}
                  onChange={(e) => setFormProvincia(e.target.value)}
                  className="w-full px-4 py-2.5 border border-input rounded-xl bg-background text-foreground focus:outline-none focus:border-primary font-sans"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsLocationModalOpen(false);
                    setEditingLocation(null);
                    setFormNome('');
                    setFormProvincia('');
                  }}
                  className="flex-1 py-2.5 border border-border text-foreground hover:bg-muted font-bold rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-primary text-primary-foreground hover:bg-accent font-bold rounded-xl transition-colors"
                >
                  {editingLocation ? 'Salvar' : 'Adicionar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rejection Reason Modal */}
      {rejectionModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-md bg-card border border-border rounded-3xl p-6 shadow-2xl animate-bounce-in">
            <div className="flex justify-between items-center border-b border-border pb-3 mb-4">
              <h3 className="text-base font-bold text-foreground">Rejeitar Transportadora</h3>
              <button
                onClick={() => {
                  setRejectionModalOpen(false);
                  setRejectionReason('');
                  setRejectionTargetId(null);
                }}
                className="p-1 text-muted-foreground hover:bg-muted rounded-lg transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (rejectionTargetId) {
                  handleReviewCarrier(rejectionTargetId, 'REJEITADA', rejectionReason);
                }
              }}
              className="space-y-4 text-sm font-semibold"
            >
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5 font-sans">
                  Motivo da Rejeição *
                </label>
                <textarea
                  required
                  placeholder="Explique o motivo pelo qual a transportadora está a ser rejeitada (ex: Alvará de Transporte expirado, NIF incorreto...)"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full px-4 py-2.5 border border-input rounded-xl bg-background text-foreground h-28 focus:outline-none focus:border-primary text-xs"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setRejectionModalOpen(false);
                    setRejectionReason('');
                    setRejectionTargetId(null);
                  }}
                  className="flex-1 py-2 border border-border text-foreground font-bold rounded-xl text-xs hover:bg-muted transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-danger text-danger-foreground hover:bg-red-700 font-bold rounded-xl text-xs transition-colors"
                >
                  Confirmar Rejeição
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <main className="flex-1 pt-24 pb-16">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">
          {/* Header titles */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight mb-1.5">
                Painel Administrativo
              </h1>
              <p className="text-sm text-muted-foreground font-medium">
                Controlo total de vendas, taxas de ocupação, rotas e embarques da rede Nzila.
              </p>
            </div>
            <div className="flex gap-2 flex-wrap sm:flex-nowrap">
              {[
                { id: 'indicadores', label: 'Estatísticas', icon: BarChart3 },
                { id: 'reservas', label: 'Reservas', icon: Ticket },
                { id: 'empresas', label: 'Empresas & Rotas', icon: Building2 },
                { id: 'locations', label: 'Localidades', icon: MapPin },
              ].map((tab) => {
                const Icon = tab.icon;
                const pendingCount = tab.id === 'empresas' ? carriers.filter((c) => c.status === 'PENDENTE').length : 0;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setAdminTab(tab.id as any);
                      if (tab.id === 'empresas') fetchCarriers();
                    }}
                    className={`relative flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                      adminTab === tab.id
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'bg-card border border-border text-foreground hover:bg-muted'
                    }`}
                  >
                    <Icon size={14} />
                    <span>{tab.label}</span>
                    {pendingCount > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] flex items-center justify-center bg-danger text-white text-[9px] font-black rounded-full px-1 shadow">
                        {pendingCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tab 1: Stats Visualizations */}
          {adminTab === 'indicadores' && (
            <div className="space-y-6 animate-fade-in">
              {/* Quick Stat Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  {
                    title: 'Vendas do Dia',
                    val: `${todaySalesCount} bilhetes`,
                    desc: `Receita: ${todayRevenue.toLocaleString('pt-AO')} Kz`,
                    icon: Ticket,
                    col: 'text-primary',
                  },
                  {
                    title: 'Receita Acumulada',
                    val: `${totalRevenue.toLocaleString('pt-AO')} Kz`,
                    desc: 'Total líquido de bilhetes',
                    icon: DollarSign,
                    col: 'text-emerald-600',
                  },
                  {
                    title: 'Taxa de Ocupação',
                    val: `${occupancyRate}%`,
                    desc: 'Lotação média da frota',
                    icon: Percent,
                    col: 'text-indigo-600',
                  },
                  {
                    title: 'Viagens Ativas',
                    val: '8 Rotas',
                    desc: 'Macon, Translux, SGO',
                    icon: Calendar,
                    col: 'text-amber-600',
                  },
                ].map((stat, sIdx) => {
                  const Icon = stat.icon;
                  return (
                    <div
                      key={`stat-${sIdx}`}
                      className="bg-card border border-border rounded-3xl p-5 shadow-sm flex items-start gap-4"
                    >
                      <div className={`p-3 bg-muted rounded-2xl ${stat.col} flex-shrink-0`}>
                        <Icon size={20} />
                      </div>
                      <div className="min-w-0">
                        <span className="block text-[10px] text-muted-foreground font-black uppercase tracking-wider mb-1">
                          {stat.title}
                        </span>
                        <h4 className="text-lg font-black text-foreground truncate">{stat.val}</h4>
                        <span className="text-[10px] text-muted-foreground font-bold mt-0.5 truncate block">
                          {stat.desc}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Graphical rows */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* AreaChart: Sales Trend */}
                <div className="bg-card border border-border rounded-3xl p-5 shadow-sm">
                  <div className="flex items-center gap-2 mb-4 border-b border-border pb-3">
                    <TrendingUp size={16} className="text-primary" />
                    <h3 className="text-sm font-black text-foreground uppercase tracking-wider">
                      Tendência de Faturação (Últimos 7 dias)
                    </h3>
                  </div>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={generateSalesData()}
                        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#059669" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                        <XAxis dataKey="name" stroke="#9CA3AF" fontSize={10} tickLine={false} />
                        <YAxis stroke="#9CA3AF" fontSize={10} tickLine={false} />
                        <Tooltip />
                        <Area
                          type="monotone"
                          dataKey="Vendas"
                          stroke="#059669"
                          strokeWidth={2}
                          fillOpacity={1}
                          fill="url(#colorSales)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* BarChart: Carrier breakdown */}
                <div className="bg-card border border-border rounded-3xl p-5 shadow-sm">
                  <div className="flex items-center gap-2 mb-4 border-b border-border pb-3">
                    <BarChart3 size={16} className="text-primary" />
                    <h3 className="text-sm font-black text-foreground uppercase tracking-wider">
                      Passagens por Transportadora (MACON/Translux/SGO)
                    </h3>
                  </div>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={generateCarrierData()}
                        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                        <XAxis dataKey="name" stroke="#9CA3AF" fontSize={10} tickLine={false} />
                        <YAxis stroke="#9CA3AF" fontSize={10} tickLine={false} />
                        <Tooltip />
                        <Bar dataKey="Bilhetes" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                          {[0, 1, 2, 3].map((_, entryIdx) => (
                            <Cell
                              key={`cell-${entryIdx}`}
                              fill={entryIdx % 2 === 0 ? '#3b82f6' : '#10b981'}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Reservations Management Grid */}
          {adminTab === 'reservas' && (
            <div className="bg-card border border-border rounded-3xl p-6 lg:p-8 shadow-sm animate-fade-in">
              <div className="flex items-center justify-between mb-6 border-b border-border pb-4 flex-wrap gap-4">
                <h2 className="text-lg font-bold text-foreground">
                  Lista Geral de Reservas do Sistema
                </h2>

                {/* Filters */}
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="relative max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Pesquisar passageiro..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9 pr-4 py-2 border border-input rounded-xl text-xs bg-background text-foreground focus:outline-none focus:border-primary w-48 sm:w-56"
                    />
                  </div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 border border-input rounded-xl text-xs bg-background text-foreground focus:outline-none focus:border-primary cursor-pointer"
                  >
                    <option value="todos">Todos Estados</option>
                    <option value="confirmado">Confirmado</option>
                    <option value="embarcado">Embarcado</option>
                    <option value="utilizado">Utilizado</option>
                    <option value="cancelado">Cancelado</option>
                  </select>
                </div>
              </div>

              {/* Data Table */}
              {filteredReservations.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  Nenhuma reserva corresponde à pesquisa.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-border/80 text-muted-foreground font-black uppercase tracking-wider text-[9px] bg-muted/40">
                        <th className="p-3">Código</th>
                        <th className="p-3">Passageiro</th>
                        <th className="p-3">Percurso</th>
                        <th className="p-3">Poltrona / Classe</th>
                        <th className="p-3">Método Pago</th>
                        <th className="p-3">Estado</th>
                        <th className="p-3 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {filteredReservations.map((res) => (
                        <tr key={res.id} className="hover:bg-muted/10 font-medium">
                          <td className="p-3 font-bold font-mono text-primary select-all">
                            {res.id}
                          </td>
                          <td className="p-3">
                            <span className="block font-bold text-foreground">
                              {res.passengerName}
                            </span>
                            <span className="text-[10px] text-muted-foreground font-mono">
                              {res.passengerEmail}
                            </span>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-1">
                              <span>{res.origin}</span>
                              <span className="text-muted-foreground">→</span>
                              <span>{res.destination}</span>
                            </div>
                            <span className="text-[10px] text-muted-foreground mt-0.5 block">
                              {res.carrier}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className="block font-bold text-foreground">
                              Poltrona {res.seat}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              {res.classLabel}
                            </span>
                          </td>
                          <td className="p-3 font-semibold text-muted-foreground">
                            {res.paymentMethod || 'MCX Express'}
                          </td>
                          <td className="p-3">
                            <span
                              className={`inline-block px-2.5 py-0.5 border rounded-full text-[9px] font-black tracking-wide ${getStatusBadge(res.status)}`}
                            >
                              {res.status}
                            </span>
                          </td>
                          <td className="p-3 text-right flex items-center justify-end gap-1 flex-wrap">
                            <button
                              onClick={() => setViewingRes(res)}
                              title="Ver Bilhete"
                              className="p-1.5 border border-border hover:bg-muted rounded-lg text-foreground transition-colors"
                            >
                              <Eye size={12} />
                            </button>
                            <button
                              onClick={() => {
                                setEditingRes(res);
                                setEditName(res.passengerName);
                                setEditSeat(res.seat);
                              }}
                              title="Editar"
                              className="p-1.5 border border-border hover:bg-muted rounded-lg text-foreground transition-colors"
                            >
                              <Edit2 size={12} />
                            </button>
                            {res.status === 'CONFIRMADO' && (
                              <>
                                <button
                                  onClick={() => handleCancelRes(res.id)}
                                  title="Cancelar Viagem"
                                  className="p-1.5 border border-danger/25 text-danger hover:bg-danger/5 rounded-lg transition-colors"
                                >
                                  <Trash2 size={12} />
                                </button>
                                <button
                                  onClick={() => handleRefundRes(res.id)}
                                  title="Reembolsar"
                                  className="p-1.5 border border-amber-600/25 text-amber-600 hover:bg-amber-600/5 rounded-lg transition-colors"
                                >
                                  <Undo2 size={12} />
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Mock CRUD list for carriers and routes */}
          {adminTab === 'empresas' && (
            <div className="space-y-6 animate-fade-in font-sans">
              {/* Transportadoras Management Table */}
              <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4 border-b border-border pb-3">
                  <div className="flex items-center gap-2">
                    <Building2 size={16} className="text-primary" />
                    <h3 className="text-sm font-black text-foreground uppercase tracking-wider font-sans">
                      Gerenciamento de Transportadoras (Aprovações & Cadastro)
                    </h3>
                  </div>
                  <button
                    onClick={() =>
                      toast.info(
                        'As transportadoras devem registar-se através do formulário de registo parceiro.'
                      )
                    }
                    className="px-2.5 py-1 border border-primary text-primary rounded-lg text-[10px] font-black uppercase flex items-center gap-1 hover:bg-primary/5 transition-all font-sans"
                  >
                    Registo Externo
                  </button>
                </div>

                {isLoadingCarriers ? (
                  <div className="text-center py-8 text-muted-foreground text-xs font-sans font-bold">
                    A carregar transportadoras...
                  </div>
                ) : carriers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-xs font-sans">
                    Nenhuma transportadora registada no sistema.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    {/* Pending carriers banner */}
                    {carriers.filter((c) => c.status === 'PENDENTE').length > 0 && (
                      <div className="mb-3 flex items-center gap-2 px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs font-bold text-amber-600">
                        <span className="inline-block w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                        {carriers.filter((c) => c.status === 'PENDENTE').length} transportadora(s) aguardam aprovação — aparecem em destaque abaixo.
                        <button
                          type="button"
                          onClick={fetchCarriers}
                          className="ml-auto text-[10px] underline hover:no-underline"
                        >
                          Atualizar lista
                        </button>
                      </div>
                    )}
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-border/80 text-muted-foreground font-black uppercase tracking-wider text-[9px] bg-muted/40">
                          <th className="p-3">Transportadora</th>
                          <th className="p-3">Localização & NIF</th>
                          <th className="p-3">Responsável</th>
                          <th className="p-3">Documentos</th>
                          <th className="p-3">Estado</th>
                          <th className="p-3 text-right">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60">
                        {/* Sort: PENDENTE first, then others */}
                        {[...carriers]
                          .sort((a, b) => {
                            if (a.status === 'PENDENTE' && b.status !== 'PENDENTE') return -1;
                            if (a.status !== 'PENDENTE' && b.status === 'PENDENTE') return 1;
                            return 0;
                          })
                          .map((c) => (
                          <tr key={c.id} className={`font-medium transition-colors ${
                            c.status === 'PENDENTE'
                              ? 'bg-amber-500/5 hover:bg-amber-500/10 border-l-2 border-l-amber-400'
                              : 'hover:bg-muted/10'
                          }`}>
                            <td className="p-3">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center font-extrabold text-[10px] text-primary overflow-hidden">
                                  {c.logo_url ? (
                                    <img
                                      src={c.logo_url}
                                      alt="Logo"
                                      className="w-full h-full object-contain"
                                    />
                                  ) : (
                                    c.code || c.nome.substring(0, 3).toUpperCase()
                                  )}
                                </div>
                                <div>
                                  <span className="block font-bold text-foreground text-sm font-sans">
                                    {c.nome}
                                  </span>
                                  <span className="text-[10px] text-muted-foreground font-mono">
                                    {c.email} | {c.telefone}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className="p-3">
                              <span className="block font-semibold text-foreground">
                                NIF: {c.nif || 'Não informado'}
                              </span>
                              <span className="text-[10px] text-muted-foreground block">
                                {c.endereco ? `${c.endereco}, ` : ''}
                                {c.municipio || ''} ({c.provincia || ''})
                              </span>
                            </td>
                            <td className="p-3">
                              {c.admins && c.admins.length > 0 ? (
                                <div>
                                  <span className="block font-semibold text-foreground">
                                    {c.admins[0].nome}
                                  </span>
                                  <span className="text-[10px] text-muted-foreground block">
                                    {c.admins[0].cargo || 'Gerente'} | BI:{' '}
                                    {c.admins[0].documento_identificacao || '-'}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-muted-foreground italic text-[11px]">
                                  Nenhum cadastrado
                                </span>
                              )}
                            </td>
                            <td className="p-3">
                              {c.documents && c.documents.length > 0 ? (
                                <div className="flex flex-col gap-1 max-w-[200px]">
                                  {c.documents.map((d: any, dIdx: number) => (
                                    <a
                                      key={`doc-${dIdx}`}
                                      href={d.arquivo_url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-[10px] text-primary hover:underline font-bold truncate flex items-center gap-1"
                                      title={d.tipo}
                                    >
                                      <span>📄 {d.tipo.replace('_', ' ')}</span>
                                      <span
                                        className={`text-[8px] px-1 rounded-sm ${d.aprovado ? 'bg-success/15 text-success' : 'bg-amber-500/15 text-amber-500'}`}
                                      >
                                        {d.aprovado ? 'Aprovado' : 'Pendente'}
                                      </span>
                                    </a>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-muted-foreground italic text-[11px]">
                                  Sem documentos
                                </span>
                              )}
                            </td>
                            <td className="p-3">
                              <span
                                className={`inline-block px-2.5 py-0.5 border rounded-full text-[9px] font-black tracking-wide ${
                                  c.status === 'APROVADA'
                                    ? 'bg-success/10 border-success/20 text-success'
                                    : c.status === 'PENDENTE'
                                      ? 'bg-amber-500/10 border-amber-500/20 text-amber-500'
                                      : c.status === 'REJEITADA'
                                        ? 'bg-danger/10 border-danger/20 text-danger'
                                        : 'bg-slate-500/10 border-slate-500/20 text-slate-600'
                                }`}
                              >
                                {c.status}
                              </span>
                              {c.status === 'REJEITADA' && c.motivo_rejeicao && (
                                <span
                                  className="block text-[8px] text-danger max-w-[150px] truncate mt-0.5"
                                  title={c.motivo_rejeicao}
                                >
                                  Motivo: {c.motivo_rejeicao}
                                </span>
                              )}
                            </td>
                            <td className="p-3 text-right flex items-center justify-end gap-1 flex-wrap">
                              {c.status === 'PENDENTE' && (
                                <>
                                  <button
                                    onClick={() => handleReviewCarrier(c.id, 'APROVADA')}
                                    title="Aprovar Cadastro"
                                    className="px-2 py-1 bg-success text-success-foreground hover:bg-emerald-700 font-bold rounded-lg text-[10px] transition-colors"
                                  >
                                    Aprovar
                                  </button>
                                  <button
                                    onClick={() => {
                                      setRejectionTargetId(c.id);
                                      setRejectionModalOpen(true);
                                    }}
                                    title="Rejeitar Cadastro"
                                    className="px-2 py-1 bg-danger text-danger-foreground hover:bg-red-700 font-bold rounded-lg text-[10px] transition-colors"
                                  >
                                    Rejeitar
                                  </button>
                                </>
                              )}
                              {c.status === 'APROVADA' && (
                                <button
                                  onClick={() => handleReviewCarrier(c.id, 'SUSPENSA')}
                                  title="Suspender Operação"
                                  className="px-2 py-1 bg-slate-500 text-white hover:bg-slate-600 font-bold rounded-lg text-[10px] transition-colors"
                                >
                                  Suspender
                                </button>
                              )}
                              {c.status === 'SUSPENSA' && (
                                <button
                                  onClick={() => handleReviewCarrier(c.id, 'APROVADA')}
                                  title="Reativar Operação"
                                  className="px-2 py-1 bg-primary text-primary-foreground hover:bg-accent font-bold rounded-lg text-[10px] transition-colors"
                                >
                                  Reativar
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Rotas Ativas (Original List) */}
              <div className="bg-card border border-border rounded-3xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4 border-b border-border pb-3">
                  <div className="flex items-center gap-2">
                    <MapPin size={16} className="text-primary" />
                    <h3 className="text-sm font-black text-foreground uppercase tracking-wider">
                      Rotas Ativas e Preços Sugeridos
                    </h3>
                  </div>
                  <button
                    onClick={() =>
                      toast.info(
                        'Rotas podem ser criadas pelos operadores de transportadoras aprovadas.'
                      )
                    }
                    className="px-2.5 py-1 border border-primary text-primary rounded-lg text-[10px] font-black uppercase flex items-center gap-1 hover:bg-primary/5 transition-all font-sans"
                  >
                    Gerência Operações
                  </button>
                </div>
                <div className="space-y-2.5 text-xs">
                  {[
                    { from: 'Luanda', to: 'Huambo', count: 8, basePrice: '4.200 Kz' },
                    { from: 'Huambo', to: 'Luanda', count: 4, basePrice: '4.500 Kz' },
                    { from: 'Luanda', to: 'Lobito', count: 2, basePrice: '3.900 Kz' },
                    { from: 'Luanda', to: 'Benguela', count: 3, basePrice: '4.000 Kz' },
                  ].map((route, rIdx) => (
                    <div
                      key={`route-${rIdx}`}
                      className="p-3 bg-muted/30 border border-border rounded-2xl flex items-center justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-1 font-bold text-foreground">
                          <span>{route.from}</span>
                          <span className="text-muted-foreground font-normal">→</span>
                          <span>{route.to}</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground mt-0.5 block">
                          Preço base sugerido: {route.basePrice}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-muted-foreground">
                        {route.count} horários diários
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tab 4: Locations CRUD */}
          {adminTab === 'locations' && (
            <div className="bg-card border border-border rounded-3xl p-6 lg:p-8 shadow-sm animate-fade-in">
              <div className="flex items-center justify-between mb-6 border-b border-border pb-4 flex-wrap gap-4">
                <div>
                  <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                    <MapPin className="text-primary w-5 h-5" />
                    <span>Estações e Localidades</span>
                  </h2>
                  <p className="text-xs text-muted-foreground mt-1 font-sans">
                    Gerencie os pontos de partida e chegada disponíveis para o cadastro de rotas.
                  </p>
                </div>

                {/* Filters & Create */}
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="relative max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Pesquisar localidade..."
                      value={locationSearchTerm}
                      onChange={(e) => setLocationSearchTerm(e.target.value)}
                      className="pl-9 pr-4 py-2 border border-input rounded-xl text-xs bg-background text-foreground focus:outline-none focus:border-primary w-48 sm:w-56"
                    />
                  </div>
                  <button
                    onClick={() => {
                      setEditingLocation(null);
                      setFormNome('');
                      setFormProvincia('');
                      setIsLocationModalOpen(true);
                    }}
                    className="px-4 py-2 bg-primary text-primary-foreground font-bold rounded-xl text-xs hover:bg-accent transition-all active:scale-95 flex items-center gap-1.5"
                  >
                    <Plus size={14} />
                    <span>Nova Localidade</span>
                  </button>
                </div>
              </div>

              {/* Data Table */}
              {isLoadingLocations ? (
                <div className="text-center py-16 text-muted-foreground font-sans">
                  Carregando localidades...
                </div>
              ) : locations.filter(
                  (loc) =>
                    loc.nome.toLowerCase().includes(locationSearchTerm.toLowerCase()) ||
                    loc.provincia.toLowerCase().includes(locationSearchTerm.toLowerCase())
                ).length === 0 ? (
                <div className="text-center py-16 text-muted-foreground font-sans">
                  Nenhuma localidade encontrada.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-border/80 text-muted-foreground font-black uppercase tracking-wider text-[9px] bg-muted/40">
                        <th className="p-3 w-20">ID</th>
                        <th className="p-3 font-sans">Nome da Localidade</th>
                        <th className="p-3 font-sans">Província</th>
                        <th className="p-3 text-right font-sans">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {locations
                        .filter(
                          (loc) =>
                            loc.nome.toLowerCase().includes(locationSearchTerm.toLowerCase()) ||
                            loc.provincia.toLowerCase().includes(locationSearchTerm.toLowerCase())
                        )
                        .map((loc) => (
                          <tr key={loc.id} className="hover:bg-muted/10 font-medium">
                            <td className="p-3 font-bold font-mono text-primary select-all">
                              #{loc.id}
                            </td>
                            <td className="p-3">
                              <span className="font-bold text-foreground text-sm font-sans">
                                {loc.nome}
                              </span>
                            </td>
                            <td className="p-3 font-semibold text-muted-foreground text-sm font-sans">
                              {loc.provincia}
                            </td>
                            <td className="p-3 text-right flex items-center justify-end gap-2">
                              <button
                                onClick={() => {
                                  setEditingLocation(loc);
                                  setFormNome(loc.nome);
                                  setFormProvincia(loc.provincia);
                                  setIsLocationModalOpen(true);
                                }}
                                title="Editar Localidade"
                                className="p-1.5 border border-border hover:bg-muted rounded-lg text-foreground transition-colors flex items-center justify-center"
                              >
                                <Edit2 size={12} />
                              </button>
                              <button
                                onClick={() => {
                                  if (
                                    window.confirm(
                                      `Tem a certeza que deseja eliminar a localidade "${loc.nome}"? Todas as rotas associadas serão canceladas.`
                                    )
                                  ) {
                                    handleDeleteLocation(loc.id);
                                  }
                                }}
                                title="Eliminar Localidade"
                                className="p-1.5 border border-danger/25 text-danger hover:bg-danger/5 rounded-lg transition-colors flex items-center justify-center"
                              >
                                <Trash2 size={12} />
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
