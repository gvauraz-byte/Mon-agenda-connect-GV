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
   - `SHARE_TOKEN` (optionnel, pour le lien de partage en lecture seule) = une chaine longue et aleatoire de ton choix, par exemple `a1b2c3d4e5f6g7h8` (invente-la, plus c'est long et random mieux c'est, personne ne doit pouvoir la deviner)
6. Clique sur "Create Web Service". Le premier deploiement prend 2-3 minutes.

Une fois termine, Render te donne une URL du type `https://agenda-projets.onrender.com`.

Note sur le plan gratuit : le service s'endort apres 15 minutes sans visite et met quelques secondes a se reveiller au prochain chargement. C'est normal pour un usage personnel.

## Rendre le stockage durable (recommande)

Par defaut, tes projets personnalises et les soumissions en attente sont stockes dans de simples fichiers sur le serveur Render, qui peuvent etre reinitialises a chaque mise a jour du code. Pour eviter ca, connecte l'app a ton depot GitHub :

1. Sur GitHub, va dans tes parametres de compte : **Settings > Developer settings > Personal access tokens > Fine-grained tokens > Generate new token**.
2. Donne-lui un nom, limite-le a "Only select repositories" et choisis ton depot `agenda-projets`.
3. Dans "Repository permissions", mets "Contents" sur **Read and write**.
4. Genere le token et copie-le (tu ne pourras plus le revoir apres).
5. Dans Render, section "Environment Variables", ajoute :
   - `GITHUB_TOKEN` = le token copie
   - `GITHUB_REPO` = `ton-compte-github/agenda-projets` (remplace par ton vrai nom de compte et de depot)
6. Sauvegarde, Render redeploie automatiquement.

