(() => {
  const root = document.documentElement;
  root.classList.add('js');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  // ---- Buttondown: the username is defined once, on <html data-buttondown>.
  // Every form keeps a literal default action so it still posts without JS.
  const bdUser = (root.dataset.buttondown || '').trim();
  const forms = document.querySelectorAll('form.join-form');
  forms.forEach((form) => {
    if (bdUser) {
      form.action = `https://buttondown.com/api/emails/embed-subscribe/${encodeURIComponent(bdUser)}`;
    }
    form.addEventListener('submit', () => {
      if (bdUser) window.open(`https://buttondown.com/${encodeURIComponent(bdUser)}`, 'popupwindow');
    });
  });

  // ---- Hero film: play/pause + mute, ported from brag's docs/main.js.
  const heroVid = document.getElementById('hero-vid');
  const heroPlayback = document.getElementById('hero-playback');
  const heroMute = document.getElementById('hero-mute');
  if (heroVid && heroPlayback && heroMute) {
    const heroMuteLabel = heroMute.querySelector('.hero-mute-label');

    const syncPlaybackControl = () => {
      const mode = heroVid.paused ? 'play' : 'pause';
      const label = `${mode} launch film`;
      heroPlayback.dataset.mode = mode;
      heroPlayback.setAttribute('aria-label', label);
      heroPlayback.setAttribute('title', label);
    };

    const syncMuteControl = () => {
      heroMute.setAttribute('aria-pressed', heroVid.muted ? 'true' : 'false');
      heroMute.setAttribute('aria-label', heroVid.muted ? 'unmute launch film' : 'mute launch film');
      if (heroMuteLabel) heroMuteLabel.textContent = 'tap for sound';
    };

    const applyMotionPreference = () => {
      if (reducedMotion.matches) {
        heroVid.pause();
        heroVid.load();
        syncPlaybackControl();
        return;
      }
      heroVid.muted = true;
      syncMuteControl();
      const playback = heroVid.play();
      if (playback && playback.catch) playback.catch(syncPlaybackControl);
    };

    heroPlayback.addEventListener('click', () => {
      if (heroVid.paused) {
        const playback = heroVid.play();
        if (playback && playback.catch) playback.catch(syncPlaybackControl);
        return;
      }
      heroVid.pause();
    });

    heroMute.addEventListener('click', () => {
      heroVid.muted = !heroVid.muted;
      syncMuteControl();
    });

    heroVid.addEventListener('play', syncPlaybackControl);
    heroVid.addEventListener('pause', syncPlaybackControl);
    applyMotionPreference();
    reducedMotion.addEventListener('change', applyMotionPreference);
  }

  // ---- The vine: redraw the stem through every depth node, with leaves.
  const frame = document.getElementById('descent');
  const vine = document.getElementById('vine');
  const bands = Array.from(document.querySelectorAll('.band'));

  const buildVine = () => {
    if (!frame || !vine) return;
    const svgBox = vine.getBoundingClientRect();
    const W = svgBox.width;
    const H = svgBox.height;
    if (!W || !H) return;
    const cx = W / 2;
    const amp = W * 0.24;
    const leaf = Math.max(7, W * 0.3);

    const nodes = Array.from(document.querySelectorAll('.gauge-node')).map((n) => {
      const r = n.getBoundingClientRect();
      return r.top + r.height / 2 - svgBox.top;
    });
    const end = (() => {
      const seed = document.querySelector('.seed');
      if (!seed) return H;
      const r = seed.getBoundingClientRect();
      return r.top + r.height / 2 - svgBox.top;
    })();
    const stops = [0, ...nodes, end].filter((y, i, a) => i === 0 || y > a[i - 1] + 4);

    let d = `M${cx.toFixed(1)} 0`;
    let side = 1;
    let waveCount = 0;
    for (let i = 0; i < stops.length - 1; i++) {
      const a = stops[i];
      const b = stops[i + 1];
      const waves = Math.max(1, Math.round((b - a) / 300));
      const step = (b - a) / waves;
      for (let w = 0; w < waves; w++) {
        const y0 = a + step * w;
        const y1 = y0 + step;
        d += ` C${(cx + side * amp).toFixed(1)} ${(y0 + step / 3).toFixed(1)} ${(cx - side * amp).toFixed(1)} ${(y0 + (2 * step) / 3).toFixed(1)} ${cx.toFixed(1)} ${y1.toFixed(1)}`;
        waveCount++;
        const isNode = w === waves - 1;
        // a leaf on alternate waves, never on a gauge node
        if (!isNode && waveCount % 2 === 0) {
          const dir = side;
          const tx = cx + dir * leaf;
          const ty = y1 - leaf * 0.9;
          d += ` C${(cx + dir * leaf * 0.1).toFixed(1)} ${(y1 - leaf * 0.7).toFixed(1)} ${(cx + dir * leaf * 0.6).toFixed(1)} ${(y1 - leaf * 1.1).toFixed(1)} ${tx.toFixed(1)} ${ty.toFixed(1)}`;
          d += ` C${(cx + dir * leaf * 0.9).toFixed(1)} ${(y1 - leaf * 0.3).toFixed(1)} ${(cx + dir * leaf * 0.35).toFixed(1)} ${y1.toFixed(1)} ${cx.toFixed(1)} ${y1.toFixed(1)}`;
        }
        side = -side;
      }
    }

    vine.setAttribute('viewBox', `0 0 ${W.toFixed(1)} ${H.toFixed(1)}`);
    vine.querySelectorAll('path').forEach((p) => p.setAttribute('d', d));

    // Keep the growing tip about 62% down the viewport through the whole descent.
    const docH = Math.max(document.documentElement.scrollHeight, 1);
    const vh = window.innerHeight;
    const offsetTop = svgBox.top + window.scrollY;
    const f0 = Math.min(1, Math.max(0, (vh * 0.62 - offsetTop) / H));
    const f1 = Math.min(1, Math.max(f0, (docH - vh * 0.38 - offsetTop) / H));
    vine.style.setProperty('--vine-f0', f0.toFixed(4));
    vine.style.setProperty('--vine-f1', f1.toFixed(4));
  };

  let vineRaf = 0;
  const scheduleVine = () => {
    cancelAnimationFrame(vineRaf);
    vineRaf = requestAnimationFrame(buildVine);
  };
  scheduleVine();
  window.addEventListener('load', scheduleVine);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(scheduleVine);
  if ('ResizeObserver' in window && frame) new ResizeObserver(scheduleVine).observe(frame);
  document.querySelectorAll('details').forEach((el) => el.addEventListener('toggle', scheduleVine));

  // ---- Live depth readout: interpolates between strata as you descend.
  const readout = document.getElementById('depth-value');
  const readoutName = document.getElementById('depth-name');
  const fmt = (mm) => `−${mm.toFixed(2)} mm`;
  const updateDepth = () => {
    if (!readout) return;
    const probe = window.scrollY + window.innerHeight * 0.4;
    const marks = bands.map((b) => ({
      top: b.getBoundingClientRect().top + window.scrollY,
      depth: parseFloat(b.dataset.depth),
      name: b.dataset.stratum || '',
    }));
    let i = 0;
    while (i < marks.length - 1 && probe >= marks[i + 1].top) i++;
    const cur = marks[i];
    const next = marks[i + 1];
    readoutName.textContent = cur.name;
    if (!Number.isFinite(cur.depth)) { readout.textContent = '−∞ mm'; return; }
    if (!next) { readout.textContent = fmt(cur.depth); return; }
    const t = Math.min(1, Math.max(0, (probe - cur.top) / Math.max(1, next.top - cur.top)));
    const target = Number.isFinite(next.depth) ? next.depth : cur.depth * 7.5;
    readout.textContent = fmt(cur.depth + (target - cur.depth) * t);
  };
  let depthRaf = 0;
  window.addEventListener('scroll', () => {
    cancelAnimationFrame(depthRaf);
    depthRaf = requestAnimationFrame(updateDepth);
  }, { passive: true });
  window.addEventListener('resize', updateDepth);
  updateDepth();

  // ---- Reveals: once per element, staggered among siblings. Sample has none.
  const reveals = Array.from(document.querySelectorAll('.reveal'));
  reveals.forEach((el) => {
    const sibs = Array.from(el.parentElement.children).filter((c) => c.classList.contains('reveal'));
    el.style.setProperty('--i', String(Math.max(0, sibs.indexOf(el))));
  });
  if (reducedMotion.matches || !('IntersectionObserver' in window)) {
    reveals.forEach((el) => el.classList.add('is-in'));
  } else {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    reveals.forEach((el) => io.observe(el));
  }
})();
