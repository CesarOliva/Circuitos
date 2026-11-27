"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import "./intro-screen.css";

/*
  Intro: un circuito real que enciende la marca.
  Batería 9 V → interruptor → resistencia 330 Ω → LED azul (la "O") → regreso al −.
  I = (9 V − 3.2 V) / 330 Ω ≈ 17.6 mA, dentro de los 20 mA de un LED de 5 mm.

  Personajes (principios de animación: anticipación, estirar y aplastar, rebote):
    · El LED llega caminando sobre sus patitas y se detiene a la derecha de la S; justo antes de que
      entre la chispa salta por encima de la S y cae en la O, donde se enciende: le aparecen unos ojos
      blancos, guiña uno y la cara se desvanece.
    · Una chispa amarilla (la corriente) espera en el interruptor, cruza apretada la resistencia,
      llega al pie del LED, da un brinquito y entra por el ánodo: entonces el LED se enciende.
    · El interruptor duda antes de cerrarse y rebota.
    · Al encenderse el LED, la corriente recorre el nombre: cada letra parpadea y se queda encendida
      en azul, de izquierda a derecha.

  Las animaciones CSS (intro-screen.css) y la línea de tiempo de la chispa (SPARK_TIMELINE)
  comparten los mismos tiempos: si se cambia uno, hay que cambiar el otro.
*/

/**
 * La intro sale en cada carga completa de la página (abrirla o recargarla). Esta variable vive
 * mientras dure la carga, así que al volver a Inicio desde el menú (navegación dentro del sitio)
 * no se repite; al recargar, el módulo se evalúa de nuevo y vuelve a valer false.
 */
let playedThisLoad = false;
/** Cuándo empieza a irse la intro (ms) y cuánto dura el desvanecido. */
const INTRO_MS = 2650;
const FADE_MS = 350;

type Phase = "playing" | "leaving" | "gone";

// Distancia (px sobre #ix-trail) y tiempos de la chispa.
//   0 = + de la batería · 84 = frente al interruptor · 170–234 = resistencia · 729 = dentro del LED
type Move = "aparece" | "viaja" | "frenon" | "espera" | "anticipa" | "dispara" | "resistencia" | "sale" | "brinca" | "entra";
const SPARK_TIMELINE: [number, number, number, number, Move][] = [
  [80, 250, 0, 0, "aparece"], // nace en el + con un rebote
  [250, 480, 0, 84, "viaja"], // sale hacia el interruptor
  [480, 580, 84, 84, "frenon"], // frena en seco: se aplasta
  [580, 760, 84, 84, "espera"], // una pausa breve frente al interruptor
  [760, 830, 84, 79, "anticipa"], // el interruptor se cierra: toma impulso hacia atrás
  [830, 950, 79, 170, "dispara"], // sale disparada
  [950, 1270, 170, 234, "resistencia"], // se aprieta y avanza lento: la resistencia limita la corriente
  [1270, 1340, 234, 246, "sale"], // recupera su forma con rebote
  [1340, 1590, 246, 697, "viaja"], // corre por debajo del nombre
  [1590, 1790, 697, 697, "brinca"], // llega al pie del LED y da un brinquito
  [1790, 1860, 697, 729, "entra"], // sube por la pata larga (ánodo) y se mete al LED
];

/** Destello de la chispa: 8 rayos delgados (largos y cortos alternados) que salen de un centro fino.
 *  Cada rayo baja en curva hacia el centro: los puntos de control van sobre el propio rayo, cerca
 *  del centro, así los lados son cóncavos y el centro queda tan delgado como SPARK_WAIST. */
