import random
from datetime import datetime
from django.utils import timezone
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from django.db.models import Sum

from .models import UserProfile, Carrier, Trip, Reservation, ValidationLog
from .serializers import (
    UserSerializer,
    TripSerializer,
    ReservationSerializer,
    ValidationLogSerializer,
)

# ----------------------------------------------------
# Authentication APIs
# ----------------------------------------------------
@api_view(['POST'])
@permission_classes([AllowAny])
def register_user(request):
    data = request.data
    username = data.get('email') # Use email as username
    email = data.get('email')
    password = data.get('password')
    name = data.get('fullName')
    phone = data.get('phone', '')
    document = data.get('document', '005432168LA045') # Default document if omitted

    if not username or not password or not name:
        return Response({'error': 'Preencha o nome, email e palavra-passe.'}, status=status.HTTP_400_BAD_REQUEST)

    if User.objects.filter(username=username).exists():
        return Response({'error': 'Este email já está registado no sistema.'}, status=status.HTTP_400_BAD_REQUEST)

    # Create standard auth user
    user = User.objects.create_user(username=username, email=email, password=password)
    
    # Create profile details
    UserProfile.objects.create(
        user=user,
        name=name,
        phone=phone,
        document=document,
        avatar='https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
        is_admin=False
    )

    token, _ = Token.objects.get_or_create(user=user)
    serializer = UserSerializer(user)
    return Response({
        'token': token.key,
        'user': serializer.data
    }, status=status.HTTP_201_CREATED)

@api_view(['POST'])
@permission_classes([AllowAny])
def login_user(request):
    email = request.data.get('email')
    password = request.data.get('password')

    if not email or not password:
        return Response({'error': 'Preencha o email e palavra-passe.'}, status=status.HTTP_400_BAD_REQUEST)

    user = authenticate(username=email, password=password)
    if not user:
        return Response({'error': 'Credenciais inválidas.'}, status=status.HTTP_400_BAD_REQUEST)

    token, _ = Token.objects.get_or_create(user=user)
    serializer = UserSerializer(user)
    return Response({
        'token': token.key,
        'user': serializer.data
    }, status=status.HTTP_200_OK)

# ----------------------------------------------------
# Trips Search & Filters
# ----------------------------------------------------
@api_view(['GET'])
@permission_classes([AllowAny])
def list_trips(request):
    trips = Trip.objects.all()

    # Apply filters
    origin = request.query_params.get('origin')
    destination = request.query_params.get('destination')
    class_type = request.query_params.get('class')
    carrier = request.query_params.get('carrier')

    if origin:
        trips = trips.filter(origin__icontains=origin)
    if destination:
        trips = trips.filter(destination__icontains=destination)
    if class_type:
        trips = trips.filter(class_type=class_type)
    if carrier:
        trips = trips.filter(carrier__code=carrier)

    serializer = TripSerializer(trips, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)

@api_view(['GET'])
@permission_classes([AllowAny])
def trip_details(request, pk):
    try:
        trip = Trip.objects.get(pk=pk)
    except Trip.DoesNotExist:
        return Response({'error': 'Viagem não encontrada.'}, status=status.HTTP_404_NOT_FOUND)

    serializer = TripSerializer(trip)
    return Response(serializer.data, status=status.HTTP_200_OK)

