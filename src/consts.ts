export const SITE = {
  name: 'the bride feed',
  title: 'the bride feed · wedding content creator în București',
  description:
    'Wedding content creator în București și împrejurimi, conținut real-time pentru nunți: reels, stories și clipuri spontane livrate chiar în ziua nunții.',
  url: 'https://thebridefeed.ro',
  email: 'contact@thebridefeed.ro',
  phone: '0751 022 832',
  whatsapp: 'https://wa.me/40751022832',
  instagram: 'https://instagram.com/thebridefeedro',
  tiktok: 'https://www.tiktok.com/@thebridefeed.ro',
  city: 'București',
  region: 'București și Ilfov',
  radiusKm: 200,
  // Google Analytics 4 — Measurement ID (format G-XXXXXXXXXX). Lasă gol ca să dezactivezi.
  // Categoria „analiză" din bannerul de cookies.
  ga4Id: 'G-T6YGMXNMWC',
  // Marketing — categoria „marketing" din bannerul de cookies. Lasă gol ca să dezactivezi fiecare.
  googleAdsId: '',    // Google Ads, format 'AW-XXXXXXXXX'
  metaPixelId: '1288857069727491',    // Meta/Facebook Pixel
  tiktokPixelId: '',  // TikTok Pixel — ex. 'CXXXXXXXXXXXXXXXXXXX' (din TikTok Ads Manager)
  // Operatorul de date pentru Politica de confidențialitate.
  // Acum persoană fizică; la înființarea PFA înlocuiește cu denumirea completă, CUI-ul și sediul.
  legalOperator: 'Antonio-Ionuț Porumbiță (persoană fizică)',
  // Folosit DOAR ca poartă locală a /admin când Supabase NU e conectat (dev).
  // În producție login-ul e prin contul Supabase (contact@thebridefeed.ro) — parola reală se schimbă acolo.
  adminPass: 'Marsonia1106!',
};

// Pachetele și prețul (folosit în /admin pentru estimarea încasărilor și în formulare)
export const PACKAGES = [
  { name: 'Essential', price: 1200 },
  { name: 'Full Day', price: 1700 },
  { name: 'Premium', price: 2500 },
];
