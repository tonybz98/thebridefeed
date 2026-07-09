// the bride feed — randează clipurile din portofoliu ca video-uri găzduite de noi,
// în carduri verticale curate (stil „reel"), cu play inline. Folosit pe /portofoliu și homepage.

function esc(s) {
  return String(s || '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}
function isVideo(url) {
  return /\.(mp4|webm|mov|m4v)(\?|$)/i.test(url) || /\/storage\/v1\/object\//.test(url);
}
const PLAY = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>';

export function renderEmbeds(container, items) {
  if (!container) return;
  if (!items || !items.length) {
    container.innerHTML = '<p class="pf-empty">Clipurile apar aici în curând.</p>';
    return;
  }
  container.innerHTML = items.map((it) => {
    const cap = it.caption ? '<span class="feed-cap">' + esc(it.caption) + '</span>' : '';
    if (isVideo(it.url)) {
      // #t=0.1 => pe iOS afișează cadrul de la 0.1s ca previzualizare (altfel e negru).
      const poster = it.poster ? ' poster="' + esc(it.poster) + '"' : '';
      return '<div class="pf-item"><div class="pf-video">'
        + '<video src="' + esc(it.url) + '#t=0.1"' + poster + ' playsinline preload="metadata" muted loop></video>'
        + '<button class="pf-play" type="button" aria-label="Redă clipul">' + PLAY + '</button>'
        + '</div>' + cap + '</div>';
    }
    // fallback: link simplu dacă nu e video
    return '<div class="pf-item"><a class="pf-link" href="' + esc(it.url) + '" target="_blank" rel="noopener">' + esc(it.caption || 'Vezi clipul') + ' ↗</a></div>';
  }).join('');

  container.querySelectorAll('.pf-video').forEach((box) => {
    const v = box.querySelector('video');
    if (!v) return;
    box.addEventListener('click', () => {
      // pune pe pauză celelalte clipuri
      container.querySelectorAll('.pf-video video').forEach((o) => { if (o !== v) { o.pause(); o.parentElement.classList.remove('playing'); } });
      if (v.paused) {
        v.muted = false;
        v.controls = true;
        box.classList.add('playing');
        v.play();
      } else {
        v.pause();
      }
    });
  });
}
