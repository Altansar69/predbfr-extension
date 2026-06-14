// ==UserScript==
// @name         predb.fr on TMDB
// @namespace    https://predb.fr/
// @version      1.1.0
// @description  Shows predb.fr scene/p2p releases (name, date, size, NFO) on TMDB movie/series pages (FR/EN)
// @author       predb.fr
// @match        https://www.themoviedb.org/movie/*
// @match        https://www.themoviedb.org/tv/*
// @exclude      https://www.themoviedb.org/*/*/*
// @icon         https://www.themoviedb.org/favicon.ico
// @connect      api.predb.fr
// @connect      localhost
// @connect      127.0.0.1
// @grant        GM_xmlhttpRequest
// @grant        GM_addStyle
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @run-at       document-idle
// @noframes
// ==/UserScript==

(function () {
  'use strict';

  if (window.__predbfrLoaded) return;
  window.__predbfrLoaded = true;

  const STRINGS = {
    fr: {
      'cfg.invalid': 'URL invalide : il faut l’URL fournie par predb.fr, contenant « api_key=… ».',
      'cfg.title': 'Configuration predb.fr',
      'cfg.urlLabel': 'URL de feed',
      'cfg.urlHelp': 'À récupérer dans « Réglages › Clé API » sur predb.fr (elle contient api_key=…). Laisse vide pour effacer.',
      'cfg.langLabel': 'Langue',
      'cfg.save': 'Enregistrer',
      'cfg.cancel': 'Annuler',
      'menu.config': 'predb.fr : configurer',
      'err.json': 'Réponse JSON invalide',
      'err.401': '401 — clé API manquante ou invalide',
      'err.network': 'Erreur réseau',
      'err.timeout': 'Timeout',
      'nfo.download': '⬇ Télécharger .nfo',
      'nfo.dlFail': 'Téléchargement impossible : ',
      'nfo.quota': 'quota de téléchargement atteint',
      'nfo.unavailable': 'NFO indisponible : ',
      'modal.close': 'Fermer (Échap)',
      'modal.sub': 'Infos techniques de la release',
      'head.config': '⚙ config',
      'head.configure': '🔑 configurer',
      'msg.configure': 'Configurer',
      'size.title': 'Résultats par page',
      'size.perPage': '{n} / page',
      'pager.prev': 'Précédent',
      'pager.next': 'Suivant',
      'col.release': 'Release',
      'col.date': 'Date',
      'col.size': 'Taille',
      'col.nfo': 'NFO',
      'sort.by': 'Trier par {x}',
      'empty': 'Aucune release trouvée sur predb.fr.',
      'open.release': 'Ouvrir sur predb.fr',
      'open.source': 'Voir les releases {src} sur predb.fr',
      'open.team': 'Page de la team {team}',
      'foot.seeAll': '{n} premières / {total} — voir tout',
      'foot.see': 'voir sur predb.fr',
      'run.configure': 'Colle l’URL fournie par predb.fr pour afficher les releases.',
      'run.searching': 'Recherche sur predb.fr…',
      'run.error': 'Erreur : ',
    },
    en: {
      'cfg.invalid': 'Invalid URL: use the URL provided by predb.fr, containing “api_key=…”.',
      'cfg.title': 'predb.fr configuration',
      'cfg.urlLabel': 'Feed URL',
      'cfg.urlHelp': 'Get it from “Settings › API key” on predb.fr (it contains api_key=…). Leave empty to clear.',
      'cfg.langLabel': 'Language',
      'cfg.save': 'Save',
      'cfg.cancel': 'Cancel',
      'menu.config': 'predb.fr: configure',
      'err.json': 'Invalid JSON response',
      'err.401': '401 — API key missing or invalid',
      'err.network': 'Network error',
      'err.timeout': 'Timeout',
      'nfo.download': '⬇ Download .nfo',
      'nfo.dlFail': 'Download failed: ',
      'nfo.quota': 'download quota reached',
      'nfo.unavailable': 'NFO unavailable: ',
      'modal.close': 'Close (Esc)',
      'modal.sub': 'Technical Release Info',
      'head.config': '⚙ config',
      'head.configure': '🔑 configure',
      'msg.configure': 'Configure',
      'size.title': 'Results per page',
      'size.perPage': '{n} / page',
      'pager.prev': 'Previous',
      'pager.next': 'Next',
      'col.release': 'Release',
      'col.date': 'Date',
      'col.size': 'Size',
      'col.nfo': 'NFO',
      'sort.by': 'Sort by {x}',
      'empty': 'No release found on predb.fr.',
      'open.release': 'Open on predb.fr',
      'open.source': 'See {src} releases on predb.fr',
      'open.team': '{team} team page',
      'foot.seeAll': 'first {n} / {total} — see all',
      'foot.see': 'see on predb.fr',
      'run.configure': 'Paste the URL provided by predb.fr to display releases.',
      'run.searching': 'Searching predb.fr…',
      'run.error': 'Error: ',
    },
  };

  function detectLang() {
    const stored = GM_getValue('lang', '');
    if (stored === 'fr' || stored === 'en') return stored;
    let l = '';
    try { l = (document.documentElement.lang || navigator.language || '').toLowerCase(); } catch (e) {}
    return l.startsWith('fr') ? 'fr' : 'en';
  }
  let LANG = detectLang();
  function t(key, vars) {
    let s = (STRINGS[LANG] && STRINGS[LANG][key]) || STRINGS.en[key] || key;
    if (vars) for (const k in vars) s = s.replace('{' + k + '}', vars[k]);
    return s;
  }

  const SITE = 'https://predb.fr';
  const SECTION_ID = 'predbfr-section';
  const PAGE_SIZES = [5, 10, 20, 50, 100];

  function parseFeed(raw) {
    if (!raw) return null;
    try {
      const u = new URL(raw.trim());
      const key = (u.searchParams.get('api_key') || u.searchParams.get('apikey') || '').trim();
      if (!key) return null;
      const idx = u.pathname.indexOf('/v1');
      const base = u.origin + (idx >= 0 ? u.pathname.slice(0, idx) : u.pathname).replace(/\/+$/, '');
      return { api: base, key };
    } catch (e) {
      return null;
    }
  }

  let config = parseFeed(GM_getValue('feedUrl', ''));
  const getApiKey = () => (config ? config.key : '');

  function resolve() {
    const m = location.pathname.match(/^\/(movie|tv)\/(\d+)(?:-[^/]*)?\/?$/);
    if (!m) return null;
    const anchor =
      document.querySelector('.white_column') ||
      document.querySelector('.content_wrapper') ||
      document.querySelector('#media_v4');
    return { q: m[1] + ':' + m[2], anchor, placement: 'prepend' };
  }

  function openConfigModal() {
    closeConfigModal();
    const input = el('input', {
      type: 'text', class: 'predbfr-cfg-input',
      placeholder: SITE.replace('predb', 'api.predb') + '/api/v1/releases?api_key=...',
    });
    input.value = GM_getValue('feedUrl', '');
    const err = el('div', { class: 'predbfr-cfg-err' });

    const langSel = el('select', { class: 'predbfr-cfg-lang' });
    for (const [code, label] of [['fr', 'Français'], ['en', 'English']]) {
      const o = el('option', { value: code, text: label });
      if (code === LANG) o.selected = true;
      langSel.appendChild(o);
    }

    const save = el('button', { class: 'predbfr-cfg-save', text: t('cfg.save') });
    const cancel = el('button', { class: 'predbfr-cfg-cancel', text: t('cfg.cancel') });
    save.addEventListener('click', () => {
      const raw = input.value.trim();
      const parsed = parseFeed(raw);
      if (raw && !parsed) { err.textContent = t('cfg.invalid'); err.style.display = 'block'; return; }
      GM_setValue('feedUrl', raw);
      config = parsed;
      const newLang = langSel.value === 'fr' ? 'fr' : 'en';
      GM_setValue('lang', newLang);
      LANG = newLang;
      state.currentKey = null;
      closeConfigModal();
      run();
    });
    cancel.addEventListener('click', closeConfigModal);

    const box = el('div', { class: 'box' }, [
      el('div', { class: 'predbfr-cfg-title', text: t('cfg.title') }),
      el('label', { class: 'predbfr-cfg-label', text: t('cfg.urlLabel') }),
      input,
      el('div', { class: 'predbfr-cfg-help', text: t('cfg.urlHelp') }),
      err,
      el('label', { class: 'predbfr-cfg-label', text: t('cfg.langLabel') }),
      langSel,
      el('div', { class: 'predbfr-cfg-acts' }, [cancel, save]),
    ]);
    const overlay = el('div', { id: 'predbfr-config' }, [box]);
    const onKey = (e) => { if (e.key === 'Escape') closeConfigModal(); };
    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeConfigModal(); });
    overlay._onKey = onKey;
    document.addEventListener('keydown', onKey);
    document.body.appendChild(overlay);
    input.focus();
  }
  function closeConfigModal() {
    const m = document.getElementById('predbfr-config');
    if (m) { if (m._onKey) document.removeEventListener('keydown', m._onKey); m.remove(); }
  }

  GM_registerMenuCommand(t('menu.config'), openConfigModal);

  function formatVolume(bytes) {
    const n = typeof bytes === 'string' ? parseInt(bytes, 10) : bytes;
    if (n == null || isNaN(n) || n <= 0) return '—';
    const units = LANG === 'fr'
      ? ['o', 'Ko', 'Mo', 'Go', 'To', 'Po']
      : ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
    let v = n, i = 0;
    while (v >= 999.95 && i < units.length - 1) { v /= 1024; i++; }
    const dec = i === 0 ? 0 : v >= 100 ? 1 : v >= 10 ? 2 : 3;
    let s = v.toFixed(dec);
    if (LANG === 'fr') s = s.replace('.', ',');
    return s + ' ' + units[i];
  }

  function formatDate(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleString(LANG === 'fr' ? 'fr-FR' : 'en-GB', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }

  function el(tag, attrs, children) {
    const e = document.createElement(tag);
    if (attrs) for (const k in attrs) {
      if (k === 'class') e.className = attrs[k];
      else if (k === 'text') e.textContent = attrs[k];
      else if (k === 'html') e.innerHTML = attrs[k];
      else e.setAttribute(k, attrs[k]);
    }
    if (children) for (const c of children) if (c) e.appendChild(c);
    return e;
  }

  function apiGet(path) {
    return new Promise((resolve, reject) => {
      GM_xmlhttpRequest({
        method: 'GET',
        url: config.api + path,
        headers: { Accept: 'application/json', 'X-API-Key': getApiKey() },
        timeout: 15000,
        onload: (res) => {
          if (res.status >= 200 && res.status < 300) {
            try { resolve(JSON.parse(res.responseText)); }
            catch (e) { reject(new Error(t('err.json'))); }
          } else if (res.status === 401) reject(new Error(t('err.401')));
          else reject(new Error('HTTP ' + res.status));
        },
        onerror: () => reject(new Error(t('err.network'))),
        ontimeout: () => reject(new Error(t('err.timeout'))),
      });
    });
  }

  const CP437_HIGH =
    'ÇüéâäàåçêëèïîìÄÅÉæÆôöòûùÿÖÜ¢£¥₧ƒáíóúñÑªº¿⌐¬½¼¡«»' +
    '░▒▓│┤╡╢╖╕╣║╗╝╜╛┐└┴┬├─┼╞╟╚╔╩╦╠═╬╧╨╤╥╙╘╒╓╫╪┘┌█▄▌▐▀' +
    'αßΓπΣσµτΦΘΩδ∞φε∩≡±≥≤⌠⌡÷≈°∙·√ⁿ²■ ';

  function decodeNfo(buf) {
    const bytes = new Uint8Array(buf);
    try { return new TextDecoder('utf-8', { fatal: true }).decode(bytes); } catch (e) {}
    let out = '';
    for (let i = 0; i < bytes.length; i++) {
      const b = bytes[i];
      out += b < 0x80 ? String.fromCharCode(b) : CP437_HIGH[b - 0x80];
    }
    return out;
  }

  function fetchNfo(name, source) {
    return new Promise((resolve, reject) => {
      GM_xmlhttpRequest({
        method: 'GET',
        url: config.api + '/v1/releases/nfo?name=' + encodeURIComponent(name) +
          '&source=' + encodeURIComponent(source || 'P2P'),
        headers: { 'X-API-Key': getApiKey() },
        responseType: 'arraybuffer',
        timeout: 15000,
        onload: (res) => res.status >= 200 && res.status < 300
          ? resolve(decodeNfo(res.response)) : reject(new Error('HTTP ' + res.status)),
        onerror: () => reject(new Error(t('err.network'))),
        ontimeout: () => reject(new Error(t('err.timeout'))),
      });
    });
  }

  function downloadNfo(release) {
    return new Promise((resolve, reject) => {
      GM_xmlhttpRequest({
        method: 'GET',
        url: config.api + '/v1/releases/nfo/download?name=' + encodeURIComponent(release.name) +
          '&source=' + encodeURIComponent(release.source || 'P2P'),
        headers: { 'X-API-Key': getApiKey() },
        responseType: 'blob',
        timeout: 20000,
        onload: (res) => {
          if (res.status === 429) return reject(new Error(t('nfo.quota')));
          if (res.status < 200 || res.status >= 300) return reject(new Error('HTTP ' + res.status));
          const url = URL.createObjectURL(res.response);
          const a = el('a', { href: url, download: release.name + '.nfo' });
          document.body.appendChild(a);
          a.click();
          a.remove();
          setTimeout(() => URL.revokeObjectURL(url), 5000);
          resolve();
        },
        onerror: () => reject(new Error(t('err.network'))),
        ontimeout: () => reject(new Error(t('err.timeout'))),
      });
    });
  }

  GM_addStyle(`
    #${SECTION_ID} {
      margin: 0 0 30px; padding: 16px 18px; border-radius: 10px;
      background: #fff; color: #111; border: 1px solid #e3e3e3;
      font-family: "Source Sans Pro", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    #${SECTION_ID} .predbfr-head {
      display: flex; align-items: center; gap: 10px; margin: 0 0 12px;
      font-size: 1.2em; font-weight: 600;
    }
    #${SECTION_ID} .predbfr-logo { white-space: nowrap; }
    #${SECTION_ID} .predbfr-logo b { color: #21d07a; }
    #${SECTION_ID} .predbfr-count {
      background: #21d07a; color: #032b1b; font-weight: 700;
      border-radius: 999px; padding: 1px 9px; font-size: 13px;
    }
    #${SECTION_ID} .predbfr-key {
      margin-left: auto; font-size: 12px; font-weight: 600; cursor: pointer;
      color: #1675b6; background: none; border: none; padding: 0; white-space: nowrap;
    }
    #${SECTION_ID} .predbfr-key:hover { text-decoration: underline; }
    #${SECTION_ID} .predbfr-table { width: 100%; border-collapse: collapse; }
    #${SECTION_ID} .predbfr-table th, #${SECTION_ID} .predbfr-table td {
      text-align: left; padding: 8px 10px; border-bottom: 1px solid #e3e3e3;
      font-size: 14px; vertical-align: middle;
    }
    #${SECTION_ID} .predbfr-table th {
      font-size: 12px; text-transform: uppercase; letter-spacing: .4px;
      color: #888; border-bottom: 2px solid #d7d7d7; white-space: nowrap;
    }
    #${SECTION_ID} .predbfr-table th.sortable { cursor: pointer; user-select: none; }
    #${SECTION_ID} .predbfr-table th.sortable:hover { color: #21d07a; }
    #${SECTION_ID} .predbfr-table th.active { color: #0a7c4a; }
    #${SECTION_ID} .predbfr-table tr:hover td { background: #f4faf6; }
    #${SECTION_ID} .predbfr-rel {
      font-family: ui-monospace, "SFMono-Regular", Consolas, monospace;
      font-size: 12.5px; color: #111; text-decoration: none; word-break: break-all;
    }
    #${SECTION_ID} .predbfr-rel:hover { color: #1675b6; text-decoration: underline; }
    #${SECTION_ID} .predbfr-rel.nuked { color: #d63638; text-decoration: line-through; }
    #${SECTION_ID} .predbfr-badge {
      display: inline-block; margin-left: 6px; padding: 1px 6px; border-radius: 4px;
      font-size: 10px; font-weight: 700; letter-spacing: .3px; vertical-align: middle;
    }
    #${SECTION_ID} a.predbfr-badge { text-decoration: none; cursor: pointer; }
    #${SECTION_ID} a.predbfr-badge:hover { filter: brightness(0.92); text-decoration: none; }
    #${SECTION_ID} .b-scene { background: #dbeafe; color: #1e40af; }
    #${SECTION_ID} .b-p2p   { background: #ede9fe; color: #5b21b6; }
    #${SECTION_ID} .b-team  { background: #d1fae5; color: #065f46; }
    #${SECTION_ID} .b-nuke  { background: #fee2e2; color: #991b1b; }
    #${SECTION_ID} td.predbfr-c { white-space: nowrap; color: #444; }
    #${SECTION_ID} .predbfr-nfo-btn {
      font-size: 12px; font-weight: 600; padding: 4px 10px; border-radius: 6px;
      border: 1px solid #21d07a; background: #fff; color: #0a7c4a; cursor: pointer; white-space: nowrap;
    }
    #${SECTION_ID} .predbfr-nfo-btn:hover { background: #21d07a; color: #fff; }
    #${SECTION_ID} .predbfr-nfo-btn[disabled] { opacity: .4; cursor: default; border-color: #ccc; color: #999; }
    #${SECTION_ID} .predbfr-msg { padding: 6px 0; color: #666; }
    #${SECTION_ID} .predbfr-msg.err { color: #d63638; }
    #${SECTION_ID} .predbfr-msg button {
      margin-left: 8px; font-weight: 600; color: #1675b6; background: none;
      border: none; cursor: pointer; padding: 0; text-decoration: underline;
    }
    #${SECTION_ID} .predbfr-foot {
      display: flex; align-items: center; gap: 12px; flex-wrap: wrap;
      padding: 12px 0 0; font-size: 12px; color: #888;
    }
    #${SECTION_ID} .predbfr-foot a { color: #1675b6; }
    #${SECTION_ID} .predbfr-pager { display: flex; align-items: center; gap: 4px; }
    #${SECTION_ID} .predbfr-pager button {
      min-width: 28px; padding: 4px 8px; border-radius: 6px; cursor: pointer;
      border: 1px solid #d7d7d7; background: #fff; color: #333; font-size: 12px; font-weight: 600;
    }
    #${SECTION_ID} .predbfr-pager button:hover:not([disabled]):not(.cur) { background: #f0f0f0; }
    #${SECTION_ID} .predbfr-pager button.cur { background: #21d07a; border-color: #21d07a; color: #032b1b; cursor: default; }
    #${SECTION_ID} .predbfr-pager button[disabled] { opacity: .4; cursor: default; }
    #${SECTION_ID} .predbfr-pager .gap { color: #aaa; padding: 0 2px; }
    #${SECTION_ID} .predbfr-foot .spacer { margin-left: auto; }
    #${SECTION_ID} .predbfr-size-sel {
      padding: 4px 6px; border-radius: 6px; border: 1px solid #d7d7d7;
      background: #fff; color: #333; font-size: 12px; cursor: pointer;
    }

    #predbfr-modal { position: fixed; inset: 0; z-index: 2147483000; background: rgba(0,0,0,.7); display: flex; align-items: center; justify-content: center; }
    #predbfr-modal .box {
      background: #0a0a0a; border: 1px solid #2a2a2a; border-radius: 10px;
      max-width: min(1000px, 95vw); max-height: 88vh; display: flex; flex-direction: column;
      box-shadow: 0 20px 60px rgba(0,0,0,.7); overflow: hidden;
    }
    #predbfr-modal .bar { display: flex; align-items: center; gap: 12px; padding: 12px 16px; background: #161616; border-bottom: 1px solid #2a2a2a; }
    #predbfr-modal .predbfr-nfo-title { min-width: 0; }
    #predbfr-modal .predbfr-nfo-title .name {
      font-family: ui-monospace, Consolas, monospace; font-size: 13px; font-weight: 700;
      color: #e8e8e8; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 60vw;
    }
    #predbfr-modal .predbfr-nfo-title .sub { font-size: 10px; letter-spacing: 2px; text-transform: uppercase; color: #777; font-weight: 700; }
    #predbfr-modal .acts { margin-left: auto; display: flex; align-items: center; gap: 8px; }
    #predbfr-modal .predbfr-nfo-dl {
      font-size: 12px; font-weight: 600; padding: 5px 12px; border-radius: 6px; white-space: nowrap;
      border: 1px solid rgba(33,208,122,.5); background: transparent; color: #21d07a; cursor: pointer;
    }
    #predbfr-modal .predbfr-nfo-dl:hover { background: rgba(33,208,122,.12); }
    #predbfr-modal .predbfr-nfo-dl[disabled] { opacity: .5; cursor: default; }
    #predbfr-modal .x { cursor: pointer; color: #888; font-size: 22px; line-height: 1; background: none; border: none; padding: 0 4px; }
    #predbfr-modal .x:hover { color: #fff; }
    #predbfr-modal .nfo-body { background: #000; padding: 24px; overflow: auto; }
    #predbfr-modal .nfo-body pre {
      margin: 0; color: #c0c0c0; white-space: pre;
      font-family: 'PxPlus IBM VGA8', 'Terminal', 'Consolas', 'Courier New', monospace;
      font-size: 14px; line-height: 1.0; letter-spacing: 0;
      -webkit-font-smoothing: none; font-smooth: never;
    }

    #predbfr-config { position: fixed; inset: 0; z-index: 2147483001; background: rgba(0,0,0,.6); display: flex; align-items: center; justify-content: center; padding: 20px; }
    #predbfr-config .box {
      background: #fff; color: #111; border-radius: 12px; width: min(520px, 95vw);
      padding: 22px; box-shadow: 0 20px 60px rgba(0,0,0,.4);
      font-family: "Source Sans Pro", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    #predbfr-config .predbfr-cfg-title { font-size: 18px; font-weight: 700; margin: 0 0 8px; }
    #predbfr-config .predbfr-cfg-label {
      display: block; font-size: 12px; font-weight: 700; text-transform: uppercase;
      letter-spacing: .4px; color: #666; margin: 14px 0 6px;
    }
    #predbfr-config .predbfr-cfg-input, #predbfr-config .predbfr-cfg-lang {
      width: 100%; box-sizing: border-box; padding: 9px 11px; border: 1px solid #d7d7d7;
      border-radius: 8px; font-size: 14px; background: #fff; color: #111;
    }
    #predbfr-config .predbfr-cfg-lang { cursor: pointer; }
    #predbfr-config .predbfr-cfg-input:focus, #predbfr-config .predbfr-cfg-lang:focus { outline: none; border-color: #21d07a; }
    #predbfr-config .predbfr-cfg-help { font-size: 12px; color: #888; margin-top: 6px; }
    #predbfr-config .predbfr-cfg-err { display: none; font-size: 13px; color: #d63638; font-weight: 600; margin-top: 8px; }
    #predbfr-config .predbfr-cfg-acts { display: flex; gap: 10px; justify-content: flex-end; margin-top: 22px; }
    #predbfr-config .predbfr-cfg-save {
      background: #21d07a; color: #032b1b; border: none; padding: 9px 18px;
      border-radius: 8px; font-weight: 700; font-size: 14px; cursor: pointer;
    }
    #predbfr-config .predbfr-cfg-save:hover { background: #1bb86c; }
    #predbfr-config .predbfr-cfg-cancel {
      background: #fff; color: #444; border: 1px solid #d7d7d7; padding: 9px 18px;
      border-radius: 8px; font-weight: 600; font-size: 14px; cursor: pointer;
    }
    #predbfr-config .predbfr-cfg-cancel:hover { background: #f0f0f0; }
  `);

  function openNfoModal(release, content) {
    closeNfoModal();

    const dl = el('button', { class: 'predbfr-nfo-dl', text: t('nfo.download') });
    dl.addEventListener('click', async () => {
      const old = dl.textContent; dl.textContent = '…'; dl.disabled = true;
      try { await downloadNfo(release); }
      catch (e) { alert(t('nfo.dlFail') + e.message); }
      finally { dl.textContent = old; dl.disabled = false; }
    });
    const close = el('button', { class: 'x', text: '×', title: t('modal.close') });

    const title = el('div', { class: 'predbfr-nfo-title' }, [
      el('div', { class: 'name', text: release.name, title: release.name }),
      el('div', { class: 'sub', text: t('modal.sub') }),
    ]);
    const bar = el('div', { class: 'bar' }, [title, el('div', { class: 'acts' }, [dl, close])]);
    const body = el('div', { class: 'nfo-body' }, [el('pre', { text: content })]);
    const overlay = el('div', { id: 'predbfr-modal' }, [el('div', { class: 'box' }, [bar, body])]);

    const onKey = (e) => { if (e.key === 'Escape') closeNfoModal(); };
    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeNfoModal(); });
    close.addEventListener('click', closeNfoModal);
    overlay._onKey = onKey;
    document.addEventListener('keydown', onKey);
    document.body.appendChild(overlay);
  }
  function closeNfoModal() {
    const m = document.getElementById('predbfr-modal');
    if (m) { if (m._onKey) document.removeEventListener('keydown', m._onKey); m.remove(); }
  }

  function ensureSection(anchor, placement) {
    let sec = document.getElementById(SECTION_ID);
    if (sec) return sec;
    if (!anchor) return null;
    sec = el('section', { id: SECTION_ID });
    const place = placement || 'prepend';
    if (place === 'append') anchor.appendChild(sec);
    else if (place === 'after') anchor.parentNode.insertBefore(sec, anchor.nextSibling);
    else if (place === 'before') anchor.parentNode.insertBefore(sec, anchor);
    else anchor.insertBefore(sec, anchor.firstChild);
    return sec;
  }

  function header(count) {
    const h = el('div', { class: 'predbfr-head' }, [
      el('span', { class: 'predbfr-logo', html: 'Releases — pre<b>db</b>.fr' }),
    ]);
    if (count != null) h.appendChild(el('span', { class: 'predbfr-count', text: String(count) }));
    const keyBtn = el('button', { class: 'predbfr-key', text: config ? t('head.config') : t('head.configure') });
    keyBtn.addEventListener('click', openConfigModal);
    h.appendChild(keyBtn);
    return h;
  }

  function msg(sec, text, isErr, withCfgBtn) {
    sec.innerHTML = '';
    sec.appendChild(header(null));
    const m = el('div', { class: 'predbfr-msg' + (isErr ? ' err' : '') }, [el('span', { text })]);
    if (withCfgBtn) {
      const b = el('button', { text: t('msg.configure') });
      b.addEventListener('click', openConfigModal);
      m.appendChild(b);
    }
    sec.appendChild(m);
  }

  function buildSizeSelect(sec) {
    const sel = el('select', { class: 'predbfr-size-sel', title: t('size.title') });
    for (const n of PAGE_SIZES) {
      const o = el('option', { value: String(n), text: t('size.perPage', { n }) });
      if (n === state.pageSize) o.selected = true;
      sel.appendChild(o);
    }
    sel.addEventListener('change', () => {
      state.pageSize = parseInt(sel.value, 10) || 10;
      GM_setValue('pageSize', state.pageSize);
      state.page = 1;
      render(sec, state.currentKey);
    });
    return sel;
  }

  function pageList(cur, last) {
    const set = new Set([1, last, cur, cur - 1, cur + 1]);
    const pages = [...set].filter((p) => p >= 1 && p <= last).sort((a, b) => a - b);
    const out = [];
    let prev = 0;
    for (const p of pages) {
      if (p - prev > 1) out.push('…');
      out.push(p);
      prev = p;
    }
    return out;
  }

  function buildPager(sec, page, last) {
    const pager = el('div', { class: 'predbfr-pager' });
    const btn = (label, target, opts = {}) => {
      const b = el('button', { text: label, title: opts.title || '' });
      if (opts.cur) b.classList.add('cur');
      if (opts.disabled) b.disabled = true;
      else b.addEventListener('click', () => gotoPage(sec, target));
      return b;
    };
    pager.appendChild(btn('‹', page - 1, { disabled: page <= 1, title: t('pager.prev') }));
    for (const p of pageList(page, last)) {
      if (p === '…') pager.appendChild(el('span', { class: 'gap', text: '…' }));
      else pager.appendChild(btn(String(p), p, { cur: p === page }));
    }
    pager.appendChild(btn('›', page + 1, { disabled: page >= last, title: t('pager.next') }));
    return pager;
  }

  function sortReleases(arr) {
    const dir = state.order === 'asc' ? 1 : -1;
    const val = (r) => state.sort === 'size'
      ? (parseInt(r.size, 10) || 0)
      : (r.date ? new Date(r.date).getTime() || 0 : 0);
    return [...arr].sort((a, b) => (val(a) - val(b)) * dir);
  }

  function render(sec, query) {
    const all = sortReleases(state.cache.releases);
    const total = state.cache.total;
    const last = Math.max(1, Math.ceil(all.length / state.pageSize));
    if (state.page > last) state.page = last;
    if (state.page < 1) state.page = 1;
    const start = (state.page - 1) * state.pageSize;
    const pageRows = all.slice(start, start + state.pageSize);

    sec.innerHTML = '';
    sec.appendChild(header(total >= 0 ? total : all.length));

    if (!all.length) {
      sec.appendChild(el('div', { class: 'predbfr-msg', text: t('empty') }));
      return;
    }

    const sortTh = (label, field) => {
      const active = state.sort === field;
      const arrow = active ? (state.order === 'desc' ? ' ▼' : ' ▲') : '';
      const th = el('th', { class: 'sortable' + (active ? ' active' : ''), text: label + arrow, title: t('sort.by', { x: label.toLowerCase() }) });
      th.addEventListener('click', () => setSort(sec, field));
      return th;
    };
    const thead = el('thead', null, [el('tr', null, [
      el('th', { text: t('col.release') }), sortTh(t('col.date'), 'date'),
      sortTh(t('col.size'), 'size'), el('th', { text: t('col.nfo') }),
    ])]);
    const tbody = el('tbody');

    for (const r of pageRows) {
      const nameCell = el('td');
      nameCell.appendChild(el('a', {
        class: 'predbfr-rel' + (r.nuke_reason ? ' nuked' : ''),
        href: SITE + '/?release=' + encodeURIComponent(r.name),
        target: '_blank', rel: 'noopener', text: r.name, title: t('open.release'),
      }));
      const src = (r.source || '').toUpperCase();
      if (src) nameCell.appendChild(el('a', {
        class: 'predbfr-badge ' + (src === 'P2P' ? 'b-p2p' : 'b-scene'),
        href: SITE + '/?source=' + src, target: '_blank', rel: 'noopener',
        text: src, title: t('open.source', { src }),
      }));
      if (r.team_name) nameCell.appendChild(el('a', {
        class: 'predbfr-badge b-team',
        href: SITE + '/teams/' + encodeURIComponent(r.team_name), target: '_blank', rel: 'noopener',
        text: r.team_name, title: t('open.team', { team: r.team_name }),
      }));
      if (r.nuke_reason) nameCell.appendChild(el('span', { class: 'predbfr-badge b-nuke', text: 'NUKED', title: r.nuke_reason }));

      const nfoCell = el('td');
      if (r.has_nfo) {
        const btn = el('button', { class: 'predbfr-nfo-btn', text: 'NFO' });
        btn.addEventListener('click', async () => {
          const old = btn.textContent; btn.textContent = '…'; btn.disabled = true;
          try { openNfoModal(r, await fetchNfo(r.name, r.source)); }
          catch (e) { alert(t('nfo.unavailable') + e.message); }
          finally { btn.textContent = old; btn.disabled = false; }
        });
        nfoCell.appendChild(btn);
      } else {
        nfoCell.appendChild(el('span', { class: 'predbfr-c', text: '—' }));
      }

      tbody.appendChild(el('tr', null, [
        nameCell,
        el('td', { class: 'predbfr-c', text: formatDate(r.date) }),
        el('td', { class: 'predbfr-c', text: formatVolume(r.size) }),
        nfoCell,
      ]));
    }

    sec.appendChild(el('table', { class: 'predbfr-table' }, [thead, tbody]));

    const moreThanLoaded = total >= 0 && total > all.length;
    const foot = el('div', { class: 'predbfr-foot' });
    if (last > 1) foot.appendChild(buildPager(sec, state.page, last));
    foot.appendChild(el('span', { class: 'spacer' }));
    foot.appendChild(buildSizeSelect(sec));
    foot.appendChild(el('a', {
      target: '_blank', rel: 'noopener', href: SITE + '/?q=' + encodeURIComponent(query),
      text: moreThanLoaded ? t('foot.seeAll', { n: all.length, total }) : t('foot.see'),
    }));
    sec.appendChild(foot);
  }

  const state = {
    currentKey: null, page: 1,
    pageSize: parseInt(GM_getValue('pageSize', 5), 10) || 5,
    sort: 'date', order: 'desc', cache: { releases: [], total: 0 },
  };

  function setSort(sec, field) {
    if (state.sort === field) state.order = state.order === 'desc' ? 'asc' : 'desc';
    else { state.sort = field; state.order = 'desc'; }
    state.page = 1;
    render(sec, state.currentKey);
    sec.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function gotoPage(sec, page) {
    state.page = page;
    render(sec, state.currentKey);
    sec.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function run() {
    const found = resolve();
    if (!found || !found.q) {
      const s = document.getElementById(SECTION_ID);
      if (s) s.remove();
      state.currentKey = null;
      return;
    }
    const q = found.q;

    const sec = ensureSection(found.anchor, found.placement);
    if (!sec) { setTimeout(run, 500); return; }

    if (!config) {
      msg(sec, t('run.configure'), false, true);
      state.currentKey = null;
      return;
    }
    if (q === state.currentKey && state.cache.releases.length && sec.querySelector('.predbfr-table')) return;
    fetchData(sec, q);
  }

  async function fetchData(sec, query) {
    state.currentKey = query;
    state.cache = { releases: [], total: 0 };
    state.page = 1; state.sort = 'date'; state.order = 'desc';
    msg(sec, t('run.searching'), false, false);
    try {
      const data = await apiGet('/v1/releases?q=' + encodeURIComponent(query) +
        '&page=1&limit=100&sort=date&order=desc');
      if (query !== state.currentKey) return;
      const releases = (data && data.releases) || [];
      state.cache = { releases, total: typeof data.total === 'number' ? data.total : releases.length };
      render(sec, query);
    } catch (e) {
      if (query !== state.currentKey) return;
      msg(sec, t('run.error') + e.message, true, /^401/.test(e.message));
    }
  }

  let lastUrl = location.pathname + location.search;
  setInterval(() => {
    const url = location.pathname + location.search;
    if (url !== lastUrl) {
      lastUrl = url;
      state.currentKey = null;
      run();
    }
  }, 800);

  run();
})();
