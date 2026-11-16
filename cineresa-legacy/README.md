# CinéResa — Architecture hexagonale

CinéResa est une API de réservation de places de cinéma en TypeScript avec Express.

Le travail des TP consiste à passer d'une version legacy à une organisation qui sépare les règles métier du code technique.

## Fonctionnalités

- Voir les séances à venir et les places restantes.

- Réserver entre 1 et 6 places sur une séance qui n'a pas commencé.

- Appliquer le tarif étudiant : réduction de 30 %.

- Appliquer une réduction de groupe de 10 % à partir de 4 places, cumulable avec le tarif étudiant.

- Consulter les réservations associées à une adresse e-mail.

- Annuler une réservation au moins 2 heures avant la séance et libérer ses places.

Les montants sont en centimes.

Le paiement est simulé et les notifications sont affichées dans la console : aucun e-mail ni remboursement bancaire réel n'est envoyé.

## Organisation du projet

```text
src/
  domain/booking/           Screening, Booking et règles de réservation
  domain/shared/           Email, Money, DomainError, DomainEvent
  application/ports/in/    interfaces des cas d'utilisation
  application/ports/out/   interfaces des services externes
  application/usecase/     services applicatifs
  application/handlers/    réaction aux événements métier
  adapters/in/http/        routes et traduction des erreurs HTTP
  adapters/out/            stockage, paiement, notifications, événements et système
  container.ts             assemblage des dépendances
  main.ts                  démarrage HTTP
test/                      tests présents dans le dépôt
docs/                      DAT, diagrammes et ADR
```

Le domaine ne dépend pas d'Express ou d'une base de données.

Les services applicatifs utilisent des ports.

Les adaptateurs implémentent ces ports, par exemple `InMemoryScreeningRepository` pour `ScreeningRepository`.

`Screening` est la racine de l'agrégat et contient les `Booking`.

Les notifications passent par les événements `BookingConfirmed` et `BookingCancelled`.

## Installation et lancement

Prérequis : Node.js et npm, dans une version compatible avec les dépendances du `package-lock.json`.

### État de la version fournie

Avant de lancer l'application, il reste des incohérences de chemins à corriger :

1.  
   Dans `src/container.ts` et les tests concernés, les imports utilisent `application/usecases/`, alors que le dossier présent s'appelle `application/usecase/`.

2.  
   La classe `CancelBookingService` est dans `CancelBokingService.ts` et `ListMyBookingsService` dans `ListMyBookingService.ts`.  
   Il faut aligner les noms des fichiers et les imports, par exemple en renommant ces deux fichiers selon le nom de leur classe.

3.  
   Dans `package.json`, `main`, `start` et `dev` visent encore `src/server.ts`.  
   Le point d'entrée actuel est `src/main.ts`.

Après ces corrections, avec `start` défini comme `tsx src/main.ts` et `dev` comme `tsx watch src/main.ts` :

```bash
npm ci
npm start
```

L'API écoute par défaut sur `http://localhost:3000`.

Le port peut être changé avec la variable d'environnement `PORT`.

Le démarrage crée trois séances en mémoire, avec les identifiants `s1`, `s2` et `s3`.

Les données sont perdues à l'arrêt.

Le script `npm run seed` vient de la version legacy : le stockage actuel n'utilise pas son fichier JSON.

## Routes de l'API

| Méthode | Route | Entrée | Succès |
|---|---|---|---|
| GET | `/screenings` | — | 200, tableau des séances à venir |
| POST | `/screenings/:id/bookings` | JSON avec `email`, `seats` et `tariff` | 201, réservation créée |
| GET | `/bookings?email=a@b.fr` | adresse e-mail dans la requête | 200, tableau des réservations |
| DELETE | `/bookings/:id` | identifiant de réservation | 200, réservation annulée |

Exemple de corps pour réserver :

```json
{
  "email": "a@b.fr",
  "seats": 2,
  "tariff": "NORMAL"
}
```

Le tarif `STUDENT` déclenche la réduction étudiante.

Dans le code actuel, toute autre valeur, y compris une valeur absente, est traitée comme `NORMAL`.

Exemple d'erreur si la séance n'a plus assez de places : statut **409**, avec le corps suivant :

```json
{ "error": "Plus assez de places" }
```

| Statut | Situation |
|---|---|
| 400 | Adresse e-mail ou nombre de places invalide lors d'une réservation |
| 402 | Paiement simulé refusé |
| 404 | Séance ou réservation introuvable |
| 409 | Capacité insuffisante, séance commencée, réservation déjà annulée ou annulation trop tardive |

Pour la consultation des réservations, une adresse e-mail invalide renvoie une liste vide.

Dans la configuration de démarrage, le paiement a environ 5 % de chances d'être refusé.

La collection `Cinémesa.postman_collection.json` peut être importée dans Postman avec `baseUrl` égal à `http://localhost:3000`.

## Vérifications

Après correction des chemins et installation des dépendances :

```bash
npm run typecheck
npm test
```

Le dépôt contient notamment des tests du domaine, du calcul des prix, de l'annulation, de l'adaptateur HTTP et des dépendances entre couches.

Attention : `test/BookSeatsService.test.ts` contient seulement des types dans la version fournie, pas de tests exécutables du service de réservation.

Pour cette livraison documentaire, les fichiers ont été relus et les liens locaux vérifiés.

La compilation et les tests n'ont pas été exécutés : les dépendances ne sont pas installées et les incohérences d'import décrites plus haut sont encore présentes.

## Documentation

- [Document d'architecture technique](docs/DAT.md)

- [Décision sur l'agrégat Screening](docs/adr/001-booking-dans-screening.md)

- [Composants : source PlantUML](docs/diagrams/composants.puml) et [image SVG](docs/diagrams/composants.svg)

- [Cas d'erreur : source PlantUML](docs/diagrams/reservation-refusee.puml) et [image SVG](docs/diagrams/reservation-refusee.svg)

## Limites

Cette version est un support de TP : pas d'authentification, pas de stockage durable et pas de contrôle de concurrence dans le repository en mémoire.

Deux réservations simultanées sur une même séance ne sont donc pas couvertes par une garantie transactionnelle.

Le bus d'événements est local et attend les handlers ; il n'assure pas de reprise après une panne.
