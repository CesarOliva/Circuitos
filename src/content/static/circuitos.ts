import type { SubjectSource } from "../types";

// Cifras del curso: R = 1 kΩ, V = 9 V, LED rojo con caída de 2 V, C = 100 µF.
export const CIRCUITOS: SubjectSource = {
  slug: "circuitos",
  name: "Circuitos",
  tagline: "Electrónica básica y simulación de circuitos",
  description:
    "Las magnitudes de la electricidad, la ley de Ohm y los componentes más comunes, con cálculos que puedes repetir en el simulador.",
  courses: [
    {
      slug: "circuitos-basicos",
      title: "Circuitos básicos",
      description:
        "Las magnitudes de la electricidad, la ley de Ohm y los componentes más comunes, con cálculos que puedes repetir en el simulador.",
      level: "Principiante",
      duration: "20 min",
      art: "circuit",
      lessons: [
        {
          slug: "voltaje-corriente-resistencia",
          title: "Voltaje, corriente y resistencia",
          summary: "Las tres magnitudes que describen cualquier circuito.",
          blocks: [
            {
              type: "paragraph",
              text: "El voltaje (V) es la diferencia de potencial que empuja a las cargas por el circuito. Se mide en voltios (V).",
            },
            {
              type: "paragraph",
              text: "La corriente (I) es la cantidad de carga que pasa por un punto cada segundo. Se mide en amperios (A).",
            },
            {
              type: "paragraph",
              text: "La resistencia (R) se opone al paso de la corriente. Se mide en ohmios (Ω).",
            },
            {
              type: "paragraph",
              text: "Una analogía útil: el voltaje es la presión de una bomba de agua, la corriente es el caudal y la resistencia es el diámetro de la tubería.",
            },
          ],
          quiz: {
            question: "¿En qué unidad se mide la resistencia?",
            options: ["Voltio (V)", "Amperio (A)", "Ohmio (Ω)", "Vatio (W)"],
            answer: 2,
            explanation: "La resistencia se mide en ohmios (Ω). El voltio mide el voltaje y el amperio, la corriente.",
          },
        },
        {
          slug: "ley-de-ohm",
          title: "La ley de Ohm",
          summary: "Cómo calcular la corriente de un circuito sencillo.",
          blocks: [
            {
              type: "paragraph",
              text: "La ley de Ohm relaciona las tres magnitudes: V = I · R. Despejando, I = V / R y R = V / I.",
            },
            {
              type: "paragraph",
              text: "Ejemplo: una fuente de 9 V conectada a un resistor de 1 kΩ (1000 Ω). La corriente es I = 9 V / 1000 Ω = 0.009 A = 9 mA.",
            },
            {
              type: "paragraph",
              text: "Si mantienes el voltaje y duplicas la resistencia, la corriente se reduce a la mitad.",
            },
          ],
          quiz: {
            question: "Con una fuente de 9 V y un resistor de 1 kΩ, ¿cuánta corriente circula?",
            options: ["9 A", "9 mA", "0.9 mA", "900 mA"],
            answer: 1,
            explanation: "I = 9 V / 1000 Ω = 0.009 A, es decir, 9 mA.",
          },
        },
        {
          slug: "led-y-resistor",
          title: "El LED y su resistor",
          summary: "Por qué un LED nunca se conecta sin resistencia.",
          blocks: [
            {
              type: "paragraph",
              text: "Un LED es un diodo: deja pasar la corriente en un solo sentido, del ánodo (+) al cátodo (−), y emite luz al hacerlo. La pata larga es el ánodo.",
            },
            {
              type: "paragraph",
              text: "Un LED rojo típico tiene una caída de voltaje de unos 2 V: mientras conduce, mantiene cerca de 2 V entre sus terminales.",
            },
            {
              type: "paragraph",
              text: "Como esa caída casi no cambia, sin resistencia la corriente crecería hasta dañar el LED. Por eso se conecta en serie con un resistor: (9 V − 2 V) / 1 kΩ = 7 mA.",
            },
          ],
          quiz: {
            question: "¿Por qué un LED necesita un resistor en serie?",
            options: [
              "Para aumentar el voltaje",
              "Para limitar la corriente y no dañarlo",
              "Para hacerlo más brillante",
              "Para cambiar su color",
            ],
            answer: 1,
            explanation: "Como la caída del LED es casi fija, el resistor limita la corriente para que el LED no se dañe.",
          },
        },
        {
          slug: "serie-y-paralelo",
          title: "Serie y paralelo",
          summary: "Cómo se combinan las resistencias.",
          blocks: [
            {
              type: "paragraph",
              text: "En serie, las resistencias se suman: R = R1 + R2, y la misma corriente pasa por todas.",
            },
            {
              type: "paragraph",
              text: "En paralelo, la corriente se reparte y el equivalente cumple 1 / R = 1 / R1 + 1 / R2.",
            },
            {
              type: "paragraph",
              text: "Dos resistores de 1 kΩ en serie valen 2 kΩ. Los mismos dos en paralelo valen 500 Ω.",
            },
          ],
          quiz: {
            question: "Dos resistores de 1 kΩ conectados en paralelo equivalen a…",
            options: ["2 kΩ", "1 kΩ", "500 Ω", "250 Ω"],
            answer: 2,
            explanation: "1 / R = 1 / 1000 + 1 / 1000 = 2 / 1000, así que R = 500 Ω.",
          },
        },
        {
          slug: "capacitor-y-carga",
          title: "El capacitor y la carga",
          summary: "Por qué el voltaje de un capacitor sube poco a poco.",
          blocks: [
            {
              type: "paragraph",
              text: "Un capacitor almacena carga. Con un resistor en serie, su voltaje sube siguiendo V(t) = V0 · (1 − e^(−t/τ)), con τ = R · C.",
            },
            {
              type: "paragraph",
              text: "Con R = 1 kΩ y C = 100 µF, τ = 1000 Ω × 100 µF = 0.1 s.",
            },
            {
              type: "paragraph",
              text: "Tras τ el voltaje llega al 63 % de 9 V, unos 5.7 V. Tras 5τ, al 99 %: ya está prácticamente cargado.",
            },
          ],
          quiz: {
            question: "Con R = 1 kΩ y C = 100 µF, ¿cuánto vale la constante de tiempo τ?",
            options: ["0.1 s", "1 s", "10 s", "0.01 s"],
            answer: 0,
            explanation: "τ = R · C = 1000 Ω × 0.0001 F = 0.1 s.",
          },
        },
      ],
    },
  ],
};