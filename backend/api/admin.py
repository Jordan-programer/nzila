from django.contrib import admin
from .models import (
    UserProfile, Company, Location, Route, Bus, Seat,
    Trip, Reservation, ReservationSeat, Payment, Ticket, Notification
)

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'nome', 'email', 'telefone', 'role')
    search_fields = ('nome', 'email')

@admin.register(Company)
class CompanyAdmin(admin.ModelAdmin):
    list_display = ('nome', 'telefone', 'email', 'status')
    search_fields = ('nome',)

@admin.register(Location)
class LocationAdmin(admin.ModelAdmin):
    list_display = ('nome', 'provincia')
    search_fields = ('nome', 'provincia')

@admin.register(Route)
class RouteAdmin(admin.ModelAdmin):
    list_display = ('origem', 'destino', 'distancia_km', 'duracao_estimada')

@admin.register(Bus)
class BusAdmin(admin.ModelAdmin):
    list_display = ('empresa', 'modelo', 'capacidade')
    search_fields = ('modelo',)

@admin.register(Seat)
class SeatAdmin(admin.ModelAdmin):
    list_display = ('bus', 'numero')
    list_filter = ('bus',)

@admin.register(Trip)
class TripAdmin(admin.ModelAdmin):
    list_display = ('empresa', 'route', 'bus', 'data_saida', 'hora_saida', 'preco_ida', 'classe', 'status')
    list_filter = ('empresa', 'classe', 'status')

@admin.register(Reservation)
class ReservationAdmin(admin.ModelAdmin):
    list_display = ('codigo_reserva', 'user', 'trip', 'status', 'total', 'created_at')
    list_filter = ('status',)
    search_fields = ('codigo_reserva', 'user__username')

@admin.register(ReservationSeat)
class ReservationSeatAdmin(admin.ModelAdmin):
    list_display = ('reservation', 'seat')

@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ('reservation', 'metodo', 'status', 'referencia', 'valor', 'created_at')
    list_filter = ('metodo', 'status')

@admin.register(Ticket)
class TicketAdmin(admin.ModelAdmin):
    list_display = ('reservation', 'token', 'usado', 'data_validacao')
    list_filter = ('usado',)
    search_fields = ('reservation__codigo_reserva', 'token')

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('user', 'tipo', 'enviado', 'created_at')
    list_filter = ('tipo', 'enviado')
