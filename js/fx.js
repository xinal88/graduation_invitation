// Hiệu ứng cuộn & chữ 3D: GSAP + ScrollTrigger + SplitText + Lenis (nạp từ CDN trong index.html).
// Thiếu thư viện hoặc người dùng bật "giảm chuyển động" → trang vẫn chạy với hiệu ứng cơ bản.
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

// ---------- Vòng chữ 3D (dùng cả khi không có GSAP) ----------
function buildRings() {
  return $$('.ring').map((ring) => {
    const chars = Array.from(ring.dataset.text.normalize('NFC'));
    const n = chars.length;
    ring.replaceChildren(...chars.map((ch) => Object.assign(document.createElement('span'), { textContent: ch })));
    const spans = [...ring.children];
    const layout = () => {
      const R = Math.min(innerWidth * 0.42, 560);
      ring.style.fontSize = `${(2 * Math.PI * R) / n / 0.6}px`;
      spans.forEach((s, i) => { s.style.transform = `translate(-50%, -50%) rotateY(${(i * 360) / n}deg) translateZ(${R}px)`; });
    };
    layout();
    addEventListener('resize', layout);
    const set = (deg) => {
      ring.style.transform = `rotateX(var(--tilt)) rotateY(${deg}deg)`;
      spans.forEach((s, i) => {
        const c = (Math.cos((((i * 360) / n + deg) * Math.PI) / 180) + 1) / 2;
        s.style.opacity = (0.08 + 0.92 * c * c).toFixed(3);
      });
    };
    set(0);
    return set;
  });
}

