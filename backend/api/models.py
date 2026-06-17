from django.db import models
from django.contrib.auth.models import User

# 👤 1. UTILIZADORES (extends User, mapped to table 'users')
class UserProfile(models.Model):
    ROLE_CHOICES = [
        ('CLIENTE', 'CLIENTE'),
        ('ADMIN', 'ADMIN'),
        ('OPERADOR', 'OPERADOR'),
        ('FISCAL', 'FISCAL'),
    ]
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    nome = models.CharField(max_length=100)
    email = models.EmailField(max_length=100, unique=True)
    telefone = models.CharField(max_length=20, blank=True, null=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='CLIENTE')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Frontend compatibility fields
    document = models.CharField(max_length=100, blank=True, null=True)
    avatar = models.URLField(max_length=500, blank=True, null=True)
    company = models.ForeignKey('Company', on_delete=models.SET_NULL, blank=True, null=True, related_name='profiles')

    class Meta:
        db_table = 'users'

    def __str__(self):
        return self.nome

# 🏢 2. EMPRESAS TRANSPORTADORAS
class Company(models.Model):
    STATUS_CHOICES = [
        ('PENDENTE', 'PENDENTE'),
        ('APROVADA', 'APROVADA'),
        ('REJEITADA', 'REJEITADA'),
        ('SUSPENSA', 'SUSPENSA'),
    ]
    nome = models.CharField(max_length=100)
    nome_comercial = models.CharField(max_length=100, blank=True, null=True)
    code = models.CharField(max_length=50, blank=True, null=True)
    nif = models.CharField(max_length=50, blank=True, null=True, unique=True)
    ano_fundacao = models.IntegerField(blank=True, null=True)
    tipo_empresa = models.CharField(max_length=50, blank=True, null=True)
    
    provincia = models.CharField(max_length=100, blank=True, null=True)
    municipio = models.CharField(max_length=100, blank=True, null=True)
    endereco = models.TextField(blank=True, null=True)
    
    telefone = models.CharField(max_length=20, blank=True, null=True)
    telefone_alt = models.CharField(max_length=20, blank=True, null=True)
    email = models.EmailField(max_length=100, blank=True, null=True)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDENTE')
    motivo_rejeicao = models.TextField(blank=True, null=True)
    logo_url = models.CharField(max_length=250, blank=True, null=True)
    logo = models.FileField(upload_to='company_logos/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    # Frontend compatibility fields
    descricao = models.TextField(blank=True, null=True)
    color = models.CharField(max_length=100, default='bg-blue-600')
    rating = models.FloatField(default=4.5)
    reviews = models.IntegerField(default=100)
    politica_cancelamento = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'companies'

    def __str__(self):
        return self.nome

class CompanyDocument(models.Model):
    TIPO_CHOICES = [
        ('REGISTO_COMERCIAL', 'REGISTO_COMERCIAL'),
        ('ALVARA', 'ALVARA'),
        ('CONTRIBUINTE', 'CONTRIBUINTE'),
        ('ESTATUTOS', 'ESTATUTOS'),
    ]
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='documents')
    tipo = models.CharField(max_length=50, choices=TIPO_CHOICES)
    arquivo_url = models.TextField()
    aprovado = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'company_documents'

    def __str__(self):
        return f"{self.tipo} - {self.company.nome}"

class CompanyAdmin(models.Model):
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='admins')
    nome = models.CharField(max_length=100)
    email = models.EmailField(max_length=100, unique=True)
    telefone = models.CharField(max_length=20)
    password = models.CharField(max_length=255)
    cargo = models.CharField(max_length=100, blank=True, null=True)
    documento_identificacao = models.CharField(max_length=100, blank=True, null=True)

    class Meta:
        db_table = 'company_admin'

    def __str__(self):
        return f"{self.nome} ({self.company.nome})"

# 📍 3. PROVÍNCIAS / CIDADES
class Location(models.Model):
    nome = models.CharField(max_length=100)
    provincia = models.CharField(max_length=100)

    class Meta:
        db_table = 'locations'

    def __str__(self):
        return f"{self.nome} ({self.provincia})"

# 🛣️ 4. ROTAS
class Route(models.Model):
    origem = models.ForeignKey(Location, on_delete=models.CASCADE, related_name='routes_from')
    destino = models.ForeignKey(Location, on_delete=models.CASCADE, related_name='routes_to')
    distancia_km = models.DecimalField(max_digits=10, decimal_places=2)
    duracao_estimada = models.TimeField()

    class Meta:
        db_table = 'routes'

    def __str__(self):
        return f"{self.origem.nome} -> {self.destino.nome}"

# 🚌 5. AUTOCARROS
class Bus(models.Model):
    empresa = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='buses')
    modelo = models.CharField(max_length=100)
    matricula = models.CharField(max_length=30, blank=True, null=True)
    capacidade = models.IntegerField()
    # Layout do autocarro: colunas à esquerda e direita do corredor, e nº de fileiras
    colunas_esquerda = models.IntegerField(default=2)
    colunas_direita = models.IntegerField(default=2)
    linhas = models.IntegerField(default=11)

    class Meta:
        db_table = 'buses'

    def __str__(self):
        return f"{self.empresa.nome} - {self.modelo} ({self.capacidade} lug)"

