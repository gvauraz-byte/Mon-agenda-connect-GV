# Agenda projets

Vue annuelle connectee a ton compte iCloud, avec des projets filtrables, les jours feries et les vacances scolaires. La periode affichee commence en aout 2026 et tu peux avancer sans limite avec les fleches.

Comment ca marche : cette appli est un petit serveur web qui lit et ecrit directement dans ton calendrier iCloud (via CalDAV, le protocole que l'app Calendrier de l'iPhone utilise deja). Les projets sont enregistres dans le champ "categories" de chaque evenement, donc ils voyagent avec l'evenement dans iCloud.

## Etape 1 - Creer un mot de passe d'application iCloud

1. Va sur [appleid.apple.com](https://appleid.apple.com) et connecte-toi.
2. Dans "Connexion et securite", clique sur "Mots de passe pour applications".
3. Cree-en un nouveau, donne-lui un nom (ex "Agenda projets"), et note le mot de passe genere (format `xxxx-xxxx-xxxx-xxxx`). Tu ne pourras plus le revoir apres.

Ce n'est pas ton mot de passe Apple habituel : il ne donne acces qu'au calendrier, et tu peux le revoquer a tout moment depuis la meme page.

## Etape 2 - Mettre le code sur GitHub

1. Cree un compte gratuit sur [github.com](https://github.com) si tu n'en as pas.
2. Clique sur "New repository", donne-lui un nom (ex `agenda-projets`), laisse-le en **Public** ou **Private** (peu importe), ne coche aucune option d'initialisation, puis "Create repository".
3. Sur la page qui suit, clique sur "uploading an existing file" et glisse-depose tout le contenu de ce dossier (sauf le fichier `.env.example`, garde-le quand meme si tu veux, il ne contient pas de vrai mot de passe).
4. Valide avec "Commit changes".

## Etape 3 - Deployer sur Render

1. Cree un compte gratuit sur [render.com](https://render.com) (tu peux te connecter directement avec GitHub).
2. Clique sur "New +" puis "Web Service".
3. Choisis le depot GitHub que tu viens de creer.
4. Renseigne :
   - **Name** : agenda-projets (ou ce que tu veux)
   - **Runtime** : Node
   - **Build Command** : `npm install`
   - **Start Command** : `npm start`
   - **Instance Type** : Free
5. Dans la section "Environment Variables", ajoute :
   - `ICLOUD_USERNAME` = ton adresse iCloud (ex `gvauraz@icloud.com`)
   - `ICLOUD_APP_PASSWORD` = le mot de passe d'application genere a l'etape 1
6. Clique sur "Create Web Service". Le premier deploiement prend 2-3 minutes.

Une fois termine, Render te donne une URL du type `https://agenda-projets.onrender.com`.

Note sur le plan gratuit : le service s'endort apres 15 minutes sans visite et met quelques secondes a se reveiller au prochain chargement. C'est normal pour un usage personnel.

## Etape 4 - Ouvrir sur iPhone

1. Ouvre l'URL Render dans Safari sur ton iPhone.
2. Appuie sur l'icone de partage, puis "Sur l'ecran d'accueil". L'appli s'ouvre alors comme une vraie application.

## Utilisation

- Les points colores en haut sont tes projets : touche-en un pour l'afficher ou le masquer sur la vue annuelle. Appuie longuement (clic droit sur ordinateur) pour en supprimer un.
- "+ Projet" cree un nouveau projet (nom + couleur).
- "Jours feries" et "Vacances scolaires" sont des filtres optionnels ; pour les vacances, choisis ta zone (A, B ou C).
- Touche un jour dans le tableau pour voir ses evenements, en ajouter un (avec ou sans projet), ou en supprimer.
- Un evenement cree ou modifie ici apparait automatiquement dans l'app Calendrier de ton iPhone, et inversement.

## Limites actuelles (premiere version)

- Les nouveaux evenements sont crees comme evenements "journee entiere" (pas encore d'heure precise).
- La modification d'un evenement existant n'est pas encore possible depuis l'appli (uniquement creation et suppression) ; utilise l'app Calendrier iPhone pour modifier un evenement existant.
- Les vacances scolaires sont basees sur les dates officielles publiees pour les annees 2025-2026 et 2026-2027 ; au-dela, l'appli n'affichera rien tant que les dates ne seront pas ajoutees dans `lib/holidays.js`.

Dis-moi ce que tu veux ameliorer en premier (heures precises, edition d'evenements, autres annees de vacances, etc.).
