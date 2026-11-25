import type { Ficha } from "./tipos";

export const ficha: Ficha = {
  slug: "transistor-bjt",
  titulo: "Transistor BJT",
  grupo: "Semiconductores",
  clase: "Transistor",
  archivo: "simulacion/src/components/semiconductors/Transistor.ts",
  resumen: "Una corriente pequeña en la base controla una corriente mayor entre colector y emisor.",
  descripcion: [
    "El transistor bipolar (BJT) tiene tres terminales. En un NPN, al circular corriente de base a emisor, se permite una corriente de colector hasta β veces mayor.",
    "Funciona como interruptor (corte/saturación: encender un motor o un relé desde un Arduino) o como amplificador (región activa). El 2N2222 en cápsula TO-92 es el NPN de referencia para prácticas.",
  ],
  especificaciones: [
    { parametro: "Polaridad", simulador: "NPN (la clase admite PNP)", real: "2N2222A: NPN" },
    { parametro: "Ganancia β (hFE)", simulador: "100 (editable)", real: "2N2222A: 100–300 a 150 mA" },
    { parametro: "Corriente máxima de colector", simulador: "0.6 A en el playground; 0.2 A en la galería", real: "2N2222A: 600 mA (los 0.2 A de la galería corresponden a otro transistor, como el 2N3904)" },
    { parametro: "VCE máxima", simulador: "40 V", real: "2N2222A: VCEO = 40 V (varía por fabricante)" },
    { parametro: "VBE de encendido", simulador: "0.7 V", real: "0.6–0.7 V; hasta ~1.2 V en saturación fuerte" },
    { parametro: "VCE de saturación", simulador: "No se modela: VCE queda alto aunque sobre corriente de base", real: "2N2222A: ≤ 0.3 V a 150 mA; ≤ 1 V a 500 mA" },
    { parametro: "VEB máxima (inversa)", simulador: "—", real: "2N2222A: 6 V" },
    { parametro: "Potencia", simulador: "No se vigila", real: "TO-92: ~625 mW" },
  ],
  pines: [
    { id: "B", nombre: "Base", funcion: "Control: siempre a través de una resistencia (p. ej. 1–10 kΩ)." },
    { id: "C", nombre: "Colector", funcion: "Hacia la carga (LED, motor, relé), que a su vez va al positivo." },
    { id: "E", nombre: "Emisor", funcion: "A tierra en un NPN." },
  ],
  simulador: {
    modelo: [
      "La unión base-emisor se modela como un diodo con umbral VBE = 0.7 V (fuente + 1 mΩ al conducir).",
      "Cuando conduce, se calcula Ib, una corriente objetivo Ic = min(Icmax, β·Ib), y entre colector y emisor se coloca una conductancia Ic / VCEmax. El solver itera hasta que estas conductancias se estabilizan.",
      "Si VBE < 0.7 V, el transistor queda en corte y no hay rama entre colector y emisor.",
    ],
    editable: "Ganancia β y polaridad NPN/PNP.",
    lecturas: [
      { clave: "conducting", significado: "Si la unión base-emisor está polarizada." },
      { clave: "maxCollectorCurrentExceeded", significado: "Ic mayor que el máximo del modelo." },
      { clave: "maxCollectorEmitterVoltageExceeded", significado: "|VCE| mayor que 40 V." },
    ],
    limitaciones: [
      "Es un modelo simplificado de conmutación: la corriente de colector no reproduce exactamente las curvas reales de saturación ni la región activa.",
      "Como la conductancia C–E es Ic/VCEmax, la corriente que circula es Ic·VCE/40 V: con la batería de 9 V queda bastante por debajo de β·Ib y el transistor nunca se satura. Un transistor real, con la misma corriente de base, dejaría VCE en unas décimas de voltio.",
      "No hay efectos térmicos ni de frecuencia.",
    ],
  },
  pruebas: [
    {
      titulo: "Transistor como interruptor",
      montaje: "Batería 9 V. Colector → LED → 470 Ω → +9 V. Base → 10 kΩ → +9 V. Emisor → −.",
      pasos: ["Arma el circuito y simula.", "Desconecta la resistencia de base y simula otra vez."],
      esperado: "Con la base alimentada: conducting = sí y el LED enciende con ≈ 7.2 mA (VCE ≈ 3.5 V; un 2N2222A real se saturaría y daría ≈ 14.5 mA). Sin corriente de base: conducting = no y el LED se apaga.",
    },
    {
      titulo: "Control con pulsador",
      montaje: "El circuito anterior con un pulsador entre la resistencia de base y +9 V.",
      pasos: ["Simula con el pulsador suelto y luego presionado."],
      esperado: "El LED solo enciende mientras el pulsador está presionado. La corriente de base es de solo ≈0.8 mA.",
    },
  ],
  fallos: [
    { fallo: "Unión abierta", efecto: "No conmuta: la carga nunca enciende." },
    { fallo: "Colector-emisor en corto", efecto: "La carga queda siempre encendida." },
    { fallo: "Sin resistencia de base", efecto: "Corriente de base excesiva que destruye la unión base-emisor." },
    { fallo: "Patillas confundidas (E-B-C)", efecto: "No funciona o lo hace con ganancia muy baja. El orden varía entre fabricantes." },
  ],
  referencias: [{ texto: "onsemi 2N2222A", url: "https://www.onsemi.com/download/data-sheet/pdf/2n2222a-d.pdf" }],
};
