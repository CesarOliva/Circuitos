import type { Leccion } from "../tipos";

export const leccion: Leccion = {
  nivel: "intermedio",
  duracion: "25 min",
  objetivos: [
    "Relacionar el voltaje con la velocidad de un motor DC.",
    "Explicar la corriente de arranque o bloqueo.",
    "Controlar un motor con un transistor y protegerlo con un diodo.",
  ],
  secciones: [
    {
      titulo: "Cómo gira",
      parrafos: [
        "La corriente en el bobinado, dentro de un campo magnético, produce fuerza y giro. Las escobillas invierten la corriente en cada media vuelta.",
        "Más voltaje significa más velocidad; invertir la polaridad invierte el sentido de giro.",
      ],
    },
    {
      titulo: "Corrientes",
      parrafos: [
        "En vacío consume poco (unos 0.1 A); al arrancar o bloquearse puede consumir 10 veces más. Por eso nunca va directo a un pin de Arduino.",
        "Superar su voltaje nominal acelera el desgaste. El simulador avisa por encima del 125 % del nominal.",
      ],
    },
    {
      titulo: "Control",
      parrafos: [
        "Un transistor (o un driver como el L298N) conmuta la corriente del motor. Un diodo en paralelo invertido absorbe el pico al apagarlo.",
      ],
    },
  ],
  practica: {
    titulo: "Velocidad contra voltaje",
    pasos: [
      "Conecta un motor de 6 V a una batería de 6 V y simula: 3000 rpm.",
      "Prueba con 3 V y con 9 V.",
      "Revisa en «Validación de voltajes» qué pasa con 9 V.",
    ],
    preguntaGuia: "¿Qué velocidad da el modelo con 4.5 V? (3000 × 4.5 / 6 = 2250 rpm.)",
  },
  cuestionario: [
    {
      pregunta: "¿Cómo inviertes el sentido de giro de un motor DC?",
      opciones: ["Aumentando el voltaje", "Invirtiendo la polaridad", "Poniendo una resistencia", "No se puede"],
      correcta: 1,
      explicacion: "Al cambiar la dirección de la corriente cambia el sentido de la fuerza.",
    },
    {
      pregunta: "¿Por qué no se conecta un motor directo a un pin de Arduino?",
      opciones: ["Porque necesita corriente alterna", "Porque pide más corriente de la que entrega el pin", "Porque gira demasiado rápido", "Porque no tiene polaridad"],
      correcta: 1,
      explicacion: "Un pin entrega unos 20 mA; el motor necesita cientos.",
    },
  ],
};
