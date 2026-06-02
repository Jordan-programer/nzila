from django.db import models
from django.contrib.auth.models import User

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    name = models.CharField(max_length=255)
    phone = models.CharField(max_length=50, blank=True, null=True)
    document = models.CharField(max_length=100, blank=True, null=True)
    avatar = models.URLField(max_length=500, blank=True, null=True)
    is_admin = models.BooleanField(default=False)

    def __str__(self):
        return self.name

class Carrier(models.Model):
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=50, unique=True)
    color = models.CharField(max_length=100)
    rating = models.FloatField(default=4.5)
    reviews = models.IntegerField(default=0)

    def __str__(self):
        return self.name

class Trip(models.Model):
    carrier = models.ForeignKey(Carrier, on_delete=models.CASCADE, related_name='trips')
    origin = models.CharField(max_length=100)
    destination = models.CharField(max_length=100)
    departure_time = models.CharField(max_length=50)
    arrival_time = models.CharField(max_length=50)
    duration_minutes = models.IntegerField(default=0)
    duration_label = models.CharField(max_length=100)
    class_type = models.CharField(max_length=100) # economica, executiva, vip
    class_label = models.CharField(max_length=100) # Económica, Executiva, VIP
    total_seats = models.IntegerField(default=44)
    available_seats = models.IntegerField(default=44)
    price = models.IntegerField(default=0)
    amenities = models.TextField(default='') # Comma-separated amenities

    def __str__(self):
        return f"{self.carrier.code} | {self.origin} -> {self.destination} ({self.departure_time})"

    def get_amenities_list(self):
        if not self.amenities:
            return []
        return [a.strip() for a in self.amenities.split(',')]

class Reservation(models.Model):
    STATUS_CHOICES = [
        ('PENDENTE', 'Pendente'),
        ('CONFIRMADO', 'Confirmado'),
        ('CANCELADO', 'Cancelado'),
        ('EMBARCADO', 'Embarcado'),
        ('UTILIZADO', 'Utilizado'),
    ]

    id = models.CharField(max_length=100, primary_key=True) # RES-XYZ...
    trip = models.ForeignKey(Trip, on_delete=models.CASCADE, related_name='reservations')
    passenger_name = models.CharField(max_length=255)
    passenger_email = models.CharField(max_length=255)
    passenger_phone = models.CharField(max_length=50)
    passenger_document = models.CharField(max_length=100)
    seat = models.CharField(max_length=20)
    price = models.IntegerField(default=0)
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='CONFIRMADO')
    payment_method = models.CharField(max_length=100, blank=True, null=True)
    payment_date = models.DateTimeField(auto_now_add=True)
    validation_date = models.CharField(max_length=100, blank=True, null=True)
    qr_token = models.CharField(max_length=255, unique=True)

    def __str__(self):
        return f"{self.id} | {self.passenger_name} ({self.status})"

class ValidationLog(models.Model):
    reservation = models.ForeignKey(Reservation, on_delete=models.CASCADE, related_name='validation_logs')
    validation_time = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=50) # EMBARCADO / UTILIZADO
    validated_by = models.CharField(max_length=255) # Name of operator

    def __str__(self):
        return f"{self.reservation.id} - Checked in by {self.validated_by} at {self.validation_time}"
