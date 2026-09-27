(() => {
  'use strict';

  const root = document.documentElement;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  // Buttondown: the username is defined once, on <html data-buttondown>.
  // Every form carries a literal default action, so it posts as plain HTML without JS.
  // The placeholder value is ignored until the real username is set (see README.md).
  const BUTTONDOWN_BASE = 'https://buttondown.com/api/emails/embed-subscribe/';
  const buttondownUser = (root.dataset.buttondown || '').trim();
  if (buttondownUser && buttondownUser !== 'BUTTONDOWN_USERNAME') {
    const safeUser = encodeURIComponent(buttondownUser);
    document.querySelectorAll('form[data-buttondown]').forEach((form) => {
      form.setAttribute('action', BUTTONDOWN_BASE + safeUser);
      form.addEventListener('submit', () => {
        // Buttondown's embed pattern: open the named window the form targets.
        window.open(`https://buttondown.com/${safeUser}`, 'popupwindow');
      });
    });
  }

  // Hero playback and mute controls (brag pattern).
  const heroVid = document.getElementById('hero-vid');
  const heroPlayback = document.getElementById('hero-playback');
  const heroMute = document.getElementById('hero-mute');
  if (heroVid && heroPlayback && heroMute) {
    const heroMuteLabel = heroMute.querySelector('.film-mute-label');

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
        // Show the poster frame; playback starts only on a user click.
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
    syncMuteControl();
    applyMotionPreference();
    reducedMotion.addEventListener('change', applyMotionPreference);
  }

  // ECG spine: scroll progress. CSS scroll-driven animation handles it where supported;
  // otherwise this sets --p (0..1) on <html>. Static (fully drawn) under reduced motion via CSS.
  const supportsScrollTimeline = window.CSS && CSS.supports && CSS.supports('animation-timeline: scroll()');
  if (!supportsScrollTimeline) {
    let ticking = false;
    const writeProgress = () => {
      ticking = false;
      const max = root.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      root.style.setProperty('--p', p.toFixed(4));
    };
    const requestProgress = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(writeProgress);
    };
    window.addEventListener('scroll', requestProgress, { passive: true });
    window.addEventListener('resize', requestProgress);
    writeProgress();
  }

  // Reveal-on-scroll, only when motion is allowed. Without JS or with reduced motion, content is simply visible.
  const reveals = Array.from(document.querySelectorAll('.reveal'));
  const showAll = () => reveals.forEach((el) => el.classList.add('is-in'));
  if (!reducedMotion.matches && reveals.length && 'IntersectionObserver' in window) {
    root.classList.add('motion-ok');
    reveals.forEach((el) => {
      const siblings = Array.from(el.parentElement ? el.parentElement.children : []);
      el.style.setProperty('--i', String(Math.max(0, siblings.indexOf(el))));
    });
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    reveals.forEach((el) => revealObserver.observe(el));
  }
  // If the preference flips to reduce mid-session, never leave anything hidden.
  reducedMotion.addEventListener('change', () => {
    if (reducedMotion.matches) {
      showAll();
      root.classList.remove('motion-ok');
    }
  });
})();
