import type { CSSProperties } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { COURSES } from "@/data/cursos";
import { CourseArt } from "@/components/cursos/course-art";
import "@/components/cursos/cursos.css";

export const metadata: Metadata = {
  title: "Cursos",
  description: "Cursos cortos de electrónica con cálculos que puedes repetir en el simulador.",
};

export default function CursosPage() {
  return (
    <main className="edu">
      <p className="edu-eyebrow">Aprende electrónica</p>
      <h1>Cursos</h1>
      <p className="edu-lead">Lecciones cortas, con cálculos que puedes repetir en el simulador y un quiz al final de cada una.</p>
      <ul className="course-grid">
        {COURSES.map((course, index) => (
          <li key={course.slug} style={{ "--i": index } as CSSProperties}>
            <Link className="course-card" href={`/cursos/${course.slug}`}>
              <CourseArt />
              <h3>{course.title}</h3>
              <p>{course.description}</p>
              <small>
                {course.level} · {course.lessons.length} lecciones · {course.duration}
              </small>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
