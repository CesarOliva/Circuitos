import type { CSSProperties } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { content } from "@/content";
import "@/components/cursos/cursos.css";

export const metadata: Metadata = {
  title: "Cursos",
  description: "Cursos cortos por asignatura, con lecciones y un quiz al final de cada una.",
};

export default async function CursosPage() {
  const subjects = await content.listSubjects();

  return (
    <main className="edu">
      <p className="edu-eyebrow">Aprende por asignatura</p>
      <h1>Cursos</h1>
      <p className="edu-lead">
        Elige una asignatura. Cada curso tiene lecciones cortas y un quiz para comprobar lo aprendido.
      </p>
      <ul className="subject-grid">
        {subjects.map((subject, index) => (
          <li key={subject.slug} style={{ "--i": index } as CSSProperties}>
            <Link className="subject-card" href={`/cursos/${subject.slug}`}>
              <span className="subject-card-count">
                {subject.courseCount} {subject.courseCount === 1 ? "curso" : "cursos"}
              </span>
              <h3>{subject.name}</h3>
              <p>{subject.tagline}</p>
              <small>{subject.lessonCount} lecciones en total</small>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
