import type { Leccion } from "../tipos";

export const leccion: Leccion = {
  nivel: "básico",
  duracion: "15 min",
  objetivos: [
    "Explicar qué es el voltaje y por qué un circuito necesita una fuente.",
    "Calcular la corriente que entrega una batería con la ley de Ohm.",
    "Reconocer un cortocircuito y por qué es peligroso.",
  ],
  secciones: [
    {
      titulo: "El voltaje empuja, la corriente fluye",
      parrafos: [
        "El voltaje (V, en voltios) es la diferencia de energía por carga entre dos puntos. Una batería mantiene esa diferencia entre su terminal + y su terminal −.",
        "Si conectas un camino entre ambos terminales, las cargas circulan: eso es la corriente (I, en amperios). Sin un camino cerrado, el circuito está abierto y no hay corriente.",
      ],
    },
    {
      titulo: "Ley de Ohm",
      parrafos: [
        "La corriente depende del voltaje y de cuánto se opone el camino: I = V / R. Con 9 V y 1 kΩ circulan 9 mA; con 100 Ω, 90 mA.",
        "La potencia que entrega la fuente es P = V · I. Por eso una carga de baja resistencia agota la batería rápido.",
      ],
    },
    {
      titulo: "Cortocircuito",
      parrafos: [
        "Un cable directo entre + y − tiene resistencia casi nula, así que la corriente se dispara. Las pilas se calientan y los cables pueden quemarse.",
        "En el simulador la fuente es ideal (no tiene resistencia interna): un corto no tiene solución y la revisión del circuito lo marca como error.",
      ],
    },
  ],
  practica: {
    titulo: "Mide la corriente de una batería",
    pasos: [
      "En el playground, agrega una Batería DC y una Resistencia.",
      "Pon la resistencia en 1000 Ω y conéctala entre + y −.",
      "Simula y selecciona la batería: anota la corriente.",
      "Cambia la batería a 4.5 V y vuelve a simular.",
    ],
    preguntaGuia: "¿Qué pasó con la corriente al reducir el voltaje a la mitad? (Debe bajar de 9 mA a 4.5 mA.)",
  },
  cuestionario: [
    {
      pregunta: "Una batería de 9 V alimenta una resistencia de 450 Ω. ¿Cuánta corriente circula?",
      opciones: ["2 mA", "20 mA", "200 mA", "4.05 A"],
      correcta: 1,
      explicacion: "I = V / R = 9 / 450 = 0.02 A = 20 mA.",
    },
    {
      pregunta: "¿Qué ocurre si unes el + y el − de una batería con un cable?",
      opciones: ["Nada, el cable no consume", "Se produce un cortocircuito", "El voltaje aumenta", "La batería se recarga"],
      correcta: 1,
      explicacion: "Sin resistencia en el camino, la corriente es muy alta: es un cortocircuito.",
    },
    {
      pregunta: "¿Por qué no circula corriente si solo conectas el + de la batería a una resistencia?",
      opciones: ["Porque la resistencia es muy grande", "Porque el circuito no está cerrado", "Porque falta un LED", "Porque la batería está descargada"],
      correcta: 1,
      explicacion: "La corriente necesita un camino de ida y vuelta: del + a la carga y de regreso al −.",
    },
  ],
};
