# pyrefly: ignore [missing-import]
from rest_framework import serializers
# pyrefly: ignore [missing-import]
from django.contrib.auth.models import User
# pyrefly: ignore [missing-import]
from .models import (
    UserProfile, Company, Location, Route, Bus, Seat,
    Trip, Reservation, ReservationSeat, Payment, Ticket, Notification,
    CompanyAdmin, CompanyDocument, PopularRoute, Withdrawal
)

class FiscalSerializer(serializers.ModelSerializer):
    """Serializer for UserProfile records with role=FISCAL"""
    id = serializers.IntegerField(read_only=True)
    user_id = serializers.IntegerField(source='user.id', read_only=True)
    email = serializers.EmailField()
    nome = serializers.CharField()
    telefone = serializers.CharField(allow_blank=True, required=False)
    document = serializers.CharField(allow_blank=True, required=False)
    company_id = serializers.IntegerField(source='company.id', read_only=True)

    class Meta:
        model = UserProfile
        fields = ['id', 'user_id', 'nome', 'email', 'telefone', 'document', 'company_id', 'role']

class OperatorSerializer(serializers.ModelSerializer):
    """Serializer for UserProfile records with role=OPERADOR"""
    id = serializers.IntegerField(read_only=True)
    user_id = serializers.IntegerField(source='user.id', read_only=True)
    email = serializers.EmailField()
    nome = serializers.CharField()
    telefone = serializers.CharField(allow_blank=True, required=False)
    document = serializers.CharField(allow_blank=True, required=False)
    company_id = serializers.IntegerField(source='company.id', read_only=True)

    class Meta:
        model = UserProfile
        fields = ['id', 'user_id', 'nome', 'email', 'telefone', 'document', 'company_id', 'role']

class UserSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source='profile.nome', read_only=True)
    phone = serializers.CharField(source='profile.telefone', read_only=True)
    document = serializers.CharField(source='profile.document', read_only=True)
    is_admin = serializers.SerializerMethodField()
    role = serializers.CharField(source='profile.role', read_only=True)
    company_id = serializers.IntegerField(source='profile.company.id', read_only=True)
    company_code = serializers.CharField(source='profile.company.code', read_only=True)
    company_status = serializers.CharField(source='profile.company.status', read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'name', 'phone', 'document', 'is_admin', 'role', 'company_id', 'company_code', 'company_status']

    def get_is_admin(self, obj):
        try:
            return obj.profile.role == 'ADMIN'
        except UserProfile.DoesNotExist:
            return False

class CompanySerializer(serializers.ModelSerializer):
    class Meta:
        model = Company
        fields = '__all__'

class LocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Location
        fields = '__all__'

class RouteSerializer(serializers.ModelSerializer):
    origem_details = LocationSerializer(source='origem', read_only=True)
    destino_details = LocationSerializer(source='destino', read_only=True)

    class Meta:
        model = Route
        fields = '__all__'

class BusSerializer(serializers.ModelSerializer):
    class Meta:
        model = Bus
        fields = ['id', 'empresa', 'modelo', 'matricula', 'capacidade', 'colunas_esquerda', 'colunas_direita', 'linhas']

class SeatSerializer(serializers.ModelSerializer):
    class Meta:
        model = Seat
        fields = '__all__'

