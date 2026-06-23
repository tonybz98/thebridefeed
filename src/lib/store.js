// the bride feed — booking/availability store
// DEFAULT: localStorage (single device/browser). The admin page and the public
// availability page share this on the same origin, so changes in the admin tab
// show up on the public page (live, via events below) — but only in the SAME browser.
//
// For real cross-visitor live sync (every visitor sees the dates you blocked),
// swap the 4 functions below to a backend. See README → "Sincronizare reală".

const KEY = 'tbf_bookings_v1';

const uid = () =>
  (typeof crypto !== 'undefined' && crypto.randomUUID)
    ? crypto.randomUUID()
    : 'id-' + Date.now() + '-' + Math.random().toString(16).slice(2);

export function getBookings() {
  if (typeof localStorage === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]');
  } catch {
    return [];
  }
}

function persist(list) {
  localStorage.setItem(KEY, JSON.stringify(list));
  // storage event only fires in OTHER tabs; dispatch a custom one for THIS tab
  window.dispatchEvent(new CustomEvent('tbf:bookings'));
}

export function addBooking(b) {
  const list = getBookings();
  const rec = { id: b.id || uid(), date: b.date, couple: b.couple || '', location: b.location || '', pkg: b.pkg || '', notes: b.notes || '' };
  const i = list.findIndex((x) => (b.id && x.id === b.id) || (!b.id && x.date === b.date));
  if (i >= 0) list[i] = { ...list[i], ...rec, id: list[i].id }; else list.push(rec);
  persist(list);
  return rec;
}

export function removeBooking(id) {
  persist(getBookings().filter((b) => b.id !== id));
}

export function bookingForDate(dateStr, list) {
  return (list || getBookings()).find((b) => b.date === dateStr);
}

// fires cb() whenever bookings change (this tab via custom event, other tabs via storage)
export function onBookingsChange(cb) {
  window.addEventListener('tbf:bookings', cb);
  window.addEventListener('storage', (e) => { if (e.key === KEY) cb(); });
}
