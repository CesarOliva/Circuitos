import type { Leccion } from "../tipos";

export const leccion: Leccion = {
  nivel: "básico",
  duracion: "20 min",
  objetivos: [
    "Leer el valor de una resistencia por su código de colores.",
    "Aplicar la ley de Ohm y la fórmula de potencia.",
    "Elegir una resistencia que no se sobrecaliente.",
  ],
  secciones: [
    {
      titulo: "Qué hace una resistencia",
      parrafos: [
        "Limita la corriente y produce una caída de voltaje proporcional a ella: V = I · R. Se mide en ohmios (Ω).",
        "En serie, las resistencias se suman (R = R1 + R2). Dos iguales en serie reparten el voltaje a la mitad: es un divisor de voltaje.",
      ],
    },
    {
      titulo: "Código de colores",
      parrafos: [
        "Las dos primeras bandas son dígitos y la tercera es el multiplicador. Amarillo (4), violeta (7) y marrón (×10) dan 470 Ω. La banda dorada indica ±5 %.",
        "Colores: negro 0, marrón 1, rojo 2, naranja 3, amarillo 4, verde 5, azul 6, violeta 7, gris 8, blanco 9.",
      ],
    },
    {
      titulo: "Potencia: el límite que más se olvida",
      parrafos: [
        "La resistencia convierte energía en calor: P = V · I = V² / R. Una de 1/4 W no debe disipar más de 0.25 W.",
        "Con 9 V sobre 100 Ω, P = 81 / 100 = 0.81 W: más del triple de lo permitido. El simulador lo marca como advertencia.",
      ],
    },
  ],
  practica: {
    titulo: "¿Cuándo se calienta una resistencia?",
    pasos: [
      "Conecta una batería de 9 V a una resistencia de 470 Ω y simula.",
      "Anota la corriente y calcula la potencia con P = V · I.",
      "Baja la resistencia a 100 Ω y simula de nuevo.",
      "Revisa la sección «Validación de voltajes» de esta ficha con esos mismos valores.",
    ],
    preguntaGuia: "¿Cuál es la resistencia mínima que puedes usar a 9 V sin superar 0.25 W? (R = V² / P = 324 Ω.)",
  },
  cuestionario: [
    {
      pregunta: "¿Qué valor tiene una resistencia marrón-negro-rojo-dorado?",
      opciones: ["10 Ω", "100 Ω", "1 kΩ", "10 kΩ"],
      correcta: 2,
      explicacion: "Marrón (1), negro (0) y rojo (×100): 1000 Ω = 1 kΩ, ±5 %.",
    },
    {
      pregunta: "Una resistencia de 1 kΩ tiene 5 V entre sus terminales. ¿Qué potencia disipa?",
      opciones: ["5 mW", "25 mW", "250 mW", "5 W"],
      correcta: 1,
      explicacion: "P = V² / R = 25 / 1000 = 0.025 W = 25 mW.",
    },
    {
      pregunta: "Dos resistencias de 470 Ω en serie con 9 V. ¿Qué voltaje tiene cada una?",
      opciones: ["9 V", "4.5 V", "2.25 V", "0 V"],
      correcta: 1,
      explicacion: "Son iguales, así que se reparten el voltaje en partes iguales: 4.5 V cada una.",
    },
  ],
};
