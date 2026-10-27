// ARO: menú, horario en vivo, formulario a WhatsApp y efectos:
// slider de capas con parallax (hero fijado: cada tramo de scroll cambia de diapositiva), titulares por líneas,
// portal de luz que descubre la nave, cinta que sigue al scroll, persianas metálicas, visor del taller con zoom,
// pasos con línea de progreso, flota que se abre a todo el ancho, engranaje del pie y aros 3D del contacto.
(function () {
  var reducido = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var tactil = matchMedia('(hover: none), (pointer: coarse)').matches;
  var g = window.gsap, ST = window.ScrollTrigger, lenis = null;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var dos = function (n) { return (n < 10 ? '0' : '') + n; };

  // ---------- menú ----------
  var bm = $('[data-menu]'), pm = $('[data-menu-panel]');
  function menu(abrir) { if (!bm) return; bm.setAttribute('aria-expanded', abrir ? 'true' : 'false'); bm.setAttribute('aria-label', abrir ? 'Cerrar menú' : 'Abrir menú'); pm.hidden = !abrir; document.body.style.overflow = abrir ? 'hidden' : ''; if (lenis) abrir ? lenis.stop() : lenis.start(); }
  if (bm) { bm.addEventListener('click', function () { menu(bm.getAttribute('aria-expanded') !== 'true'); }); $$('a', pm).forEach(function (a) { a.addEventListener('click', function () { menu(false); }); }); }
  addEventListener('keydown', function (e) { if (e.key === 'Escape' && pm && !pm.hidden) menu(false); });

  // ---------- abierto ahora (hora de Madrid) ----------
  var DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  function ahora() {
    var p = {}; new Intl.DateTimeFormat('en-US', { timeZone: 'Europe/Madrid', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date()).forEach(function (x) { p[x.type] = x.value; });
    return { d: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(p.weekday), m: (+p.hour % 24) * 60 + (+p.minute) };
  }
  var min = function (t) { var a = t.split(':'); return +a[0] * 60 + (+a[1]); };
  var hora = function (t) { return t.replace(/^0/, ''); };
  function estado(el) {
    var H = JSON.parse(el.dataset.horario), n = ahora(), hoy = H[n.d] || [], txt, abierto = false;
    for (var i = 0; i < hoy.length; i++) if (n.m >= min(hoy[i][0]) && n.m < min(hoy[i][1])) { abierto = true; txt = 'Abierto ahora · hasta las ' + hora(hoy[i][1]); }
    if (!abierto) {
      var luego = hoy.filter(function (t) { return min(t[0]) > n.m; })[0];
      if (luego) txt = 'Cerrado · abre hoy a las ' + hora(luego[0]);
      else for (var k = 1; k <= 7; k++) { var d = (n.d + k) % 7; if ((H[d] || []).length) { txt = 'Cerrado · abre ' + (k === 1 ? 'mañana' : 'el ' + DIAS[d]) + ' a las ' + hora(H[d][0][0]); break; } }
    }
    el.classList.toggle('es-abierto', abierto); el.querySelector('[data-estado-txt]').textContent = txt;
  }
  var estados = $$('[data-estado]');
  function pinta() {
    estados.forEach(estado);
    var n = ahora(), h = Math.floor(n.m / 60), laborable = n.d >= 1 && n.d <= 5;
    $$('.proc__barras i').forEach(function (b) { b.classList.toggle('es-ahora', laborable && +b.dataset.h === h && h !== 14); });
  }
  pinta(); setInterval(pinta, 60000);
  // alturas de las barras del día (fijas, como un gráfico de actividad)
  [72, 88, 95, 84, 70, 22, 80, 96, 90, 78, 58].forEach(function (v, i) { var b = $$('.proc__barras i')[i]; if (b) b.style.height = v + '%'; });

  // ---------- formulario → WhatsApp ----------
  $$('form[data-whatsapp]').forEach(function (f) {
    f.addEventListener('submit', function (ev) {
      ev.preventDefault(); var d = new FormData(f), l = ['Hola, os escribo desde la web.'];
      if (d.get('nombre')) l.push('Nombre / empresa: ' + d.get('nombre')); if (d.get('telefono')) l.push('Teléfono: ' + d.get('telefono'));
      l.push('Necesito: ' + d.get('tipo')); if (d.get('mensaje')) l.push(d.get('mensaje'));
      open('https://wa.me/' + f.dataset.whatsapp + '?text=' + encodeURIComponent(l.join('\n')), '_blank', 'noopener');
    });
  });

  // ---------- cabecera y barra móvil ----------
  var cab = $('[data-cab]'), barra = $('.barra-movil'), heroEl = $('[data-hero]');
  function alScroll() {
    var y = scrollY;
    if (cab) cab.classList.toggle('es-compacta', y > 40);
    if (barra) barra.classList.toggle('es-visible', y > (heroEl ? heroEl.offsetTop + heroEl.offsetHeight - innerHeight * .6 : 200));
  }
  addEventListener('scroll', alScroll, { passive: true }); alScroll();

  // ---------- persianas metálicas ----------
  var persianas = $$('[data-persiana]');
  if ('IntersectionObserver' in window && !reducido) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('es-abierta'); io.unobserve(e.target); } }); }, { threshold: .3 });
    persianas.forEach(function (p) { io.observe(p); });
  } else persianas.forEach(function (p) { p.classList.add('es-abierta'); });

  // ---------- visor del taller ----------
  var visor = $('[data-visor]');
  if (visor) (function () {
    var marco = $('[data-visor-marco]', visor), lienzo = $('[data-visor-lienzo]', visor), ficha = $('[data-visor-ficha]', visor);
    var puntos = $$('.visor__punto', visor), datos = puntos.map(function (p) { return { id: p.dataset.punto, x: parseFloat(p.style.left) / 100, y: parseFloat(p.style.top) / 100, t: p.getAttribute('aria-label') }; });
    var z = 1, px = 0, py = 0, activo = -1, tocado = false, gira = null;
    var aplica = function () { lienzo.style.setProperty('--z', z); lienzo.style.setProperty('--px', px + 'px'); lienzo.style.setProperty('--py', py + 'px'); marco.classList.toggle('es-zoom', z > 1.01); };
    function limita() {
      var lw = lienzo.offsetWidth * z, lh = lienzo.offsetHeight * z, mw = marco.clientWidth, mh = marco.clientHeight;
      var mx = Math.max(0, (lw - mw) / 2), my = Math.max(0, (lh - mh) / 2);
      px = Math.max(-mx, Math.min(mx, px)); py = Math.max(-my, Math.min(my, py));
    }
    function activa(i, acercar) {
      activo = i; var d = datos[i];
      puntos.forEach(function (p, k) { p.classList.toggle('es-activo', k === i); });
      $$('.visor__lista button', visor).forEach(function (b) { b.classList.toggle('es-activo', b.dataset.punto === d.id); });
      $$('.visor__zonas polygon', visor).forEach(function (pg) { pg.classList.toggle('es-activa', pg.dataset.zona === d.id); });
      $('[data-ficha-t]', ficha).textContent = d.t;
      $('[data-ficha-p]', ficha).textContent = puntos[i].dataset.txt;
      $('[data-ficha-n]', ficha).textContent = dos(i + 1) + ' / ' + dos(datos.length);
      if (acercar) { z = Math.max(z, marco.clientWidth < 700 ? 1.6 : 1.7); px = -(d.x - .5) * lienzo.offsetWidth * z; py = -(d.y - .5) * lienzo.offsetHeight * z; limita(); aplica(); }
    }
    function para() { tocado = true; if (gira) { clearInterval(gira); gira = null; } }
    visor.addEventListener('click', function (e) {
      var b = e.target.closest('[data-punto]'); if (b) { para(); activa(datos.findIndex(function (d) { return d.id === b.dataset.punto; }), true); return; }
      var zb = e.target.closest('[data-visor-zoom]'); if (zb) { para(); z = Math.max(1, Math.min(2.6, z + (+zb.dataset.visorZoom) * .45)); limita(); aplica(); return; }
      if (e.target.closest('[data-visor-reset]')) { para(); z = 1; px = 0; py = 0; aplica(); }
    });
    // arrastrar para moverse cuando hay zoom
    var arr = null;
    marco.addEventListener('pointerdown', function (e) { if (z <= 1.01 || e.target.closest('button')) return; arr = { x: e.clientX, y: e.clientY, px: px, py: py }; marco.classList.add('arrastrando'); marco.setPointerCapture(e.pointerId); para(); });
    marco.addEventListener('pointermove', function (e) { if (!arr) return; px = arr.px + e.clientX - arr.x; py = arr.py + e.clientY - arr.y; limita(); aplica(); });
    var suelta = function () { arr = null; marco.classList.remove('arrastrando'); };
    marco.addEventListener('pointerup', suelta); marco.addEventListener('pointercancel', suelta);
    addEventListener('resize', function () { limita(); aplica(); });
    // recorrido automático la primera vez que se ve (hasta que la persona toca algo)
    if ('IntersectionObserver' in window) {
      var vio = new IntersectionObserver(function (es) {
        if (!es[0].isIntersecting || tocado) return; vio.disconnect();
        setTimeout(function () { if (tocado) return; activa(0, !reducido); if (!reducido) gira = setInterval(function () { activa((activo + 1) % datos.length, true); }, 4200); }, 600);
      }, { threshold: .45 });
      vio.observe(marco);
    }
  })();

  // ---------- cómo trabajamos: pestañas y línea de pasos ----------
  var proc = $('[data-proc]');
  if (proc) (function () {
    var temp = null, visto = false;
    function reproduce(panel) {
      var pasos = $$('.proc__paso', panel), lin = $('.proc__linea', panel), chip = $('[data-chip]', panel), k = 0, n = pasos.length;
      clearInterval(temp); pasos.forEach(function (p) { p.classList.remove('es-hecho'); });
      var marca = function (i) { pasos.forEach(function (p, j) { p.classList.toggle('es-hecho', j <= i); }); lin.style.setProperty('--p', n > 1 ? i / (n - 1) : 1); chip.textContent = 'Paso ' + (i + 1) + ' de ' + n; };
      if (reducido) { marca(n - 1); return; }
      marca(0); temp = setInterval(function () { k++; if (k >= n) { clearInterval(temp); return; } marca(k); }, 700);
      pasos.forEach(function (p, j) { p.onclick = function () { clearInterval(temp); marca(j); }; });
    }
    var pest = $$('[data-pest]', proc);
    pest.forEach(function (b) {
      b.addEventListener('click', function () {
        pest.forEach(function (x) { x.setAttribute('aria-selected', x === b ? 'true' : 'false'); });
        $$('[data-pasos]', proc).forEach(function (p) { p.hidden = p.dataset.pasos !== b.dataset.pest; });
        reproduce($('[data-pasos="' + b.dataset.pest + '"]', proc));
      });
      b.addEventListener('keydown', function (e) { var i = pest.indexOf(b), j = e.key === 'ArrowRight' ? i + 1 : e.key === 'ArrowLeft' ? i - 1 : -9; if (j === -9) return; j = (j + pest.length) % pest.length; pest[j].focus(); pest[j].click(); });
    });
    if ('IntersectionObserver' in window) {
      var o = new IntersectionObserver(function (es) { if (es[0].isIntersecting && !visto) { visto = true; o.disconnect(); reproduce($('[data-pasos]:not([hidden])', proc)); } }, { threshold: .35 });
      o.observe(proc);
    } else reproduce($('[data-pasos]:not([hidden])', proc));
  })();

  // ---------- aros 3D del contacto (Three.js solo cuando se acerca la sección) ----------
  var canvasAros = $('[data-aros]');
  if (canvasAros && !reducido && 'IntersectionObserver' in window) {
    var oa = new IntersectionObserver(function (es) {
      if (!es[0].isIntersecting) return; oa.disconnect();
      var s = document.createElement('script'); s.type = 'module'; s.src = (document.querySelector('script[src*="js/main.js"]').src).replace(/js\/main\.js.*$/, 'js/aros.js'); document.body.appendChild(s);
    }, { rootMargin: '400px 0px' });
    oa.observe(canvasAros);
  }

  if (!g || !ST) { document.documentElement.classList.add('sin-gsap'); return; }
  g.registerPlugin(ST);

  // ---------- scroll suave ----------
  if (window.Lenis && !reducido) {
    lenis = new Lenis({ lerp: .11, smoothWheel: true });
    lenis.on('scroll', ST.update);
    g.ticker.add(function (t) { lenis.raf(t * 1000); }); g.ticker.lagSmoothing(0);
    $$('a[href*="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var u = new URL(a.href, location.href); if (u.pathname !== location.pathname || !u.hash || u.hash === '#') return;
        var t = document.getElementById(u.hash.slice(1)); if (!t) return;
        e.preventDefault(); lenis.scrollTo(t, { offset: u.hash === '#contenido' ? 0 : -70, duration: 1.3 }); history.replaceState(null, '', u.hash);
      });
    });
  }

  // ---------- titulares por líneas ----------
  function parteLineas(el) {
    if (el._orig == null) el._orig = el.innerHTML; else el.innerHTML = el._orig;
    var nodos = [];
    Array.prototype.slice.call(el.childNodes).forEach(function (n) {
      if (n.nodeType === 3) n.textContent.split(/(\s+)/).forEach(function (w) { if (w.trim()) { var s = document.createElement('span'); s.textContent = w; nodos.push(s); } else if (w) nodos.push(document.createTextNode(' ')); });
      else nodos.push(n);
    });
    el.innerHTML = ''; nodos.forEach(function (n) { el.appendChild(n); });
    var lineas = [], top = null;
    nodos.forEach(function (n) { if (n.nodeType === 3) { if (lineas.length) lineas[lineas.length - 1].push(n); return; } var t = n.offsetTop; if (top === null || Math.abs(t - top) > 4) { lineas.push([]); top = t; } lineas[lineas.length - 1].push(n); });
    el.innerHTML = '';
    lineas.forEach(function (l) { var o = document.createElement('span'), i = document.createElement('span'); o.className = 'lin'; l.forEach(function (n) { i.appendChild(n); }); o.appendChild(i); el.appendChild(o); });
    return $$('.lin > span', el);
  }
  var titulares = $$('[data-lineas]');
  function animaTitulares() {
    titulares.forEach(function (el) {
      if (el._st) { el._st.kill(); el._tw && el._tw.kill(); }
      var ls = parteLineas(el);
      if (reducido) return;
      g.set(ls, { yPercent: 105 });
      el._tw = g.to(ls, { yPercent: 0, duration: 1.1, ease: 'expo.out', stagger: .09, paused: true });
      el._st = ST.create({ trigger: el, start: 'top 86%', once: true, onEnter: function () { el._tw.play(); } });
    });
  }
  (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(function () {
    animaTitulares(); ST.refresh();
    var ancho = innerWidth; addEventListener('resize', function () { if (Math.abs(innerWidth - ancho) < 40) return; ancho = innerWidth; animaTitulares(); });
  });

  // ---------- HERO: slider de capas ----------
  var hero = $('[data-hero]');
  if (hero) (function () {
    var slides = $$('[data-sl]', hero), n = slides.length, actual = 0, anim = null;
    var botones = $$('[data-ir]', hero), num = $('[data-hero-n]', hero);
    var VEL = { fondo: .32, suelo: .72, titular: 1, objeto: 1.28, info: .86 }; // cuánto se mueve cada capa (parallax entre capas)
    var capas = slides.map(function (s) { return $$('[data-capa]', s); });
    hero.classList.add('es-lista');
    // precarga del resto de diapositivas cuando la primera ya está pintada (o al primer scroll)
    var precarga = function () { if (hero.classList.contains('es-precargada')) return; hero.classList.add('es-precargada'); slides.forEach(function (s) { $$('img[loading="lazy"]', s).forEach(function (im) { im.loading = 'eager'; }); }); };
    if (document.readyState === 'complete') setTimeout(precarga, 600); else addEventListener('load', function () { setTimeout(precarga, 600); });
    addEventListener('scroll', precarga, { once: true, passive: true });
    function marca(i) {
      botones.forEach(function (b, k) { b.setAttribute('aria-selected', k === i ? 'true' : 'false'); });
      if (num) num.textContent = dos(i + 1);
      slides.forEach(function (s, k) { s.setAttribute('aria-hidden', k === i ? 'false' : 'true'); });
      hero.dataset.slide = i;
    }
    function ir(i) {
      if (i === actual || i < 0 || i >= n) return;
      var dir = i > actual ? 1 : -1, de = slides[actual], a = slides[i], H = hero.offsetHeight;
      if (anim) anim.progress(1);
      // las imágenes diferidas de la siguiente diapositiva se piden ya
      $$('img[loading="lazy"]', a).forEach(function (im) { im.loading = 'eager'; });
      a.classList.add('es-activa'); g.set(a, { zIndex: 2 }); g.set(de, { zIndex: 1 });
      var tl = g.timeline({ defaults: { duration: 1.35, ease: 'power4.inOut' }, onComplete: function () { de.classList.remove('es-activa'); g.set(capas[slides.indexOf(de)], { clearProps: 'transform' }); g.set(de, { clearProps: 'clipPath,zIndex' }); } });
      tl.fromTo(a, { clipPath: dir > 0 ? 'inset(100% 0% 0% 0%)' : 'inset(0% 0% 100% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)' }, 0);
      capas[actual].forEach(function (c) { tl.to(c, { y: -dir * H * VEL[c.dataset.capa] * .9 }, 0); });
      capas[i].forEach(function (c) { tl.fromTo(c, { y: dir * H * VEL[c.dataset.capa] }, { y: 0 }, 0); });
      var lineas = $$('.ln > span', a);
      tl.fromTo(lineas, { yPercent: dir > 0 ? 110 : -110 }, { yPercent: 0, duration: 1.1, ease: 'expo.out', stagger: .08 }, .55);
      tl.fromTo($$('.sl__eti, .sl__info', a), { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: .8, ease: 'power3.out', stagger: .08 }, .8);
      anim = tl; actual = i; marca(i);
    }
    marca(0);
    if (reducido) { botones.forEach(function (b) { b.addEventListener('click', function () { var i = +b.dataset.ir; slides[actual].classList.remove('es-activa'); slides[i].classList.add('es-activa'); actual = i; marca(i); }); }); return; }
    // fijado: cada tramo de scroll es una diapositiva; los botones llevan a su tramo
    var st = ST.create({
      trigger: hero, start: 'top top', end: function () { return '+=' + Math.round(innerHeight * .85 * (n - 1)); }, pin: $('[data-hero-pin]', hero), pinSpacing: true, anticipatePin: 1,
      onUpdate: function (s) {
        var p = s.progress * (n - 1), i = Math.min(n - 1, Math.max(0, Math.round(p)));
        ir(i);
        // barra del botón activo: lo recorrido dentro del tramo de su diapositiva
        var lo = actual ? actual - .5 : 0, hi = actual === n - 1 ? n - 1 : actual + .5;
        botones.forEach(function (b, k) { b.classList.toggle('es-pasado', k < actual); });
        if (botones[actual]) botones[actual].style.setProperty('--p', hi > lo ? Math.max(.06, Math.min(1, (p - lo) / (hi - lo))).toFixed(3) : 1);
      },
    });
    botones.forEach(function (b) { b.addEventListener('click', function () { var i = +b.dataset.ir, y = st.start + (st.end - st.start) * (i / (n - 1)); if (lenis) lenis.scrollTo(y, { duration: 1.2 }); else scrollTo({ top: y, behavior: 'smooth' }); }); });
    addEventListener('keydown', function (e) {
      if (scrollY > st.end + 10 || /input|textarea|select/i.test(document.activeElement.tagName)) return;
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      var i = Math.max(0, Math.min(n - 1, actual + (e.key === 'ArrowRight' ? 1 : -1))); botones[i].click();
    });
    // profundidad con el ratón (propiedad «translate», que se suma al «transform» de GSAP)
    if (!tactil) {
      var mx = 0, my = 0, cx = 0, cy = 0, PROF = { fondo: -10, suelo: -18, titular: 14, objeto: 34, info: 10 };
      hero.addEventListener('pointermove', function (e) { mx = e.clientX / innerWidth - .5; my = e.clientY / innerHeight - .5; });
      hero.addEventListener('pointerleave', function () { mx = 0; my = 0; });
      g.ticker.add(function () {
        if (scrollY > st.end + innerHeight) return;
        cx += (mx - cx) * .06; cy += (my - cy) * .06;
        capas[actual].forEach(function (c) { var k = PROF[c.dataset.capa]; c.style.translate = (cx * k).toFixed(2) + 'px ' + (cy * k * .6).toFixed(2) + 'px'; });
      });
    }
  })();

  // ---------- manifiesto: el aro de luz se abre como un portal ----------
  var portal = $('[data-portal]');
  if (portal && !reducido) {
    var foto = $('.manif__foto', portal);
    var estadoP = { k: 0 };
    var pinta = function () {
      var w = portal.clientWidth, h = portal.clientHeight, k = estadoP.k;
      var rx = (w < 760 ? .34 : .17) * w + (w * .78 - (w < 760 ? .34 : .17) * w) * k, ry = .13 * h + (h * .8 - .13 * h) * k;
      portal.style.setProperty('--rx', rx.toFixed(1) + 'px'); portal.style.setProperty('--ry', ry.toFixed(1) + 'px');
      portal.style.setProperty('--zf', (1.3 - .3 * k).toFixed(3)); portal.style.setProperty('--ab', Math.max(0, .95 - k * 1.3).toFixed(3));
    };
    g.to(estadoP, { k: 1, ease: 'none', onUpdate: pinta, scrollTrigger: { trigger: portal, start: 'top 85%', end: 'bottom 70%', scrub: .6, invalidateOnRefresh: true, onRefresh: pinta } });
    pinta();
    g.fromTo('.manif__luz', { scale: .85, opacity: .6 }, { scale: 1.08, opacity: 1, ease: 'none', scrollTrigger: { trigger: '.manif', start: 'top bottom', end: 'top top', scrub: true } });
  }

  // ---------- cinta: velocidad y sentido según el scroll ----------
  var cinta = $('[data-cinta]');
  if (cinta && !reducido) (function () {
    var pista = $('.cinta__pista', cinta), grupo = $('.cinta__grupo', cinta), x = 0, dir = -1, extra = 0, giro = 0, vivo = false;
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { vivo = es[0].isIntersecting; }).observe(cinta);
    if (lenis) lenis.on('scroll', function (e) { var v = e.velocity || 0; if (Math.abs(v) > .2) dir = v > 0 ? -1 : 1; extra = Math.min(26, Math.abs(v) * 1.4); });
    var aros = $$('.cinta__aro', cinta);
    g.ticker.add(function (t, dt) {
      if (!vivo) return;
      var w = grupo.offsetWidth, v = (.9 + extra) * (dt / 16.7); extra *= .92;
      x += v * dir; if (x <= -w) x += w; if (x > 0) x -= w;
      pista.style.transform = 'translate3d(' + x.toFixed(1) + 'px,0,0)';
      giro += v * dir * -1.6; aros.forEach(function (a) { a.style.setProperty('--giro', giro.toFixed(1) + 'deg'); });
    });
  })();

  // ---------- parallax de fondos ----------
  if (!reducido) {
    var pf = $('.proc__fondo');
    if (pf) g.fromTo(pf, { yPercent: -6 }, { yPercent: 6, ease: 'none', scrollTrigger: { trigger: '.proc', start: 'top bottom', end: 'bottom top', scrub: true } });
  }

  // ---------- flota: de ventana a pantalla completa ----------
  var flota = $('[data-flota]');
  if (flota && !reducido) {
    var fm = $('[data-flota-marco]', flota), ft = $('.flota__txt', flota), movil = innerWidth < 760;
    var ef = { k: 0 };
    var pintaF = function () {
      var k = ef.k, e = 1 - Math.pow(1 - Math.min(1, k / .7), 3);
      fm.style.setProperty('--iy', ((movil ? 20 : 16) * (1 - e)).toFixed(2) + '%'); fm.style.setProperty('--ix', ((movil ? 7 : 24) * (1 - e)).toFixed(2) + '%');
      fm.style.setProperty('--r', (28 * (1 - e)).toFixed(1) + 'px'); fm.style.setProperty('--zf', (1.3 - .3 * e).toFixed(3));
      var t = Math.max(0, Math.min(1, (k - .55) / .3)); fm.style.setProperty('--ov', t.toFixed(3)); ft.style.setProperty('--tx', t.toFixed(3));
    };
    g.to(ef, { k: 1, ease: 'none', onUpdate: pintaF, scrollTrigger: { trigger: flota, start: 'top top', end: 'bottom bottom', scrub: .5 } });
    pintaF();
  }

  // ---------- engranaje gigante del pie: gira con el scroll ----------
  var pieAro = $('.pie__aro');
  if (pieAro && !reducido) ST.create({ trigger: '[data-pie]', start: 'top bottom', end: 'bottom bottom', onUpdate: function (s) { pieAro.style.setProperty('--giro', (s.progress * 360).toFixed(1) + 'deg'); } });

  // las alturas cambian al cargar las fotos: recalcular
  addEventListener('load', function () { ST.refresh(); });
})();
