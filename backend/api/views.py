import random
from datetime import datetime
from django.utils import timezone
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.core.mail import send_mail
from django.conf import settings
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from django.db.models import Sum

from .models import (
    UserProfile, Company, Location, Route, Bus, Seat,
    Trip, Reservation, ReservationSeat, Payment, Ticket, Notification,
    CompanyAdmin, CompanyDocument, PopularRoute
)
from .serializers import (
    UserSerializer,
    FiscalSerializer,
    TripSerializer,
    ReservationSerializer,
    LocationSerializer,
    CompanySerializer,
    CompanyDocumentSerializer,
    CompanyAdminSerializer,
    NotificationSerializer,
    PopularRouteSerializer,
    BusSerializer,
)

# ----------------------------------------------------
# Authentication APIs
# ----------------------------------------------------
@api_view(['POST'])
@permission_classes([AllowAny])
def register_user(request):
    data = request.data
    username = data.get('email')
    email = data.get('email')
    password = data.get('password')
    name = data.get('fullName')
    phone = data.get('phone', '')
    document = data.get('document', '005432168LA045')

    if not username or not password or not name:
        return Response({'error': 'Preencha o nome, email e palavra-passe.'}, status=status.HTTP_400_BAD_REQUEST)

    if User.objects.filter(username=username).exists():
        return Response({'error': 'Este email já está registado no sistema.'}, status=status.HTTP_400_BAD_REQUEST)

    # Create User
    user = User.objects.create_user(username=username, email=email, password=password)
    
    # Create profile mapping to table 'users'
    UserProfile.objects.create(
        user=user,
        nome=name,
        email=email,
        telefone=phone,
        document=document,
        role='CLIENTE'
    )

    token, _ = Token.objects.get_or_create(user=user)
    serializer = UserSerializer(user)
    return Response({
        'token': token.key,
        'user': serializer.data
    }, status=status.HTTP_201_CREATED)

@api_view(['POST'])
@permission_classes([AllowAny])
def send_client_otp(request):
    data = request.data
    email = data.get('email')
    name = data.get('name')

    if not email:
        return Response({'error': 'O email é obrigatório.'}, status=status.HTTP_400_BAD_REQUEST)

    if User.objects.filter(username=email).exists():
        return Response({'error': 'Este email já está registado no sistema.'}, status=status.HTTP_400_BAD_REQUEST)

    # Generate 6-digit OTP code
    otp_code = str(random.randint(100000, 999999))

    # Send actual email to the user with verification code
    try:
        subject = "Nzila - Verificação de E-mail"
        message = (
            f"Olá {name or 'Passageiro'},\n\n"
            f"Obrigado por se registar no Nzila.\n"
            f"Para ativar a sua conta, insira o seguinte código no formulário de registo:\n\n"
            f"Código OTP: {otp_code}\n\n"
            f"Melhores cumprimentos,\n"
            f"Equipa Nzila"
        )
        from_email = settings.DEFAULT_FROM_EMAIL
        send_mail(subject, message, from_email, [email], fail_silently=False)
    except Exception as e:
        print(f"Erro ao enviar e-mail de verificação de cliente: {e}")

    return Response({
        'success': 'Código de verificação enviado.',
        'otp': otp_code
    }, status=status.HTTP_200_OK)

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

