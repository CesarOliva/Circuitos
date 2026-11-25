import type { Ficha } from "./tipos";

export const ficha: Ficha = {
  slug: "potentiometer",
  titulo: "Potenciómetro",
  grupo: "Controles",
  clase: "Potentiometer",
  archivo: "simulacion/src/components/controls/Potentiometer.ts",
  resumen: "Resistencia variable de tres terminales; el cursor divide la pista en dos partes.",
  descripcion: [
    "Tiene una pista resistiva entre los extremos A y B y un cursor (W) que se desliza sobre ella al girar la perilla.",
    "Conectado entre una fuente y tierra funciona como divisor de voltaje ajustable (control de volumen, entrada analógica de un Arduino). Con solo dos terminales (A y W) funciona como resistencia variable (reóstato).",
  ],
  especificaciones: [
    { parametro: "Resistencia total (A–B)", simulador: "10 kΩ (editable en kΩ)", real: "B10K lineal: 10 kΩ ±20 %" },
    { parametro: "Posición del cursor", simulador: "0 a 1; inicia en 0.5", real: "Giro de ~270°" },
    { parametro: "R(A–W) / R(W–B)", simulador: "R·posición / R·(1 − posición)", real: "Igual en pista lineal (B); logarítmica en pista A" },
    { parametro: "Potencia", simulador: "Playground: no se vigila; validador de la ficha: aviso por encima de 0.2 W", real: "0.1–0.5 W según el tamaño" },
  ],
  pines: [
    { id: "A", nombre: "Extremo A", funcion: "Un extremo de la pista." },
    { id: "W", nombre: "Cursor", funcion: "Contacto móvil: su voltaje varía entre el de A y el de B." },
    { id: "B", nombre: "Extremo B", funcion: "El otro extremo de la pista." },
  ],
  simulador: {
    modelo: [
      "Se modela como dos resistencias en serie: A–W = R·posición y W–B = R·(1 − posición).",
      "En los extremos (posición 0 o 1) el tramo de 0 Ω se sustituye por una conexión ideal.",
    ],
    editable: "Resistencia total en kΩ y posición del cursor con el deslizador.",
    lecturas: [
      { clave: "position / resistanceAW / resistanceWB", significado: "Posición y resistencia de cada tramo (en la galería)." },
      { clave: "voltage (W)", significado: "Voltaje del cursor, para usarlo como divisor." },
    ],
    limitaciones: ["No modela ruido del cursor. La potencia máxima solo la vigila el validador de la ficha, y sobre la pista completa, no sobre un tramo.", "Solo pista lineal."],
  },
  pruebas: [
    {
      titulo: "Divisor de voltaje ajustable",
      montaje: "Batería 9 V: + a A, − a B. Mide el voltaje en W.",
      pasos: ["Conecta A y B a la batería.", "Simula con el cursor en 0.5 y luego en 0.25."],
      esperado: "Corriente 0.9 mA. En 0.5, W queda a 4.5 V; en 0.25, W queda a 6.75 V (cae 9·0.25 = 2.25 V entre A y W).",
    },
    {
      titulo: "Regulador de brillo de un LED",
      montaje: "Batería 9 V → A; W → resistencia 470 Ω → ánodo del LED; cátodo → −. B queda libre.",
      pasos: ["Simula con el cursor en 0.5.", "Baja el cursor a 0.1 y simula de nuevo.", "Llévalo a 0 y simula."],
      esperado: "En 0.5 (5 kΩ + 470 Ω) circulan ≈1.3 mA y el playground no da el LED por encendido (umbral 2 mA). En 0.1 (1 kΩ + 470 Ω) circulan ≈4.7 mA y el LED enciende. En 0 solo queda la resistencia fija: ≈14.7 mA. Sin ella, el LED quedaría conectado directo a 9 V.",
    },
  ],
  fallos: [
    { fallo: "Cursor sucio o desgastado", efecto: "Saltos de valor y ruido («chisporroteo» en audio)." },
    { fallo: "Pista abierta", efecto: "Se pierde la continuidad entre extremos o con el cursor." },
    { fallo: "Corriente excesiva por el cursor", efecto: "Quema la pista en un punto: el control deja de funcionar en esa zona." },
  ],
  referencias: [{ texto: "Vishay P10 — potenciómetro", url: "https://www.vishay.com/docs/51030/p10.pdf" }],
};
