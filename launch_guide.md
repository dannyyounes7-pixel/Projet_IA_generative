# 🚀 Guide de Lancement Complet - Projet Orientation Médicale

Ce guide vous explique comment lancer localement les deux composants du projet : le **Backend (IA & API)** et le **Frontend (Interface Utilisateur)**.

---

## 1. Backend (FastAPI / IA)

Le backend gère l'analyse des symptômes, le scoring des spécialités et l'explication par l'IA.

### Prérequis
- Python 3.10+ installé.
- Un environnement virtuel déjà créé (nommé `ia_env` dans le dossier backend).

### Étapes de lancement
1. **Ouvrez un terminal** à la racine du projet.
2. **Naviguez vers le dossier backend** :
   ```powershell
   cd backend
   ```
3. **Activez l'environnement virtuel** :
   ```powershell
   .\ia_env\Scripts\activate
   ```
4. **Installez les dépendances** (si ce n'est pas déjà fait) :
   ```powershell
   pip install -r requirements.txt
   ```
5. **Lancez le serveur FastAPI** :
   ```powershell
   python -m uvicorn app.main:app --reload
   ```
   *Le backend sera accessible sur `http://127.0.0.1:8000`.*
   *Vous pouvez consulter la documentation interactive sur `http://127.0.0.1:8000/docs`.*

---

## 2. Frontend (Next.js)

Le frontend est l'interface web moderne permettant aux utilisateurs de saisir leurs symptômes.

### Prérequis
- Node.js installé (version 18+ recommandée).

### Étapes de lancement
1. **Ouvrez un nouveau terminal** (gardez celui du backend ouvert).
2. **Naviguez vers le dossier frontend** :
   ```powershell
   cd frontend/medical-orient
   ```
3. **Installez les dépendances** :
   ```powershell
   npm install
   ```
4. **Lancez le projet en mode développement** :
   ```powershell
   npm run dev
   ```
   *L'interface sera accessible sur `http://localhost:3000`.*

---

## 3. Vérification de la Connexion

Une fois les deux serveurs lancés :
1. Allez sur `http://localhost:3000`.
2. Saisissez des symptômes (ex: "J'ai mal à la poitrine").
3. Cliquez sur le bouton d'analyse.
4. L'interface doit afficher les recommandations de spécialités et les explications générées par le backend.

---

## 🔧 Dépannage
- **Erreur CORS** : Assurez-vous que le backend autorise bien `http://localhost:3000` (déjà configuré dans `main.py`).
- **Module non trouvé** : Vérifiez que l'environnement virtuel Python est bien activé pour le backend et que `npm install` a été exécuté pour le frontend.
