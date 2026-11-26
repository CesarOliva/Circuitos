import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { content, findLesson } from "@/content";
import { LessonBlocks } from "@/components/cursos/lesson-blocks";
import { Quiz } from "@/components/cursos/quiz";
import { ReadingProgress } from "@/components/cursos/reading-progress";
import { CircuitScene } from "@/components/cursos/circuit-scene";
import "@/components/cursos/cursos.css";

export async function generateStaticParams() {
  return (await content.getLessonParams()).map(({ curso, leccion }) => ({ curso, leccion }));
}

export async function generateMetadata({ params }: PageProps<"/cursos/[curso]/[leccion]">): Promise<Metadata> {
  const { curso, leccion } = await params;
  const lesson = await findLesson(curso, leccion);
  return lesson ? { title: lesson.title, description: lesson.summary } : { title: "Lección no encontrada" };
}

export default async function LeccionPage({ params }: PageProps<"/cursos/[curso]/[leccion]">) {
  const { curso, leccion } = await params;
  const lesson = await findLesson(curso, leccion);
  if (!lesson) notFound();

  const basePath = `/cursos/${lesson.course.slug}`;

  return (
    <main className="edu edu-lesson">
      <ReadingProgress />
      <article className="lesson-document">
        <nav className="edu-breadcrumbs" aria-label="Ruta de navegación">
          <Link href="/cursos">Cursos</Link><span aria-hidden="true">/</span><Link href={basePath}>{lesson.course.title}</Link>
        </nav>
        <header className="lesson-heading">
          <p className="lesson-kicker"><span>Lección {String(lesson.index + 1).padStart(2, "0")} de {String(lesson.total).padStart(2, "0")}</span>{lesson.course.title}</p>
          <h1>{lesson.title}</h1>
          <p className="edu-lead">{lesson.summary}</p>
        </header>
        <CircuitScene scene={lesson.scene} />
        <div className="lesson-reading">
          <LessonBlocks blocks={lesson.blocks} />
          <Quiz key={lesson.slug} quiz={lesson.quiz} />
          <nav className="lesson-pager" aria-label="Lecciones">
            {lesson.previous ? (
              <Link href={`${basePath}/${lesson.previous.slug}`}>
                <small>Lección anterior</small><strong>{lesson.previous.title}</strong>
              </Link>
            ) : <span />}
            {lesson.next ? (
              <Link href={`${basePath}/${lesson.next.slug}`}>
                <small>Siguiente lección</small><strong>{lesson.next.title}</strong>
              </Link>
            ) : <span />}
          </nav>
        </div>
      </article>
    </main>
  );
}
