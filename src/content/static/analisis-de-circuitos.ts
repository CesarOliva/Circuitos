import type { CourseSource } from "../types";

// Cifras del curso: fuente de 9 V, resistor de 0.25 W, protoboard del simulador (30 filas de a–j y 4 rieles).
export const ANALISIS_DE_CIRCUITOS: CourseSource = {
  slug: "analisis-de-circuitos",
  title: "Análisis de circuitos y protoboard",
  description:
    "Potencia, divisores de voltaje, leyes de Kirchhoff y circuitos mixtos, y cómo armarlo todo sin errores en la protoboard.",
  level: "Principiante+",
  duration: "30 min",
  art: "analysis",
  lessons: [
    {
      slug: "potencia-y-limite-del-resistor",
      title: "Potencia y el límite del resistor",
      summary: "Por qué un resistor se calienta y cuánto puede aguantar.",
      scene: "power",
      blocks: [
        {
          type: "paragraph",
          text: "Todo resistor se calienta cuando pasa corriente por él. La energía que se va en forma de calor cada segundo se llama potencia y se mide en vatios (W).",
        },
        { type: "formula", expression: "P = V · I", caption: "Potencia = voltaje × corriente" },
        {
          type: "paragraph",
          text: "Combinada con la ley de Ohm sale otra versión muy útil: P = V² / R. Con 9 V y 1 kΩ: P = 81 / 1000 = 0.081 W, es decir, 81 mW.",
        },
        {
          type: "paragraph",
          text: "Cada resistor tiene un límite. El del simulador es de 0.25 W (un cuarto de vatio), el más común. Si lo superas, el simulador marca sobrecarga; en la vida real el resistor se calienta, se quema o cambia de valor.",
        },
        { type: "playground", kind: "power" },
        {
          type: "callout",
          tone: "warning",
          title: "OJO",
          text: "Con 9 V y 100 Ω circulan 90 mA y se disipan 0.81 W: más del triple de lo que aguanta. Menos resistencia no es «más fuerte», es más calor.",
        },
        {
          type: "callout",
          title: "TRUCO",
          text: "La resistencia mínima segura es R = V² / P. Con 9 V y 0.25 W sale 324 Ω, así que un resistor de 330 Ω queda justo al límite. Mejor usa 470 Ω o más.",
        },
      ],
      quiz: {
        question: "¿Cuánta potencia disipa un resistor de 100 Ω conectado a 9 V?",
        options: ["0.081 W", "0.81 W", "8.1 W", "0.09 W"],
        answer: 1,
        explanation: "P = V² / R = 81 / 100 = 0.81 W, más del triple del límite de 0.25 W.",
      },
    },
    {
      slug: "divisor-de-voltaje",
      title: "El divisor de voltaje",
      summary: "Cómo sacar de una fuente el voltaje que necesitas.",
      scene: "divider",
      blocks: [
        {
          type: "paragraph",
          text: "¿Cómo obtienes 3 V si solo tienes una fuente de 9 V? Con dos resistores en serie. Se reparten el voltaje de la fuente y tú tomas la parte que necesitas.",
        },
        { type: "formula", expression: "Vout = Vin · R2 / (R1 + R2)", caption: "Vout es el voltaje que cae sobre R2" },
        {
          type: "paragraph",
          text: "Mientras más grande es una resistencia, más voltaje se queda. Con R1 = 2 kΩ y R2 = 1 kΩ: Vout = 9 · 1 / (2 + 1) = 3 V.",
        },
        { type: "playground", kind: "divider" },
        {
          type: "callout",
          title: "¿SABÍAS QUE?",
          text: "Un potenciómetro es un divisor de voltaje con perilla: al girarla, una resistencia sube y la otra baja, y el voltaje del cursor cambia poco a poco. Así funcionan muchos controles de volumen.",
        },
        {
          type: "callout",
          tone: "warning",
          title: "OJO",
          text: "El divisor solo funciona bien si lo que conectas a Vout consume muy poca corriente. Si conectas algo que consuma mucho, como un motor, el voltaje cae.",
        },
      ],
      quiz: {
        question: "Con 9 V, R1 = 2 kΩ y R2 = 1 kΩ, ¿cuánto vale Vout sobre R2?",
        options: ["3 V", "4.5 V", "6 V", "9 V"],
        answer: 0,
        explanation: "Vout = 9 · 1 / (2 + 1) = 3 V. R2 es la tercera parte del total, así que se queda con la tercera parte del voltaje.",
      },
    },
    {
      slug: "leyes-de-kirchhoff",
      title: "Leyes de Kirchhoff",
      summary: "Dos reglas para analizar circuitos con varias ramas.",
      scene: "kirchhoff",
      blocks: [
        {
          type: "paragraph",
          text: "Cuando un circuito tiene varias ramas, la ley de Ohm sola no alcanza. Gustav Kirchhoff dejó dos reglas que sí resuelven el problema:",
        },
        {
          type: "list",
          items: [
            "Ley de corrientes (nodos): lo que entra a un punto de unión es lo que sale. Las corrientes que llegan suman lo mismo que las que se van.",
            "Ley de voltajes (mallas): al dar una vuelta completa por un lazo, los voltajes que caen en los componentes suman el voltaje de la fuente.",
          ],
        },
        {
          type: "paragraph",
          text: "Ejemplo con nodos: dos ramas conectadas a 9 V, una de 1 kΩ (9 mA) y otra de 2 kΩ (4.5 mA). La fuente entrega 9 + 4.5 = 13.5 mA.",
        },
        {
          type: "paragraph",
          text: "Ejemplo con mallas: 9 V con 2 kΩ y 1 kΩ en serie. La corriente es 3 mA, así que caen 6 V en R1 y 3 V en R2, y 6 + 3 = 9 V.",
        },
        { type: "playground", kind: "kirchhoff" },
        {
          type: "callout",
          title: "TRUCO MENTAL",
          text: "Piensa en agua: en una unión de tuberías no se pierde ni se inventa agua (nodos). Y si subes una colina y bajas por otra hasta el mismo punto, el desnivel total es cero (mallas).",
        },
      ],
      quiz: {
        question: "A un nodo entran 12 mA y por una de las ramas salen 5 mA. ¿Cuánto sale por la otra?",
        options: ["17 mA", "7 mA", "5 mA", "12 mA"],
        answer: 1,
        explanation: "Lo que entra es lo que sale: 12 mA = 5 mA + x, así que x = 7 mA.",
      },
    },
    {
      slug: "circuitos-mixtos",
      title: "Circuitos mixtos paso a paso",
      summary: "Cómo reducir serie y paralelo hasta una sola resistencia.",
      scene: "mixed",
      blocks: [
        {
          type: "paragraph",
          text: "Un circuito mixto tiene resistores en serie y en paralelo a la vez. No hay que asustarse: se resuelve por pasos, de adentro hacia afuera.",
        },
        {
          type: "list",
          ordered: true,
          items: [
            "Busca los resistores que están en paralelo y reemplázalos por su equivalente.",
            "Suma los que queden en serie para obtener la resistencia total.",
            "Calcula la corriente con la ley de Ohm: I = V / Req.",
            "Regresa por el circuito: con esa corriente saca el voltaje de cada parte y la corriente de cada rama.",
          ],
        },
        {
          type: "paragraph",
          text: "Ejemplo con 9 V: R1 = 1 kΩ en serie con R2 = 2 kΩ y R3 = 2 kΩ en paralelo. Primero R2 ∥ R3 = 1 kΩ. Luego Req = 1 kΩ + 1 kΩ = 2 kΩ. La corriente total es 9 V / 2 kΩ = 4.5 mA.",
        },
        { type: "playground", kind: "mixed" },
        {
          type: "callout",
          title: "RECUERDA",
          text: "Cuando termines, comprueba con Kirchhoff: los voltajes de la malla deben sumar 9 V y las corrientes de las ramas deben sumar la corriente total.",
        },
      ],
      quiz: {
        question: "R1 = 1 kΩ está en serie con dos resistores de 2 kΩ en paralelo. ¿Cuál es la resistencia total?",
        options: ["1 kΩ", "2 kΩ", "3 kΩ", "5 kΩ"],
        answer: 1,
        explanation: "2 kΩ en paralelo con 2 kΩ dan 1 kΩ, y 1 kΩ + 1 kΩ = 2 kΩ.",
      },
    },
    {
      slug: "protoboard",
      title: "Protoboard: conecta sin errores",
      summary: "Qué agujeros están unidos por dentro y cómo armar un circuito.",
      scene: "breadboard",
      blocks: [
        {
          type: "paragraph",
          text: "La protoboard es el tablero donde armas circuitos sin soldar. Por dentro tiene tiras metálicas que unen agujeros, y entender cuáles están unidos es la mitad del trabajo.",
        },
        {
          type: "list",
          items: [
            "Filas: la protoboard del simulador tiene 30 filas numeradas, cada una con 10 agujeros (a–j). Los cinco de la izquierda (a–e) están unidos entre sí, y los cinco de la derecha (f–j) también. El canal central las separa.",
            "Rieles: son 4 tiras largas de 30 agujeros, dos a cada lado, para llevar el positivo y el negativo de la fuente por toda la placa. Cada riel está unido de punta a punta.",
          ],
        },
        {
          type: "paragraph",
          text: "Con eso, un circuito en serie se arma así: llevas la fuente a los rieles, y cada componente va entre dos tiras distintas. La pata de un componente y la pata del siguiente comparten tira, y ahí es donde se conectan.",
        },
        { type: "playground", kind: "breadboard" },
        {
          type: "callout",
          tone: "warning",
          title: "ERRORES TÍPICOS",
          text: "Poner las dos patas de un componente en la misma tira (haces un corto y no pasa corriente por él), conectar un LED sin resistor, invertir la polaridad, o cruzar el canal central creyendo que la fila está unida.",
        },
        {
          type: "callout",
          title: "¿SABÍAS QUE?",
          text: "En algunas protoboards reales los rieles vienen partidos por la mitad y hay que unirlos con un cable. El del simulador no está partido.",
        },
      ],
      quiz: {
        question: "En la protoboard del simulador, ¿qué agujeros de la fila 5 están unidos entre sí?",
        options: [
          "Todos, de a5 a j5",
          "a5–e5 por un lado y f5–j5 por otro",
          "Solo a5 y j5",
          "Ninguno hasta poner un cable",
        ],
        answer: 1,
        explanation: "Cada fila se divide en dos tiras de cinco agujeros (a–e y f–j) separadas por el canal central.",
      },
    },
  ],
};
