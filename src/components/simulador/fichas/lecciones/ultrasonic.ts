import type { Leccion } from "../tipos";

export const leccion: Leccion = {
  nivel: "intermedio",
  duracion: "25 min",
  objetivos: [
    "Explicar la medición de distancia por tiempo de vuelo.",
    "Conectar correctamente los cuatro pines del HC-SR04.",
    "Convertir el ancho del pulso de eco en centímetros.",
  ],
  secciones: [
    {
      titulo: "Eco ultrasónico",
      parrafos: [
        "El sensor emite un tren de pulsos a 40 kHz y escucha su eco. El tiempo de ida y vuelta, a ~343 m/s, indica la distancia.",
        "distancia (cm) = tiempo (µs) / 58. Por ejemplo, un pulso de 5800 µs equivale a 100 cm.",
      ],
    },
    {
      titulo: "Conexión",
      parrafos: [
        "VCC a 5 V, GND a tierra, TRIG a un pin de salida (pulso de 10 µs) y ECHO a un pin de entrada.",
        "ECHO sale a 5 V: con un ESP32 (3.3 V) usa un divisor de voltaje.",
      ],
    },
    {
      titulo: "Límites",
      parrafos: ["Mide de 2 a 400 cm. Fuera de ese rango, o con objetos blandos o inclinados, no hay eco fiable. El simulador valida la alimentación de 4.5 a 5.5 V."],
    },
  ],
  practica: {
    titulo: "Ver el eco con un LED",
    pasos: [
      "Batería de 5 V: VCC y TRIG al +, GND al −.",
      "ECHO → 470 Ω → LED → −.",
      "Simula con 100 cm, luego con 1 cm y con 450 cm.",
    ],
    preguntaGuia: "¿Qué ancho de pulso esperas a 30 cm? (30 × 58 = 1740 µs.)",
  },
  cuestionario: [
    {
      pregunta: "Un pulso de eco de 2900 µs equivale a...",
      opciones: ["5 cm", "50 cm", "290 cm", "29 cm"],
      correcta: 1,
      explicacion: "2900 / 58 = 50 cm.",
    },
    {
      pregunta: "¿Con qué voltaje se alimenta el HC-SR04?",
      opciones: ["3.3 V", "5 V", "9 V", "12 V"],
      correcta: 1,
      explicacion: "Funciona con 5 V DC.",
    },
    {
      pregunta: "¿Qué precaución hay con un ESP32?",
      opciones: ["Ninguna", "Bajar ECHO de 5 V a 3.3 V", "Usar 12 V", "Conectar TRIG a GND"],
      correcta: 1,
      explicacion: "Los GPIO del ESP32 no toleran 5 V.",
    },
  ],
};
