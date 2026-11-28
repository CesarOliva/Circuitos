import { FICHAS, GrupoFicha, LECCIONES } from "@/components/simulador/fichas";
import { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Fichas técnicas",
  description: "Ficha técnica, fallos, validación de voltajes y lección de cada componente del simulador.",
};

export default function FichasPage() {
  const grupos = new Map<GrupoFicha, typeof FICHAS>();
  for (const ficha of FICHAS) grupos.set(ficha.grupo, [...(grupos.get(ficha.grupo) ?? []), ficha]);

  return (
    <main className="iso sim-gallery ficha">
      <header className="sim-header">
        <div className="sim-navs">
          <nav className="sim-nav" aria-label="Secciones">
            <Link href="/componentes">Componentes 2D</Link>
            <Link href="/componentes/3d">Componentes 3D</Link>
            <Link href="/componentes/fallos">Componentes en fallo</Link>
            <span aria-current="page">Fichas</span>
          </nav>
        </div>
        <h1>Fichas técnicas</h1>
        <p>
          {FICHAS.length} componentes del simulador. Cada ficha reúne especificaciones, pines, validación de voltajes, fallos comunes y una lección con
          práctica y cuestionario.
        </p>
      </header>
      {[...grupos].map(([grupo, fichas]) => (
        <section key={grupo} className="fichas-grupo" aria-labelledby={`grupo-${grupo}`}>
          <h2 id={`grupo-${grupo}`}>{grupo}</h2>
          <ul>
            {fichas.map((ficha) => (
              <li key={ficha.slug}>
                <Link href={`/fichas/${ficha.slug}`}>
                  <strong>{ficha.titulo}</strong>
                  {ficha.resumen}
                  <span>
                    Lección {LECCIONES[ficha.slug].nivel} · {LECCIONES[ficha.slug].duracion}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </main>
  );
}
