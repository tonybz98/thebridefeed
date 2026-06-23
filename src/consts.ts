export const SITE = {
  name: 'the bride feed',
  title: 'the bride feed — wedding content creator în București',
  description:
    'Wedding content creator în București și împrejurimi — conținut real-time pentru nunți: reels, stories și clipuri spontane livrate chiar în ziua nunții.',
  url: 'https://thebridefeed.ro',
  email: 'contact@thebridefeed.com',
  phone: '0751 xxx xxx',
  whatsapp: 'https://wa.me/407XXXXXXXX',
  instagram: 'https://instagram.com/thebridefeed',
  tiktok: 'https://www.tiktok.com/@thebridefeed',
  city: 'București',
  region: 'București – Ilfov',
  radiusKm: 200,
  // Folosit DOAR pentru poarta locală a /admin când Supabase nu e conectat. Schimbă-l.
  adminPass: 'mireasa2026',
};

// Pachetele și prețul de pornire (folosit în /admin pentru estimarea încasărilor)
export const PACKAGES = [
  { name: 'Stories', price: 600 },
  { name: 'Full Day', price: 1500 },
  { name: 'Full + Edit', price: 2500 },
];
