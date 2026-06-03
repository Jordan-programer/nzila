import datetime
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from django.utils import timezone
from api.models import (
    UserProfile, Company, Location, Route, Bus, Seat,
    Trip, Reservation, ReservationSeat, Payment, Ticket, Notification,
    CompanyAdmin, CompanyDocument
)

class Command(BaseCommand):
    help = 'Seeds the 12 normalized SQLite database tables with demo transport data.'

    def handle(self, *args, **kwargs):
        self.stdout.write('Clearing database tables...')
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
        Company.objects.all().delete()
        UserProfile.objects.all().delete()
        User.objects.all().delete()

        self.stdout.write('Seeding locations...')
        loc_luanda = Location.objects.create(nome='Luanda', provincia='Luanda')
        loc_huambo = Location.objects.create(nome='Huambo', provincia='Huambo')
        loc_lobito = Location.objects.create(nome='Lobito', provincia='Benguela')
        loc_benguela = Location.objects.create(nome='Benguela', provincia='Benguela')

        self.stdout.write('Seeding routes...')
        # Luanda <-> Huambo (510 min / 8h 30min / 600km)
        route_lua_hua = Route.objects.create(
            origem=loc_luanda, destino=loc_huambo, distancia_km=600.0,
            duracao_estimada=datetime.time(8, 30)
        )
        route_hua_lua = Route.objects.create(
            origem=loc_huambo, destino=loc_luanda, distancia_km=600.0,
            duracao_estimada=datetime.time(8, 30)
        )
        # Luanda -> Lobito (360 min / 6h 00min / 500km)
        route_lua_lob = Route.objects.create(
            origem=loc_luanda, destino=loc_lobito, distancia_km=500.0,
            duracao_estimada=datetime.time(6, 0)
        )

        self.stdout.write('Seeding transport companies...')
        companies_data = [
            {'nome': 'Macon Transportes', 'color': 'bg-blue-600', 'rating': 4.7, 'reviews': 312, 'email': 'macon@macon.ao', 'telefone': '923101010'},
            {'nome': 'Translux Angola', 'color': 'bg-orange-600', 'rating': 4.8, 'reviews': 487, 'email': 'translux@translux.ao', 'telefone': '912202020'},
            {'nome': 'SGO Express', 'color': 'bg-green-600', 'rating': 4.5, 'reviews': 198, 'email': 'sgo@sgo.ao', 'telefone': '933303030'},
            {'nome': 'Unitrans Angola', 'color': 'bg-purple-600', 'rating': 4.4, 'reviews': 89, 'email': 'unitrans@unitrans.ao', 'telefone': '945404040'},
        ]
        
        companies = {}
        for c_data in companies_data:
            code = 'MACON' if 'Macon' in c_data['nome'] else 'TRANSLUX' if 'Translux' in c_data['nome'] else 'SGO' if 'SGO' in c_data['nome'] else 'UNITRANS'
            c = Company.objects.create(
                nome=c_data['nome'],
                email=c_data['email'],
                telefone=c_data['telefone'],
                status='APROVADA',
                color=c_data['color'],
                rating=c_data['rating'],
                reviews=c_data['reviews'],
                logo_url='',
                code=code,
                nif=f"50001234{companies_data.index(c_data)}",
                provincia='Luanda',
                municipio='Luanda',
                endereco='Estrada de Catete, Km 12',
                tipo_empresa='Lda',
                ano_fundacao=2008,
            )
            companies[code] = c

        # Seed a CompanyAdmin for Macon
        CompanyAdmin.objects.create(
            company=companies['MACON'],
            nome='Macon Operador',
            email='macon.operator@transbook.ao',
            telefone='923101010',
            password='Luanda@2026',
            cargo='Gerente de Frota',
            documento_identificacao='002345678LA099'
        )

        self.stdout.write('Seeding buses...')
        # We will create one bus for each company corresponding to the trips
        buses = {}
        # Macon Eco Bus (44 seats)
        buses['MACON_ECO'] = Bus.objects.create(empresa=companies['MACON'], modelo='Marcopolo Paradiso 1200', capacidade=44)
        # Macon VIP Bus (12 seats)
        buses['MACON_VIP'] = Bus.objects.create(empresa=companies['MACON'], modelo='Marcopolo G8 VIP', capacidade=12)
        # Translux Exec Bus (28 seats)
        buses['TRANSLUX_EXEC'] = Bus.objects.create(empresa=companies['TRANSLUX'], modelo='Volvo B11R Executiva', capacidade=28)
        # Translux VIP Bus (12 seats)
        buses['TRANSLUX_VIP'] = Bus.objects.create(empresa=companies['TRANSLUX'], modelo='Volvo G8 VIP Lounge', capacidade=12)
        # SGO Eco Bus (44 seats)
        buses['SGO_ECO'] = Bus.objects.create(empresa=companies['SGO'], modelo='Scania K360 Económica', capacidade=44)
        # Unitrans Exec Bus (28 seats)
        buses['UNITRANS_EXEC'] = Bus.objects.create(empresa=companies['UNITRANS'], modelo='Scania Executiva', capacidade=28)

        self.stdout.write('Seeding seat layout for each bus...')
        for bus_key, bus in buses.items():
            seats_to_create = []
            for i in range(1, bus.capacidade + 1):
                seat_num = f"{i:02d}"
                seat_letter = chr(65 + ((i - 1) % 4)) # A, B, C, D
                seat_label = f"{seat_num}{seat_letter}"
                seats_to_create.append(Seat(bus=bus, numero=seat_label))
            Seat.objects.bulk_create(seats_to_create)

        self.stdout.write('Seeding trips...')
        # We map these to the exact 8 mock trips from MOCK_TRIPS
        trips_data = [
            {
                'id': 1,
                'empresa': companies['MACON'],
                'route': route_lua_hua,
                'bus': buses['MACON_ECO'],
                'data_saida': datetime.date(2026, 6, 15),
                'hora_saida': datetime.time(6, 0),
                'hora_chegada': datetime.time(14, 30),
                'preco_ida': 4500,
                'preco_ida_volta': 9000,
                'classe': 'ECONOMICA',
                'status': 'ATIVA',
                'amenities': 'ar-condicionado,wifi,tomada',
            },
            {
                'id': 2,
                'empresa': companies['TRANSLUX'],
                'route': route_lua_hua,
                'bus': buses['TRANSLUX_EXEC'],
                'data_saida': datetime.date(2026, 6, 15),
                'hora_saida': datetime.time(7, 30),
                'hora_chegada': datetime.time(16, 0),
                'preco_ida': 7200,
                'preco_ida_volta': 14400,
                'classe': 'EXECUTIVA',
                'status': 'ATIVA',
                'amenities': 'ar-condicionado,wifi,tomada,snack',
            },
            {
                'id': 3,
                'empresa': companies['SGO'],
                'route': route_lua_hua,
                'bus': buses['SGO_ECO'],
                'data_saida': datetime.date(2026, 6, 15),
                'hora_saida': datetime.time(8, 0),
                'hora_chegada': datetime.time(16, 30),
                'preco_ida': 4200,
                'preco_ida_volta': 8400,
                'classe': 'ECONOMICA',
                'status': 'ATIVA',
                'amenities': 'ar-condicionado,tomada',
            },
            {
                'id': 4,
                'empresa': companies['TRANSLUX'],
                'route': route_lua_hua,
                'bus': buses['TRANSLUX_VIP'],
                'data_saida': datetime.date(2026, 6, 15),
                'hora_saida': datetime.time(10, 0),
                'hora_chegada': datetime.time(18, 30),
                'preco_ida': 12500,
                'preco_ida_volta': 25000,
                'classe': 'EXECUTIVA', # Maps VIP to EXECUTIVA in db schema choices
                'status': 'ATIVA',
                'amenities': 'ar-condicionado,wifi,tomada,snack,refeicao,almofada',
            },
            {
                'id': 5,
                'empresa': companies['MACON'],
                'route': route_lua_hua,
                'bus': buses['MACON_ECO'],
                'data_saida': datetime.date(2026, 6, 15),
                'hora_saida': datetime.time(14, 0),
                'hora_chegada': datetime.time(22, 30),
                'preco_ida': 4500,
                'preco_ida_volta': 9000,
                'classe': 'ECONOMICA',
                'status': 'ATIVA',
                'amenities': 'ar-condicionado',
            },
            {
                'id': 6,
                'empresa': companies['UNITRANS'],
                'route': route_lua_hua,
                'bus': buses['UNITRANS_EXEC'],
                'data_saida': datetime.date(2026, 6, 15),
                'hora_saida': datetime.time(20, 0),
                'hora_chegada': datetime.time(4, 30),
                'preco_ida': 6800,
                'preco_ida_volta': 13600,
                'classe': 'EXECUTIVA',
                'status': 'ATIVA',
                'amenities': 'ar-condicionado,wifi,tomada,almofada',
            },
            {
                'id': 7,
                'empresa': companies['SGO'],
                'route': route_lua_hua,
                'bus': buses['SGO_ECO'],
                'data_saida': datetime.date(2026, 6, 15),
                'hora_saida': datetime.time(22, 30),
                'hora_chegada': datetime.time(7, 0),
                'preco_ida': 3900,
                'preco_ida_volta': 7800,
                'classe': 'ECONOMICA',
                'status': 'ATIVA',
                'amenities': 'ar-condicionado',
            },
            {
                'id': 8,
                'empresa': companies['MACON'],
                'route': route_lua_hua,
                'bus': buses['MACON_VIP'],
                'data_saida': datetime.date(2026, 6, 15),
                'hora_saida': datetime.time(5, 30),
                'hora_chegada': datetime.time(14, 0),
                'preco_ida': 13000,
                'preco_ida_volta': 26000,
                'classe': 'EXECUTIVA',
                'status': 'ATIVA',
                'amenities': 'ar-condicionado,wifi,tomada,snack,refeicao,almofada,entretenimento',
            },
        ]

        trips = {}
        for t_data in trips_data:
            t_id = t_data.pop('id')
            t = Trip.objects.create(id=t_id, **t_data)
            trips[t_id] = t

        self.stdout.write('Seeding demo users...')
        users_list = [
            {'email': 'fatima.manuel@transbook.ao', 'name': 'Fátima Manuel', 'phone': '+244 923 456 789', 'doc': '005432168LA045', 'role': 'CLIENTE'},
            {'email': 'admin@transbook.ao', 'name': 'Carlos Admin', 'phone': '+244 912 999 888', 'doc': '008765432LA099', 'role': 'ADMIN'},
            {'email': 'fiscal@transbook.ao', 'name': 'João Fiscal', 'phone': '+244 933 222 111', 'doc': '009876543LA077', 'role': 'OPERADOR'},
            {'email': 'macon.operator@transbook.ao', 'name': 'Macon Operador', 'phone': '+244 923 101 010', 'doc': '002345678LA099', 'role': 'OPERADOR', 'company_code': 'MACON'},
            # Other passengers in history
            {'email': 'antonio.g@gmail.com', 'name': 'António Gouveia', 'phone': '+244 934 111 222', 'doc': '002135689LA088', 'role': 'CLIENTE'},
            {'email': 'sandra.b@yahoo.com', 'name': 'Sandra Batalha', 'phone': '+244 912 333 444', 'doc': '008956423LA012', 'role': 'CLIENTE'},
            {'email': 'mateus.m@outlook.com', 'name': 'Mateus Manuel', 'phone': '+244 945 888 777', 'doc': '007845129LA059', 'role': 'CLIENTE'},
            {'email': 'isabel.neto@gmail.com', 'name': 'Isabel Neto', 'phone': '+244 921 555 666', 'doc': '001254789LA033', 'role': 'CLIENTE'},
            {'email': 'carlos.silva@transbook.ao', 'name': 'Carlos Silva', 'phone': '+244 931 444 555', 'doc': '009854761LA021', 'role': 'CLIENTE'},
            {'email': 'marcos.andre@gmail.com', 'name': 'Marcos André', 'phone': '+244 929 111 555', 'doc': '004758129LA067', 'role': 'CLIENTE'},
        ]

        seeded_users = {}
        for u_data in users_list:
            u = User.objects.create_user(
                username=u_data['email'],
                email=u_data['email'],
                password='Luanda@2026',
                first_name=u_data['name'].split(' ')[0],
                last_name=u_data['name'].split(' ')[1] if ' ' in u_data['name'] else ''
            )
            
            comp_obj = None
            if 'company_code' in u_data:
                comp_obj = companies.get(u_data['company_code'])
                
            UserProfile.objects.create(
                user=u,
                nome=u_data['name'],
                email=u_data['email'],
                telefone=u_data['phone'],
                document=u_data['doc'],
                role=u_data['role'],
                company=comp_obj
            )
            seeded_users[u_data['email']] = u

        self.stdout.write('Seeding reservations, payments, and tickets...')
        reservations_data = [
            {
                'code': 'RES-LUA-HUA-20260601-M8Y2P1',
                'trip': trips[1],
                'user': seeded_users['fatima.manuel@transbook.ao'],
                'seat_num': '14A',
                'status': 'EMBARCADO',
                'method': 'MULTICAIXA',
                'pay_status': 'PAGO',
                'usado': True,
                'validation_date': timezone.make_aware(datetime.datetime(2026, 6, 1, 5, 48)),
                'token': 'nzila-token-RES-LUA-HUA-20260601-M8Y2P1-ABC',
            },
            {
                'code': 'RES-HUA-LUA-20260610-K4X9A8',
                'trip': trips[2],
                'user': seeded_users['fatima.manuel@transbook.ao'],
                'seat_num': '08C',
                'status': 'CONFIRMADA',
                'method': 'UNITEL_MONEY',
                'pay_status': 'PAGO',
                'usado': False,
                'token': 'nzila-token-RES-HUA-LUA-20260610-K4X9A8-DEF',
            },
            {
                'code': 'RES-LUA-LOB-20260520-C3W1T7',
                'trip': trips[3],
                'user': seeded_users['fatima.manuel@transbook.ao'],
                'seat_num': '22B',
                'status': 'CANCELADA',
                'method': 'MULTICAIXA',
                'pay_status': 'PAGO',
                'usado': False,
                'token': 'nzila-token-RES-LUA-LOB-20260520-C3W1T7-GHI',
            },
            {
                'code': 'RES-LUA-HUA-20260601-A2B3C4',
                'trip': trips[1],
                'user': seeded_users['antonio.g@gmail.com'],
                'seat_num': '12B',
                'status': 'EMBARCADO',
                'method': 'MULTICAIXA',
                'pay_status': 'PAGO',
                'usado': True,
                'validation_date': timezone.make_aware(datetime.datetime(2026, 6, 1, 5, 51)),
                'token': 'nzila-token-RES-LUA-HUA-20260601-A2B3C4-JKL',
            },
            {
                'code': 'RES-LUA-HUA-20260601-X9Y8Z7',
                'trip': trips[4],
                'user': seeded_users['sandra.b@yahoo.com'],
                'seat_num': '02A',
                'status': 'EMBARCADO',
                'method': 'PAYPAY',
                'pay_status': 'PAGO',
                'usado': True,
                'validation_date': timezone.make_aware(datetime.datetime(2026, 6, 1, 9, 42)),
                'token': 'nzila-token-RES-LUA-HUA-20260601-X9Y8Z7-MNO',
            },
            {
                'code': 'RES-LUA-HUA-20260602-T1Y2U3',
                'trip': trips[2],
                'user': seeded_users['mateus.m@outlook.com'],
                'seat_num': '10B',
                'status': 'CONFIRMADA',
                'method': 'MULTICAIXA',
                'pay_status': 'PAGO',
                'usado': False,
                'token': 'nzila-token-RES-LUA-HUA-20260602-T1Y2U3-PQR',
            },
            {
                'code': 'RES-LUA-HUA-20260602-R5E6W7',
                'trip': trips[5],
                'user': seeded_users['isabel.neto@gmail.com'],
                'seat_num': '18A',
                'status': 'CONFIRMADA',
                'method': 'MULTICAIXA',
                'pay_status': 'PAGO',
                'usado': False,
                'token': 'nzila-token-RES-LUA-HUA-20260602-R5E6W7-STU',
            },
            {
                'code': 'RES-LUA-HUA-20260602-Q1W2E3',
                'trip': trips[8],
                'user': seeded_users['carlos.silva@transbook.ao'],
                'seat_num': '04A',
                'status': 'CONFIRMADA',
                'method': 'UNITEL_MONEY',
                'pay_status': 'PAGO',
                'usado': False,
                'token': 'nzila-token-RES-LUA-HUA-20260602-Q1W2E3-VWX',
            },
            {
                'code': 'RES-LUA-HUA-20260531-M1N2B3',
                'trip': trips[1],
                'user': seeded_users['marcos.andre@gmail.com'],
                'seat_num': '20A',
                'status': 'EMBARCADO',
                'method': 'MULTICAIXA',
                'pay_status': 'PAGO',
                'usado': True,
                'validation_date': timezone.make_aware(datetime.datetime(2026, 5, 31, 5, 49)),
                'token': 'nzila-token-RES-LUA-HUA-20260531-M1N2B3-YZA',
            },
        ]

        for r_data in reservations_data:
            res = Reservation.objects.create(
                codigo_reserva=r_data['code'],
                user=r_data['user'],
                trip=r_data['trip'],
                status=r_data['status'],
                total=r_data['trip'].preco_ida
            )

            # Get or create Seat
            seat_obj, _ = Seat.objects.get_or_create(
                bus=r_data['trip'].bus,
                numero=r_data['seat_num']
            )

            # Register ReservationSeat
            ReservationSeat.objects.create(
                reservation=res,
                seat=seat_obj
            )

            # Register Payment
            Payment.objects.create(
                reservation=res,
                metodo=r_data['method'],
                status=r_data['pay_status'],
                referencia=f"REF-{r_data['code']}-REF",
                valor=r_data['trip'].preco_ida
            )

            # Register Ticket (QR / Token)
            Ticket.objects.create(
                reservation=res,
                qr_code=f"nzila-qr-code-{r_data['code']}",
                token=r_data['token'],
                usado=r_data['usado'],
                data_validacao=r_data.get('validation_date')
            )

            # Create Notification
            Notification.objects.create(
                user=r_data['user'],
                tipo='CONFIRMACAO',
                mensagem=f"Seu bilhete de {r_data['trip'].route.origem.nome} para {r_data['trip'].route.destino.nome} está confirmado.",
                enviado=True
            )

        self.stdout.write(self.style.SUCCESS('Successfully seeded 12 normalized SQLite tables!'))
