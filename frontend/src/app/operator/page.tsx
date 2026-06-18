'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { toast } from 'sonner';
import {
  Building2,
  MapPin,
  Clock,
  Users,
  Ticket,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  LogOut,
  DollarSign,
  Calendar,
  Loader2,
  Save,
  FileText,
  Star,
  X,
  ChevronRight,
  ShieldCheck,
  Bus as BusIcon,
  Map,
  Upload,
} from 'lucide-react';

interface UserSession {
  email: string;
  name: string;
  role: string;
  company_id?: number;
  company_code?: string;
  company_status?: string;
}

interface Bus {
  id: number;
  modelo: string;
  matricula?: string;
  capacidade: number;
  empresa: number;
  colunas_esquerda: number;
  colunas_direita: number;
  linhas: number;
}

interface Fiscal {
  id: number;
  user_id: number;
  nome: string;
  email: string;
  telefone?: string;
  document?: string;
  company_id: number;
  role: string;
}

interface Location {
  id: number;
  nome: string;
  provincia: string;
}

interface Route {
  id: number;
  origem: number;
  destino: number;
  origem_details?: Location;
  destino_details?: Location;
  distancia_km: number;
  duracao_estimada: string; // "HH:MM:SS" or "HH:MM"
}

interface Trip {
  id: number;
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
  status?: string;
  bus_id?: number;
  route_id?: number;
  date?: string; // YYYY-MM-DD (vem do TripSerializer)
  preco_ida_volta?: number;
}

