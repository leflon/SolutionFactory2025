import csv

# Données complètes des lignes du métro parisien
metro_paris_data = [
    {
        "ligne": "1",
        "date_ouverture": "19/07/1900",
        "materiel_roulant": "MP 05",
        "nombre_voyageurs": "750 000",
        "longueur_km": 16.5,
        "nombre_stations": 25,
        "temps_trajet_minutes": 36
    },
    {
        "ligne": "2",
        "date_ouverture": "13/12/1900",
        "materiel_roulant": "MF 01",
        "nombre_voyageurs": "600 000",
        "longueur_km": 12.4,
        "nombre_stations": 25,
        "temps_trajet_minutes": 33
    },
    {
        "ligne": "3",
        "date_ouverture": "19/10/1904",
        "materiel_roulant": "MF 67",
        "nombre_voyageurs": "450 000",
        "longueur_km": 11.7,
        "nombre_stations": 25,
        "temps_trajet_minutes": 31
    },
    {
        "ligne": "3B",
        "date_ouverture": "27/03/1971",
        "materiel_roulant": "MF 67",
        "nombre_voyageurs": "35 000",
        "longueur_km": 1.3,
        "nombre_stations": 4,
        "temps_trajet_minutes": 4
    },
    {
        "ligne": "4",
        "date_ouverture": "21/04/1908",
        "materiel_roulant": "MF 89 CA",
        "nombre_voyageurs": "600 000",
        "longueur_km": 14.6,
        "nombre_stations": 29,
        "temps_trajet_minutes": 36
    },
    {
        "ligne": "5",
        "date_ouverture": "02/06/1906",
        "materiel_roulant": "MF 01",
        "nombre_voyageurs": "530 000",
        "longueur_km": 14.6,
        "nombre_stations": 22,
        "temps_trajet_minutes": 34
    },
    {
        "ligne": "6",
        "date_ouverture": "02/03/1900",
        "materiel_roulant": "MP 73",
        "nombre_voyageurs": "450 000",
        "longueur_km": 13.6,
        "nombre_stations": 28,
        "temps_trajet_minutes": 31
    },
    {
        "ligne": "7",
        "date_ouverture": "05/11/1910",
        "materiel_roulant": "MF 77",
        "nombre_voyageurs": "540 000",
        "longueur_km": 22.4,
        "nombre_stations": 38,
        "temps_trajet_minutes": 48
    },
    {
        "ligne": "7B",
        "date_ouverture": "03/12/1967",
        "materiel_roulant": "MF 88",
        "nombre_voyageurs": "40 000",
        "longueur_km": 3.1,
        "nombre_stations": 8,
        "temps_trajet_minutes": 8
    },
    {
        "ligne": "8",
        "date_ouverture": "13/07/1913",
        "materiel_roulant": "MF 77",
        "nombre_voyageurs": "540 000",
        "longueur_km": 23.3,
        "nombre_stations": 38,
        "temps_trajet_minutes": 52
    },
    {
        "ligne": "9",
        "date_ouverture": "08/11/1922",
        "materiel_roulant": "MF 01",
        "nombre_voyageurs": "580 000",
        "longueur_km": 19.6,
        "nombre_stations": 37,
        "temps_trajet_minutes": 52
    },
    {
        "ligne": "10",
        "date_ouverture": "30/12/1923",
        "materiel_roulant": "MF 67",
        "nombre_voyageurs": "300 000",
        "longueur_km": 11.7,
        "nombre_stations": 23,
        "temps_trajet_minutes": 28
    },
    {
        "ligne": "11",
        "date_ouverture": "28/04/1935",
        "materiel_roulant": "MP 14 CC",
        "nombre_voyageurs": "160 000",
        "longueur_km": 6.3,
        "nombre_stations": 13,
        "temps_trajet_minutes": 15
    },
    {
        "ligne": "12",
        "date_ouverture": "05/11/1910",
        "materiel_roulant": "MF 67",
        "nombre_voyageurs": "400 000",
        "longueur_km": 17.2,
        "nombre_stations": 31,
        "temps_trajet_minutes": 38
    },
    {
        "ligne": "13",
        "date_ouverture": "26/02/1911",
        "materiel_roulant": "MF 77",
        "nombre_voyageurs": "600 000",
        "longueur_km": 24.3,
        "nombre_stations": 32,
        "temps_trajet_minutes": 37
    },
    {
        "ligne": "14",
        "date_ouverture": "15/10/1998",
        "materiel_roulant": "MP 14 CA",
        "nombre_voyageurs": "800 000",
        "longueur_km": 14.4,
        "nombre_stations": 13,
        "temps_trajet_minutes": 28
    }
]

# Écriture CSV
csv_path = "metro_data.csv"
with open(csv_path, mode='w', newline='', encoding='utf-8') as csvfile:
    fieldnames = [
        "ligne",
        "date_ouverture",
        "materiel_roulant",
        "nombre_voyageurs",
        "longueur_km",
        "nombre_stations",
        "temps_trajet_minutes"
    ]
    writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
    writer.writeheader()
    for ligne in metro_paris_data:
        writer.writerow(ligne)

csv_path
