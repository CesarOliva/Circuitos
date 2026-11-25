import type { ReactNode } from "react";
import { content } from "@/content";
import { Mascot } from "@/components/cursos/mascot";
import "@/components/cursos/cursos.css";

export default async function CursosLayout({ children }: { children: ReactNode }) {
  const courses = await content.listCourses();

  return (
    <>
      {children}
      <Mascot courses={courses} />
    </>
  );
}
