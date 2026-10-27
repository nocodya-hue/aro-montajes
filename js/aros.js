// Símbolos 3D del contacto: la «O» del logo de ARO (el engranaje con la llave, src/simbolo.mjs) en volumen, naranja y
// brillante, flotando detrás del cristal esmerilado. Giran sobre su eje como piezas de una máquina, se mueven con el ratón y con el scroll.
// Solo se dibuja si la sección se ve.
import * as THREE from '../vendor/three.module.min.js';
import { formasSimbolo } from './simbolo.js';

const canvas = document.querySelector('[data-aros]');
const sec = canvas && canvas.parentElement;
if (canvas) {
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' }); } catch (e) { renderer = null; }
  if (renderer) iniciar(renderer);
}

function iniciar(renderer) {
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  const escena = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(35, 1, .1, 100);
  cam.position.set(0, 0, 14);

  // estudio de luz: cajas emisivas alrededor (blancas y una cálida) → reflejos de producto
  const pmrem = new THREE.PMREMGenerator(renderer);
  const estudio = new THREE.Scene();
  estudio.background = new THREE.Color(0x9aa3ab);
  const caja = (c, x, y, z, sx, sy, sz) => { const m = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), new THREE.MeshBasicMaterial({ color: c })); m.position.set(x, y, z); estudio.add(m); };
  caja(0xffffff, 0, 9, 2, 14, .4, 6); caja(0xffffff, -9, 2, 4, .4, 8, 5); caja(0xffe2cc, 9, -1, 3, .4, 6, 6); caja(0xff9a5c, 0, -8, -4, 10, .4, 4); caja(0x23557a, 0, 0, -10, 20, 12, .4);
  escena.environment = pmrem.fromScene(estudio, .04).texture;
  const luz = new THREE.DirectionalLight(0xffffff, 1.4); luz.position.set(4, 6, 8); escena.add(luz);
  escena.add(new THREE.AmbientLight(0xffffff, .25));

  const naranja = new THREE.MeshPhysicalMaterial({ color: 0xff5a24, roughness: .26, metalness: .05, clearcoat: 1, clearcoatRoughness: .12, sheen: .3, sheenColor: new THREE.Color(0xffb38a) });
  const brasa = new THREE.MeshPhysicalMaterial({ color: 0xff7a3d, roughness: .3, metalness: .05, clearcoat: .8, clearcoatRoughness: .2 });
  // el mismo dibujo que la «O» del logo, en unidades del radio de los dientes = 1; gira sobre el centro del engranaje
  const FORMAS = formasSimbolo(THREE);
  const engranaje = (fondo) => { const g = new THREE.ExtrudeGeometry(FORMAS, { depth: fondo, curveSegments: 14, bevelEnabled: true, bevelThickness: .02, bevelSize: .011, bevelSegments: 3 }); g.translate(0, 0, -fondo / 2); return g; };
  // [tamaño (radio exterior), grosor, material, x (fracción del medio ancho), y (fracción del medio alto), z, giro inicial, sentido]
  const DEF = [
    [1.9, .42, naranja, .9, .56, -1.5, [.5, -.35, .2], 1],
    [1.25, .36, naranja, -.9, -.5, -1, [-.4, .55, 0], -1],
    [.75, .3, brasa, -.6, .68, -3.5, [.3, .2, .6], 1],
    [.6, .28, naranja, .6, -.6, .5, [-.6, -.3, .1], -1],
    [.45, .24, brasa, -.16, .14, -6, [.2, .5, 0], 1],
    [1.5, .38, naranja, .05, -.14, -5.5, [.7, -.2, .3], -1],
  ];
  const piezas = DEF.map(([r, grosor, mat, fx, fy, z, giro, sentido], i) => {
    const pivote = new THREE.Group(), m = new THREE.Mesh(engranaje(grosor / r), mat);
    m.scale.setScalar(r); pivote.add(m); pivote.rotation.set(...giro);
    pivote.userData = { fx, fy, z, giro, fase: i * 1.7, vel: .12 + (i % 3) * .05, sentido, pieza: m };
    escena.add(pivote); return pivote;
  });

  let W = 0, H = 0, mw = 0, mh = 0;
  function talla() {
    W = sec.clientWidth; H = sec.clientHeight; renderer.setSize(W, H, false); cam.aspect = W / H; cam.updateProjectionMatrix();
    mh = Math.tan(THREE.MathUtils.degToRad(cam.fov / 2)) * cam.position.z; mw = mh * cam.aspect;
    // el tamaño sigue al ancho visible: en móvil la sección es alta y estrecha, y si no los engranajes saldrían enormes
    const escala = Math.min(1, Math.max(.36, mw / 7));
    piezas.forEach((m) => { const u = m.userData; m.position.set(u.fx * mw, u.fy * mh, u.z); m.scale.setScalar(escala); });
  }
  talla(); addEventListener('resize', talla);

  let mx = 0, my = 0, cx = 0, cy = 0, visible = false, t0 = performance.now();
  addEventListener('pointermove', (e) => { mx = e.clientX / innerWidth - .5; my = e.clientY / innerHeight - .5; }, { passive: true });
  new IntersectionObserver((es) => { visible = es[0].isIntersecting; if (visible) requestAnimationFrame(dibuja); }).observe(sec);

  function dibuja(ahora) {
    if (!visible || document.hidden) return;
    const t = (ahora - t0) / 1000, r = sec.getBoundingClientRect(), sc = 1 - (r.top + r.height) / (innerHeight + r.height); // 0→1 al cruzar la pantalla
    cx += (mx - cx) * .05; cy += (my - cy) * .05;
    piezas.forEach((m, i) => {
      const u = m.userData, prof = 1 + (u.z + 6) * .18;
      m.position.x = u.fx * mw + cx * prof * .9; m.position.y = u.fy * mh + Math.sin(t * .6 + u.fase) * .18 - cy * prof * .6 + (sc - .5) * (i % 2 ? 1.2 : -1.2);
      u.pieza.rotation.z += u.vel * .012 * u.sentido;              // gira sobre su eje, como en una máquina
      m.rotation.x = u.giro[0] + Math.sin(t * .25 + u.fase) * .25; m.rotation.y = u.giro[1] + Math.sin(t * .2 + u.fase * 2) * .3; // y se balancea despacio
    });
    renderer.render(escena, cam);
    requestAnimationFrame(dibuja);
  }
  document.addEventListener('visibilitychange', () => { if (!document.hidden && visible) requestAnimationFrame(dibuja); });
}
