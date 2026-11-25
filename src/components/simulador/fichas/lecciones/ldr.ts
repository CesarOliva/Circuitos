import type { Leccion } from "../tipos";

export const leccion: Leccion = {
  nivel: "básico",
  duracion: "20 min",
  objetivos: [
    "Relacionar la iluminación con la resistencia de una LDR.",
    "Construir un divisor de voltaje para leer luz.",
    "Diseñar una luz que reacciona a la iluminación.",
  ],
  secciones: [
    {
      titulo: "Más luz, menos resistencia",
      parrafos: [
        "Una LDR de sulfuro de cadmio baja su resistencia con la luz: de más de 1 MΩ en oscuridad a cientos de Ω con mucha luz.",
        "El modelo del simulador: R = 10 kΩ · (10 lx / iluminación)^0.7.",
      ],
    },
    {
      titulo: "Leerla con un divisor",
      parrafos: [
        "Un microcontrolador mide voltajes, no resistencias. Con la LDR arriba y una resistencia fija de 10 kΩ abajo, el voltaje del punto medio sube con la luz.",
        "Ese voltaje va a una entrada analógica (analogRead) y el programa decide, por ejemplo, encender una luz cuando oscurece.",
      ],
    },
  ],
  practica: {
    titulo: "LED que responde a la luz",
    pasos: [
      "Arma batería 9 V → LDR → LED → batería −.",
      "Simula con 10 lx, 100 lx y 1000 lx.",
      "Cambia el LED por una resistencia de 10 kΩ y observa el voltaje en el punto medio.",
    ],
    preguntaGuia: "¿A partir de qué iluminación enciende el LED (más de 2 mA)? (A unos 46 lx, cuando la LDR baja de ~3.45 kΩ: (9 − 2.1) / 3450 Ω = 2 mA.)",
  },
  cuestionario: [
    {
      pregunta: "¿Qué le pasa a la resistencia de una LDR al aumentar la luz?",
      opciones: ["Aumenta", "Disminuye", "No cambia", "Se invierte la polaridad"],
      correcta: 1,
      explicacion: "Más luz libera más portadores de carga: baja la resistencia.",
    },
    {
      pregunta: "En el divisor LDR (arriba) + 10 kΩ (abajo), ¿qué hace el voltaje del punto medio al oscurecer?",
      opciones: ["Sube", "Baja", "Queda en 5 V", "Queda en 0 V"],
      correcta: 1,
      explicacion: "La LDR aumenta su resistencia y se lleva más voltaje: el punto medio baja.",
    },
  ],
};
