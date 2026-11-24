import type { Metadata } from "next";
import { LoginForm } from "@/components/cursos/login-form";
import "@/components/cursos/cursos.css";

export const metadata: Metadata = {
  title: "Iniciar sesión",
  description: "Inicia sesión para guardar tu progreso en los cursos.",
};

export default function IniciarSesionPage() {
  return (
    <main className="edu">
      <LoginForm />
    </main>
  );
}
