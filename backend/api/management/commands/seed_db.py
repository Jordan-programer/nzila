from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from django.utils import timezone
from api.models import UserProfile, Carrier, Trip, Reservation, ValidationLog

class Command(BaseCommand):
    help = 'Seeds the SQLite database with Macon, Translux and SGO trips and reservations matching the frontend mock.'

    def handle(self, *args, **kwargs):
        self.stdout.write('Clearing database tables...')
        ValidationLog.objects.all().delete()
        Reservation.objects.all().delete()
        Trip.objects.all().delete()
        Carrier.objects.all().delete()
        UserProfile.objects.all().delete()
        User.objects.all().delete()

        self.stdout.write('Seeding transport carriers...')
        carriers_data = [
            {'name': 'Macon Transportes', 'code': 'MACON', 'color': 'bg-blue-600', 'rating': 4.7, 'reviews': 312},
            {'name': 'Translux Angola', 'code': 'TRANSLUX', 'color': 'bg-orange-600', 'rating': 4.8, 'reviews': 487},
            {'name': 'SGO Express', 'code': 'SGO', 'color': 'bg-green-600', 'rating': 4.5, 'reviews': 198},
            {'name': 'Unitrans Angola', 'code': 'UNITRANS', 'color': 'bg-purple-600', 'rating': 4.4, 'reviews': 89},
        ]
        
        carriers = {}
        for c_data in carriers_data:
            c = Carrier.objects.create(**c_data)
            carriers[c.code] = c

        self.stdout.write('Seeding interprovincial trips...')
        trips_data = [
            {
                'id': 1,
                'carrier': carriers['MACON'],
                'origin': 'Luanda',
                'destination': 'Huambo',
                'departure_time': '06:00',
                'arrival_time': '14:30',
                'duration_minutes': 510,
                'duration_label': '8h 30min',
                'class_type': 'economica',
                'class_label': 'Económica',
                'total_seats': 44,
                'available_seats': 18,
                'price': 4500,
                'amenities': 'ar-condicionado,wifi,tomada',
            },
            {
                'id': 2,
                'carrier': carriers['TRANSLUX'],
                'origin': 'Luanda',
                'destination': 'Huambo',
                'departure_time': '07:30',
                'arrival_time': '16:00',
                'duration_minutes': 510,
                'duration_label': '8h 30min',
                'class_type': 'executiva',
                'class_label': 'Executiva',
                'total_seats': 28,
                'available_seats': 6,
                'price': 7200,
                'amenities': 'ar-condicionado,wifi,tomada,snack',
            },
            {
                'id': 3,
                'carrier': carriers['SGO'],
                'origin': 'Luanda',
                'destination': 'Huambo',
                'departure_time': '08:00',
                'arrival_time': '16:30',
                'duration_minutes': 510,
                'duration_label': '8h 30min',
                'class_type': 'economica',
                'class_label': 'Económica',
                'total_seats': 44,
                'available_seats': 24,
                'price': 4200,
                'amenities': 'ar-condicionado,tomada',
            },
            {
                'id': 4,
                'carrier': carriers['TRANSLUX'],
                'origin': 'Luanda',
                'destination': 'Huambo',
                'departure_time': '10:00',
                'arrival_time': '18:30',
                'duration_minutes': 510,
                'duration_label': '8h 30min',
                'class_type': 'vip',
                'class_label': 'VIP',
                'total_seats': 12,
                'available_seats': 3,
                'price': 12500,
                'amenities': 'ar-condicionado,wifi,tomada,snack,refeicao,almofada',
            },
            {
                'id': 5,
                'carrier': carriers['MACON'],
                'origin': 'Luanda',
                'destination': 'Huambo',
                'departure_time': '14:00',
                'arrival_time': '22:30',
                'duration_minutes': 510,
                'duration_label': '8h 30min',
                'class_type': 'economica',
                'class_label': 'Económica',
                'total_seats': 44,
                'available_seats': 31,
                'price': 4500,
                'amenities': 'ar-condicionado',
            },
            {
                'id': 6,
                'carrier': carriers['UNITRANS'],
                'origin': 'Luanda',
                'destination': 'Huambo',
                'departure_time': '20:00',
                'arrival_time': '04:30',
                'duration_minutes': 510,
                'duration_label': '8h 30min',
                'class_type': 'executiva',
                'class_label': 'Executiva',
                'total_seats': 28,
                'available_seats': 14,
                'price': 6800,
                'amenities': 'ar-condicionado,wifi,tomada,almofada',
            },
            {
                'id': 7,
                'carrier': carriers['SGO'],
                'origin': 'Luanda',
                'destination': 'Huambo',
                'departure_time': '22:30',
                'arrival_time': '07:00',
                'duration_minutes': 510,
                'duration_label': '8h 30min',
                'class_type': 'economica',
                'class_label': 'Económica',
                'total_seats': 44,
                'available_seats': 2,
                'price': 3900,
                'amenities': 'ar-condicionado',
            },
            {
                'id': 8,
                'carrier': carriers['MACON'],
                'origin': 'Luanda',
                'destination': 'Huambo',
                'departure_time': '05:30',
                'arrival_time': '14:00',
                'duration_minutes': 510,
                'duration_label': '8h 30min',
                'class_type': 'vip',
                'class_label': 'VIP',
                'total_seats': 12,
                'available_seats': 8,
                'price': 13000,
                'amenities': 'ar-condicionado,wifi,tomada,snack,refeicao,almofada,entretenimento',
            },
        ]

        trips = {}
        for t_data in trips_data:
            t_id = t_data.pop('id')
            t = Trip.objects.create(id=t_id, **t_data)
            trips[t_id] = t

        self.stdout.write('Seeding demo users (Cliente, Admin, Fiscal)...')
        
        # 1. Cliente (Fátima Manuel)
        email_fatima = 'fatima.manuel@transbook.ao'
        fatima = User.objects.create_user(
            username=email_fatima,
            email=email_fatima,
            password='Luanda@2026',
            first_name='Fátima',
            last_name='Manuel'
        )
        UserProfile.objects.create(
            user=fatima,
            name='Fátima Manuel',
            phone='+244 923 456 789',
            document='005432168LA045',
            avatar='https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
            is_admin=False
        )

        # 2. Administrador (Carlos Admin)
        email_admin = 'admin@transbook.ao'
        admin_user = User.objects.create_user(
            username=email_admin,
            email=email_admin,
            password='Luanda@2026',
            first_name='Carlos',
            last_name='Admin'
        )
        UserProfile.objects.create(
            user=admin_user,
            name='Carlos Admin',
            phone='+244 912 999 888',
            document='008765432LA099',
            avatar='https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80',
            is_admin=True
        )

        # 3. Fiscal (João Fiscal)
        email_fiscal = 'fiscal@transbook.ao'
        fiscal_user = User.objects.create_user(
            username=email_fiscal,
            email=email_fiscal,
            password='Luanda@2026',
            first_name='João',
            last_name='Fiscal'
        )
        UserProfile.objects.create(
            user=fiscal_user,
            name='João Fiscal',
            phone='+244 933 222 111',
            document='009876543LA077',
            avatar='https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
            is_admin=False
        )

        self.stdout.write('Seeding reservation history...')
        reservations_data = [
            {
                'id': 'RES-LUA-HUA-20260601-M8Y2P1',
                'trip': trips[1],
                'passenger_name': 'Fátima Manuel',
                'passenger_email': email_fatima,
                'passenger_phone': '+244 923 456 789',
                'passenger_document': '005432168LA045',
                'seat': '14A',
                'price': 4500,
                'status': 'UTILIZADO',
                'payment_method': 'Multicaixa Express',
                'validation_date': '05:48 01/06/2026',
                'qr_token': 'nzila-token-RES-LUA-HUA-20260601-M8Y2P1-ABC',
            },
            {
                'id': 'RES-HUA-LUA-20260610-K4X9A8',
                'trip': trips[2],
                'passenger_name': 'Fátima Manuel',
                'passenger_email': email_fatima,
                'passenger_phone': '+244 923 456 789',
                'passenger_document': '005432168LA045',
                'seat': '08C',
                'price': 7200,
                'status': 'CONFIRMADO',
                'payment_method': 'Unitel Money',
                'qr_token': 'nzila-token-RES-HUA-LUA-20260610-K4X9A8-DEF',
            },
            {
                'id': 'RES-LUA-LOB-20260520-C3W1T7',
                'trip': trips[3],
                'passenger_name': 'Fátima Manuel',
                'passenger_email': email_fatima,
                'passenger_phone': '+244 923 456 789',
                'passenger_document': '005432168LA045',
                'seat': '22B',
                'price': 4200,
                'status': 'CANCELADO',
                'payment_method': 'Pagamento por referência',
                'qr_token': 'nzila-token-RES-LUA-LOB-20260520-C3W1T7-GHI',
            },
            # General passengers for Admin metrics
            {
                'id': 'RES-LUA-HUA-20260601-A2B3C4',
                'trip': trips[1],
                'passenger_name': 'António Gouveia',
                'passenger_email': 'antonio.g@gmail.com',
                'passenger_phone': '+244 934 111 222',
                'passenger_document': '002135689LA088',
                'seat': '12B',
                'price': 4500,
                'status': 'EMBARCADO',
                'payment_method': 'Multicaixa Express',
                'validation_date': '05:51 01/06/2026',
                'qr_token': 'nzila-token-RES-LUA-HUA-20260601-A2B3C4-JKL',
            },
            {
                'id': 'RES-LUA-HUA-20260601-X9Y8Z7',
                'trip': trips[4],
                'passenger_name': 'Sandra Batalha',
                'passenger_email': 'sandra.b@yahoo.com',
                'passenger_phone': '+244 912 333 444',
                'passenger_document': '008956423LA012',
                'seat': '02A',
                'price': 12500,
                'status': 'UTILIZADO',
                'payment_method': 'PayPay',
                'validation_date': '09:42 01/06/2026',
                'qr_token': 'nzila-token-RES-LUA-HUA-20260601-X9Y8Z7-MNO',
            },
            {
                'id': 'RES-LUA-HUA-20260602-T1Y2U3',
                'trip': trips[2],
                'passenger_name': 'Mateus Manuel',
                'passenger_email': 'mateus.m@outlook.com',
                'passenger_phone': '+244 945 888 777',
                'passenger_document': '007845129LA059',
                'seat': '10B',
                'price': 7200,
                'status': 'CONFIRMADO',
                'payment_method': 'Pagamento por referência',
                'qr_token': 'nzila-token-RES-LUA-HUA-20260602-T1Y2U3-PQR',
            },
            {
                'id': 'RES-LUA-HUA-20260602-R5E6W7',
                'trip': trips[5],
                'passenger_name': 'Isabel Neto',
                'passenger_email': 'isabel.neto@gmail.com',
                'passenger_phone': '+244 921 555 666',
                'passenger_document': '001254789LA033',
                'seat': '18A',
                'price': 4500,
                'status': 'CONFIRMADO',
                'payment_method': 'Multicaixa Express',
                'qr_token': 'nzila-token-RES-LUA-HUA-20260602-R5E6W7-STU',
            },
            {
                'id': 'RES-LUA-HUA-20260602-Q1W2E3',
                'trip': trips[8],
                'passenger_name': 'Carlos Silva',
                'passenger_email': 'carlos.silva@transbook.ao',
                'passenger_phone': '+244 931 444 555',
                'passenger_document': '009854761LA021',
                'seat': '04A',
                'price': 13000,
                'status': 'CONFIRMADO',
                'payment_method': 'Unitel Money',
                'qr_token': 'nzila-token-RES-LUA-HUA-20260602-Q1W2E3-VWX',
            },
            {
                'id': 'RES-LUA-HUA-20260531-M1N2B3',
                'trip': trips[1],
                'passenger_name': 'Marcos André',
                'passenger_email': 'marcos.andre@gmail.com',
                'passenger_phone': '+244 929 111 555',
                'passenger_document': '004758129LA067',
                'seat': '20A',
                'price': 4500,
                'status': 'UTILIZADO',
                'payment_method': 'Multicaixa Express',
                'validation_date': '05:49 31/05/2026',
                'qr_token': 'nzila-token-RES-LUA-HUA-20260531-M1N2B3-YZA',
            },
        ]

        for r_data in reservations_data:
            res = Reservation.objects.create(**r_data)
            
            # If utilized, write ValidationLog entry
            if r_data['status'] in ['UTILIZADO', 'EMBARCADO']:
                ValidationLog.objects.create(
                    reservation=res,
                    status=r_data['status'],
                    validated_by='Fiscal Geral',
                    validation_time=timezone.now()
                )

        self.stdout.write(self.style.SUCCESS('Successfully seeded SQLite database!'))
