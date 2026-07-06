# the bride feed — setup Supabase + notificări email

Pași pentru ca **calendarul să fie live pentru toată lumea** (cererile ajung la tine),
cu **notificare în /admin** și **pe email** la contact@thebridefeed.ro.

> Vizitatorii rămân anonimi — există un singur cont, al tău. Ei doar trimit cereri;
> doar tu poți bloca/confirma o dată din `/admin`.

---

## 1. Baza de date (tabele + reguli)

Supabase → **SQL Editor** → New query → lipește tot conținutul din
[`schema.sql`](./schema.sql) → **Run**.

Creează tabelele `bookings`, `availability_dates`, `leads`, `events` și regulile RLS
(vizitatorii pot doar trimite cereri; citirea/editarea = doar tu, autentificat).

## 2. Contul de admin

Supabase → **Authentication → Users → Add user**:
- Email: `contact@thebridefeed.ro`
- Password: `Marsonia1106!`
- (bifează „Auto Confirm User")

Ăsta e contul cu care intri în `/admin` (după ce site-ul e conectat la Supabase).

## 3. Cheile în Vercel (face calendarul live)

Supabase → **Project Settings → API**, copiază:
- **Project URL** → `https://xxxx.supabase.co`
- **anon public key** → `eyJ...` (NU service_role)

Vercel → proiectul thebridefeed → **Settings → Environment Variables**, adaugă
(pentru Production, Preview și Development):

| Name | Value |
|------|-------|
| `PUBLIC_SUPABASE_URL` | Project URL |
| `PUBLIC_SUPABASE_ANON_KEY` | anon public key |

Apoi **Redeploy**. Din acest moment calendarul e partajat și cererile ajung în `/admin`.

## 4. Notificare pe email (Resend)

### 4a. Cont Resend
- Cont gratuit pe [resend.com](https://resend.com) cu adresa `contact@thebridefeed.ro`.
- **API Keys → Create** → copiază cheia (`re_...`).
- (Recomandat) **Domains → Add** `thebridefeed.ro` și adaugă în DNS înregistrările cerute,
  ca să poți trimite de la `notificari@thebridefeed.ro`. Până atunci, funcția trimite
  de la `onboarding@resend.dev` către adresa ta (merge în modul de test al Resend).

### 4b. Deploy funcția `notify-lead`
Cel mai simplu, din terminal, în folderul repo-ului:
```bash
npx supabase login
npx supabase link --project-ref <ref-ul-proiectului>   # din URL: xxxx.supabase.co → ref = xxxx
npx supabase functions deploy notify-lead
```
Setează secretele (Supabase → **Edge Functions → Manage secrets**, sau CLI):
```bash
npx supabase secrets set RESEND_API_KEY=re_xxx
npx supabase secrets set MAIL_TO=contact@thebridefeed.ro
# după ce verifici domeniul în Resend:
# npx supabase secrets set MAIL_FROM="the bride feed <notificari@thebridefeed.ro>"
```

### 4c. Webhook pe tabela `leads`
Supabase → **Database → Webhooks → Create a new hook**:
- Table: `leads`
- Events: **Insert**
- Type: **Supabase Edge Functions** → alege `notify-lead`
- (opțional) adaugă un header `x-webhook-secret` și setează același `WEBHOOK_SECRET`
  ca secret al funcției, pentru securitate în plus.

Gata: la fiecare cerere nouă din calendar primești email + o vezi în `/admin`.

---

## Test rapid
1. Intră pe `thebridefeed.ro/disponibilitate`, alege o zi liberă, trimite o cerere.
2. Verifică `/admin` (login cu contul de la pasul 2) → apare în „Lead-uri din calendar".
3. Verifică inbox-ul contact@thebridefeed.ro → ar trebui să vină emailul.