const SPARK_POINTS = 8;
const SPARK_WAIST = 1;
const SPARK_PATH = (() => {
  const polar = (i: number, r: number) => {
    const angle = (i / SPARK_POINTS) * Math.PI * 2 - Math.PI / 2;
    return [Math.cos(angle) * r, Math.sin(angle) * r];
  };
  const tipR = (i: number) => (i % 2 === 0 ? 13 : 9);
  const f = (n: number) => n.toFixed(2);
  const pt = ([x, y]: number[]) => `${f(x)} ${f(y)}`;
  let d = `M${pt(polar(0, tipR(0)))}`;
  for (let i = 0; i < SPARK_POINTS; i++) {
    const next = (i + 1) % SPARK_POINTS;
    const valley = polar(i + 0.5, SPARK_WAIST);
    d += ` Q${pt(polar(i, tipR(i) * 0.32))} ${pt(valley)}`; // baja por el rayo i hasta el centro
    d += ` Q${pt(polar(next, tipR(next) * 0.32))} ${pt(polar(next, tipR(next)))}`; // sube por el rayo siguiente
  }
  return `${d} Z`;
})();

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOutBack = (t: number) => 1 + 2.7 * Math.pow(t - 1, 3) + 1.7 * Math.pow(t - 1, 2);
const easeIn = (t: number) => t * t;

type SparkParts = { trail: SVGPathElement; spark: SVGGElement; shape: SVGGElement };

/** Mueve la chispa por el cable desde el instante `skip` (ms). Devuelve una función que la detiene. */
function runSpark({ trail, spark, shape }: SparkParts, skip: number) {
  const length = trail.getTotalLength();
  trail.style.strokeDasharray = `${length}`;
  trail.style.strokeDashoffset = `${length}`;

  let reached = 0;
  let prevS = 0;
  let prevT = 0;
  let frameId = 0;
  const start = performance.now() - skip;
  const last = SPARK_TIMELINE[SPARK_TIMELINE.length - 1];

  function render(t: number) {
    const step = SPARK_TIMELINE.find(([a, b]) => t >= a && t < b);
    if (!step) {
      if (t >= last[1]) {
        spark.style.opacity = "0";
        trail.style.strokeDashoffset = "0";
        return false;
      }
      return true;
    }
    const [a, b, s0, s1, move] = step;
    const u = (t - a) / (b - a);

    let s = s0;
    let along = 1; // estiramiento en la dirección del movimiento
    let perp = 1; // y en la perpendicular
    let scale = 1;
    let lift = 0; // brinco vertical (px)

    switch (move) {
      case "aparece":
        scale = Math.max(0, easeOutBack(u));
        break;
      case "viaja": {
        s = s0 + (s1 - s0) * easeInOut(u);
        const speed = Math.abs(s - prevS) / Math.max(1, t - prevT);
        along = 1 + Math.min(speed * 0.9, 0.6);
        perp = 1 / Math.sqrt(along);
        break;
      }
      case "frenon":
        along = 1 - 0.42 * Math.exp(-6 * u) * Math.cos(14 * u);
        perp = 1 / along;
        break;
      case "espera":
        along = 1.12 + 0.05 * Math.sin(u * Math.PI * 6); // late, impaciente
        perp = 1 / along;
        break;
      case "anticipa":
        s = s0 + (s1 - s0) * easeInOut(u);
        along = 0.72;
        perp = 1.25;
        break;
      case "dispara":
        s = s0 + (s1 - s0) * easeIn(u);
        along = 1.7;
        perp = 0.72;
        break;
      case "resistencia":
        s = s0 + (s1 - s0) * u;
        along = 1.45;
        perp = 0.55 + 0.06 * Math.sin(u * Math.PI * 10); // apretada, se retuerce
        break;
      case "sale":
        s = s0 + (s1 - s0) * u;
        along = 1 - 0.3 * Math.exp(-5 * u) * Math.cos(16 * u);
        perp = 1 / along;
        break;
      case "brinca": {
        // Brinquito: se agacha, salta y cae aplastándose
        const hop = Math.max(0, (u - 0.35) / 0.5);
        if (u < 0.35) {
          perp = 1 - 0.18 * Math.sin((u / 0.35) * Math.PI);
          along = 1 / perp;
        } else if (hop < 1) {
          lift = -9 * Math.sin(hop * Math.PI);
          perp = 1 + 0.12 * Math.sin(hop * Math.PI);
          along = 1 / perp;
        }
        break;
      }
      case "entra":
        s = s0 + (s1 - s0) * easeIn(u);
        scale = 1 - easeIn(u);
        break;
    }
    prevS = s;
    prevT = t;

    // El estiramiento sigue la dirección del cable; el destello no gira.
    const p = trail.getPointAtLength(s);
    const ahead = trail.getPointAtLength(Math.min(length, s + 1));
    const behind = trail.getPointAtLength(Math.max(0, s - 1));
    const angle = Math.atan2(ahead.y - behind.y, ahead.x - behind.x);
    const deg = (angle * 180) / Math.PI;

    spark.style.opacity = "1";
    spark.setAttribute("transform", `translate(${p.x} ${p.y + lift})`);
    // "brinca" ocurre en la esquina del cable: ahí el estiramiento va en vertical
    const axis = move === "brinca" ? 90 : deg;
    shape.setAttribute("transform", `scale(${scale * 1.35}) rotate(${axis}) scale(${along} ${perp}) rotate(${-axis})`);

    // El rastro de luz va detrás de la chispa (no retrocede cuando ella toma impulso).
    reached = Math.max(reached, move === "anticipa" ? s0 : s);
    trail.style.strokeDashoffset = `${length - reached}`;
    return true;
  }

  function frame(now: number) {
    if (render(now - start)) frameId = requestAnimationFrame(frame);
  }
  frameId = requestAnimationFrame(frame);
  return () => cancelAnimationFrame(frameId);
}

