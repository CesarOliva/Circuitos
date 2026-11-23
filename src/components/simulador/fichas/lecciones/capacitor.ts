import type { Leccion } from "../tipos";

export const leccion: Leccion = {
  nivel: "intermedio",
  duracion: "25 min",
  objetivos: [
    "Explicar cómo un capacitor almacena carga.",
    "Predecir su comportamiento en corriente continua en estado estable.",
    "Respetar la polaridad y el voltaje nominal de un electrolítico.",
  ],
  secciones: [
    {
      titulo: "Dos placas y un aislante",
      parrafos: [
        "Un capacitor guarda carga: Q = C · V. La capacitancia se mide en faradios; en la práctica se usan µF, nF y pF.",
        "La corriente solo circula mientras su voltaje cambia (i = C · dV/dt). Una vez cargado, en DC se comporta como un circuito abierto.",
      ],
    },
    {
      titulo: "Constante de tiempo",
      parrafos: [
        "Con una resistencia en serie, el capacitor se carga en un tiempo característico τ = R · C. Tras unos 5τ está prácticamente lleno.",
        "Con 1 kΩ y 100 µF, τ = 0.1 s. El playground muestra el estado final (cargado), no la curva.",
      ],
    },
    {
      titulo: "Límites",
      parrafos: [
        "Nunca superes su voltaje nominal (25 V en el simulador) y respeta la polaridad en los electrolíticos: invertidos pueden hincharse o explotar.",
      ],
    },
  ],
  practica: {
    titulo: "El capacitor bloquea la DC",
    pasos: [
      "Arma batería 9 V → resistencia 1 kΩ → capacitor → batería −.",
      "Simula: la corriente es 0 y el capacitor tiene 9 V.",
      "Sube la batería a 30 V y lee el aviso de voltaje nominal.",
    ],
    preguntaGuia: "¿Por qué la resistencia no tiene voltaje en estado estable? (Sin corriente, V = I · R = 0.)",
  },
  cuestionario: [
    {
      pregunta: "En DC y en estado estable, un capacitor se comporta como...",
      opciones: ["Un cable", "Un circuito abierto", "Una resistencia de 1 Ω", "Una batería infinita"],
      correcta: 1,
      explicacion: "Ya cargado, no circula corriente continua por él.",
    },
    {
      pregunta: "¿Cuánto vale τ con R = 10 kΩ y C = 10 µF?",
      opciones: ["0.01 s", "0.1 s", "1 s", "10 s"],
      correcta: 1,
      explicacion: "τ = R · C = 10 000 × 0.00001 = 0.1 s.",
    },
    {
      pregunta: "¿Qué pasa si un electrolítico de 25 V recibe 30 V?",
      opciones: ["Almacena más carga sin problema", "Puede dañarse o hincharse", "Se convierte en inductor", "Nada"],
      correcta: 1,
      explicacion: "Se supera el voltaje nominal: el dieléctrico puede perforarse.",
    },
  ],
};
