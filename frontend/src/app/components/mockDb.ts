'use client';

import { Trip, MOCK_TRIPS } from '@/app/results-page/components/mockTrips';

export interface UserSession {
  email: string;
  name: string;
  phone: string;
  document: string;
  avatar?: string;
  isAdmin?: boolean;
}

export interface Reservation {
  id: string; // RES-ORIG-DEST-DATE-RANDOM
  tripId: string;
  passengerName: string;
  passengerEmail: string;
  passengerPhone: string;
  passengerDocument: string;
  origin: string;
  destination: string;
  date: string;
  departureTime: string;
  arrivalTime: string;
  class: string;
  classLabel: string;
  seat: string;
  price: number;
  carrier: string;
  carrierCode: string;
  carrierColor: string;
  status: 'PENDENTE' | 'CONFIRMADO' | 'CANCELADO' | 'EMBARCADO' | 'UTILIZADO';
  paymentMethod?: string;
  paymentDate?: string;
  validationDate?: string;
  qrToken: string;
}

const DEMO_USER: UserSession = {
  email: 'fatima.manuel@transbook.ao',
  name: 'Fátima Manuel',
  phone: '+244 923 456 789',
  document: '005432168LA045',
  avatar:
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
  isAdmin: false,
};

const DEFAULT_RESERVATIONS: Reservation[] = [
  {
    id: 'RES-LUA-HUA-20260601-M8Y2P1',
    tripId: 'trip-001',
    passengerName: 'Fátima Manuel',
    passengerEmail: 'fatima.manuel@transbook.ao',
    passengerPhone: '+244 923 456 789',
    passengerDocument: '005432168LA045',
    origin: 'Luanda',
    destination: 'Huambo',
    date: '2026-06-01',
    departureTime: '06:00',
    arrivalTime: '14:30',
    class: 'economica',
    classLabel: 'Económica',
    seat: '14A',
    price: 4500,
    carrier: 'Macon Transportes',
    carrierCode: 'MACON',
    carrierColor: 'bg-blue-600',
    status: 'UTILIZADO',
    paymentMethod: 'Multicaixa Express',
    paymentDate: '2026-06-01T05:32:00Z',
    validationDate: '2026-06-01T05:48:12Z',
    qrToken: 'tok-luanda-huambo-fatima-0601-utilizado',
  },
  {
    id: 'RES-HUA-LUA-20260610-K4X9A8',
    tripId: 'trip-002',
    passengerName: 'Fátima Manuel',
    passengerEmail: 'fatima.manuel@transbook.ao',
    passengerPhone: '+244 923 456 789',
    passengerDocument: '005432168LA045',
    origin: 'Huambo',
    destination: 'Luanda',
    date: '2026-06-10',
    departureTime: '07:30',
    arrivalTime: '16:00',
    class: 'executiva',
    classLabel: 'Executiva',
    seat: '08C',
    price: 7200,
    carrier: 'Translux Angola',
    carrierCode: 'TRANSLUX',
    carrierColor: 'bg-orange-600',
    status: 'CONFIRMADO',
    paymentMethod: 'Unitel Money',
    paymentDate: '2026-06-01T15:20:00Z',
    qrToken: 'tok-huambo-luanda-fatima-0610-confirmado',
  },
  {
    id: 'RES-LUA-LOB-20260520-C3W1T7',
    tripId: 'trip-003',
    passengerName: 'Fátima Manuel',
    passengerEmail: 'fatima.manuel@transbook.ao',
    passengerPhone: '+244 923 456 789',
    passengerDocument: '005432168LA045',
    origin: 'Luanda',
    destination: 'Lobito',
    date: '2026-05-20',
    departureTime: '08:00',
    arrivalTime: '14:30',
    class: 'economica',
    classLabel: 'Económica',
    seat: '22B',
    price: 4200,
    carrier: 'SGO Express',
    carrierCode: 'SGO',
    carrierColor: 'bg-green-600',
    status: 'CANCELADO',
    paymentMethod: 'Pagamento por referência',
    paymentDate: '2026-05-19T10:15:00Z',
    qrToken: 'tok-luanda-lobito-fatima-0520-cancelado',
  },
  // Other passengers for Admin stats
  {
    id: 'RES-LUA-HUA-20260601-A2B3C4',
    tripId: 'trip-001',
    passengerName: 'António Gouveia',
    passengerEmail: 'antonio.g@gmail.com',
    passengerPhone: '+244 934 111 222',
    passengerDocument: '002135689LA088',
    origin: 'Luanda',
    destination: 'Huambo',
    date: '2026-06-01',
    departureTime: '06:00',
    arrivalTime: '14:30',
    class: 'economica',
    classLabel: 'Económica',
    seat: '12B',
    price: 4500,
    carrier: 'Macon Transportes',
    carrierCode: 'MACON',
    carrierColor: 'bg-blue-600',
    status: 'EMBARCADO',
    paymentMethod: 'Multicaixa Express',
    paymentDate: '2026-06-01T05:22:00Z',
    validationDate: '2026-06-01T05:51:00Z',
    qrToken: 'tok-antonio-gouveia-trip1',
  },
  {
    id: 'RES-LUA-HUA-20260601-X9Y8Z7',
    tripId: 'trip-004',
    passengerName: 'Sandra Batalha',
    passengerEmail: 'sandra.b@yahoo.com',
    passengerPhone: '+244 912 333 444',
    passengerDocument: '008956423LA012',
    origin: 'Luanda',
    destination: 'Huambo',
    date: '2026-06-01',
    departureTime: '10:00',
    arrivalTime: '18:30',
    class: 'vip',
    classLabel: 'VIP',
    seat: '02A',
    price: 12500,
    carrier: 'Translux Angola',
    carrierCode: 'TRANSLUX',
    carrierColor: 'bg-orange-600',
    status: 'UTILIZADO',
    paymentMethod: 'PayPay',
    paymentDate: '2026-06-01T09:12:00Z',
    validationDate: '2026-06-01T09:42:00Z',
    qrToken: 'tok-sandra-batalha-trip4',
  },
  {
    id: 'RES-LUA-HUA-20260602-T1Y2U3',
    tripId: 'trip-002',
    passengerName: 'Mateus Manuel',
    passengerEmail: 'mateus.m@outlook.com',
    passengerPhone: '+244 945 888 777',
    passengerDocument: '007845129LA059',
    origin: 'Luanda',
    destination: 'Huambo',
    date: '2026-06-02',
    departureTime: '07:30',
    arrivalTime: '16:00',
    class: 'executiva',
    classLabel: 'Executiva',
    seat: '10B',
    price: 7200,
    carrier: 'Translux Angola',
    carrierCode: 'TRANSLUX',
    carrierColor: 'bg-orange-600',
    status: 'CONFIRMADO',
    paymentMethod: 'Pagamento por referência',
    paymentDate: '2026-06-01T18:40:00Z',
    qrToken: 'tok-mateus-manuel-trip2',
  },
  {
    id: 'RES-LUA-HUA-20260602-R5E6W7',
    tripId: 'trip-005',
    passengerName: 'Isabel Neto',
    passengerEmail: 'isabel.neto@gmail.com',
    passengerPhone: '+244 921 555 666',
    passengerDocument: '001254789LA033',
    origin: 'Luanda',
    destination: 'Huambo',
    date: '2026-06-02',
    departureTime: '14:00',
    arrivalTime: '22:30',
    class: 'economica',
    classLabel: 'Económica',
    seat: '18A',
    price: 4500,
    carrier: 'Macon Transportes',
    carrierCode: 'MACON',
    carrierColor: 'bg-blue-600',
    status: 'CONFIRMADO',
    paymentMethod: 'Multicaixa Express',
    paymentDate: '2026-06-01T20:10:00Z',
    qrToken: 'tok-isabel-neto-trip5',
  },
  {
    id: 'RES-LUA-HUA-20260602-Q1W2E3',
    tripId: 'trip-008',
    passengerName: 'Carlos Silva',
    passengerEmail: 'carlos.silva@transbook.ao',
    passengerPhone: '+244 931 444 555',
    passengerDocument: '009854761LA021',
    origin: 'Luanda',
    destination: 'Huambo',
    date: '2026-06-02',
    departureTime: '05:30',
    arrivalTime: '14:00',
    class: 'vip',
    classLabel: 'VIP',
    seat: '04A',
    price: 13000,
    carrier: 'Macon Transportes',
    carrierCode: 'MACON',
    carrierColor: 'bg-blue-600',
    status: 'CONFIRMADO',
    paymentMethod: 'Unitel Money',
    paymentDate: '2026-06-01T21:30:00Z',
    qrToken: 'tok-carlos-silva-trip8',
  },
  {
    id: 'RES-LUA-HUA-20260531-M1N2B3',
    tripId: 'trip-001',
    passengerName: 'Marcos André',
    passengerEmail: 'marcos.andre@gmail.com',
    passengerPhone: '+244 929 111 555',
    passengerDocument: '004758129LA067',
    origin: 'Luanda',
    destination: 'Huambo',
    date: '2026-05-31',
    departureTime: '06:00',
    arrivalTime: '14:30',
    class: 'economica',
    classLabel: 'Económica',
    seat: '20A',
    price: 4500,
    carrier: 'Macon Transportes',
    carrierCode: 'MACON',
    carrierColor: 'bg-blue-600',
    status: 'UTILIZADO',
    paymentMethod: 'Multicaixa Express',
    paymentDate: '2026-05-31T05:15:00Z',
    validationDate: '2026-05-31T05:49:00Z',
    qrToken: 'tok-marcos-andre-trip1',
  },
];

