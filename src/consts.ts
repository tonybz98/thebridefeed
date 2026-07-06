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
  tiktok: 'https://www.tiktok.com/@thebridefeed',
  city: 'București',
  region: 'București și Ilfov',
  radiusKm: 200,
  // Google Analytics 4 — Measurement ID (format G-XXXXXXXXXX). Lasă gol ca să dezactivezi.
  ga4Id: 'G-T6YGMXNMWC',
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
