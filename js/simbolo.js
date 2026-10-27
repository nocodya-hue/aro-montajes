// Símbolo de ARO calcado de su logo (work/refs/logo-aro.png): engranaje abierto, la «tuerca», y una llave que lo cruza
// en diagonal. La cabeza de la llave ocupa el cuarto de arriba a la derecha; el mango baja hacia el centro y la mordaza
// queda suelta a la derecha. Entre las piezas hay siempre el mismo canal.
// Unidades del logo: centro del engranaje en (0, 0), radio exterior de los dientes 422, y hacia abajo (como en SVG).
// Lo usan src/logo.mjs (SVG) y src/aros.js (Three.js), así que el logo y los 3D son el mismo dibujo.
export const R2 = 422;
export const CAJA = [-422, -504, 493, 422];        // x0, y0, x1, y1
const CANAL = 40;
const r0 = 251, r1 = 366, DIENTES = 8, wr = 11 * Math.PI / 180, wt = 8.2 * Math.PI / 180;
// cabeza de la llave: cuadrada, con una muesca en V a 45° que se abre hacia la derecha
const ARR = -504, IZQ = 21, ABJ = -28, rSI = 45, rII = 43, rV = 50;
const XC = IZQ - CANAL, YC = ABJ + CANAL;          // por aquí se corta el engranaje (y termina el mango)
const B = 126, RM = r0 - CANAL;                    // mango: banda |x + y| ≤ B, cortada por un círculo de radio RM
const s2 = Math.SQRT2;
const p = (r, a) => [r * Math.cos(a), r * Math.sin(a)];

// contorno = segmentos ['M', x, y] · ['L', x, y] · ['A', cx, cy, r, a0, a1] (ángulos de SVG: a1 > a0 es sentido horario)
function engranaje() {
  const paso = Math.PI * 2 / DIENTES, yArr = -R2 * Math.cos(wt), c = [['M', XC, yArr]];
  for (let i = 0; i <= 6; i++) {                   // del diente de arriba (medio) al de la derecha (medio), por la izquierda
    const a = -Math.PI / 2 - i * paso;
    if (i) c.push(['L', ...p(R2, a + wt)]);
    if (i < 6) c.push(['L', ...p(R2, a - wt)], ['L', ...p(r1, a - wr)], ['A', 0, 0, r1, a - wr, a - paso + wr]);
  }
  const xi = Math.sqrt(r0 * r0 - YC * YC);
  c.push(['L', R2 * Math.cos(wt), YC], ['L', xi, YC], ['A', 0, 0, r0, Math.asin(YC / r0), Math.PI * 2 + Math.atan2(-Math.sqrt(r0 * r0 - XC * XC), XC)], ['L', XC, yArr]);
  return [c];
}

function cabeza() {
  const kS = -ARR - 187, vx = (490 - 187) / 2, vy = vx - 490, t = rV / s2; // muesca: y = -x - 187 (arriba), y = x - 490 (abajo)
  const c = [['M', IZQ + rSI, ARR], ['L', kS, ARR], ['L', vx + t, vy - t], ['A', vx + rV * s2, vy, rV, Math.PI * 1.25, Math.PI * .75],
    ['L', ABJ + 490, ABJ], ['L', IZQ + rII, ABJ], ['A', IZQ + rII, ABJ - rII, rII, Math.PI / 2, Math.PI],
    ['L', IZQ, ARR + rSI], ['A', IZQ + rSI, ARR + rSI, rSI, Math.PI, Math.PI * 1.5]];
  // tres ranuras sobre el eje de la llave, atravesadas
  const ranuras = [-1, 0, 1].map((n) => {
    const cx = 161.9 + 43.5 * n, cy = -161.9 + 43.5 * n, h = 22.5 / s2, r = 18.5, e1 = [cx + h, cy - h], e2 = [cx - h, cy + h], o = r / s2;
    return [['M', e1[0] + o, e1[1] + o], ['A', ...e1, r, Math.PI / 4, -Math.PI * .75], ['L', e2[0] - o, e2[1] - o], ['A', ...e2, r, -Math.PI * .75, -Math.PI * 1.75], ['L', e1[0] + o, e1[1] + o]];
  });
  return [c, ...ranuras];
}

function mango() {
  const hc = Math.sqrt(RM * RM - B * B / 2) / s2, a = [-B / 2 - hc, -B / 2 + hc], b = [B / 2 - hc, B / 2 + hc];
  return [[['M', XC, -B - XC], ['L', ...a], ['A', 0, 0, RM, Math.atan2(a[1], a[0]), Math.atan2(b[1], b[0])],
    ['L', B - YC, YC], ['L', IZQ + rII, YC], ['A', IZQ + rII, ABJ - rII, rII + CANAL, Math.PI / 2, Math.PI], ['L', XC, -B - XC]]];
}

function mordaza() {                                // triángulo suelto: y = x - 490 - canal (abajo), y = -x + 211 (arriba), x = 493
  const d = 490 + CANAL * s2, X = 493, v = [(211 + d) / 2, (211 - d) / 2], rf = 8, tg = rf / Math.tan(Math.PI / 8), yb = X - d;
  const c = [X - rf, yb - tg];
  return [[['M', ...v], ['L', X, -X + 211], ['L', X, yb - tg], ['A', ...c, rf, 0, Math.PI * .75], ['L', ...v]]];
}

export const PIEZAS = [engranaje(), cabeza(), mango(), mordaza()];

// trazo SVG de todo el símbolo, escalado (k) y centrado en (cx, cy); se rellena con fill-rule evenodd
export function simboloPath(cx = 0, cy = 0, k = 1) {
  const f = (v) => String(+v.toFixed(1));
  let d = '';
  for (const pieza of PIEZAS) for (const con of pieza) {
    for (const s of con) {
      if (s[0] !== 'A') { d += `${s[0]}${f(cx + s[1] * k)} ${f(cy + s[2] * k)}`; continue; }
      const [, ax, ay, r, a0, a1] = s;
      d += `A${f(r * k)} ${f(r * k)} 0 ${Math.abs(a1 - a0) > Math.PI ? 1 : 0} ${a1 > a0 ? 1 : 0} ${f(cx + (ax + r * Math.cos(a1)) * k)} ${f(cy + (ay + r * Math.sin(a1)) * k)}`;
    }
    d += 'Z';
  }
  return d;
}

// formas de Three.js (y hacia arriba), en unidades de R2 = 1: una por pieza, con sus agujeros
export function formasSimbolo(THREE) {
  const k = 1 / R2;
  return PIEZAS.map((pieza) => {
    const [forma, ...agujeros] = pieza.map((con, i) => {
      const t = i ? new THREE.Path() : new THREE.Shape();
      for (const s of con) {
        if (s[0] === 'M') t.moveTo(s[1] * k, -s[2] * k);
        else if (s[0] === 'L') t.lineTo(s[1] * k, -s[2] * k);
        else t.absarc(s[1] * k, -s[2] * k, s[3] * k, -s[4], -s[5], s[5] > s[4]);
      }
      return t;
    });
    forma.holes.push(...agujeros);
    return forma;
  });
}