const LOCAL_STORAGE_KEYS = {
  USER: 'nzila_current_user',
  RESERVATIONS: 'nzila_reservas',
  VALIDATION_LOGS: 'nzila_validation_logs',
};

// Initialize DB if not present
export function initializeMockDb() {
  if (typeof window === 'undefined') return;

  if (!localStorage.getItem(LOCAL_STORAGE_KEYS.USER)) {
    localStorage.setItem(LOCAL_STORAGE_KEYS.USER, JSON.stringify(DEMO_USER));
  }

  if (!localStorage.getItem(LOCAL_STORAGE_KEYS.RESERVATIONS)) {
    localStorage.setItem(LOCAL_STORAGE_KEYS.RESERVATIONS, JSON.stringify(DEFAULT_RESERVATIONS));
  }

  if (!localStorage.getItem(LOCAL_STORAGE_KEYS.VALIDATION_LOGS)) {
    localStorage.setItem(LOCAL_STORAGE_KEYS.VALIDATION_LOGS, JSON.stringify([]));
  }
}

// User Session functions
export function getCurrentUser(): UserSession | null {
  if (typeof window === 'undefined') return null;
  initializeMockDb();
  const user = localStorage.getItem(LOCAL_STORAGE_KEYS.USER);
  return user ? JSON.parse(user) : null;
}

