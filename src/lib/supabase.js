import { createClient } from '@supabase/supabase-js';

// Citite din variabilele de mediu (Vercel → Settings → Environment Variables,
// sau un fișier .env local). Prefixul PUBLIC_ le face vizibile în browser —
// e ok: cheia anon e publică prin design, securitatea vine din RLS (vezi SQL).
const URL = import.meta.env.PUBLIC_SUPABASE_URL;
const KEY = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

// Dacă nu sunt setate, supabase = null și aplicația cade pe localStorage (local).
export const supabase = URL && KEY ? createClient(URL, KEY) : null;
