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

Une fois configure, l'app ecrit directement tes projets, soumissions, liens de partage et propositions WhatsApp dans un dossier `data/` de ton depot GitHub a chaque changement — ils survivent a toutes les futures mises a jour. Si tu ne configures pas ces variables, l'app continue de fonctionner normalement, juste avec le risque de reinitialisation deja mentionne (un message te le rappelle dans le panneau "Gerer les projets" si c'est le cas).

A savoir : le rattachement d'un evenement a un projet (le "tag" que tu vois sur chaque evenement colore) n'est jamais concerne par ce risque, meme sans configurer GitHub — cette information est ecrite directement dans l'evenement lui-meme sur iCloud (le champ "categories"), pas sur le serveur Render, donc elle est deja permanente. Seuls le nom et la couleur de tes projets, plus les soumissions partenaires en attente, beneficient de cette configuration GitHub.

## Etape 4 - Ouvrir sur iPhone

1. Ouvre l'URL Render dans Safari sur ton iPhone.
2. Appuie sur l'icone de partage, puis "Sur l'ecran d'accueil". L'appli s'ouvre alors comme une vraie application.

## Utilisation

- Les points colores en haut sont tes projets : touche-en un pour l'afficher ou le masquer sur la vue annuelle.
- Le point gris "Sans projet" fonctionne pareil : il permet de masquer d'un coup tous les evenements sans projet associe (par exemple ceux crees directement depuis l'app Calendrier de ton iPhone). Ce filtre s'applique aussi a l'export PDF.
- "Gerer les projets" ouvre un panneau pour renommer un projet, changer sa couleur (touche le rond colore) ou le supprimer, et pour en ajouter un nouveau.
- "Jours feries" et "Vacances scolaires" sont des filtres optionnels ; pour les vacances, choisis ta zone (A, B ou C).
- Touche un jour dans le tableau pour voir ses evenements. Chaque evenement s'affiche sur sa propre ligne dans la case du jour (avec l'heure s'il en a une) ; s'il y en a plus de 3, un "+N" indique le nombre restant, visible en entier dans le panneau du jour.
- Dans le panneau d'un jour, "Modifier" ouvre un petit formulaire pour changer le titre, la date, l'heure (ou "journee entiere") et le projet d'un evenement existant. Changer la date permet de deplacer facilement un evenement vers un autre jour.
- "Dupliquer" cree une copie d'un evenement a la date de ton choix (utile pour un evenement recurrent que tu recrees toutes les semaines par exemple).
- Pour un evenement "journee entiere", le champ "jusqu'au" (a l'ajout comme a l'edition) permet de le faire durer plusieurs jours sans le ressaisir chaque jour : il apparait alors sur toute la periode dans la vue annuelle.
- Le formulaire d'ajout permet de choisir une heure de debut/fin (ou de laisser "journee entiere"), un projet, et dans quel calendrier iCloud (Personnel, Travail, etc.) l'evenement doit etre cree.
- La barre de recherche en haut cherche un evenement par titre sur les 5 prochaines annees et te propose de sauter directement a sa date.
- Un champ "Lieu" (optionnel) est disponible a la creation et a l'edition d'un evenement ; il apparait aussi dans l'app Calendrier de ton iPhone.
- Quand un evenement a un projet, son nom est ajoute entre parentheses a la fin du titre cote iCloud (ex "Reunion (Client A)"), pour qu'il reste visible dans l'app Calendrier de l'iPhone qui n'affiche pas les couleurs de projet. Dans notre app, le titre reste affiche sans ce suffixe puisque le projet est deja visible via le point colore. Ce suffixe n'apparait que sur les evenements crees ou modifies depuis cette mise a jour ; les evenements plus anciens l'auront a la prochaine modification.
- Les titres d'evenements trop longs passent desormais a la ligne automatiquement dans les cases du calendrier au lieu d'etre coupes.
- A la creation ou a l'edition d'un evenement, un menu "Statut" permet de marquer un evenement comme "A confirmer", "Option" ou "Important" (ou de le laisser normal). Ce statut se reconnait d'un coup d'oeil sur la vue annuelle : un petit trait jaune sur le bord droit de la case pour "A confirmer", un petit trait bleu pour "Option", et le jour encadre en rouge pour "Important" (si plusieurs statuts sont presents le meme jour, les marques se cumulent). Le statut est aussi rappele en texte dans le panneau du jour, la vue liste, et l'export PDF. Cette information est stockee directement dans l'evenement sur iCloud, donc elle est permanente.
- Dans "Gerer les projets", chaque projet a un bouton "Voir la liste" : il ouvre un recapitulatif chronologique (date, heure, lieu) de tous les evenements de ce projet uniquement, sur la periode actuellement affichee.
- Un evenement cree ou modifie ici apparait automatiquement dans l'app Calendrier de ton iPhone, et inversement.

