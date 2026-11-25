"use client";

import { useState, type CSSProperties } from "react";
import type { Quiz as QuizData } from "@/content";

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
      <header className="quiz-heading">
        <div>
          <p className="quiz-kicker">Hora de practicar</p>
          <h2 id="quiz-title">Comprueba lo aprendido</h2>
        </div>
        <p className="quiz-score" aria-label={`${correct ? 1 : 0} de 1 aciertos`}>
          <strong>{correct ? 1 : 0}</strong><span>/ 1 aciertos</span>
        </p>
      </header>
      <div className="quiz-question">
        <p className="quiz-kicker">Reto 01 / 01</p>
        <p>{quiz.question}</p>
      </div>
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
              <span className="quiz-option-index" aria-hidden="true">{String.fromCharCode(65 + index)}</span>
              <span>{option}</span>
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