# 💺 6. ASSENTOS
class Seat(models.Model):
    bus = models.ForeignKey(Bus, on_delete=models.CASCADE, related_name='seats')
    numero = models.CharField(max_length=10)

    class Meta:
        db_table = 'seats'

    def __str__(self):
        return f"{self.numero} ({self.bus.modelo})"

# 💺 7. VIAGENS
class Trip(models.Model):
    CLASSE_CHOICES = [
        ('ECONOMICA', 'ECONOMICA'),
        ('CONFORTO', 'CONFORTO'),
        ('EXECUTIVA', 'EXECUTIVA'),
    ]
    STATUS_CHOICES = [
        ('ATIVA', 'ATIVA'),
        ('CANCELADA', 'CANCELADA'),
    ]
    empresa = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='trips')
    route = models.ForeignKey(Route, on_delete=models.CASCADE, related_name='trips')
    bus = models.ForeignKey(Bus, on_delete=models.CASCADE, related_name='trips')
    
    data_saida = models.DateField()
    hora_saida = models.TimeField()
    hora_chegada = models.TimeField()
    
    preco_ida = models.DecimalField(max_digits=10, decimal_places=2)
    preco_ida_volta = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    classe = models.CharField(max_length=50, choices=CLASSE_CHOICES)
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='ATIVA')
    
    # Frontend compatibility
    amenities = models.TextField(default='ar-condicionado,wifi,tomada')

    class Meta:
        db_table = 'trips'

    def __str__(self):
        return f"{self.empresa.nome} | {self.route} | {self.data_saida} {self.hora_saida}"

    def get_amenities_list(self):
        if not self.amenities:
            return []
        return [a.strip() for a in self.amenities.split(',')]

# 🎫 8. RESERVAS
class Reservation(models.Model):
    STATUS_CHOICES = [
        ('PENDENTE', 'PENDENTE'),
        ('CONFIRMADA', 'CONFIRMADA'),
        ('CANCELADA', 'CANCELADA'),
        ('EMBARCADO', 'EMBARCADO'),
    ]
    codigo_reserva = models.CharField(max_length=50, unique=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reservations')
    trip = models.ForeignKey(Trip, on_delete=models.CASCADE, related_name='reservations')
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='CONFIRMADA')
    total = models.DecimalField(max_digits=10, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'reservations'

    def __str__(self):
        return f"{self.codigo_reserva} | {self.user.username} ({self.status})"

# 🪑 9. RESERVA DE ASSENTOS
class ReservationSeat(models.Model):
    reservation = models.ForeignKey(Reservation, on_delete=models.CASCADE, related_name='reservation_seats')
    seat = models.ForeignKey(Seat, on_delete=models.CASCADE, related_name='reservation_seats')

    class Meta:
        db_table = 'reservation_seats'

    def __str__(self):
        return f"{self.reservation.codigo_reserva} - Assento {self.seat.numero}"

# 💳 10. PAGAMENTOS
class Payment(models.Model):
    METODO_CHOICES = [
        ('MULTICAIXA', 'MULTICAIXA'),
        ('UNITEL_MONEY', 'UNITEL_MONEY'),
        ('PAYPAY', 'PAYPAY'),
    ]
    STATUS_CHOICES = [
        ('PENDENTE', 'PENDENTE'),
        ('PAGO', 'PAGO'),
        ('FALHOU', 'FALHOU'),
    ]
    reservation = models.ForeignKey(Reservation, on_delete=models.CASCADE, related_name='payments')
    metodo = models.CharField(max_length=50, choices=METODO_CHOICES)
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='PENDENTE')
    referencia = models.CharField(max_length=100, blank=True, null=True)
    valor = models.DecimalField(max_digits=10, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'payments'

    def __str__(self):
        return f"Pagamento {self.id} | {self.reservation.codigo_reserva} | {self.status}"

# 🔐 11. QR CODE / TOKEN
class Ticket(models.Model):
    reservation = models.ForeignKey(Reservation, on_delete=models.CASCADE, related_name='tickets')
    qr_code = models.TextField()
    token = models.CharField(max_length=255, unique=True)
    usado = models.BooleanField(default=False)
    data_validacao = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'tickets'

    def __str__(self):
        return f"Ticket {self.id} | {self.reservation.codigo_reserva}"

# 📧 12. NOTIFICAÇÕES
class Notification(models.Model):
    TIPO_CHOICES = [
        ('CONFIRMACAO', 'CONFIRMACAO'),
        ('LEMBRETE', 'LEMBRETE'),
        ('CANCELAMENTO', 'CANCELAMENTO'),
    ]
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    tipo = models.CharField(max_length=50, choices=TIPO_CHOICES)
    mensagem = models.TextField()
    enviado = models.BooleanField(default=False)
    lida = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'notifications'

    def __str__(self):
        return f"Notificacao {self.id} | User {self.user.username} | {self.tipo}"

class PopularRoute(models.Model):
    origem = models.ForeignKey(Location, on_delete=models.CASCADE, related_name='popular_routes_from')
    destino = models.ForeignKey(Location, on_delete=models.CASCADE, related_name='popular_routes_to')
    imagem = models.FileField(upload_to='popular_routes/', blank=True, null=True)
    duracao = models.CharField(max_length=50, default='8h 30min')
    preco_desde = models.DecimalField(max_digits=10, decimal_places=2)
    frequencia = models.CharField(max_length=50, default='Diário')
    trending = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'popular_routes'

    def __str__(self):
        return f"Rota Popular: {self.origem.nome} -> {self.destino.nome}"
