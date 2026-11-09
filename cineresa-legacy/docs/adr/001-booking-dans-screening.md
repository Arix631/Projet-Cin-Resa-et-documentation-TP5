# ADR-001 : Booking dans l'agrégat Screening ou agrégat séparé ?

Statut : accepté 

Cette décision décrit le choix présent dans le code fourni.

## Contexte

Une réservation prend des places sur une séance.

Le système doit refuser une demande si la séance a commencé ou si sa capacité est insuffisante.

Une annulation doit libérer les places et respecter le délai de 2 heures.

Dans cette version, `Screening` contient une collection de `Booking`.

Le stockage se fait via `ScreeningRepository`, sans repository propre aux réservations.

## Options envisagées

### 1. Booking dans l'agrégat Screening

`Screening` est la racine et contrôle `book()` et `cancel()`.

Il connaît les réservations confirmées et calcule les places restantes.

Avantage : les informations nécessaires à la règle de capacité sont réunies au même endroit.

Le service applicatif n'a pas à recalculer lui-même les places disponibles.

Inconvénient : charger une séance revient à charger ses réservations.

L'agrégat peut devenir volumineux et plusieurs écritures sur une séance concernent la même racine.

### 2. Booking comme agrégat séparé

Chaque réservation possède son propre repository et peut être chargée indépendamment de la séance.

Avantage : le cycle de vie d'une réservation est plus indépendant, et on évite de charger toutes les réservations pour chaque opération individuelle.

Inconvénient : la capacité concerne plusieurs objets séparés.

Il faut prévoir un mécanisme de coordination, par exemple une transaction avec mise à jour atomique des places disponibles, pour éviter de vendre trop de places.

## Décision

On conserve `Booking` dans l'agrégat `Screening`.

Pour le périmètre du TP, cette organisation rend les règles plus faciles à regrouper et à tester.

Elle correspond à l'implémentation actuelle : `Screening.book()` crée la réservation et `Screening.cancel()` contrôle l'annulation.

## Conséquences

### Positives

- La règle de capacité reste dans le domaine, au niveau de `Screening`.

- Les réservations annulées ne comptent plus dans `remainingSeats()`.

- Les changements produisent les événements `BookingConfirmed` et `BookingCancelled`.

- Le service applicatif utilise un seul port de stockage : `ScreeningRepository`.

### Négatives et limites

- Le nombre de réservations augmente la taille de l'agrégat et de ses snapshots.

- Chercher une réservation par identifiant parcourt les séances dans le repository actuel.

- L'agrégat protège la capacité sur une instance, mais ne résout pas à lui seul les accès concurrents.  
  Le repository actuel fonctionne par lecture puis remplacement du snapshot, sans contrôle de version.

- Le paiement et le stockage ne sont pas dans une transaction commune.  
  Une vraie intégration de paiement demanderait de traiter les pannes entre paiement, sauvegarde et publication des événements.

Le choix pourra être revu si la taille des séances ou le volume de réservations rend cette organisation trop coûteuse.
