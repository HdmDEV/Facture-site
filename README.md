# Facture Site

Application web de facturation et de gestion de stock développée avec **React**, **Vite**, **Express** et **Supabase**.

Le projet fournit :
- une interface de création de factures
- la gestion des clients, articles, entrepôts et infos entreprise
- un système de notifications / logs
- un espace admin avec gestion des rôles, permissions et utilisateurs
- des réglages utilisateur propres à chaque compte

## Fonctionnalités

- Création et export de factures
- Gestion des clients et des articles
- Suivi de stock et alertes
- Administration des utilisateurs
- Création de rôles personnalisés avec permissions
- Réglages par utilisateur :
  - langue
  - thème visuel
  - position des notifications
  - session persistante ou non

## Stack technique

- Frontend : React + Vite
- Backend : Node.js + Express
- Auth et base de données : Supabase

## Prérequis

- Node.js 18 ou plus
- Un projet Supabase
- Git

## Installation depuis GitHub

```bash
git clone https://github.com/HdmDEV/Facture-site.git
cd Facture-site
npm install
```

## Configuration

Le projet utilise deux fichiers d’environnement :

- `.env` à la racine pour le frontend
- `server/.env` pour le backend

### 1. Fichier `.env`

```env
VITE_SUPABASE_URL=ton_url_supabase
VITE_SUPABASE_ANON_KEY=ta_cle_anon_supabase
VITE_SUPERADMIN_EMAIL=ton@email.com
VITE_DEV_DISABLE_EMAIL_CONFIRMATION=true
```

### 2. Fichier `server/.env`

```env
PORT=3001
SUPABASE_URL=ton_url_supabase
SUPABASE_SERVICE_ROLE_KEY=ta_cle_service_role_supabase
DEV_DISABLE_EMAIL_CONFIRMATION=true
```

## Configuration Supabase

Avant de lancer l’application, il faut appliquer le schéma SQL fourni :

```text
server/supabase_schema.sql
```

Dans Supabase :

1. Ouvre le SQL Editor
2. Colle le contenu de `server/supabase_schema.sql`
3. Exécute le script

Ce script crée notamment :
- la table `app_roles`
- les rôles par défaut
- les permissions nécessaires au panneau admin

## Lancer le projet en local

Le projet se lance en deux processus :

### Backend

```bash
npm run dev:server
```

Le backend démarre sur `http://localhost:3001`.

### Frontend

Dans un autre terminal :

```bash
npm run dev
```

Vite démarre généralement sur `http://localhost:5173`.

Le frontend appelle le backend via le proxy Vite configuré sur `/api`.

## Scripts disponibles

```bash
npm run dev        # Lance le frontend Vite
npm run dev:server # Lance l'API Express
npm run build      # Build de production
npm run lint      # Vérification ESLint
npm run preview    # Prévisualisation du build
```

## Structure du projet

```text
src/                 # Interface React
server/              # API Express + schéma Supabase
public/              # Fichiers statiques
vite.config.js       # Configuration Vite + proxy API
```

## Notes importantes

- Les rôles et permissions sont stockés en base.
- Les réglages utilisateur comme la langue et le thème sont enregistrés par utilisateur, pas globalement.
- Si tu modifies les variables `.env`, il faut redémarrer le frontend et/ou le backend.
- Si l’admin n’affiche pas les users, vérifie bien la `SUPABASE_SERVICE_ROLE_KEY`.

## Dépannage rapide

- `Failed to fetch` : le backend Express n’est probablement pas lancé.
- `Accès refusé` : le compte n’a pas le rôle ou la permission attendue.
- `This endpoint requires a valid Bearer token` : la session utilisateur ou le token est invalide.
- Aucun utilisateur affiché : vérifie le schéma Supabase et la clé service role.

## Licence

Aucune licence n’est définie pour le moment.
