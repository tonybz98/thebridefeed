// the bride feed — randează embed-uri Instagram / TikTok pornind de la un URL.
// Folosit pe /portofoliu și în secțiunea „din feed" de pe homepage.

function esc(s) {
  return String(s || '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}
function platform(url) {
  if (/instagram\.com/i.test(url)) return 'instagram';
  if (/tiktok\.com/i.test(url)) return 'tiktok';
  return 'other';
}
function tiktokId(url) {
  const m = String(url).match(/\/video\/(\d+)/);
  return m ? m[1] : '';
}
function loadOnce(key, src, onload) {
  if (document.querySelector('script[data-tbf-embed="' + key + '"]')) { if (onload) onload(); return; }
  const s = document.createElement('script');
  s.src = src; s.async = true; s.setAttribute('data-tbf-embed', key);
  if (onload) s.onload = onload;
  document.body.appendChild(s);
}
function processInstagram() {
  if (window.instgrm && window.instgrm.Embeds) { window.instgrm.Embeds.process(); return; }
  loadOnce('ig', 'https://www.instagram.com/embed.js', () => window.instgrm && window.instgrm.Embeds.process());
}
function processTikTok() {
  // Reîncărcăm scriptul ca să proceseze blockquote-urile nou adăugate.
  const prev = document.querySelector('script[data-tbf-embed="tt"]');
  if (prev) prev.remove();
  const s = document.createElement('script');
  s.src = 'https://www.tiktok.com/embed.js'; s.async = true; s.setAttribute('data-tbf-embed', 'tt');
  document.body.appendChild(s);
}

export function renderEmbeds(container, items) {
  if (!container) return;
  if (!items || !items.length) {
    container.innerHTML = '<p class="pf-empty">Clipurile apar aici în curând.</p>';
    return;
  }
  let ig = false, tt = false;
  container.innerHTML = items.map((it) => {
    const p = platform(it.url);
    const cap = it.caption ? '<span class="feed-cap">' + esc(it.caption) + '</span>' : '';
    if (p === 'instagram') {
      ig = true;
      return '<div class="pf-item"><blockquote class="instagram-media" data-instgrm-permalink="' + esc(it.url) + '" data-instgrm-version="14" style="margin:0;min-width:0;width:100%;"></blockquote>' + cap + '</div>';
    }
    if (p === 'tiktok') {
      tt = true;
      return '<div class="pf-item"><blockquote class="tiktok-embed" cite="' + esc(it.url) + '" data-video-id="' + tiktokId(it.url) + '" style="margin:0;max-width:100%;min-width:0;"><section></section></blockquote>' + cap + '</div>';
    }
    return '<div class="pf-item"><a class="pf-link" href="' + esc(it.url) + '" target="_blank" rel="noopener">' + esc(it.caption || 'Vezi clipul') + ' ↗</a></div>';
  }).join('');
  if (ig) processInstagram();
  if (tt) processTikTok();
}
