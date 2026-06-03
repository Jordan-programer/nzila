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
  capacidade: number;
  empresa: number;
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
  data_saida?: string; // YYYY-MM-DD
  preco_ida_volta?: number;
}

export default function OperatorDashboardPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [company, setCompany] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'frota' | 'rotas' | 'viagens' | 'perfil'>('frota');

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
  const [busCapacity, setBusCapacity] = useState('44');

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

  // Profile Edit fields
  const [profileDesc, setProfileDesc] = useState('');
  const [profileCancel, setProfileCancel] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

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
      const res = await fetch(`http://localhost:8000/api/carrier/info/?company_id=${companyId}`);
      if (!res.ok) throw new Error('API Error');
      const data = await res.json();
      setCompany(data);
      setProfileDesc(data.descricao || '');
      setProfileCancel(data.politica_cancelamento || '');
    } catch (err) {
      console.warn('Fallback to local storage for company profile');
      // Retrieve from nzila_carriers cache
      const cachedCarriers = localStorage.getItem('nzila_carriers');
      const list = cachedCarriers ? JSON.parse(cachedCarriers) : [];
      const found = list.find((c: any) => c.id === companyId) || {
        id: companyId,
        nome:
          currentUser?.company_code === 'MACON' ? 'Macon Transportes' : 'Transportadora Parceira',
        code: currentUser?.company_code || 'MACON',
        email: currentUser?.email || 'operador@transbook.ao',
        telefone: '+244 923 101 010',
        status: currentUser?.company_status || 'APROVADA',
        color: 'bg-emerald-600',
        rating: 4.6,
        reviews: 24,
        descricao: 'Empresa líder em transporte terrestre interprovincial.',
        politica_cancelamento:
          'Cancelamentos permitidos até 24h antes da partida com reembolso de 90%.',
      };
      setCompany(found);
      setProfileDesc(found.descricao || '');
      setProfileCancel(found.politica_cancelamento || '');
    }

    // 2. Fetch Locations (for route creation)
    try {
      const res = await fetch('http://localhost:8000/api/locations/');
      if (!res.ok) throw new Error('API Error');
      const data = await res.json();
      setLocations(data);
    } catch (err) {
      const cachedLocs = localStorage.getItem('nzila_locations');
      if (cachedLocs) setLocations(JSON.parse(cachedLocs));
    }

    // 3. Fetch Buses
    try {
      const res = await fetch(`http://localhost:8000/api/carrier/buses/?company_id=${companyId}`);
      if (!res.ok) throw new Error('API Error');
      const data = await res.json();
      setBuses(data);
      localStorage.setItem(`nzila_operator_buses_${companyId}`, JSON.stringify(data));
    } catch (err) {
      const cachedBuses = localStorage.getItem(`nzila_operator_buses_${companyId}`);
      if (cachedBuses) {
        setBuses(JSON.parse(cachedBuses));
      } else {
        const defaultBuses = [
          { id: 10, modelo: 'Marcopolo Paradiso 1200', capacidade: 44, empresa: companyId },
          { id: 11, modelo: 'Marcopolo G8 VIP', capacidade: 12, empresa: companyId },
        ];
        setBuses(defaultBuses);
        localStorage.setItem(`nzila_operator_buses_${companyId}`, JSON.stringify(defaultBuses));
      }
    }

    // 4. Fetch Routes
    try {
      const res = await fetch(`http://localhost:8000/api/carrier/routes/`);
      if (!res.ok) throw new Error('API Error');
      const data = await res.json();
      setRoutes(data);
    } catch (err) {
      const defaultRoutes = [
        { id: 1, origem: 1, destino: 2, distancia_km: 600, duracao_estimada: '08:30' },
        { id: 2, origem: 2, destino: 1, distancia_km: 600, duracao_estimada: '08:30' },
        { id: 3, origem: 1, destino: 3, distancia_km: 500, duracao_estimada: '06:00' },
      ];
      setRoutes(defaultRoutes);
    }

    // 5. Fetch Trips
    try {
      const res = await fetch(`http://localhost:8000/api/carrier/trips/?company_id=${companyId}`);
      if (!res.ok) throw new Error('API Error');
      const data = await res.json();
      setTrips(data);
      localStorage.setItem(`nzila_operator_trips_${companyId}`, JSON.stringify(data));
    } catch (err) {
      const cachedTrips = localStorage.getItem(`nzila_operator_trips_${companyId}`);
      if (cachedTrips) {
        setTrips(JSON.parse(cachedTrips));
      } else {
        // Build mock trips
        const mockTrips: Trip[] = [
          {
            id: 1,
            carrier: currentUser?.company_code === 'MACON' ? 'Macon Transportes' : 'Parceiro',
            carrierCode: currentUser?.company_code || 'MACON',
            carrierColor: 'bg-blue-600',
            rating: 4.7,
            reviews: 142,
            origin: 'Luanda',
            destination: 'Huambo',
            departureTime: '06:00',
            arrivalTime: '14:30',
            durationLabel: '8h 30min',
            class: 'economica',
            classLabel: 'Económica',
            availableSeats: 40,
            totalSeats: 44,
            price: 4500,
            amenities: ['ar-condicionado', 'wifi'],
            status: 'ATIVA',
            bus_id: 10,
            route_id: 1,
            data_saida: '2026-06-15',
          },
          {
            id: 8,
            carrier: currentUser?.company_code === 'MACON' ? 'Macon Transportes' : 'Parceiro',
            carrierCode: currentUser?.company_code || 'MACON',
            carrierColor: 'bg-blue-600',
            rating: 4.7,
            reviews: 142,
            origin: 'Luanda',
            destination: 'Huambo',
            departureTime: '05:30',
            arrivalTime: '14:00',
            durationLabel: '8h 30min',
            class: 'executiva',
            classLabel: 'Executiva',
            availableSeats: 12,
            totalSeats: 12,
            price: 13000,
            amenities: ['ar-condicionado', 'wifi', 'snack', 'refeicao'],
            status: 'ATIVA',
            bus_id: 11,
            route_id: 1,
            data_saida: '2026-06-15',
          },
        ];
        setTrips(mockTrips);
        localStorage.setItem(`nzila_operator_trips_${companyId}`, JSON.stringify(mockTrips));
      }
    }

    setIsLoadingData(false);
  };

  // BUS CRUD
  const handleAddBus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!busModel.trim() || !busCapacity) {
      toast.error('Preencha todos os campos do autocarro.');
      return;
    }

    const companyId = currentUser?.company_id || 1;
    const payload = {
      modelo: busModel.trim(),
      capacidade: parseInt(busCapacity),
      company_id: companyId,
    };

    try {
      const res = await fetch('http://localhost:8000/api/carrier/buses/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to add');
      }
      toast.success('Autocarro adicionado com sucesso!');
      setIsBusModalOpen(false);
      setBusModel('');
      fetchCompanyAndOperationalData();
    } catch (err: any) {
      console.warn('Fallback to local storage for adding bus:', err);
      const nextId = buses.length > 0 ? Math.max(...buses.map((b) => b.id)) + 1 : 100;
      const newBus: Bus = {
        id: nextId,
        modelo: payload.modelo,
        capacidade: payload.capacidade,
        empresa: companyId,
      };
      const updated = [...buses, newBus];
      setBuses(updated);
      localStorage.setItem(`nzila_operator_buses_${companyId}`, JSON.stringify(updated));
      toast.success('Autocarro adicionado localmente (Offline)!');
      setIsBusModalOpen(false);
      setBusModel('');
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
      const res = await fetch(
        `http://localhost:8000/api/carrier/buses/${busId}/?company_id=${companyId}`,
        {
          method: 'DELETE',
        }
      );
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to delete');
      }
      toast.success('Autocarro removido com sucesso!');
      fetchCompanyAndOperationalData();
    } catch (err: any) {
      console.warn('Fallback to local storage for deleting bus:', err);
      const updated = buses.filter((b) => b.id !== busId);
      setBuses(updated);
      localStorage.setItem(`nzila_operator_buses_${companyId}`, JSON.stringify(updated));
      toast.success('Autocarro removido localmente (Offline)!');
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
    };

    try {
      const res = await fetch('http://localhost:8000/api/carrier/routes/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to add route');
      }
      toast.success('Rota adicionada com sucesso!');
      setIsRouteModalOpen(false);
      setRouteOrigin('');
      setRouteDestination('');
      setRouteDistance('');
      fetchCompanyAndOperationalData();
    } catch (err: any) {
      console.warn('Fallback to local storage for route creation:', err);
      const nextId = routes.length > 0 ? Math.max(...routes.map((r) => r.id)) + 1 : 100;
      const newRoute: Route = {
        id: nextId,
        origem: payload.origem_id,
        destino: payload.destino_id,
        distancia_km: payload.distancia_km,
        duracao_estimada: payload.duracao_estimada,
      };
      const updated = [...routes, newRoute];
      setRoutes(updated);
      toast.success('Rota adicionada localmente (Offline)!');
      setIsRouteModalOpen(false);
      setRouteOrigin('');
      setRouteDestination('');
      setRouteDistance('');
    }
  };

  const handleDeleteRoute = async (routeId: number) => {
    try {
      const res = await fetch(`http://localhost:8000/api/carrier/routes/${routeId}/`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('API Error');
      toast.success('Rota removida com sucesso!');
      fetchCompanyAndOperationalData();
    } catch (err) {
      console.warn('Fallback to local storage for deleting route:', err);
      setRoutes(routes.filter((r) => r.id !== routeId));
      toast.success('Rota removida localmente (Offline)!');
    }
  };

  // TRIP CRUD
  const handleAddTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tripRouteId || !tripDate || !tripDepTime || !tripArrTime || !tripPrice || !tripClass) {
      toast.error('Preencha os campos obrigatórios da viagem.');
      return;
    }

    // Business Rule Check: Block if no bus is selected
    if (!tripBusId) {
      toast.error('Não é permitido criar viagens sem associar um autocarro.');
      return;
    }

    const companyId = currentUser?.company_id || 1;
    const selectedBus = buses.find((b) => String(b.id) === String(tripBusId));
    const selectedRoute = routes.find((r) => String(r.id) === String(tripRouteId));

    if (!selectedBus || !selectedRoute) {
      toast.error('Autocarro ou Rota selecionados são inválidos.');
      return;
    }

    const payload = {
      company_id: companyId,
      route_id: parseInt(tripRouteId),
      bus_id: parseInt(tripBusId),
      data_saida: tripDate,
      hora_saida: tripDepTime,
      hora_chegada: tripArrTime,
      preco_ida: parseFloat(tripPrice),
      preco_ida_volta: tripPriceReturn ? parseFloat(tripPriceReturn) : null,
      classe: tripClass,
    };

    try {
      const res = await fetch('http://localhost:8000/api/carrier/trips/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to create trip');
      }
      toast.success('Viagem agendada com sucesso!');
      setIsTripModalOpen(false);
      resetTripForm();
      fetchCompanyAndOperationalData();
    } catch (err: any) {
      console.warn('Fallback to local storage for trip creation:', err);

      // Business Rule Check: Check if bus is already scheduled for another active trip at the same time
      const isBusBusy = trips.some(
        (t) =>
          String(t.bus_id) === String(tripBusId) &&
          t.data_saida === tripDate &&
          t.departureTime === tripDepTime &&
          t.status !== 'CANCELADA'
      );
      if (isBusBusy) {
        toast.error('Este autocarro já se encontra escalado para outra viagem nesta mesma hora.');
        return;
      }

      const nextId = trips.length > 0 ? Math.max(...trips.map((t) => t.id)) + 1 : 100;
      const originLoc = locations.find((l) => l.id === selectedRoute.origem)?.nome || 'Origem';
      const destLoc = locations.find((l) => l.id === selectedRoute.destino)?.nome || 'Destino';

      const newTrip: Trip = {
        id: nextId,
        carrier: company?.nome || 'Minha Transportadora',
        carrierCode: company?.code || 'PARCEIRO',
        carrierColor: company?.color || 'bg-emerald-600',
        rating: company?.rating || 4.5,
        reviews: company?.reviews || 10,
        origin: originLoc,
        destination: destLoc,
        departureTime: tripDepTime,
        arrivalTime: tripArrTime,
        durationLabel: selectedRoute.duracao_estimada,
        class: tripClass.toLowerCase(),
        classLabel:
          tripClass === 'ECONOMICA'
            ? 'Económica'
            : tripClass === 'CONFORTO'
              ? 'Conforto'
              : 'Executiva',
        availableSeats: selectedBus.capacidade,
        totalSeats: selectedBus.capacidade,
        price: parseFloat(tripPrice),
        amenities: tripAmenities,
        status: 'ATIVA',
        bus_id: selectedBus.id,
        route_id: selectedRoute.id,
        data_saida: tripDate,
        preco_ida_volta: tripPriceReturn ? parseFloat(tripPriceReturn) : undefined,
      };

      const updated = [newTrip, ...trips];
      setTrips(updated);
      localStorage.setItem(`nzila_operator_trips_${companyId}`, JSON.stringify(updated));
      toast.success('Viagem agendada localmente (Offline)!');
      setIsTripModalOpen(false);
      resetTripForm();
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
      const res = await fetch(`http://localhost:8000/api/carrier/trips/${tripId}/`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CANCELADA', company_id: companyId }),
      });
      if (!res.ok) throw new Error('API Error');
      toast.success('Viagem cancelada com sucesso. Notificações enviadas aos passageiros.');
      fetchCompanyAndOperationalData();
    } catch (err) {
      console.warn('Fallback to local storage for cancelling trip:', err);
      const updated = trips.map((t) => {
        if (t.id === tripId) {
          return { ...t, status: 'CANCELADA' };
        }
        return t;
      });
      setTrips(updated);
      localStorage.setItem(`nzila_operator_trips_${companyId}`, JSON.stringify(updated));
      toast.success('Viagem cancelada localmente (Offline).');
    }
  };

  const handleUpdateTripPrice = async (tripId: number, newPrice: number) => {
    const companyId = currentUser?.company_id || 1;
    try {
      const res = await fetch(`http://localhost:8000/api/carrier/trips/${tripId}/`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preco_ida: newPrice, company_id: companyId }),
      });
      if (!res.ok) throw new Error('API Error');
      toast.success('Preço da viagem atualizado com sucesso!');
      fetchCompanyAndOperationalData();
    } catch (err) {
      console.warn('Fallback to local storage for trip price update:', err);
      const updated = trips.map((t) => {
        if (t.id === tripId) {
          return { ...t, price: newPrice };
        }
        return t;
      });
      setTrips(updated);
      localStorage.setItem(`nzila_operator_trips_${companyId}`, JSON.stringify(updated));
      toast.success('Preço atualizado localmente (Offline).');
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
      const res = await fetch(`http://localhost:8000/api/carrier/info/`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('API Error');
      toast.success('Perfil atualizado com sucesso!');
      fetchCompanyAndOperationalData();
    } catch (err) {
      console.warn('Fallback to local storage for profile save:', err);

      // Save locally
      const cachedCarriers = localStorage.getItem('nzila_carriers');
      if (cachedCarriers) {
        const list = JSON.parse(cachedCarriers);
        const index = list.findIndex((c: any) => c.id === companyId);
        if (index !== -1) {
          list[index].descricao = payload.descricao;
          list[index].politica_cancelamento = payload.politica_cancelamento;
          localStorage.setItem('nzila_carriers', JSON.stringify(list));
        }
      }
      if (company) {
        setCompany({
          ...company,
          descricao: payload.descricao,
          politica_cancelamento: payload.politica_cancelamento,
        });
      }
      toast.success('Perfil guardado localmente (Offline)!');
    } finally {
      setIsSavingProfile(false);
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
          <div className="w-full max-w-md bg-card border border-border rounded-3xl p-6 shadow-2xl animate-bounce-in font-sans">
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
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                  Modelo do Veículo
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
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                  Capacidade de Lugares (Poltronas)
                </label>
                <select
                  value={busCapacity}
                  onChange={(e) => setBusCapacity(e.target.value)}
                  className="w-full px-4 py-2.5 border border-input rounded-xl bg-background text-foreground focus:outline-none focus:border-primary cursor-pointer font-semibold"
                >
                  <option value="12">12 Lugares (Vip Lounge)</option>
                  <option value="28">28 Lugares (Executivo)</option>
                  <option value="44">44 Lugares (Económico)</option>
                  <option value="54">54 Lugares (Alta Lotação)</option>
                </select>
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
                  Criar Frota
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
                    type="text"
                    required
                    placeholder="Ex: 08:30"
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
          <div className="w-full max-w-lg bg-card border border-border rounded-3xl p-6 shadow-2xl animate-bounce-in font-sans">
            <div className="flex justify-between items-center border-b border-border pb-3 mb-4">
              <h3 className="text-base font-bold text-foreground">Agendar Nova Viagem (Partida)</h3>
              <button
                onClick={() => setIsTripModalOpen(false)}
                className="p-1 text-muted-foreground hover:bg-muted rounded-lg transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleAddTrip} className="space-y-4 text-xs font-bold">
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

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] text-muted-foreground mb-1.5">
                    Data de Partida *
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
                  onClick={() => setIsTripModalOpen(false)}
                  className="flex-1 py-2.5 border border-border text-foreground hover:bg-muted font-bold rounded-xl transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-primary text-primary-foreground hover:bg-accent font-bold rounded-xl transition-all"
                >
                  Agendar Viagem
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
                { id: 'frota', label: 'Frota', icon: Users },
                { id: 'rotas', label: 'Rotas', icon: MapPin },
                { id: 'viagens', label: 'Viagens / Escalas', icon: Calendar },
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
                          </span>
                          <span className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1">
                            <Users size={12} className="text-primary" /> {bus.capacidade} Lugares
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
                                {trip.data_saida || '2026-06-15'}
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

          {/* TAB 4: PROFILE & SETTINGS (PERFIL EMPRESA) */}
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
