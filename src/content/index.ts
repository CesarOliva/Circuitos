import { staticContentRepository } from "./static-repository";
import type { ContentRepository } from "./types";

// Único punto donde se elige el origen del contenido.
// Al conectar la base de datos, basta con reemplazar esta asignación por su implementación.
export const content: ContentRepository = staticContentRepository;

export type {
  ContentRepository,
  Course,
  CourseArt,
  CourseDetail,
  CourseSource,
  Lesson,
  LessonBlock,
  LessonLink,
  LessonSource,
  LessonSummary,
  Quiz,
  Subject,
  SubjectSource,
} from "./types";
