import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  Image,
  Dimensions,
  Platform,
  Linking,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { API_URL } from './src/config/api';
import {
  Search,
  Ticket,
  User,
  LogOut,
  Camera,
  MapPin,
  Calendar,
  Layers,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  QrCode,
  Check,
  UserCheck,
  Shield,
  ArrowLeft,
  ChevronRight,
  TrendingUp,
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

// -----------------------------------------------------------------
// Interfaces & Types
// -----------------------------------------------------------------
interface UserSession {
  email: string;
  name: string;
  phone: string;
  document: string;
  avatar: string;
  role: string;
  isAdmin: boolean;
  company_id?: number;
  company_code?: string;
  company_status?: string;
  token?: string;
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
}

interface TicketData {
  id: string | number;
  codigo_reserva: string;
  passenger_name: string;
  passenger_email: string;
  passenger_phone: string;
  passenger_document: string;
  seat: string;
  price: number;
  paymentMethod: string;
  origin: string;
  destination: string;
  date: string;
  departureTime: string;
  arrivalTime: string;
  classLabel: string;
  carrier: string;
  carrierCode: string;
  status: 'CONFIRMADO' | 'PENDENTE' | 'CANCELADO' | 'EMBARCADO';
  qrToken: string;
}

export default function App() {
  // Navigation & Session State
  const [currentScreen, setCurrentScreen] = useState<'LOGIN' | 'COMPLETE_PROFILE' | 'PASSENGER_HUB' | 'FISCAL_HUB'>('LOGIN');
  const [passengerTab, setPassengerTab] = useState<'SEARCH' | 'TICKETS' | 'PROFILE'>('SEARCH');
  const [fiscalTab, setFiscalTab] = useState<'STATS' | 'SCANNER' | 'BOARDING_LIST'>('STATS');
  
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Search Inputs
  const [origin, setOrigin] = useState('Luanda');
  const [destination, setDestination] = useState('Huambo');
  const [trips, setTrips] = useState<Trip[]>([]);
  const [searched, setSearched] = useState(false);

  // Booking details
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [selectedSeat, setSelectedSeat] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'Multicaixa Express' | 'PayPay' | 'Unitel Money'>('Multicaixa Express');
  
  // Passengers checkout input details
  const [passName, setPassName] = useState('');
  const [passEmail, setPassEmail] = useState('');
  const [passPhone, setPassPhone] = useState('');
  const [passDoc, setPassDoc] = useState('');

  // Tickets List
  const [myTickets, setMyTickets] = useState<TicketData[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<TicketData | null>(null);

  // Fiscal Scanning
  const [scanCode, setScanCode] = useState('');
  const [scanningResult, setScanningResult] = useState<{ status: 'VALID' | 'INVALID' | 'ALREADY_USED' | 'WRONG_CARRIER'; ticket?: any; error?: string } | null>(null);

  // Load reservations list from backend
  const loadMyTickets = async (sessionToken: string) => {
    try {
      const response = await fetch(`${API_URL}/reservations/`, {
        method: 'GET',
        headers: {
          'Authorization': `Token ${sessionToken}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setMyTickets(data);
      }
    } catch (err) {
      console.warn('Erro ao carregar bilhetes do backend:', err);
    }
  };

  // -----------------------------------------------------------------
  // Authenticaton & Sync Logic
  // -----------------------------------------------------------------
  const handleLogin = async (email: string, passwordOpt = 'Luanda@2026') => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: passwordOpt }),
      });

      if (response.ok) {
        const data = await response.json();
        const role = data.user.role.toUpperCase();
        
        const session: UserSession = {
          email: data.user.email,
          name: data.user.name,
          phone: data.user.phone || '',
          document: data.user.document || '',
          avatar: data.user.role === 'ADMIN' 
            ? 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80'
            : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
          role: role,
          isAdmin: role === 'ADMIN',
          company_id: data.user.company_id,
          company_code: data.user.company_code,
          company_status: data.user.company_status,
          token: data.token,
        };

        setCurrentUser(session);
        
        if (session.token) {
          loadMyTickets(session.token);
        }
        
        if (!session.phone) {
          setCurrentScreen('COMPLETE_PROFILE');
        } else if (role === 'FISCAL') {
          setCurrentScreen('FISCAL_HUB');
          setFiscalTab('STATS');
          loadFiscalBoardingList();
        } else {
          setCurrentScreen('PASSENGER_HUB');
          setPassengerTab('SEARCH');
        }
        
        toastMsg(`Sessão iniciada como: ${session.name}`);
      } else {
        const errorData = await response.json();
        Alert.alert('Erro de Autenticação', errorData.error || 'Credenciais inválidas.');
      }
    } catch (err) {
      Alert.alert('Erro de Conexão', 'Não foi possível conectar ao servidor backend.');
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthLoginMock = (provider: 'Google' | 'Facebook') => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      const socialUser: UserSession = {
        email: `${provider.toLowerCase()}.user@gmail.com`,
        name: `User ${provider}`,
        phone: '', // Trigger complete profile
        document: '',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
        role: 'CLIENTE',
        isAdmin: false,
      };
      setCurrentUser(socialUser);
      setCurrentScreen('COMPLETE_PROFILE');
    }, 1500);
  };

  const handleCompleteProfileSubmit = async (fullName: string, phone: string, document: string) => {
    if (!currentUser) return;
    if (!fullName || !phone) {
      Alert.alert('Erro', 'Por favor, preencha o seu nome e telefone.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/social-login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: currentUser.email,
          name: fullName,
          phone,
          document,
          avatar: currentUser.avatar,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const session: UserSession = {
          email: data.user.email,
          name: data.user.name,
          phone: data.user.phone || phone,
          document: data.user.document || document,
          avatar: currentUser.avatar,
          role: data.user.role.toUpperCase(),
          isAdmin: data.user.role === 'ADMIN',
          token: data.token,
        };
        setCurrentUser(session);
        if (session.token) {
          loadMyTickets(session.token);
        }
        setCurrentScreen('PASSENGER_HUB');
        toastMsg('Perfil sincronizado e concluído!');
      } else {
        throw new Error('Falha no registo');
      }
    } catch (err) {
      Alert.alert('Erro', 'Não foi possível salvar o perfil no servidor.');
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------------------------------------------
  // Trips Search & Reservations Flow
  // -----------------------------------------------------------------
  const handleSearchTrips = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/trips/?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}`);
      if (response.ok) {
        const data = await response.json();
        setTrips(data);
        setSearched(true);
      } else {
        Alert.alert('Pesquisa', 'Falha ao buscar viagens.');
      }
    } catch (err) {
      Alert.alert('Erro de Conexão', 'Não foi possível conectar ao servidor backend.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenBookingModal = (trip: Trip) => {
    setSelectedTrip(trip);
    setSelectedSeat('');
    setPaymentMethod('Multicaixa Express');
    
    // Pre-fill passenger details with logged-in user
    setPassName(currentUser?.name || '');
    setPassEmail(currentUser?.email || '');
    setPassPhone(currentUser?.phone || '');
    setPassDoc(currentUser?.document || '');
  };

  const handleConfirmReservation = async () => {
    if (!selectedTrip || !selectedSeat) {
      Alert.alert('Escolha de Poltrona', 'Por favor, selecione uma poltrona.');
      return;
    }
    if (!passName || !passEmail || !passPhone) {
      Alert.alert('Informação em falta', 'Por favor, preencha os dados do passageiro.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/reservations/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': currentUser?.token ? `Token ${currentUser.token}` : '',
        },
        body: JSON.stringify({
          tripId: selectedTrip.id,
          seat: selectedSeat,
          paymentMethod,
          passengerName: passName,
          passengerEmail: passEmail,
          passengerPhone: passPhone,
          passengerDocument: passDoc,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toastMsg(`Reserva efetuada com sucesso! Código: ${data.codigo_reserva}`);
        
        // Refresh local reservations listing
        if (currentUser?.token) {
          loadMyTickets(currentUser.token);
        }
        
        setSelectedTrip(null);
      } else {
        const errData = await response.json();
        Alert.alert('Falha na Reserva', errData.error || 'Ocorreu um erro ao emitir o bilhete.');
      }
    } catch (err) {
      Alert.alert('Erro', 'Erro de comunicação com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelTicket = async (ticketCode: string) => {
    Alert.alert(
      'Cancelar Viagem',
      'Tem a certeza que deseja cancelar esta reserva e libertar o lugar?',
      [
        { text: 'Não', style: 'cancel' },
        {
          text: 'Sim, Cancelar',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              const response = await fetch(`${API_URL}/reservations/${ticketCode}/cancel/`, {
                method: 'POST',
                headers: {
                  'Authorization': currentUser?.token ? `Token ${currentUser.token}` : '',
                },
              });

              if (response.ok) {
                toastMsg('Reserva cancelada com sucesso.');
                if (currentUser?.token) {
                  loadMyTickets(currentUser.token);
                }
                setSelectedTicket(null);
              } else {
                const errData = await response.json();
                Alert.alert('Cancelamento', errData.error || 'Não foi possível cancelar o bilhete.');
              }
            } catch (err) {
              Alert.alert('Erro', 'Erro ao processar cancelamento.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  // -----------------------------------------------------------------
  // Ticket Validation Logic (Fiscais)
  // -----------------------------------------------------------------
  const loadFiscalBoardingList = async () => {
    try {
      const res = await fetch(`${API_URL}/admin/reservations/`);
      if (res.ok) {
        const data = await res.json();
        
        // Filter reservations belonging to the inspector's company
        if (currentUser && currentUser.role === 'FISCAL') {
          const fiscalCompany = currentUser.company_code || 'TRANSLUX';
          const companyReservations = data.filter((r: any) => r.carrierCode === fiscalCompany);
          setMyTickets(companyReservations);
        } else {
          setMyTickets(data);
        }
      }
    } catch (err) {
      console.warn('Erro ao carregar manifesto de passageiros:', err);
    }
  };

  const handleValidateTicket = async (code: string) => {
    if (!code) {
      Alert.alert('Erro', 'Introduza o código do bilhete ou leia um QR code.');
      return;
    }

    setLoading(true);
    setScanningResult(null);

    try {
      const res = await fetch(`${API_URL}/validation/scan/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': currentUser?.token ? `Token ${currentUser.token}` : '',
        },
        body: JSON.stringify({ code: code.trim() }),
      });

      if (res.ok) {
        const data = await res.json();
        
        // Verify carrier compatibility (A fiscal can only validate tickets from their own carrier)
        if (currentUser && currentUser.role === 'FISCAL') {
          const fiscalCompany = currentUser.company_code || 'TRANSLUX';
          if (data.ticket && data.ticket.carrierCode !== fiscalCompany) {
            setScanningResult({ status: 'WRONG_CARRIER', ticket: data.ticket });
            setLoading(false);
            return;
          }
        }

        setScanningResult({
          status: data.status === 'VALID' ? 'VALID' : data.status === 'ALREADY_USED' ? 'ALREADY_USED' : 'INVALID',
          ticket: data.ticket,
          error: data.error,
        });
      } else {
        throw new Error('Erro na rede do servidor.');
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível validar o bilhete no servidor.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmBoarding = async (code: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/validation/confirm/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': currentUser?.token ? `Token ${currentUser.token}` : '',
        },
        body: JSON.stringify({ code, operator: currentUser?.name || 'Fiscal' }),
      });

      if (res.ok) {
        toastMsg('Embarque confirmado com sucesso!');
        setScanningResult(null);
        setScanCode('');
        loadFiscalBoardingList();
      } else {
        const data = await res.json();
        Alert.alert('Falha na Confirmação', data.error || 'Não foi possível confirmar o embarque.');
      }
    } catch (error) {
      Alert.alert('Erro', 'Falha ao processar confirmação de embarque.');
    } finally {
      setLoading(false);
    }
  };

  const toastMsg = (msg: string) => {
    Alert.alert('Nzila', msg, [{ text: 'OK' }]);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentScreen('LOGIN');
    setSearched(false);
    setTrips([]);
    setMyTickets([]);
  };

  // Helper to generate seat layout (A, B, corridor, C, D)
  const renderSeatSelectorGrid = (totalSeatsCount: number) => {
    const seats = [];
    const rows = Math.ceil(totalSeatsCount / 4);
    
    for (let r = 1; r <= rows; r++) {
      const rowNum = r.toString().padStart(2, '0');
      const rowSeats = [`${rowNum}A`, `${rowNum}B`, `${rowNum}C`, `${rowNum}D`];
      
      seats.push(
        <View key={r} style={styles.seatSelectorRow}>
          <TouchableOpacity
            onPress={() => setSelectedSeat(rowSeats[0])}
            style={[styles.seatBoxBtn, selectedSeat === rowSeats[0] && styles.seatBoxSelected]}
          >
            <Text style={[styles.seatBoxText, selectedSeat === rowSeats[0] && styles.seatBoxTextSelected]}>{rowSeats[0]}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setSelectedSeat(rowSeats[1])}
            style={[styles.seatBoxBtn, selectedSeat === rowSeats[1] && styles.seatBoxSelected, { marginRight: 24 }]}
          >
            <Text style={[styles.seatBoxText, selectedSeat === rowSeats[1] && styles.seatBoxTextSelected]}>{rowSeats[1]}</Text>
          </TouchableOpacity>
          
          {/* Corridor */}
          <View style={styles.corridorSpace} />
          
          <TouchableOpacity
            onPress={() => setSelectedSeat(rowSeats[2])}
            style={[styles.seatBoxBtn, selectedSeat === rowSeats[2] && styles.seatBoxSelected, { marginLeft: 24 }]}
          >
            <Text style={[styles.seatBoxText, selectedSeat === rowSeats[2] && styles.seatBoxTextSelected]}>{rowSeats[2]}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setSelectedSeat(rowSeats[3])}
            style={[styles.seatBoxBtn, selectedSeat === rowSeats[3] && styles.seatBoxSelected]}
          >
            <Text style={[styles.seatBoxText, selectedSeat === rowSeats[3] && styles.seatBoxTextSelected]}>{rowSeats[3]}</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return seats;
  };

  // -----------------------------------------------------------------
  // rendering Screens
  // -----------------------------------------------------------------

  // 🚪 SCREEN: LOGIN
  const renderLoginScreen = () => {
    const demoAccounts = [
      { email: 'fatima.manuel@transbook.ao', label: 'Fátima Manuel', desc: 'Cliente / Passageiro', icon: '👤' },
      { email: 'fiscal@transbook.ao', label: 'João Fiscal', desc: 'Fiscal de Embarque (TRANSLUX)', icon: '🛡️' },
      { email: 'admin@transbook.ao', label: 'Carlos Admin', desc: 'Administrador', icon: '🔑' },
    ];

    return (
      <LinearGradient colors={['#0f172a', '#1e293b']} style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.headerLogoContainer}>
            <View style={styles.logoBadge}>
              <Text style={styles.logoBadgeText}>N</Text>
            </View>
            <Text style={styles.logoTitle}>NZILA</Text>
            <Text style={styles.logoSubtitle}>Terminal de Viagens Digital</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Iniciar Sessão</Text>
            <Text style={styles.cardSubtitle}>Escolha como pretende aceder ao portal</Text>

            {/* Social Logins */}
            <View style={styles.socialButtonsContainer}>
              <TouchableOpacity
                onPress={() => handleOAuthLoginMock('Google')}
                style={[styles.socialButton, { marginRight: 8 }]}
              >
                <Image
                  source={{ uri: 'https://cdn-icons-png.flaticon.com/512/2991/2991148.png' }}
                  style={styles.socialIcon}
                />
                <Text style={styles.socialBtnText}>Google</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleOAuthLoginMock('Facebook')}
                style={[styles.socialButton, { marginLeft: 8 }]}
              >
                <Image
                  source={{ uri: 'https://cdn-icons-png.flaticon.com/512/124/124010.png' }}
                  style={styles.socialIcon}
                />
                <Text style={styles.socialBtnText}>Facebook</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>ou contas demo</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Demo Quick login buttons */}
            <View style={styles.demoAccountsList}>
              {demoAccounts.map((acc, i) => (
                <TouchableOpacity
                  key={i}
                  onPress={() => handleLogin(acc.email)}
                  style={styles.demoAccountCard}
                >
                  <View style={styles.demoRow}>
                    <Text style={styles.demoAvatar}>{acc.icon}</Text>
                    <View style={styles.demoTextCol}>
                      <Text style={styles.demoName}>{acc.label}</Text>
                      <Text style={styles.demoRole}>{acc.desc}</Text>
                    </View>
                  </View>
                  <ChevronRight size={16} color="#64748b" />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
    );
  };

  // 📝 SCREEN: COMPLETE PROFILE
  const renderCompleteProfileScreen = () => {
    let nameVal = currentUser?.name || '';
    let phoneVal = '';
    let docVal = '';

    return (
      <LinearGradient colors={['#0f172a', '#1e293b']} style={styles.container}>
        <SafeAreaView style={{ flex: 1 }}>
          <View style={styles.completeProfileContainer}>
            <View style={styles.card}>
              <View style={styles.completeProfileHeader}>
                <View style={styles.completeIconBg}>
                  <User size={24} color="#3b82f6" />
                </View>
                <Text style={styles.cardTitle}>Conclua o seu Perfil</Text>
                <Text style={styles.cardSubtitle}>
                  Falta apenas o seu contacto telefónico para poder emitir e receber bilhetes.
                </Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Nome Completo</Text>
                <TextInput
                  defaultValue={nameVal}
                  onChangeText={(val) => { nameVal = val; }}
                  placeholder="Fátima Manuel"
                  placeholderTextColor="#64748b"
                  style={styles.input}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Número de Telefone</Text>
                <TextInput
                  placeholder="+244 923 456 789"
                  placeholderTextColor="#64748b"
                  keyboardType="phone-pad"
                  onChangeText={(val) => { phoneVal = val; }}
                  style={styles.input}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>BI / Passaporte (Opcional)</Text>
                <TextInput
                  placeholder="005432168LA045"
                  placeholderTextColor="#64748b"
                  onChangeText={(val) => { docVal = val; }}
                  style={styles.input}
                />
              </View>

              <TouchableOpacity
                onPress={() => handleCompleteProfileSubmit(nameVal, phoneVal, docVal)}
                style={styles.primaryButton}
              >
                <Text style={styles.primaryButtonText}>Concluir e Entrar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  };

  // 🚌 SCREEN: PASSENGER HUB
  const renderPassengerHub = () => {
    return (
      <View style={styles.containerBg}>
        <SafeAreaView style={{ flex: 1 }}>
          {/* Header */}
          <View style={styles.appBar}>
            <View style={styles.appBarProfile}>
              <Image
                source={{ uri: currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80' }}
                style={styles.avatarMini}
              />
              <View>
                <Text style={styles.welcomeText}>Olá, bem-vindo</Text>
                <Text style={styles.userNameText}>{currentUser?.name}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={handleLogout} style={styles.logoutIconButton}>
              <LogOut size={20} color="#f43f5e" />
            </TouchableOpacity>
          </View>

          {/* Search Tab */}
          {passengerTab === 'SEARCH' && (
            <ScrollView style={styles.hubContent} contentContainerStyle={{ paddingBottom: 110 }} showsVerticalScrollIndicator={false}>
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Para onde deseja ir?</Text>
                <Text style={styles.cardSubtitle}>Encontre as melhores rotas e transportadoras</Text>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Origem</Text>
                  <View style={styles.inputIconRow}>
                    <MapPin size={18} color="#64748b" style={styles.inputIconPrefix} />
                    <TextInput
                      value={origin}
                      onChangeText={setOrigin}
                      placeholder="Cidade de partida"
                      placeholderTextColor="#64748b"
                      style={styles.inputWithIcon}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Destino</Text>
                  <View style={styles.inputIconRow}>
                    <MapPin size={18} color="#64748b" style={styles.inputIconPrefix} />
                    <TextInput
                      value={destination}
                      onChangeText={setDestination}
                      placeholder="Cidade de chegada"
                      placeholderTextColor="#64748b"
                      style={styles.inputWithIcon}
                    />
                  </View>
                </View>

                <TouchableOpacity onPress={handleSearchTrips} style={styles.primaryButton}>
                  <Search size={18} color="#fff" />
                  <Text style={[styles.primaryButtonText, { marginLeft: 8 }]}>Pesquisar Viagens</Text>
                </TouchableOpacity>
              </View>

              {/* Search Results */}
              {searched && (
                <View style={styles.resultsContainer}>
                  <Text style={styles.sectionTitle}>Viagens Disponíveis ({trips.length})</Text>
                  {trips.length === 0 ? (
                    <Text style={styles.emptyResultsText}>Nenhuma viagem encontrada para esta rota.</Text>
                  ) : (
                    trips.map((t, idx) => (
                      <View key={idx} style={styles.tripCard}>
                        <View style={styles.tripCardHeader}>
                          <View style={styles.carrierBadge}>
                            <View style={[styles.carrierColorDot, { backgroundColor: t.carrierColor || '#2563eb' }]} />
                            <Text style={styles.carrierNameText}>{t.carrier}</Text>
                          </View>
                          <Text style={styles.tripPriceText}>{t.price.toLocaleString('pt-AO')} Kz</Text>
                        </View>

                        <View style={styles.tripDetailsRow}>
                          <View>
                            <Text style={styles.tripTimeText}>{t.departureTime}</Text>
                            <Text style={styles.tripLocText}>{t.origin}</Text>
                          </View>
                          <View style={styles.tripConnector}>
                            <Text style={styles.tripDurationText}>{t.durationLabel}</Text>
                            <View style={styles.tripConnectorLine} />
                            <ArrowRight size={14} color="#64748b" />
                          </View>
                          <View style={{ alignItems: 'flex-end' }}>
                            <Text style={styles.tripTimeText}>{t.arrivalTime}</Text>
                            <Text style={styles.tripLocText}>{t.destination}</Text>
                          </View>
                        </View>

                        <View style={styles.tripFooterRow}>
                          <View style={styles.tripClassBadge}>
                            <Layers size={12} color="#64748b" />
                            <Text style={styles.tripClassLabel}>{t.classLabel}</Text>
                          </View>
                          <Text style={styles.tripSeatsText}>{t.availableSeats} poltronas livres</Text>
                        </View>

                        <TouchableOpacity
                          onPress={() => handleOpenBookingModal(t)}
                          style={styles.bookButton}
                        >
                          <Text style={styles.bookButtonText}>Reservar Lugar</Text>
                        </TouchableOpacity>
                      </View>
                    ))
                  )}
                </View>
              )}

              {/* RESERVATION CHECKOUT MODAL SHEET */}
              {selectedTrip && (
                <View style={styles.ticketModalOverlay}>
                  <View style={[styles.ticketModalCard, { maxHeight: '90%' }]}>
                    <View style={styles.modalHeader}>
                      <Text style={styles.modalTitle}>Confirmar Rota e Poltrona</Text>
                      <TouchableOpacity onPress={() => setSelectedTrip(null)}>
                        <Text style={styles.closeBtnText}>Cancelar</Text>
                      </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false}>
                      {/* Trip Card Specs summary */}
                      <View style={styles.checkoutTripSummary}>
                        <Text style={styles.checkoutTripTitle}>{selectedTrip.carrier} - {selectedTrip.classLabel}</Text>
                        <Text style={styles.checkoutTripRoute}>{selectedTrip.origin} ➔ {selectedTrip.destination}</Text>
                        <Text style={styles.checkoutTripPrice}>Preço: {selectedTrip.price.toLocaleString('pt-AO')} Kz</Text>
                      </View>

                      {/* Step 1: Select Seat */}
                      <Text style={styles.sectionSubTitle}>1. Selecione a Poltrona desejada:</Text>
                      
                      {/* Bus Front Indicator */}
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#0f172a', borderTopLeftRadius: 16, borderTopRightRadius: 16, borderWidth: 1, borderColor: '#334155', borderBottomWidth: 0 }}>
                        <Text style={{ color: '#64748b', fontSize: 10, fontWeight: 'bold', letterSpacing: 1 }}>FRENTE DO AUTOCARRO / MOTORISTA</Text>
                        <UserCheck size={14} color="#64748b" />
                      </View>
                      <ScrollView style={[styles.seatSelectionScroll, { borderTopLeftRadius: 0, borderTopRightRadius: 0, borderTopWidth: 0 }]} nestedScrollEnabled={true}>
                        {renderSeatSelectorGrid(selectedTrip.totalSeats || 48)}
                      </ScrollView>
                      
                      {selectedSeat ? (
                        <Text style={styles.seatPickedText}>Poltrona Escolhida: <Text style={{fontWeight: 'bold', color: '#10b981'}}>{selectedSeat}</Text></Text>
                      ) : null}

                      {/* Step 2: Passenger Details */}
                      <Text style={[styles.sectionSubTitle, { marginTop: 16 }]}>2. Informações do Passageiro:</Text>
                      <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Nome do Passageiro</Text>
                        <TextInput
                          value={passName}
                          onChangeText={setPassName}
                          placeholder="Fátima Manuel"
                          placeholderTextColor="#64748b"
                          style={styles.input}
                        />
                      </View>
                      <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Email do Passageiro</Text>
                        <TextInput
                          value={passEmail}
                          onChangeText={setPassEmail}
                          placeholder="fatima.manuel@transbook.ao"
                          placeholderTextColor="#64748b"
                          style={styles.input}
                        />
                      </View>
                      <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Número de Telefone</Text>
                        <TextInput
                          value={passPhone}
                          onChangeText={setPassPhone}
                          placeholder="+244 923 456 789"
                          placeholderTextColor="#64748b"
                          style={styles.input}
                        />
                      </View>
                      <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Documento de Identidade (BI)</Text>
                        <TextInput
                          value={passDoc}
                          onChangeText={setPassDoc}
                          placeholder="005432168LA045"
                          placeholderTextColor="#64748b"
                          style={styles.input}
                        />
                      </View>

                      {/* Step 3: Select Payment Method */}
                      <Text style={styles.sectionSubTitle}>3. Método de Pagamento:</Text>
                      <View style={styles.paymentMethodsRow}>
                        {(['Multicaixa Express', 'PayPay', 'Unitel Money'] as const).map((method, idx) => (
                          <TouchableOpacity
                            key={idx}
                            onPress={() => setPaymentMethod(method)}
                            style={[styles.paymentMethodChip, paymentMethod === method && styles.paymentMethodChipActive]}
                          >
                            <Text style={[styles.paymentMethodText, paymentMethod === method && styles.paymentMethodTextActive]}>
                              {method}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>

                      {/* Submit */}
                      <TouchableOpacity
                        onPress={handleConfirmReservation}
                        style={[styles.primaryButton, { marginVertical: 20 }]}
                      >
                        <Text style={styles.primaryButtonText}>Emitir Bilhete de Embarque</Text>
                      </TouchableOpacity>
                    </ScrollView>
                  </View>
                </View>
              )}
            </ScrollView>
          )}

          {/* Tickets Tab */}
          {passengerTab === 'TICKETS' && (
            <ScrollView style={styles.hubContent} contentContainerStyle={{ paddingBottom: 110 }} showsVerticalScrollIndicator={false}>
              <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16}}>
                <Text style={styles.sectionTitle}>Os meus Bilhetes ({myTickets.length})</Text>
                <TouchableOpacity onPress={() => currentUser?.token && loadMyTickets(currentUser.token)}>
                  <Text style={{color: '#2563eb', fontSize: 13, fontWeight: 'bold'}}>Atualizar</Text>
                </TouchableOpacity>
              </View>
              
              {myTickets.length === 0 ? (
                <Text style={styles.emptyResultsText}>Não tem nenhum bilhete reservado.</Text>
              ) : (
                myTickets.map((t, idx) => (
                  <TouchableOpacity
                    key={idx}
                    onPress={() => setSelectedTicket(t)}
                    style={[
                      styles.ticketCard,
                      t.status === 'EMBARCADO' ? { borderLeftColor: '#10b981' } : t.status === 'CANCELADO' ? { borderLeftColor: '#f43f5e' } : { borderLeftColor: '#3b82f6' }
                    ]}
                  >
                    <View style={styles.ticketCardHeader}>
                      <Text style={styles.ticketCarrierText}>{t.carrier}</Text>
                      <View style={[
                        styles.statusBadge, 
                        t.status === 'EMBARCADO' ? styles.statusBoarded : t.status === 'CANCELADO' ? styles.statusCanceled : styles.statusConfirmed
                      ]}>
                        <Text style={
                          t.status === 'EMBARCADO' ? styles.statusBoardedText : t.status === 'CANCELADO' ? styles.statusCanceledText : styles.statusConfirmedText
                        }>
                          {t.status}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.ticketRouteRow}>
                      <Text style={styles.ticketLocText}>{t.origin}</Text>
                      <ArrowRight size={16} color="#64748b" style={{ marginHorizontal: 8 }} />
                      <Text style={styles.ticketLocText}>{t.destination}</Text>
                    </View>

                    <View style={styles.ticketMetaRow}>
                      <Text style={styles.ticketMetaText}>Data: {t.date}</Text>
                      <Text style={styles.ticketMetaText}>Partida: {t.departureTime}</Text>
                      <Text style={styles.ticketMetaText}>Poltrona: {t.seat}</Text>
                    </View>
                  </TouchableOpacity>
                ))
              )}

              {/* Selected Ticket Modal Simulation */}
              {selectedTicket && (
                <View style={styles.ticketModalOverlay}>
                  <View style={styles.ticketModalCard}>
                    <View style={styles.modalHeader}>
                      <Text style={styles.modalTitle}>Bilhete de Embarque</Text>
                      <TouchableOpacity onPress={() => setSelectedTicket(null)}>
                        <Text style={styles.closeBtnText}>Fechar</Text>
                      </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false}>
                      <View style={styles.qrCodeContainer}>
                        <QrCode size={180} color="#0f172a" />
                        <Text style={styles.qrCodeTokenText}>{selectedTicket.codigo_reserva}</Text>
                      </View>

                      <View style={styles.modalSpecsGrid}>
                        <View style={styles.modalSpecItem}>
                          <Text style={styles.specLabel}>Passageiro</Text>
                          <Text style={styles.specValue}>{selectedTicket.passenger_name}</Text>
                        </View>
                        <View style={styles.modalSpecItem}>
                          <Text style={styles.specLabel}>Documento (BI)</Text>
                          <Text style={styles.specValue}>{selectedTicket.passenger_document}</Text>
                        </View>
                        <View style={styles.modalSpecItem}>
                          <Text style={styles.specLabel}>Transportadora</Text>
                          <Text style={styles.specValue}>{selectedTicket.carrier}</Text>
                        </View>
                        <View style={styles.modalSpecItem}>
                          <Text style={styles.specLabel}>Poltrona</Text>
                          <Text style={styles.specValue}>{selectedTicket.seat}</Text>
                        </View>
                        <View style={styles.modalSpecItem}>
                          <Text style={styles.specLabel}>Partida</Text>
                          <Text style={styles.specValue}>{selectedTicket.origin} ({selectedTicket.departureTime})</Text>
                        </View>
                        <View style={styles.modalSpecItem}>
                          <Text style={styles.specLabel}>Chegada</Text>
                          <Text style={styles.specValue}>{selectedTicket.destination} ({selectedTicket.arrivalTime})</Text>
                        </View>
                        <View style={styles.modalSpecItem}>
                          <Text style={styles.specLabel}>Estado</Text>
                          <Text style={[
                            styles.specValue, 
                            { color: selectedTicket.status === 'EMBARCADO' ? '#10b981' : selectedTicket.status === 'CANCELADO' ? '#f43f5e' : '#3b82f6' }
                          ]}>
                            {selectedTicket.status}
                          </Text>
                        </View>
                      </View>

                      {/* Cancel Booking Action */}
                      {selectedTicket.status === 'CONFIRMADO' && (
                        <TouchableOpacity
                          onPress={() => handleCancelTicket(selectedTicket.codigo_reserva)}
                          style={[styles.primaryButton, { backgroundColor: '#e11d48', marginTop: 12, marginBottom: 20 }]}
                        >
                          <Text style={styles.primaryButtonText}>Cancelar Bilhete</Text>
                        </TouchableOpacity>
                      )}
                    </ScrollView>
                  </View>
                </View>
              )}
            </ScrollView>
          )}

          {/* Profile Tab */}
          {passengerTab === 'PROFILE' && (
            <ScrollView style={styles.hubContent} contentContainerStyle={{ paddingBottom: 110 }} showsVerticalScrollIndicator={false}>
              <View style={styles.profileBox}>
                <Image
                  source={{ uri: currentUser?.avatar }}
                  style={styles.avatarLarge}
                />
                <Text style={styles.profileName}>{currentUser?.name}</Text>
                <Text style={styles.profileRoleText}>Passageiro Registado</Text>

                <View style={styles.profileDetailsCard}>
                  <View style={styles.profileDetailRow}>
                    <Text style={styles.profileDetailLabel}>Email</Text>
                    <Text style={styles.profileDetailValue}>{currentUser?.email}</Text>
                  </View>
                  <View style={styles.profileDetailRow}>
                    <Text style={styles.profileDetailLabel}>Telefone</Text>
                    <Text style={styles.profileDetailValue}>{currentUser?.phone}</Text>
                  </View>
                  <View style={styles.profileDetailRow}>
                    <Text style={styles.profileDetailLabel}>BI / NIF</Text>
                    <Text style={styles.profileDetailValue}>{currentUser?.document}</Text>
                  </View>
                </View>
              </View>
            </ScrollView>
          )}

          {/* Tab Bar */}
          <View style={styles.tabBar}>
            <TouchableOpacity
              onPress={() => setPassengerTab('SEARCH')}
              style={[styles.tabBarItem, passengerTab === 'SEARCH' && styles.tabActive]}
            >
              <Search size={20} color={passengerTab === 'SEARCH' ? '#2563eb' : '#64748b'} />
              <Text style={[styles.tabLabel, passengerTab === 'SEARCH' && styles.tabLabelActive]}>Pesquisar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setPassengerTab('TICKETS')}
              style={[styles.tabBarItem, passengerTab === 'TICKETS' && styles.tabActive]}
            >
              <Ticket size={20} color={passengerTab === 'TICKETS' ? '#2563eb' : '#64748b'} />
              <Text style={[styles.tabLabel, passengerTab === 'TICKETS' && styles.tabLabelActive]}>Bilhetes</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setPassengerTab('PROFILE')}
              style={[styles.tabBarItem, passengerTab === 'PROFILE' && styles.tabActive]}
            >
              <User size={20} color={passengerTab === 'PROFILE' ? '#2563eb' : '#64748b'} />
              <Text style={[styles.tabLabel, passengerTab === 'PROFILE' && styles.tabLabelActive]}>Perfil</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    );
  };

  // 🛡️ SCREEN: FISCAL HUB
  const renderFiscalHub = () => {
    return (
      <View style={styles.containerBg}>
        <SafeAreaView style={{ flex: 1 }}>
          {/* AppBar */}
          <View style={styles.appBar}>
            <View style={styles.appBarProfile}>
              <View style={styles.fiscalBadgeIcon}>
                <Shield size={16} color="#fff" />
              </View>
              <View>
                <Text style={styles.welcomeText}>Fiscal de Embarque ({currentUser?.company_code || 'TRANSLUX'})</Text>
                <Text style={styles.userNameText}>{currentUser?.name}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={handleLogout} style={styles.logoutIconButton}>
              <LogOut size={20} color="#f43f5e" />
            </TouchableOpacity>
          </View>

          {/* Stats Tab */}
          {fiscalTab === 'STATS' && (
            <ScrollView style={styles.hubContent} contentContainerStyle={{ paddingBottom: 110 }} showsVerticalScrollIndicator={false}>
              <View style={styles.statsCardGrid}>
                <View style={styles.statBox}>
                  <TrendingUp size={24} color="#10b981" />
                  <Text style={styles.statValue}>
                    {myTickets.filter(t => t.status === 'EMBARCADO').length} / {myTickets.length}
                  </Text>
                  <Text style={styles.statLabel}>Embarcados</Text>
                </View>
                <View style={styles.statBox}>
                  <UserCheck size={24} color="#3b82f6" />
                  <Text style={styles.statValue}>
                    {myTickets.filter(t => t.status === 'CONFIRMADO').length}
                  </Text>
                  <Text style={styles.statLabel}>Aguardam Embarque</Text>
                </View>
              </View>

              <Text style={styles.sectionTitle}>Validar Bilhete Manual</Text>
              <View style={styles.card}>
                <TextInput
                  value={scanCode}
                  onChangeText={setScanCode}
                  placeholder="Introduza Código do Bilhete / Token"
                  placeholderTextColor="#64748b"
                  style={styles.input}
                />
                
                <TouchableOpacity
                  onPress={() => handleValidateTicket(scanCode)}
                  style={[styles.primaryButton, { marginTop: 12 }]}
                >
                  <Camera size={18} color="#fff" />
                  <Text style={[styles.primaryButtonText, { marginLeft: 8 }]}>Validar Bilhete</Text>
                </TouchableOpacity>

                <View style={{ marginTop: 12 }}>
                  <Text style={styles.quickTipText}>💡 Sugestão para testes:</Text>
                  <Text style={{color: '#64748b', fontSize: 11, marginTop: 4}}>
                    Reserve um bilhete como passageiro, copie o código e cole aqui para validar como fiscal!
                  </Text>
                </View>
              </View>
            </ScrollView>
          )}

          {/* Scanner Tab */}
          {fiscalTab === 'SCANNER' && (
            <View style={styles.scannerScreenContent}>
              {!scanningResult ? (
                <View style={styles.cameraBoxMock}>
                  <Camera size={48} color="#475569" />
                  <Text style={styles.cameraLabelText}>A apontar câmara para o código QR...</Text>
                  <View style={styles.scannerOverlayFrame} />
                  
                  <View style={{position: 'absolute', bottom: 20, left: 16, right: 16}}>
                    <TextInput
                      value={scanCode}
                      onChangeText={setScanCode}
                      placeholder="Introduza Token QR de teste"
                      placeholderTextColor="#64748b"
                      style={[styles.input, {backgroundColor: '#1e293b', marginBottom: 10}]}
                    />
                    <TouchableOpacity
                      onPress={() => handleValidateTicket(scanCode)}
                      style={[styles.primaryButton, {marginTop: 0}]}
                    >
                      <Text style={styles.primaryButtonText}>Simular Leitura QR</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View style={styles.scanResultContainer}>
                  {scanningResult.status === 'VALID' && (
                    <View style={styles.resultCard}>
                      <CheckCircle2 size={48} color="#10b981" />
                      <Text style={styles.resultTitle}>Bilhete Válido!</Text>
                      <Text style={styles.resultSubtitle}>{scanningResult.ticket?.passenger_name}</Text>
                      
                      <View style={styles.resultSpecs}>
                        <Text style={styles.resultSpecText}>Poltrona: {scanningResult.ticket?.seat}</Text>
                        <Text style={styles.resultSpecText}>De {scanningResult.ticket?.origin} para {scanningResult.ticket?.destination}</Text>
                        <Text style={styles.resultSpecText}>Operadora: {scanningResult.ticket?.carrier}</Text>
                      </View>

                      <TouchableOpacity
                        onPress={() => handleConfirmBoarding(scanningResult.ticket?.codigo_reserva)}
                        style={[styles.primaryButton, { backgroundColor: '#10b981', marginTop: 16 }]}
                      >
                        <Text style={styles.primaryButtonText}>Confirmar Embarque</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {scanningResult.status === 'ALREADY_USED' && (
                    <View style={styles.resultCard}>
                      <AlertCircle size={48} color="#f59e0b" />
                      <Text style={[styles.resultTitle, { color: '#f59e0b' }]}>Já Validado!</Text>
                      <Text style={styles.resultSubtitle}>Este bilhete já realizou o embarque.</Text>
                      <Text style={styles.resultErrorText}>{scanningResult.error}</Text>
                      
                      <TouchableOpacity
                        onPress={() => setScanningResult(null)}
                        style={[styles.primaryButton, { backgroundColor: '#f59e0b', marginTop: 16 }]}
                      >
                        <Text style={styles.primaryButtonText}>Voltar a Ler</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {scanningResult.status === 'WRONG_CARRIER' && (
                    <View style={styles.resultCard}>
                      <AlertCircle size={48} color="#f43f5e" />
                      <Text style={[styles.resultTitle, { color: '#f43f5e' }]}>Operadora Incompatível!</Text>
                      <Text style={styles.resultSubtitle}>Acesso Negado</Text>
                      <Text style={styles.resultErrorText}>
                        Como fiscal da {currentUser?.company_code}, não tem permissão para validar bilhetes da {scanningResult.ticket?.carrier || scanningResult.ticket?.carrierCode}!
                      </Text>
                      
                      <TouchableOpacity
                        onPress={() => setScanningResult(null)}
                        style={[styles.primaryButton, { backgroundColor: '#f43f5e', marginTop: 16 }]}
                      >
                        <Text style={styles.primaryButtonText}>Voltar a Ler</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {scanningResult.status === 'INVALID' && (
                    <View style={styles.resultCard}>
                      <AlertCircle size={48} color="#f43f5e" />
                      <Text style={[styles.resultTitle, { color: '#f43f5e' }]}>Bilhete Inválido!</Text>
                      <Text style={styles.resultSubtitle}>Não Encontrado</Text>
                      <Text style={styles.resultErrorText}>{scanningResult.error}</Text>
                      
                      <TouchableOpacity
                        onPress={() => setScanningResult(null)}
                        style={[styles.primaryButton, { backgroundColor: '#f43f5e', marginTop: 16 }]}
                      >
                        <Text style={styles.primaryButtonText}>Tentar Novamente</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              )}
            </View>
          )}

          {/* Boarding List Tab */}
          {fiscalTab === 'BOARDING_LIST' && (
            <ScrollView style={styles.hubContent} contentContainerStyle={{ paddingBottom: 110 }} showsVerticalScrollIndicator={false}>
              <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16}}>
                <Text style={styles.sectionTitle}>Manifesto de Passageiros ({myTickets.length})</Text>
                <TouchableOpacity onPress={loadFiscalBoardingList}>
                  <Text style={{color: '#2563eb', fontSize: 13, fontWeight: 'bold'}}>Atualizar</Text>
                </TouchableOpacity>
              </View>
              {myTickets.length === 0 ? (
                <Text style={styles.emptyResultsText}>Nenhum passageiro agendado para hoje.</Text>
              ) : (
                myTickets.map((t, idx) => (
                  <View key={idx} style={styles.boardingListRow}>
                    <View style={{flex: 1, marginRight: 10}}>
                      <Text style={styles.boardingPassName}>{t.passenger_name}</Text>
                      <Text style={styles.boardingPassDetails}>Poltrona: {t.seat} | {t.origin} ➔ {t.destination}</Text>
                    </View>
                    <View style={[
                      styles.statusBadge, 
                      t.status === 'EMBARCADO' ? styles.statusBoarded : t.status === 'CANCELADO' ? styles.statusCanceled : styles.statusConfirmed
                    ]}>
                      <Text style={
                        t.status === 'EMBARCADO' ? styles.statusBoardedText : t.status === 'CANCELADO' ? styles.statusCanceledText : styles.statusConfirmedText
                      }>
                        {t.status}
                      </Text>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>
          )}

          {/* Fiscal Tab Bar */}
          <View style={styles.tabBar}>
            <TouchableOpacity
              onPress={() => setFiscalTab('STATS')}
              style={[styles.tabBarItem, fiscalTab === 'STATS' && styles.tabActive]}
            >
              <TrendingUp size={20} color={fiscalTab === 'STATS' ? '#2563eb' : '#64748b'} />
              <Text style={[styles.tabLabel, fiscalTab === 'STATS' && styles.tabLabelActive]}>Estatísticas</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => { setFiscalTab('SCANNER'); setScanningResult(null); }}
              style={[styles.tabBarItem, fiscalTab === 'SCANNER' && styles.tabActive]}
            >
              <Camera size={20} color={fiscalTab === 'SCANNER' ? '#2563eb' : '#64748b'} />
              <Text style={[styles.tabLabel, fiscalTab === 'SCANNER' && styles.tabLabelActive]}>Leitor QR</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setFiscalTab('BOARDING_LIST')}
              style={[styles.tabBarItem, fiscalTab === 'BOARDING_LIST' && styles.tabActive]}
            >
              <UserCheck size={20} color={fiscalTab === 'BOARDING_LIST' ? '#2563eb' : '#64748b'} />
              <Text style={[styles.tabLabel, fiscalTab === 'BOARDING_LIST' && styles.tabLabelActive]}>Passageiros</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    );
  };

  return (
    <View style={{ flex: 1 }}>
      {currentScreen === 'LOGIN' && renderLoginScreen()}
      {currentScreen === 'COMPLETE_PROFILE' && renderCompleteProfileScreen()}
      {currentScreen === 'PASSENGER_HUB' && renderPassengerHub()}
      {currentScreen === 'FISCAL_HUB' && renderFiscalHub()}
      <StatusBar style="light" />
    </View>
  );
}

// -----------------------------------------------------------------
// Premium Styles System
// -----------------------------------------------------------------
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  containerBg: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 40,
    alignItems: 'center',
  },
  headerLogoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoBadge: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  logoBadgeText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
  },
  logoTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 2,
    marginTop: 16,
  },
  logoSubtitle: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 4,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  card: {
    width: '100%',
    backgroundColor: '#1e293b',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#334155',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 4,
    marginBottom: 20,
  },
  sectionSubTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 8,
    marginBottom: 10,
  },
  socialButtonsContainer: {
    flexDirection: 'row',
    width: '100%',
    marginBottom: 16,
  },
  socialButton: {
    flex: 1,
    flexDirection: 'row',
    height: 52,
    borderRadius: 14,
    backgroundColor: '#334155',
    borderWidth: 1,
    borderColor: '#475569',
    justifyContent: 'center',
    alignItems: 'center',
  },
  socialIcon: {
    width: 18,
    height: 18,
    marginRight: 8,
  },
  socialBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
    width: '100%',
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#334155',
  },
  dividerText: {
    color: '#64748b',
    fontSize: 12,
    marginHorizontal: 12,
  },
  demoAccountsList: {
    width: '100%',
  },
  demoAccountCard: {
    flexDirection: 'row',
    height: 64,
    backgroundColor: '#0f172a',
    borderRadius: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  demoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  demoAvatar: {
    fontSize: 20,
    marginRight: 12,
  },
  demoTextCol: {
    justifyContent: 'center',
  },
  demoName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  demoRole: {
    color: '#64748b',
    fontSize: 11,
    marginTop: 2,
  },
  completeProfileContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  completeProfileHeader: {
    alignItems: 'center',
    marginBottom: 20,
    textAlign: 'center',
  },
  completeIconBg: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: '#3b82f620',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    height: 52,
    borderRadius: 16,
    backgroundColor: '#0f172a',
    borderColor: '#2d3748',
    borderWidth: 1.5,
    paddingHorizontal: 16,
    color: '#fff',
    fontSize: 14,
  },
  inputIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    borderRadius: 16,
    backgroundColor: '#0f172a',
    borderColor: '#2d3748',
    borderWidth: 1.5,
    paddingHorizontal: 16,
  },
  inputIconPrefix: {
    marginRight: 10,
  },
  inputWithIcon: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
    height: '100%',
  },
  primaryButton: {
    flexDirection: 'row',
    height: 54,
    borderRadius: 16,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 5,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  appBar: {
    flexDirection: 'row',
    height: 72,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    backgroundColor: '#0f172a',
  },
  appBarProfile: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarMini: {
    width: 40,
    height: 40,
    borderRadius: 12,
    marginRight: 12,
  },
  welcomeText: {
    color: '#64748b',
    fontSize: 11,
  },
  userNameText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  logoutIconButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#e11d4815',
    justifyContent: 'center',
    alignItems: 'center',
  },
  hubContent: {
    flex: 1,
    padding: 20,
  },
  tabBar: {
    flexDirection: 'row',
    height: 68,
    backgroundColor: '#1e293b',
    borderRadius: 24,
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#334155',
    paddingBottom: 0,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  tabBarItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: 48,
    borderRadius: 16,
    marginHorizontal: 4,
  },
  tabActive: {
    backgroundColor: '#2563eb15',
  },
  tabBarActiveOverlay: {
    backgroundColor: '#2563eb15',
  },
  tabLabel: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 2,
  },
  tabLabelActive: {
    color: '#3b82f6',
    fontWeight: 'bold',
  },
  resultsContainer: {
    marginTop: 24,
    marginBottom: 40,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  emptyResultsText: {
    color: '#64748b',
    textAlign: 'center',
    marginTop: 20,
  },
  tripCard: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2d3748',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 3,
  },
  tripCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  carrierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#334155',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  carrierColorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  carrierNameText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  tripPriceText: {
    color: '#3b82f6',
    fontSize: 16,
    fontWeight: 'bold',
  },
  tripDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  tripTimeText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  tripLocText: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  tripConnector: {
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: 16,
  },
  tripDurationText: {
    fontSize: 10,
    color: '#64748b',
    marginBottom: 4,
  },
  tripConnectorLine: {
    height: 2,
    backgroundColor: '#475569',
    width: '100%',
    marginBottom: -8,
  },
  tripFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#334155',
    paddingTop: 12,
    marginBottom: 12,
  },
  tripClassBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tripClassLabel: {
    color: '#94a3b8',
    fontSize: 11,
    marginLeft: 6,
  },
  tripSeatsText: {
    color: '#10b981',
    fontSize: 11,
    fontWeight: '600',
  },
  bookButton: {
    height: 44,
    borderRadius: 10,
    backgroundColor: '#3b82f620',
    borderWidth: 1,
    borderColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookButtonText: {
    color: '#3b82f6',
    fontSize: 13,
    fontWeight: 'bold',
  },
  ticketCard: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#2d3748',
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 3,
  },
  ticketCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  ticketCarrierText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#fff',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusConfirmed: {
    backgroundColor: '#3b82f620',
  },
  statusConfirmedText: {
    color: '#3b82f6',
    fontSize: 10,
    fontWeight: 'bold',
  },
  statusBoarded: {
    backgroundColor: '#10b98120',
  },
  statusBoardedText: {
    color: '#10b981',
    fontSize: 10,
    fontWeight: 'bold',
  },
  statusCanceled: {
    backgroundColor: '#f43f5e20',
  },
  statusCanceledText: {
    color: '#f43f5e',
    fontSize: 10,
    fontWeight: 'bold',
  },
  ticketRouteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  ticketLocText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
  ticketMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#334155',
    paddingTop: 8,
    marginTop: 8,
  },
  ticketMetaText: {
    fontSize: 11,
    color: '#64748b',
  },
  ticketModalOverlay: {
    position: 'absolute',
    top: -100,
    left: -20,
    right: -20,
    bottom: -100,
    backgroundColor: '#000000a0',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  ticketModalCard: {
    width: width * 0.88,
    maxHeight: '80%',
    backgroundColor: '#1e293b',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#334155',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  closeBtnText: {
    color: '#f43f5e',
    fontSize: 14,
    fontWeight: '600',
  },
  qrCodeContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 20,
  },
  qrCodeTokenText: {
    marginTop: 10,
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
  modalSpecsGrid: {
    width: '100%',
  },
  modalSpecItem: {
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    paddingBottom: 8,
  },
  specLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
  specValue: {
    fontSize: 13,
    color: '#fff',
    fontWeight: 'bold',
    marginTop: 2,
  },
  profileBox: {
    alignItems: 'center',
    paddingTop: 20,
  },
  avatarLarge: {
    width: 90,
    height: 90,
    borderRadius: 30,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#2563eb',
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  profileRoleText: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
    marginBottom: 24,
  },
  profileDetailsCard: {
    width: '100%',
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  profileDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  profileDetailLabel: {
    color: '#64748b',
    fontSize: 13,
  },
  profileDetailValue: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  fiscalBadgeIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  statsCardGrid: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
    marginHorizontal: 4,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  quickTipText: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
  },
  boardingListRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    padding: 16,
    borderRadius: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  boardingPassName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  boardingPassDetails: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  checkoutTripSummary: {
    backgroundColor: '#0f172a',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  checkoutTripTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#fff',
  },
  checkoutTripRoute: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 4,
  },
  checkoutTripPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#3b82f6',
    marginTop: 6,
  },
  seatSelectionScroll: {
    maxHeight: 180,
    backgroundColor: '#0f172a',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  seatSelectorRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  seatBoxBtn: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#334155',
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  seatBoxSelected: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  seatBoxText: {
    fontSize: 11,
    color: '#cbd5e1',
    fontWeight: 'bold',
  },
  seatBoxTextSelected: {
    color: '#fff',
  },
  corridorSpace: {
    width: 20,
  },
  seatPickedText: {
    fontSize: 13,
    color: '#fff',
    marginTop: 4,
    marginBottom: 12,
    textAlign: 'center',
  },
  paymentMethodsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 10,
  },
  paymentMethodChip: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
    marginHorizontal: 4,
  },
  paymentMethodChipActive: {
    backgroundColor: '#2563eb30',
    borderColor: '#2563eb',
  },
  paymentMethodText: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '600',
  },
  paymentMethodTextActive: {
    color: '#2563eb',
    fontWeight: 'bold',
  },
  scannerScreenContent: {
    flex: 1,
    backgroundColor: '#090d16',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  cameraBoxMock: {
    width: '100%',
    aspectRatio: 0.85,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  cameraLabelText: {
    color: '#64748b',
    fontSize: 13,
    marginTop: 12,
    textAlign: 'center',
    marginBottom: 100,
  },
  scannerOverlayFrame: {
    position: 'absolute',
    width: '70%',
    height: '60%',
    borderColor: '#2563eb',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 16,
    top: '15%',
  },
  scanResultContainer: {
    width: '100%',
  },
  resultCard: {
    backgroundColor: '#1e293b',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#10b981',
    marginTop: 16,
  },
  resultSubtitle: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
    marginTop: 4,
  },
  resultSpecs: {
    width: '100%',
    backgroundColor: '#0f172a',
    borderRadius: 14,
    padding: 16,
    marginTop: 16,
  },
  resultSpecText: {
    color: '#94a3b8',
    fontSize: 12,
    marginBottom: 6,
    textAlign: 'center',
  },
  resultErrorText: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 12,
  },
});
