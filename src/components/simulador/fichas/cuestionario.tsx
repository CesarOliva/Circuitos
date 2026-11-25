"use client";

import { useState } from "react";
import type { Pregunta } from "./tipos";

/** Multiple-choice quiz: each answer is checked on click and explained; the score updates as you go. */
export function Cuestionario({ preguntas }: { preguntas: Pregunta[] }) {
  const [respuestas, setRespuestas] = useState<Record<number, number>>({});
  const contestadas = Object.keys(respuestas).length;
  const aciertos = preguntas.filter((p, i) => respuestas[i] === p.correcta).length;

  return (
    <div className="cuestionario">
      <ol>
        {preguntas.map((p, i) => {
          const elegida = respuestas[i];
          const respondida = elegida !== undefined;
          return (
            <li key={p.pregunta}>
              <fieldset disabled={respondida}>
                <legend>{p.pregunta}</legend>
                <div className="cuestionario-opciones">
                  {p.opciones.map((opcion, j) => {
                    const estado = !respondida ? "" : j === p.correcta ? " correcta" : j === elegida ? " incorrecta" : "";
                    return (
                      <button key={opcion} type="button" className={`cuestionario-opcion${estado}`} onClick={() => setRespuestas((r) => ({ ...r, [i]: j }))}>
                        {opcion}
                      </button>
                    );
                  })}
                </div>
                {respondida && (
                  <p className="cuestionario-explicacion" role="status">
                    <strong>{elegida === p.correcta ? "Correcto." : "Incorrecto."}</strong> {p.explicacion}
                  </p>
                )}
              </fieldset>
            </li>
          );
        })}
      </ol>
      <p className="cuestionario-puntaje">
        Puntuación: {aciertos} / {preguntas.length}
        {contestadas > 0 && (
          <button type="button" onClick={() => setRespuestas({})}>
            Reiniciar
          </button>
        )}
      </p>
    </div>
  );
}
