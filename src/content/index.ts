import { staticContentRepository } from "./static-repository";
import type { ContentRepository } from "./types";

// Único punto donde se elige el origen del contenido.
// Al conectar la base de datos, basta con reemplazar esta asignación por su implementación.
export const content: ContentRepository = staticContentRepository;

// Las URLs usan solo el slug del curso (/cursos/circuitos-basicos), así que la asignatura se busca aquí.
export async function findCourse(courseSlug: string) {
  const course = (await content.listCourses()).find((item) => item.slug === courseSlug);
  return course ? content.getCourse(course.subjectSlug, course.slug) : null;
}

export async function findLesson(courseSlug: string, lessonSlug: string) {
  const course = await findCourse(courseSlug);
  return course ? content.getLesson(course.subjectSlug, course.slug, lessonSlug) : null;
}

export type {
  ContentRepository,
  Course,
  CourseArt,
  CourseDetail,
  CourseSource,
  Lesson,
  LessonBlock,
  LessonLink,
  LessonScene,
  LessonSource,
  LessonSummary,
  PlaygroundKind,
  Quiz,
  Subject,
  SubjectSource,
} from "./types";
