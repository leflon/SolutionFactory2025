import csv

# Données simplifiées pour les lignes du métro parisien
metro_paris_data = [
    {
        "ligne": "1",
        "date_ouverture": "19/07/1900",
        "materiel_roulant": "MF 01 et MF 67",
        "nombre_voyageurs": "750 000 voyages/jour",
        "terminus_nord": "La Défense",
        "terminus_sud": "Château de Vincennes",
    },
    {
        "ligne": "2",
        "date_ouverture": "13/12/1900",
        "materiel_roulant": "MF 01",
        "nombre_voyageurs": "600 000 voyages/jour",
        "terminus_nord": "Porte Dauphine",
        "terminus_sud": "Nation",
    },
    {
        "ligne": "3",
        "date_ouverture": "19/10/1904",
        "materiel_roulant": "MF 67",
        "nombre_voyageurs": "450 000 voyages/jour",
        "terminus_nord": "Pont de Levallois – Bécon",
        "terminus_sud": "Gambetta",
    },
    {
        "ligne": "3bis",
        "date_ouverture": "27/03/1921",
        "materiel_roulant": "MF 67",
        "nombre_voyageurs": "35 000 voyages/jour",
        "terminus_nord": "Pelleport",
        "terminus_sud": "Gambetta",
    },
    {
        "ligne": "4",
        "date_ouverture": "21/04/1908",
        "materiel_roulant": "MF 77",
        "nombre_voyageurs": "600 000 voyages/jour",
        "terminus_nord": "Porte de Clignancourt",
        "terminus_sud": "Mairie de Montrouge",
    },
    {
        "ligne": "5",
        "date_ouverture": "15/06/1906",
        "materiel_roulant": "MF 01",
        "nombre_voyageurs": "530 000 voyages/jour",
        "terminus_nord": "Bobigny – Pablo Picasso",
        "terminus_sud": "Place d'Italie",
    },
    {
        "ligne": "6",
        "date_ouverture": "01/03/1909",
        "materiel_roulant": "MP 73",
        "nombre_voyageurs": "450 000 voyages/jour",
        "terminus_nord": "Charles de Gaulle – Étoile",
        "terminus_sud": "Nation",
    },
    {
        "ligne": "7",
        "date_ouverture": "05/11/1910",
        "materiel_roulant": "MF 77",
        "nombre_voyageurs": "540 000 voyages/jour",
        "terminus_nord": "La Courneuve – 8 mai 1945",
        "terminus_sud": "Mairie d'Ivry / Villejuif – Louis Aragon",
    },
    {
        "ligne": "7bis",
        "date_ouverture": "18/01/1911",
        "materiel_roulant": "MF 88",
        "nombre_voyageurs": "40 000 voyages/jour",
        "terminus_nord": "Louis Blanc",
        "terminus_sud": "Pré Saint-Gervais",
    },
    {
        "ligne": "8",
        "date_ouverture": "05/05/1913",
        "materiel_roulant": "MF 77",
        "nombre_voyageurs": "540 000 voyages/jour",
        "terminus_nord": "Balard",
        "terminus_sud": "Pointe du Lac",
    },
    {
        "ligne": "9",
        "date_ouverture": "10/12/1922",
        "materiel_roulant": "MF 01",
        "nombre_voyageurs": "580 000 voyages/jour",
        "terminus_nord": "Pont de Sèvres",
        "terminus_sud": "Mairie de Montreuil",
    },
    {
        "ligne": "10",
        "date_ouverture": "30/12/1923",
        "materiel_roulant": "MF 67",
        "nombre_voyageurs": "300 000 voyages/jour",
        "terminus_nord": "Boulogne – Pont de Saint-Cloud",
        "terminus_sud": "Gare d'Austerlitz",
    },
    {
        "ligne": "11",
        "date_ouverture": "28/04/1935",
        "materiel_roulant": "MP 59",
        "nombre_voyageurs": "160 000 voyages/jour",
        "terminus_nord": "Château de Vincennes",
        "terminus_sud": "Mairie des Lilas",
    },
    {
        "ligne": "12",
        "date_ouverture": "05/11/1910",
        "materiel_roulant": "MF 67",
        "nombre_voyageurs": "400 000 voyages/jour",
        "terminus_nord": "Front Populaire",
        "terminus_sud": "Mairie d'Issy",
    },
    {
        "ligne": "13",
        "date_ouverture": "26/02/1911",
        "materiel_roulant": "MF 77",
        "nombre_voyageurs": "600 000 voyages/jour",
        "terminus_nord": "Les Courtilles / Saint-Denis – Université",
        "terminus_sud": "Châtillon – Montrouge",
    },
    {
        "ligne": "14",
        "date_ouverture": "15/10/1998",
        "materiel_roulant": "MP 89 → MP 14 (automatisé, 8 voitures)",
        "nombre_voyageurs": "800 000 voyages/jour",
        "terminus_nord": "Saint-Denis – Pleyel",
        "terminus_sud": "Aéroport d’Orly",
    },
]

# Écriture CSV
csv_path = "/mnt/data/metro_paris_lignes.csv"
with open(csv_path, mode='w', newline='', encoding='utf-8') as csvfile:
    fieldnames = ["ligne", "date_ouverture", "materiel_roulant", "nombre_voyageurs", "terminus_nord", "terminus_sud"]
    writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
    writer.writeheader()
    for ligne in metro_paris_data:
        writer.writerow(ligne)

csv_path
