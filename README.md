# 🛡️ K2-Cyberdrill Exam Platform

![Version](https://img.shields.io/badge/Version-2.0.0-10b981?style=flat-square)
![Questions](https://img.shields.io/badge/Questions-848-059669?style=flat-square)
![Exams](https://img.shields.io/badge/Certifications-8-047857?style=flat-square)
![Stack](https://img.shields.io/badge/Stack-HTML5%20%7C%20CSS3%20%7C%20Vanilla%20JS%20%7C%20JSON-0284c7?style=flat-square)
![Responsive](https://img.shields.io/badge/Responsive-Mobile%20%7C%20Tablet%20%7C%20Desktop-38bdf8?style=flat-square)
![License](https://img.shields.io/badge/License-Proprietary-1e293b?style=flat-square)

**K2-Cyberdrill Exam Platform** est un simulateur d'examens blancs interactif, léger et modulaire, conçu pour la préparation intensive aux certifications internationales de cybersécurité. Aucune dépendance backend, aucun build step : un serveur HTTP statique suffit.

Développée par **Ananias KASANDA (IT-DevSecOps)** pour **K-2 GLOBAL BUSINESS S.A.R.L.U.**, cette plateforme s'appuie sur un moteur JavaScript réactif et une base de données JSON de **848 questions techniques enrichies**, classées par certification et par domaine.

---

## 🎯 Fonctionnalités

- **Simulation en conditions réelles :** chronomètre en temps réel avec durées officielles par examen (30 à 240 minutes), alerte visuelle orange (≤ 5 min) puis rouge clignotant (≤ 1 min).
- **Correction pédagogique approfondie :** chaque question restitue la bonne réponse et une explication technique justifiant les mécanismes défensifs ou offensifs associés.
- **Filtrage par thème :** sélectionnez un examen puis un domaine précis pour un réentraînement ciblé.
- **Statistiques en direct :** questions répondues, correctes, score requis (70%), durée.
- **Barre de progression :** visualisation du nombre de questions traitées.
- **Import de JSON externe :** chargez votre propre banque de questions via un bouton d'import (format identique à `questions.json`).
- **Sécurité :** échappement HTML systématique des contenus (protection XSS, support des backticks et exemples `<script>` dans les explications).
- **Responsive Aero UI :** thème vert Windows 7 avec effet verre dépoli, optimisé mobile, tablette et desktop. Scrolling fluide, cibles tactiles larges (≥ 40 px).
- **Accessibilité :** navigation clavier, ARIA labels, support `prefers-reduced-motion`, mode impression.

---

## 📚 Domaines Techniques Couverts

| Certification / Module | ID | Questions | Durée | Domaines clés |
| :--- | :--- | ---: | ---: | :--- |
| **CompTIA Security+ (SY0-701)** | `secplus` | 222 | 90 min | Gouvernance, Architecture Zero Trust, Cryptographie & PKI, Sécurité Cloud, SOC, SIEM/SOAR, Forensique, IR |
| **EC-Council CEH v13** | `ceh` | 314 | 240 min | Reconnaissance & OSINT, Nmap, Web (XSS, SQLi, CSRF, SSRF, IDOR), Active Directory (Kerberoasting, PtH, BloodHound) |
| **OWASP Top 10 (2021)** | `owasp` | 83 | 90 min | Contrôle d'accès, Failles crypto, Injection, Configuration, Composants vulnérables, Sécurité API |
| **Pentest (PTES/OSSTMM)** | `pentest` | 50 | 90 min | Méthodologie, Reconnaissance, Scan, Post-exploitation, Rapport |
| **Audit (ISO 27001/27002/19011/COBIT)** | `audit` | 55 | 90 min | ISO27001, ISO27002, ISO19011, COBIT, Audit technique |
| **Réponse aux incidents (NIST/PICERL)** | `incident-response` | 59 | 90 min | Cycle IR, Détection, Confinement, Forensique |
| **Cybersécurité — Initiation** | `cyber-initiation` | 50 | 60 min | Fondamentaux, Vocabulaire, Menaces, Défenses, Hygiène |
| **Kali Linux** | `kali-linux` | 15 | 30 min | Outils, Méthodologie, Shell, Persistance, APT |
| **TOTAL** | | **848** | | |

---

## 🏗️ Architecture du Projet

```text
k2-cyberdrill/
│
├── index.html              # Interface utilisateur (HTML5) — branding K-2, structure DOM, barre Aero
├── app.js                  # Moteur logique : chargement async, timer, scoring, escapeHtml (anti-XSS)
├── style.css               # Thème vert Windows 7 Aero — responsive mobile/tablette/desktop
├── questions.json          # Base de 848 questions structurées
├── README.md               # Ce fichier
└── assets/
    ├── logo-512.png        # Logo K-2 (carré 512×512)
    ├── logo-256.png        # Logo K-2 (256×256, apple-touch-icon)
    ├── logo.jpg            # Logo K-2 (JPEG, fallback)
    └── favicon.png         # Favicon 64×64
```

---

## 🚀 Déploiement sur GitHub Pages

### 1. Créer le dépôt

```bash
# Sur GitHub, créer un dépôt nommé par exemple k2-cyberdrill
git clone https://github.com/<votre-utilisateur>/k2-cyberdrill.git
cd k2-cyberdrill
```

### 2. Copier les fichiers

Copiez tout le contenu du dossier `k2-cyberdrill/` (fourni dans ce livrable) à la racine du dépôt, puis :

```bash
git add .
git commit -m "Initial release — K2-Cyberdrill Exam Platform v2.0"
git push origin main
```

### 3. Activer GitHub Pages

1. Sur GitHub, ouvrez le dépôt → **Settings** → **Pages**.
2. Section **Build and deployment** → Source : **Deploy from a branch**.
3. Branche : `main` / Dossier : `/ (root)`.
4. Cliquez **Save**. Le site sera disponible en 1–2 minutes à l'adresse :

```
https://<votre-utilisateur>.github.io/k2-cyberdrill/
```

### 4. Mise à jour

Pour ajouter ou modifier des questions, éditez simplement `questions.json`, committez, poussez — GitHub Pages redéploie automatiquement.

> ⚠️ **Important :** GitHub Pages sert les fichiers en HTTPS. Le `fetch('questions.json')` dans `app.js` fonctionnera nativement, sans configuration CORS.

---

## 💻 Exécution locale

Aucune installation requise. Trois options :

```bash
# Option 1 — Python
python3 -m http.server 8000

# Option 2 — Node.js (si installé)
npx serve

# Option 3 — VS Code Live Server (extension)
```

Puis ouvrez `http://localhost:8000` dans votre navigateur.

> ℹ️ L'ouverture directe du fichier `index.html` via `file://` ne fonctionne pas à cause de la politique CORS du `fetch()`. Utilisez un serveur HTTP local.

---

## 📱 Responsive Design

La plateforme s'adapte à tous les écrans :

| Breakpoint | Comportement |
| :--- | :--- |
| **Mobile** (< 480 px) | Boutons pleine largeur, logo 56 px, stats en 2 colonnes, scroll fluide vers la question courante |
| **Tablette** (≤ 768 px) | Branding centré vertical, options tactiles agrandies (44 px min), navigation empilée |
| **Desktop** (> 768 px) | Layout centré 980 px, branding horizontal, barre latérale des thèmes |
| **Large** (≥ 1200 px) | Container jusqu'à 1100 px |

Optimisations tactiles :
- Taille minimale des cibles : 40 × 40 px
- `-webkit-tap-highlight-color: transparent` (pas de flash bleu)
- `scroll-behavior: smooth` + scroll auto vers la question sur mobile
- `viewport-fit=cover` + safe-area iOS (iPhone X+)

---

## 🔒 Sécurité

Tous les contenus dynamiques (questions, options, explications) sont échappés via `escapeHtml()` avant injection dans le DOM. Les backticks, `${}`, balises `<script>` et autres métacaractères présents dans certaines explications pédagogiques (ex: exemple Log4j `${jndi:ldap://...}`, exemple XSS `<script>...</script>`) sont affichés tels quels sans exécution.

---

## 📦 Format du fichier `questions.json`

```jsonc
{
  "metadata": { /* version, auteur, date */ },
  "exams": [
    {
      "id": "secplus",
      "title": "CompTIA Security+ (SY0-701) - Examen blanc enrichi",
      "durationMinutes": 90,
      "questionCount": 222,
      "topics": ["Gouvernance", "Architecture", "..."],
      "questions": [
        {
          "id": "SEC-001-1",
          "topic": "Gouvernance",
          "question": "Quel cadre ...",
          "options": ["A", "B", "C", "D"],
          "correctIndex": 1,
          "explanation": "Explication technique ..."
        }
      ]
    }
  ]
}
```

Pour importer votre propre banque, cliquez sur **« Importer un JSON »** et sélectionnez un fichier respectant ce schéma.

---

## 👤 Crédits

- **Conception & développement :** Ananias KASANDA — IT-DevSecOps
- **Éditeur :** K-2 GLOBAL BUSINESS S.A.R.L.U.
- **Année :** 2026

---

## 📄 Licence

Propriétaire — © 2026 K-2 GLOBAL BUSINESS S.A.R.L.U. Tous droits réservés.
Toute reproduction, redistribution ou exploitation commerciale sans autorisation écrite préalable est interdite.
