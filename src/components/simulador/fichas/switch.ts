import type { Ficha } from "./tipos";

export const ficha: Ficha = {
  slug: "switch",
  titulo: "Interruptor",
  grupo: "Controles",
  clase: "Switch",
  archivo: "simulacion/src/components/controls/Switch.ts",
  resumen: "Abre o cierra un circuito y se queda en esa posición.",
  descripcion: [
    "A diferencia del pulsador, el interruptor mantiene su estado: deslizable, de palanca o de balancín. Se usa para encender o apagar circuitos completos o seleccionar modos.",
  ],
  especificaciones: [
    { parametro: "Estado inicial", simulador: "Abierto", real: "—" },
    { parametro: "Resistencia de contacto", simulador: "0 Ω cerrado; infinita abierto", real: "Decenas de mΩ cerrado" },
    { parametro: "Capacidad", simulador: "Playground: sin límite; validador de la ficha: aviso por encima de 0.5 A o 50 V", real: "Deslizable SS12D00: 50 V DC, 0.5 A (varía por modelo)" },
  ],
  pines: [
    { id: "1", nombre: "Terminal 1", funcion: "Sin polaridad." },
    { id: "2", nombre: "Terminal 2", funcion: "Sin polaridad." },
  ],
  simulador: {
    modelo: ["Cerrado: conexión ideal de 0 Ω entre los terminales 1 y 2. Abierto: no existe rama entre ellos."],
    editable: "Botón para alternar entre abierto y cerrado (toggle).",
    lecturas: [
      { clave: "closed", significado: "Si el contacto está cerrado." },
      { clave: "current", significado: "Corriente que pasa cuando está cerrado." },
    ],
    limitaciones: ["Solo un polo y un tiro (SPST); no hay conmutadores de tres terminales."],
  },
  pruebas: [
    {
      titulo: "Interruptor de encendido",
      montaje: "Batería 9 V → interruptor → 470 Ω → LED → batería.",
      pasos: ["Simula con el interruptor abierto.", "Ciérralo y simula."],
      esperado: "Abierto: 0 mA. Cerrado: ≈14.7 mA y LED encendido.",
    },
    {
      titulo: "Interruptor en paralelo (puente)",
      montaje: "Batería 9 V → 470 Ω → LED, con el interruptor en paralelo al LED.",
      pasos: ["Simula con el interruptor abierto y luego cerrado."],
      esperado: "Abierto: el LED enciende. Cerrado: el interruptor puentea el LED, que se apaga, y la corriente sube a ≈19.1 mA.",
    },
  ],
  fallos: [
    { fallo: "Contacto abierto", efecto: "No conduce aunque esté en posición de cerrado." },
    { fallo: "Contacto soldado", efecto: "Permanece cerrado." },
    { fallo: "Oxidación", efecto: "Caída de voltaje, calentamiento e intermitencia." },
  ],
  referencias: [],
};
