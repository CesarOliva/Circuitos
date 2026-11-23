// A technical sheet for one part the simulator knows about. `slug` is the class's `type`
// (or the BoardId for microcontrollers), so /componentes/<slug> lines up with simulacion/.
export type GrupoFicha =
  | "Fuentes"
  | "Pasivos"
  | "Controles"
  | "Semiconductores"
  | "Sensores"
  | "Actuadores"
  | "Montaje"
  | "Microcontroladores";

export interface Especificacion {
  parametro: string;
  /** Value the playground uses (or "—" when the model doesn't represent it). */
  simulador: string;
  /** Typical value for a real part, with the reference part when there is one. */
  real: string;
}

export interface Pin {
  /** Terminal id exactly as in the class (`terminals[].id`), or the board's pin label. */
  id: string;
  nombre: string;
  funcion: string;
}

export interface Prueba {
  titulo: string;
  montaje: string;
  pasos: string[];
  esperado: string;
  codigo?: string;
}

export interface Pregunta {
  pregunta: string;
  opciones: string[];
  /** Index of the right option. */
  correcta: number;
  explicacion: string;
}

/** Learning content for one part: theory, a practice in the playground, and a short quiz. */
export interface Leccion {
  nivel: "básico" | "intermedio";
  duracion: string;
  objetivos: string[];
  secciones: Array<{ titulo: string; parrafos: string[] }>;
  practica: { titulo: string; pasos: string[]; preguntaGuia: string };
  cuestionario: Pregunta[];
}

export interface Ficha {
  slug: string;
  titulo: string;
  grupo: GrupoFicha;
  /** Class in simulacion/src and the file it lives in. */
  clase: string;
  archivo: string;
  resumen: string;
  descripcion: string[];
  especificaciones: Especificacion[];
  pines: Pin[];
  simulador: {
    /** How the solver represents the part. */
    modelo: string[];
    /** What the user can change in the playground. */
    editable: string;
    /** Keys of `measurements` (or result fields) and what they mean. */
    lecturas: Array<{ clave: string; significado: string }>;
    limitaciones: string[];
  };
  pruebas: Prueba[];
  fallos: Array<{ fallo: string; efecto: string }>;
  referencias: Array<{ texto: string; url: string }>;
}