# ----------------------------------------------------
# Reservations Management
# ----------------------------------------------------
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def manage_reservations(request):
    if request.method == 'GET':
        reservations = Reservation.objects.filter(passenger_email=request.user.email).order_by('-payment_date')
        serializer = ReservationSerializer(reservations, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    elif request.method == 'POST':
        data = request.data
        trip_id = data.get('tripId')
        seat = data.get('seat')
        payment_method = data.get('paymentMethod')

        if not trip_id or not seat:
            return Response({'error': 'Preencha o ID da viagem e a poltrona desejada.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            trip = Trip.objects.get(pk=trip_id)
        except Trip.DoesNotExist:
            return Response({'error': 'Viagem não encontrada.'}, status=status.HTTP_404_NOT_FOUND)

        # Pre-populate passenger fields with authenticated profile if matching
        try:
            profile = request.user.profile
            passenger_name = profile.name
            passenger_phone = profile.phone or data.get('passengerPhone', '')
            passenger_document = profile.document or data.get('passengerDocument', '')
        except UserProfile.DoesNotExist:
            passenger_name = data.get('passengerName', request.user.first_name or request.user.username)
            passenger_phone = data.get('passengerPhone', '')
            passenger_document = data.get('passengerDocument', '')

        # Generate custom structured code
        orig_pref = trip.origin[:3].upper()
        dest_pref = trip.destination[:3].upper()
        date_stamp = timezone.now().strftime('%Y%m%d')
        random_hex = ''.join(random.choices('0123456789ABCDEF', k=6))
        code = f"RES-{orig_pref}-{dest_pref}-{date_stamp}-{random_hex}"

        # Create reservation
        reservation = Reservation.objects.create(
            id=code,
            trip=trip,
            passenger_name=passenger_name,
            passenger_email=request.user.email,
            passenger_phone=passenger_phone,
            passenger_document=passenger_document,
            seat=seat,
            price=trip.price,
            status='CONFIRMADO',
            payment_method=payment_method,
            qr_token=f"nzila-token-{code}-{random_hex}"
        )

        # Decrement available seats count
        if trip.available_seats > 0:
            trip.available_seats -= 1
            trip.save()

        serializer = ReservationSerializer(reservation)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

@api_view(['GET'])
@permission_classes([AllowAny])
def reservation_details(request, pk):
    try:
        reservation = Reservation.objects.get(pk=pk)
    except Reservation.DoesNotExist:
        return Response({'error': 'Reserva não encontrada.'}, status=status.HTTP_404_NOT_FOUND)

    serializer = ReservationSerializer(reservation)
    return Response(serializer.data, status=status.HTTP_200_OK)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def cancel_reservation(request, pk):
    try:
        reservation = Reservation.objects.get(pk=pk)
    except Reservation.DoesNotExist:
        return Response({'error': 'Reserva não encontrada.'}, status=status.HTTP_404_NOT_FOUND)

    if reservation.passenger_email != request.user.email and not getattr(request.user.profile, 'is_admin', False):
        return Response({'error': 'Não tem permissão para cancelar este bilhete.'}, status=status.HTTP_403_FORBIDDEN)

    if reservation.status == 'CANCELADO':
        return Response({'error': 'Este bilhete já está cancelado.'}, status=status.HTTP_400_BAD_REQUEST)

    reservation.status = 'CANCELADO'
    reservation.save()

    # Re-increment available seats count
    trip = reservation.trip
    trip.available_seats += 1
    trip.save()

    return Response({'success': 'Reserva cancelada com sucesso.'}, status=status.HTTP_200_OK)

# ----------------------------------------------------
# Boarding Validation (Fiscais)
# ----------------------------------------------------
@api_view(['POST'])
@permission_classes([AllowAny]) # Allow boarding tools to scan
def scan_ticket(request):
    code = request.data.get('code')
    if not code:
        return Response({'error': 'Código de bilhete em falta.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        res = Reservation.objects.get(id__iexact=code.strip())
    except Reservation.DoesNotExist:
        return Response({'status': 'INVALID', 'error': 'Bilhete não encontrado.'}, status=status.HTTP_200_OK)

    if res.status == 'CANCELADO':
        return Response({'status': 'INVALID', 'error': 'Este bilhete está cancelado.'}, status=status.HTTP_200_OK)
    
    if res.status in ['EMBARCADO', 'UTILIZADO']:
        serializer = ReservationSerializer(res)
        return Response({
            'status': 'ALREADY_USED',
            'error': 'Atenção: Este bilhete já foi validado anteriormente!',
            'ticket': serializer.data
        }, status=status.HTTP_200_OK)

    serializer = ReservationSerializer(res)
    return Response({
        'status': 'VALID',
        'ticket': serializer.data
    }, status=status.HTTP_200_OK)

@api_view(['POST'])
@permission_classes([AllowAny])
def confirm_boarding(request):
    code = request.data.get('code')
    operator = request.data.get('operator', 'Fiscal Geral')

    if not code:
        return Response({'error': 'Código de bilhete em falta.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        res = Reservation.objects.get(id__iexact=code.strip())
    except Reservation.DoesNotExist:
        return Response({'error': 'Bilhete não encontrado.'}, status=status.HTTP_404_NOT_FOUND)

    if res.status in ['EMBARCADO', 'UTILIZADO']:
        return Response({'error': 'Bilhete já utilizado.'}, status=status.HTTP_400_BAD_REQUEST)

    if res.status == 'CANCELADO':
        return Response({'error': 'Este bilhete está cancelado.'}, status=status.HTTP_400_BAD_REQUEST)

    now_str = timezone.now().strftime('%H:%M %d/%m/%Y')
    res.status = 'EMBARCADO'
    res.validation_date = now_str
    res.save()

    # Log check-in
    ValidationLog.objects.create(
        reservation=res,
        status='EMBARCADO',
        validated_by=operator
    )

    serializer = ReservationSerializer(res)
    return Response({
        'success': 'Embarque confirmado com sucesso.',
        'ticket': serializer.data
    }, status=status.HTTP_200_OK)

# ----------------------------------------------------
# Administrative Stats & CRUD
# ----------------------------------------------------
@api_view(['GET'])
@permission_classes([AllowAny]) # Simplify demo dashboard access
def admin_stats(request):
    # Total revenue (sum of not-cancelled reservations)
    revenue = Reservation.objects.exclude(status='CANCELADO').aggregate(Sum('price'))['price__sum'] or 0
    total_sales = Reservation.objects.count()
    active_sales = Reservation.objects.exclude(status='CANCELADO').count()
    
    # Today stats
    today_str = timezone.now().date()
    today_res = Reservation.objects.filter(payment_date__date=today_str)
    today_count = today_res.count()
    today_revenue = today_res.exclude(status='CANCELADO').aggregate(Sum('price'))['price__sum'] or 0

    occupancy = 78
    if total_sales > 0:
        occupancy = min(94, 68 + (active_sales * 2))

    return Response({
        'totalRevenue': revenue,
        'totalSalesCount': total_sales,
        'activeSalesCount': active_sales,
        'todaySalesCount': today_count,
        'todayRevenue': today_revenue,
        'occupancyRate': occupancy,
        'activeTripsCount': Trip.objects.count(),
    }, status=status.HTTP_200_OK)

@api_view(['GET'])
@permission_classes([AllowAny])
def admin_all_reservations(request):
    reservations = Reservation.objects.all().order_by('-payment_date')
    serializer = ReservationSerializer(reservations, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)
