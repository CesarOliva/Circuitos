import type { CSSProperties } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { COURSES, findCourse, findLesson } from "@/data/cursos";
import { Quiz } from "@/components/cursos/quiz";
import "@/components/cursos/cursos.css";

export function generateStaticParams() {
  return COURSES.flatMap((course) => course.lessons.map((lesson) => ({ curso: course.slug, leccion: lesson.slug })));
}

export async function generateMetadata({ params }: PageProps<"/cursos/[curso]/[leccion]">): Promise<Metadata> {
  const { curso, leccion } = await params;
  const course = findCourse(curso);
  const found = course && findLesson(course, leccion);
  return found ? { title: found.lesson.title } : { title: "Lección no encontrada" };
}

export default async function LeccionPage({ params }: PageProps<"/cursos/[curso]/[leccion]">) {
  const { curso, leccion } = await params;
  const course = findCourse(curso);
  const found = course && findLesson(course, leccion);
  if (!course || !found) notFound();

  const { lesson, index } = found;
  const previous = course.lessons[index - 1];
  const next = course.lessons[index + 1];

  return (
    <main className="edu">
      <Link className="edu-back" href={`/cursos/${course.slug}`}>← {course.title}</Link>
      <p className="edu-eyebrow">Lección {index + 1} de {course.lessons.length}</p>
      <h1>{lesson.title}</h1>
      <p className="edu-lead">{lesson.summary}</p>
      <div className="lesson-body">
        {lesson.paragraphs.map((paragraph, paragraphIndex) => (
          <p key={paragraph} style={{ "--i": paragraphIndex } as CSSProperties}>{paragraph}</p>
        ))}
      </div>
      <Quiz key={lesson.slug} quiz={lesson.quiz} />
      <nav className="lesson-pager" aria-label="Lecciones">
        {previous ? (
          <Link href={`/cursos/${course.slug}/${previous.slug}`}>
            <small>Anterior</small>
            <strong>{previous.title}</strong>
          </Link>
        ) : <span />}
        {next ? (
          <Link href={`/cursos/${course.slug}/${next.slug}`}>
            <small>Siguiente</small>
            <strong>{next.title}</strong>
          </Link>
        ) : <span />}
      </nav>
    </main>
  );
}