@api_view(['POST'])
@permission_classes([AllowAny])
def social_login_user(request):
    data = request.data
    email = data.get('email')
    name = data.get('name')
    phone = data.get('phone', '')
    document = data.get('document', '005432168LA045')
    avatar = data.get('avatar', '')

    if not email:
        return Response({'error': 'Email é obrigatório.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        user = User.objects.get(email=email)
        # Update user profile if exists
        try:
            profile = user.profile
            if (not profile.nome or profile.nome == email.split('@')[0]) and name:
                profile.nome = name
            if avatar and not profile.avatar:
                profile.avatar = avatar
            if phone and not profile.telefone:
                profile.telefone = phone
            profile.save()
        except UserProfile.DoesNotExist:
            UserProfile.objects.create(
                user=user,
                nome=name or email.split('@')[0],
                email=email,
                telefone=phone,
                document=document,
                avatar=avatar,
                role='CLIENTE'
            )
    except User.DoesNotExist:
        # Create new Django Auth User
        username = email
        import secrets
        password = secrets.token_urlsafe(16)
        user = User.objects.create_user(username=username, email=email, password=password)
        
        # Create UserProfile (mapped to table 'users')
        UserProfile.objects.create(
            user=user,
            nome=name or email.split('@')[0],
            email=email,
            telefone=phone,
            document=document,
            avatar=avatar,
            role='CLIENTE'
        )

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
        trips = trips.filter(route__origem__nome__icontains=origin)
    if destination:
        trips = trips.filter(route__destino__nome__icontains=destination)
    if class_type:
        trips = trips.filter(classe=class_type.upper())
    if carrier:
        trips = trips.filter(empresa__code=carrier)

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
        reservations = Reservation.objects.filter(user__email=request.user.email).order_by('-created_at')
        serializer = ReservationSerializer(reservations, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    elif request.method == 'POST':
        data = request.data
        trip_id = data.get('tripId')
        seat_number = data.get('seat')
        payment_method = data.get('paymentMethod', 'Multicaixa Express')

        if not trip_id or not seat_number:
            return Response({'error': 'Preencha o ID da viagem e a poltrona desejada.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            trip = Trip.objects.get(pk=trip_id)
        except Trip.DoesNotExist:
            return Response({'error': 'Viagem não encontrada.'}, status=status.HTTP_404_NOT_FOUND)

        # Passenger details
        passenger_email = data.get('passengerEmail', request.user.email)
        passenger_name = data.get('passengerName', request.user.profile.nome if hasattr(request.user, 'profile') else request.user.username)
        passenger_phone = data.get('passengerPhone', '')
        passenger_document = data.get('passengerDocument', '')

        # Locate/Create User for passenger if booking for someone else
        try:
            passenger_user = User.objects.get(email=passenger_email)
        except User.DoesNotExist:
            import secrets
            passenger_user = User.objects.create_user(
                username=passenger_email,
                email=passenger_email,
                password=secrets.token_urlsafe(16)
            )
            UserProfile.objects.create(
                user=passenger_user,
                nome=passenger_name,
                email=passenger_email,
                telefone=passenger_phone,
                document=passenger_document,
                role='CLIENTE'
            )

        # Find Seat in Trip's bus
        try:
            seat_obj = Seat.objects.get(bus=trip.bus, numero=seat_number)
        except Seat.DoesNotExist:
            # Fallback auto-create for demo resilience
            seat_obj = Seat.objects.create(bus=trip.bus, numero=seat_number)

        # Validate Seat and Capacity limit
        is_occupied = ReservationSeat.objects.filter(
            reservation__trip=trip,
            seat=seat_obj,
            reservation__status__in=['CONFIRMADA', 'EMBARCADO']
        ).exists()
        if is_occupied:
            return Response({'error': 'Esta poltrona já se encontra ocupada nesta viagem.'}, status=status.HTTP_400_BAD_REQUEST)

        occupied_count = ReservationSeat.objects.filter(
            reservation__trip=trip,
            reservation__status__in=['CONFIRMADA', 'EMBARCADO']
        ).count()
        if occupied_count >= trip.bus.capacidade:
            return Response({'error': 'Esta viagem já atingiu a capacidade máxima de lotação.'}, status=status.HTTP_400_BAD_REQUEST)

        # Generate unique reservation code
        orig_pref = trip.route.origem.nome[:3].upper()
        dest_pref = trip.route.destino.nome[:3].upper()
        date_stamp = timezone.now().strftime('%Y%m%d')
        random_hex = ''.join(random.choices('0123456789ABCDEF', k=6))
        code = f"RES-{orig_pref}-{dest_pref}-{date_stamp}-{random_hex}"

        # 1. Save Reservation
        reservation = Reservation.objects.create(
            codigo_reserva=code,
            user=passenger_user,
            trip=trip,
            status='CONFIRMADA',
            total=trip.preco_ida
        )

        # 2. Save ReservationSeat
        ReservationSeat.objects.create(
            reservation=reservation,
            seat=seat_obj
        )

        # 3. Save Payment
        method_map = {
            'Multicaixa Express': 'MULTICAIXA',
            'Unitel Money': 'UNITEL_MONEY',
            'PayPay': 'PAYPAY',
            'Pagamento por referência': 'MULTICAIXA',
        }
        metodo = method_map.get(payment_method, 'MULTICAIXA')
        Payment.objects.create(
            reservation=reservation,
            metodo=metodo,
            status='PAGO',
            referencia=f"REF-{code}-{random_hex}",
            valor=trip.preco_ida
        )

        # 4. Save Ticket (QR/Token)
        Ticket.objects.create(
            reservation=reservation,
            qr_code=f"nzila-qr-code-{code}",
            token=f"nzila-token-{code}-{random_hex}",
            usado=False
        )

        # 5. Save Notification
        Notification.objects.create(
            user=passenger_user,
            tipo='CONFIRMACAO',
            mensagem=f"Reserva {code} confirmada. Viagem de {trip.route.origem.nome} para {trip.route.destino.nome}.",
            enviado=True
        )

        serializer = ReservationSerializer(reservation)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

@api_view(['GET'])
@permission_classes([AllowAny])
def reservation_details(request, pk):
    try:
        reservation = Reservation.objects.get(codigo_reserva__iexact=pk.strip())
    except Reservation.DoesNotExist:
        try:
            if pk.strip().isdigit():
                reservation = Reservation.objects.get(id=int(pk.strip()))
            else:
                raise Reservation.DoesNotExist()
        except Reservation.DoesNotExist:
            return Response({'error': 'Reserva não encontrada.'}, status=status.HTTP_404_NOT_FOUND)

    serializer = ReservationSerializer(reservation)
    return Response(serializer.data, status=status.HTTP_200_OK)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def cancel_reservation(request, pk):
    try:
        reservation = Reservation.objects.get(codigo_reserva__iexact=pk.strip())
    except Reservation.DoesNotExist:
        try:
            if pk.strip().isdigit():
                reservation = Reservation.objects.get(id=int(pk.strip()))
            else:
                raise Reservation.DoesNotExist()
        except Reservation.DoesNotExist:
            return Response({'error': 'Reserva não encontrada.'}, status=status.HTTP_404_NOT_FOUND)

    if reservation.user.email != request.user.email and not getattr(request.user.profile, 'role', '') == 'ADMIN':
        return Response({'error': 'Não tem permissão para cancelar este bilhete.'}, status=status.HTTP_403_FORBIDDEN)

    if reservation.status == 'CANCELADA':
        return Response({'error': 'Este bilhete já está cancelado.'}, status=status.HTTP_400_BAD_REQUEST)

    reservation.status = 'CANCELADA'
    reservation.save()

    # Save cancel notification
    Notification.objects.create(
        user=reservation.user,
        tipo='CANCELAMENTO',
        mensagem=f"A sua reserva {reservation.codigo_reserva} foi cancelada.",
        enviado=True
    )

    return Response({'success': 'Reserva cancelada com sucesso.'}, status=status.HTTP_200_OK)

# ----------------------------------------------------
# Boarding Validation (Fiscais)
# ----------------------------------------------------
@api_view(['POST'])
@permission_classes([AllowAny])
def scan_ticket(request):
    code = request.data.get('code')
    if not code:
        return Response({'error': 'Código de bilhete em falta.'}, status=status.HTTP_400_BAD_REQUEST)

    ticket_obj = None
    try:
        ticket_obj = Ticket.objects.get(token__iexact=code.strip())
        res = ticket_obj.reservation
    except Ticket.DoesNotExist:
        try:
            res = Reservation.objects.get(codigo_reserva__iexact=code.strip())
            ticket_obj = res.tickets.first()
        except Reservation.DoesNotExist:
            return Response({'status': 'INVALID', 'error': 'Bilhete não encontrado.'}, status=status.HTTP_200_OK)

    if res.status == 'CANCELADA':
        return Response({'status': 'INVALID', 'error': 'Este bilhete está cancelado.'}, status=status.HTTP_200_OK)
    
    if res.status == 'EMBARCADO' or (ticket_obj and ticket_obj.usado):
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

    ticket_obj = None
    try:
        ticket_obj = Ticket.objects.get(token__iexact=code.strip())
        res = ticket_obj.reservation
    except Ticket.DoesNotExist:
        try:
            res = Reservation.objects.get(codigo_reserva__iexact=code.strip())
            ticket_obj = res.tickets.first()
        except Reservation.DoesNotExist:
            return Response({'error': 'Bilhete não encontrado.'}, status=status.HTTP_404_NOT_FOUND)

    if res.status == 'EMBARCADO' or (ticket_obj and ticket_obj.usado):
        return Response({'error': 'Bilhete já utilizado.'}, status=status.HTTP_400_BAD_REQUEST)

    if res.status == 'CANCELADA':
        return Response({'error': 'Este bilhete está cancelado.'}, status=status.HTTP_400_BAD_REQUEST)

    now = timezone.now()
    res.status = 'EMBARCADO'
    res.save()

    # Update Ticket to usado
    if ticket_obj:
        ticket_obj.usado = True
        ticket_obj.data_validacao = now
        ticket_obj.save()

    serializer = ReservationSerializer(res)
    return Response({
        'success': 'Embarque confirmado com sucesso.',
        'ticket': serializer.data
    }, status=status.HTTP_200_OK)

# ----------------------------------------------------
# Administrative Stats & CRUD
# ----------------------------------------------------
@api_view(['GET'])
@permission_classes([AllowAny])
def admin_stats(request):
    revenue = Reservation.objects.exclude(status='CANCELADA').aggregate(Sum('total'))['total__sum'] or 0
    total_sales = Reservation.objects.count()
    active_sales = Reservation.objects.exclude(status='CANCELADA').count()
    
    today_str = timezone.now().date()
    today_res = Reservation.objects.filter(created_at__date=today_str)
    today_count = today_res.count()
    today_revenue = today_res.exclude(status='CANCELADA').aggregate(Sum('total'))['total__sum'] or 0

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
    reservations = Reservation.objects.all().order_by('-created_at')
    serializer = ReservationSerializer(reservations, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)

# ----------------------------------------------------
# Locations CRUD (Administrative)
# ----------------------------------------------------
@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def manage_locations(request):
    if request.method == 'GET':
        locations = Location.objects.all().order_by('nome')
        serializer = LocationSerializer(locations, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    elif request.method == 'POST':
        serializer = LocationSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([AllowAny])
def location_detail(request, pk):
    try:
        location = Location.objects.get(pk=pk)
    except Location.DoesNotExist:
        return Response({'error': 'Localização não encontrada.'}, status=status.HTTP_404_NOT_FOUND)
    
    if request.method == 'GET':
        serializer = LocationSerializer(location)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    elif request.method == 'PUT':
        serializer = LocationSerializer(location, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
    elif request.method == 'DELETE':
        location.delete()
        return Response({'success': 'Localização removida com sucesso.'}, status=status.HTTP_200_OK)

# ----------------------------------------------------
# Carrier Registration & Approvals (Multi-step Flow)
# ----------------------------------------------------
from django.contrib.auth.hashers import make_password

@api_view(['POST'])
@permission_classes([AllowAny])
def register_carrier(request):
    data = request.data
    nome = data.get('nome')
    nif = data.get('nif')
    email = data.get('email')
    telefone = data.get('telefone')
    endereco = data.get('endereco', '')
    provincia = data.get('provincia', '')
    municipio = data.get('municipio', '')
    tipo_empresa = data.get('tipo_empresa', 'Lda')
    ano_fundacao = data.get('ano_fundacao')
    
    resp_nome = data.get('resp_nome')
    resp_cargo = data.get('resp_cargo', 'Gerente')
    resp_doc = data.get('resp_doc', '')
    resp_telefone = data.get('resp_telefone', '')
    resp_email = data.get('resp_email')
    resp_password = data.get('resp_password')

    if not nome or not nif or not email or not resp_email or not resp_password:
        return Response({'error': 'Preencha os campos obrigatórios da empresa e do responsável.'}, status=status.HTTP_400_BAD_REQUEST)

    if Company.objects.filter(nif=nif).exists():
        return Response({'error': 'Já existe uma empresa registada com este NIF.'}, status=status.HTTP_400_BAD_REQUEST)
        
    if User.objects.filter(username=resp_email).exists():
        return Response({'error': 'Este email de responsável já está registado no sistema.'}, status=status.HTTP_400_BAD_REQUEST)

    # Process base64 logo
    import base64
    import time
    from django.core.files.base import ContentFile
    from django.core.files.storage import default_storage

    logo_url = data.get('logo_url')
    saved_logo_file = None
    saved_logo_url = None

    if logo_url and logo_url.startswith('data:'):
        try:
            parts = logo_url.split(';base64,')
            if len(parts) == 2:
                format_part, data_str = parts
                ext = 'png'
                if 'jpg' in format_part.lower() or 'jpeg' in format_part.lower():
                    ext = 'jpg'
                elif 'gif' in format_part.lower():
                    ext = 'gif'
                
                data_bytes = base64.b64decode(data_str)
                filename = f"company_logos/logo_{int(time.time())}.{ext}"
                file_path = default_storage.save(filename, ContentFile(data_bytes))
                saved_logo_url = f"/media/{file_path}"
                saved_logo_file = file_path
        except Exception as e:
            print(f"Error saving base64 company logo: {e}")

    # 1. Create Company (PENDENTE)
    company = Company.objects.create(
        nome=nome,
        nif=nif,
        email=email,
        telefone=telefone,
        endereco=endereco,
        provincia=provincia,
        municipio=municipio,
        tipo_empresa=tipo_empresa,
        ano_fundacao=int(ano_fundacao) if ano_fundacao else None,
        status='PENDENTE',
        code=nome.replace(" ", "").upper()[:8],
        logo_url=saved_logo_url or logo_url or 'https://images.unsplash.com/photo-1557683316-973673baf926?w=150&auto=format&fit=crop&q=60',
        logo=saved_logo_file
    )

    # 2. Create Django Auth User & UserProfile
    user = User.objects.create_user(
        username=resp_email,
        email=resp_email,
        password=resp_password,
        first_name=resp_nome.split(' ')[0],
        last_name=resp_nome.split(' ')[1] if ' ' in resp_nome else ''
    )
    
    UserProfile.objects.create(
        user=user,
        nome=resp_nome,
        email=resp_email,
        telefone=resp_telefone,
        document=resp_doc,
        role='OPERADOR',
        company=company
    )

    # 3. Create CompanyAdmin record
    CompanyAdmin.objects.create(
        company=company,
        nome=resp_nome,
        email=resp_email,
        telefone=resp_telefone,
        password=make_password(resp_password),
        cargo=resp_cargo,
        documento_identificacao=resp_doc
    )

    # Create notifications for all admin users in the database
    admins = UserProfile.objects.filter(role='ADMIN')
    for admin_profile in admins:
        Notification.objects.create(
            user=admin_profile.user,
            tipo='CONFIRMACAO',
            mensagem=f"Nova candidatura: A transportadora '{company.nome}' (NIF: {company.nif}) registou-se no sistema e aguarda validação.",
            enviado=True
        )

    # Create confirmation notification for the registered operator
    Notification.objects.create(
        user=user,
        tipo='CONFIRMACAO',
        mensagem=f"Candidatura submetida: O registo da sua transportadora '{company.nome}' foi recebido e aguarda validação administrativa.",
        enviado=True
    )

    # 4. Generate simulated 6-digit OTP code
    otp_code = str(random.randint(100000, 999999))

    # Send actual email to the operator with registration confirmation and OTP code
    try:
        subject = "Candidatura Nzila - Código de Verificação"
        message = (
            f"Olá {resp_nome},\n\n"
            f"A candidatura da sua transportadora '{company.nome}' foi registada com sucesso no sistema Nzila.\n"
            f"Para concluir a verificação de segurança, insira o seguinte código no formulário de registo:\n\n"
            f"Código OTP: {otp_code}\n\n"
            f"Após a verificação, a sua documentação será analisada pelos nossos administradores.\n\n"
            f"Melhores cumprimentos,\n"
            f"Equipa Nzila"
        )
        from_email = settings.DEFAULT_FROM_EMAIL
        send_mail(subject, message, from_email, [resp_email], fail_silently=False)
    except Exception as e:
        print(f"Erro ao enviar e-mail de confirmação: {e}")

    return Response({
        'success': 'Registo da transportadora criado. Conclua a verificação OTP.',
        'company_id': company.id,
        'otp': otp_code
    }, status=status.HTTP_201_CREATED)

@api_view(['POST'])
@permission_classes([AllowAny])
def verify_carrier_otp(request):
    otp = request.data.get('otp')
    if not otp:
        return Response({'error': 'Introduza o código OTP.'}, status=status.HTTP_400_BAD_REQUEST)
    
    # In simulation, accept any OTP if it is 6 digits
    if len(str(otp)) == 6:
        return Response({'success': 'Contacto verificado com sucesso.'}, status=status.HTTP_200_OK)
    return Response({'error': 'Código OTP inválido.'}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([AllowAny])
def upload_carrier_document(request):
    import base64
    import time
    from django.core.files.base import ContentFile
    from django.core.files.storage import default_storage

    data = request.data
    company_id = data.get('company_id')
    tipo = data.get('tipo')
    arquivo_url = data.get('arquivo_url')

    if not company_id or not tipo or not arquivo_url:
        return Response({'error': 'Dados em falta para envio do documento.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        company = Company.objects.get(pk=company_id)
    except Company.DoesNotExist:
        return Response({'error': 'Transportadora não encontrada.'}, status=status.HTTP_404_NOT_FOUND)

    # Convert base64 data URL to media file if applicable
    if arquivo_url.startswith('data:'):
        try:
            parts = arquivo_url.split(';base64,')
            if len(parts) == 2:
                format_part, data_str = parts
                ext = 'pdf'
                if 'png' in format_part.lower():
                    ext = 'png'
                elif 'jpg' in format_part.lower() or 'jpeg' in format_part.lower():
                    ext = 'jpg'
                
                data_bytes = base64.b64decode(data_str)
                filename = f"company_docs/company_{company_id}_{tipo}_{int(time.time())}.{ext}"
                file_path = default_storage.save(filename, ContentFile(data_bytes))
                arquivo_url = f"/media/{file_path}"
        except Exception as e:
            print(f"Error saving base64 document: {e}")

    doc = CompanyDocument.objects.create(
        company=company,
        tipo=tipo,
        arquivo_url=arquivo_url,
        aprovado=False
    )
    
    serializer = CompanyDocumentSerializer(doc)
    return Response(serializer.data, status=status.HTTP_201_CREATED)

@api_view(['POST'])
@permission_classes([AllowAny])
def admin_review_carrier(request):
    data = request.data
    company_id = data.get('company_id')
    status_choice = data.get('status')
    motivo = data.get('motivo_rejeicao', '')

    if not company_id or not status_choice:
        return Response({'error': 'Indique a transportadora e o estado pretendido.'}, status=status.HTTP_400_BAD_REQUEST)

    if status_choice not in ['APROVADA', 'REJEITADA', 'SUSPENSA']:
        return Response({'error': 'Estado inválido.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        company = Company.objects.get(pk=company_id)
    except Company.DoesNotExist:
        return Response({'error': 'Transportadora não encontrada.'}, status=status.HTTP_404_NOT_FOUND)

    company.status = status_choice
    company.motivo_rejeicao = motivo
    company.save()

    # Create notifications for operators associated with the company
    profiles = company.profiles.all()
    for profile in profiles:
        Notification.objects.create(
            user=profile.user,
            tipo='CONFIRMACAO' if status_choice == 'APROVADA' else 'CANCELAMENTO',
            mensagem=f"A sua transportadora '{company.nome}' foi {status_choice.lower()} pelo administrador. Motivo: {motivo if motivo else 'Sem observações.'}",
            enviado=True
        )

        # Send actual email to the operator indicating status review
        try:
            subject = f"Candidatura Nzila - Transportadora {status_choice.capitalize()}"
            message = (
                f"Olá {profile.nome},\n\n"
                f"A sua candidatura/conta para a transportadora '{company.nome}' foi avaliada pelo administrador.\n"
                f"O estado atual da sua empresa é: {status_choice}.\n"
                f"Motivo / Observações: {motivo if motivo else 'Sem observações adicionais.'}\n\n"
                f"Se a candidatura foi APROVADA, já pode fazer login na sua conta para configurar as suas frotas, rotas e viagens.\n\n"
                f"Melhores cumprimentos,\n"
                f"Equipa Nzila"
            )
            from_email = settings.DEFAULT_FROM_EMAIL
            send_mail(subject, message, from_email, [profile.email], fail_silently=False)
        except Exception as e:
            print(f"Erro ao enviar e-mail de revisão da transportadora: {e}")

    # Approve all documents if company is approved
    if status_choice == 'APROVADA':
        company.documents.all().update(aprovado=True)

    return Response({'success': f"Estado da transportadora alterado para {status_choice}."}, status=status.HTTP_200_OK)

@api_view(['GET'])
@permission_classes([AllowAny])
def admin_list_carriers(request):
    companies = Company.objects.all().prefetch_related('documents', 'admins').order_by('-created_at')
    
    result = []
    for c in companies:
        c_data = CompanySerializer(c).data
        c_data['documents'] = CompanyDocumentSerializer(c.documents.all(), many=True).data
        c_data['admins'] = CompanyAdminSerializer(c.admins.all(), many=True).data
        result.append(c_data)
        
    return Response(result, status=status.HTTP_200_OK)

# ----------------------------------------------------
# Carrier Operations Management (Buses, Routes, Trips)
# ----------------------------------------------------

@api_view(['GET', 'PUT'])
@permission_classes([AllowAny])
def carrier_info(request):
    company_id = request.query_params.get('company_id')
    if not company_id and request.user.is_authenticated:
        company_id = getattr(getattr(request.user, 'profile', None), 'company_id', None)
        
    if not company_id:
        return Response({'error': 'Identificação da transportadora em falta.'}, status=status.HTTP_400_BAD_REQUEST)
        
    try:
        company = Company.objects.get(pk=company_id)
    except Company.DoesNotExist:
        return Response({'error': 'Transportadora não encontrada.'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        serializer = CompanySerializer(company)
        return Response(serializer.data, status=status.HTTP_200_OK)
        
    elif request.method == 'PUT':
        data = request.data
        company.descricao = data.get('descricao', company.descricao)
        company.politica_cancelamento = data.get('politica_cancelamento', company.politica_cancelamento)
        company.save()
        serializer = CompanySerializer(company)
        return Response(serializer.data, status=status.HTTP_200_OK)

@api_view(['GET', 'POST', 'PUT', 'DELETE'])
@permission_classes([AllowAny])
def carrier_manage_buses(request, pk=None):
    company_id = request.data.get('company_id') or request.query_params.get('company_id')
    if not company_id and request.user.is_authenticated:
        company_id = getattr(getattr(request.user, 'profile', None), 'company_id', None)

    if request.method == 'GET':
        if not company_id:
            buses = Bus.objects.all()
        else:
            buses = Bus.objects.filter(empresa_id=company_id)
        serializer = BusSerializer(buses, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    if not company_id:
        return Response({'error': 'Identificação da transportadora em falta.'}, status=status.HTTP_400_BAD_REQUEST)

    if request.method == 'POST':
        modelo = request.data.get('modelo')
        matricula = request.data.get('matricula', '')
        colunas_esquerda = int(request.data.get('colunas_esquerda', 2))
        colunas_direita = int(request.data.get('colunas_direita', 2))
        linhas = int(request.data.get('linhas', 11))
        capacidade = (colunas_esquerda + colunas_direita) * linhas
        
        if not modelo:
            return Response({'error': 'Preencha o modelo do autocarro.'}, status=status.HTTP_400_BAD_REQUEST)
        if colunas_esquerda < 1 or colunas_direita < 1 or linhas < 1:
            return Response({'error': 'Configuração de assentos inválida.'}, status=status.HTTP_400_BAD_REQUEST)
            
        bus = Bus.objects.create(
            empresa_id=company_id,
            modelo=modelo,
            matricula=matricula,
            capacidade=capacidade,
            colunas_esquerda=colunas_esquerda,
            colunas_direita=colunas_direita,
            linhas=linhas
        )
        
        # Generate seats from layout: left columns first (A, B...), then right columns
        left_letters = [chr(65 + i) for i in range(colunas_esquerda)]
        right_letters = [chr(65 + colunas_esquerda + i) for i in range(colunas_direita)]
        all_letters = left_letters + right_letters  # e.g. ['A','B','C','D']
        
        seats_to_create = []
        for row in range(1, linhas + 1):
            for letter in all_letters:
                seats_to_create.append(Seat(bus=bus, numero=f"{row:02d}{letter}"))
        Seat.objects.bulk_create(seats_to_create)
        
        serializer = BusSerializer(bus)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    elif request.method == 'PUT':
        try:
            bus = Bus.objects.get(pk=pk, empresa_id=company_id)
        except Bus.DoesNotExist:
            return Response({'error': 'Autocarro não encontrado.'}, status=status.HTTP_404_NOT_FOUND)
            
        bus.modelo = request.data.get('modelo', bus.modelo)
        bus.matricula = request.data.get('matricula', bus.matricula)
        
        # Check if layout is changing
        new_col_esq = request.data.get('colunas_esquerda')
        new_col_dir = request.data.get('colunas_direita')
        new_linhas = request.data.get('linhas')
        
        layout_changed = (
            (new_col_esq is not None and int(new_col_esq) != bus.colunas_esquerda) or
            (new_col_dir is not None and int(new_col_dir) != bus.colunas_direita) or
            (new_linhas is not None and int(new_linhas) != bus.linhas)
        )
        
        if layout_changed:
            bus.colunas_esquerda = int(new_col_esq) if new_col_esq else bus.colunas_esquerda
            bus.colunas_direita = int(new_col_dir) if new_col_dir else bus.colunas_direita
            bus.linhas = int(new_linhas) if new_linhas else bus.linhas
            bus.capacidade = (bus.colunas_esquerda + bus.colunas_direita) * bus.linhas
            
            bus.seats.all().delete()
            left_letters = [chr(65 + i) for i in range(bus.colunas_esquerda)]
            right_letters = [chr(65 + bus.colunas_esquerda + i) for i in range(bus.colunas_direita)]
            all_letters = left_letters + right_letters
            seats_to_create = []
            for row in range(1, bus.linhas + 1):
                for letter in all_letters:
                    seats_to_create.append(Seat(bus=bus, numero=f"{row:02d}{letter}"))
            Seat.objects.bulk_create(seats_to_create)
            
        bus.save()
        serializer = BusSerializer(bus)
        return Response(serializer.data, status=status.HTTP_200_OK)

    elif request.method == 'DELETE':
        try:
            bus = Bus.objects.get(pk=pk, empresa_id=company_id)
        except Bus.DoesNotExist:
            return Response({'error': 'Autocarro não encontrado.'}, status=status.HTTP_404_NOT_FOUND)
            
        if bus.trips.filter(status='ATIVA').exists():
            return Response({'error': 'Não pode eliminar um autocarro com viagens ativas vinculadas.'}, status=status.HTTP_400_BAD_REQUEST)
            
        bus.delete()
        return Response({'success': 'Autocarro removido com sucesso.'}, status=status.HTTP_200_OK)

@api_view(['GET', 'POST', 'PUT', 'DELETE'])
@permission_classes([AllowAny])
def carrier_manage_routes(request, pk=None):
    if request.method == 'GET':
        routes = Route.objects.all().order_by('origem__nome')
        serializer = RouteSerializer(routes, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    elif request.method == 'POST':
        origem_id = request.data.get('origem_id')
        destino_id = request.data.get('destino_id')
        distancia = request.data.get('distancia_km')
        duracao = request.data.get('duracao_estimada')

        if not origem_id or not destino_id or not distancia or not duracao:
            return Response({'error': 'Preencha todos os campos da rota.'}, status=status.HTTP_400_BAD_REQUEST)

        if str(origem_id) == str(destino_id):
            return Response({'error': 'A origem e o destino da rota devem ser diferentes.'}, status=status.HTTP_400_BAD_REQUEST)

        if Route.objects.filter(origem_id=origem_id, destino_id=destino_id).exists():
            return Response({'error': 'Esta rota já se encontra registada.'}, status=status.HTTP_400_BAD_REQUEST)

        h, m = map(int, duracao.split(':'))
        route = Route.objects.create(
            origem_id=origem_id,
            destino_id=destino_id,
            distancia_km=float(distancia),
            duracao_estimada=datetime.time(h, m)
        )
        serializer = RouteSerializer(route)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    elif request.method == 'PUT':
        try:
            route = Route.objects.get(pk=pk)
        except Route.DoesNotExist:
            return Response({'error': 'Rota não encontrada.'}, status=status.HTTP_404_NOT_FOUND)

        distancia = request.data.get('distancia_km')
        duracao = request.data.get('duracao_estimada')

        if distancia:
            route.distancia_km = float(distancia)
        if duracao:
            h, m = map(int, duracao.split(':'))
            route.duracao_estimada = datetime.time(h, m)
        
        route.save()
        serializer = RouteSerializer(route)
        return Response(serializer.data, status=status.HTTP_200_OK)

    elif request.method == 'DELETE':
        try:
            route = Route.objects.get(pk=pk)
        except Route.DoesNotExist:
            return Response({'error': 'Rota não encontrada.'}, status=status.HTTP_404_NOT_FOUND)
            
        route.delete()
        return Response({'success': 'Rota removida com sucesso.'}, status=status.HTTP_200_OK)

@api_view(['GET', 'POST', 'PUT', 'DELETE'])
@permission_classes([AllowAny])
def carrier_manage_trips(request, pk=None):
    company_id = request.data.get('company_id') or request.query_params.get('company_id')
    if not company_id and request.user.is_authenticated:
        company_id = getattr(getattr(request.user, 'profile', None), 'company_id', None)

    if request.method == 'GET':
        if not company_id:
            trips = Trip.objects.all().order_by('-data_saida', '-hora_saida')
        else:
            trips = Trip.objects.filter(empresa_id=company_id).order_by('-data_saida', '-hora_saida')
        serializer = TripSerializer(trips, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    if not company_id:
        return Response({'error': 'Identificação da transportadora em falta.'}, status=status.HTTP_400_BAD_REQUEST)

    if request.method == 'POST':
        route_id = request.data.get('route_id')
        bus_id = request.data.get('bus_id')
        data_saida_str = request.data.get('data_saida')
        hora_saida_str = request.data.get('hora_saida')
        hora_chegada_str = request.data.get('hora_chegada')
        preco_ida = request.data.get('preco_ida')
        preco_ida_volta = request.data.get('preco_ida_volta')
        classe = request.data.get('classe')

        if not bus_id:
            return Response({'error': 'Não é permitido criar viagens sem associar um autocarro.'}, status=status.HTTP_400_BAD_REQUEST)
        
        if not route_id or not data_saida_str or not hora_saida_str or not hora_chegada_str or not preco_ida or not classe:
            return Response({'error': 'Preencha todos os campos obrigatórios da viagem.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            bus = Bus.objects.get(pk=bus_id, empresa_id=company_id)
        except Bus.DoesNotExist:
            return Response({'error': 'O autocarro selecionado não pertence a esta transportadora.'}, status=status.HTTP_400_BAD_REQUEST)

        data_saida = datetime.datetime.strptime(data_saida_str, '%Y-%m-%d').date()
        hs = datetime.datetime.strptime(hora_saida_str, '%H:%M').time()
        hc = datetime.datetime.strptime(hora_chegada_str, '%H:%M').time()

        if Trip.objects.filter(bus=bus, data_saida=data_saida, hora_saida=hs, status='ATIVA').exists():
            return Response({'error': 'Este autocarro já se encontra escalado para outra viagem nesta mesma hora.'}, status=status.HTTP_400_BAD_REQUEST)

        trip = Trip.objects.create(
            empresa_id=company_id,
            route_id=route_id,
            bus=bus,
            data_saida=data_saida,
            hora_saida=hs,
            hora_chegada=hc,
            preco_ida=float(preco_ida),
            preco_ida_volta=float(preco_ida_volta) if preco_ida_volta else None,
            classe=classe.upper(),
            status='ATIVA'
        )

        serializer = TripSerializer(trip)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    elif request.method == 'PUT':
        try:
            trip = Trip.objects.get(pk=pk, empresa_id=company_id)
        except Trip.DoesNotExist:
            return Response({'error': 'Viagem não encontrada.'}, status=status.HTTP_404_NOT_FOUND)

        preco_ida = request.data.get('preco_ida')
        preco_ida_volta = request.data.get('preco_ida_volta')
        trip_status = request.data.get('status')

        if preco_ida:
            trip.preco_ida = float(preco_ida)
        if preco_ida_volta:
            trip.preco_ida_volta = float(preco_ida_volta)
        if trip_status:
            if trip_status.upper() in ['ATIVA', 'CANCELADA']:
                trip.status = trip_status.upper()
                
                if trip_status.upper() == 'CANCELADA':
                    active_res = trip.reservations.filter(status='CONFIRMADA')
                    for res in active_res:
                        res.status = 'CANCELADA'
                        res.save()
                        Notification.objects.create(
                            user=res.user,
                            tipo='CANCELAMENTO',
                            mensagem=f"A sua viagem da reserva '{res.codigo_reserva}' foi cancelada pela transportadora. O reembolso será processado.",
                            enviado=True
                        )
                        
        trip.save()
        serializer = TripSerializer(trip)
        return Response(serializer.data, status=status.HTTP_200_OK)

    elif request.method == 'DELETE':
        try:
            trip = Trip.objects.get(pk=pk, empresa_id=company_id)
        except Trip.DoesNotExist:
            return Response({'error': 'Viagem não encontrada.'}, status=status.HTTP_404_NOT_FOUND)
            
        if trip.reservations.exists():
            return Response({'error': 'Não pode apagar viagens com reservas efetuadas. Cancele-a em vez disso.'}, status=status.HTTP_400_BAD_REQUEST)

        trip.delete()
        return Response({'success': 'Viagem eliminada com sucesso.'}, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([AllowAny])
def list_notifications(request):
    user_email = request.query_params.get('email')
    
    if request.user.is_authenticated:
        notifications = Notification.objects.filter(user=request.user)
    elif user_email:
        try:
            user = User.objects.get(email=user_email)
            notifications = Notification.objects.filter(user=user)
        except User.DoesNotExist:
            return Response([], status=status.HTTP_200_OK)
    else:
        return Response({'error': 'Falta identificação do utilizador (autenticação ou email).'}, status=status.HTTP_400_BAD_REQUEST)
        
    notifications = notifications.order_by('-created_at')
    serializer = NotificationSerializer(notifications, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([AllowAny])
def mark_notification_read(request, pk):
    try:
        # pk can be passed as db-XX in frontend, let's strip db- if present
        pk_str = str(pk)
        if pk_str.startswith('db-'):
            pk_val = int(pk_str.replace('db-', ''))
        else:
            pk_val = int(pk_str)
            
        notification = Notification.objects.get(pk=pk_val)
        notification.lida = True
        notification.save()
        return Response({'success': 'Notificação marcada como lida.'}, status=status.HTTP_200_OK)
    except (Notification.DoesNotExist, ValueError):
        return Response({'error': 'Notificação não encontrada.'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
@permission_classes([AllowAny])
def mark_all_notifications_read(request):
    user_email = request.data.get('email')
    
    if request.user.is_authenticated:
        Notification.objects.filter(user=request.user, lida=False).update(lida=True)
        return Response({'success': 'Todas as notificações marcadas como lidas.'}, status=status.HTTP_200_OK)
    elif user_email:
        try:
            user = User.objects.get(email=user_email)
            Notification.objects.filter(user=user, lida=False).update(lida=True)
            return Response({'success': 'Todas as notificações marcadas como lidas.'}, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response({'error': 'Utilizador não encontrado.'}, status=status.HTTP_404_NOT_FOUND)
    else:
        return Response({'error': 'Falta identificação do utilizador.'}, status=status.HTTP_400_BAD_REQUEST)



@api_view(['POST'])
@permission_classes([AllowAny])
def resend_carrier_otp(request):
    email = request.data.get('email')
    if not email:
        return Response({'error': 'Indique o email do responsável.'}, status=status.HTTP_400_BAD_REQUEST)
        
    try:
        admin = CompanyAdmin.objects.get(email=email)
        company = admin.company
    except CompanyAdmin.DoesNotExist:
        return Response({'error': 'Responsável não encontrado.'}, status=status.HTTP_404_NOT_FOUND)

    otp_code = str(random.randint(100000, 999999))
    
    try:
        subject = "Candidatura Nzila - Reenvio de Código de Verificação"
        message = (
            f"Olá {admin.nome},\n\n"
            f"Conforme solicitado, reenviamos o seu código de verificação para a transportadora '{company.nome}'.\n\n"
            f"Novo Código OTP: {otp_code}\n\n"
            f"Insira este código no formulário para concluir a validação.\n\n"
            f"Melhores cumprimentos,\n"
            f"Equipa Nzila"
        )
        from_email = settings.DEFAULT_FROM_EMAIL
        send_mail(subject, message, from_email, [email], fail_silently=False)
    except Exception as e:
        print(f"Erro ao reenviar e-mail de confirmação: {e}")
        
    return Response({
        'success': 'Código OTP reenviado com sucesso.',
        'otp': otp_code
    }, status=status.HTTP_200_OK)


# ----------------------------------------------------
# Dynamic Popular Routes & Transport Companies views
# ----------------------------------------------------

@api_view(['GET'])
@permission_classes([AllowAny])
def public_popular_routes(request):
    routes = PopularRoute.objects.all().order_by('-created_at')
    serializer = PopularRouteSerializer(routes, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)

@api_view(['GET'])
@permission_classes([AllowAny])
def public_carriers(request):
    companies = Company.objects.filter(status='APROVADA').order_by('-created_at')
    serializer = CompanySerializer(companies, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)

@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def manage_popular_routes(request):
    if request.method == 'GET':
        routes = PopularRoute.objects.all().order_by('-created_at')
        serializer = PopularRouteSerializer(routes, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    elif request.method == 'POST':
        data = request.data
        origem_id = data.get('origem')
        destino_id = data.get('destino')
        preco_desde = data.get('preco_desde')
        duracao = data.get('duracao', '8h 30min')
        frequencia = data.get('frequencia', 'Diário')
        trending = data.get('trending')
        
        # trending can be sent as string "true" or "false" from FormData
        if isinstance(trending, str):
            trending = trending.lower() == 'true'
        elif trending is None:
            trending = True

        imagem = request.FILES.get('imagem')

        if not origem_id or not destino_id or not preco_desde:
            return Response({'error': 'Origem, destino e preço são obrigatórios.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            origem = Location.objects.get(pk=origem_id)
            destino = Location.objects.get(pk=destino_id)
        except Location.DoesNotExist:
            return Response({'error': 'Origem ou destino não encontrados.'}, status=status.HTTP_400_BAD_REQUEST)

        popular_route = PopularRoute.objects.create(
            origem=origem,
            destino=destino,
            preco_desde=float(preco_desde),
            duracao=duracao,
            frequencia=frequencia,
            trending=trending,
            imagem=imagem
        )
        serializer = PopularRouteSerializer(popular_route)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([AllowAny])
def popular_route_detail(request, pk):
    try:
        popular_route = PopularRoute.objects.get(pk=pk)
    except PopularRoute.DoesNotExist:
        return Response({'error': 'Rota popular não encontrada.'}, status=status.HTTP_404_NOT_FOUND)
    
    if request.method == 'GET':
        serializer = PopularRouteSerializer(popular_route)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    elif request.method == 'PUT':
        data = request.data
        origem_id = data.get('origem')
        destino_id = data.get('destino')
        preco_desde = data.get('preco_desde')
        duracao = data.get('duracao')
        frequencia = data.get('frequencia')
        trending = data.get('trending')
        imagem = request.FILES.get('imagem')

        if origem_id:
            try:
                popular_route.origem = Location.objects.get(pk=origem_id)
            except Location.DoesNotExist:
                return Response({'error': 'Origem não encontrada.'}, status=status.HTTP_400_BAD_REQUEST)
        if destino_id:
            try:
                popular_route.destino = Location.objects.get(pk=destino_id)
            except Location.DoesNotExist:
                return Response({'error': 'Destino não encontrado.'}, status=status.HTTP_400_BAD_REQUEST)
        
        if preco_desde:
            popular_route.preco_desde = float(preco_desde)
        if duracao:
            popular_route.duracao = duracao
        if frequencia:
            popular_route.frequencia = frequencia
        
        if trending is not None:
            if isinstance(trending, str):
                popular_route.trending = trending.lower() == 'true'
            else:
                popular_route.trending = bool(trending)
                
        if imagem:
            popular_route.imagem = imagem
        
        popular_route.save()
        serializer = PopularRouteSerializer(popular_route)
        return Response(serializer.data, status=status.HTTP_200_OK)
        
    elif request.method == 'DELETE':
        popular_route.delete()
        return Response({'success': 'Rota popular removida com sucesso.'}, status=status.HTTP_200_OK)

@api_view(['POST'])
@permission_classes([AllowAny])
def upload_company_logo(request):
    company_id = request.data.get('company_id')
    logo = request.FILES.get('logo')

    if not company_id or not logo:
        return Response({'error': 'ID da transportadora e imagem são obrigatórios.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        company = Company.objects.get(pk=company_id)
    except Company.DoesNotExist:
        return Response({'error': 'Transportadora não encontrada.'}, status=status.HTTP_404_NOT_FOUND)

    company.logo = logo
    company.save()
    
    # Mirror logo file URL to logo_url for absolute backward compatibility
    company.logo_url = company.logo.url
    company.save()

    serializer = CompanySerializer(company)
    return Response(serializer.data, status=status.HTTP_200_OK)


# ----------------------------------------------------
# Carrier Fiscais Management (Inspectors)
# ----------------------------------------------------
@api_view(['GET', 'POST', 'PUT', 'DELETE'])
@permission_classes([AllowAny])
def carrier_manage_fiscais(request, pk=None):
    """CRUD para fiscais da transportadora"""
    company_id = request.data.get('company_id') or request.query_params.get('company_id')
    if not company_id and request.user.is_authenticated:
        company_id = getattr(getattr(request.user, 'profile', None), 'company_id', None)

    if not company_id:
        return Response({'error': 'Identificação da transportadora em falta.'}, status=status.HTTP_400_BAD_REQUEST)

    if request.method == 'GET':
        fiscais = UserProfile.objects.filter(company_id=company_id, role='FISCAL').order_by('nome')
        serializer = FiscalSerializer(fiscais, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    if request.method == 'POST':
        nome = request.data.get('nome', '').strip()
        email = request.data.get('email', '').strip()
        telefone = request.data.get('telefone', '')
        document = request.data.get('document', '')
        password = request.data.get('password', '')

        if not nome or not email or not password:
            return Response({'error': 'Nome, email e palavra-passe são obrigatórios.'}, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(username=email).exists():
            return Response({'error': 'Já existe um utilizador com este email.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            company = Company.objects.get(pk=company_id)
        except Company.DoesNotExist:
            return Response({'error': 'Transportadora não encontrada.'}, status=status.HTTP_404_NOT_FOUND)

        user = User.objects.create_user(
            username=email,
            email=email,
            password=password,
            first_name=nome.split(' ')[0],
            last_name=nome.split(' ')[1] if ' ' in nome else ''
        )
        profile = UserProfile.objects.create(
            user=user,
            nome=nome,
            email=email,
            telefone=telefone,
            document=document,
            role='FISCAL',
            company=company
        )

        # Notify the new fiscal
        Notification.objects.create(
            user=user,
            tipo='CONFIRMACAO',
            mensagem=f"Conta de fiscal criada para a transportadora '{company.nome}'. Use este email para iniciar sessão na aplicação móvel de validação.",
            enviado=True
        )

        serializer = FiscalSerializer(profile)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    if request.method == 'PUT':
        try:
            profile = UserProfile.objects.get(pk=pk, company_id=company_id, role='FISCAL')
        except UserProfile.DoesNotExist:
            return Response({'error': 'Fiscal não encontrado.'}, status=status.HTTP_404_NOT_FOUND)

        nome = request.data.get('nome', profile.nome).strip()
        telefone = request.data.get('telefone', profile.telefone or '')
        document = request.data.get('document', profile.document or '')
        new_password = request.data.get('password', '')

        profile.nome = nome
        profile.telefone = telefone
        profile.document = document
        profile.save()

        # Also update the linked Django user name
        profile.user.first_name = nome.split(' ')[0]
        profile.user.last_name = nome.split(' ')[1] if ' ' in nome else ''
        if new_password:
            profile.user.set_password(new_password)
        profile.user.save()

        serializer = FiscalSerializer(profile)
        return Response(serializer.data, status=status.HTTP_200_OK)

    if request.method == 'DELETE':
        try:
            profile = UserProfile.objects.get(pk=pk, company_id=company_id, role='FISCAL')
        except UserProfile.DoesNotExist:
            return Response({'error': 'Fiscal não encontrado.'}, status=status.HTTP_404_NOT_FOUND)

        user = profile.user
        profile.delete()
        user.delete()
        return Response({'success': 'Fiscal removido com sucesso.'}, status=status.HTTP_200_OK)
