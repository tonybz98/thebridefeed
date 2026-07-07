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

/* leads (fallback local) */
const LKEY_LEADS = 'tbf_leads_v1';
function localLeads() {
  if (typeof localStorage === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(LKEY_LEADS) || '[]'); } catch { return []; }
}
function localLeadsPersist(list) {
  localStorage.setItem(LKEY_LEADS, JSON.stringify(list));
  window.dispatchEvent(new CustomEvent('tbf:leads'));
}
function localLeadId() { return 'l' + Date.now() + Math.random().toString(36).slice(2, 7); }

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

/* ----------------- leads (cereri din calendarul public) ----------------- */
// PUBLIC: oricine poate trimite un lead. Citirea/editarea — doar adminul.
export async function createLead(lead) {
  if (REMOTE) {
    const row = {
      date: lead.date || null, couple: lead.couple || null, location: lead.location || null,
      pkg: lead.pkg || null, notes: lead.notes || null,
      name: lead.name || null, phone: lead.phone || null, email: lead.email || null,
    };
    const { error } = await supabase.from('leads').insert(row);
    if (error) throw error;
    return;
  }
  const list = localLeads();
  list.unshift({ id: localLeadId(), status: 'neprelucrat', created_at: new Date().toISOString(), ...lead });
  localLeadsPersist(list);
}

export async function listLeads() {
  if (REMOTE) {
    const { data, error } = await supabase.from('leads').select('*').order('created_at', { ascending: false });
    if (error) { console.error('listLeads', error); return []; }
    return data;
  }
  return localLeads();
}

export async function updateLeadStatus(id, status) {
  return updateLead(id, { status });
}

// patch = orice câmpuri CRM (status, avans_incasat, facturat, notes, ...)
export async function updateLead(id, patch) {
  if (REMOTE) {
    const { error } = await supabase.from('leads').update(patch).eq('id', id);
    if (error) throw error;
    return;
  }
  localLeadsPersist(localLeads().map((l) => (l.id === id ? { ...l, ...patch } : l)));
}

export async function deleteLead(id) {
  if (REMOTE) {
    const { error } = await supabase.from('leads').delete().eq('id', id);
    if (error) throw error;
    return;
  }
  localLeadsPersist(localLeads().filter((l) => l.id !== id));
}

export function subscribeLeads(cb) {
  if (REMOTE) {
    const ch = supabase
      .channel('tbf-leads')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, cb)
      .subscribe();
    return () => supabase.removeChannel(ch);
  }
  const h = () => cb();
  window.addEventListener('tbf:leads', h);
  window.addEventListener('storage', (e) => { if (e.key === LKEY_LEADS) cb(); });
  return () => window.removeEventListener('tbf:leads', h);
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

/* ----------------- portofoliu (clipuri IG/TikTok) ----------------- */
const LKEY_PF = 'tbf_portfolio_v1';
function localPf() {
  if (typeof localStorage === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(LKEY_PF) || '[]'); } catch { return []; }
}
function localPfPersist(list) {
  localStorage.setItem(LKEY_PF, JSON.stringify(list));
  window.dispatchEvent(new CustomEvent('tbf:portfolio'));
}

// PUBLIC: oricine poate citi clipurile.
export async function listPortfolio() {
  if (REMOTE) {
    const { data, error } = await supabase.from('portfolio').select('*').order('sort', { ascending: true }).order('created_at', { ascending: true });
    if (error) { console.error('listPortfolio', error); return []; }
    return data;
  }
  return localPf().sort((a, b) => (a.sort - b.sort) || String(a.created_at).localeCompare(b.created_at));
}

// ADMIN: adaugă / editează / șterge (necesită autentificare în REMOTE).
export async function addPortfolio(item) {
  if (REMOTE) {
    const { error } = await supabase.from('portfolio').insert({ url: item.url, caption: item.caption || null, sort: item.sort || 0 });
    if (error) throw error;
    return;
  }
  const list = localPf();
  list.push({ id: 'p' + Date.now() + Math.random().toString(36).slice(2, 6), url: item.url, caption: item.caption || '', sort: item.sort || 0, created_at: new Date().toISOString() });
  localPfPersist(list);
}

export async function updatePortfolio(id, patch) {
  if (REMOTE) {
    const { error } = await supabase.from('portfolio').update(patch).eq('id', id);
    if (error) throw error;
    return;
  }
  localPfPersist(localPf().map((p) => (p.id === id ? { ...p, ...patch } : p)));
}

export async function deletePortfolio(id) {
  if (REMOTE) {
    const { error } = await supabase.from('portfolio').delete().eq('id', id);
    if (error) throw error;
    return;
  }
  localPfPersist(localPf().filter((p) => p.id !== id));
}

export function subscribePortfolio(cb) {
  if (REMOTE) {
    const ch = supabase.channel('tbf-portfolio').on('postgres_changes', { event: '*', schema: 'public', table: 'portfolio' }, cb).subscribe();
    return () => supabase.removeChannel(ch);
  }
  const h = () => cb();
  window.addEventListener('tbf:portfolio', h);
  window.addEventListener('storage', (e) => { if (e.key === LKEY_PF) cb(); });
  return () => window.removeEventListener('tbf:portfolio', h);
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
