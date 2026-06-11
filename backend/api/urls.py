from django.urls import path
from . import views

urlpatterns = [
    # Auth APIs
    path('auth/register/', views.register_user, name='register'),
    path('auth/login/', views.login_user, name='login'),
    path('auth/social-login/', views.social_login_user, name='social_login'),
    path('auth/send-client-otp/', views.send_client_otp, name='send_client_otp'),

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

    # Locations APIs
    path('locations/', views.manage_locations, name='manage_locations'),
    path('locations/<int:pk>/', views.location_detail, name='location_detail'),

    # Carrier Registration Flow
    path('auth/register-carrier/', views.register_carrier, name='register_carrier'),
    path('auth/verify-otp/', views.verify_carrier_otp, name='verify_carrier_otp'),
    path('auth/upload-document/', views.upload_carrier_document, name='upload_carrier_document'),
    path('auth/resend-otp/', views.resend_carrier_otp, name='resend_carrier_otp'),

    # Carrier Admin Admin Reviews
    path('admin/carriers/', views.admin_list_carriers, name='admin_list_carriers'),
    path('admin/carriers/review/', views.admin_review_carrier, name='admin_review_carrier'),

    # Carrier Management Operations
    path('carrier/info/', views.carrier_info, name='carrier_info'),
    path('carrier/buses/', views.carrier_manage_buses, name='carrier_manage_buses'),
    path('carrier/buses/<int:pk>/', views.carrier_manage_buses, name='carrier_manage_bus_detail'),
    path('carrier/routes/', views.carrier_manage_routes, name='carrier_manage_routes'),
    path('carrier/routes/<int:pk>/', views.carrier_manage_routes, name='carrier_manage_route_detail'),
    path('carrier/trips/', views.carrier_manage_trips, name='carrier_manage_trips'),
    path('carrier/trips/<int:pk>/', views.carrier_manage_trips, name='carrier_manage_trip_detail'),
    path('notifications/', views.list_notifications, name='list_notifications'),
    
    # Dynamic Popular Routes & Transport Companies API URLs
    path('public/popular-routes/', views.public_popular_routes, name='public_popular_routes'),
    path('public/carriers/', views.public_carriers, name='public_carriers'),
    path('admin/popular-routes/', views.manage_popular_routes, name='manage_popular_routes'),
    path('admin/popular-routes/<int:pk>/', views.popular_route_detail, name='popular_route_detail'),
    path('admin/carriers/upload-logo/', views.upload_company_logo, name='upload_company_logo'),
]
