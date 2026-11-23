import type { Leccion } from "../tipos";

export const leccion: Leccion = {
  nivel: "básico",
  duracion: "20 min",
  objetivos: [
    "Distinguir la polarización directa de la inversa.",
    "Usar el diodo para proteger un circuito contra la polaridad invertida.",
    "Respetar la corriente y el voltaje inverso máximos.",
  ],
  secciones: [
    {
      titulo: "Una válvula de un solo sentido",
      parrafos: [
        "En polarización directa (ánodo más positivo que el cátodo) el diodo conduce y cae unos 0.7 V. En inversa bloquea.",
        "La franja de la cápsula marca el cátodo (K).",
      ],
    },
    {
      titulo: "Usos típicos",
      parrafos: [
        "Rectificación: convierte la corriente alterna en pulsante para luego filtrarla.",
        "Protección: en serie con la alimentación evita daños si la batería se conecta al revés.",
        "Rueda libre: en paralelo invertido con un motor o un relé absorbe el pico de voltaje al apagarlo.",
      ],
    },
    {
      titulo: "Límites",
      parrafos: [
        "Un 1N4001 soporta 1 A en directa y 50 V en inversa (el 1N4007 llega a 1000 V). El simulador valida ambos límites.",
      ],
    },
  ],
  practica: {
    titulo: "Diodo como protección de polaridad",
    pasos: [
      "Arma batería 9 V → diodo (A→K) → resistencia 470 Ω → LED → batería −.",
      "Simula: el LED enciende y el diodo cae 0.7 V.",
      "Invierte la batería y simula: no circula corriente y nada se daña.",
    ],
    preguntaGuia: "¿Cuánto bajó la corriente del LED al agregar el diodo? (Pasa de ≈14.7 mA a ≈13.2 mA por los 0.7 V del diodo.)",
  },
  cuestionario: [
    {
      pregunta: "¿Cuándo conduce un diodo de silicio?",
      opciones: ["Siempre", "Cuando el ánodo está unos 0.7 V más positivo que el cátodo", "Cuando el cátodo es más positivo", "Solo con corriente alterna"],
      correcta: 1,
      explicacion: "Necesita polarización directa de al menos su voltaje directo, unos 0.7 V.",
    },
    {
      pregunta: "¿Qué indica la franja pintada en la cápsula?",
      opciones: ["El ánodo", "El cátodo", "La potencia", "La tolerancia"],
      correcta: 1,
      explicacion: "La franja marca el cátodo (K).",
    },
    {
      pregunta: "Un 1N4001 recibe 60 V en inversa. ¿Qué pasa?",
      opciones: ["Nada", "Supera su VRRM de 50 V y puede romperse", "Conduce en directa", "Se convierte en LED"],
      correcta: 1,
      explicacion: "Supera el voltaje inverso máximo: entra en ruptura.",
    },
  ],
};
