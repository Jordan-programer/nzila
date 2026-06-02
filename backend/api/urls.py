from django.urls import path
from . import views

urlpatterns = [
    # Auth APIs
    path('auth/register/', views.register_user, name='register'),
    path('auth/login/', views.login_user, name='login'),

    # Trips APIs
    path('trips/', views.list_trips, name='list_trips'),
    path('trips/<int:pk>/', views.trip_details, name='trip_details'),

    # Reservations APIs
    path('reservations/', views.manage_reservations, name='manage_reservations'),
    path('reservations/<str:pk>/', views.reservation_details, name='reservation_details'),
    path('reservations/<str:pk>/cancel/', views.cancel_reservation, name='cancel_reservation'),

    # Validation APIs (Fiscais)
    path('validation/scan/', views.scan_ticket, name='scan_ticket'),
    path('validation/confirm/', views.confirm_boarding, name='confirm_boarding'),

    # Admin APIs
    path('admin/stats/', views.admin_stats, name='admin_stats'),
    path('admin/reservations/', views.admin_all_reservations, name='admin_all_reservations'),
]
