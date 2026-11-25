import type { CourseSource } from "../types";

// Cifras del curso: fuente de 9 V, resistor de 1 kΩ (5 %, 0.25 W), capacitor de 100 µF / 25 V,
// inductor de 10 mH con 2 Ω de resistencia serie y protoboard de 30 filas (a–j) con 4 rieles.
export const FUENTE_PROTOBOARD_Y_PASIVOS: CourseSource = {
  slug: "fuente-protoboard-y-pasivos",
  title: "Fuente, protoboard y pasivos",
  description:
    "La batería que alimenta el circuito, la protoboard donde lo armas y los tres componentes pasivos: resistor, capacitor e inductor.",
  level: "Principiante",
  duration: "30 min",
  art: "passive",
  lessons: [
    {
      slug: "bateria-dc",
      title: "La batería de corriente continua",
      summary: "De dónde sale la energía de un circuito y por qué importa la polaridad.",
      scene: "source",
      blocks: [
        {
          type: "paragraph",
          text: "Sin una fuente no pasa nada: los componentes no generan energía, solo la reparten, la guardan o la gastan. La batería (fuente de voltaje DC) mantiene una diferencia de potencial constante entre sus dos terminales.",
        },
        {
          type: "list",
          items: [
            "Terminal positivo (+): la placa larga del símbolo. Es el punto de mayor voltaje.",
            "Terminal negativo (−): la placa corta. Es la referencia de 0 V de todo el circuito.",
            "Corriente continua (DC): el voltaje no cambia de signo, así que la corriente siempre circula en el mismo sentido.",
          ],
        },
        {
          type: "paragraph",
          text: "La corriente sale por el positivo, recorre el circuito y regresa por el negativo. Si el recorrido se corta en cualquier punto, la corriente es cero en todo el circuito.",
        },
        {
          type: "paragraph",
          text: "La fuente del simulador es de 9 V. Conectada a un resistor de 1 kΩ circulan 9 mA y la fuente entrega esta potencia:",
        },
        { type: "formula", expression: "P = V · I = 9 V × 9 mA = 81 mW", caption: "Potencia que entrega la fuente" },
        {
          type: "callout",
          tone: "warning",
          title: "OJO",
          text: "Nunca unas el + con el − con un cable solo (cortocircuito). Sin resistencia que lo frene, la corriente se dispara: una batería real se calienta y puede dañarse. Siempre pasa por una carga.",
        },
        {
          type: "callout",
          title: "¿SABÍAS QUE?",
          text: "Una batería real tiene resistencia interna, por eso su voltaje baja un poco cuando le pides mucha corriente. La fuente del simulador es ideal y mantiene siempre sus 9 V.",
        },
      ],
      quiz: {
        question: "Una batería de 9 V alimenta un resistor de 1 kΩ. ¿Cuánta potencia entrega la batería?",
        options: ["9 mW", "81 mW", "0.9 W", "9 W"],
        answer: 1,
        explanation: "I = 9 V / 1000 Ω = 9 mA y P = V · I = 9 V × 0.009 A = 0.081 W, es decir, 81 mW.",
      },
    },
    {
      slug: "protoboard-filas-y-rieles",
      title: "Protoboard: filas, rieles y cables",
      summary: "Cómo se numeran los agujeros y cómo planear un montaje sin errores.",
      scene: "breadboard",
      blocks: [
        {
          type: "paragraph",
          text: "La protoboard te deja armar circuitos sin soldar. La del simulador tiene 30 filas numeradas del 1 al 30, con columnas de la a a la j, y cuatro rieles de alimentación. Cada agujero tiene un nombre, como c12 o f7.",
        },
        {
          type: "list",
          items: [
            "Cada fila está partida en dos tiras por el canal central: a–e unidas entre sí, y f–j unidas entre sí. Pero b7 y g7 no están conectados.",
            "Dos filas distintas nunca están unidas: a1 y a2 son independientes.",
            "Los rieles top+, top−, bottom+ y bottom− recorren las 30 filas completas: sirven para repartir el positivo y el negativo.",
          ],
        },
        { type: "playground", kind: "breadboard" },
        {
          type: "paragraph",
          text: "Un buen montaje se planea de la fuente hacia afuera. Por ejemplo, para un resistor y un LED en serie:",
        },
        {
          type: "list",
          ordered: true,
          items: [
            "Lleva el positivo de la fuente al riel top+ y el negativo al riel top−.",
            "Un cable desde top+ hasta a5.",
            "El resistor entre b5 y b10: sus patas quedan en tiras distintas.",
            "El LED entre c10 (ánodo) y c15 (cátodo).",
            "Un cable desde d15 hasta top−.",
          ],
        },
        {
          type: "callout",
          tone: "warning",
          title: "ERRORES TÍPICOS",
          text: "Las dos patas de un componente en la misma tira (lo pones en corto), cruzar el canal central creyendo que la fila sigue unida, o un contacto flojo que hace que el circuito funcione «a ratos».",
        },
        {
          type: "callout",
          title: "PARA RECORDAR",
          text: "Una protoboard no es para cargas de potencia: sus contactos se calientan y pierden presión con corrientes altas. Úsala para señales y circuitos pequeños.",
        },
      ],
      quiz: {
        question: "En la protoboard del simulador, ¿cuáles de estos agujeros están conectados entre sí?",
        options: ["b7 y g7", "c7 y c8", "b7 y d7", "a1 y a30"],
        answer: 2,
        explanation: "b7 y d7 están en la misma fila y en la misma mitad (a–e). b7 y g7 quedan separados por el canal central, y las filas distintas nunca se unen.",
      },
    },
    {
      slug: "resistor-valor-y-tolerancia",
      title: "El resistor: valor, tolerancia y potencia",
      summary: "Cómo leer sus bandas de colores y qué límites tiene.",
      scene: "resistor",
      blocks: [
        {
          type: "paragraph",
          text: "El resistor limita la corriente y provoca una caída de voltaje. El valor de los resistores pequeños no se imprime con números: se pinta con bandas de colores.",
        },
        {
          type: "list",
          items: [
            "Banda 1 y banda 2: los dos primeros dígitos.",
            "Banda 3: el multiplicador, es decir, cuántos ceros añadir.",
            "Banda 4: la tolerancia. Dorado es ± 5 % y plateado es ± 10 %.",
          ],
        },
        {
          type: "list",
          items: [
            "Negro 0 · Marrón 1 · Rojo 2 · Naranja 3 · Amarillo 4",
            "Verde 5 · Azul 6 · Violeta 7 · Gris 8 · Blanco 9",
          ],
        },
        {
          type: "paragraph",
          text: "Ejemplo: marrón (1), negro (0), rojo (×100), dorado (± 5 %) vale 10 × 100 = 1000 Ω, es decir, 1 kΩ con tolerancia del 5 %.",
        },
        {
          type: "paragraph",
          text: "La tolerancia significa que el valor real puede desviarse: un resistor de 1 kΩ al 5 % mide en realidad entre 950 Ω y 1050 Ω. Con 9 V, la corriente variaría entre 8.6 mA y 9.5 mA.",
        },
        {
          type: "formula", expression: "P = V² / R", caption: "Potencia que disipa el resistor. El del simulador aguanta 0.25 W",
        },
        {
          type: "callout",
          tone: "warning",
          title: "FALLOS TÍPICOS",
          text: "Con sobrecarga el resistor se calienta, su valor deriva y al final se abre (queda cortado). También puede quedar en corto, y entonces deja de limitar la corriente y pone en riesgo a los demás componentes.",
        },
        {
          type: "callout",
          title: "TRUCO",
          text: "Un resistor de 1 kΩ y 0.25 W soporta, por potencia, hasta unos 15.8 V (V = √(P · R)). Es solo un cálculo térmico: el límite real de tensión puede ser menor y depende de la ficha del resistor.",
        },
      ],
      quiz: {
        question: "Un resistor tiene las bandas naranja, naranja, marrón y dorado. ¿Cuánto vale?",
        options: ["33 Ω", "330 Ω ± 5 %", "3.3 kΩ ± 5 %", "33 kΩ ± 10 %"],
        answer: 1,
        explanation: "Naranja = 3, naranja = 3, marrón = ×10, así que 33 × 10 = 330 Ω. El dorado indica una tolerancia de ± 5 %.",
      },
    },
    {
      slug: "capacitor-polaridad-y-descarga",
      title: "El capacitor: polaridad y descarga",
      summary: "Qué guarda, por qué tiene polaridad y cómo se vacía.",
      scene: "capacitor",
      blocks: [
        {
          type: "paragraph",
          text: "Un capacitor guarda carga eléctrica entre dos placas. Su capacidad se mide en faradios y, como un faradio es enorme, en la práctica verás µF. El del simulador es de 100 µF, 25 V y polarizado.",
        },
        {
          type: "list",
          items: [
            "100 µF: cuánta carga guarda por cada voltio aplicado.",
            "25 V: el voltaje máximo que debe soportar. Opera siempre por debajo.",
            "Polarizado: tiene un terminal + y otro −. Invertirlo, o superar los 25 V, puede causar fugas, hinchazón e incluso ruptura.",
          ],
        },
        {
          type: "paragraph",
          text: "Cuando termina de cargarse, el capacitor ya no deja pasar corriente continua: se comporta como un circuito abierto. La energía que guarda depende del voltaje:",
        },
        { type: "formula", expression: "E = ½ · C · V² = ½ × 100 µF × (9 V)² = 4.05 mJ", caption: "Energía almacenada a 9 V" },
        {
          type: "paragraph",
          text: "Si lo conectas a un resistor, se descarga siguiendo la curva contraria a la de carga, con la misma constante de tiempo τ = R · C. Con 1 kΩ y 100 µF, τ = 0.1 s.",
        },
        { type: "formula", expression: "V(t) = V0 · e^(−t/τ)", caption: "Tras τ queda el 37 % del voltaje inicial; tras 5τ, menos del 1 %" },
        {
          type: "paragraph",
          text: "El simulador de abajo muestra la carga con el mismo resistor y capacitor; la descarga es su imagen en espejo: lo que sube al cargarse, baja al descargarse.",
        },
        { type: "playground", kind: "capacitor" },
        {
          type: "callout",
          title: "PARA QUÉ SIRVE",
          text: "Filtra variaciones de la fuente (estabiliza el voltaje), da tiempos de espera con un resistor y entrega de golpe la energía que guardó, como el flash de una cámara.",
        },
      ],
      quiz: {
        question: "Un capacitor de 100 µF cargado a 9 V se descarga por un resistor de 1 kΩ. ¿Cuánto voltaje tiene tras 0.1 s (un τ)?",
        options: ["0 V", "Aproximadamente 3.3 V", "Aproximadamente 5.7 V", "9 V"],
        answer: 1,
        explanation: "Al descargarse queda e⁻¹ ≈ 37 % del voltaje inicial: 9 V × 0.37 ≈ 3.3 V. Los 5.7 V son lo que alcanza al cargarse, que es la curva contraria.",
      },
    },
    {
      slug: "inductor-y-campo-magnetico",
      title: "El inductor y el campo magnético",
      summary: "Por qué una bobina se opone a que la corriente cambie de golpe.",
      scene: "inductor",
      blocks: [
        {
          type: "paragraph",
          text: "Un inductor es una bobina de alambre. Cuando la atraviesa corriente crea un campo magnético, y ese campo guarda energía. Si imaginas una turbina pesada en una tubería, cuesta ponerla en marcha y cuesta detenerla: el inductor «se resiste a los cambios».",
        },
        { type: "formula", expression: "V = L · ΔI / Δt", caption: "El voltaje depende de qué tan rápido cambia la corriente" },
        {
          type: "paragraph",
          text: "El del simulador es de 10 mH (milihenrios) y tiene 2 Ω de resistencia serie, la del propio alambre. En corriente continua estable la corriente ya no cambia, así que el voltaje del inductor es 0 y se comporta como un simple cable de 2 Ω.",
        },
        {
          type: "paragraph",
          text: "Al conectarlo a 9 V con un resistor de 1 kΩ, la corriente no salta de golpe: sube hasta casi 9 mA con una constante de tiempo τ = L / R:",
        },
        { type: "formula", expression: "τ = L / R = 10 mH / 1002 Ω ≈ 10 µs", caption: "Con R = 1 kΩ más los 2 Ω del alambre" },
        {
          type: "paragraph",
          text: "Compáralo con el capacitor: con 1 kΩ y 100 µF el τ era de 0.1 s. Con una bobina pequeña todo ocurre en microsegundos.",
        },
        {
          type: "callout",
          tone: "warning",
          title: "OJO CON LOS PICOS",
          text: "Si cortas de golpe la corriente por un inductor, este intenta mantenerla y genera un voltaje muy alto durante un instante. Ese pico puede dañar un transistor o un interruptor. Por eso los motores y relés llevan un diodo de protección, que verás en el siguiente curso.",
        },
        {
          type: "callout",
          title: "DATO",
          text: "El modelo del simulador no declara corriente máxima ni de saturación. En un inductor real sí existen: al saturarse el núcleo, la inductancia cae y la corriente crece muy rápido.",
        },
      ],
      quiz: {
        question: "Cuando la corriente continua ya se estabilizó, ¿cómo se comporta un inductor?",
        options: [
          "Como un circuito abierto",
          "Como un cable, con solo la resistencia de su alambre",
          "Como un capacitor cargado",
          "Como una fuente de voltaje",
        ],
        answer: 1,
        explanation: "Sin cambios de corriente, V = L · ΔI / Δt vale 0: solo queda la resistencia serie del alambre (2 Ω en el simulador).",
      },
    },
  ],
};
