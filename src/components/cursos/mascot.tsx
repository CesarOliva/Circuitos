"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import type { Course } from "@/content";
import { replyTo } from "./assistant";

interface Message {
  from: "bot" | "user";
  text: string;
}

const GREETING = "¡Hola! Soy Chip, tu asistente de cursos. Pronto podré responder tus dudas con IA. Por ahora, elige un curso o escribe tu pregunta.";

// Mascota flotante con chat. Las respuestas salen de replyTo (ver assistant.ts).
export function Mascot({ courses }: { courses: Course[] }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([{ from: "bot", text: GREETING }]);
  const [draft, setDraft] = useState("");
  const [thinking, setThinking] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = draft.trim();
    if (!text || thinking) return;
    setDraft("");
    setMessages((current) => [...current, { from: "user", text }]);
    setThinking(true);
    const reply = await replyTo(text);
    setMessages((current) => [...current, { from: "bot", text: reply }]);
    setThinking(false);
  }

  return (
    <div className="mascot">
      {open && (
        <section className="mascot-panel" aria-label="Asistente Chip">
          <header className="mascot-head">
            <strong>Chip</strong>
            <span>Asistente en preparación</span>
          </header>
          <ol className="mascot-log" aria-live="polite">
            {messages.map((message, index) => (
              <li key={index} className={`mascot-msg mascot-msg-${message.from}`}>
                {message.text}
              </li>
            ))}
            {thinking && (
              <li className="mascot-msg mascot-msg-bot mascot-typing" aria-label="Chip está escribiendo">
                <span />
                <span />
                <span />
              </li>
            )}
          </ol>
          <div className="mascot-links">
            {courses.map((course) => (
              <Link key={`${course.subjectSlug}/${course.slug}`} href={`/cursos/${course.subjectSlug}/${course.slug}`}>
                {course.title}
              </Link>
            ))}
          </div>
          <form className="mascot-form" onSubmit={handleSubmit}>
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Pregunta sobre tus cursos…"
              aria-label="Escribe tu pregunta"
            />
            <button type="submit" disabled={thinking}>Enviar</button>
          </form>
        </section>
      )}
      <button
        type="button"
        className="mascot-face"
        aria-expanded={open}
        aria-label={open ? "Cerrar el asistente" : "Abrir el asistente Chip"}
        onClick={() => setOpen((value) => !value)}
      >
        <svg viewBox="0 0 64 64" aria-hidden="true">
          <line className="mascot-antenna" x1="32" y1="10" x2="32" y2="16" />
          <circle className="mascot-antenna-tip" cx="32" cy="7" r="3.5" />
          <rect className="mascot-ear" x="4" y="28" width="6" height="12" rx="2" />
          <rect className="mascot-ear" x="54" y="28" width="6" height="12" rx="2" />
          <rect className="mascot-head-shape" x="10" y="16" width="44" height="40" rx="12" />
          <rect className="mascot-eye" x="20" y="28" width="7" height="10" rx="2" />
          <rect className="mascot-eye" x="37" y="28" width="7" height="10" rx="2" />
          <path className="mascot-mouth" d="M24 44 Q32 49 40 44" />
        </svg>
      </button>
    </div>
  );
}
