import { supabase } from './supabase.js';

// REMOTE = true dacă Supabase e configurat (chei prezente). Altfel, fallback localStorage.
export const REMOTE = !!supabase;

/* ----------------- fallback local (localStorage, un singur device) ----------------- */
const LKEY = 'tbf_bookings_v1';
function localList() {
  if (typeof localStorage === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(LKEY) || '[]'); } catch { return []; }
}
function localPersist(list) {
  localStorage.setItem(LKEY, JSON.stringify(list));
  window.dispatchEvent(new CustomEvent('tbf:bookings'));
}
function localUpsert(b) {
  const list = localList();
  const i = list.findIndex((x) => x.date === b.date);
  const rec = { date: b.date, couple: b.couple || '', location: b.location || '', pkg: b.pkg || '', notes: b.notes || '' };
  if (i >= 0) list[i] = rec; else list.push(rec);
  localPersist(list);
}
function localDelete(date) { localPersist(localList().filter((b) => b.date !== date)); }

/* ----------------- API public ----------------- */

// PUBLIC: doar datele ocupate (fără date personale)
export async function listBookedDates() {
  if (REMOTE) {
    const { data, error } = await supabase.from('availability_dates').select('date');
    if (error) { console.error('listBookedDates', error); return []; }
    return data.map((r) => r.date);
  }
  return localList().map((b) => b.date);
}

// ADMIN: rezervările complete (necesită autentificare în mod REMOTE)
export async function listBookings() {
  if (REMOTE) {
    const { data, error } = await supabase.from('bookings').select('*').order('date', { ascending: true });
    if (error) { console.error('listBookings', error); return []; }
    return data;
  }
  return [...localList()].sort((a, b) => a.date.localeCompare(b.date));
}

export async function upsertBooking(b) {
  if (REMOTE) {
    const row = { date: b.date, couple: b.couple || null, location: b.location || null, pkg: b.pkg || null, notes: b.notes || null };
    const { error } = await supabase.from('bookings').upsert(row, { onConflict: 'date' });
    if (error) throw error;
    return;
  }
  localUpsert(b);
}

export async function deleteBooking(date) {
  if (REMOTE) {
    const { error } = await supabase.from('bookings').delete().eq('date', date);
    if (error) throw error;
    return;
  }
  localDelete(date);
}

// se declanșează la orice schimbare (Supabase realtime sau evenimente locale)
export function subscribe(cb) {
  if (REMOTE) {
    const ch = supabase
      .channel('tbf-availability')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'availability_dates' }, cb)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, cb)
      .subscribe();
    return () => supabase.removeChannel(ch);
  }
  const h = () => cb();
  window.addEventListener('tbf:bookings', h);
  window.addEventListener('storage', (e) => { if (e.key === LKEY) cb(); });
  return () => window.removeEventListener('tbf:bookings', h);
}

/* ----------------- auth (doar REMOTE) ----------------- */
export async function getUser() {
  if (!REMOTE) return null;
  const { data } = await supabase.auth.getSession();
  return data?.session?.user || null;
}
export async function signIn(email, password) {
  if (!REMOTE) return { error: null };
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  return { error };
}
export async function signOut() {
  if (REMOTE) await supabase.auth.signOut();
}

/* ----------------- analytics (vizite + lead-uri WhatsApp) ----------------- */
// Funcționează doar în mod REMOTE (Supabase). Local: no-op.
export async function logEvent(type, path) {
  if (!REMOTE) return;
  try { await supabase.from('events').insert({ type, path: path || null }); } catch { /* silent */ }
}
export async function getEvents() {
  if (!REMOTE) return [];
  const { data, error } = await supabase.from('events').select('type, created_at').limit(20000);
  if (error) { console.error('getEvents', error); return []; }
  return data || [];
}
