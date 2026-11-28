import { Fragment, type CSSProperties } from "react";
import Link from "next/link";
import { Reveal } from "@/components/landing/reveal";
import { IntroScreen } from "@/components/landing/intro-screen";
import { HowItWorks } from "@/components/landing/how-it-works";
import { CtaZoom } from "@/components/landing/cta-zoom";
import "@/components/landing/landing.css";

const HERO_WORDS = ["Arma,", "simula", "y", "entiende", "tus", "circuitos."];
// Posición de la primera letra de cada palabra en la frase, para escalonar las letras con --i.
const HERO_STARTS = HERO_WORDS.map((_, index) => HERO_WORDS.slice(0, index).join(" ").length + (index ? 1 : 0));

export default function Home() {
  return (
    <>
      <IntroScreen />

      <main className="landing">
        <section className="hero">
          <div className="hero-copy">
            <p className="hero-badge">
              <span className="hero-badge-dot" aria-hidden="true" /> Simulador de circuitos en el navegador
            </p>
            <h1 aria-label="Arma, simula y entiende tus circuitos.">
              {HERO_WORDS.map((word, index) => (
                <Fragment key={word}>
                  <span className={`hw${word === "entiende" ? " hero-accent" : ""}`} aria-hidden="true">
                    {[...word].map((letter, position) => (
                      <span key={position} style={{ "--i": HERO_STARTS[index] + position } as CSSProperties}>
                        {letter}
                      </span>
                    ))}
                  </span>
                  {index < HERO_WORDS.length - 1 ? " " : null}
                </Fragment>
              ))}
            </h1>
            <p className="hero-lead">
              Coloca componentes sobre una protoboard, conecta sus terminales con cables y resuelve el circuito en corriente
              directa al instante. Cada pieza existe también como figura isométrica y modelo 3D giratorio, con sus terminales,
              sus propiedades reales y los fallos de su ficha técnica.
            </p>
            <div className="hero-ctas">
              <Link className="cta-primary" href="/simulador">
                <span aria-hidden="true">▶</span> Abrir el simulador
              </Link>
              <Link className="cta-secondary" href="/componentes">
                Ver los componentes
              </Link>
            </div>
          </div>
        </section>

      </main>

      <div className="landing">
        <Reveal>
          <section className="features" aria-label="Secciones del sitio">
            <h2>Todo el laboratorio, en cuatro ventanas</h2>
            <div className="features-grid">
              <Link className="spotlight feature-card" href="/simulador">
                <span className="fv fv-sim" aria-hidden="true">
                  <svg viewBox="0 0 180 120">
                    <path className="sim-wire" pathLength="1" d="M25 34 V20 H150 V48" />
                    <path className="sim-wire" pathLength="1" d="M25 80 V100 H150 V72" />
                    <rect className="sim-battery" x="12" y="40" width="26" height="40" rx="4" />
                    <rect className="sim-battery-cap" x="20" y="34" width="10" height="6" rx="2" />
                    <text className="sim-label" x="25" y="63" textAnchor="middle">+</text>
                    <text className="sim-label" x="25" y="114" textAnchor="middle">9 V</text>
                    <circle className="sim-led-glow" cx="150" cy="60" r="22" />
                    <circle className="sim-led-body" cx="150" cy="60" r="11" />
                    <circle className="sim-led-on" cx="150" cy="60" r="11" />
                    <path className="sim-led-symbol" d="M144 54 H156 L150 65 Z M144 67 H156" />
                  </svg>
                </span>
                <span className="feature-head">
                  <span className="feature-icon" aria-hidden="true">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path pathLength="1" d="M3 12h4l1.6-4 2.8 8 1.6-4H21" />
                    </svg>
                  </span>
                  <h3>Simulador</h3>
                </span>
                <p>
                  Arrastra fuentes, pasivos, controles, sensores, actuadores y semiconductores a la protoboard, cablea sus
                  terminales y pulsa Simular: el solucionador DC calcula voltajes y corrientes en vivo.
                </p>
                <span className="feature-go">Abrir el simulador →</span>
              </Link>
              <Link className="spotlight feature-card" href="/componentes">
                <span className="fv fv-comp" aria-hidden="true">
                  <span className="carousel">
                    <span style={{ "--i": 0 } as CSSProperties}>R</span>
                    <span style={{ "--i": 1 } as CSSProperties}>C</span>
                    <span style={{ "--i": 2 } as CSSProperties}>L</span>
                    <span style={{ "--i": 3 } as CSSProperties}>LED</span>
                  </span>
                </span>
                <span className="feature-head">
                  <span className="feature-icon" aria-hidden="true">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <rect pathLength="1" x="3.5" y="3.5" width="7" height="7" rx="1.5" />
                      <rect pathLength="1" x="13.5" y="3.5" width="7" height="7" rx="1.5" />
                      <rect pathLength="1" x="3.5" y="13.5" width="7" height="7" rx="1.5" />
                      <rect pathLength="1" x="13.5" y="13.5" width="7" height="7" rx="1.5" />
                    </svg>
                  </span>
                  <h3>Componentes</h3>
                </span>
                <p>
                  La galería isométrica instancia la clase real de cada componente: los bornes, el readout y la lista de
                  propiedades salen directamente del modelo de simulación.
                </p>
                <span className="feature-go">Ver la galería →</span>
              </Link>
              <Link className="spotlight feature-card" href="/componentes/3d">
                <span className="fv fv-3d" aria-hidden="true">
                  <span className="cube">
                    <span />
                    <span />
                    <span />
                    <span />
                    <span />
                    <span />
                  </span>
                </span>
                <span className="feature-head">
                  <span className="feature-icon" aria-hidden="true">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path pathLength="1" d="M12 2.8 20.2 7.4v9.2L12 21.2 3.8 16.6V7.4Z" />
                      <path pathLength="1" d="M3.8 7.4 12 12l8.2-4.6M12 12v9.2" />
                    </svg>
                  </span>
                  <h3>En 3D</h3>
                </span>
                <p>
                  Cada componente como modelo 3D que se puede girar, montado en su placa o suelto, como sale de la bolsa.
                  Sigue cada terminal hasta su borne o hasta la punta de su patita.
                </p>
                <span className="feature-go">Girar los modelos →</span>
              </Link>
              {/* <Link className="spotlight feature-card" href="/componentes/fallos">
                <span className="fv fv-fault" aria-hidden="true">
                  <svg viewBox="0 0 80 70">
                    <path className="fault-tri" d="M40 6 L74 64 H6 Z" />
                    <path className="fault-crack" pathLength="1" d="M36 30 L42 40 L37 48 L44 60" />
                  </svg>
                </span>
                <span className="feature-head">
                  <span className="feature-icon" aria-hidden="true">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path pathLength="1" d="M12 3.2 22 20H2Z" />
                      <path pathLength="1" d="M12 9.5v5M12 17.4v.2" />
                    </svg>
                  </span>
                  <h3>Fallos</h3>
                </span>
                <p>
                  Los modos de fallo de las fichas técnicas, dibujados sobre la pieza: una patilla cortada, un puente de
                  cobre, una grieta, una señal irregular o el cuerpo quemado.
                </p>
                <span className="feature-go">Estudiar los fallos →</span>
              </Link> */}
            </div>
          </section>
        </Reveal>
      </div>

      <HowItWorks />

      <CtaZoom />
    </>
  );
}
