import type { Leccion } from "../tipos";

export const leccion: Leccion = {
  nivel: "intermedio",
  duracion: "30 min",
  objetivos: [
    "Identificar base, colector y emisor de un BJT NPN.",
    "Usar un transistor como interruptor controlado por corriente.",
    "Calcular la resistencia de base.",
  ],
  secciones: [
    {
      titulo: "Una corriente controla a otra",
      parrafos: [
        "En un NPN, una pequeña corriente de base a emisor (Ib) permite una corriente de colector a emisor hasta β veces mayor: Ic ≤ β · Ib.",
        "La unión base-emisor se comporta como un diodo: necesita unos 0.7 V para conducir.",
      ],
    },
    {
      titulo: "Como interruptor",
      parrafos: [
        "La carga (LED, motor, relé) va entre el + y el colector; el emisor va a tierra. Con corriente de base el transistor conduce (saturación); sin ella queda en corte.",
        "Así, un pin de Arduino (máximo 20 mA) puede controlar un motor de cientos de mA.",
      ],
    },
    {
      titulo: "Resistencia de base",
      parrafos: [
        "Rb = (Vcontrol − 0.7) / Ib. Para saturar con holgura se usa Ib ≈ Ic / 10. Con 5 V y Ic = 100 mA: Ib = 10 mA y Rb = 4.3 / 0.01 = 430 Ω.",
        "Nunca conectes la base directo a la fuente: el simulador lo marca como advertencia.",
      ],
    },
  ],
  practica: {
    titulo: "Transistor como interruptor",
    pasos: [
      "Batería 9 V. Une + → 470 Ω → LED (A→K) → colector, emisor → −, y + → 10 kΩ → base.",
      "Simula: el transistor conduce y el LED enciende.",
      "Pon un pulsador entre la resistencia de base y el +, y simula con el pulsador suelto y luego presionado.",
    ],
    preguntaGuia: "¿Cuánta corriente de base usa el control? ((9 − 0.7) / 10 kΩ ≈ 0.83 mA.)",
  },
  cuestionario: [
    {
      pregunta: "En un NPN usado como interruptor, ¿a dónde va el emisor?",
      opciones: ["Al positivo", "A tierra (−)", "A la base", "A la carga"],
      correcta: 1,
      explicacion: "En la configuración de emisor común, el emisor va a tierra.",
    },
    {
      pregunta: "Con β = 100 e Ib = 1 mA, ¿cuál es la Ic máxima en región activa?",
      opciones: ["1 mA", "10 mA", "100 mA", "1 A"],
      correcta: 2,
      explicacion: "Ic = β · Ib = 100 × 1 mA = 100 mA.",
    },
    {
      pregunta: "¿Por qué la base lleva una resistencia?",
      opciones: ["Para limitar la corriente de base", "Para aumentar β", "Para invertir la polaridad", "No hace falta"],
      correcta: 0,
      explicacion: "La unión base-emisor es un diodo: sin resistencia la corriente se dispara.",
    },
  ],
};
