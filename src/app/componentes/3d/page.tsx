import type { Metadata } from "next";
import Link from "next/link";
import "@/components/iso/iso.css";
import "@/components/simulador/simulador.css";
import { Plate } from "@/components/iso/react/draw";
import { CATALOG, specOf } from "@/components/simulador/catalog";
import { Caption, figureNumber } from "@/components/simulador/caption";
import { Viewer3D } from "@/components/simulador3d/viewer";

export const metadata: Metadata = {
  title: "Componentes del simulador en 3D",
  description: "Cada clase de componente del simulador de circuitos como un modelo 3D que se puede girar, con sus terminales.",
};

export default function Componentes3DPage() {
  const specs = CATALOG.map(specOf);
  return (
    <main className="iso sim-gallery">
      <header className="sim-header">
        <nav className="sim-nav" aria-label="Vistas">
          <Link href="/componentes">Isométrico</Link>
          <span aria-current="page">3D</span>
        </nav>
        <h1>Componentes del simulador en 3D</h1>
        <p>
          Los mismos {specs.length} componentes, montados en la misma placa, como modelos que puedes girar. Arrastra para rotar y usa Ctrl o ⌘ con la
          rueda para acercarte; pasa el puntero sobre un terminal, o enfoca la tarjeta y usa las flechas, para seguirlo hasta su borne.
        </p>
      </header>
      <section className="sim-grid">
        {specs.map((spec, index) => {
          const idle = `${spec.terminals.length} terminales`;
          return (
            <Plate key={spec.id} fig={figureNumber(index, spec)} title={spec.title} hint="Arrastra para girar" readout={idle} caption={<Caption spec={spec} />}>
              <Viewer3D key="stage" spec={spec} idle={idle} />
            </Plate>
          );
        })}
      </section>
    </main>
  );
}
