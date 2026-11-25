import type { CSSProperties } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { content } from "@/content";
import { CourseArt } from "@/components/cursos/course-art";
import "@/components/cursos/cursos.css";

export async function generateStaticParams() {
  return content.getSubjectParams();
}

export async function generateMetadata({ params }: PageProps<"/cursos/[asignatura]">): Promise<Metadata> {
  const subject = await content.getSubject((await params).asignatura);
  return subject ? { title: subject.name, description: subject.tagline } : { title: "Asignatura no encontrada" };
}

export default async function AsignaturaPage({ params }: PageProps<"/cursos/[asignatura]">) {
  const { asignatura } = await params;
  const subject = await content.getSubject(asignatura);
  if (!subject) notFound();

  const courses = await content.listCourses(subject.slug);

  return (
    <main className="edu">
      <Link className="edu-back" href="/cursos">← Todas las asignaturas</Link>
      <p className="edu-eyebrow">
        {subject.courseCount} {subject.courseCount === 1 ? "curso" : "cursos"} · {subject.lessonCount} lecciones
      </p>
      <h1>{subject.name}</h1>
      <p className="edu-lead">{subject.description}</p>
      <h2>Cursos</h2>
      {courses.length ? (
        <ul className="course-grid">
          {courses.map((course, index) => (
            <li key={course.slug} style={{ "--i": index } as CSSProperties}>
              <Link className="course-card" href={`/cursos/${subject.slug}/${course.slug}`}>
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
      ) : (
        <p className="edu-lead">Todavía no hay cursos publicados para esta asignatura.</p>
      )}
    </main>
  );
}
