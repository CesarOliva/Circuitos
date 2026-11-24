import type { CSSProperties } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { COURSES, findCourse } from "@/data/cursos";
import { CourseArt } from "@/components/cursos/course-art";
import "@/components/cursos/cursos.css";

export function generateStaticParams() {
  return COURSES.map((course) => ({ curso: course.slug }));
}

export async function generateMetadata({ params }: PageProps<"/cursos/[curso]">): Promise<Metadata> {
  const course = findCourse((await params).curso);
  return course ? { title: course.title, description: course.description } : { title: "Curso no encontrado" };
}

export default async function CursoPage({ params }: PageProps<"/cursos/[curso]">) {
  const course = findCourse((await params).curso);
  if (!course) notFound();

  return (
    <main className="edu">
      <Link className="edu-back" href="/cursos">← Todos los cursos</Link>
      <div className="course-hero">
        <div>
          <p className="edu-eyebrow">{course.level}</p>
          <h1>{course.title}</h1>
          <p className="edu-lead">{course.description}</p>
          <div className="edu-meta">
            <span>{course.lessons.length} lecciones</span>
            <span>{course.duration}</span>
          </div>
        </div>
        <CourseArt />
      </div>
      <h2>Lecciones</h2>
      <ol className="lesson-list">
        {course.lessons.map((lesson, index) => (
          <li key={lesson.slug} style={{ "--i": index } as CSSProperties}>
            <Link className="lesson-link" href={`/cursos/${course.slug}/${lesson.slug}`}>
              <span className="lesson-num" aria-hidden="true">{index + 1}</span>
              <span>
                <strong>{lesson.title}</strong>
                <span className="lesson-summary">{lesson.summary}</span>
              </span>
              <span className="lesson-go">Empezar →</span>
            </Link>
          </li>
        ))}
      </ol>
    </main>
  );
}