export function setCurrentUser(user: UserSession | null) {
  if (typeof window === 'undefined') return;
  if (user) {
    localStorage.setItem(LOCAL_STORAGE_KEYS.USER, JSON.stringify(user));
  } else {
    localStorage.removeItem(LOCAL_STORAGE_KEYS.USER);
  }
}

// Reservations functions
export function getReservations(): Reservation[] {
  if (typeof window === 'undefined') return [];
  initializeMockDb();
  const reservations = localStorage.getItem(LOCAL_STORAGE_KEYS.RESERVATIONS);
  return reservations ? JSON.parse(reservations) : [];
}

export function saveReservations(reservations: Reservation[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LOCAL_STORAGE_KEYS.RESERVATIONS, JSON.stringify(reservations));
}

export function getReservationById(id: string): Reservation | undefined {
  return getReservations().find((r) => r.id === id);
}

export function createReservation(
  reservation: Omit<Reservation, 'id' | 'qrToken' | 'status' | 'paymentDate'>
): Reservation {
  const code = generateBookingCode(reservation.origin, reservation.destination, reservation.date);
  const newReservation: Reservation = {
    ...reservation,
    id: code,
    status: 'CONFIRMADO',
    paymentDate: new Date().toISOString(),
    qrToken: `nzila-ticket-token-${code}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
  };

  const currentList = getReservations();
  saveReservations([newReservation, ...currentList]);

  // Track ticket details as dynamic email sent
  addSimulatedEmailNotification(
    newReservation.passengerEmail,
    'Confirmação de Reserva',
    `Olá ${newReservation.passengerName}, o seu bilhete de ${newReservation.origin} para ${newReservation.destination} está reservado com sucesso! Código: ${newReservation.id}.`,
    newReservation
  );

  return newReservation;
}

export function updateReservationStatus(
  id: string,
  status: Reservation['status'],
  validationDate?: string
): boolean {
  const list = getReservations();
  const index = list.findIndex((r) => r.id === id);
  if (index !== -1) {
    list[index].status = status;
    if (validationDate) {
      list[index].validationDate = validationDate;
    }
    saveReservations(list);

    // If cancelled, trigger simulated email
    if (status === 'CANCELADO') {
      addSimulatedEmailNotification(
        list[index].passengerEmail,
        'Cancelamento de Viagem',
        `Olá ${list[index].passengerName}, a sua reserva com o código ${list[index].id} foi cancelada a seu pedido e o reembolso está a ser processado.`,
        list[index]
      );
    }
    return true;
  }
  return false;
}

export function updateReservationDetails(id: string, updates: Partial<Reservation>): boolean {
  const list = getReservations();
  const index = list.findIndex((r) => r.id === id);
  if (index !== -1) {
    list[index] = { ...list[index], ...updates };
    saveReservations(list);
    return true;
  }
  return false;
}

// Generate Booking Code: RES-[ORIG_PREFIX]-[DEST_PREFIX]-[DATE_STAMP]-[RANDOM_6_HEX]
export function generateBookingCode(origin: string, destination: string, date: string): string {
  const origPref = origin.substring(0, 3).toUpperCase();
  const destPref = destination.substring(0, 3).toUpperCase();
  const dateStamp = date.replace(/-/g, '');
  const randomHex = Math.random().toString(16).substring(2, 8).toUpperCase();
  return `RES-${origPref}-${destPref}-${dateStamp}-${randomHex}`;
}

// Email Notifications simulation (saved to local storage)
export interface SimulatedEmail {
  id: string;
  recipient: string;
  subject: string;
  snippet: string;
  sentAt: string;
  reservationData?: Reservation;
}

export function getSimulatedEmails(): SimulatedEmail[] {
  if (typeof window === 'undefined') return [];
  const emails = localStorage.getItem('nzila_simulated_emails');
  if (!emails) {
    // Seed initial emails
    const initialEmails: SimulatedEmail[] = [
      {
        id: 'email-001',
        recipient: 'fatima.manuel@transbook.ao',
        subject: 'Confirmação de Viagem: RES-LUA-HUA-20260601-M8Y2P1',
        snippet: 'Obrigado por escolher o Nzila! O seu bilhete digital para Huambo está anexado.',
        sentAt: '2026-06-01T05:32:00Z',
        reservationData: DEFAULT_RESERVATIONS[0],
      },
      {
        id: 'email-002',
        recipient: 'fatima.manuel@transbook.ao',
        subject: 'Lembrete de Viagem: Faltam 24 Horas!',
        snippet:
          'Lembrete: A sua viagem para Huambo com a Macon Transportes parte amanhã às 06:00.',
        sentAt: '2026-05-31T06:00:00Z',
        reservationData: DEFAULT_RESERVATIONS[0],
      },
    ];
    localStorage.setItem('nzila_simulated_emails', JSON.stringify(initialEmails));
    return initialEmails;
  }
  return JSON.parse(emails);
}

export function addSimulatedEmailNotification(
  recipient: string,
  subject: string,
  snippet: string,
  reservationData?: Reservation
) {
  if (typeof window === 'undefined') return;
  const emails = getSimulatedEmails();
  const newEmail: SimulatedEmail = {
    id: `email-${Math.random().toString(36).substring(2, 9)}`,
    recipient,
    subject,
    snippet,
    sentAt: new Date().toISOString(),
    reservationData,
  };
  localStorage.setItem('nzila_simulated_emails', JSON.stringify([newEmail, ...emails]));
}
