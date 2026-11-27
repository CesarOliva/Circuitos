import type { Metadata } from "next";
import Link from "next/link";
import "@/components/iso/iso.css";
import "@/components/simulador/simulador.css";
import { CATALOG } from "@/components/simulador/catalog";
import { CoordinateMap } from "@/components/simulador/coordinate-map";

export const metadata: Metadata = {
  title: "Coordenadas de componentes",
  description: "Mapa 2D de las coordenadas compartidas por los componentes del simulador.",
};

export default function CoordenadasPage() {
  return (
    <main className="iso sim-gallery">
      <header className="sim-header">
        <nav className="sim-nav" aria-label="Vistas">
          <Link href="/componentes">2D</Link>
          <Link href="/componentes/3d">3D</Link>
          <span aria-current="page">Coordenadas</span>
        </nav>
        <h1>Mapa de coordenadas</h1>
        <p>
          Cada mapa usa la posición definida para el mismo componente en las vistas isométrica y 3D. El origen (0, 0) está en el centro del protoboard;
          X aumenta hacia la derecha y Y hacia abajo en esta vista superior. Se muestran las cuatro esquinas y el centro del componente, junto con las
          coordenadas de sus terminales. Las medidas son unidades del modelo, no milímetros calibrados.
        </p>
      </header>
      <section className="sim-coordinate-grid" aria-label="Mapas de coordenadas por componente">
        {CATALOG.map((entry) => <CoordinateMap key={entry.component.id} entry={entry} />)}
      </section>
    </main>
  );
}
