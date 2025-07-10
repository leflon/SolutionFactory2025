<p align='center'>
  <img src='/github-splash.png' alt='RouleMaPoule' width='512' />
  <h2 align='center'>Roule Ma Poule</h2>
	<h3 align='center'>Votre assistant mobilité intelligent</h3>
</p>
<p align='center'>
  <img src="https://img.shields.io/badge/typescript-3178c6?logo=typescript&style=for-the-badge&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/nextjs-000000?logo=next.js&style=for-the-badge&logoColor=white" alt="Next.js">
	<img src="https://img.shields.io/badge/tailwind-06B6D4?logo=tailwind-css&style=for-the-badge&logoColor=white" alt="Tailwind">
	<img src="https://img.shields.io/badge/leaflet-199900?logo=leaflet&style=for-the-badge" alt="Leaflet">
	<img src="https://img.shields.io/badge/gemini-8E75B2?logo=googlegemini&style=for-the-badge&logoColor=white" alt="Gemini">
  <img src="https://img.shields.io/badge/sqlite-003B57?logo=sqlite&style=for-the-badge" alt="SQLite">
</p>

## Le Projet
Plongez au cœur de la mobilité parisienne avec notre application web innovante. Fini le stress des transports en commun : grâce à notre **chatbot intelligent**, obtenez instantanément les meilleurs itinéraires de métro, des informations sur les stations et des détails sur les lignes. 

Restez informé grâce à notre **info trafic actualisée en temps réel**, et profitez d'une expérience utilisateur fluide et intuitive pour optimuler tous vos déplacements. Simplifiez vos trajets, gagnez du temps et explorez Paris en toute sérénité !

## Installation
Pour lancer l'application en local, suivez ces étapes :
 1. **Clôner le dépot**
```bash
git clone https://github.com/leflon/SolutionFactory2025.git
# ou si vous préférez GitHub CLI
gh repo clone leflon/SolutionFactory2025
```
 2. **Installer les dépendances**

Naviguez dans le répertoire du projet et installez les dépendances nécessaires :

```bash
cd SolutionFactory2025
npm install
```
 3. **Configurer les variables d'environnement**

Créez un fichier `.env`à la racine du projet en vous basant sur le fichier `.env.example`. Renseignez-y les variables d'environnement requises pour le bon fonctionnement de l'application.

Vous pouvez générer votre clé API IDFM [ici](https://prim.iledefrance-mobilites.fr/fr/mes-jetons-authentification) et votre clé API Gemini [ici](https://aistudio.google.com/apikey)

 4. **Construire la base de données**

Après avoir téléchargés les [Données GTFS](https://efrei365net-my.sharepoint.com/:f:/g/personal/youssef_ait-el-mahjoub_efrei_fr/EizKQSdL9f9Ip53NBEH6KIMBPtdQ4dAKhoLaFE-LzdSwVA?e=rom6aO) et le dataset [Positionnement dans la rame](https://prim.iledefrance-mobilites.fr/fr/jeux-de-donnees/positionnement-dans-la-rame) au fichier CSV (et après avoir remplacé les point-virgules par des virgules dans ce fichier), placer les tous dans le dossier data/raw. Ensuite, lancez la commande suivante :

```bash
cd data && node format.js
```

**La création de la base de données peut prendre plusieurs minutes**

5. **Lancer le serveur de développement**

Lancez le serveur de développement avec la commande suivante :
```bash
npm run dev
```

Et visitez l'application sur `http://localhost:3000`.
## L'Équipe
Ce projet vous est proposé par l'équipe **12C** de la Promo 2027 : 
 - Gaspard Brom
 - Victor Bucas
 - Louis Hislaire
 - Paul Leflon
 - Thomas Marchal
