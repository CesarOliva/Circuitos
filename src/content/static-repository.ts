import type {
  ContentRepository,
  Course,
  CourseDetail,
  CourseSource,
  Lesson,
  LessonSource,
  LessonSummary,
  Subject,
  SubjectSource,
} from "./types";
import { STATIC_SUBJECTS } from "./static";

function subjectOf(source: SubjectSource): Subject {
  return {
    slug: source.slug,
    name: source.name,
    tagline: source.tagline,
    description: source.description,
    courseCount: source.courses.length,
    lessonCount: source.courses.reduce((total, course) => total + course.lessons.length, 0),
  };
}

function courseOf(subject: SubjectSource, source: CourseSource): Course {
  return {
    slug: source.slug,
    subjectSlug: subject.slug,
    title: source.title,
    description: source.description,
    level: source.level,
    duration: source.duration,
    art: source.art,
    lessonCount: source.lessons.length,
  };
}

function lessonSummaryOf(source: LessonSource): LessonSummary {
  return {
    slug: source.slug,
    title: source.title,
    summary: source.summary,
  };
}

class StaticContentRepository implements ContentRepository {
  async listSubjects(): Promise<Subject[]> {
    return STATIC_SUBJECTS.map(subjectOf);
  }

  async getSubject(slug: string): Promise<Subject | null> {
    const source = STATIC_SUBJECTS.find((subject) => subject.slug === slug);
    return source ? subjectOf(source) : null;
  }

  async listCourses(subjectSlug?: string): Promise<Course[]> {
    const subjects = subjectSlug
      ? STATIC_SUBJECTS.filter((subject) => subject.slug === subjectSlug)
      : STATIC_SUBJECTS;
    return subjects.flatMap((subject) => subject.courses.map((course) => courseOf(subject, course)));
  }

  async getCourse(subjectSlug: string, courseSlug: string): Promise<CourseDetail | null> {
    const subject = STATIC_SUBJECTS.find((item) => item.slug === subjectSlug);
    const source = subject?.courses.find((course) => course.slug === courseSlug);
    if (!subject || !source) return null;
    return {
      ...courseOf(subject, source),
      lessons: source.lessons.map(lessonSummaryOf),
    };
  }

  async getLesson(subjectSlug: string, courseSlug: string, lessonSlug: string): Promise<Lesson | null> {
    const subject = STATIC_SUBJECTS.find((item) => item.slug === subjectSlug);
    const course = subject?.courses.find((item) => item.slug === courseSlug);
    const index = course?.lessons.findIndex((lesson) => lesson.slug === lessonSlug) ?? -1;
    if (!subject || !course || index === -1) return null;

    const source = course.lessons[index];
    const previous = course.lessons[index - 1];
    const next = course.lessons[index + 1];

    return {
      ...lessonSummaryOf(source),
      subject: subjectOf(subject),
      course: courseOf(subject, course),
      index,
      total: course.lessons.length,
      blocks: source.blocks,
      quiz: source.quiz,
      previous: previous ? { slug: previous.slug, title: previous.title } : undefined,
      next: next ? { slug: next.slug, title: next.title } : undefined,
    };
  }

  async getSubjectParams(): Promise<Array<{ asignatura: string }>> {
    return STATIC_SUBJECTS.map((subject) => ({ asignatura: subject.slug }));
  }

  async getCourseParams(): Promise<Array<{ asignatura: string; curso: string }>> {
    return STATIC_SUBJECTS.flatMap((subject) =>
      subject.courses.map((course) => ({ asignatura: subject.slug, curso: course.slug })),
    );
  }

  async getLessonParams(): Promise<Array<{ asignatura: string; curso: string; leccion: string }>> {
    return STATIC_SUBJECTS.flatMap((subject) =>
      subject.courses.flatMap((course) =>
        course.lessons.map((lesson) => ({ asignatura: subject.slug, curso: course.slug, leccion: lesson.slug })),
      ),
    );
  }
}

export const staticContentRepository = new StaticContentRepository();