(() => {
  const root = document.documentElement;
  root.classList.add('js');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  // Buttondown: the username is defined once, on <html data-buttondown>.
  // Each form keeps a literal default action so it still posts without JS.
  const buttondownUser = (root.dataset.buttondown || '').trim();
  if (buttondownUser) {
    const endpoint = `https://buttondown.com/api/emails/embed-subscribe/${encodeURIComponent(buttondownUser)}`;
    document.querySelectorAll('form[data-buttondown-form]').forEach((form) => {
      form.action = endpoint;
      form.addEventListener('submit', () => {
        // Buttondown's standard embed pattern: open the named window the form targets.
        window.open(`https://buttondown.com/${encodeURIComponent(buttondownUser)}`, 'popupwindow');
      });
    });
  }

  // Hero playback and mute controls (brag pattern)
  const heroVid = document.getElementById('hero-vid');
  const heroPlayback = document.getElementById('hero-playback');
  const heroMute = document.getElementById('hero-mute');
  if (heroVid && heroPlayback && heroMute) {
    const heroMuteLabel = heroMute.querySelector('.ctl-label');

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
      if (heroMuteLabel) heroMuteLabel.textContent = heroVid.muted ? 'tap for sound' : 'sound on';
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
    syncMuteControl();
    applyMotionPreference();
    reducedMotion.addEventListener('change', applyMotionPreference);
  }

  // Scroll reveals: once per element, staggered among siblings.
  // Skipped entirely under reduced motion (CSS also only hides them when motion is allowed).
  const revealables = Array.from(document.querySelectorAll('[data-reveal]'));
  const showAll = () => revealables.forEach((el) => el.classList.add('is-in'));

  if (reducedMotion.matches || !('IntersectionObserver' in window)) {
    showAll();
    return;
  }

  revealables.forEach((el) => {
    const siblings = el.parentElement ? Array.from(el.parentElement.children).filter((c) => c.hasAttribute('data-reveal')) : [];
    const index = Math.max(0, siblings.indexOf(el));
    el.style.setProperty('--reveal-delay', `${index * 120}ms`);
  });

  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-in');
      io.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

  revealables.forEach((el) => io.observe(el));
  reducedMotion.addEventListener('change', () => { if (reducedMotion.matches) showAll(); });
})();
