import type { SubjectSource } from "../types";
import { ANALISIS_DE_CIRCUITOS } from "./analisis-de-circuitos";

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
          scene: "magnitudes",
          blocks: [
            {
              type: "paragraph",
              text: "Imagina una manguera conectada a una bomba de agua. Con eso ya entiendes casi todo lo que pasa dentro de un circuito.",
            },
            {
              type: "list",
              items: [
                "Voltaje (V): la presión de la bomba. Es lo que empuja las cargas. Se mide en voltios (V).",
                "Corriente (I): el caudal, cuánta carga pasa por segundo. Se mide en amperios (A).",
                "Resistencia (R): qué tan angosta es la tubería. Mientras más angosta, menos pasa. Se mide en ohmios (Ω).",
              ],
            },
            { type: "playground", kind: "pipe" },
            {
              type: "callout",
              title: "¿SABÍAS QUE?",
              text: "Una pila AA da 1.5 V y no sientes nada al tocarla. Un enchufe de casa da más de 100 V y sí puede hacerte daño. Por eso con los enchufes no se juega.",
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
          scene: "ohm",
          blocks: [
            {
              type: "paragraph",
              text: "Hay una ecuación que vas a usar toda tu vida en electrónica, y cabe en una línea:",
            },
            { type: "formula", expression: "V = I · R", caption: "Voltaje = corriente × resistencia" },
            {
              type: "paragraph",
              text: "Si la despejas, te sirve para sacar lo que te falte: I = V / R y R = V / I.",
            },
            {
              type: "paragraph",
              text: "Ejemplo: una fuente de 9 V con un resistor de 1 kΩ (1000 Ω). La corriente es I = 9 V / 1000 Ω = 0.009 A = 9 mA.",
            },
            { type: "playground", kind: "ohm" },
            {
              type: "callout",
              title: "TRUCO MENTAL",
              text: "Mismo voltaje y el doble de resistencia, la mitad de corriente. Es una proporción inversa: puedes comprobarlo con los controles de arriba.",
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
          scene: "led",
          blocks: [
            {
              type: "paragraph",
              text: "Un LED es como un portero muy estricto: deja pasar la corriente en un solo sentido, del ánodo (+) al cátodo (−), y de paso se ilumina. La pata larga es el ánodo.",
            },
            {
              type: "paragraph",
              text: "Su problema: mientras conduce, mantiene casi fijos unos 2 V entre sus terminales (en uno rojo). Casi no se opone a la corriente, así que si lo conectas directo a 9 V, pasa tanta que se quema.",
            },
            {
              type: "paragraph",
              text: "La solución es un resistor en serie: se queda con los voltios que le sobran al LED.",
            },
            { type: "formula", expression: "I = (9 V − 2 V) / 1 kΩ = 7 mA", caption: "El resistor absorbe los 7 V restantes" },
            { type: "playground", kind: "led" },
            {
              type: "callout",
              tone: "warning",
              title: "OJO",
              text: "Un LED normal aguanta unos 20 mA. Con 9 V y 2 V de caída, necesitas más de 350 Ω para no pasarte.",
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
          scene: "series-parallel",
          blocks: [
            {
              type: "paragraph",
              text: "Dos resistores se pueden conectar de dos formas, y cada una cambia por completo lo que pasa.",
            },
            {
              type: "list",
              items: [
                "En serie: uno detrás de otro, con un solo camino. La misma corriente pasa por todos y las resistencias se suman: R = R1 + R2.",
                "En paralelo: varios caminos a la vez. La corriente se reparte y el equivalente cumple 1 / R = 1 / R1 + 1 / R2.",
              ],
            },
            {
              type: "paragraph",
              text: "Con dos resistores de 1 kΩ: en serie valen 2 kΩ y en paralelo, 500 Ω.",
            },
            { type: "playground", kind: "series-parallel" },
            {
              type: "callout",
              title: "PARA RECORDAR",
              text: "En paralelo la resistencia equivalente siempre sale menor que la más pequeña: más caminos, más fácil pasar. Las luces de tu casa están en paralelo, por eso si una se funde las demás siguen prendidas.",
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
          scene: "capacitor",
          blocks: [
            {
              type: "paragraph",
              text: "Un capacitor es como un depósito de carga: al principio se llena rápido, pero cada vez le cuesta más porque ya hay carga dentro empujando de vuelta.",
            },
            {
              type: "paragraph",
              text: "Con un resistor en serie, su voltaje sube siguiendo esta fórmula, donde τ = R · C se llama constante de tiempo:",
            },
            { type: "formula", expression: "V(t) = V0 · (1 − e^(−t/τ))", caption: "τ = R · C" },
            {
              type: "paragraph",
              text: "Con R = 1 kΩ y C = 100 µF: τ = 1000 Ω × 100 µF = 0.1 s.",
            },
            { type: "playground", kind: "capacitor" },
            {
              type: "callout",
              title: "REGLA RÁPIDA",
              text: "Tras τ el voltaje llega al 63 % de 9 V, unos 5.7 V. Tras 5τ, al 99 %: ya está prácticamente cargado.",
            },
            {
              type: "callout",
              title: "¿SABÍAS QUE?",
              text: "El flash de una cámara usa un capacitor: tarda unos segundos en cargarse y luego suelta toda la energía de golpe.",
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
    ANALISIS_DE_CIRCUITOS,
  ],
};