from rest_framework import serializers
from django.contrib.auth.models import User
from .models import UserProfile, Carrier, Trip, Reservation, ValidationLog

class UserSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source='profile.name', read_only=True)
    phone = serializers.CharField(source='profile.phone', read_only=True)
    document = serializers.CharField(source='profile.document', read_only=True)
    avatar = serializers.URLField(source='profile.avatar', read_only=True)
    is_admin = serializers.BooleanField(source='profile.is_admin', read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'name', 'phone', 'document', 'avatar', 'is_admin']

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = '__all__'

class CarrierSerializer(serializers.ModelSerializer):
    class Meta:
        model = Carrier
        fields = '__all__'

class TripSerializer(serializers.ModelSerializer):
    carrier_details = CarrierSerializer(source='carrier', read_only=True)
    amenities = serializers.SerializerMethodField()

    class Meta:
        model = Trip
        fields = '__all__'

    def get_amenities(self, obj):
        return obj.get_amenities_list()

class ReservationSerializer(serializers.ModelSerializer):
    trip_details = TripSerializer(source='trip', read_only=True)
    carrier_code = serializers.CharField(source='trip.carrier.code', read_only=True)
    carrier_color = serializers.CharField(source='trip.carrier.color', read_only=True)

    class Meta:
        model = Reservation
        fields = '__all__'

class ValidationLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = ValidationLog
        fields = '__all__'