export default function OperatorDashboardPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [company, setCompany] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<
    'frota' | 'localidades' | 'rotas' | 'viagens' | 'fiscais' | 'operadores' | 'perfil'
  >('frota');

  // Loading States
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Core Data Lists
  const [buses, setBuses] = useState<Bus[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);

  // Form Modals / Forms States
  const [isBusModalOpen, setIsBusModalOpen] = useState(false);
  const [busModel, setBusModel] = useState('');
  const [busMatricula, setBusMatricula] = useState('');
  const [busColEsq, setBusColEsq] = useState(2);
  const [busColDir, setBusColDir] = useState(2);
  const [busLinhas, setBusLinhas] = useState(11);
  const busCapacidade = (busColEsq + busColDir) * busLinhas;

  // Localidades (Locations) state
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [locationNome, setLocationNome] = useState('');
  const [locationProvincia, setLocationProvincia] = useState('');

  // Fiscais state
  const [fiscais, setFiscais] = useState<Fiscal[]>([]);
  const [isFiscalModalOpen, setIsFiscalModalOpen] = useState(false);
  const [editingFiscal, setEditingFiscal] = useState<Fiscal | null>(null);
  const [fiscalNome, setFiscalNome] = useState('');
  const [fiscalEmail, setFiscalEmail] = useState('');
  const [fiscalTelefone, setFiscalTelefone] = useState('');
  const [fiscalDocument, setFiscalDocument] = useState('');
  const [fiscalPassword, setFiscalPassword] = useState('');

  // Operadores state
  const [operators, setOperators] = useState<any[]>([]);
  const [isOperatorModalOpen, setIsOperatorModalOpen] = useState(false);
  const [editingOperator, setEditingOperator] = useState<any | null>(null);
  const [operatorNome, setOperatorNome] = useState('');
  const [operatorEmail, setOperatorEmail] = useState('');
  const [operatorTelefone, setOperatorTelefone] = useState('');
  const [operatorDocument, setOperatorDocument] = useState('');
  const [operatorPassword, setOperatorPassword] = useState('');

  const [isRouteModalOpen, setIsRouteModalOpen] = useState(false);
  const [routeOrigin, setRouteOrigin] = useState('');
  const [routeDestination, setRouteDestination] = useState('');
  const [routeDistance, setRouteDistance] = useState('');
  const [routeDuration, setRouteDuration] = useState('08:30');

  const [isTripModalOpen, setIsTripModalOpen] = useState(false);
  const [tripRouteId, setTripRouteId] = useState('');
  const [tripBusId, setTripBusId] = useState('');
  const [tripDate, setTripDate] = useState('');
  const [tripDepTime, setTripDepTime] = useState('');
  const [tripArrTime, setTripArrTime] = useState('');
  const [tripPrice, setTripPrice] = useState('');
  const [tripPriceReturn, setTripPriceReturn] = useState('');
  const [tripClass, setTripClass] = useState('ECONOMICA');
  const [tripAmenities, setTripAmenities] = useState<string[]>(['ar-condicionado']);

  // Recurrence state
  const [tripRecurrence, setTripRecurrence] = useState<'none' | 'weekly' | 'monthly'>('none');
  const [tripRecWeekDays, setTripRecWeekDays] = useState<number[]>([]); // 0=Dom … 6=Sáb
  const [tripRecMonthDay, setTripRecMonthDay] = useState('');
  const [tripRecEndDate, setTripRecEndDate] = useState('');
  const [isSubmittingTrip, setIsSubmittingTrip] = useState(false);

  // Profile Edit fields
  const [profileDesc, setProfileDesc] = useState('');
  const [profileCancel, setProfileCancel] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingLogo, setIsSavingLogo] = useState(false);

  // Authenticate & Load session
  useEffect(() => {
    const checkUser = () => {
      const stored = localStorage.getItem('nzila_current_user');
      if (!stored) {
        toast.error('Sessão expirada. Inicie sessão como operador.');
        router.push('/sign-up-login-screen');
        return;
      }

      const user: UserSession = JSON.parse(stored);
      if (user.role.toLowerCase() !== 'operador') {
        toast.error('Acesso restrito. Apenas operadores podem aceder a esta página.');
        router.push('/');
        return;
      }

      setCurrentUser(user);
      setIsLoadingAuth(false);
    };

    checkUser();
  }, [router]);

  // Load backend or localStorage data
  useEffect(() => {
    if (!currentUser) return;
    fetchCompanyAndOperationalData();
  }, [currentUser]);

  const fetchCompanyAndOperationalData = async () => {
    setIsLoadingData(true);
    const companyId = currentUser?.company_id || 1;

    // 1. Fetch Company Info
    try {
      const res = await fetch(`/api/carrier/info/?company_id=${companyId}`);
      if (!res.ok) throw new Error('API Error');
      const data = await res.json();
      setCompany(data);
      setProfileDesc(data.descricao || '');
      setProfileCancel(data.politica_cancelamento || '');
    } catch (err) {
      toast.error('Erro ao carregar perfil da transportadora do servidor.');
    }

    // 2. Fetch Locations (for route creation)
    try {
      const res = await fetch(`/api/locations/?company_id=${companyId}`);
      if (!res.ok) throw new Error('API Error');
      const data = await res.json();
      setLocations(data);
    } catch (err) {
      toast.error('Erro ao carregar localizações/estações do servidor.');
    }

    // 3. Fetch Buses
    try {
      const res = await fetch(`/api/carrier/buses/?company_id=${companyId}`);
      if (!res.ok) throw new Error('API Error');
      const data = await res.json();
      setBuses(data);
    } catch (err) {
      toast.error('Erro ao carregar frota de autocarros do servidor.');
    }

    // 4. Fetch Routes
    try {
      const res = await fetch(`/api/carrier/routes/?company_id=${companyId}`);
      if (!res.ok) throw new Error('API Error');
      const data = await res.json();
      setRoutes(data);
    } catch (err) {
      toast.error('Erro ao carregar rotas do servidor.');
    }

    // 5. Fetch Trips
    try {
      const res = await fetch(`/api/carrier/trips/?company_id=${companyId}`);
      if (!res.ok) throw new Error('API Error');
      const data = await res.json();
      setTrips(data);
    } catch (err) {
      toast.error('Erro ao carregar partidas/viagens do servidor.');
    }

    // 6. Fetch Fiscais
    try {
      const res = await fetch(`/api/carrier/fiscais/?company_id=${companyId}`);
      if (!res.ok) throw new Error('API Error');
      const data = await res.json();
      setFiscais(data);
    } catch (err) {
      // Non-critical, suppress error
    }

    // 7. Fetch Operators
    try {
      const res = await fetch(`/api/carrier/operators/?company_id=${companyId}`);
      if (!res.ok) throw new Error('API Error');
      const data = await res.json();
      setOperators(data);
    } catch (err) {
      // Non-critical, suppress error
    }

    setIsLoadingData(false);
  };

  // BUS CRUD
  const handleAddBus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!busModel.trim()) {
      toast.error('Preencha o modelo do autocarro.');
      return;
    }
    if (busColEsq < 1 || busColDir < 1 || busLinhas < 1) {
      toast.error('Configuração de assentos inválida.');
      return;
    }

    const companyId = currentUser?.company_id || 1;
    const payload = {
      modelo: busModel.trim(),
      matricula: busMatricula.trim(),
      colunas_esquerda: busColEsq,
      colunas_direita: busColDir,
      linhas: busLinhas,
      company_id: companyId,
    };

    try {
      const res = await fetch('/api/carrier/buses/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Não foi possível registar o autocarro no servidor.');
      }
      toast.success('Autocarro adicionado com sucesso!');
      setIsBusModalOpen(false);
      setBusModel('');
      setBusMatricula('');
      setBusColEsq(2);
      setBusColDir(2);
      setBusLinhas(11);
      fetchCompanyAndOperationalData();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao adicionar autocarro.');
    }
  };

  const handleDeleteBus = async (busId: number) => {
    // Business Rule Check: Block if bus is scheduled in active trips
    const hasTrips = trips.some((t) => t.bus_id === busId && t.status !== 'CANCELADA');
    if (hasTrips) {
      toast.error('Não é possível eliminar um autocarro com viagens ativas vinculadas.');
      return;
    }

    const companyId = currentUser?.company_id || 1;

    try {
      const res = await fetch(`/api/carrier/buses/${busId}/?company_id=${companyId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Falha ao eliminar autocarro.');
      }
      toast.success('Autocarro removido com sucesso!');
      fetchCompanyAndOperationalData();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao remover autocarro.');
    }
  };

  // ROUTE CRUD
  const handleAddRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!routeOrigin || !routeDestination || !routeDistance || !routeDuration) {
      toast.error('Preencha todos os campos da rota.');
      return;
    }

    // Business Rule: Restrict matching origin and destination
    if (routeOrigin === routeDestination) {
      toast.error('A origem e o destino da rota devem ser diferentes.');
      return;
    }

    // Business Rule: Prevent duplicate routes
    const isDuplicate = routes.some(
      (r) =>
        String(r.origem) === String(routeOrigin) && String(r.destino) === String(routeDestination)
    );
    if (isDuplicate) {
      toast.error('Esta rota já se encontra registada no sistema.');
      return;
    }

    const payload = {
      origem_id: parseInt(routeOrigin),
      destino_id: parseInt(routeDestination),
      distancia_km: parseFloat(routeDistance),
      duracao_estimada: routeDuration,
      company_id: currentUser?.company_id || 1,
    };

    try {
      const res = await fetch('/api/carrier/routes/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Falha ao adicionar rota.');
      }
      toast.success('Rota adicionada com sucesso!');
      setIsRouteModalOpen(false);
      setRouteOrigin('');
      setRouteDestination('');
      setRouteDistance('');
      fetchCompanyAndOperationalData();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao adicionar rota.');
    }
  };

  const handleDeleteRoute = async (routeId: number) => {
    const companyId = currentUser?.company_id || 1;
    try {
      const res = await fetch(`/api/carrier/routes/${routeId}/?company_id=${companyId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Erro ao ligar ao servidor.');
      toast.success('Rota removida com sucesso!');
      fetchCompanyAndOperationalData();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao eliminar rota.');
    }
  };

  // Gera lista de datas conforme recorrência
  const buildDates = (): string[] => {
    if (tripRecurrence === 'none') return [tripDate];

    if (!tripRecEndDate) return [];
    const end = new Date(tripRecEndDate + 'T00:00:00');

    if (tripRecurrence === 'weekly') {
      if (tripRecWeekDays.length === 0) return [];
      const dates: string[] = [];
      const cur = new Date(tripDate + 'T00:00:00');
      while (cur <= end) {
        if (tripRecWeekDays.includes(cur.getDay())) {
          dates.push(cur.toISOString().split('T')[0]);
        }
        cur.setDate(cur.getDate() + 1);
      }
      return dates;
    }

    if (tripRecurrence === 'monthly') {
      const day = parseInt(tripRecMonthDay);
      if (!day) return [];
      const dates: string[] = [];
      const start = new Date(tripDate + 'T00:00:00');
      const cur = new Date(start.getFullYear(), start.getMonth(), day);
      if (cur < start) cur.setMonth(cur.getMonth() + 1);
      while (cur <= end) {
        dates.push(cur.toISOString().split('T')[0]);
        cur.setMonth(cur.getMonth() + 1);
      }
      return dates;
    }

    return [];
  };

  // TRIP CRUD
  const handleAddTrip = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!tripBusId) {
      toast.error('Não é permitido criar viagens sem associar um autocarro.');
      return;
    }
    if (!tripRouteId || !tripDepTime || !tripArrTime || !tripPrice || !tripClass) {
      toast.error('Preencha os campos obrigatórios da viagem.');
      return;
    }
    if (tripRecurrence === 'none' && !tripDate) {
      toast.error('Selecione a data de partida.');
      return;
    }
    if (tripRecurrence === 'weekly' && (tripRecWeekDays.length === 0 || !tripRecEndDate)) {
      toast.error('Selecione pelo menos um dia da semana e a data de fim.');
      return;
    }
    if (tripRecurrence === 'monthly' && (!tripRecMonthDay || !tripRecEndDate)) {
      toast.error('Selecione o dia do mês e a data de fim.');
      return;
    }

    const selectedBus = buses.find((b) => String(b.id) === String(tripBusId));
    const selectedRoute = routes.find((r) => String(r.id) === String(tripRouteId));
    if (!selectedBus || !selectedRoute) {
      toast.error('Autocarro ou Rota selecionados são inválidos.');
      return;
    }

    const dates = buildDates();
    if (dates.length === 0) {
      toast.error('Nenhuma data gerada. Verifique as opções de recorrência.');
      return;
    }

    const companyId = currentUser?.company_id || 1;
    setIsSubmittingTrip(true);

    let created = 0;
    let failed = 0;

    for (const date of dates) {
      const payload = {
        company_id: companyId,
        route_id: parseInt(tripRouteId),
        bus_id: parseInt(tripBusId),
        data_saida: date,
        hora_saida: tripDepTime,
        hora_chegada: tripArrTime,
        preco_ida: parseFloat(tripPrice),
        preco_ida_volta: tripPriceReturn ? parseFloat(tripPriceReturn) : null,
        classe: tripClass,
      };
      try {
        const res = await fetch('/api/carrier/trips/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) failed++;
        else created++;
      } catch {
        failed++;
      }
    }

    setIsSubmittingTrip(false);

    if (created > 0) {
      toast.success(
        dates.length === 1
          ? 'Viagem agendada com sucesso!'
          : `${created} viagem(ns) agendada(s) com sucesso!${failed > 0 ? ` (${failed} falharam)` : ''}`
      );
      setIsTripModalOpen(false);
      resetTripForm();
      fetchCompanyAndOperationalData();
    } else {
      toast.error('Nenhuma viagem foi criada. Verifique os dados e tente novamente.');
    }
  };

  const handleCancelTrip = async (tripId: number) => {
    if (
      !window.confirm(
        'Tem a certeza que deseja cancelar esta viagem? Os passageiros com reservas confirmadas receberão uma notificação de cancelamento.'
      )
    ) {
      return;
    }

    const companyId = currentUser?.company_id || 1;

    try {
      const res = await fetch(`/api/carrier/trips/${tripId}/`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CANCELADA', company_id: companyId }),
      });
      if (!res.ok) throw new Error('Erro ao ligar ao servidor.');
      toast.success('Viagem cancelada com sucesso. Notificações enviadas aos passageiros.');
      fetchCompanyAndOperationalData();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao cancelar viagem.');
    }
  };

  const handleUpdateTripPrice = async (tripId: number, newPrice: number) => {
    const companyId = currentUser?.company_id || 1;
    try {
      const res = await fetch(`/api/carrier/trips/${tripId}/`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preco_ida: newPrice, company_id: companyId }),
      });
      if (!res.ok) throw new Error('Erro ao ligar ao servidor.');
      toast.success('Preço da viagem atualizado com sucesso!');
      fetchCompanyAndOperationalData();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao atualizar preço da viagem.');
    }
  };

  const resetTripForm = () => {
    setTripRouteId('');
    setTripBusId('');
    setTripDate('');
    setTripDepTime('');
    setTripArrTime('');
    setTripPrice('');
    setTripPriceReturn('');
    setTripClass('ECONOMICA');
    setTripAmenities(['ar-condicionado']);
    setTripRecurrence('none');
    setTripRecWeekDays([]);
    setTripRecMonthDay('');
    setTripRecEndDate('');
  };

  // FISCAIS CRUD
  const handleOpenFiscalModal = (fiscal?: Fiscal) => {
    if (fiscal) {
      setEditingFiscal(fiscal);
      setFiscalNome(fiscal.nome);
      setFiscalEmail(fiscal.email);
      setFiscalTelefone(fiscal.telefone || '');
      setFiscalDocument(fiscal.document || '');
      setFiscalPassword('');
    } else {
      setEditingFiscal(null);
      setFiscalNome('');
      setFiscalEmail('');
      setFiscalTelefone('');
      setFiscalDocument('');
      setFiscalPassword('');
    }
    setIsFiscalModalOpen(true);
  };

  const handleSaveFiscal = async (e: React.FormEvent) => {
    e.preventDefault();
    const companyId = currentUser?.company_id || 1;

    if (!fiscalNome.trim() || !fiscalEmail.trim()) {
      toast.error('Nome e email são obrigatórios.');
      return;
    }
    if (!editingFiscal && !fiscalPassword.trim()) {
      toast.error('A palavra-passe é obrigatória ao criar um novo fiscal.');
      return;
    }

    const payload: any = {
      nome: fiscalNome.trim(),
      email: fiscalEmail.trim(),
      telefone: fiscalTelefone.trim(),
      document: fiscalDocument.trim(),
      company_id: companyId,
    };
    if (fiscalPassword.trim()) payload.password = fiscalPassword.trim();

    try {
      const url = editingFiscal
        ? `/api/carrier/fiscais/${editingFiscal.id}/`
        : '/api/carrier/fiscais/';
      const method = editingFiscal ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Falha ao gravar fiscal.');
      }
      toast.success(
        editingFiscal ? 'Fiscal atualizado com sucesso!' : 'Fiscal criado com sucesso!'
      );
      setIsFiscalModalOpen(false);
      fetchCompanyAndOperationalData();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao guardar fiscal.');
    }
  };

  const handleDeleteFiscal = async (id: number) => {
    if (!window.confirm('Tem a certeza que deseja remover este fiscal?')) return;
    const companyId = currentUser?.company_id || 1;
    try {
      const res = await fetch(`/api/carrier/fiscais/${id}/?company_id=${companyId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Falha ao remover fiscal.');
      toast.success('Fiscal removido com sucesso!');
      fetchCompanyAndOperationalData();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao remover fiscal.');
    }
  };

  // LOCALIDADES CRUD
  const handleOpenLocationModal = (location?: Location) => {
    if (location) {
      setEditingLocation(location);
      setLocationNome(location.nome);
      setLocationProvincia(location.provincia);
    } else {
      setEditingLocation(null);
      setLocationNome('');
      setLocationProvincia('');
    }
    setIsLocationModalOpen(true);
  };

  const handleSaveLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    const companyId = currentUser?.company_id || 1;

    if (!locationNome.trim() || !locationProvincia.trim()) {
      toast.error('Nome e província são obrigatórios.');
      return;
    }

    const payload = {
      nome: locationNome.trim(),
      provincia: locationProvincia.trim(),
      company_id: companyId,
    };

    try {
      const url = editingLocation ? `/api/locations/${editingLocation.id}/` : '/api/locations/';
      const method = editingLocation ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Falha ao gravar localidade.');
      }
      toast.success(
        editingLocation ? 'Localidade atualizada com sucesso!' : 'Localidade criada com sucesso!'
      );
      setIsLocationModalOpen(false);
      fetchCompanyAndOperationalData();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao guardar localidade.');
    }
  };

  const handleDeleteLocation = async (id: number) => {
    if (
      !window.confirm(
        'Tem a certeza que deseja remover esta localidade? Quaisquer rotas associadas serão removidas.'
      )
    )
      return;
    const companyId = currentUser?.company_id || 1;
    try {
      const res = await fetch(`/api/locations/${id}/?company_id=${companyId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Falha ao remover localidade.');
      }
      toast.success('Localidade removida com sucesso!');
      fetchCompanyAndOperationalData();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao remover localidade.');
    }
  };

  // OPERADORES CRUD
  const handleOpenOperatorModal = (operator?: any) => {
    if (operator) {
      setEditingOperator(operator);
      setOperatorNome(operator.nome);
      setOperatorEmail(operator.email);
      setOperatorTelefone(operator.telefone || '');
      setOperatorDocument(operator.document || '');
      setOperatorPassword('');
    } else {
      setEditingOperator(null);
      setOperatorNome('');
      setOperatorEmail('');
      setOperatorTelefone('');
      setOperatorDocument('');
      setOperatorPassword('');
    }
    setIsOperatorModalOpen(true);
  };

  const handleSaveOperator = async (e: React.FormEvent) => {
    e.preventDefault();
    const companyId = currentUser?.company_id || 1;

    if (!operatorNome.trim() || !operatorEmail.trim()) {
      toast.error('Nome e email são obrigatórios.');
      return;
    }
    if (!editingOperator && !operatorPassword.trim()) {
      toast.error('A palavra-passe é obrigatória ao criar um novo operador.');
      return;
    }

    const payload: any = {
      nome: operatorNome.trim(),
      email: operatorEmail.trim(),
      telefone: operatorTelefone.trim(),
      document: operatorDocument.trim(),
      company_id: companyId,
    };
    if (operatorPassword.trim()) payload.password = operatorPassword.trim();

    try {
      const url = editingOperator
        ? `/api/carrier/operators/${editingOperator.id}/`
        : '/api/carrier/operators/';
      const method = editingOperator ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Falha ao gravar operador.');
      }
      toast.success(
        editingOperator ? 'Operador atualizado com sucesso!' : 'Operador criado com sucesso!'
      );
      setIsOperatorModalOpen(false);
      fetchCompanyAndOperationalData();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao guardar operador.');
    }
  };

  const handleDeleteOperator = async (id: number) => {
    if (!window.confirm('Tem a certeza que deseja remover este operador?')) return;
    const companyId = currentUser?.company_id || 1;
    try {
      const res = await fetch(`/api/carrier/operators/${id}/?company_id=${companyId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Falha ao remover operador.');
      }
      toast.success('Operador removido com sucesso!');
      fetchCompanyAndOperationalData();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao remover operador.');
    }
  };

  // PROFILE SAVE
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    const companyId = currentUser?.company_id || 1;

    const payload = {
      descricao: profileDesc.trim(),
      politica_cancelamento: profileCancel.trim(),
      company_id: companyId,
    };

    try {
      const res = await fetch(`/api/carrier/info/`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Erro ao ligar ao servidor.');
      toast.success('Perfil atualizado com sucesso!');
      fetchCompanyAndOperationalData();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao gravar o perfil.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // LOGO UPLOAD
  const handleUploadLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const companyId = currentUser?.company_id || 1;
    const formData = new FormData();
    formData.append('company_id', String(companyId));
    formData.append('logo', file);

    setIsSavingLogo(true);
    try {
      const res = await fetch('/api/admin/carriers/upload-logo/', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Falha no upload do logótipo.');
      toast.success('Logo da empresa atualizado com sucesso!');
      fetchCompanyAndOperationalData();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Erro ao carregar o logótipo.');
    } finally {
      setIsSavingLogo(false);
    }
  };

  // HELPER MAPPERS
  const getLocationName = (id: number) => {
    const loc = locations.find((l) => l.id === id);
    return loc ? `${loc.nome} (${loc.provincia})` : `Estação #${id}`;
  };

  const getRouteLabel = (route: Route) => {
    return `${getLocationName(route.origem)} → ${getLocationName(route.destino)}`;
  };

  // RENDER CONDITIONAL VIEWS
  if (isLoadingAuth) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
        <p className="text-sm font-semibold text-muted-foreground font-sans">
          A validar credenciais de operador...
        </p>
      </div>
    );
  }

  // Handle Account Blocks (PENDENTE, REJEITADA, SUSPENSA)
  const compStatus = company?.status || currentUser?.company_status || 'PENDENTE';
  if (compStatus !== 'APROVADA') {
    return (
      <div className="min-h-screen flex flex-col bg-background relative font-sans">
        <Header />
        <main className="flex-1 flex items-center justify-center px-4 py-24">
          <div className="w-full max-w-lg bg-card border border-border rounded-3xl p-8 shadow-xl text-center space-y-6 animate-bounce-in">
            <div className="mx-auto w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500">
              <AlertTriangle size={32} />
            </div>

            {compStatus === 'PENDENTE' && (
              <>
                <h1 className="text-xl font-black text-foreground tracking-tight">
                  Candidatura em Análise
                </h1>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  O cadastro da sua transportadora{' '}
                  <strong>{company?.nome || 'Nzila Parceiro'}</strong> foi submetido e está a ser
                  avaliado pelos nossos administradores.
                </p>
                <div className="bg-muted/50 border border-border rounded-2xl p-4 text-xs font-semibold space-y-2 text-left">
                  <div className="flex items-center gap-2 text-primary">
                    <CheckCircle2 size={14} />
                    <span>Dados básicos registados</span>
                  </div>
                  <div className="flex items-center gap-2 text-primary">
                    <CheckCircle2 size={14} />
                    <span>Validação de segurança OTP concluída</span>
                  </div>
                  <div className="flex items-center gap-2 text-amber-500 animate-pulse">
                    <Loader2 size={14} className="animate-spin" />
                    <span>Análise legal dos documentos pendente</span>
                  </div>
                </div>
              </>
            )}

            {compStatus === 'REJEITADA' && (
              <>
                <div className="mx-auto w-16 h-16 rounded-full bg-danger/10 flex items-center justify-center text-danger">
                  <XCircle size={32} />
                </div>
                <h1 className="text-xl font-black text-foreground tracking-tight">
                  Registo Rejeitado
                </h1>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Lamentamos informar, mas a candidatura da empresa <strong>{company?.nome}</strong>{' '}
                  não foi aprovada pelo Administrador.
                </p>
                {company?.motivo_rejeicao && (
                  <div className="bg-danger/5 border border-danger/25 rounded-2xl p-4 text-xs font-bold text-danger text-left">
                    <span className="block text-[10px] text-danger/80 uppercase font-black tracking-wider mb-1">
                      Motivo apontado:
                    </span>
                    &quot;{company.motivo_rejeicao}&quot;
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Por favor, corrija os documentos e efetue um novo registo ou contacte-nos em{' '}
                  <a
                    href="mailto:suporte@nzila.ao"
                    className="text-primary hover:underline font-bold"
                  >
                    suporte@nzila.ao
                  </a>
                  .
                </p>
              </>
            )}

            {compStatus === 'SUSPENSA' && (
              <>
                <h1 className="text-xl font-black text-foreground tracking-tight">
                  Operação Suspensa
                </h1>
                <p className="text-sm text-muted-foreground leading-relaxed text-slate-400">
                  A conta operacional da transportadora <strong>{company?.nome}</strong> encontra-se
                  suspensa temporariamente por decisão administrativa.
                </p>
                <p className="text-xs text-muted-foreground bg-muted p-4 rounded-xl">
                  Durante a suspensão, não é permitido criar ou gerir partidas, autocarros ou
                  atualizar preços. Contacte o administrador geral da rede para reativação da
                  licença de operação.
                </p>
              </>
            )}

            <div className="pt-4 flex gap-2">
              <button
                onClick={() => {
                  localStorage.removeItem('nzila_current_user');
                  router.push('/sign-up-login-screen');
                }}
                className="flex-1 py-3 bg-muted border border-border text-foreground hover:bg-muted/80 font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <LogOut size={14} />
                Sair da Conta
              </button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // APROVADA: Show Full Operational Dashboard
  return (
    <div className="min-h-screen flex flex-col bg-background relative font-sans text-foreground">
      <Header />

      {/* Bus Modal */}
      {isBusModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-lg bg-card border border-border rounded-3xl p-6 shadow-2xl animate-bounce-in font-sans overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center border-b border-border pb-3 mb-4">
              <h3 className="text-base font-bold text-foreground">Novo Autocarro</h3>
              <button
                onClick={() => setIsBusModalOpen(false)}
                className="p-1 text-muted-foreground hover:bg-muted rounded-lg transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleAddBus} className="space-y-4 text-sm font-semibold">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                    Modelo do Veículo *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Marcopolo Paradiso G8"
                    value={busModel}
                    onChange={(e) => setBusModel(e.target.value)}
                    className="w-full px-4 py-2.5 border border-input rounded-xl bg-background text-foreground focus:outline-none focus:border-primary"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                    Matrícula (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: LD-12-34-AB"
                    value={busMatricula}
                    onChange={(e) => setBusMatricula(e.target.value)}
                    className="w-full px-4 py-2.5 border border-input rounded-xl bg-background text-foreground focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              {/* Seat Layout Configuration */}
              <div className="bg-muted/40 border border-border rounded-2xl p-4 space-y-3">
                <p className="text-xs font-black text-foreground uppercase tracking-wider">
                  Layout de Assentos
                </p>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-semibold text-muted-foreground mb-1">
                      Colunas Esq.
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="4"
                      value={busColEsq}
                      onChange={(e) =>
                        setBusColEsq(Math.max(1, Math.min(4, parseInt(e.target.value) || 1)))
                      }
                      className="w-full px-3 py-2 border border-input rounded-xl bg-background text-foreground focus:outline-none focus:border-primary text-center font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-muted-foreground mb-1">
                      Colunas Dir.
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="4"
                      value={busColDir}
                      onChange={(e) =>
                        setBusColDir(Math.max(1, Math.min(4, parseInt(e.target.value) || 1)))
                      }
                      className="w-full px-3 py-2 border border-input rounded-xl bg-background text-foreground focus:outline-none focus:border-primary text-center font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-muted-foreground mb-1">
                      Fileiras
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={busLinhas}
                      onChange={(e) =>
                        setBusLinhas(Math.max(1, Math.min(20, parseInt(e.target.value) || 1)))
                      }
                      className="w-full px-3 py-2 border border-input rounded-xl bg-background text-foreground focus:outline-none focus:border-primary text-center font-bold"
                    />
                  </div>
                </div>

                {/* Visual Seat Preview */}
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] text-muted-foreground font-semibold">
                      Pré-visualização do Layout
                    </p>
                    <span className="text-xs font-black text-primary">
                      {busCapacidade} lugares no total
                    </span>
                  </div>
                  <div className="bg-background border border-border rounded-xl p-3 overflow-x-auto">
                    {/* Bus front */}
                    <div className="text-center text-[9px] text-muted-foreground font-bold mb-2 tracking-widest">
                      — FRENTE DO AUTOCARRO —
                    </div>
                    <div className="inline-flex flex-col gap-1 min-w-full">
                      {Array.from({ length: Math.min(busLinhas, 6) }).map((_, rowIdx) => (
                        <div key={rowIdx} className="flex items-center gap-1">
                          <span className="text-[9px] text-muted-foreground w-5 text-right font-bold">
                            {String(rowIdx + 1).padStart(2, '0')}
                          </span>
                          <div className="flex gap-0.5">
                            {Array.from({ length: busColEsq }).map((_, ci) => (
                              <div
                                key={ci}
                                className="w-5 h-4 rounded-sm bg-primary/20 border border-primary/40 text-[7px] flex items-center justify-center text-primary font-bold"
                              >
                                {String.fromCharCode(65 + ci)}
                              </div>
                            ))}
                          </div>
                          <div className="w-2 border-l-2 border-dashed border-border h-4" />
                          <div className="flex gap-0.5">
                            {Array.from({ length: busColDir }).map((_, ci) => (
                              <div
                                key={ci}
                                className="w-5 h-4 rounded-sm bg-blue-500/20 border border-blue-500/40 text-[7px] flex items-center justify-center text-blue-500 font-bold"
                              >
                                {String.fromCharCode(65 + busColEsq + ci)}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                      {busLinhas > 6 && (
                        <div className="text-center text-[9px] text-muted-foreground font-bold">
                          ... mais {busLinhas - 6} fileiras
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsBusModalOpen(false)}
                  className="flex-1 py-2.5 border border-border text-foreground hover:bg-muted font-bold rounded-xl transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-primary text-primary-foreground hover:bg-accent font-bold rounded-xl transition-all"
                >
                  Adicionar Autocarro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Route Modal */}
      {isRouteModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-md bg-card border border-border rounded-3xl p-6 shadow-2xl animate-bounce-in font-sans">
            <div className="flex justify-between items-center border-b border-border pb-3 mb-4">
              <h3 className="text-base font-bold text-foreground">Nova Rota de Ligação</h3>
              <button
                onClick={() => setIsRouteModalOpen(false)}
                className="p-1 text-muted-foreground hover:bg-muted rounded-lg transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleAddRoute} className="space-y-4 text-sm font-semibold">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5 font-sans">
                  Cidade de Origem
                </label>
                <select
                  required
                  value={routeOrigin}
                  onChange={(e) => setRouteOrigin(e.target.value)}
                  className="w-full px-4 py-2.5 border border-input rounded-xl bg-background text-foreground focus:outline-none focus:border-primary cursor-pointer"
                >
                  <option value="">Selecione a Origem</option>
                  {locations.map((l) => (
                    <option key={`orig-${l.id}`} value={l.id}>
                      {l.nome} ({l.provincia})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5 font-sans">
                  Cidade de Destino
                </label>
                <select
                  required
                  value={routeDestination}
                  onChange={(e) => setRouteDestination(e.target.value)}
                  className="w-full px-4 py-2.5 border border-input rounded-xl bg-background text-foreground focus:outline-none focus:border-primary cursor-pointer"
                >
                  <option value="">Selecione o Destino</option>
                  {locations.map((l) => (
                    <option key={`dest-${l.id}`} value={l.id}>
                      {l.nome} ({l.provincia})
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                    Distância (Km)
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="Ex: 600"
                    value={routeDistance}
                    onChange={(e) => setRouteDistance(e.target.value)}
                    className="w-full px-4 py-2.5 border border-input rounded-xl bg-background text-foreground focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                    Duração Estimada
                  </label>
                  <input
                    type="time"
                    required
                    value={routeDuration}
                    onChange={(e) => setRouteDuration(e.target.value)}
                    className="w-full px-4 py-2.5 border border-input rounded-xl bg-background text-foreground focus:outline-none"
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRouteModalOpen(false)}
                  className="flex-1 py-2.5 border border-border text-foreground hover:bg-muted font-bold rounded-xl transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-primary text-primary-foreground hover:bg-accent font-bold rounded-xl transition-all"
                >
                  Salvar Rota
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Trip Modal */}
      {isTripModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-lg bg-card border border-border rounded-3xl shadow-2xl animate-bounce-in font-sans flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center border-b border-border p-6 pb-3 flex-shrink-0">
              <h3 className="text-base font-bold text-foreground">Agendar Nova Viagem (Partida)</h3>
              <button
                onClick={() => setIsTripModalOpen(false)}
                className="p-1 text-muted-foreground hover:bg-muted rounded-lg transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            <form
              onSubmit={handleAddTrip}
              className="space-y-4 text-xs font-bold overflow-y-auto flex-1 p-6 pt-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-muted-foreground mb-1.5 font-sans">
                    Rota Ativa *
                  </label>
                  <select
                    required
                    value={tripRouteId}
                    onChange={(e) => setTripRouteId(e.target.value)}
                    className="w-full px-3 py-2 border border-input rounded-xl bg-background text-foreground focus:outline-none cursor-pointer"
                  >
                    <option value="">Selecione a Rota</option>
                    {routes.map((r) => (
                      <option key={`trip-r-${r.id}`} value={r.id}>
                        {getRouteLabel(r)} ({r.distancia_km}km)
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-muted-foreground mb-1.5 font-sans">
                    Autocarro Disponível *
                  </label>
                  <select
                    required
                    value={tripBusId}
                    onChange={(e) => setTripBusId(e.target.value)}
                    className="w-full px-3 py-2 border border-input rounded-xl bg-background text-foreground focus:outline-none cursor-pointer"
                  >
                    <option value="">Selecione o Autocarro</option>
                    {buses.map((b) => (
                      <option key={`trip-b-${b.id}`} value={b.id}>
                        {b.modelo} - {b.capacidade} lugares
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Recurrence selector */}
              <div>
                <label className="block text-[10px] text-muted-foreground mb-1.5">
                  Tipo de Agendamento
                </label>
                <div className="flex gap-2">
                  {[
                    { value: 'none', label: 'Data única' },
                    { value: 'weekly', label: 'Semanal' },
                    { value: 'monthly', label: 'Mensal' },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setTripRecurrence(opt.value as any)}
                      className={`flex-1 py-1.5 rounded-lg border text-[10px] font-black transition-all ${
                        tripRecurrence === opt.value
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-card border-border text-foreground hover:bg-muted'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] text-muted-foreground mb-1.5">
                    {tripRecurrence === 'none' ? 'Data de Partida *' : 'Data de Início *'}
                  </label>
                  <input
                    type="date"
                    required
                    value={tripDate}
                    onChange={(e) => setTripDate(e.target.value)}
                    className="w-full px-3 py-2 border border-input rounded-xl bg-background text-foreground focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-muted-foreground mb-1.5">
                    Hora de Saída *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: 06:00"
                    value={tripDepTime}
                    onChange={(e) => setTripDepTime(e.target.value)}
                    className="w-full px-3 py-2 border border-input rounded-xl bg-background text-foreground focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-muted-foreground mb-1.5">
                    Hora de Chegada *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: 14:30"
                    value={tripArrTime}
                    onChange={(e) => setTripArrTime(e.target.value)}
                    className="w-full px-3 py-2 border border-input rounded-xl bg-background text-foreground focus:outline-none"
                  />
                </div>
              </div>

              {/* Weekly options */}
              {tripRecurrence === 'weekly' && (
                <div className="bg-muted/30 border border-border rounded-xl p-3 space-y-3">
                  <div>
                    <label className="block text-[10px] text-muted-foreground mb-1.5 font-black">
                      Dias da semana *
                    </label>
                    <div className="flex gap-1.5 flex-wrap">
                      {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((label, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() =>
                            setTripRecWeekDays((prev) =>
                              prev.includes(idx) ? prev.filter((d) => d !== idx) : [...prev, idx]
                            )
                          }
                          className={`w-9 h-9 rounded-lg border text-[10px] font-black transition-all ${
                            tripRecWeekDays.includes(idx)
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'bg-card border-border text-foreground hover:bg-muted'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] text-muted-foreground mb-1.5 font-black">
                      Data de fim *
                    </label>
                    <input
                      type="date"
                      value={tripRecEndDate}
                      min={tripDate}
                      onChange={(e) => setTripRecEndDate(e.target.value)}
                      className="w-full px-3 py-2 border border-input rounded-xl bg-background text-foreground focus:outline-none text-xs"
                    />
                  </div>
                  {tripDate && tripRecEndDate && tripRecWeekDays.length > 0 && (
                    <p className="text-[10px] text-primary font-bold">
                      ≈ {buildDates().length} viagem(ns) serão criadas
                    </p>
                  )}
                </div>
              )}

              {/* Monthly options */}
              {tripRecurrence === 'monthly' && (
                <div className="bg-muted/30 border border-border rounded-xl p-3 space-y-3">
                  <div>
                    <label className="block text-[10px] text-muted-foreground mb-1.5 font-black">
                      Dia do mês *
                    </label>
                    <div className="flex flex-wrap gap-1">
                      {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => setTripRecMonthDay(String(d))}
                          className={`w-8 h-8 rounded-lg border text-[10px] font-black transition-all ${
                            tripRecMonthDay === String(d)
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'bg-card border-border text-foreground hover:bg-muted'
                          }`}
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] text-muted-foreground mb-1.5 font-black">
                      Data de fim *
                    </label>
                    <input
                      type="date"
                      value={tripRecEndDate}
                      min={tripDate}
                      onChange={(e) => setTripRecEndDate(e.target.value)}
                      className="w-full px-3 py-2 border border-input rounded-xl bg-background text-foreground focus:outline-none text-xs"
                    />
                  </div>
                  {tripDate && tripRecEndDate && tripRecMonthDay && (
                    <p className="text-[10px] text-primary font-bold">
                      ≈ {buildDates().length} viagem(ns) serão criadas
                    </p>
                  )}
                </div>
              )}

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] text-muted-foreground mb-1.5">
                    Preço Só Ida (Kz) *
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="Ex: 4500"
                    value={tripPrice}
                    onChange={(e) => setTripPrice(e.target.value)}
                    className="w-full px-3 py-2 border border-input rounded-xl bg-background text-foreground focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-muted-foreground mb-1.5">
                    Preço Ida e Volta (Kz)
                  </label>
                  <input
                    type="number"
                    placeholder="Ex: 9000 (Opcional)"
                    value={tripPriceReturn}
                    onChange={(e) => setTripPriceReturn(e.target.value)}
                    className="w-full px-3 py-2 border border-input rounded-xl bg-background text-foreground focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-muted-foreground mb-1.5 font-sans">
                    Classe de Serviço *
                  </label>
                  <select
                    required
                    value={tripClass}
                    onChange={(e) => setTripClass(e.target.value)}
                    className="w-full px-3 py-2 border border-input rounded-xl bg-background text-foreground focus:outline-none cursor-pointer"
                  >
                    <option value="ECONOMICA">Económica</option>
                    <option value="CONFORTO">Conforto</option>
                    <option value="EXECUTIVA">Executiva</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-muted-foreground mb-1.5 font-sans">
                  Serviços Disponíveis (Comodidades)
                </label>
                <div className="flex flex-wrap gap-2.5">
                  {['ar-condicionado', 'wifi', 'tomada', 'snack', 'refeicao', 'entretenimento'].map(
                    (item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => {
                          if (tripAmenities.includes(item)) {
                            setTripAmenities(tripAmenities.filter((a) => a !== item));
                          } else {
                            setTripAmenities([...tripAmenities, item]);
                          }
                        }}
                        className={`px-3 py-1.5 rounded-lg border transition-all text-[10px] font-black ${
                          tripAmenities.includes(item)
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-card border-border text-foreground hover:bg-muted'
                        }`}
                      >
                        {item.replace('-', ' ').toUpperCase()}
                      </button>
                    )
                  )}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsTripModalOpen(false);
                    resetTripForm();
                  }}
                  className="flex-1 py-2.5 border border-border text-foreground hover:bg-muted font-bold rounded-xl transition-all"
                  disabled={isSubmittingTrip}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingTrip}
                  className="flex-1 py-2.5 bg-primary text-primary-foreground hover:bg-accent font-bold rounded-xl transition-all disabled:opacity-60 flex items-center justify-center gap-1.5"
                >
                  {isSubmittingTrip ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />A criar viagens...
                    </>
                  ) : tripRecurrence !== 'none' && buildDates().length > 0 ? (
                    `Criar ${buildDates().length} Viagem(ns)`
                  ) : (
                    'Agendar Viagem'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Fiscal Modal */}
      {isFiscalModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-md bg-card border border-border rounded-3xl p-6 shadow-2xl animate-bounce-in font-sans">
            <div className="flex justify-between items-center border-b border-border pb-3 mb-4">
              <h3 className="text-base font-bold text-foreground">
                {editingFiscal ? 'Editar Fiscal' : 'Novo Fiscal de Pista'}
              </h3>
              <button
                onClick={() => setIsFiscalModalOpen(false)}
                className="p-1 text-muted-foreground hover:bg-muted rounded-lg transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSaveFiscal} className="space-y-4 text-sm font-semibold">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: João Fernandes Silva"
                  value={fiscalNome}
                  onChange={(e) => setFiscalNome(e.target.value)}
                  className="w-full px-4 py-2.5 border border-input rounded-xl bg-background text-foreground focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                  Email {editingFiscal ? '(não editável)' : '*'}
                </label>
                <input
                  type="email"
                  required
                  disabled={!!editingFiscal}
                  placeholder="fiscal@transportadora.ao"
                  value={fiscalEmail}
                  onChange={(e) => setFiscalEmail(e.target.value)}
                  className="w-full px-4 py-2.5 border border-input rounded-xl bg-background text-foreground focus:outline-none focus:border-primary disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                    Telefone
                  </label>
                  <input
                    type="tel"
                    placeholder="+244 9XX XXX XXX"
                    value={fiscalTelefone}
                    onChange={(e) => setFiscalTelefone(e.target.value)}
                    className="w-full px-3 py-2.5 border border-input rounded-xl bg-background text-foreground focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                    Nº Documento
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: 005432168LA045"
                    value={fiscalDocument}
                    onChange={(e) => setFiscalDocument(e.target.value)}
                    className="w-full px-3 py-2.5 border border-input rounded-xl bg-background text-foreground focus:outline-none focus:border-primary"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                  {editingFiscal
                    ? 'Nova Palavra-Passe (deixar em branco para manter)'
                    : 'Palavra-Passe *'}
                </label>
                <input
                  type="password"
                  required={!editingFiscal}
                  placeholder="Mínimo 8 caracteres"
                  value={fiscalPassword}
                  onChange={(e) => setFiscalPassword(e.target.value)}
                  className="w-full px-4 py-2.5 border border-input rounded-xl bg-background text-foreground focus:outline-none focus:border-primary"
                />
              </div>
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 text-[10px] text-primary font-semibold">
                💡 O fiscal usará este email e palavra-passe para entrar na aplicação móvel de
                validação de bilhetes.
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsFiscalModalOpen(false)}
                  className="flex-1 py-2.5 border border-border text-foreground hover:bg-muted font-bold rounded-xl transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-primary text-primary-foreground hover:bg-accent font-bold rounded-xl transition-all"
                >
                  {editingFiscal ? 'Guardar Alterações' : 'Criar Fiscal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Location Modal */}
      {isLocationModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-md bg-card border border-border rounded-3xl p-6 shadow-2xl animate-bounce-in font-sans">
            <div className="flex justify-between items-center border-b border-border pb-3 mb-4">
              <h3 className="text-base font-bold text-foreground">
                {editingLocation ? 'Editar Localidade' : 'Nova Localidade / Estação'}
              </h3>
              <button
                onClick={() => setIsLocationModalOpen(false)}
                className="p-1 text-muted-foreground hover:bg-muted rounded-lg transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSaveLocation} className="space-y-4 text-sm font-semibold">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                  Nome da Estação / Terminal *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Terminal Macon Huambo"
                  value={locationNome}
                  onChange={(e) => setLocationNome(e.target.value)}
                  className="w-full px-4 py-2.5 border border-input rounded-xl bg-background text-foreground focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                  Província *
                </label>
                <select
                  required
                  value={locationProvincia}
                  onChange={(e) => setLocationProvincia(e.target.value)}
                  className="w-full px-4 py-2.5 border border-input rounded-xl bg-background text-foreground focus:outline-none focus:border-primary"
                >
                  <option value="">Selecione a Província</option>
                  {[
                    'Bengo',
                    'Benguela',
                    'Bié',
                    'Cabinda',
                    'Cuando Cubango',
                    'Cuanza Norte',
                    'Cuanza Sul',
                    'Cunene',
                    'Huambo',
                    'Huíla',
                    'Luanda',
                    'Lunda Norte',
                    'Lunda Sul',
                    'Malanje',
                    'Moxico',
                    'Namibe',
                    'Uíge',
                    'Zaire',
                  ].map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsLocationModalOpen(false)}
                  className="flex-1 py-2.5 border border-border text-foreground hover:bg-muted font-bold rounded-xl transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-primary text-primary-foreground hover:bg-accent font-bold rounded-xl transition-all"
                >
                  {editingLocation ? 'Guardar Alterações' : 'Criar Localidade'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Operator Modal */}
      {isOperatorModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-md bg-card border border-border rounded-3xl p-6 shadow-2xl animate-bounce-in font-sans">
            <div className="flex justify-between items-center border-b border-border pb-3 mb-4">
              <h3 className="text-base font-bold text-foreground">
                {editingOperator ? 'Editar Operador' : 'Novo Operador de Bilheteira'}
              </h3>
              <button
                onClick={() => setIsOperatorModalOpen(false)}
                className="p-1 text-muted-foreground hover:bg-muted rounded-lg transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSaveOperator} className="space-y-4 text-sm font-semibold">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Carlos Mateus Silva"
                  value={operatorNome}
                  onChange={(e) => setOperatorNome(e.target.value)}
                  className="w-full px-4 py-2.5 border border-input rounded-xl bg-background text-foreground focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                  Email {editingOperator ? '(não editável)' : '*'}
                </label>
                <input
                  type="email"
                  required
                  disabled={!!editingOperator}
                  placeholder="operador@transportadora.ao"
                  value={operatorEmail}
                  onChange={(e) => setOperatorEmail(e.target.value)}
                  className="w-full px-4 py-2.5 border border-input rounded-xl bg-background text-foreground focus:outline-none focus:border-primary disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                    Telefone
                  </label>
                  <input
                    type="tel"
                    placeholder="+244 9XX XXX XXX"
                    value={operatorTelefone}
                    onChange={(e) => setOperatorTelefone(e.target.value)}
                    className="w-full px-3 py-2.5 border border-input rounded-xl bg-background text-foreground focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                    Nº Documento (BI)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: 002345678LA099"
                    value={operatorDocument}
                    onChange={(e) => setOperatorDocument(e.target.value)}
                    className="w-full px-3 py-2.5 border border-input rounded-xl bg-background text-foreground focus:outline-none focus:border-primary"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                  {editingOperator
                    ? 'Nova Palavra-Passe (deixar em branco para manter)'
                    : 'Palavra-Passe *'}
                </label>
                <input
                  type="password"
                  required={!editingOperator}
                  placeholder="Mínimo 8 caracteres"
                  value={operatorPassword}
                  onChange={(e) => setOperatorPassword(e.target.value)}
                  className="w-full px-4 py-2.5 border border-input rounded-xl bg-background text-foreground focus:outline-none focus:border-primary"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsOperatorModalOpen(false)}
                  className="flex-1 py-2.5 border border-border text-foreground hover:bg-muted font-bold rounded-xl transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-primary text-primary-foreground hover:bg-accent font-bold rounded-xl transition-all"
                >
                  {editingOperator ? 'Guardar Alterações' : 'Criar Operador'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <main className="flex-1 pt-24 pb-16 font-sans">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">
          {/* Header Dashboard Banner */}
          <div className="bg-card border border-border rounded-3xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center font-extrabold text-lg text-primary overflow-hidden">
                {company?.logo_url ? (
                  <img src={company.logo_url} alt="Logo" className="w-full h-full object-contain" />
                ) : (
                  company?.code || company?.nome?.substring(0, 3).toUpperCase() || 'TRP'
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
                    {company?.nome || 'Minha Transportadora'}
                  </h1>
                  <span className="px-2.5 py-0.5 border border-success/20 bg-success/10 text-success rounded-full text-[9px] font-black tracking-wide flex items-center gap-1">
                    <ShieldCheck size={10} /> APROVADA
                  </span>
                </div>
                <p className="text-xs text-muted-foreground font-medium mt-1">
                  NIF: {company?.nif || '500012345'} | Contacto: {company?.email}
                </p>
              </div>
            </div>

            {/* Tabs for Navigation */}
            <div className="flex gap-2 flex-wrap md:flex-nowrap">
              {[
                { id: 'frota', label: 'Frota', icon: BusIcon },
                { id: 'localidades', label: 'Localidades', icon: MapPin },
                { id: 'rotas', label: 'Rotas', icon: Map },
                { id: 'viagens', label: 'Viagens / Escalas', icon: Calendar },
                { id: 'fiscais', label: 'Fiscais', icon: ShieldCheck },
                { id: 'operadores', label: 'Operadores', icon: Users },
                { id: 'perfil', label: 'Perfil Empresa', icon: Building2 },
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                      activeTab === tab.id
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'bg-card border border-border text-foreground hover:bg-muted'
                    }`}
                  >
                    <Icon size={14} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* TAB 1: FLEET (AUTOCARROS) */}
          {activeTab === 'frota' && (
            <div className="bg-card border border-border rounded-3xl p-6 lg:p-8 shadow-sm space-y-6 animate-fade-in">
              <div className="flex items-center justify-between border-b border-border pb-4 flex-wrap gap-4">
                <div>
                  <h2 className="text-lg font-bold text-foreground">Gestão de Frota</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Adicione os autocarros operacionais e configure a capacidade de lugares.
                  </p>
                </div>
                <button
                  onClick={() => setIsBusModalOpen(true)}
                  className="px-4 py-2 bg-primary text-primary-foreground font-bold rounded-xl text-xs hover:bg-accent transition-all active:scale-95 flex items-center gap-1.5"
                >
                  <Plus size={14} />
                  <span>Adicionar Autocarro</span>
                </button>
              </div>

              {isLoadingData ? (
                <div className="text-center py-12 text-muted-foreground font-bold">
                  Carregando frota...
                </div>
              ) : buses.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  Nenhum autocarro registado na sua frota. Adicione o seu primeiro veículo para
                  começar a escalar viagens.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {buses.map((bus) => {
                    const busTripsCount = trips.filter(
                      (t) => t.bus_id === bus.id && t.status !== 'CANCELADA'
                    ).length;
                    return (
                      <div
                        key={`bus-${bus.id}`}
                        className="p-5 bg-muted/20 border border-border rounded-2xl flex items-center justify-between"
                      >
                        <div className="space-y-1.5 min-w-0">
                          <span className="block font-bold text-foreground text-sm truncate font-sans">
                            {bus.modelo}
                            {bus.matricula ? ` — ${bus.matricula}` : ''}
                          </span>
                          <span className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1">
                            <Users size={12} className="text-primary" /> {bus.capacidade} Lugares
                          </span>
                          <span className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1">
                            <MapPin size={12} className="text-primary" />
                            Layout: {bus.colunas_esquerda}+{bus.colunas_direita} × {bus.linhas}{' '}
                            fileiras
                          </span>
                          <span className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1">
                            <Calendar size={12} className="text-primary" /> {busTripsCount} Partidas
                            Agendadas
                          </span>
                        </div>
                        <button
                          onClick={() => handleDeleteBus(bus.id)}
                          title="Eliminar Autocarro"
                          className="p-2 border border-danger/25 text-danger hover:bg-danger/5 rounded-xl transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB: LOCALIDADES (LOCATIONS) */}
          {activeTab === 'localidades' && (
            <div className="bg-card border border-border rounded-3xl p-6 lg:p-8 shadow-sm space-y-6 animate-fade-in">
              <div className="flex items-center justify-between border-b border-border pb-4 flex-wrap gap-4">
                <div>
                  <h2 className="text-lg font-bold text-foreground">
                    Minhas Localidades / Estações
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5 font-sans">
                    Gerencie os seus terminais e pontos de paragem personalizados.
                  </p>
                </div>
                <button
                  onClick={() => handleOpenLocationModal()}
                  className="px-4 py-2 bg-primary text-primary-foreground font-bold rounded-xl text-xs hover:bg-accent transition-all active:scale-95 flex items-center gap-1.5"
                >
                  <Plus size={14} />
                  <span>Nova Localidade</span>
                </button>
              </div>

              {isLoadingData ? (
                <div className="text-center py-12 text-muted-foreground font-bold">
                  Carregando localidades...
                </div>
              ) : locations.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  Nenhuma localidade registada.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 font-semibold text-xs">
                  {locations.map((loc) => {
                    const isGlobal = !(loc as any).company;
                    return (
                      <div
                        key={`location-${loc.id}`}
                        className="p-4 bg-muted/20 border border-border rounded-2xl flex items-center justify-between gap-4"
                      >
                        <div className="space-y-1">
                          <span className="block font-bold text-foreground text-sm font-sans">
                            {loc.nome}
                          </span>
                          <span className="text-[10px] text-muted-foreground block">
                            Província: {loc.provincia}
                          </span>
                          <span
                            className={`inline-block text-[8px] px-1.5 py-0.5 rounded-full font-bold ${
                              isGlobal
                                ? 'bg-primary/10 text-primary border border-primary/20'
                                : 'bg-success/10 text-success border border-success/20'
                            }`}
                          >
                            {isGlobal ? 'Global' : 'Personalizada'}
                          </span>
                        </div>

                        {!isGlobal && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleOpenLocationModal(loc)}
                              className="px-2 py-1 border border-border text-foreground hover:bg-muted rounded-lg text-[10px]"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => handleDeleteLocation(loc.id)}
                              className="p-1 border border-danger/30 text-danger hover:bg-danger/5 hover:border-danger/55 rounded-lg"
                              title="Remover Localidade"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: ROUTES (ROTAS) */}
          {activeTab === 'rotas' && (
            <div className="bg-card border border-border rounded-3xl p-6 lg:p-8 shadow-sm space-y-6 animate-fade-in">
              <div className="flex items-center justify-between border-b border-border pb-4 flex-wrap gap-4">
                <div>
                  <h2 className="text-lg font-bold text-foreground">Rotas da Transportadora</h2>
                  <p className="text-xs text-muted-foreground mt-0.5 font-sans">
                    Configure os trajectos operados pela sua empresa entre províncias de Angola.
                  </p>
                </div>
                <button
                  onClick={() => setIsRouteModalOpen(true)}
                  className="px-4 py-2 bg-primary text-primary-foreground font-bold rounded-xl text-xs hover:bg-accent transition-all active:scale-95 flex items-center gap-1.5"
                >
                  <Plus size={14} />
                  <span>Nova Rota</span>
                </button>
              </div>

              {isLoadingData ? (
                <div className="text-center py-12 text-muted-foreground font-bold">
                  Carregando rotas...
                </div>
              ) : routes.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  Nenhuma rota criada. Adicione rotas ligando cidades para poder agendar escalas.
                </div>
              ) : (
                <div className="space-y-3 font-semibold text-xs">
                  {routes.map((route) => (
                    <div
                      key={`route-${route.id}`}
                      className="p-4 bg-muted/20 border border-border rounded-2xl flex items-center justify-between flex-wrap sm:flex-nowrap gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 font-bold text-foreground text-sm">
                          <span>{getLocationName(route.origem)}</span>
                          <ChevronRight size={14} className="text-primary" />
                          <span>{getLocationName(route.destino)}</span>
                        </div>
                        <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <MapPin size={12} /> Distância: {route.distancia_km} Km
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock size={12} /> Tempo de percurso: {route.duracao_estimada}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteRoute(route.id)}
                        className="px-2.5 py-1.5 border border-danger/30 text-danger hover:bg-danger/5 hover:border-danger/60 rounded-xl text-[10px] font-black transition-colors flex items-center gap-1"
                      >
                        <Trash2 size={12} />
                        <span>Remover</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: TRIPS (VIAGENS E HORÁRIOS) */}
          {activeTab === 'viagens' && (
            <div className="bg-card border border-border rounded-3xl p-6 lg:p-8 shadow-sm space-y-6 animate-fade-in">
              <div className="flex items-center justify-between border-b border-border pb-4 flex-wrap gap-4 font-sans">
                <div>
                  <h2 className="text-lg font-bold text-foreground">
                    Agenda de Partidas / Viagens
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Consulte os horários, controle a lotação atual e adicione novas escalas de
                    partidas.
                  </p>
                </div>
                <button
                  onClick={() => {
                    if (buses.length === 0) {
                      toast.error(
                        'Registe pelo menos um autocarro na frota antes de agendar viagens.'
                      );
                      return;
                    }
                    if (routes.length === 0) {
                      toast.error(
                        'Crie pelo menos uma rota interprovincial antes de agendar viagens.'
                      );
                      return;
                    }
                    setIsTripModalOpen(true);
                  }}
                  className="px-4 py-2 bg-primary text-primary-foreground font-bold rounded-xl text-xs hover:bg-accent transition-all active:scale-95 flex items-center gap-1.5"
                >
                  <Plus size={14} />
                  <span>Escalar Viagem</span>
                </button>
              </div>

              {isLoadingData ? (
                <div className="text-center py-12 text-muted-foreground font-bold">
                  Carregando viagens...
                </div>
              ) : trips.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  Nenhuma viagem agendada. Clique em &quot;Escalar Viagem&quot; para disponibilizar
                  bilhetes para os clientes.
                </div>
              ) : (
                <div className="overflow-x-auto text-xs">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-border/80 text-muted-foreground font-black uppercase tracking-wider text-[9px] bg-muted/40">
                        <th className="p-3">Destino / Rota</th>
                        <th className="p-3">Data / Hora Partida</th>
                        <th className="p-3">Classe</th>
                        <th className="p-3">Ocupação (Lugares)</th>
                        <th className="p-3">Preço Unitário</th>
                        <th className="p-3">Estado</th>
                        <th className="p-3 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {trips.map((trip) => {
                        const occupied = trip.totalSeats - trip.availableSeats;
                        const occupancyPercent = Math.round((occupied / trip.totalSeats) * 100);

                        return (
                          <tr key={`trip-${trip.id}`} className="hover:bg-muted/10 font-medium">
                            <td className="p-3 font-bold text-foreground">
                              <div className="flex items-center gap-1">
                                <span>{trip.origin}</span>
                                <span className="text-muted-foreground">→</span>
                                <span>{trip.destination}</span>
                              </div>
                              <span className="text-[10px] text-muted-foreground font-medium block">
                                Duração: {trip.durationLabel}
                              </span>
                            </td>
                            <td className="p-3">
                              <span className="block font-bold text-foreground">
                                {trip.date
                                  ? new Date(trip.date + 'T00:00:00').toLocaleDateString('pt-AO', {
                                      day: '2-digit',
                                      month: 'short',
                                      year: 'numeric',
                                    })
                                  : '—'}
                              </span>
                              <span className="text-[10px] text-muted-foreground block">
                                Partida: {trip.departureTime} | Chegada: {trip.arrivalTime}
                              </span>
                            </td>
                            <td className="p-3">
                              <span className="px-2 py-0.5 bg-muted text-foreground border border-border rounded text-[10px] uppercase font-black">
                                {trip.classLabel}
                              </span>
                            </td>
                            <td className="p-3">
                              <div className="flex items-center gap-2">
                                <div className="w-20 bg-muted rounded-full h-1.5 overflow-hidden">
                                  <div
                                    className={`h-full ${occupancyPercent > 80 ? 'bg-danger' : occupancyPercent > 50 ? 'bg-amber-500' : 'bg-primary'}`}
                                    style={{ width: `${occupancyPercent}%` }}
                                  />
                                </div>
                                <span className="font-bold text-foreground">
                                  {occupied}/{trip.totalSeats} ({occupancyPercent}%)
                                </span>
                              </div>
                            </td>
                            <td className="p-3 font-bold text-primary">
                              {trip.price.toLocaleString('pt-AO')} Kz
                              {trip.preco_ida_volta && (
                                <span className="block text-[9px] text-muted-foreground font-normal">
                                  I/V: {trip.preco_ida_volta.toLocaleString('pt-AO')} Kz
                                </span>
                              )}
                            </td>
                            <td className="p-3">
                              <span
                                className={`inline-block px-2.5 py-0.5 border rounded-full text-[9px] font-black tracking-wide ${
                                  trip.status === 'CANCELADA'
                                    ? 'bg-danger/10 border-danger/20 text-danger'
                                    : 'bg-success/10 border-success/20 text-success'
                                }`}
                              >
                                {trip.status || 'ATIVA'}
                              </span>
                            </td>
                            <td className="p-3 text-right">
                              <div className="flex items-center justify-end gap-1 flex-wrap">
                                {trip.status !== 'CANCELADA' && (
                                  <>
                                    <button
                                      onClick={() => {
                                        const newPriceStr = prompt(
                                          'Defina o novo preço da viagem (Kz):',
                                          String(trip.price)
                                        );
                                        if (newPriceStr) {
                                          const np = parseFloat(newPriceStr);
                                          if (!isNaN(np) && np > 0) {
                                            handleUpdateTripPrice(trip.id, np);
                                          } else {
                                            toast.error('Preço inválido.');
                                          }
                                        }
                                      }}
                                      title="Atualizar Preço"
                                      className="px-2 py-1 border border-border hover:bg-muted rounded-lg text-foreground font-bold text-[10px]"
                                    >
                                      Editar Preço
                                    </button>
                                    <button
                                      onClick={() => handleCancelTrip(trip.id)}
                                      title="Cancelar Viagem"
                                      className="px-2 py-1 border border-danger/35 text-danger hover:bg-danger/5 rounded-lg font-bold text-[10px] transition-colors"
                                    >
                                      Cancelar
                                    </button>
                                  </>
                                )}
                                {trip.status === 'CANCELADA' && (
                                  <span className="text-muted-foreground italic text-[10px]">
                                    Sem Ações
                                  </span>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: FISCAIS */}
          {activeTab === 'fiscais' && (
            <div className="bg-card border border-border rounded-3xl p-6 lg:p-8 shadow-sm space-y-6 animate-fade-in">
              <div className="flex items-center justify-between border-b border-border pb-4 flex-wrap gap-4">
                <div>
                  <h2 className="text-lg font-bold text-foreground">Gestão de Fiscais</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Adicione e gira os fiscais de pista responsáveis pela validação de bilhetes nos
                    autocarros.
                  </p>
                </div>
                <button
                  onClick={() => handleOpenFiscalModal()}
                  className="px-4 py-2 bg-primary text-primary-foreground font-bold rounded-xl text-xs hover:bg-accent transition-all active:scale-95 flex items-center gap-1.5"
                >
                  <Plus size={14} />
                  <span>Novo Fiscal</span>
                </button>
              </div>

              {isLoadingData ? (
                <div className="text-center py-12 text-muted-foreground font-bold">
                  A carregar fiscais...
                </div>
              ) : fiscais.length === 0 ? (
                <div className="text-center py-16 space-y-3">
                  <ShieldCheck className="mx-auto text-muted-foreground/30" size={48} />
                  <p className="text-sm text-muted-foreground font-semibold">
                    Nenhum fiscal registado. Adicione fiscais de pista para validar bilhetes.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {fiscais.map((fiscal) => (
                    <div
                      key={`fiscal-${fiscal.id}`}
                      className="p-5 bg-muted/20 border border-border rounded-2xl space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-black text-sm flex-shrink-0">
                          {fiscal.nome.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-foreground text-sm truncate">
                            {fiscal.nome}
                          </p>
                          <p className="text-[10px] text-muted-foreground font-medium truncate">
                            {fiscal.email}
                          </p>
                        </div>
                        <span className="px-2 py-0.5 bg-primary/10 text-primary border border-primary/20 rounded-full text-[9px] font-black tracking-wide flex-shrink-0">
                          FISCAL
                        </span>
                      </div>
                      {fiscal.telefone && (
                        <p className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1.5">
                          <Clock size={10} className="text-primary" />
                          {fiscal.telefone}
                        </p>
                      )}
                      {fiscal.document && (
                        <p className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1.5">
                          <FileText size={10} className="text-primary" />
                          Doc: {fiscal.document}
                        </p>
                      )}
                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={() => handleOpenFiscalModal(fiscal)}
                          className="flex-1 py-1.5 border border-border text-foreground hover:bg-muted font-bold rounded-xl text-[10px] transition-colors flex items-center justify-center gap-1"
                        >
                          <Save size={10} />
                          Editar
                        </button>
                        <button
                          onClick={() => handleDeleteFiscal(fiscal.id)}
                          className="flex-1 py-1.5 border border-danger/25 text-danger hover:bg-danger/5 font-bold rounded-xl text-[10px] transition-colors flex items-center justify-center gap-1"
                        >
                          <Trash2 size={10} />
                          Remover
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB: OPERADORES */}
          {activeTab === 'operadores' && (
            <div className="bg-card border border-border rounded-3xl p-6 lg:p-8 shadow-sm space-y-6 animate-fade-in">
              <div className="flex items-center justify-between border-b border-border pb-4 flex-wrap gap-4">
                <div>
                  <h2 className="text-lg font-bold text-foreground">Operadores de Bilheteira</h2>
                  <p className="text-xs text-muted-foreground mt-0.5 font-sans">
                    Crie e faça a gestão de outros operadores associados à sua transportadora.
                  </p>
                </div>
                <button
                  onClick={() => handleOpenOperatorModal()}
                  className="px-4 py-2 bg-primary text-primary-foreground font-bold rounded-xl text-xs hover:bg-accent transition-all active:scale-95 flex items-center gap-1.5"
                >
                  <Plus size={14} />
                  <span>Adicionar Operador</span>
                </button>
              </div>

              {isLoadingData ? (
                <div className="text-center py-12 text-muted-foreground font-bold">
                  Carregando operadores...
                </div>
              ) : operators.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  Nenhum operador adicional registado.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 font-semibold text-xs">
                  {operators.map((op) => (
                    <div
                      key={`operator-card-${op.id}`}
                      className="p-4 bg-muted/20 border border-border rounded-2xl space-y-2.5 flex flex-col justify-between"
                    >
                      <div className="space-y-1">
                        <span className="block font-bold text-foreground text-sm font-sans">
                          {op.nome}
                        </span>
                        <span className="text-[10px] text-primary font-mono block">{op.email}</span>
                        {op.telefone && (
                          <p className="text-[10px] text-muted-foreground font-sans">
                            Tlf: {op.telefone}
                          </p>
                        )}
                        {op.document && (
                          <p className="text-[10px] text-muted-foreground font-sans">
                            BI/Doc: {op.document}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={() => handleOpenOperatorModal(op)}
                          className="flex-1 py-1.5 border border-border text-foreground hover:bg-muted font-bold rounded-xl text-[10px] transition-colors flex items-center justify-center gap-1"
                        >
                          <Save size={10} />
                          Editar
                        </button>
                        <button
                          onClick={() => handleDeleteOperator(op.id)}
                          className="flex-1 py-1.5 border border-danger/25 text-danger hover:bg-danger/5 font-bold rounded-xl text-[10px] transition-colors flex items-center justify-center gap-1"
                          disabled={op.email === currentUser?.email}
                          title={
                            op.email === currentUser?.email
                              ? 'Não pode remover a sua própria conta'
                              : ''
                          }
                        >
                          <Trash2 size={10} />
                          Remover
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: PROFILE & SETTINGS (PERFIL EMPRESA) */}
          {activeTab === 'perfil' && (
            <div className="bg-card border border-border rounded-3xl p-6 lg:p-8 shadow-sm space-y-6 animate-fade-in">
              <div className="border-b border-border pb-4">
                <h2 className="text-lg font-bold text-foreground">Perfil Corporativo</h2>
                <p className="text-xs text-muted-foreground mt-0.5 font-sans">
                  Apresente a sua empresa aos passageiros Nzila. Defina descrição e políticas.
                </p>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Left Column stats */}
                  <div className="md:col-span-1 p-5 bg-muted/20 border border-border rounded-2xl space-y-4">
                    {/* Logo Section */}
                    <div className="flex flex-col items-center border-b border-border pb-5 mb-4">
                      <div className="w-24 h-24 rounded-2xl bg-card border border-border flex items-center justify-center font-extrabold text-2xl text-primary overflow-hidden relative shadow-sm mb-3">
                        {company?.logo_url ? (
                          <img
                            src={company.logo_url}
                            alt="Logo"
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          company?.code || company?.nome?.substring(0, 3).toUpperCase() || 'TRP'
                        )}
                        {isSavingLogo && (
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white">
                            <Loader2 className="w-6 h-6 animate-spin text-white" />
                          </div>
                        )}
                      </div>
                      <label className="cursor-pointer px-4 py-2 bg-primary hover:bg-accent text-primary-foreground text-xs font-bold rounded-xl transition-all active:scale-95 flex items-center gap-1.5 shadow-sm">
                        <Upload size={14} />
                        <span>{isSavingLogo ? 'A carregar...' : 'Alterar Logótipo'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleUploadLogo}
                          disabled={isSavingLogo}
                          className="hidden"
                        />
                      </label>
                    </div>

                    <h3 className="text-sm font-bold text-foreground font-sans">
                      Indicadores de Reputação
                    </h3>
                    <div className="space-y-3 font-semibold text-xs">
                      <div>
                        <span className="block text-muted-foreground text-[10px] uppercase font-black mb-1">
                          Avaliação Geral
                        </span>
                        <div className="flex items-center gap-1">
                          <Star size={16} className="text-yellow-500 fill-yellow-500" />
                          <span className="text-sm font-black text-foreground">
                            {company?.rating || 4.5}
                          </span>
                          <span className="text-muted-foreground">
                            ({company?.reviews || 24} avaliações)
                          </span>
                        </div>
                      </div>
                      <div>
                        <span className="block text-muted-foreground text-[10px] uppercase font-black mb-1">
                          Ano Fundação
                        </span>
                        <span className="text-sm font-bold text-foreground">
                          {company?.ano_fundacao || '2008'}
                        </span>
                      </div>
                      <div>
                        <span className="block text-muted-foreground text-[10px] uppercase font-black mb-1">
                          Município / Sede
                        </span>
                        <span className="text-sm font-bold text-foreground">
                          {company?.municipio}, {company?.provincia}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right editable profile settings */}
                  <div className="md:col-span-2 space-y-4 text-xs font-semibold">
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                        Descrição da Transportadora
                      </label>
                      <textarea
                        required
                        value={profileDesc}
                        onChange={(e) => setProfileDesc(e.target.value)}
                        placeholder="Ex: Empresa nacional de transporte rodoviário fundada em 2008, oferecendo serviços interprovinciais..."
                        className="w-full px-4 py-2.5 border border-input rounded-xl bg-background text-foreground h-28 focus:outline-none focus:border-primary text-xs leading-relaxed font-sans"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                        Política de Cancelamento (Visível na reserva do bilhete)
                      </label>
                      <textarea
                        required
                        value={profileCancel}
                        onChange={(e) => setProfileCancel(e.target.value)}
                        placeholder="Ex: Cancelamentos efetuados com até 24 horas de antecedência terão direito a reembolso integral..."
                        className="w-full px-4 py-2.5 border border-input rounded-xl bg-background text-foreground h-28 focus:outline-none focus:border-primary text-xs leading-relaxed font-sans"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-border">
                  <button
                    type="submit"
                    disabled={isSavingProfile}
                    className="px-6 py-2.5 bg-primary text-primary-foreground hover:bg-accent font-bold rounded-xl text-xs transition-all flex items-center gap-1.5 disabled:opacity-60"
                  >
                    {isSavingProfile ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        <span>A Gravar...</span>
                      </>
                    ) : (
                      <>
                        <Save size={14} />
                        <span>Gravar Perfil</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
