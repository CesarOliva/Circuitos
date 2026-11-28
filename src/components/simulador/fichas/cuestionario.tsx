"use client";

import { useState } from "react";
import type { Pregunta } from "./tipos";

/** Multiple-choice quiz: each answer is checked on click and explained; the score updates as you go. */
export function Cuestionario({ preguntas }: { preguntas: Pregunta[] }) {
  const [respuestas, setRespuestas] = useState<Record<number, number>>({});
  const aciertos = preguntas.filter((p, i) => respuestas[i] === p.correcta).length;

  return (
    <section className="cuestionario" aria-labelledby="ficha-cuestionario-titulo">
      <header className="quiz-heading">
        <div>
          <p className="quiz-kicker">Hora de practicar</p>
          <h3 id="ficha-cuestionario-titulo">Comprueba lo aprendido</h3>
        </div>
        <p className="quiz-score" aria-label={`${aciertos} de ${preguntas.length} aciertos`}>
          <strong>{aciertos}</strong><span>/ {preguntas.length} aciertos</span>
        </p>
      </header>
      <ol className="quiz-items">
        {preguntas.map((p, i) => {
          const elegida = respuestas[i];
          const respondida = elegida !== undefined;
          return (
            <li key={p.pregunta}>
              <div className="quiz-question">
                <p className="quiz-kicker">
                  Reto {String(i + 1).padStart(2, "0")} / {String(preguntas.length).padStart(2, "0")}
                </p>
                <p>{p.pregunta}</p>
              </div>
              <ol className="quiz-options">
                {p.opciones.map((opcion, j) => {
                  const estado = !respondida ? undefined : j === p.correcta ? "correct" : j === elegida ? "wrong" : undefined;
                  return (
                    <li key={opcion}>
                      <button
                        type="button"
                        className="quiz-option"
                        data-state={estado}
                        disabled={respondida}
                        onClick={() => setRespuestas((r) => ({ ...r, [i]: j }))}
                      >
                        <span className="quiz-option-index" aria-hidden="true">{String.fromCharCode(65 + j)}</span>
                        <span>{opcion}</span>
                      </button>
                    </li>
                  );
                })}
              </ol>
              {respondida && (
                <p className="quiz-feedback" data-state={elegida === p.correcta ? "correct" : "wrong"} role="status">
                  <strong>{elegida === p.correcta ? "¡Correcto! " : "Casi. "}</strong>{p.explicacion}
                </p>
              )}
              {respondida && elegida !== p.correcta && (
                <button
                  type="button"
                  className="quiz-retry"
                  onClick={() => setRespuestas((actual) => {
                    const siguiente = { ...actual };
                    delete siguiente[i];
                    return siguiente;
                  })}
                >
                  Intentar de nuevo
                </button>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
