// Los 5 lugares de victoria — navegación de diapositivas

const slides = [...document.querySelectorAll('.slide')];
const total = slides.length;
const $now = document.getElementById('count-now');
const $label = document.getElementById('where-label');
const $bar = document.getElementById('progress-bar');
const $prev = document.getElementById('prev');
const $next = document.getElementById('next');
const pad = n => String(n).padStart(2, '0');
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

document.getElementById('count-total').textContent = pad(total);

// escalonar las entradas dentro de cada diapositiva
slides.forEach(s => s.querySelectorAll('[data-anim]').forEach((el, i) => el.style.setProperty('--i', i)));

let current = -1;

function idFor(i) {
  return slides[i].id || String(i + 1);
}

function indexFromHash() {
  const h = decodeURIComponent(location.hash.slice(1));
  if (!h) return 0;
  const byId = slides.findIndex(s => s.id === h);
  if (byId >= 0) return byId;
  const n = parseInt(h, 10);
  return Number.isFinite(n) ? Math.min(Math.max(n - 1, 0), total - 1) : 0;
}

function go(i, { push = true } = {}) {
  i = Math.min(Math.max(i, 0), total - 1);
  if (i === current) return;
  const prev = slides[current];
  const next = slides[i];

  if (prev) {
    prev.classList.remove('active');
    prev.querySelectorAll('video').forEach(v => v.pause());
  }
  next.classList.add('active');
  next.scrollTop = 0;
  current = i;

  next.querySelectorAll('video').forEach(v => {
    if (v.preload === 'none') v.preload = 'auto';
    v.play().catch(() => {});
  });
  // precargar el video de la siguiente diapositiva
  slides[i + 1]?.querySelectorAll('video').forEach(v => { if (v.preload === 'none') v.preload = 'metadata'; });

  next.querySelectorAll('[data-count]').forEach(countUp);

  $now.textContent = pad(i + 1);
  $label.textContent = next.dataset.label || '';
  $bar.style.width = ((i + 1) / total * 100) + '%';
  const lugar = [...next.classList].find(c => c.startsWith('lugar-'));
  $bar.style.setProperty('--bar', lugar ? `var(--${['cobalt', 'tomato', 'acid', 'magenta', 'acid'][+lugar.slice(6) - 1]})` : 'var(--cobalt)');
  document.body.classList.toggle('dark-top', next.classList.contains('s-ink') || (next.classList.contains('s-color') && next.classList.contains('lugar-5')));
  $prev.disabled = i === 0;
  $next.disabled = i === total - 1;

  if (push) history.replaceState(null, '', '#' + idFor(i));
}

function countUp(el) {
  const to = parseFloat(el.dataset.count);
  const dec = parseInt(el.dataset.dec || '0', 10);
  const fmt = v => v.toLocaleString('es-CO', { minimumFractionDigits: dec, maximumFractionDigits: dec });
  if (reduced) { el.textContent = fmt(to); return; }
  const dur = 1400;
  const t0 = performance.now() + 250;
  cancelAnimationFrame(el._raf);
  el.textContent = fmt(0);
  const tick = t => {
    const p = Math.min(Math.max((t - t0) / dur, 0), 1);
    const e = 1 - Math.pow(1 - p, 4);
    el.textContent = fmt(to * e);
    if (p < 1) el._raf = requestAnimationFrame(tick);
  };
  el._raf = requestAnimationFrame(tick);
}

// teclado
document.addEventListener('keydown', e => {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  switch (e.key) {
    case 'ArrowRight': case 'ArrowDown': case 'PageDown': case ' ': case 'Enter':
      e.preventDefault(); go(current + 1); break;
    case 'ArrowLeft': case 'ArrowUp': case 'PageUp': case 'Backspace':
      e.preventDefault(); go(current - 1); break;
    case 'Home': go(0); break;
    case 'End': go(total - 1); break;
    case 'f': case 'F': toggleFull(); break;
    case 'm': case 'M': slides[current].querySelector('.sound')?.click(); break;
  }
});

$prev.addEventListener('click', () => go(current - 1));
$next.addEventListener('click', () => go(current + 1));

function toggleFull() {
  if (!document.fullscreenElement) document.documentElement.requestFullscreen?.().catch(() => {});
  else document.exitFullscreen?.();
}
document.getElementById('full').addEventListener('click', toggleFull);

// enlaces internos (índice de la brújula)
document.addEventListener('click', e => {
  const a = e.target.closest('a[href^="#"]');
  if (!a) return;
  e.preventDefault();
  const i = slides.findIndex(s => s.id === a.getAttribute('href').slice(1));
  if (i >= 0) go(i);
});

// sonido de los videos
document.querySelectorAll('.sound').forEach(btn => {
  btn.addEventListener('click', () => {
    const v = btn.parentElement.querySelector('video');
    v.muted = !v.muted;
    btn.classList.toggle('on', !v.muted);
    btn.textContent = v.muted ? 'sonido off' : 'sonido on';
    btn.setAttribute('aria-label', v.muted ? 'Activar sonido' : 'Silenciar');
  });
});

// gestos táctiles
let tx = null, ty = null;
addEventListener('touchstart', e => { tx = e.touches[0].clientX; ty = e.touches[0].clientY; }, { passive: true });
addEventListener('touchend', e => {
  if (tx === null) return;
  const dx = e.changedTouches[0].clientX - tx;
  const dy = e.changedTouches[0].clientY - ty;
  if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) go(current + (dx < 0 ? 1 : -1));
  tx = ty = null;
}, { passive: true });

addEventListener('hashchange', () => go(indexFromHash(), { push: false }));

go(indexFromHash(), { push: false });
