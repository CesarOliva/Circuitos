import type { Leccion } from "../tipos";

export const leccion: Leccion = {
  nivel: "intermedio",
  duracion: "20 min",
  objetivos: [
    "Explicar cómo un inductor se opone a los cambios de corriente.",
    "Predecir su comportamiento en corriente continua.",
    "Reconocer el pico de voltaje al interrumpir su corriente.",
  ],
  secciones: [
    {
      titulo: "Energía en un campo magnético",
      parrafos: [
        "La corriente que atraviesa una bobina crea un campo magnético. Al cambiar la corriente aparece un voltaje que se opone al cambio: v = L · di/dt.",
        "Se mide en henrios (H); son comunes los µH y los mH.",
      ],
    },
    {
      titulo: "En corriente continua",
      parrafos: [
        "Con corriente estable no hay cambio, así que el inductor ideal es un cable: 0 V entre sus terminales.",
        "Por eso no debe ponerse en paralelo con una batería: sería un cortocircuito. El simulador lo detecta.",
      ],
    },
    {
      titulo: "El pico al desconectar",
      parrafos: [
        "Si cortas bruscamente la corriente de una bobina (motor, relé), aparece un pico de voltaje alto. Un diodo de rueda libre en paralelo lo absorbe.",
      ],
    },
  ],
  practica: {
    titulo: "El inductor en DC",
    pasos: [
      "Usa el validador de la sección «Validación de voltajes» (el playground actual no puede simular inductores por un error conocido del solver).",
      "Con 9 V y 470 Ω en serie, compara la corriente con la de una resistencia sola (≈19.1 mA).",
      "Pon la resistencia en serie en 0 Ω: el inductor queda directo sobre la batería y se marca el cortocircuito.",
    ],
    preguntaGuia: "¿Qué voltaje tiene el inductor en estado estable? (0 V.)",
  },
  cuestionario: [
    {
      pregunta: "En DC estable, un inductor ideal se comporta como...",
      opciones: ["Un circuito abierto", "Un cable", "Un capacitor", "Una fuente"],
      correcta: 1,
      explicacion: "Sin cambio de corriente no hay voltaje inducido: es un cable.",
    },
    {
      pregunta: "¿Para qué sirve un diodo en paralelo con la bobina de un relé?",
      opciones: ["Para encenderlo", "Para absorber el pico de voltaje al apagarlo", "Para aumentar la corriente", "Para medir la inductancia"],
      correcta: 1,
      explicacion: "Es el diodo de rueda libre: protege al transistor que controla la bobina.",
    },
  ],
};
