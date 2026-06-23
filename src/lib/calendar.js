// the bride feed — minimal month calendar (no dependencies)
const RO_MONTHS = ['ianuarie','februarie','martie','aprilie','mai','iunie','iulie','august','septembrie','octombrie','noiembrie','decembrie'];
const RO_DOW = ['L','Ma','Mi','J','V','S','D']; // Monday-first

export function fmtDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function prettyDate(ds) {
  const [y, m, d] = ds.split('-').map(Number);
  return `${d} ${RO_MONTHS[m - 1]} ${y}`;
}

export function createCalendar(root, opts) {
  const o = Object.assign({ mode: 'public', onDay: () => {}, dayState: () => ({}) }, opts);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const minMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  let view = new Date(today.getFullYear(), today.getMonth(), 1);
  if (o.mode === 'admin') root.classList.add('cal--admin');

  function render() {
    const year = view.getFullYear(), month = view.getMonth();
    const startDow = (new Date(year, month, 1).getDay() + 6) % 7; // Mon=0
    const days = new Date(year, month + 1, 0).getDate();
    const atMin = year === minMonth.getFullYear() && month === minMonth.getMonth();

    let cells = '';
    for (let i = 0; i < startDow; i++) cells += '<span class="cal-day cal-empty"></span>';
    for (let d = 1; d <= days; d++) {
      const date = new Date(year, month, d);
      const ds = fmtDate(date);
      const past = date < today;
      const st = o.dayState(ds, date) || {};
      const disabled = o.mode === 'public' && (past || st.booked);
      const cls = ['cal-day'];
      if (past) cls.push('is-past');
      if (st.booked) cls.push('is-booked');
      else if (!past) cls.push('is-free');
      const aria = st.booked ? `${d}, rezervat` : past ? `${d}, trecut` : `${d}, liber`;
      cells += `<button type="button" class="${cls.join(' ')}" data-date="${ds}" ${disabled ? 'disabled' : ''} aria-label="${aria}">${d}</button>`;
    }

    root.innerHTML =
      `<div class="cal-head">
        <button type="button" class="cal-nav" data-nav="-1" aria-label="Luna anterioară" ${o.mode === 'public' && atMin ? 'disabled' : ''}>&#8249;</button>
        <strong class="cal-title">${RO_MONTHS[month]} ${year}</strong>
        <button type="button" class="cal-nav" data-nav="1" aria-label="Luna următoare">&#8250;</button>
      </div>
      <div class="cal-grid cal-dow">${RO_DOW.map((x) => `<span>${x}</span>`).join('')}</div>
      <div class="cal-grid cal-days">${cells}</div>`;

    root.querySelectorAll('[data-nav]').forEach((b) =>
      b.addEventListener('click', () => {
        const next = new Date(view.getFullYear(), view.getMonth() + Number(b.dataset.nav), 1);
        if (o.mode === 'public' && next < minMonth) return;
        view = next; render();
      })
    );
    root.querySelectorAll('.cal-day[data-date]').forEach((b) =>
      b.addEventListener('click', () => { if (!b.disabled) o.onDay(b.dataset.date, b); })
    );
  }

  render();
  return { refresh: render };
}