class TripSerializer(serializers.ModelSerializer):
    carrier = serializers.CharField(source='empresa.nome', read_only=True)
    carrierCode = serializers.CharField(source='empresa.code', read_only=True)
    carrierColor = serializers.CharField(source='empresa.color', read_only=True)
    carrierLogo = serializers.SerializerMethodField()
    rating = serializers.FloatField(source='empresa.rating', read_only=True)
    reviews = serializers.IntegerField(source='empresa.reviews', read_only=True)
    
    origin = serializers.CharField(source='route.origem.nome', read_only=True)
    origin_provincia = serializers.CharField(source='route.origem.provincia', read_only=True)
    destination = serializers.CharField(source='route.destino.nome', read_only=True)
    destination_provincia = serializers.CharField(source='route.destino.provincia', read_only=True)
    
    departureTime = serializers.SerializerMethodField()
    arrivalTime = serializers.SerializerMethodField()
    durationMinutes = serializers.SerializerMethodField()
    durationLabel = serializers.SerializerMethodField()
    
    # Class mappings
    class_name = serializers.SerializerMethodField('get_class_name')
    classLabel = serializers.SerializerMethodField()
    
    availableSeats = serializers.SerializerMethodField()
    totalSeats = serializers.IntegerField(source='bus.capacidade', read_only=True)
    price = serializers.IntegerField(source='preco_ida', read_only=True)
    preco_ida_volta = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True, allow_null=True)
    amenities = serializers.SerializerMethodField()
    occupiedSeats = serializers.SerializerMethodField()
    date = serializers.SerializerMethodField()

    class Meta:
        model = Trip
        fields = [
            'id', 'carrier', 'carrierCode', 'carrierColor', 'carrierLogo', 'rating', 'reviews',
            'origin', 'origin_provincia', 'destination', 'destination_provincia',
            'date', 'departureTime', 'arrivalTime', 'durationMinutes',
            'durationLabel', 'class_name', 'classLabel', 'availableSeats', 'totalSeats',
            'price', 'preco_ida_volta', 'amenities', 'occupiedSeats'
        ]

    # Map class_name to keep key "class" compatible in JSON response
    def to_representation(self, instance):
        repr_data = super().to_representation(instance)
        repr_data['class'] = repr_data.pop('class_name')
        return repr_data

    def get_carrierLogo(self, obj):
        empresa = obj.empresa
        if empresa.logo_url:
            return empresa.logo_url
        if empresa.logo:
            request = self.context.get('request')
            return request.build_absolute_uri(empresa.logo.url) if request else empresa.logo.url
        return None

    def get_date(self, obj):
        return obj.data_saida.strftime('%Y-%m-%d')

    def get_departureTime(self, obj):
        return obj.hora_saida.strftime('%H:%M')

    def get_arrivalTime(self, obj):
        return obj.hora_chegada.strftime('%H:%M')

    def get_durationMinutes(self, obj):
        h = obj.hora_saida.hour
        ah = obj.hora_chegada.hour
        # Simplified minute calculation for demo
        return 510

    def get_durationLabel(self, obj):
        t = obj.route.duracao_estimada
        return f"{t.hour}h {t.minute:02d}min"

    def get_class_name(self, obj):
        return obj.classe.lower()

    def get_classLabel(self, obj):
        mapping = {
            'ECONOMICA': 'Económica',
            'CONFORTO': 'Conforto',
            'EXECUTIVA': 'Executiva',
        }
        return mapping.get(obj.classe, obj.classe.capitalize())

    def get_availableSeats(self, obj):
        occupied = 0
        for reservation in obj.reservations.all():
            if reservation.status in ['CONFIRMADA', 'EMBARCADO']:
                occupied += len(reservation.reservation_seats.all())
        return max(0, obj.bus.capacidade - occupied)

    def get_amenities(self, obj):
        return obj.get_amenities_list()

    def get_occupiedSeats(self, obj):
        seats = []
        for reservation in obj.reservations.all():
            if reservation.status in ['CONFIRMADA', 'EMBARCADO']:
                for res_seat in reservation.reservation_seats.all():
                    seats.append(res_seat.seat.numero)
        return seats

