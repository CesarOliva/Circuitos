import type { Leccion } from "../tipos";

export const leccion: Leccion = {
  nivel: "intermedio",
  duracion: "40 min",
  objetivos: [
    "Programar el ESP32 con el lenguaje de Arduino.",
    "Trabajar con lógica de 3.3 V y un ADC de 12 bits.",
    "Elegir pines seguros (de entrada, de arranque, ADC1).",
  ],
  secciones: [
    {
      titulo: "Diferencias con el Arduino UNO",
      parrafos: [
        "Funciona a 3.3 V: un HIGH vale 3.3 V y sus pines no toleran 5 V.",
        "Su ADC es de 12 bits: analogRead devuelve de 0 a 4095 para 0–3.3 V.",
        "Tiene Wi-Fi y Bluetooth (no se simulan en esta versión).",
      ],
    },
    {
      titulo: "Pines a tener en cuenta",
      parrafos: [
        "GPIO 34, 35, 36 y 39 son solo de entrada.",
        "GPIO 0, 2, 12 y 15 influyen en el arranque: evita cargas fuertes en ellos.",
        "Para lecturas analógicas con Wi-Fi activo usa ADC1 (GPIO 32–39).",
      ],
    },
  ],
  practica: {
    titulo: "Blink en GPIO 2 y validación de 3.3 V",
    pasos: [
      "Ejecuta el Blink de GPIO 2 con runSketch.",
      "Prueba 1.65 V en GPIO 34 e imprime analogRead(34).",
      "En «Validación de voltajes», comprueba qué pasa con 5 V en una entrada.",
    ],
    preguntaGuia: "¿Qué valor esperas con 3.3 V en GPIO 34? (4095.)",
  },
  cuestionario: [
    {
      pregunta: "¿Qué voltaje lógico usa el ESP32?",
      opciones: ["1.8 V", "3.3 V", "5 V", "12 V"],
      correcta: 1,
      explicacion: "Sus GPIO trabajan a 3.3 V.",
    },
    {
      pregunta: "¿Cuál de estos pines no puede ser salida?",
      opciones: ["GPIO 2", "GPIO 23", "GPIO 34", "GPIO 25"],
      correcta: 2,
      explicacion: "GPIO 34–39 son solo de entrada.",
    },
    {
      pregunta: "Resolución del ADC del ESP32:",
      opciones: ["8 bits", "10 bits", "12 bits", "16 bits"],
      correcta: 2,
      explicacion: "12 bits: valores de 0 a 4095.",
    },
  ],
};
