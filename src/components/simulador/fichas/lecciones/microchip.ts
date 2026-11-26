import type { Leccion } from "../tipos";

export const leccion: Leccion = {
  nivel: "básico",
  duracion: "10 min",
  objetivos: [
    "Identificar los pines de un encapsulado DIP-16.",
    "Cablear varios pines de un chip sobre la protoboard.",
    "Entender que un pin solo cuenta cuando está conectado.",
  ],
  secciones: [
    {
      titulo: "Un encapsulado de dieciséis pines",
      parrafos: [
        "El DIP-16 es un encapsulado clásico de circuitos integrados: dos filas de ocho pines separadas 0.3 pulgadas, que encajan en la protoboard atravesando el canal central.",
        "La marca en un extremo indica el pin 1. Desde ahí, los pines 1 a 8 van por una fila y los 16 a 9 por la otra.",
      ],
    },
    {
      titulo: "Pines sin lógica",
      parrafos: [
        "Este chip genérico no tiene lógica interna: sus pines no están unidos entre sí. Lo que cambia el circuito son los cables y componentes que conectas a cada pin.",
        "En un chip real, el fabricante dice qué hace cada pin. Aquí aprendes a cablearlos antes de conocer el integrado concreto.",
      ],
    },
  ],
  practica: {
    titulo: "El chip no cierra el camino",
    pasos: [
      "Coloca el microchip sobre el canal central de la protoboard.",
      "Arma batería 9 V (+) → resistencia 470 Ω → pin 1, y batería (−) → pin 8. Simula: no hay corriente.",
      "Quita el cable del pin 8 y lleva la resistencia directamente al negativo, sin tocar el chip. Simula de nuevo.",
    ],
    preguntaGuia: "¿Por qué no circula corriente con el chip en medio, aunque el pin 1 y el pin 8 estén cableados? (El chip no une sus pines por dentro: el camino tiene que cerrarse por fuera de él.)",
  },
  cuestionario: [
    {
      pregunta: "¿Dónde está el pin 1 de un DIP-16?",
      opciones: ["En el centro", "Junto a la marca del encapsulado", "En la fila inferior, a la derecha", "No tiene pin 1"],
      correcta: 1,
      explicacion: "La marca del encapsulado indica el pin 1; desde ahí se cuenta en sentido contrario a las manecillas.",
    },
    {
      pregunta: "¿Qué hace el simulador con un pin del microchip genérico que no tiene cable?",
      opciones: ["Lo corta del circuito", "Lo ignora: no afecta al resultado", "Lo conecta a tierra", "Muestra un error"],
      correcta: 1,
      explicacion: "Un pin sin conexión no forma parte de ningún nodo del circuito, así que no cambia la simulación.",
    },
  ],
};
