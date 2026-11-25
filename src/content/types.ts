export type CourseArt = "circuit" | "analysis" | "sensors" | "digital" | "generic";

// Animación que acompaña a cada lección.
export type LessonScene =
  | "magnitudes"
  | "ohm"
  | "led"
  | "series-parallel"
  | "capacitor"
  | "power"
  | "divider"
  | "kirchhoff"
  | "mixed"
  | "breadboard";

// Simulador interactivo que se inserta dentro de una lección.
export type PlaygroundKind =
  | "pipe"
  | "ohm"
  | "led"
  | "series-parallel"
  | "capacitor"
  | "power"
  | "divider"
  | "kirchhoff"
  | "mixed"
  | "breadboard";

export type LessonBlock =
  | { type: "paragraph"; text: string }
  | { type: "list"; items: string[]; ordered?: boolean }
  | { type: "code"; language: string; code: string }
  | { type: "formula"; expression: string; caption?: string }
  | { type: "callout"; tone?: "info" | "warning"; title?: string; text: string }
  | { type: "playground"; kind: PlaygroundKind };

export interface Quiz {
  question: string;
  options: string[];
  answer: number;
  explanation: string;
}

// Lo que consume la interfaz. No depende de cómo se guarde el contenido.
export interface Subject {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  courseCount: number;
  lessonCount: number;
}

export interface Course {
  slug: string;
  subjectSlug: string;
  title: string;
  description: string;
  level: string;
  duration: string;
  art: CourseArt;
  lessonCount: number;
}

export interface LessonSummary {
  slug: string;
  title: string;
  summary: string;
}

export interface LessonLink {
  slug: string;
  title: string;
}

export interface CourseDetail extends Course {
  lessons: LessonSummary[];
}

export interface Lesson extends LessonSummary {
  subject: Subject;
  course: Course;
  index: number;
  total: number;
  scene: LessonScene;
  blocks: LessonBlock[];
  quiz: Quiz;
  previous?: LessonLink;
  next?: LessonLink;
}

// Contrato único entre las páginas y el origen del contenido.
// Para pasar a base de datos, se implementa esta interfaz y se cambia el repositorio activo.
export interface ContentRepository {
  listSubjects(): Promise<Subject[]>;
  getSubject(slug: string): Promise<Subject | null>;
  listCourses(subjectSlug?: string): Promise<Course[]>;
  getCourse(subjectSlug: string, courseSlug: string): Promise<CourseDetail | null>;
  getLesson(subjectSlug: string, courseSlug: string, lessonSlug: string): Promise<Lesson | null>;
  getSubjectParams(): Promise<Array<{ asignatura: string }>>;
  getCourseParams(): Promise<Array<{ asignatura: string; curso: string }>>;
  getLessonParams(): Promise<Array<{ asignatura: string; curso: string; leccion: string }>>;
}

// Lo que se escribe a mano hoy y mañana vendrá de la base de datos.
export interface SubjectSource {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  courses: CourseSource[];
}

export interface CourseSource {
  slug: string;
  title: string;
  description: string;
  level: string;
  duration: string;
  art: CourseArt;
  lessons: LessonSource[];
}

export interface LessonSource {
  slug: string;
  title: string;
  summary: string;
  scene: LessonScene;
  blocks: LessonBlock[];
  quiz: Quiz;
}
