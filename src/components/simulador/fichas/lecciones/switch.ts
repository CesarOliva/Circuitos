import type { Leccion } from "../tipos";

export const leccion: Leccion = {
  nivel: "básico",
  duracion: "10 min",
  objetivos: [
    "Abrir y cerrar un circuito con un interruptor.",
    "Distinguir un interruptor en serie de uno en paralelo.",
    "Evitar cortocircuitos al cerrarlo.",
  ],
  secciones: [
    {
      titulo: "Mantiene su estado",
      parrafos: [
        "A diferencia del pulsador, el interruptor se queda abierto o cerrado. Cerrado es prácticamente un cable (0 Ω).",
      ],
    },
    {
      titulo: "En serie y en paralelo",
      parrafos: [
        "En serie con la carga, la enciende al cerrarlo.",
        "En paralelo con la carga, la puentea: al cerrarlo la apaga. Si lo pones en paralelo con la batería, al cerrarlo provocas un cortocircuito, y el simulador lo marca como error.",
      ],
    },
  ],
  practica: {
    titulo: "Serie contra paralelo",
    pasos: [
      "Arma batería 9 V → interruptor → 470 Ω → LED → batería −. Ciérralo y simula.",
      "Mueve el interruptor para que quede en paralelo con el LED. Ciérralo y simula.",
    ],
    preguntaGuia: "¿Por qué el LED se apaga en el segundo caso? (El interruptor le quita el voltaje: es un camino de 0 Ω.)",
  },
  cuestionario: [
    {
      pregunta: "Un interruptor cerrado en paralelo con un LED...",
      opciones: ["Enciende el LED", "Apaga el LED", "Quema el LED", "No cambia nada"],
      correcta: 1,
      explicacion: "Lo puentea: el LED queda con 0 V.",
    },
    {
      pregunta: "¿Qué pasa si cierras un interruptor conectado directamente entre + y − de la batería?",
      opciones: ["Nada", "Cortocircuito", "Se carga la batería", "Se abre el circuito"],
      correcta: 1,
      explicacion: "Une + y − sin resistencia: es un cortocircuito.",
    },
  ],
};
