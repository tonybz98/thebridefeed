// the bride feed — randează clipurile din portofoliu ca video-uri găzduite de noi,
// în carduri verticale curate. Folosit pe /portofoliu și homepage.
//
// Redare sigură pe mobil (iOS): controale native (play/pause garantat) + preload="none"
// (nu suprasolicită iOS când sunt multe clipuri pe pagină). Coperta = atributul poster.

function esc(s) {
  return String(s || '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}
function isVideo(url) {
  return /\.(mp4|webm|mov|m4v)(\?|$)/i.test(url) || /\/storage\/v1\/object\//.test(url);
}

export function renderEmbeds(container, items) {
  if (!container) return;
  if (!items || !items.length) {
    container.innerHTML = '<p class="pf-empty">Clipurile apar aici în curând.</p>';
    return;
  }
  container.innerHTML = items.map((it) => {
    const cap = it.caption ? '<span class="feed-cap">' + esc(it.caption) + '</span>' : '';
    if (isVideo(it.url)) {
      const poster = it.poster ? ' poster="' + esc(it.poster) + '"' : '';
      return '<div class="pf-item"><video class="pf-video" src="' + esc(it.url) + '"' + poster + ' controls controlsList="nodownload" playsinline preload="none"></video>' + cap + '</div>';
    }
    // fallback: link simplu dacă nu e video
    return '<div class="pf-item"><a class="pf-link" href="' + esc(it.url) + '" target="_blank" rel="noopener">' + esc(it.caption || 'Vezi clipul') + ' ↗</a></div>';
  }).join('');

  // când pornește un clip, pune pe pauză celelalte
  const vids = container.querySelectorAll('video.pf-video');
  vids.forEach((v) => {
    v.addEventListener('play', () => { vids.forEach((o) => { if (o !== v) o.pause(); }); });
  });
}
