import type { Leccion } from "../tipos";

export const leccion: Leccion = {
  nivel: "básico",
  duracion: "15 min",
  objetivos: [
    "Identificar qué agujeros están conectados por dentro.",
    "Montar un circuito sin cortocircuitos accidentales.",
    "Usar los rieles de alimentación.",
  ],
  secciones: [
    {
      titulo: "Las tiras internas",
      parrafos: [
        "Cada columna numerada tiene dos tiras: a–e y f–j. Lo que se inserta en la misma tira queda conectado.",
        "El canal central separa ambas mitades: un circuito integrado se coloca cruzándolo para que cada pata quede en su propia tira.",
      ],
    },
    {
      titulo: "Rieles de alimentación",
      parrafos: [
        "Los rieles + y − recorren la placa a lo largo. Conecta allí la batería y toma energía desde cualquier punto.",
        "En algunas placas largas el riel está cortado a la mitad: verifica la continuidad.",
      ],
    },
    {
      titulo: "Errores comunes",
      parrafos: [
        "Poner las dos patas de un componente en la misma tira: el componente queda puenteado.",
        "Insertar un componente en la columna equivocada: el circuito queda abierto.",
      ],
    },
  ],
  practica: {
    titulo: "LED en la protoboard",
    pasos: [
      "Agrega una protoboard, una batería, una resistencia de 470 Ω y un LED.",
      "Batería + → a5; resistencia de e5 a e10; LED de a10 a a15; a15 → batería −.",
      "Simula y luego mueve la resistencia a f5–f10 para ver el efecto del canal central.",
    ],
    preguntaGuia: "¿Por qué no enciende el LED en el segundo caso? (e5 y f5 están en tiras distintas.)",
  },
  cuestionario: [
    {
      pregunta: "¿Qué agujeros están unidos con a7?",
      opciones: ["a1–a30", "b7, c7, d7, e7", "f7–j7", "Todo el riel +"],
      correcta: 1,
      explicacion: "La tira a–e de la columna 7.",
    },
    {
      pregunta: "¿Qué pasa si las dos patas de una resistencia quedan en c3 y d3?",
      opciones: ["Funciona normal", "Queda puenteada", "Se abre el circuito", "Se invierte"],
      correcta: 1,
      explicacion: "Ambas patas están en la misma tira: el componente queda en corto.",
    },
  ],
};
