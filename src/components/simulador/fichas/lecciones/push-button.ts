import type { Leccion } from "../tipos";

export const leccion: Leccion = {
  nivel: "básico",
  duracion: "15 min",
  objetivos: [
    "Diferenciar los contactos normalmente abierto (NO) y normalmente cerrado (NC).",
    "Usar un pulsador como entrada de un circuito.",
    "Entender las resistencias pull-up y pull-down.",
  ],
  secciones: [
    {
      titulo: "Contacto momentáneo",
      parrafos: [
        "Un pulsador NO solo conduce mientras lo presionas. Al soltarlo, un resorte abre el contacto.",
        "El pulsador táctil de 6×6 mm tiene cuatro patas unidas de dos en dos: móntalo cruzando el canal central de la protoboard.",
      ],
    },
    {
      titulo: "Pull-up y pull-down",
      parrafos: [
        "Conectado a un microcontrolador, un pulsador abierto deja la entrada «flotando» (lecturas al azar). Una resistencia de 10 kΩ a 5 V (pull-up) o a GND (pull-down) fija el valor cuando no se presiona.",
        "El Arduino trae pull-ups internos: pinMode(pin, INPUT_PULLUP). Así, presionado se lee LOW.",
      ],
    },
    {
      titulo: "Rebote",
      parrafos: ["Al presionarlo, el contacto rebota unos milisegundos y genera varios pulsos. En software se filtra con una pequeña espera (debounce). El simulador no modela el rebote."],
    },
  ],
  practica: {
    titulo: "Enciende un LED con un pulsador",
    pasos: [
      "Arma batería 9 V → pulsador → 470 Ω → LED → batería −.",
      "Simula con el pulsador suelto y luego presionado.",
    ],
    preguntaGuia: "¿Qué corriente circula con el pulsador suelto? (0 mA: el circuito está abierto.)",
  },
  cuestionario: [
    {
      pregunta: "Un pulsador NO sin presionar está...",
      opciones: ["Cerrado", "Abierto", "En corto", "Polarizado"],
      correcta: 1,
      explicacion: "NO significa normalmente abierto: solo conduce al presionarlo.",
    },
    {
      pregunta: "Con INPUT_PULLUP, ¿qué lee el Arduino al presionar un pulsador conectado a GND?",
      opciones: ["HIGH", "LOW", "Un valor analógico", "Nada"],
      correcta: 1,
      explicacion: "El pulsador lleva el pin a GND: se lee LOW.",
    },
  ],
};
