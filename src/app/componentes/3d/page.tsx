import type { Metadata } from "next";
import Link from "next/link";
import "@/components/iso/iso.css";
import "@/components/simulador/simulador.css";
import { Plate } from "@/components/iso/react/draw";
import { CATALOG, specOf } from "@/components/simulador/catalog";
import { BOARD_LIST, specOfBoard } from "@/components/simulador/boards";
import { Caption, figureNumber } from "@/components/simulador/caption";
import { Viewer3D } from "@/components/simulador3d/viewer";

export const metadata: Metadata = {
  title: "Componentes del simulador en 3D",
  description: "Cada clase de componente del simulador de circuitos como un modelo 3D que se puede girar, en su placa o suelto, con sus terminales.",
};

export default async function Componentes3DPage({ searchParams }: PageProps<"/componentes/3d">) {
  const loose = (await searchParams).montaje === "sueltos";
  const specs = CATALOG.map(specOf);
  return (
    <main className="iso sim-gallery">
      <header className="sim-header">
        <div className="sim-navs">
          <nav className="sim-nav" aria-label="Vistas">
            <Link href="/componentes">Isométrico</Link>
            <span aria-current="page">3D</span>
            <Link href="/componentes/fallos">Fallos</Link>
          </nav>
          <nav className="sim-nav" aria-label="Montaje">
            {loose ? <Link href="/componentes/3d">En placa</Link> : <span aria-current="page">En placa</span>}
            {loose ? <span aria-current="page">Sueltos</span> : <Link href="/componentes/3d?montaje=sueltos">Sueltos</Link>}
          </nav>
        </div>
        <h1>Componentes del simulador en 3D</h1>
        <p>
          {loose
            ? `Los mismos ${specs.length} componentes sueltos, como salen de la bolsa: con sus patitas, pines o cables libres.`
            : `Los mismos ${specs.length} componentes, montados en la misma placa.`}{" "}
          Arrastra para rotar y usa Ctrl o ⌘ con la rueda para acercarte; pasa el puntero sobre un terminal, o enfoca la tarjeta y usa las flechas,
          para seguirlo {loose ? "hasta su punta" : "hasta su borne"}.
        </p>
      </header>
      <section className="sim-grid">
        {specs.map((spec, index) => {
          const idle = `${spec.terminals.length} terminales`;
          return (
            <Plate key={spec.id} fig={figureNumber(index, spec)} title={spec.title} hint="Arrastra para girar" readout={idle} caption={<Caption spec={spec} />}>
              <Viewer3D key="stage" spec={spec} idle={idle} mount={loose ? "loose" : "board"} />
            </Plate>
          );
        })}
        {BOARD_LIST.map((design, index) => {
          const spec = specOfBoard(design);
          const idle = `${spec.terminals.length} terminales`;
          return (
            <Plate key={spec.id} fig={figureNumber(specs.length + index, spec)} title={spec.title} hint="Arrastra para girar" readout={idle} caption={<Caption spec={spec} />}>
              <Viewer3D spec={spec} idle={idle} mount={loose ? "loose" : "board"} />
            </Plate>
          );
        })}
      </section>
    </main>
  );
}
