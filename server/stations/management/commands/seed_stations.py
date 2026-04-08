"""Seed database with sample security stations across Nigeria."""
from django.core.management.base import BaseCommand

from stations.models import SecurityStation


SAMPLE_STATIONS = [
    # Police Stations
    {"name": "Force Headquarters Abuja", "station_type": "police", "latitude": 9.0579, "longitude": 7.4951, "address": "Louis Edet House, Abuja", "phone_number": "08031236199"},
    {"name": "Lagos State Police Command", "station_type": "police", "latitude": 6.4531, "longitude": 3.3958, "address": "Lagos Island, Lagos", "phone_number": "08078609261"},
    {"name": "Bar Beach Police Station", "station_type": "police", "latitude": 6.4324, "longitude": 3.4180, "address": "Victoria Island, Lagos", "phone_number": ""},
    {"name": "Ikeja Police Station", "station_type": "police", "latitude": 6.6018, "longitude": 3.3515, "address": "Ikeja, Lagos", "phone_number": ""},
    {"name": "Kano State Police Command", "station_type": "police", "latitude": 12.0022, "longitude": 8.5919, "address": "Bompai Road, Kano", "phone_number": ""},
    {"name": "Rivers State Police Command", "station_type": "police", "latitude": 4.8156, "longitude": 7.0498, "address": "Port Harcourt, Rivers", "phone_number": ""},
    {"name": "Lekki Phase 1 Police Station", "station_type": "police", "latitude": 6.4398, "longitude": 3.4721, "address": "Lekki Phase 1, Lagos", "phone_number": ""},
    {"name": "Oyo State Police Command", "station_type": "police", "latitude": 7.3775, "longitude": 3.9470, "address": "Eleyele, Ibadan", "phone_number": ""},
  
    # Army Barracks
    {"name": "Bonny Camp", "station_type": "army", "latitude": 3.4119, "longitude": 6.4355, "address": "Victoria Island, Lagos", "phone_number": ""},
    {"name": "Ikeja Army Cantonment", "station_type": "army", "latitude": 3.3377, "longitude": 6.6053, "address": "Ikeja, Lagos", "phone_number": ""},
    {"name": "Mogadishu Cantonment", "station_type": "army", "latitude": 7.4863, "longitude": 9.0716, "address": "Asokoro, Abuja", "phone_number": ""},
    {"name": "Jaji Military Cantonment", "station_type": "army", "latitude": 7.5250, "longitude": 10.5417, "address": "Jaji, Kaduna", "phone_number": ""},
    {"name": "82 Division Nigerian Army", "station_type": "army", "latitude": 7.5127, "longitude": 6.4423, "address": "Enugu", "phone_number": ""},

    # Military Bases
    {"name": "Nigerian Defence Academy", "station_type": "military", "latitude": 7.4317, "longitude": 10.5260, "address": "Afaka, Kaduna", "phone_number": ""},
    {"name": "Sambisa Military Base", "station_type": "military", "latitude": 13.5833, "longitude": 11.4500, "address": "Borno State", "phone_number": ""},
    {"name": "Maimalari Barracks", "station_type": "military", "latitude": 13.1510 , "longitude": 11.8311, "address": "Maiduguri, Borno", "phone_number": ""},

    # Navy
    {"name": "Western Naval Command", "station_type": "navy", "latitude": 3.4070, "longitude": 6.4290, "address": "Apapa, Lagos", "phone_number": ""},
    {"name": "NNS Beecroft", "station_type": "navy", "latitude": 3.4075, "longitude": 6.4295, "address": "Apapa, Lagos", "phone_number": ""},

    # Civil Defense
    {"name": "NSCDC Headquarters", "station_type": "civil_defense", "latitude": 7.4890, "longitude": 9.0580, "address": "Abuja", "phone_number": "08033226246"},
    {"name": "NSCDC Lagos Command", "station_type": "civil_defense", "latitude": 3.3890, "longitude": 6.4550, "address": "Lagos", "phone_number": ""},

    # Fire Stations
    {"name": "Federal Fire Service HQ", "station_type": "fire", "latitude": 7.4940, "longitude": 9.0570, "address": "Abuja", "phone_number": "112"},
    {"name": "Lagos State Fire Service", "station_type": "fire", "latitude": 3.3920, "longitude": 6.4560, "address": "Lagos Island, Lagos", "phone_number": "112"},
]


class Command(BaseCommand):
    help = 'Seed the database with sample security stations'

    def handle(self, *args, **options):
        created_count = 0
        for station_data in SAMPLE_STATIONS:
            _, created = SecurityStation.objects.get_or_create(
                name=station_data['name'],
                defaults=station_data,
            )
            if created:
                created_count += 1

        self.stdout.write(
            self.style.SUCCESS(f'Seeded {created_count} security stations.')
        )
