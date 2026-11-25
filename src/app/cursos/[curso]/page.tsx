import type { CSSProperties } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { content, findCourse } from "@/content";
import { CourseArt } from "@/components/cursos/course-art";
import "@/components/cursos/cursos.css";

export async function generateStaticParams() {
  return (await content.getCourseParams()).map(({ curso }) => ({ curso }));
}

export async function generateMetadata({ params }: PageProps<"/cursos/[curso]">): Promise<Metadata> {
  const course = await findCourse((await params).curso);
  return course ? { title: course.title, description: course.description } : { title: "Curso no encontrado" };
}

export default async function CursoPage({ params }: PageProps<"/cursos/[curso]">) {
  const course = await findCourse((await params).curso);
  if (!course) notFound();

  return (
    <main className="edu edu-course">
      <Link className="edu-back" href="/cursos">← Cursos</Link>
      <header className="course-hero course-intro">
        <div>
          <h1>{course.title}</h1>
          <p className="edu-lead">{course.description}</p>
          <div className="edu-meta">
            <span>{course.level}</span>
            <span>{course.lessonCount} lecciones</span>
            <span>{course.duration}</span>
          </div>
        </div>
        <CourseArt kind={course.art} label={course.title} />
      </header>
      <section className="course-outline" aria-labelledby="course-outline-title">
        <div className="course-outline-heading">
          <div>
            <h2 id="course-outline-title">Contenido del curso</h2>
            <p>Avanza a tu ritmo. Cada lección termina con una pregunta para repasar.</p>
          </div>
          <span>{course.lessonCount} lecciones</span>
        </div>
        <ol className="lesson-list">
          {course.lessons.map((lesson, index) => (
            <li key={lesson.slug} style={{ "--i": index } as CSSProperties}>
              <Link className="lesson-link" href={`/cursos/${course.slug}/${lesson.slug}`}>
                <span className="lesson-num" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                <span className="lesson-link-copy">
                  <strong>{lesson.title}</strong>
                  <span className="lesson-summary">{lesson.summary}</span>
                </span>
                <span className="lesson-go">Leer lección →</span>
              </Link>
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}
