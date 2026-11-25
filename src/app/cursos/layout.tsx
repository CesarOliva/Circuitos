import type { ReactNode } from "react";
import { Mascot } from "@/components/cursos/mascot";
import "@/components/cursos/cursos.css";

export default function CursosLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <Mascot />
    </>
  );
}
