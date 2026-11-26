import type { CSSProperties } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { content } from "@/content";
import { CourseArt } from "@/components/cursos/course-art";
import "@/components/cursos/cursos.css";

export const metadata: Metadata = {
  title: "Cursos",
  description: "Cursos cortos por asignatura, con lecciones y un quiz al final de cada una.",
};

export default async function CursosPage() {
  const courses = await content.listCourses();

  return (
    <main className="edu">
      <p className="edu-eyebrow">Aprende por asignatura</p>
      <h1>Cursos</h1>
      <p className="edu-lead">
        Elige un curso. Cada uno tiene lecciones cortas y un quiz para comprobar lo aprendido.
      </p>
      <ul className="course-grid">
        {courses.map((course, index) => (
          <li key={`${course.subjectSlug}/${course.slug}`} style={{ "--i": index } as CSSProperties }>
            <Link className="course-card" href={`/cursos/${course.slug}`}>
              <CourseArt kind={course.art} label={course.title} />
              <h3>{course.title}</h3>
              <p>{course.description}</p>
              <small>
                {course.level} · {course.lessonCount} lecciones · {course.duration}
              </small>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
