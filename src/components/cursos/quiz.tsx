"use client";

import { useState, type CSSProperties } from "react";
import type { Quiz as QuizData } from "@/data/cursos";

// Pregunta de opción múltiple: al elegir se marca la respuesta y se muestra por qué es correcta.
export function Quiz({ quiz }: { quiz: QuizData }) {
  const [selected, setSelected] = useState<number | null>(null);
  const answered = selected !== null;
  const correct = selected === quiz.answer;

  function stateOf(index: number) {
    if (!answered) return undefined;
    if (index === quiz.answer) return "correct";
    if (index === selected) return "wrong";
    return undefined;
  }

  return (
    <section className="quiz" aria-labelledby="quiz-title">
      <h2 id="quiz-title">Comprueba lo aprendido</h2>
      <p>{quiz.question}</p>
      <ol className="quiz-options">
        {quiz.options.map((option, index) => (
          <li key={option} style={{ "--i": index + 2 } as CSSProperties}>
            <button
              type="button"
              className="quiz-option"
              data-state={stateOf(index)}
              disabled={answered}
              onClick={() => setSelected(index)}
            >
              {option}
            </button>
          </li>
        ))}
      </ol>
      {answered && (
        <p
          className="quiz-feedback"
          data-state={correct ? "correct" : "wrong"}
          role="status"
        >
          {correct ? "¡Correcto! " : "Casi. "}
          {quiz.explanation}
        </p>
      )}
      {answered && !correct && (
        <button type="button" className="quiz-retry" onClick={() => setSelected(null)}>
          Intentar de nuevo
        </button>
      )}
    </section>
  );
}
