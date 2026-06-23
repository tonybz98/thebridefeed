# the bride feed — site

Site static construit cu **Astro**. Rapid, optimizat SEO, cu blog pe fișiere Markdown.

## Rulare locală

```bash
npm install        # o singură dată
npm run dev        # pornește pe http://localhost:4321
```

Alte comenzi:

```bash
npm run build      # generează site-ul static în /dist
npm run preview    # previzualizează build-ul de producție
```

> Necesită Node 18.20+ / 20.3+ / 22+.

## Structura

```
src/
  consts.ts              -> datele site-ului (nume, contact, social) — EDITEAZĂ AICI
  content.config.ts      -> schema articolelor de blog
  content/blog/*.md      -> articolele (aici scrie tool-ul tău AI)
  components/            -> Logo, Header, Footer, BaseHead (SEO)
  layouts/              -> Base (shell) + BlogPost (template articol)
  pages/                -> index.astro (homepage), blog/, rss.xml.js, 404
  styles/global.css      -> tot design system-ul (culori, fonturi, componente)
public/                  -> favicon, robots.txt, /images (pozele tale)
```

## Cum adaugi un articol pe blog

Pui un fișier `.md` în `src/content/blog/`. Numele fișierului devine URL-ul
(`articolul-meu.md` -> `/blog/articolul-meu/`). Frontmatter-ul obligatoriu:

```markdown
---
title: "Titlul articolului"
description: "Rezumat scurt, 1-2 fraze (apare în Google și pe social)."
pubDate: 2026-06-15
tags: ["nuntă", "reels"]
draft: false
---

Conținutul în Markdown. Folosește ## pentru subtitluri (bun pentru SEO)
și pune linkuri interne către alte articole sau către /#pachete și /#contact.
```

Câmpuri opționale: `updatedDate`, `heroImage` (ex. `/images/articol.jpg`).
Pune `draft: true` ca articolul să nu apară încă pe site.

**Pentru tool-ul AI:** dă-i ca model cele două articole existente din `src/content/blog/`
și cere-i să respecte exact formatul de frontmatter de mai sus.

## Unde pui informațiile reale și pozele

1. **Datele de contact / social:** editează `src/consts.ts` (email, telefon, WhatsApp, Instagram, TikTok).
2. **Pozele și reelsurile:** pune fișierele în `public/images/` și înlocuiește
   placeholderele din `src/pages/index.astro` (secțiunile „din feed” și hero).
3. **Imaginea de share (Open Graph):** adaugă `public/og-default.jpg` (1200×630px) — apare când cineva dă share linkului.

## Checklist SEO (deja inclus)

- [x] Titluri și meta descriptions per pagină
- [x] URL canonice + `lang="ro"`
- [x] Open Graph + Twitter cards
- [x] Date structurate (LocalBusiness pe homepage, BlogPosting pe articole)
- [x] Sitemap automat (`/sitemap-index.xml`) + `robots.txt`
- [x] Feed RSS (`/rss.xml`)
- [x] HTML semantic, focus vizibil, `prefers-reduced-motion`

De făcut după lansare: înlocuiește `https://thebridefeed.ro` în `astro.config.mjs`
și `src/consts.ts` cu domeniul real, adaugă `og-default.jpg`, apoi trimite
sitemap-ul în Google Search Console.

## Deploy (recomandat)

Netlify, Vercel sau Cloudflare Pages — toate detectează Astro automat și sunt gratuite pentru un site ca ăsta. Build command: `npm run build`, output: `dist`.

## Optimizare viitoare

Fonturile se încarcă acum de la Google Fonts. Pentru un scor de viteză și mai bun, le poți self-hosta cu `@fontsource` (eliminând cererea externă).

## Pagini noi: disponibilitate + admin

- **`/disponibilitate`** — calendar public. Vizitatorul vede zilele libere/rezervate; click pe o zi liberă → deschide WhatsApp cu data completată. Are sub calendar întrebări despre rezervare + reels.
- **`/admin`** — panou intern (exclus din Google: `noindex` + `robots`). Click pe o zi → blochezi/editezi o nuntă (mirii, locația, pachetul, observații). Lista nunților e lângă calendar.

### Codul de acces la /admin
E în `src/consts.ts` → `adminPass`. **Schimbă-l.** Atenție: e doar o **barieră soft**, nu securitate reală — codul ajunge în browser. Pentru protecție serioasă: parolă la nivel de hosting (Netlify/Vercel au „password protection") sau autentificare pe backend.

### Cum se salvează datele (important)
Acum, datele blocate se țin în **browser (localStorage)**. Asta înseamnă: pe calculatorul tău, ce blochezi în `/admin` apare imediat pe `/disponibilitate` (și se sincronizează între tab-uri). **DAR** un alt vizitator, de pe alt device, NU vede încă datele tale blocate — fiindcă fiecare browser are propriul localStorage.

### Sincronizare reală pentru toți vizitatorii
Pentru ca datele blocate să fie vizibile tuturor (și live), conectează un backend. Recomandat: **Supabase** (gratuit, are realtime instant):
1. Creezi un proiect Supabase + un tabel `bookings` (date, couple, location, pkg, notes).
2. Înlocuiești cele 4 funcții din `src/lib/store.js` cu apeluri Supabase (citire publică, scriere doar autentificat).
3. Activezi Realtime → calendarul public se actualizează singur, fără refresh.

Butonul flotant de WhatsApp folosește numărul din `src/consts.ts` (`whatsapp`).

## Setup Supabase (calendar live pentru toți) — pas cu pas

1. **Creează proiect** pe supabase.com (gratuit).
2. **Rulează schema:** Supabase → *SQL Editor* → *New query* → lipește tot din `supabase/schema.sql` → *Run*.
3. **Creează adminul:** Supabase → *Authentication* → *Users* → *Add user* → pune email + parolă și bifează *Auto Confirm User*. Cu acest email/parolă te loghezi pe `/admin`.
4. **Ia cheile:** Supabase → *Project Settings* → *API* → copiază `Project URL` și cheia `anon public`.
5. **Pune-le pe Vercel:** Vercel → proiect → *Settings* → *Environment Variables* → adaugă:
   - `PUBLIC_SUPABASE_URL` = Project URL
   - `PUBLIC_SUPABASE_ANON_KEY` = cheia anon public
   Apoi *Deployments* → ultimul deploy → *Redeploy* (variabilele se aplică la build).
6. Gata: `/admin` cere acum login, iar ce blochezi apare instant pe `/disponibilitate` pentru oricine.

Pentru dev local: copiază `.env.example` ca `.env` și pune aceleași valori.

Notă securitate: cheia `anon` e publică prin design — accesul e controlat de RLS (vezi `schema.sql`). Datele personale ale mirilor stau în tabelul `bookings` (doar admin autentificat); publicul vede doar tabelul `availability_dates` (doar datele ocupate).
