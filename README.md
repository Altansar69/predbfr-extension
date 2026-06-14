Français | [English](README_en.md)

# 🎬 **predb.fr sur TMDB**
![License](https://img.shields.io/badge/License-UNLICENSE-red) ![Latest Version](https://img.shields.io/badge/Version-1.0.0-blue) ![Userscript](https://img.shields.io/badge/Userscript-Tampermonkey%2FViolentmonkey-green) ![Langues](https://img.shields.io/badge/Langues-FR%20%7C%20EN-purple)

Userscript qui intègre les releases scène & P2P de **[predb.fr](https://predb.fr)** directement dans les pages film et série de **[TMDB](https://www.themoviedb.org)** (The Movie Database).

Sur chaque fiche film ou série, un encart affiche les releases francophones correspondantes (nom, source, team, date de pre, taille) avec le NFO consultable et téléchargeable, sans jamais quitter TMDB.

## 🔧 Fonctionnalités
- **Encart intégré** sur les pages `/movie/...` et `/tv/...` de TMDB (et nulle part ailleurs, pas sur `/edit`, `/cast`, etc.).
- **Tableau des releases** : nom (lien vers predb.fr), badge source (SCENE / P2P), team, badge NUKED, date, taille.
- **NFO** : aperçu dans une modale (rendu fidèle ANSI / CP437) + téléchargement du `.nfo`.
- **Tri** par date ou taille, **pagination** locale instantanée, nombre de résultats par page configurable.
- **Bilingue FR / EN** : langue détectée automatiquement (langue de TMDB ou du navigateur), basculable via le menu de l'extension.

## 📥 Installation
1. Installe un gestionnaire de userscripts : [Tampermonkey](https://www.tampermonkey.net/) ou [Violentmonkey](https://violentmonkey.github.io/).
2. Clique sur **[predb-tmdb.user.js](https://raw.githubusercontent.com/Altansar69/predbfr-extension/main/predb-tmdb.user.js)** : ton gestionnaire propose automatiquement l'installation.
3. Ouvre une fiche film ou série sur TMDB : l'encart predb.fr apparaît en haut de la page.

## ⚙️ Configuration
Pour afficher les releases et accéder aux NFO, l'extension a besoin de ta clé API predb.fr :
1. Récupère ton URL de feed personnelle sur predb.fr (**Réglages → Clé API**), elle contient `?api_key=...`.
2. Dans le menu de l'extension (icône Tampermonkey/Violentmonkey) → **« predb.fr : configurer »**, colle cette URL.
3. C'est tout : l'encart se remplit automatiquement sur chaque fiche.

> 💡 La langue se change via le menu de l'extension → **« predb.fr : passer en anglais / French »**.

## 🔢 Versionnage
Ce projet suit un schéma de [versionnement sémantique](https://semver.org/).

## 🤝 Crédits
Développé par **[predb.fr](https://predb.fr)**.

## 📄 License
Ce logiciel est sous [Unlicense](https://unlicense.org/), dont les termes sont disponibles dans [UNLICENSE.txt](UNLICENSE.txt).