/** Script en línea que corre antes del primer pintado (ver la guía "preventing flash before hydration"). */
function InlineScript({ html }: { html: string }) {
  return (
    <script
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

/** Ya salió en esta carga, o el usuario pidió menos movimiento: no se reproduce. */
function shouldSkip() {
  return playedThisLoad || matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// Con movimiento reducido, la intro se oculta antes del primer pintado.
const SKIP_SCRIPT = `{var n=document.getElementById("intro-screen");try{if(n&&matchMedia("(prefers-reduced-motion: reduce)").matches)n.dataset.state="gone"}catch(e){}}`;

// Letras del nombre. --i = orden de izquierda a derecha: así las recorre la corriente.
const LETTERS_LEFT = [
  { ch: "C", x: 292, i: 0 },
  { ch: "I", x: 333, i: 1 },
  { ch: "R", x: 371, i: 2 },
  { ch: "C", x: 418, i: 3 },
  { ch: "U", x: 467, i: 4 },
  { ch: "I", x: 508, i: 5 },
  { ch: "T", x: 545, i: 6 },
];

export function IntroScreen() {
  const [phase, setPhase] = useState<Phase>(() =>
    typeof window !== "undefined" && shouldSkip() ? "gone" : "playing",
  );
  const rootRef = useRef<HTMLDivElement>(null);
  const trailRef = useRef<SVGPathElement>(null);
  const sparkRef = useRef<SVGGElement>(null);
  const shapeRef = useRef<SVGGElement>(null);

  useEffect(() => {
    if (phase !== "playing") return;
    playedThisLoad = true;

    // La escena se pinta antes de que React la active; ese rato se ve quieta. Se descuenta de la
    // animación para que, desde que aparece en pantalla hasta que se va, dure siempre 3 s.
    const paint = performance.getEntriesByName("first-contentful-paint")[0]?.startTime;
    const skip = paint === undefined ? 0 : Math.min(Math.max(0, performance.now() - paint), 600);

    // Las animaciones CSS esperan en pausa hasta este momento, así arrancan junto con la chispa.
    const root = rootRef.current!;
    root.setAttribute("data-run", "");
    for (const animation of root.getAnimations({ subtree: true })) animation.currentTime = skip;
    const stopSpark = runSpark(
      { trail: trailRef.current!, spark: sparkRef.current!, shape: shapeRef.current! },
      skip,
    );
    const end = setTimeout(() => setPhase("leaving"), INTRO_MS - skip);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPhase("leaving");
    };
    window.addEventListener("keydown", onKey);
    return () => {
      stopSpark();
      clearTimeout(end);
      window.removeEventListener("keydown", onKey);
    };
  }, [phase]);

  useEffect(() => {
    if (phase !== "leaving") return;
    const done = setTimeout(() => setPhase("gone"), FADE_MS);
    return () => clearTimeout(done);
  }, [phase]);

  return (
    <>
      <div className="intro-screen" id="intro-screen" ref={rootRef} data-state={phase} suppressHydrationWarning>
        <svg className="ix-art" viewBox="0 0 760 260" aria-hidden="true">
          <defs>
            <radialGradient id="ix-led-fill" cx="0.45" cy="0.4" r="0.8">
              <stop offset="0" stopColor="#7fb6ff" />
              <stop offset="0.45" stopColor="#3d86f5" />
              <stop offset="1" stopColor="#1f5fd6" />
            </radialGradient>
            <radialGradient id="ix-led-halo">
              <stop offset="0" stopColor="#9cc4ff" stopOpacity="0.9" />
              <stop offset="0.25" stopColor="#1f8fff" stopOpacity="0.55" />
              <stop offset="1" stopColor="#1f8fff" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="ix-spark-fill" cx="0.42" cy="0.38" r="0.65">
              <stop offset="0" stopColor="#fff9c4" />
              <stop offset="0.4" stopColor="#ffeb3b" />
              <stop offset="1" stopColor="#ffd600" />
            </radialGradient>
            <radialGradient id="ix-spark-glow">
              <stop offset="0" stopColor="#fff176" stopOpacity="0.7" />
              <stop offset="0.5" stopColor="#ffd600" stopOpacity="0.25" />
              <stop offset="1" stopColor="#ffd600" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Camino completo, apagado */}
          <path className="ix-track" d="M58 90 V48 H106" />
          <path className="ix-track" d="M144 48 H250 V174 H587" />
          <path className="ix-track" d="M603 166 V212 H114 V78 H82 V88" />

          {/* Rastro de la chispa: + → interruptor → resistencia → bajo el nombre → ánodo del LED */}
          <path className="ix-wire" id="ix-trail" ref={trailRef} d="M58 90 V48 H250 V174 H587 V142" />
          {/* Regreso por el cátodo al − (en una batería de 9 V ambos bornes están arriba) */}
          <path className="ix-wire ix-wire-back" pathLength={1} d="M603 166 V212 H114 V78 H82 V88" />

          {/* Interruptor */}
          <line className="ix-lever" x1="106" y1="48" x2="144" y2="48" />
          <circle className="ix-post" cx="106" cy="48" r="4.5" />
          <circle className="ix-post" cx="144" cy="48" r="4.5" />
          <g className="ix-contact">
            <line x1="144" y1="38" x2="144" y2="33" />
            <line x1="151" y1="41" x2="155" y2="37" />
            <line x1="137" y1="41" x2="133" y2="37" />
            <line x1="153" y1="48" x2="158" y2="48" />
            <line x1="151" y1="55" x2="155" y2="59" />
          </g>
          <text className="ix-state ix-off" x="125" y="72">OFF</text>
          <text className="ix-state ix-on" x="125" y="72">ON</text>

          {/* Batería de 9 V (PP3): + = broche macho redondo, − = broche hembra hexagonal */}
          <g className="ix-battery">
            <rect className="ix-cap" x="54" y="90" width="8" height="10" rx="2" />
            <circle className="ix-cap" cx="58" cy="90" r="4.5" />
            <path className="ix-cap" d="M75 100 V92 L78.5 87 H85.5 L89 92 V100 Z" />
            <rect className="ix-batt-body" x="44" y="99" width="52" height="80" rx="5" />
            <rect className="ix-batt-band" x="45" y="100" width="50" height="20" rx="4" />
            <text className="ix-sign" x="58" y="115">+</text>
            <text className="ix-sign" x="82" y="115">−</text>
            <text className="ix-volts" x="70" y="156">9V</text>
          </g>

          {/* Resistencia 330 Ω ±5 %: naranja, naranja, café, dorado */}
          <g className="ix-resistor">
            <rect className="ix-res-body" x="170" y="37" width="64" height="22" rx="11" />
            <rect x="184" y="37" width="5" height="22" fill="#e8812a" />
            <rect x="195" y="37" width="5" height="22" fill="#e8812a" />
            <rect x="206" y="37" width="5" height="22" fill="#7a4a26" />
            <rect x="220" y="37" width="4" height="22" fill="#d4af37" />
          </g>
          <text className="ix-label" x="202" y="80">
            {/* IBM Plex no trae letras griegas: la Ω usa la fuente del sistema a un tamaño parejo */}
            330 <tspan className="ix-ohm">Ω</tspan>
          </text>

          {LETTERS_LEFT.map(({ ch, x, i }) => (
            <text key={x} className="ix-letter" x={x} y="140" style={{ "--i": i } as CSSProperties}>
              {ch}
            </text>
          ))}
          <text className="ix-letter" x="645" y="140" style={{ "--i": 7 } as CSSProperties}>S</text>

          {/* La O es un LED azul que llega caminando. Pata larga = ánodo (izquierda), corta = cátodo. */}
          <g className="ix-led-actor">
            <g className="ix-led-bob">
              <circle className="ix-led-halo" cx="595" cy="112" r="95" fill="url(#ix-led-halo)" />
              <line className="ix-leg ix-leg-anode" x1="587" y1="142" x2="587" y2="174" />
              <line className="ix-leg ix-leg-cathode" x1="603" y1="142" x2="603" y2="166" />
              <path className="ix-led-body" d="M578 140 V110 A17 17 0 0 1 612 110 V140 Z" />
              <rect className="ix-led-rim" x="574" y="136" width="42" height="7" rx="2" />
              <g className="ix-led-on">
                <path d="M578 140 V110 A17 17 0 0 1 612 110 V140 Z" fill="url(#ix-led-fill)" />
                <rect x="574" y="136" width="42" height="7" rx="2" fill="#3f7fe8" />
              </g>
              {/* Ojos: aparecen al encenderse, guiña el derecho y se desvanecen */}
              <g className="ix-led-eyes">
                <ellipse cx="589.5" cy="121" rx="1.7" ry="2.6" />
                <ellipse className="ix-led-wink" cx="600.5" cy="121" rx="1.7" ry="2.6" />
                {/* El ojo cerrado: una línea delgada que solo se ve durante el guiño */}
                <path className="ix-led-wink-line" d="M598 121.2 Q600.5 122.8 603 121.2" />
              </g>
            </g>
          </g>

          {/* La chispa: el script la mueve por #ix-trail */}
          <g className="ix-spark" ref={sparkRef}>
            <g ref={shapeRef}>
              <circle r="10" fill="url(#ix-spark-glow)" />
              {/* Destello de ocho puntas */}
              <g className="ix-spark-body" fill="url(#ix-spark-fill)">
                <path d={SPARK_PATH} />
              </g>
            </g>
          </g>
        </svg>

        <button type="button" className="ix-skip" onClick={() => setPhase("leaving")}>
          Saltar intro <kbd>Esc</kbd>
        </button>
      </div>
      <InlineScript html={SKIP_SCRIPT} />
    </>
  );
}
