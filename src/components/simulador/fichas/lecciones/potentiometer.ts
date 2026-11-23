import type { Leccion } from "../tipos";

export const leccion: Leccion = {
  nivel: "básico",
  duracion: "20 min",
  objetivos: [
    "Usar un potenciómetro como divisor de voltaje ajustable.",
    "Calcular el voltaje del cursor según su posición.",
    "Diferenciar su uso como divisor y como resistencia variable.",
  ],
  secciones: [
    {
      titulo: "Tres terminales",
      parrafos: [
        "Los extremos A y B están unidos por una pista resistiva; el cursor W se desliza sobre ella. R(A–W) + R(W–B) siempre suman la resistencia total.",
      ],
    },
    {
      titulo: "Divisor de voltaje",
      parrafos: [
        "Con A a la fuente y B a tierra, el voltaje del cursor va de 0 V al voltaje de la fuente. Así entrega una señal analógica a un Arduino (analogRead).",
        "V(W) = Vfuente · R(W–B) / Rtotal.",
      ],
    },
    {
      titulo: "Resistencia variable",
      parrafos: [
        "Usando solo A y W, funciona como una resistencia ajustable, por ejemplo para regular el brillo de un LED. Cuidado: en un extremo vale 0 Ω y el LED queda sin limitación.",
      ],
    },
  ],
  practica: {
    titulo: "Divisor ajustable",
    pasos: [
      "Conecta A al + de una batería de 9 V y B al −.",
      "Simula con el cursor en 50 % y luego en 25 %; observa el voltaje en W.",
      "Usa A y W en serie con un LED y mueve el cursor hasta que el LED encienda.",
    ],
    preguntaGuia: "¿En qué posición el LED supera los 20 mA? (Cuando R(A–W) < 345 Ω, es decir, por debajo de ~3.5 %.)",
  },
  cuestionario: [
    {
      pregunta: "Un potenciómetro de 10 kΩ con el cursor en 50 %. ¿Cuánto vale R(A–W)?",
      opciones: ["0 Ω", "5 kΩ", "10 kΩ", "20 kΩ"],
      correcta: 1,
      explicacion: "R(A–W) = 10 kΩ × 0.5 = 5 kΩ.",
    },
    {
      pregunta: "Con 5 V entre A y B, ¿qué rango de voltaje puede dar el cursor?",
      opciones: ["0–5 V", "0–10 V", "Siempre 2.5 V", "5–10 V"],
      correcta: 0,
      explicacion: "El cursor recorre la pista completa: de 0 V a 5 V.",
    },
  ],
};
