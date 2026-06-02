from django.contrib import admin
from .models import UserProfile, Carrier, Trip, Reservation, ValidationLog

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'name', 'phone', 'document', 'is_admin')
    search_fields = ('name', 'user__email')

@admin.register(Carrier)
class CarrierAdmin(admin.ModelAdmin):
    list_display = ('name', 'code', 'color', 'rating', 'reviews')
    search_fields = ('name', 'code')

@admin.register(Trip)
class TripAdmin(admin.ModelAdmin):
    list_display = ('carrier', 'origin', 'destination', 'departure_time', 'price')
    list_filter = ('carrier', 'origin', 'destination', 'class_type')
    search_fields = ('origin', 'destination')

@admin.register(Reservation)
class ReservationAdmin(admin.ModelAdmin):
    list_display = ('id', 'trip', 'passenger_name', 'passenger_email', 'seat', 'status')
    list_filter = ('status', 'payment_method')
    search_fields = ('id', 'passenger_name', 'passenger_email')

@admin.register(ValidationLog)
class ValidationLogAdmin(admin.ModelAdmin):
    list_display = ('reservation', 'status', 'validated_by', 'validation_time')
    list_filter = ('status', 'validated_by')
    search_fields = ('reservation__id', 'validated_by')
