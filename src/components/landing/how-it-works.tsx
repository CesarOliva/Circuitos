import type { CSSProperties } from "react";
import { BenchCircuit, Cursor } from "./bench-circuit";
import { ScrollStage } from "./scroll-stage";

const STEPS = [
  { title: "Arrastra", text: "Toma un componente de la bandeja y suéltalo en el área de trabajo o sobre la protoboard." },
  { title: "Conecta", text: "Haz clic en un terminal y luego en otro para tender un cable entre ellos; cada borne sabe quién es." },
  { title: "Simula", text: "Pulsa Simular y mira el resultado: el LED enciende, el motor gira y cada readout muestra su medición." },
];

const READOUTS = [
  { at: 0.8, label: "Corriente", value: "7 mA", detail: "I = (9 V − 2 V) / 1 kΩ" },
  { at: 0.86, label: "Voltaje en el LED", value: "2 V", detail: "su caída directa" },
  { at: 0.92, label: "Voltaje en el resistor", value: "7 V", detail: "lo que le sobra al LED" },
];

// «Cómo funciona» ligado al scroll: se arrastran las piezas, se cablean y al simular el LED se enciende.
export function HowItWorks() {
  return (
    <section aria-label="Cómo funciona">
      <ScrollStage className="how-stage">
        <div className="stage-sticky how-sticky">
          <div className="stage-progress" aria-hidden="true" />
          <div className="stage-head">
            <h2>Cómo funciona</h2>
            <p>Baja y mira cómo se arma un circuito en tres pasos.</p>
          </div>
          <div className="how-body">
            <ol className="how-steps">
              {STEPS.map((step, index) => (
                <li key={step.title} className="how-step">
                  <span className="how-num" aria-hidden="true">{index + 1}</span>
                  <h3>{step.title}</h3>
                  <p>{step.text}</p>
                </li>
              ))}
            </ol>
            <div className="how-scene">
              <svg className="how-svg" viewBox="0 0 640 380" aria-hidden="true">
                <BenchCircuit idPrefix="how" cursors />

                {/* Botón Simular */}
                <g className="how-sim">
                  <rect className="how-sim-base" x="470" y="296" width="132" height="38" rx="10" />
                  <rect className="how-sim-on" x="470" y="296" width="132" height="38" rx="10" />
                  <text className="how-sim-text how-sim-off-text" x="536" y="320" textAnchor="middle">▶ Simular</text>
                  <text className="how-sim-text how-sim-on-text" x="536" y="320" textAnchor="middle">Simulando…</text>
                </g>
                <g className="how-sim-cursor" transform="translate(560 322)"><Cursor /></g>
              </svg>
              <ul className="how-readouts">
                {READOUTS.map((readout) => (
                  <li key={readout.label} className="how-readout" style={{ "--s": readout.at } as CSSProperties}>
                    <span>{readout.label}</span>
                    <strong>{readout.value}</strong>
                    <small>{readout.detail}</small>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </ScrollStage>
    </section>
  );
}
