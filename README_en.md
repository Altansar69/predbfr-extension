[Français](README.md) | English

# 🎬 **predb.fr on TMDB**
![License](https://img.shields.io/badge/License-UNLICENSE-red) ![Latest Version](https://img.shields.io/badge/Version-1.0.0-blue) ![Userscript](https://img.shields.io/badge/Userscript-Tampermonkey%2FViolentmonkey-green) ![Languages](https://img.shields.io/badge/Languages-FR%20%7C%20EN-purple)

A userscript that embeds **[predb.fr](https://predb.fr)** scene & P2P releases directly into **[TMDB](https://www.themoviedb.org)** (The Movie Database) movie and TV pages.

On every movie or series page, a panel shows the matching French releases (name, source, team, pre date, size) with the NFO viewable and downloadable, without ever leaving TMDB.

## 🔧 Features
- **Embedded panel** on TMDB `/movie/...` and `/tv/...` pages (and nowhere else, not on `/edit`, `/cast`, etc.).
- **Releases table**: name (link to predb.fr), source badge (SCENE / P2P), team, NUKED badge, date, size.
- **NFO**: preview in a modal (faithful ANSI / CP437 rendering) + `.nfo` download.
- **Sort** by date or size, instant **client-side pagination**, configurable results per page.
- **Bilingual FR / EN**: language auto-detected (TMDB or browser language), switchable from the extension menu.

## 📥 Installation
1. Install a userscript manager: [Tampermonkey](https://www.tampermonkey.net/) or [Violentmonkey](https://violentmonkey.github.io/).
2. Click **[predb-tmdb.user.js](https://raw.githubusercontent.com/Altansar69/predbfr-extension/main/predb-tmdb.user.js)**: your manager will automatically offer to install it.
3. Open any movie or series page on TMDB: the predb.fr panel appears at the top.

## ⚙️ Configuration
To display releases and access NFOs, the extension needs your predb.fr API key:
1. Get your personal feed URL on predb.fr (**Settings → API key**), it contains `?api_key=...`.
2. In the extension menu (Tampermonkey/Violentmonkey icon) → **“predb.fr: configure”**, paste that URL.
3. That's it: the panel fills in automatically on every page.

> 💡 Switch language from the extension menu → **“predb.fr: switch to French / English”**.

## 🔢 Versioning
This project follows [semantic versioning](https://semver.org/).

## 🤝 Credits
Built by **[predb.fr](https://predb.fr)**.

## 📄 License
This software is released under the [Unlicense](https://unlicense.org/); its terms are available in [UNLICENSE.txt](UNLICENSE.txt).