class ReservationSerializer(serializers.ModelSerializer):
    trip_details = TripSerializer(source='trip', read_only=True)
    passenger_name = serializers.CharField(source='user.profile.nome', read_only=True)
    passenger_email = serializers.CharField(source='user.email', read_only=True)
    passenger_phone = serializers.CharField(source='user.profile.telefone', read_only=True)
    passenger_document = serializers.CharField(source='user.profile.document', read_only=True)
    
    # Map reservation details to match Next.js frontend schema
    seat = serializers.SerializerMethodField()
    price = serializers.IntegerField(source='total', read_only=True)
    paymentMethod = serializers.SerializerMethodField()
    paymentDate = serializers.SerializerMethodField()
    validationDate = serializers.SerializerMethodField()
    qrToken = serializers.SerializerMethodField()
    origin = serializers.CharField(source='trip.route.origem.nome', read_only=True)
    destination = serializers.CharField(source='trip.route.destino.nome', read_only=True)
    date = serializers.SerializerMethodField()
    departureTime = serializers.SerializerMethodField()
    arrivalTime = serializers.SerializerMethodField()
    classLabel = serializers.SerializerMethodField()
    carrier = serializers.CharField(source='trip.empresa.nome', read_only=True)
    carrierCode = serializers.CharField(source='trip.empresa.code', read_only=True)
    carrierColor = serializers.CharField(source='trip.empresa.color', read_only=True)

    class Meta:
        model = Reservation
        fields = [
            'id', 'codigo_reserva', 'trip', 'status', 'total', 'created_at',
            'trip_details', 'passenger_name', 'passenger_email', 'passenger_phone',
            'passenger_document', 'seat', 'price', 'paymentMethod', 'paymentDate',
            'validationDate', 'qrToken', 'origin', 'destination', 'date',
            'departureTime', 'arrivalTime', 'classLabel', 'carrier', 'carrierCode', 'carrierColor'
        ]

    # Map model PK `id` and `status` in to_representation to match front expectations
    def to_representation(self, instance):
        repr_data = super().to_representation(instance)
        # Map ID to human-readable reservation code
        repr_data['id'] = instance.codigo_reserva
        # Frontend expects 'CONFIRMADO' status key
        status_map = {
            'CONFIRMADA': 'CONFIRMADO',
            'PENDENTE': 'PENDENTE',
            'CANCELADA': 'CANCELADO',
            'EMBARCADO': 'EMBARCADO',
            'PENDENTE_CANCELAMENTO': 'PENDENTE_CANCELAMENTO',
        }
        repr_data['status'] = status_map.get(instance.status, instance.status)
        return repr_data

    def get_seat(self, obj):
        res_seat = obj.reservation_seats.first()
        return res_seat.seat.numero if res_seat else ""

    def get_paymentMethod(self, obj):
        pay = obj.payments.first()
        if not pay:
            return "Multicaixa Express"
        mapping = {
            'MULTICAIXA': 'Multicaixa Express',
            'UNITEL_MONEY': 'Unitel Money',
            'PAYPAY': 'PayPay',
        }
        return mapping.get(pay.metodo, pay.metodo.capitalize())

    def get_paymentDate(self, obj):
        pay = obj.payments.first()
        date_val = pay.created_at if pay else obj.created_at
        return date_val.isoformat()

    def get_validationDate(self, obj):
        ticket = obj.tickets.first()
        if ticket and ticket.usado and ticket.data_validacao:
            return ticket.data_validacao.strftime('%H:%M %d/%m/%Y')
        return ""

    def get_qrToken(self, obj):
        ticket = obj.tickets.first()
        return ticket.token if ticket else ""

    def get_date(self, obj):
        return obj.trip.data_saida.strftime('%Y-%m-%d')

    def get_departureTime(self, obj):
        return obj.trip.hora_saida.strftime('%H:%M')

    def get_arrivalTime(self, obj):
        return obj.trip.hora_chegada.strftime('%H:%M')

    def get_classLabel(self, obj):
        mapping = {
            'ECONOMICA': 'Económica',
            'CONFORTO': 'Conforto',
            'EXECUTIVA': 'Executiva',
        }
        return mapping.get(obj.trip.classe, obj.trip.classe.capitalize())

class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = '__all__'

class TicketSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ticket
        fields = '__all__'

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = '__all__'

class CompanyDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = CompanyDocument
        fields = '__all__'

class CompanyAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = CompanyAdmin
        fields = '__all__'

class PopularRouteSerializer(serializers.ModelSerializer):
    origin = serializers.CharField(source='origem.nome', read_only=True)
    destination = serializers.CharField(source='destino.nome', read_only=True)
    origin_provincia = serializers.CharField(source='origem.provincia', read_only=True)
    destination_provincia = serializers.CharField(source='destino.provincia', read_only=True)

    class Meta:
        model = PopularRoute
        fields = '__all__'


class WithdrawalSerializer(serializers.ModelSerializer):
    company_name = serializers.CharField(source='company.nome', read_only=True)
    company_nif = serializers.CharField(source='company.nif', read_only=True)
    comprovativo_url = serializers.SerializerMethodField()

    class Meta:
        model = Withdrawal
        fields = [
            'id', 'company', 'company_name', 'company_nif', 'valor',
            'dados_bancarios', 'status', 'motivo_rejeicao', 'comprovativo',
            'comprovativo_url', 'created_at', 'updated_at'
        ]

    def get_comprovativo_url(self, obj):
        if obj.comprovativo:
            request = self.context.get('request')
            return request.build_absolute_uri(obj.comprovativo.url) if request else obj.comprovativo.url
        return None

