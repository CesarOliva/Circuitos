import type { Metadata } from "next";
import Link from "next/link";
import "@/components/iso/iso.css";
import "@/components/simulador/simulador.css";
import { Plate } from "@/components/iso/react/draw";
import { CATALOG, specOf } from "@/components/simulador/catalog";
import { Caption, figureNumber } from "@/components/simulador/caption";
import { FAULTS } from "@/components/simulador/faults";
import { ComponentFigure } from "@/components/simulador/figure";
import { TituloConFicha } from "@/components/simulador/fichas/con-ficha";
import { Viewer3D } from "@/components/simulador3d/viewer";

export const metadata: Metadata = {
  title: "Componentes del simulador en fallo",
  description: "Cada fallo de las fichas técnicas de los componentes del simulador de circuitos, dibujado en isométrico y en 3D.",
};

export default async function ComponentesFallosPage({ searchParams }: PageProps<"/componentes/fallos">) {
  const loose = (await searchParams).montaje === "sueltos";
  const total = CATALOG.reduce((sum, { component }) => sum + (FAULTS[component.type] ?? []).length, 0);
  return (
    <main className="iso sim-gallery">
      <header className="sim-header">
        <div className="sim-navs">
          <nav className="sim-nav" aria-label="Vistas">
            <Link href="/componentes">Componentes 2D</Link>
            <Link href="/componentes/3d">Componentes 3D</Link>
            <span aria-current="page">Componentes en fallo</span>
            <Link href="/fichas">Fichas</Link>
          </nav>
          <nav className="sim-nav" aria-label="Montaje">
            {loose ? <Link href="/componentes/fallos">En placa</Link> : <span aria-current="page">En placa</span>}
            {loose ? <span aria-current="page">Sueltos</span> : <Link href="/componentes/fallos?montaje=sueltos">Sueltos</Link>}
          </nav>
        </div>
        <h1>Componentes en fallo</h1>
        <p>
          {total} fallos de las fichas técnicas, cada uno dibujado en isométrico sobre la placa y en 3D{" "}
          {loose ? "con el componente suelto, como sale de la bolsa" : "montado en la placa"}. En rojo, lo que falla: una patilla cortada, un puente de
          cobre entre dos terminales, una grieta o una señal irregular. El cuerpo quemado se ve negro.
        </p>
      </header>
      {CATALOG.map((entry, index) => {
        const spec = specOf(entry);
        const idle = `${spec.terminals.length} terminales`;
        const faults = FAULTS[entry.component.type] ?? [];
        if (!faults.length) return null;
        return (
          <section key={entry.component.id} className="sim-fault-group">
            <TituloConFicha slug={entry.component.type}>{entry.title}</TituloConFicha>
            {faults.map((fault) => (
              <div key={fault.label} className="sim-fault-row">
                <ComponentFigure entry={entry} index={index} fault={fault} />
                <Plate
                  fig={figureNumber(index, spec)}
                  title={`${entry.title} · ${fault.label}`}
                  hint="Arrastra para girar"
                  readout={idle}
                  caption={<Caption spec={spec} fault={fault} />}
                >
                  <Viewer3D spec={spec} idle={idle} mount={loose ? "loose" : "board"} cues={fault.cues} />
                </Plate>
              </div>
            ))}
          </section>
        );
      })}
    </main>
  );
}
