from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from api.models import (
    UserProfile, Company, Location, Route, Bus, Seat,
    Trip, Reservation, ReservationSeat, Payment, Ticket, Notification,
    CompanyAdmin, CompanyDocument, PopularRoute
)

class Command(BaseCommand):
    help = 'Clears all database tables, leaving only the admin user.'

    def handle(self, *args, **kwargs):
        self.stdout.write('Clearing all database tables...')
        Notification.objects.all().delete()
        Ticket.objects.all().delete()
        Payment.objects.all().delete()
        ReservationSeat.objects.all().delete()
        Reservation.objects.all().delete()
        Trip.objects.all().delete()
        Seat.objects.all().delete()
        Bus.objects.all().delete()
        Route.objects.all().delete()
        Location.objects.all().delete()
        CompanyAdmin.objects.all().delete()
        CompanyDocument.objects.all().delete()
        Company.objects.all().delete()
        UserProfile.objects.all().delete()
        User.objects.all().delete()
        PopularRoute.objects.all().delete()

        self.stdout.write('Creating admin user...')
        admin_user = User.objects.create_superuser(
            username='admin@transbook.ao',
            email='admin@transbook.ao',
            password='Luanda@2026',
            first_name='Carlos',
            last_name='Admin'
        )
        
        UserProfile.objects.create(
            user=admin_user,
            nome='Carlos Admin',
            email='admin@transbook.ao',
            telefone='+244 912 999 888',
            document='008765432LA099',
            role='ADMIN'
        )
        
        self.stdout.write(self.style.SUCCESS('Successfully cleared database and left only the admin user!'))
