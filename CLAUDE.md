# SpaceFarm Front

Interface web (dashboard) du projet SpaceFarm, Workshop EPSI B3 "Horizon 2080", pilier FoodTech & AgriTech Spatiale.

## Contexte projet

- Serre connectée classique (en terre, pas hydroponique) pour un vaisseau interstellaire de l'ESA, coupé de la Terre (pas de ravitaillement, pas de communication temps réel).
- Chaîne : capteurs reliés au Raspberry Pi (pas d'ESP32) -> MQTT (TLS) -> serveur local -> PostgreSQL -> régulation des ventilateurs + alertes. Fonctionne sans Internet, resynchronise au retour du lien.
- Équipe de 5. Ce dépôt = FRONT uniquement (Willem). Back (API + WebSocket) = Nathan. Le front avance avec de fausses données (mock) tant que le back n'est pas prêt.
- Cahier des charges complet : dossier `docs/` (vide au départ, à compléter si le PDF est ajouté).
- Jury : démo projetée en direct, 5 min de présentation + 5 min de questions. Le design doit rester lisible de loin.
- Crises de démo : A surchauffe (ventilateurs auto + alerte), B coupure de la liaison spatiale 24 h (mode autonome + resync), C capteur muet (alerte + mode sûr), D sol trop sec (humidité basse).
- Ne jamais dire "Terre" seul dans l'UI pour la liaison avec la planète : ça se confond avec la terre du bac. Dire "liaison spatiale".

## Ce que le front doit afficher et faire

1. Cartes d'état en direct : température, humidité (air), luminosité, humidité du sol, état des ventilateurs (allumés/éteints, mode auto/manuel).
2. Historique en courbes par mesure (Recharts). Pas d'intégration Grafana : décision d'équipe de ne pas lier le front à Grafana.
3. Formulaire de seuils (min et max par mesure).
4. Commande des ventilateurs : auto, on, off (déplacée dans le panneau latéral de commandes, voir Architecture page ci-dessous).
5. Alertes : bannière rouge (seuil dépassé ou capteur muet) + alerte sonore, avec bouton "Activer le son" obligatoire (politique d'autoplay des navigateurs).
6. Badge "Liaison spatiale" : connectée ou coupée + nombre de messages en attente de synchronisation.
7. Console de crise : simuler surchauffe, coupure liaison spatiale, capteur muet, sol trop sec. Le capteur muet est à part, mis en avant comme action critique (coupe tous les capteurs d'un coup).

## Architecture page

- En dessous de `xl` (1280px) : une colonne, ordre = alertes, cartes d'état, panneau de commandes (ventilateurs + console de crise), seuils, historique. Le panneau de commandes est placé juste après les cartes pour rester accessible sans trop scroller.
- À partir de `xl` : le panneau de commandes devient une colonne latérale collante (sticky) à droite, toujours visible pendant le scroll. Voir `src/sections/ControlPanel.tsx` et `src/App.tsx`.
- Le panneau de commandes est rendu deux fois (mobile inline + sidebar desktop) plutôt que déplacé en CSS, pour éviter les pièges de `sm:`/`lg:` qui réagissent à la largeur de la fenêtre et non à la largeur réelle de la colonne. `CrisisConsole` a un prop `compact` pour ça.
- Piège rencontré : `items-start` sur le conteneur grid cassait le sticky (la colonne devait rester en `stretch` par défaut pour donner de la place au sticky de "rouler"). Et un `<span>` texte simple mélangé à des enfants `flex` dans une même ligne pouvait empêcher le wrap de se déclencher correctement sous ~500px.

## Stack et contraintes

- React + Vite + TypeScript strict (pas de `any`), Recharts pour les courbes.
- Interface en français, code et noms de variables en anglais.
- Design clair "labo technique" : fond blanc cassé à grille technique discrète, cartes blanches à filets fins, vert émeraude profond en accent unique (jamais de violet, jamais d'Inter). Barre de statut fine en haut de carte plutôt que carte entièrement teintée. Chiffres en Geist Mono. Respecter `prefers-reduced-motion`. Contrastes vérifiés WCAG AA.
- Composants fonctionnels uniquement, un composant par fichier PascalCase, pas de barrel exports.
- Tailwind + `cn()` (clsx + tailwind-merge) pour les classes conditionnelles.
- Pas de tiret long dans les textes visibles de l'UI.
- Icônes SVG (Phosphor), jamais d'emoji.

## Architecture données

Couche d'accès séparée, interface `ApiClient` avec deux implémentations :

- `mockClient` : fausses données qui évoluent toutes les 2 s, avec scénarios de crise.
- `httpClient` : vraie API (REST + WebSocket).

Choix via `VITE_USE_MOCK` (`true` = mock).

Contrat d'API prévu (à valider avec Nathan) :

| Méthode | Route | Rôle |
|---|---|---|
| GET | `/api/state` | état courant (mesures, ventilateurs, alertes, liaison spatiale) |
| GET | `/api/history?sensor=&range=` | historique d'une mesure |
| GET / PUT | `/api/thresholds` | lire / modifier les seuils |
| POST | `/api/fan` | commande ventilateurs (auto, on, off) |
| POST | `/api/crisis` | déclencher une crise simulée |
| WS | `/ws` | pousse mesures et alertes en temps réel |

Seuils par défaut : température 18 à 24 °C, humidité 50 à 70 %, humidité du sol minimum 30 %.

## Méthode de travail

- Petites étapes, une à la fois. Un commit git à la fin de chaque étape.
- Après chaque étape : une phrase sur ce qui est fait + proposition pour la suite.
- Commits en anglais, format conventionnel (`feat:`, `fix:`, `chore:`, `style:`). Jamais de `.env` ni de clés dans git.
- Vérifier (build, lancement) avant de déclarer une étape terminée.