## Nouveau : partage et formulaire partenaires

- **Telecharger en PDF** : genere un PDF de la vue annuelle actuellement affichee (meme filtres projets/feries/vacances que ce que tu vois a l'ecran).
- **Liens de partage** : ouvre un panneau ou tu peux creer autant de liens en lecture seule que tu veux, chacun limite aux projets de ton choix. Coche les projets que la personne pourra voir (laisse tout decoche pour partager l'agenda complet), donne-lui un nom si tu veux t'y retrouver, puis "Generer le lien". La personne qui ouvre ce lien ne voit que les projets choisis (les autres projets et leurs evenements n'existent tout simplement pas pour elle, y compris via le reseau/devtools), et ne peut rien modifier. Tu peux supprimer un lien a tout moment pour le desactiver. Si tu avais deja configure la variable `SHARE_TOKEN`, ce lien "complet" reste disponible aussi, en haut du panneau.
- **Soumissions** : ouvre le panneau des propositions envoyees par des partenaires via le formulaire public. Pour chaque soumission tu peux l'associer a un projet existant (ou en creer un nouveau a la volee) puis "Accepter" pour creer le vrai evenement dans ton iCloud, ou "Refuser" pour la supprimer. Rien n'est jamais ajoute a ton agenda sans validation de ta part.
- **Lien formulaire** (dans "Gerer les projets", a cote de chaque projet) : copie un lien a envoyer a un partenaire, deja verrouille sur ce projet precis (il ne pourra pas le changer). Le bouton "Copier" au sommet du panneau "Soumissions" donne le lien generique, ou le partenaire renseigne lui-meme le nom du projet.
- **Proposer par WhatsApp** : dans le panneau d'un jour, sous le formulaire d'ajout, remplis un titre (et optionnellement heure/lieu/projet/numero WhatsApp du contact) puis touche "Proposer par WhatsApp". Un lien de proposition est cree et WhatsApp s'ouvre avec un message pre-rempli contenant ce lien — il ne te reste qu'a choisir le contact (ou l'envoyer directement si tu as renseigne son numero) et appuyer sur envoyer. La personne qui recoit le message ouvre le lien, voit les details, et touche "Accepter" ou "Refuser". Si elle accepte, l'evenement est cree automatiquement dans ton iCloud, sans que tu aies rien a faire. Sur cette meme page, elle peut aussi ajouter le rendez-vous a **son propre agenda** en un clic (telechargement `.ics` compatible Apple/Outlook, ou lien direct vers Google Calendar) — ce n'est pas lie a ta reponse "Accepter/Refuser", c'est juste pratique pour elle. Le panneau "Propositions" (dans les outils, avec un compteur si des propositions attendent une reponse) liste toutes tes propositions envoyees et leur statut (en attente / acceptee / refusee), avec la possibilite de les supprimer. A noter : ceci n'est pas une integration officielle WhatsApp Business (qui demande une validation par Meta et n'est pas gratuite) — c'est le lien "click-to-chat" public de WhatsApp (`wa.me`), donc c'est toujours toi qui appuies sur "Envoyer" dans WhatsApp, l'app ne peut pas l'envoyer toute seule a ta place.

Le formulaire partenaire demande : titre, dates (avec option "jusqu'au" pour plusieurs jours), heure ou "journee entiere", lieu, et projet (verrouille ou libre) — exactement ce que tu avais demande.

## Nouveau : productivite (charge de travail, conflits, raccourcis)

- **Indicateur de charge par semaine** : sur chaque case de lundi, un petit point colore resume la charge de la semaine qui commence (estimee a partir des heures d'evenements prevus, visible au survol) : vert = legere, jaune = moderee, orange = chargee, rouge = intense. C'est une estimation (une journee entiere compte forfaitairement pour 3h), pensee pour reperer d'un coup d'oeil les semaines qui vont etre "hard".
- **Alerte de chevauchement** : si deux evenements avec horaires se chevauchent le meme jour, un petit `⚠` orange apparait a cote de la date dans le tableau, et le panneau du jour affiche un bandeau detaillant le conflit.
- **Alerte "pas de battement"** : toujours dans le panneau du jour, si deux evenements consecutifs ont moins de 30 minutes d'ecart entre eux, un bandeau te le signale (pratique si tu enchaines des rendez-vous sur des lieux differents).
- **Titres rapides** : dans le formulaire d'ajout d'un evenement, des boutons pre-remplissent le titre en un clic (par defaut : "Repetition", "Generale", "Representation", "Montage decor", "Demontage decor", "Tournee"). Le bouton "Gerer les titres rapides" a cote permet de renommer, supprimer ou en ajouter de nouveaux — cette liste est entierement a toi, stockee comme tes projets (et rendue permanente si tu as configure `GITHUB_TOKEN`/`GITHUB_REPO`).
- **Liens d'equipe par projet** : rappel que les "Liens de partage" scoppes a un seul projet (voir plus haut) fonctionnent tres bien pour donner a une equipe de spectacle un acces lecture seule au planning de son propre projet, le jour ou tu en as besoin.

## Nouveau : resume hebdomadaire par email (chaque lundi)

Chaque lundi matin, un email recapitulant la semaine (jour par jour, avec heure/lieu/projet de chaque evenement, et un total d'heures estime) peut etre envoye automatiquement a l'adresse de ton choix — par exemple celle de ton conjoint. Deux choses a mettre en place, toutes gratuites :

### A. Un compte pour envoyer l'email (Brevo)

1. Cree un compte gratuit sur [brevo.com](https://www.brevo.com) (l'offre gratuite permet 300 emails/jour, largement de quoi envoyer un email par semaine).
2. Dans Brevo, va dans **Expediteurs, domaines & dedicated IPs > Expediteurs** et ajoute ton adresse email comme "expediteur" (pas besoin d'acheter un nom de domaine : Brevo t'envoie un code a 6 chiffres sur cette adresse pour la verifier, c'est tout).
3. Va dans **Cle API / SMTP & API > Cles API** et genere une nouvelle cle API.

### B. Les reglages sur Render

Dans les variables d'environnement de ton service Render, ajoute :

- `BREVO_API_KEY` = la cle API generee a l'etape A.3
- `EMAIL_FROM` = l'adresse que tu as verifiee comme expediteur
- `EMAIL_FROM_NAME` (optionnel) = le nom affiche comme expediteur, ex `Georges`
- `DIGEST_TO` = l'adresse email qui doit recevoir le resume chaque semaine
- `DIGEST_TO_NAME` (optionnel) = le nom du destinataire
- `DIGEST_SECRET` = une longue chaine aleatoire de ton choix (comme pour `SHARE_TOKEN`), qui protege l'envoi contre un declenchement par une personne exterieure

Tu peux verifier que tout fonctionne en ouvrant `https://ton-app.onrender.com/api/weekly-digest/preview` dans un navigateur : ca affiche un apercu du resume de la semaine en cours (sans rien envoyer).

### C. La tache automatique du lundi (GitHub Actions)

Le fichier `.github/workflows/weekly-digest.yml` est deja inclus dans ce depot : il declenche automatiquement l'envoi tous les lundis a 7h (heure de Paris).

Attention en le deposant sur GitHub : le dossier `.github` commence par un point, et certains explorateurs de fichiers (Windows/Mac) le cachent par defaut, ce qui peut l'empecher d'apparaitre quand tu selectionnes des fichiers a glisser-deposer. Le plus fiable : sur la page de ton depot GitHub, clique **Add file > Create new file**, et dans le champ du nom tape directement `.github/workflows/weekly-digest.yml` (les `/` creent automatiquement les sous-dossiers) — colle ensuite le contenu du fichier et valide avec "Commit changes".

Il te reste juste a donner deux informations secretes a GitHub, dans ton depot :

1. Va sur la page de ton depot > **Settings > Secrets and variables > Actions > New repository secret**.
2. Cree un secret `AGENDA_APP_URL` avec l'URL de ton app Render (ex `https://mon-agenda-connect-gv-1.onrender.com`, sans `/` a la fin).
3. Cree un second secret `DIGEST_SECRET` avec exactement la meme valeur que celle mise sur Render a l'etape B.

C'est tout : chaque lundi matin, GitHub reveille ton app (le plan gratuit de Render s'endort apres inactivite, ce premier appel la relance) et declenche l'envoi de l'email. Pour tester tout de suite sans attendre lundi, va dans l'onglet **Actions** de ton depot, ouvre "Resume hebdomadaire par email", et clique sur **Run workflow**.

A savoir : les taches planifiees GitHub ne sont pas garanties a la minute pres (quelques minutes de retard sont frequentes, plus en cas de forte charge chez GitHub), et sont automatiquement desactivees si le depot reste plus de 60 jours sans aucune modification (il suffit alors de les reactiver depuis l'onglet Actions). Rien de grave pour un usage comme celui-ci, mais je prefere te le signaler.

## Mettre a jour l'appli apres une modification

Comme le depot n'est pas connecte a Git en ligne de commande, la facon la plus simple de mettre a jour ton app est :

1. Va sur la page de ton depot GitHub.
2. Pour chaque fichier modifie, clique dessus, puis sur l'icone crayon (Edit), colle le nouveau contenu, et "Commit changes". Ou plus simple : utilise "Add file" > "Upload files" et depose les fichiers modifies, GitHub te proposera de remplacer les anciens.
3. Des que le commit est valide, Render redeploie automatiquement (l'auto-deploy est active par defaut). Tu peux suivre la progression dans l'onglet "Logs" de ton service Render.

## Corrige dans cette version

- Bug corrige (cote serveur) : la date de fin d'un evenement "journee entiere" traversant un changement de mois n'etait pas toujours calculee correctement lors de l'enregistrement dans iCloud.
- Bug corrige (cote navigateur, le plus important) : le calcul "jour suivant" utilisait le fuseau horaire local au lieu d'UTC, ce qui faisait boucler indefiniment l'affichage d'un evenement multi-jours sur son premier jour pour les utilisateurs en France (UTC+1/+2) au lieu de l'etaler sur les jours suivants. C'est corrige, les evenements multi-jours s'affichent maintenant normalement.
- Les projets et soumissions peuvent desormais etre stockes de facon durable dans ton depot GitHub (voir section ci-dessus) ; sans cette config, ils restent stockes localement sur Render et peuvent etre reinitialises a chaque mise a jour du code.

## Limites actuelles

- Renommer un projet ne retague pas retroactivement les evenements deja crees avec l'ancien nom (seuls les nouveaux evenements utilisent le nouveau nom).
- Les vacances scolaires sont basees sur les dates officielles publiees pour les annees 2025-2026 et 2026-2027 ; au-dela, l'appli n'affichera rien tant que les dates ne seront pas ajoutees dans `lib/holidays.js`.
- L'app principale (edition) reste sans mot de passe, comme tu l'as choisi ; les liens de partage, les liens de proposition WhatsApp et le formulaire partenaire sont proteges uniquement par le fait que leurs adresses ne sont pas devinables (une fois qu'un lien est genere, quiconque le possede peut l'utiliser — supprime-le dans l'app si tu veux le desactiver).
- "Proposer par WhatsApp" utilise le lien public `wa.me` de WhatsApp (pas l'API WhatsApp Business, qui demande une validation Meta et n'est pas gratuite) : c'est donc toujours toi qui appuies sur "Envoyer" dans WhatsApp apres que le lien s'ouvre, l'app ne peut pas l'envoyer automatiquement sans cette action.

Dis-moi ce que tu veux ameliorer ensuite.