Une fois configure, l'app ecrit directement tes projets et soumissions dans un dossier `data/` de ton depot GitHub a chaque changement — ils survivent a toutes les futures mises a jour. Si tu ne configures pas ces variables, l'app continue de fonctionner normalement, juste avec le risque de reinitialisation deja mentionne (un message te le rappelle dans le panneau "Gerer les projets" si c'est le cas).

## Etape 4 - Ouvrir sur iPhone

1. Ouvre l'URL Render dans Safari sur ton iPhone.
2. Appuie sur l'icone de partage, puis "Sur l'ecran d'accueil". L'appli s'ouvre alors comme une vraie application.

## Utilisation

- Les points colores en haut sont tes projets : touche-en un pour l'afficher ou le masquer sur la vue annuelle.
- "Gerer les projets" ouvre un panneau pour renommer un projet, changer sa couleur (touche le rond colore) ou le supprimer, et pour en ajouter un nouveau.
- "Jours feries" et "Vacances scolaires" sont des filtres optionnels ; pour les vacances, choisis ta zone (A, B ou C).
- Touche un jour dans le tableau pour voir ses evenements. Chaque evenement s'affiche sur sa propre ligne dans la case du jour (avec l'heure s'il en a une) ; s'il y en a plus de 3, un "+N" indique le nombre restant, visible en entier dans le panneau du jour.
- Dans le panneau d'un jour, "Modifier" ouvre un petit formulaire pour changer le titre, la date, l'heure (ou "journee entiere") et le projet d'un evenement existant. Changer la date permet de deplacer facilement un evenement vers un autre jour.
- "Dupliquer" cree une copie d'un evenement a la date de ton choix (utile pour un evenement recurrent que tu recrees toutes les semaines par exemple).
- Pour un evenement "journee entiere", le champ "jusqu'au" (a l'ajout comme a l'edition) permet de le faire durer plusieurs jours sans le ressaisir chaque jour : il apparait alors sur toute la periode dans la vue annuelle.
- Le formulaire d'ajout permet de choisir une heure de debut/fin (ou de laisser "journee entiere"), un projet, et dans quel calendrier iCloud (Personnel, Travail, etc.) l'evenement doit etre cree.
- La barre de recherche en haut cherche un evenement par titre sur les 5 prochaines annees et te propose de sauter directement a sa date.
- Un champ "Lieu" (optionnel) est disponible a la creation et a l'edition d'un evenement ; il apparait aussi dans l'app Calendrier de ton iPhone.
- "Vue liste" affiche tous les evenements de la periode dans l'ordre chronologique, avec date, heure, lieu et projet — pratique pour un recapitulatif complet plutot que la grille.
- Un evenement cree ou modifie ici apparait automatiquement dans l'app Calendrier de ton iPhone, et inversement.

## Nouveau : partage et formulaire partenaires

- **Telecharger en PDF** : genere un PDF de la vue annuelle actuellement affichee (meme filtres projets/feries/vacances que ce que tu vois a l'ecran).
- **Copier le lien lecture seule** (visible seulement si `SHARE_TOKEN` est configure) : un lien secret que tu peux envoyer a quelqu'un pour qu'il consulte ton agenda sans pouvoir rien modifier. Personne ne peut deviner ce lien sans que tu le lui donnes.
- **Soumissions** : ouvre le panneau des propositions envoyees par des partenaires via le formulaire public. Pour chaque soumission tu peux l'associer a un projet existant (ou en creer un nouveau a la volee) puis "Accepter" pour creer le vrai evenement dans ton iCloud, ou "Refuser" pour la supprimer. Rien n'est jamais ajoute a ton agenda sans validation de ta part.
- **Lien formulaire** (dans "Gerer les projets", a cote de chaque projet) : copie un lien a envoyer a un partenaire, deja verrouille sur ce projet precis (il ne pourra pas le changer). Le bouton "Copier" au sommet du panneau "Soumissions" donne le lien generique, ou le partenaire renseigne lui-meme le nom du projet.

Le formulaire partenaire demande : titre, dates (avec option "jusqu'au" pour plusieurs jours), heure ou "journee entiere", lieu, et projet (verrouille ou libre) — exactement ce que tu avais demande.

## Mettre a jour l'appli apres une modification

Comme le depot n'est pas connecte a Git en ligne de commande, la facon la plus simple de mettre a jour ton app est :

1. Va sur la page de ton depot GitHub.
2. Pour chaque fichier modifie, clique dessus, puis sur l'icone crayon (Edit), colle le nouveau contenu, et "Commit changes". Ou plus simple : utilise "Add file" > "Upload files" et depose les fichiers modifies, GitHub te proposera de remplacer les anciens.
3. Des que le commit est valide, Render redeploie automatiquement (l'auto-deploy est active par defaut). Tu peux suivre la progression dans l'onglet "Logs" de ton service Render.

## Corrige dans cette version

- Bug corrige : un evenement "journee entiere" s'etalant sur un changement de mois (ex. 17 au 30 septembre) pouvait se dupliquer en boucle sur la vue annuelle. La date de fin est maintenant calculee correctement (y compris les changements de mois et d'annee).
- Les projets et soumissions peuvent desormais etre stockes de facon durable dans ton depot GitHub (voir section ci-dessus) ; sans cette config, ils restent stockes localement sur Render et peuvent etre reinitialises a chaque mise a jour du code.

## Limites actuelles

- Renommer un projet ne retague pas retroactivement les evenements deja crees avec l'ancien nom (seuls les nouveaux evenements utilisent le nouveau nom).
- Les vacances scolaires sont basees sur les dates officielles publiees pour les annees 2025-2026 et 2026-2027 ; au-dela, l'appli n'affichera rien tant que les dates ne seront pas ajoutees dans `lib/holidays.js`.
- L'app principale (edition) reste sans mot de passe, comme tu l'as choisi ; le lien lecture seule et le formulaire partenaire sont proteges uniquement par le fait que leurs adresses ne sont pas devinables.

Dis-moi ce que tu veux ameliorer ensuite.
