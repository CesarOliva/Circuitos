import type { Leccion } from "../tipos";

export const leccion: Leccion = {
  nivel: "intermedio",
  duracion: "40 min",
  objetivos: [
    "Escribir un sketch con setup() y loop().",
    "Usar salidas digitales y entradas analógicas.",
    "Respetar los límites de voltaje y corriente de los pines.",
  ],
  secciones: [
    {
      titulo: "Estructura de un sketch",
      parrafos: [
        "setup() se ejecuta una vez al arrancar: ahí se configuran los pines con pinMode(). loop() se repite para siempre.",
        "digitalWrite(13, HIGH) pone el pin 13 a 5 V; delay(500) espera medio segundo.",
      ],
    },
    {
      titulo: "Entradas analógicas",
      parrafos: [
        "analogRead(A0) convierte un voltaje de 0–5 V en un número de 0 a 1023 (10 bits). Por ejemplo, 2.5 V da ≈ 512.",
        "Nunca apliques más de 5 V ni voltajes negativos a un pin.",
      ],
    },
    {
      titulo: "Corriente de los pines",
      parrafos: [
        "Cada pin entrega como máximo 40 mA (20 mA recomendados). Un LED con 220 Ω consume (5 − 2) / 220 ≈ 14 mA: es seguro.",
        "Motores, relés y zumbadores grandes se controlan con un transistor.",
      ],
    },
  ],
  practica: {
    titulo: "Blink y lectura analógica",
    pasos: [
      "Escribe el sketch Blink del pin 13 (ver «Pruebas recomendadas»).",
      "Ejecútalo con runSketch durante 2 s y revisa los eventos del pin.",
      "Agrega Serial.println(analogRead(A0)) con 2.5 V en A0.",
      "En «Validación de voltajes», prueba qué resistencia de LED es segura para un pin.",
    ],
    preguntaGuia: "¿Qué número da analogRead con 1 V en A0? (1 / 5 × 1023 ≈ 205.)",
  },
  cuestionario: [
    {
      pregunta: "¿Qué función se ejecuta una sola vez?",
      opciones: ["loop()", "setup()", "delay()", "main()"],
      correcta: 1,
      explicacion: "setup() corre al arrancar; loop() se repite.",
    },
    {
      pregunta: "¿Qué valor da analogRead con 5 V?",
      opciones: ["255", "512", "1023", "4095"],
      correcta: 2,
      explicacion: "El ADC es de 10 bits: el máximo es 1023.",
    },
    {
      pregunta: "Un LED sin resistencia en un pin a 5 V...",
      opciones: ["Es seguro", "Puede superar los 40 mA y dañar el pin", "No enciende", "Necesita 12 V"],
      correcta: 1,
      explicacion: "Sin limitación la corriente supera el máximo del pin.",
    },
  ],
};
