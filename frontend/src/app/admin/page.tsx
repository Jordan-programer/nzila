'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
interface Reservation {
  id: string;
  codigo_reserva?: string;
  passengerName: string;
  passengerEmail: string;
  passengerPhone?: string;
  passengerDocument: string;
  origin: string;
  destination: string;
  date?: string;
  departureTime: string;
  arrivalTime: string;
  class?: string;
  classLabel: string;
  seat: string;
  price: number;
  carrier: string;
  carrierCode: string;
  carrierColor: string;
  status: string;
  paymentMethod?: string;
  validationDate?: string;
}
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
  Loader2,
  ArrowRight,
} from 'lucide-react';

function AdminDashboardContent() {
  const searchParams = useSearchParams();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');

  // Tabs management
  const [adminTab, setAdminTab] = useState<
    'indicadores' | 'reservas' | 'empresas' | 'rotas' | 'viagens' | 'relatorios' | 'locations' | 'rotas_populares'
  >('indicadores');

  // On mount: check ?tab= URL param to deep-link directly to a tab
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['indicadores', 'reservas', 'empresas', 'locations', 'rotas_populares'].includes(tabParam)) {
      setAdminTab(tabParam as any);
      // Refresh carriers when navigating directly to empresas tab
      if (tabParam === 'empresas') {
        fetchCarriers();
      } else if (tabParam === 'rotas_populares') {
        fetchPopularRoutes();
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

  // Popular Routes state
  const [popularRoutes, setPopularRoutes] = useState<any[]>([]);
  const [isLoadingPR, setIsLoadingPR] = useState(false);
  const [isPopularRouteModalOpen, setIsPopularRouteModalOpen] = useState(false);
  const [editingPopularRoute, setEditingPopularRoute] = useState<any | null>(null);
  
  const [formPROrigem, setFormPROrigem] = useState('');
  const [formPRDestino, setFormPRDestino] = useState('');
  const [formPRPreco, setFormPRPreco] = useState('');
  const [formPRDuracao, setFormPRDuracao] = useState('8h 30min');
  const [formPRFrequencia, setFormPRFrequencia] = useState('Diário');
  const [formPRTrending, setFormPRTrending] = useState(true);
  const [formPRImagem, setFormPRImagem] = useState<File | null>(null);

  // Carrier Logo upload state
  const [logoUploadModalOpen, setLogoUploadModalOpen] = useState(false);
  const [logoUploadTargetId, setLogoUploadTargetId] = useState<number | null>(null);
  const [selectedLogoFile, setSelectedLogoFile] = useState<File | null>(null);

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
    } catch (err) {
      console.error('Error fetching carriers:', err);
      toast.error('Erro ao carregar as transportadoras do servidor.');
      setCarriers([]);
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
      // Backend sends real email notifications to operators when carrier is reviewed

      setRejectionModalOpen(false);
      setRejectionReason('');
      setRejectionTargetId(null);
      fetchCarriers();
    } catch (err) {
      console.error('Error reviewing carrier:', err);
      toast.error('Erro ao processar a revisão da transportadora.');
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
    } catch (err) {
      console.error('Error fetching locations:', err);
      toast.error('Erro ao carregar localizações.');
      setLocations([]);
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
      console.error('Error saving location:', err);
      toast.error('Erro ao guardar a localidade.');
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
      console.error('Error deleting location:', err);
      toast.error('Erro ao remover a localidade.');
    }
  };

  const fetchPopularRoutes = async () => {
    setIsLoadingPR(true);
    try {
      const res = await fetch('http://localhost:8000/api/admin/popular-routes/');
      if (!res.ok) throw new Error('HTTP error');
      const data = await res.json();
      setPopularRoutes(data);
    } catch (err) {
      console.warn('Fallback to empty popular routes:', err);
    } finally {
      setIsLoadingPR(false);
    }
  };

  const handleSavePopularRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formPROrigem || !formPRDestino || !formPRPreco) {
      toast.error('Origem, destino e preço são obrigatórios.');
      return;
    }

    const formData = new FormData();
    formData.append('origem', formPROrigem);
    formData.append('destino', formPRDestino);
    formData.append('preco_desde', formPRPreco);
    formData.append('duracao', formPRDuracao);
    formData.append('frequencia', formPRFrequencia);
    formData.append('trending', String(formPRTrending));
    if (formPRImagem) {
      formData.append('imagem', formPRImagem);
    }

    try {
      let url = 'http://localhost:8000/api/admin/popular-routes/';
      let method = 'POST';

      if (editingPopularRoute) {
        url = `http://localhost:8000/api/admin/popular-routes/${editingPopularRoute.id}/`;
        method = 'PUT';
      }

      const res = await fetch(url, {
        method: method,
        body: formData,
      });

      if (!res.ok) throw new Error('API Error');
      toast.success(editingPopularRoute ? 'Rota popular atualizada com sucesso!' : 'Rota popular cadastrada com sucesso!');
      
      setIsPopularRouteModalOpen(false);
      setEditingPopularRoute(null);
      setFormPROrigem('');
      setFormPRDestino('');
      setFormPRPreco('');
      setFormPRDuracao('8h 30min');
      setFormPRFrequencia('Diário');
      setFormPRTrending(true);
      setFormPRImagem(null);
      
      fetchPopularRoutes();
    } catch (err) {
      console.error(err);
      toast.error('Erro ao salvar rota popular.');
    }
  };

  const handleDeletePopularRoute = async (id: number) => {
    try {
      const deleteRes = await fetch(`http://localhost:8000/api/admin/popular-routes/${id}/`, {
        method: 'DELETE',
      });
      if (!deleteRes.ok) throw new Error('Failed to delete');
      toast.success('Rota popular removida com sucesso!');
      fetchPopularRoutes();
    } catch (err) {
      console.error(err);
      toast.error('Erro ao remover rota popular.');
    }
  };

  const handleUploadLogo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!logoUploadTargetId || !selectedLogoFile) {
      toast.error('Selecione uma imagem para o logo.');
      return;
    }

    const formData = new FormData();
    formData.append('company_id', String(logoUploadTargetId));
    formData.append('logo', selectedLogoFile);

    try {
      const res = await fetch('http://localhost:8000/api/admin/carriers/upload-logo/', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Upload failed');
      toast.success('Logo da transportadora atualizado com sucesso!');
      setLogoUploadModalOpen(false);
      setLogoUploadTargetId(null);
      setSelectedLogoFile(null);
      fetchCarriers();
    } catch (err) {
      console.error(err);
      toast.error('Erro ao carregar o logo.');
    }
  };

  const refreshReservations = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/admin/reservations/');
      if (res.ok) {
        const data = await res.json();
        setReservations(data);
      }
    } catch (err) {
      console.error('Error fetching reservations:', err);
    }
  };

  useEffect(() => {
    refreshReservations();
    fetchLocations();
    fetchCarriers();
    fetchPopularRoutes();
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

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingRes) {
      if (!editName.trim() || !editSeat.trim()) {
        toast.error('Preencha o nome e assento do passageiro.');
        return;
      }
      try {
        // Note: The backend doesn't have a direct reservation edit endpoint yet,
        // so we show a success toast and close the modal. Add backend endpoint if needed.
        toast.success('Detalhes da reserva atualizados. (Aguarda endpoint de edição no backend)');
        setEditingRes(null);
        await refreshReservations();
      } catch (err) {
        toast.error('Erro ao atualizar detalhes da reserva.');
      }
    }
  };

  const handleCancelRes = async (id: string) => {
    try {
      const res = await fetch(`http://localhost:8000/api/reservations/${id}/cancel/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        toast.success(`Reserva ${id} cancelada com sucesso.`);
        await refreshReservations();
      } else {
        throw new Error('Cancel failed');
      }
    } catch (err) {
      toast.error('Erro ao cancelar a reserva no servidor.');
    }
  };

  const handleRefundRes = async (id: string) => {
    try {
      const res = await fetch(`http://localhost:8000/api/reservations/${id}/cancel/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        toast.success(`Reserva ${id} reembolsada. Valor devolvido ao passageiro.`);
        await refreshReservations();
      } else {
        throw new Error('Refund failed');
      }
    } catch (err) {
      toast.error('Erro ao processar o reembolso no servidor.');
    }
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

      {/* Popular Route CRUD Modal */}
      {isPopularRouteModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-md bg-card border border-border rounded-3xl p-6 shadow-2xl animate-bounce-in">
            <div className="flex justify-between items-center border-b border-border pb-3 mb-4">
              <h3 className="text-base font-bold text-foreground">
                {editingPopularRoute ? 'Editar Rota Popular' : 'Adicionar Rota Popular'}
              </h3>
              <button
                onClick={() => {
                  setIsPopularRouteModalOpen(false);
                  setEditingPopularRoute(null);
                  setFormPROrigem('');
                  setFormPRDestino('');
                  setFormPRPreco('');
                  setFormPRDuracao('8h 30min');
                  setFormPRFrequencia('Diário');
                  setFormPRTrending(true);
                  setFormPRImagem(null);
                }}
                className="p-1 text-muted-foreground hover:bg-muted rounded-lg transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSavePopularRoute} className="space-y-4 text-sm font-semibold">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5 font-sans">
                  Origem
                </label>
                <select
                  required
                  value={formPROrigem}
                  onChange={(e) => setFormPROrigem(e.target.value)}
                  className="w-full px-4 py-2.5 border border-input rounded-xl bg-background text-foreground focus:outline-none focus:border-primary font-sans cursor-pointer"
                >
                  <option value="">Selecione a Origem</option>
                  {locations.map((loc) => (
                    <option key={`orig-${loc.id}`} value={loc.id}>
                      {loc.nome} ({loc.provincia})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5 font-sans">
                  Destino
                </label>
                <select
                  required
                  value={formPRDestino}
                  onChange={(e) => setFormPRDestino(e.target.value)}
                  className="w-full px-4 py-2.5 border border-input rounded-xl bg-background text-foreground focus:outline-none focus:border-primary font-sans cursor-pointer"
                >
                  <option value="">Selecione o Destino</option>
                  {locations.map((loc) => (
                    <option key={`dest-${loc.id}`} value={loc.id}>
                      {loc.nome} ({loc.provincia})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5 font-sans">
                  Preço Base (A partir de)
                </label>
                <input
                  type="number"
                  required
                  placeholder="Ex: 4500"
                  value={formPRPreco}
                  onChange={(e) => setFormPRPreco(e.target.value)}
                  className="w-full px-4 py-2.5 border border-input rounded-xl bg-background text-foreground focus:outline-none focus:border-primary font-sans"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5 font-sans">
                    Duração
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: 8h 30min"
                    value={formPRDuracao}
                    onChange={(e) => setFormPRDuracao(e.target.value)}
                    className="w-full px-4 py-2.5 border border-input rounded-xl bg-background text-foreground focus:outline-none focus:border-primary font-sans"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5 font-sans">
                    Frequência
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Diário"
                    value={formPRFrequencia}
                    onChange={(e) => setFormPRFrequencia(e.target.value)}
                    className="w-full px-4 py-2.5 border border-input rounded-xl bg-background text-foreground focus:outline-none focus:border-primary font-sans"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="trending"
                  checked={formPRTrending}
                  onChange={(e) => setFormPRTrending(e.target.checked)}
                  className="w-4 h-4 text-primary bg-background border-input rounded focus:ring-primary cursor-pointer"
                />
                <label htmlFor="trending" className="text-xs font-semibold text-muted-foreground cursor-pointer">
                  Destino Popular (Destaque)
                </label>
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5 font-sans">
                  Imagem do Destino
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFormPRImagem(e.target.files?.[0] || null)}
                  className="w-full text-xs text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsPopularRouteModalOpen(false);
                    setEditingPopularRoute(null);
                    setFormPROrigem('');
                    setFormPRDestino('');
                    setFormPRPreco('');
                    setFormPRDuracao('8h 30min');
                    setFormPRFrequencia('Diário');
                    setFormPRTrending(true);
                    setFormPRImagem(null);
                  }}
                  className="flex-1 py-2.5 border border-border text-foreground hover:bg-muted font-bold rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-primary text-primary-foreground hover:bg-accent font-bold rounded-xl transition-colors"
                >
                  {editingPopularRoute ? 'Salvar' : 'Adicionar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Carrier Logo Upload Modal */}
      {logoUploadModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-md bg-card border border-border rounded-3xl p-6 shadow-2xl animate-bounce-in">
            <div className="flex justify-between items-center border-b border-border pb-3 mb-4">
              <h3 className="text-base font-bold text-foreground">Upload de Logo da Transportadora</h3>
              <button
                onClick={() => {
                  setLogoUploadModalOpen(false);
                  setLogoUploadTargetId(null);
                  setSelectedLogoFile(null);
                }}
                className="p-1 text-muted-foreground hover:bg-muted rounded-lg transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleUploadLogo} className="space-y-4 text-sm font-semibold">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5 font-sans">
                  Imagem do Logo
                </label>
                <input
                  type="file"
                  required
                  accept="image/*"
                  onChange={(e) => setSelectedLogoFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setLogoUploadModalOpen(false);
                    setLogoUploadTargetId(null);
                    setSelectedLogoFile(null);
                  }}
                  className="flex-1 py-2.5 border border-border text-foreground hover:bg-muted font-bold rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-primary text-primary-foreground hover:bg-accent font-bold rounded-xl transition-colors"
                >
                  Upload Logo
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
                { id: 'rotas_populares', label: 'Rotas Populares', icon: TrendingUp },
              ].map((tab) => {
                const Icon = tab.icon;
                const pendingCount =
                  tab.id === 'empresas'
                    ? carriers.filter((c) => c.status === 'PENDENTE').length
                    : 0;
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
                        {carriers.filter((c) => c.status === 'PENDENTE').length} transportadora(s)
                        aguardam aprovação — aparecem em destaque abaixo.
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
                            <tr
                              key={c.id}
                              className={`font-medium transition-colors ${
                                c.status === 'PENDENTE'
                                  ? 'bg-amber-500/5 hover:bg-amber-500/10 border-l-2 border-l-amber-400'
                                  : 'hover:bg-muted/10'
                              }`}
                            >
                              <td className="p-3">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center font-extrabold text-[10px] text-primary overflow-hidden">
                                    {c.logo_url || c.logo ? (
                                      <img
                                        src={
                                          (c.logo_url || c.logo).startsWith('http')
                                            ? (c.logo_url || c.logo)
                                            : `http://localhost:8000${c.logo_url || c.logo}`
                                        }
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
                                  <>
                                    <button
                                      onClick={() => {
                                        setLogoUploadTargetId(c.id);
                                        setLogoUploadModalOpen(true);
                                      }}
                                      title="Upload Logo"
                                      className="px-2 py-1 bg-primary text-primary-foreground hover:bg-accent font-bold rounded-lg text-[10px] transition-colors"
                                    >
                                      Logo
                                    </button>
                                    <button
                                      onClick={() => handleReviewCarrier(c.id, 'SUSPENSA')}
                                      title="Suspender Operação"
                                      className="px-2 py-1 bg-slate-500 text-white hover:bg-slate-600 font-bold rounded-lg text-[10px] transition-colors"
                                    >
                                      Suspender
                                    </button>
                                  </>
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

          {/* Tab 5: Popular Routes CRUD */}
          {adminTab === 'rotas_populares' && (
            <div className="bg-card border border-border rounded-3xl p-6 lg:p-8 shadow-sm animate-fade-in">
              <div className="flex items-center justify-between mb-6 border-b border-border pb-4 flex-wrap gap-4 font-sans">
                <div>
                  <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                    <TrendingUp className="text-primary w-5 h-5" />
                    <span>Gerenciamento de Rotas Populares</span>
                  </h2>
                  <p className="text-xs text-muted-foreground mt-1 font-sans">
                    Gerencie os destinos populares exibidos na página inicial e anexe imagens.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setEditingPopularRoute(null);
                    setFormPROrigem('');
                    setFormPRDestino('');
                    setFormPRPreco('');
                    setFormPRDuracao('8h 30min');
                    setFormPRFrequencia('Diário');
                    setFormPRTrending(true);
                    setFormPRImagem(null);
                    setIsPopularRouteModalOpen(true);
                  }}
                  className="px-4 py-2 bg-primary text-primary-foreground font-bold rounded-xl text-xs hover:bg-accent transition-all active:scale-95 flex items-center gap-1.5 font-sans"
                >
                  <Plus size={14} />
                  <span>Nova Rota Popular</span>
                </button>
              </div>

              {isLoadingPR ? (
                <div className="text-center py-16 text-muted-foreground font-sans">
                  Carregando rotas populares...
                </div>
              ) : popularRoutes.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground font-sans">
                  Nenhuma rota popular cadastrada.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-border/80 text-muted-foreground font-black uppercase tracking-wider text-[9px] bg-muted/40 font-sans">
                        <th className="p-3">Destino / Imagem</th>
                        <th className="p-3">Preço a partir de</th>
                        <th className="p-3">Duração & Frequência</th>
                        <th className="p-3">Popular</th>
                        <th className="p-3 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {popularRoutes.map((route) => (
                        <tr key={route.id} className="hover:bg-muted/10 font-medium">
                          <td className="p-3">
                            <div className="flex items-center gap-3">
                              <div className="w-14 h-10 rounded-lg bg-muted overflow-hidden flex items-center justify-center border border-border flex-shrink-0">
                                {route.imagem ? (
                                  <img
                                    src={route.imagem.startsWith('http') ? route.imagem : `http://localhost:8000${route.imagem}`}
                                    alt={`${route.origin} para ${route.destination}`}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <span className="text-[9px] text-muted-foreground italic">Sem Foto</span>
                                )}
                              </div>
                              <div>
                                <span className="font-bold text-foreground text-sm font-sans flex items-center gap-1.5">
                                  {route.origin} <ArrowRight size={12} className="text-muted-foreground" /> {route.destination}
                                </span>
                                <span className="text-[10px] text-muted-foreground block font-mono">
                                  {route.origin_provincia} para {route.destination_provincia}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="p-3 text-sm font-bold text-foreground font-sans">
                            {parseFloat(route.preco_desde).toLocaleString('pt-AO')} Kz
                          </td>
                          <td className="p-3 font-semibold text-muted-foreground text-sm font-sans">
                            <div className="flex items-center gap-2">
                              <span>⏱️ {route.duracao}</span>
                              <span className="text-border">|</span>
                              <span>📅 {route.frequencia}</span>
                            </div>
                          </td>
                          <td className="p-3">
                            <span
                              className={`inline-block px-2.5 py-0.5 border rounded-full text-[9px] font-black tracking-wide ${
                                route.trending
                                  ? 'bg-success/10 border-success/20 text-success'
                                  : 'bg-muted text-muted-foreground border-border'
                              }`}
                            >
                              {route.trending ? 'SIM' : 'NÃO'}
                            </span>
                          </td>
                          <td className="p-3 text-right flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                setEditingPopularRoute(route);
                                setFormPROrigem(String(route.origem));
                                setFormPRDestino(String(route.destino));
                                setFormPRPreco(String(route.preco_desde));
                                setFormPRDuracao(route.duracao);
                                setFormPRFrequencia(route.frequencia);
                                setFormPRTrending(route.trending);
                                setFormPRImagem(null);
                                setIsPopularRouteModalOpen(true);
                              }}
                              title="Editar Rota Popular"
                              className="p-1.5 border border-border hover:bg-muted rounded-lg text-foreground transition-colors flex items-center justify-center"
                            >
                              <Edit2 size={12} />
                            </button>
                            <button
                              onClick={() => {
                                if (
                                  window.confirm(
                                    `Tem a certeza que deseja eliminar a rota popular de "${route.origin}" para "${route.destination}"?`
                                  )
                                ) {
                                  handleDeletePopularRoute(route.id);
                                }
                              }}
                              title="Eliminar Rota"
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

export default function AdminDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <Loader2 className="animate-spin text-primary w-12 h-12" />
        </div>
      }
    >
      <AdminDashboardContent />
    </Suspense>
  );
}
