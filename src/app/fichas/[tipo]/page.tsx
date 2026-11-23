import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import "@/components/iso/iso.css";
import "@/components/simulador/simulador.css";
import "@/components/simulador/fichas/fichas.css";
import { ComponentFigure } from "@/components/simulador/figure";
import { formatProperty, specOf } from "@/components/simulador/catalog";
import { FICHAS, LECCIONES, entradaDeFicha, fichaPorSlug } from "@/components/simulador/fichas";
import { Cuestionario } from "@/components/simulador/fichas/cuestionario";
import { Validador } from "@/components/simulador/fichas/validador";
import { BOARD_SPECS, describirLimite, describirRango, formatear, formatearValor, specPorFicha, type BoardSpecId } from "@/data/componentSpecs";

// Only the sheets that exist; anything else is a 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return FICHAS.map((ficha) => ({ tipo: ficha.slug }));
}

export async function generateMetadata({ params }: PageProps<"/fichas/[tipo]">): Promise<Metadata> {
  const ficha = fichaPorSlug((await params).tipo);
  if (!ficha) return {};
  return { title: `${ficha.titulo} · Ficha técnica`, description: ficha.resumen };
}

const SECCIONES = [
  ["descripcion", "Descripción"],
  ["especificaciones", "Especificaciones"],
  ["pines", "Pines"],
  ["validacion", "Validación de voltajes"],
  ["simulador", "En el simulador"],
  ["pruebas", "Pruebas recomendadas"],
  ["fallos", "Fallos y problemas"],
  ["leccion", "Lección"],
] as const;