export function initFx() {
  const { gsap, ScrollTrigger, SplitText, Lenis } = window;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const rings = buildRings();

  if (!gsap || !ScrollTrigger || !SplitText || reduced) {
    // Bản rút gọn: vòng chữ tự xoay chậm
    if (!reduced) {
      let a = 0;
      const spin = () => { a -= 0.12; rings.forEach((set, i) => set(i ? -a * 0.8 : a)); requestAnimationFrame(spin); };
      requestAnimationFrame(spin);
    }
    return { intro() {} };
  }

  gsap.registerPlugin(ScrollTrigger, SplitText);
  ScrollTrigger.config({ ignoreMobileResize: true });
  document.documentElement.classList.add('fx');
  const fine = matchMedia('(pointer: fine)').matches;
  const split = (el, type) => new SplitText(el, { type, charsClass: 'ch', wordsClass: 'w' });
  const fitStart = (el) => () => (el.offsetHeight > innerHeight ? 'bottom bottom' : 'top top');

  // Các phần tử do GSAP điều khiển thì bỏ hiệu ứng .reveal mặc định
  $$('.hero .reveal, .section__head.reveal, [data-fx]').forEach((el) => el.classList.remove('reveal'));

  // ---------- Cuộn mượt ----------
  let lenis = null;
  if (Lenis) {
    lenis = new Lenis({ lerp: 0.09, anchors: true, prevent: (node) => node.id === 'map' || !!node.closest?.('#map') });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    lenis.stop();
  }

  // ---------- Hero: chữ lật 3D khi mở thiệp ----------
  const heroChars = $$('.hero__line').flatMap((l) => split(l, 'chars').chars);
  gsap.set(heroChars, { rotateX: -100, yPercent: 55, opacity: 0, transformOrigin: '50% 50% -0.35em' });
  const heroRest = ['.hero__meta', '.hero__text > *', '.badge', '.scroll-cue'];
  gsap.set(heroRest, { opacity: 0, y: 30 });
  gsap.set('.hero__portrait', { clipPath: 'inset(100% 0% 0% 0%)' });

  function intro() {
    lenis?.start();
    gsap.timeline({ delay: 0.5, onComplete: () => ScrollTrigger.refresh() })
      .to(heroChars, { rotateX: 0, yPercent: 0, opacity: 1, duration: 1.5, ease: 'expo.out', stagger: 0.045 })
      .to('.hero__meta', { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }, 0.1)
      .to('.hero__portrait', { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.4, ease: 'expo.inOut' }, 0.35)
      .from('.hero__portrait > *', { scale: 1.3, duration: 1.8, ease: 'expo.out' }, 0.5)
      .to('.hero__text > *', { opacity: 1, y: 0, stagger: 0.08, duration: 0.9, ease: 'power3.out' }, 0.8)
      .to('.badge', { opacity: 1, y: 0, duration: 1, ease: 'back.out(1.6)' }, 1)
      .to('.scroll-cue', { opacity: 1, y: 0, duration: 0.8 }, 1.2);
    ScrollTrigger.refresh();
  }

  // ---------- Hero đứng yên, các lớp sau trượt đè lên ----------
  const hero = $('.hero'), kinetic = $('#kinetic');
  ScrollTrigger.create({ trigger: hero, start: fitStart(hero), endTrigger: kinetic, end: 'top top', pin: true, pinSpacing: false });
  gsap.timeline({ scrollTrigger: { trigger: '.marquee', start: 'top bottom', endTrigger: kinetic, end: 'top top', scrub: true } })
    .to('.hero__title', { rotateX: 42, z: -280, yPercent: -25, opacity: 0.2, transformPerspective: 900, ease: 'none' }, 0)
    .to('.hero__body', { yPercent: -20, scale: 0.94, opacity: 0, ease: 'none' }, 0)
    .to('.badge', { rotate: 220, scale: 1.4, ease: 'none' }, 0)
    .to('.hero .slide__shade', { opacity: 0.6, ease: 'none' }, 0);

  // ---------- Marquee nghiêng theo tốc độ cuộn ----------
  const skewTo = gsap.quickTo('.marquee', 'skewY', { duration: 0.5, ease: 'power3' });
  const settle = gsap.delayedCall(0.15, () => skewTo(0)).pause();
  ScrollTrigger.create({
    onUpdate: (self) => { skewTo(gsap.utils.clamp(-5, 5, self.getVelocity() / -400)); settle.restart(true); },
  });

  // ---------- Vòng chữ 3D xoay theo cuộn + ngày lễ lật từng số ----------
  const ringState = { scroll: 0, idle: 0 };
  let kineticOn = false;
  const drawRings = () => rings.forEach((set, i) => {
    const a = ringState.scroll + ringState.idle;
    set(i ? -a * 0.8 : a);
  });
  gsap.ticker.add(() => { if (kineticOn) { ringState.idle -= 0.1; drawRings(); } });
  const dateChars = split('#kinetic-date', 'chars').chars;
  gsap.set('.kinetic__center', { xPercent: -50, yPercent: -50, x: 0, y: 0 });
  gsap.timeline({
    scrollTrigger: {
      trigger: kinetic, start: 'top top', end: '+=170%', pin: true, scrub: 1,
    },
  })
    .to(ringState, { scroll: -600, duration: 1, ease: 'none' }, 0)
    .from(dateChars, { rotateY: -110, z: -400, opacity: 0, transformOrigin: '50% 50% -80px', stagger: 0.05, duration: 0.35, ease: 'power3.out' }, 0.05)
    .from('.kinetic__center .eyebrow, #kinetic-meta', { opacity: 0, y: 30, stagger: 0.1, duration: 0.2 }, 0.3)
    .to('.kinetic__stage', { scale: 1.12, duration: 0.3, ease: 'none' }, 0.7)
    .to('.ring', { opacity: 0.3, duration: 0.3, ease: 'none' }, 0.7);
  ScrollTrigger.create({ trigger: kinetic, start: 'top bottom', end: 'bottom top', onToggle: (s) => { kineticOn = s.isActive; } });

  // ---------- Slide xếp chồng: lớp trước lùi xuống, tối dần ----------
  const slides = ['#message', '#info'].map((s) => $(s));
  slides.forEach((s) => {
    const next = s.nextElementSibling;
    ScrollTrigger.create({ trigger: s, start: fitStart(s), endTrigger: next, end: 'top top', pin: true, pinSpacing: false });
    gsap.timeline({ scrollTrigger: { trigger: next, start: 'top bottom', end: 'top top', scrub: true } })
      .to(s.querySelector('.slide__inner'), { scale: 0.9, rotateX: 6, transformPerspective: 1200, borderRadius: 48, ease: 'none' }, 0)
      .to(s.querySelector('.slide__shade'), { opacity: 0.55, ease: 'none' }, 0);
  });

  // ---------- Tiêu đề section: chữ lật 3D + gạch chân chạy ----------
  $$('.section__title').forEach((t) => {
    const head = t.closest('.section__head');
    const st = { trigger: head, start: 'top 82%', toggleActions: 'play none none reverse' };
    gsap.set(t, { perspective: 700 });
    gsap.timeline({ scrollTrigger: st })
      .from(split(t, 'chars').chars, { rotateX: -100, yPercent: 60, opacity: 0, transformOrigin: '50% 100%', stagger: 0.045, duration: 1.1, ease: 'expo.out' }, 0)
      .from(head.querySelectorAll('.section__no, .section__sub'), { opacity: 0, y: 16, stagger: 0.1, duration: 0.8 }, 0.15)
      .fromTo(head, { '--line': 0 }, { '--line': 1, duration: 1.4, ease: 'expo.inOut' }, 0);
  });

  // ---------- Lời nhắn: chữ sáng dần theo cuộn ----------
  gsap.fromTo(split('#message-text', 'words').words, { opacity: 0.12 }, {
    opacity: 1, stagger: 0.1, ease: 'none',
    scrollTrigger: { trigger: '#message-text', start: 'top 85%', end: 'bottom 50%', scrub: true },
  });

  // ---------- Polaroid ảnh khách: xoay theo cuộn + nghiêng theo chuột ----------
  const pol = $('#guest-photo');
  if (pol && !pol.hidden) {
    gsap.fromTo(pol, { rotate: -16, yPercent: 20 }, { rotate: 5, yPercent: -10, ease: 'none', scrollTrigger: { trigger: pol, start: 'top bottom', end: 'bottom top', scrub: true } });
    gsap.from('.polaroid__img img', { scale: 1.5, ease: 'none', scrollTrigger: { trigger: pol, start: 'top bottom', end: 'center center', scrub: true } });
    if (fine) {
      const card = $('.polaroid__card');
      const rx = gsap.quickTo(card, 'rotateX', { duration: 0.6, ease: 'power3' });
      const ry = gsap.quickTo(card, 'rotateY', { duration: 0.6, ease: 'power3' });
      pol.addEventListener('pointermove', (e) => {
        const r = pol.getBoundingClientRect();
        ry(((e.clientX - r.left) / r.width - 0.5) * 24);
        rx(-((e.clientY - r.top) / r.height - 0.5) * 24);
      });
      pol.addEventListener('pointerleave', () => { rx(0); ry(0); });
    }
  }

  // ---------- Số liệu lớn: lật như bảng ga tàu ----------
  $$('.info__big').forEach((el) => {
    gsap.set(el, { perspective: 600 });
    gsap.from(split(el, 'chars').chars, {
      rotateX: 90, opacity: 0, transformOrigin: '50% 50% -0.3em', stagger: 0.04, duration: 0.9, ease: 'back.out(1.8)',
      scrollTrigger: { trigger: el, start: 'top 88%', toggleActions: 'play none none reverse' },
    });
  });

  // Đếm ngược: mỗi lần số đổi thì lật
  $$('[data-cd]').forEach((el) => {
    gsap.set(el.parentElement, { perspective: 400 });
    let last = el.textContent;
    new MutationObserver(() => {
      if (el.textContent === last) return;
      last = el.textContent;
      gsap.fromTo(el, { rotateX: -90, opacity: 0.2 }, { rotateX: 0, opacity: 1, duration: 0.5, ease: 'back.out(2)', overwrite: true });
    }).observe(el, { childList: true, characterData: true, subtree: true });
  });

  // ---------- Bản đồ mở rộng dần khi cuộn tới ----------
  gsap.fromTo('#map', { clipPath: 'inset(14% 10% 14% 10% round 64px)' }, {
    clipPath: 'inset(0% 0% 0% 0% round 24px)', ease: 'none',
    scrollTrigger: { trigger: '#map', start: 'top 95%', end: 'top 30%', scrub: true },
  });

  // ---------- Ảnh kỷ niệm: bay vào 3D ----------
  const imgs = $$('.gallery__grid img');
  imgs.forEach((i) => i.classList.remove('reveal'));
  if (imgs.length) {
    ScrollTrigger.batch(imgs, {
      start: 'top 90%',
      onEnter: (batch) => gsap.from(batch, { rotateY: -35, rotateX: 12, y: 80, opacity: 0, transformPerspective: 900, stagger: 0.12, duration: 1.2, ease: 'expo.out' }),
    });
  }

  // ---------- RSVP: từng từ lật lên ----------
  gsap.set('#rsvp-q', { perspective: 800 });
  gsap.from(split('#rsvp-q', 'words').words, {
    rotateX: -90, yPercent: 40, opacity: 0, transformOrigin: '50% 100%', stagger: 0.07, duration: 1, ease: 'expo.out',
    scrollTrigger: { trigger: '#rsvp-q', start: 'top 85%', toggleActions: 'play none none reverse' },
  });

  // ---------- Footer: "Thank you" nhảy sóng ----------
  gsap.from(split('.footer__thanks', 'chars').chars, {
    yPercent: 120, rotate: 14, opacity: 0, stagger: 0.05, duration: 1.3, ease: 'expo.out',
    scrollTrigger: { trigger: '.footer', start: 'top 80%', toggleActions: 'play none none reverse' },
  });

  // ---------- Thanh tiến trình ----------
  gsap.to('.progress i', { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: 0.3 } });

  // ---------- Con trỏ tuỳ biến (máy tính) ----------
  if (fine) {
    const cur = Object.assign(document.createElement('div'), { className: 'cursor' });
    document.body.append(cur);
    const xTo = gsap.quickTo(cur, 'x', { duration: 0.35, ease: 'power3' });
    const yTo = gsap.quickTo(cur, 'y', { duration: 0.35, ease: 'power3' });
    addEventListener('pointermove', (e) => { xTo(e.clientX); yTo(e.clientY); });
    document.addEventListener('pointerover', (e) => cur.classList.toggle('is-hover', !!e.target.closest('a, button, [role="tab"]')));
  }

  document.fonts?.ready.then(() => ScrollTrigger.refresh());
  addEventListener('load', () => ScrollTrigger.refresh());

  return { intro, refresh: () => ScrollTrigger.refresh() };
}