export default async function FichaPage({ params }: PageProps<"/fichas/[tipo]">) {
  const { tipo } = await params;
  const ficha = fichaPorSlug(tipo);
  if (!ficha) notFound();

  const leccion = LECCIONES[ficha.slug];
  const esquema = specPorFicha(ficha.slug);
  const placa = ficha.slug in BOARD_SPECS ? BOARD_SPECS[ficha.slug as BoardSpecId] : undefined;
  const tarjeta = entradaDeFicha(ficha);
  const spec = tarjeta ? specOf(tarjeta.entry) : undefined;
  const posicion = FICHAS.indexOf(ficha);
  const anterior = FICHAS[posicion - 1];
  const siguiente = FICHAS[posicion + 1];

  return (
    <main className="iso sim-gallery ficha">
      <header className="sim-header">
        <div className="sim-navs">
          <nav className="sim-nav" aria-label="Secciones">
            <Link href="/fichas">Fichas</Link>
            <Link href="/componentes">Galería</Link>
            <Link href="/">Playground</Link>
          </nav>
        </div>
        <p className="ficha-ruta">
          <Link href="/fichas">Fichas técnicas</Link> / {ficha.grupo}
        </p>
        <h1>{ficha.titulo}</h1>
        <p>{ficha.resumen}</p>
        <p className="ficha-clase">
          <code>{ficha.clase}</code> · <code>{ficha.archivo}</code>
        </p>
      </header>

      <div className="ficha-cuerpo">
        <nav className="ficha-indice" aria-label="Secciones de la ficha">
          {SECCIONES.map(([id, texto]) => (
            <a key={id} href={`#${id}`}>
              {texto}
            </a>
          ))}
        </nav>

        <div className="ficha-contenido">
          <section id="descripcion" className={tarjeta ? "ficha-intro" : undefined}>
            {tarjeta && <ComponentFigure entry={tarjeta.entry} index={tarjeta.index} />}
            <div>
              <h2>Descripción</h2>
              {ficha.descripcion.map((parrafo) => (
                <p key={parrafo}>{parrafo}</p>
              ))}
            </div>
          </section>

          <section id="especificaciones">
            <h2>Especificaciones eléctricas</h2>
            <div className="ficha-tabla">
              <table>
                <thead>
                  <tr>
                    <th scope="col">Parámetro</th>
                    <th scope="col">En el simulador</th>
                    <th scope="col">Componente real</th>
                  </tr>
                </thead>
                <tbody>
                  {ficha.especificaciones.map((fila) => (
                    <tr key={fila.parametro}>
                      <th scope="row">{fila.parametro}</th>
                      <td>{fila.simulador}</td>
                      <td>{fila.real}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {spec && (
              <>
                <h3>
                  Propiedades de la instancia de la galería <code>({spec.id})</code>
                </h3>
                <dl className="sim-properties ficha-propiedades">
                  {Object.entries(spec.properties).map(([clave, valor]) => (
                    <div key={clave}>
                      <dt>{clave}</dt>
                      <dd>{formatProperty(clave, valor)}</dd>
                    </div>
                  ))}
                </dl>
              </>
            )}
          </section>

          <section id="pines">
            <h2>Pines</h2>
            <div className="ficha-tabla">
              <table>
                <thead>
                  <tr>
                    <th scope="col">Pin</th>
                    <th scope="col">Nombre</th>
                    <th scope="col">Función</th>
                  </tr>
                </thead>
                <tbody>
                  {ficha.pines.map((pin) => (
                    <tr key={pin.id}>
                      <th scope="row">
                        <code>{pin.id}</code>
                      </th>
                      <td>{pin.nombre}</td>
                      <td>{pin.funcion}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section id="validacion">
            <h2>Validación de voltajes</h2>
            <p>
              Límites definidos en <code>src/data/componentSpecs.ts</code>. El validador de abajo arma un circuito de prueba, lo resuelve con el
              simulador y aplica estas reglas: cambia los valores para ver cuándo el componente sale de su rango seguro.
            </p>
            {esquema?.valor && (
              <p>
                <strong>{esquema.valor.etiqueta} configurable:</strong> {describirRango(esquema.valor)} (por defecto{" "}
                {formatearValor(esquema.valor, esquema.valor.porDefecto)}). Fuera de ese rango no se simula.
                {esquema.valor.recomendado && (
                  <>
                    {" "}
                    Recomendado: {describirRango(esquema.valor, esquema.valor.recomendado)}. {esquema.valor.recomendado.motivo}
                  </>
                )}
              </p>
            )}
            {esquema && esquema.limites.length > 0 && (
              <div className="ficha-tabla">
                <table>
                  <thead>
                    <tr>
                      <th scope="col">Magnitud</th>
                      <th scope="col">Mínimo</th>
                      <th scope="col">Máximo</th>
                      <th scope="col">Si se sale del rango</th>
                    </tr>
                  </thead>
                  <tbody>
                    {esquema.limites.map((limite) => {
                      const texto = describirLimite(limite, esquema.valor?.etiqueta.toLowerCase());
                      return (
                        <tr key={`${limite.magnitud}-${limite.max ?? limite.maxRelativo}-${limite.min ?? limite.minRelativo}`}>
                          <th scope="row">{texto.magnitud}</th>
                          <td>{texto.min}</td>
                          <td>{texto.max}</td>
                          <td>
                            <span className={`ficha-nivel ficha-nivel-${limite.nivel}`}>{limite.nivel}</span> {limite.motivo}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            {placa && (
              <div className="ficha-tabla">
                <table>
                  <tbody>
                    <tr>
                      <th scope="row">Nivel lógico</th>
                      <td>{formatear(placa.voltajeLogico, "V")}</td>
                    </tr>
                    <tr>
                      <th scope="row">Entrada analógica</th>
                      <td>
                        {formatear(placa.entradaAnalogica.min, "V")} – {formatear(placa.entradaAnalogica.max, "V")} (runSketch rechaza valores fuera de rango)
                      </td>
                    </tr>
                    <tr>
                      <th scope="row">Corriente por pin</th>
                      <td>
                        {formatear(placa.corrientePorPin.recomendada, "A")} recomendada, {formatear(placa.corrientePorPin.max, "A")} máximo absoluto
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
            {esquema && esquema.reglas.length > 0 && (
              <>
                <h3>Reglas de conexión</h3>
                <ul>
                  {esquema.reglas.map((regla) => (
                    <li key={regla}>{regla}</li>
                  ))}
                </ul>
              </>
            )}
            <Validador slug={ficha.slug} />
          </section>

          <section id="simulador">
            <h2>Funcionamiento en el simulador</h2>
            {ficha.simulador.modelo.map((parrafo) => (
              <p key={parrafo}>{parrafo}</p>
            ))}
            <p>
              <strong>Qué puedes cambiar:</strong> {ficha.simulador.editable}
            </p>
            <h3>Lecturas</h3>
            <dl className="ficha-lecturas">
              {ficha.simulador.lecturas.map((lectura) => (
                <div key={lectura.clave}>
                  <dt>
                    <code>{lectura.clave}</code>
                  </dt>
                  <dd>{lectura.significado}</dd>
                </div>
              ))}
            </dl>
            <h3>Limitaciones del modelo</h3>
            <ul>
              {ficha.simulador.limitaciones.map((texto) => (
                <li key={texto}>{texto}</li>
              ))}
            </ul>
          </section>

          <section id="pruebas">
            <h2>Pruebas recomendadas</h2>
            <ol className="ficha-pruebas">
              {ficha.pruebas.map((prueba) => (
                <li key={prueba.titulo}>
                  <h3>{prueba.titulo}</h3>
                  <p>
                    <span className="ficha-etiqueta">Montaje</span> {prueba.montaje}
                  </p>
                  <ol>
                    {prueba.pasos.map((paso) => (
                      <li key={paso}>{paso}</li>
                    ))}
                  </ol>
                  {prueba.codigo && (
                    <pre>
                      <code>{prueba.codigo}</code>
                    </pre>
                  )}
                  <p className="ficha-esperado">
                    <span className="ficha-etiqueta">Resultado esperado</span> {prueba.esperado}
                  </p>
                </li>
              ))}
            </ol>
          </section>

          <section id="fallos">
            <h2>Fallos, errores y problemas</h2>
            <dl className="ficha-lecturas">
              {ficha.fallos.map((fallo) => (
                <div key={fallo.fallo}>
                  <dt>{fallo.fallo}</dt>
                  <dd>{fallo.efecto}</dd>
                </div>
              ))}
            </dl>
            {ficha.referencias.length > 0 && (
              <>
                <h3>Referencias</h3>
                <ul>
                  {ficha.referencias.map((ref) => (
                    <li key={ref.url}>
                      <a href={ref.url} target="_blank" rel="noopener noreferrer">
                        {ref.texto}
                      </a>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </section>

          <section id="leccion">
            <h2>Lección</h2>
            <p className="ficha-clase">
              Nivel {leccion.nivel} · {leccion.duracion}
            </p>
            <h3>Objetivos</h3>
            <ul>
              {leccion.objetivos.map((objetivo) => (
                <li key={objetivo}>{objetivo}</li>
              ))}
            </ul>
            {leccion.secciones.map((seccion) => (
              <div key={seccion.titulo} className="ficha-leccion-tema">
                <h3>{seccion.titulo}</h3>
                {seccion.parrafos.map((parrafo) => (
                  <p key={parrafo}>{parrafo}</p>
                ))}
              </div>
            ))}
            <div className="ficha-pruebas">
              <div className="ficha-practica">
                <h3>Práctica: {leccion.practica.titulo}</h3>
                <ol>
                  {leccion.practica.pasos.map((paso) => (
                    <li key={paso}>{paso}</li>
                  ))}
                </ol>
                <p className="ficha-esperado">
                  <span className="ficha-etiqueta">Para pensar</span> {leccion.practica.preguntaGuia}
                </p>
              </div>
            </div>
            <h3>Cuestionario</h3>
            <Cuestionario preguntas={leccion.cuestionario} />
          </section>

          <nav className="ficha-paginas" aria-label="Otras fichas">
            {anterior ? (
              <Link href={`/fichas/${anterior.slug}`} rel="prev">
                ← {anterior.titulo}
              </Link>
            ) : (
              <span />
            )}
            {siguiente && (
              <Link href={`/fichas/${siguiente.slug}`} rel="next">
                {siguiente.titulo} →
              </Link>
            )}
          </nav>
        </div>
      </div>
    </main>
  );
}
