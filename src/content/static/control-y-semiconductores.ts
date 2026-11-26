import type { CourseSource } from "../types";

// Cifras del curso: fuente de 9 V, resistor de 1 kΩ, potenciómetro de 10 kΩ (posición 0 = cursor en A),
// diodo de 0.7 V (1 A, 50 V inversos) y LED rojo con caída de 2 V y máximo de 20 mA.
export const CONTROL_Y_SEMICONDUCTORES: CourseSource = {
  slug: "control-y-semiconductores",
  title: "Control y semiconductores",
  description:
    "Cómo abrir, cerrar y regular un circuito con interruptor, pulsador y potenciómetro, y cómo el diodo y el LED dirigen la corriente.",
  level: "Principiante",
  duration: "30 min",
  art: "control",
  lessons: [
    {
      slug: "interruptor",
      title: "El interruptor",
      summary: "Abrir y cerrar el camino de la corriente.",
      scene: "switch",
      blocks: [
        {
          type: "paragraph",
          text: "El interruptor es la llave de paso de un circuito: cuando está cerrado deja pasar la corriente, y cuando está abierto la corta. Se queda en la posición en que lo dejes, y por eso se usa para encender y apagar aparatos.",
        },
        {
          type: "list",
          items: [
            "Cerrado: es un camino libre, casi como un cable. El circuito funciona.",
            "Abierto: el camino queda cortado. No circula corriente por ningún punto del circuito en serie.",
          ],
        },
        {
          type: "paragraph",
          text: "Con una fuente de 9 V y un resistor de 1 kΩ en serie: con el interruptor cerrado circulan 9 mA. Abierto, la corriente es 0.",
        },
        {
          type: "paragraph",
          text: "Hay un detalle que sorprende: con el interruptor abierto no circula corriente, así que el resistor no tiene caída de voltaje (0 V). Los 9 V completos aparecen entre los contactos abiertos del interruptor.",
        },
        { type: "formula", expression: "V(interruptor abierto) = 9 V − 0 V = 9 V", caption: "Sin corriente, el resistor no «se queda» con nada" },
        {
          type: "callout",
          tone: "warning",
          title: "FALLOS TÍPICOS",
          text: "Contactos que no cierran (el circuito no conduce aunque esté «encendido»), contactos soldados (se queda cerrado siempre) o contactos oxidados, que calientan y fallan de forma intermitente.",
        },
        {
          type: "callout",
          title: "REVISA LA FICHA",
          text: "Cada interruptor real tiene límites de corriente y voltaje, y los de corriente continua no son los mismos que los de alterna. El interruptor del simulador empieza abierto.",
        },
      ],
      quiz: {
        question: "En un circuito de 9 V con un resistor de 1 kΩ, el interruptor está abierto. ¿Cuánto voltaje hay entre los contactos del interruptor?",
        options: ["0 V", "4.5 V", "9 V", "9 mA"],
        answer: 2,
        explanation: "Sin corriente el resistor no tiene caída de voltaje, así que toda la tensión de la fuente (9 V) queda entre los contactos abiertos.",
      },
    },
    {
      slug: "pulsador",
      title: "El pulsador",
      summary: "Un contacto que solo actúa mientras lo presionas.",
      scene: "button",
      blocks: [
        {
          type: "paragraph",
          text: "A diferencia del interruptor, el pulsador no se queda en su posición: actúa mientras lo mantienes presionado y vuelve a su estado al soltarlo, gracias a un resorte. Es el botón del timbre.",
        },
        {
          type: "list",
          items: [
            "NO (normalmente abierto): abierto en reposo, cerrado mientras lo presionas. Es el del simulador.",
            "NC (normalmente cerrado): cerrado en reposo, se abre al presionarlo.",
          ],
        },
        {
          type: "paragraph",
          text: "Ejemplo: 9 V, un resistor de 470 Ω, el pulsador y un LED rojo en serie. Mientras presionas, circula una corriente de unos 15 mA y el LED se enciende. Al soltar, se apaga.",
        },
        { type: "formula", expression: "I = (9 V − 2 V) / 470 Ω ≈ 14.9 mA", caption: "Dentro del límite de 20 mA del LED" },
        {
          type: "callout",
          tone: "warning",
          title: "ENTRADAS FLOTANTES",
          text: "Si conectas un pulsador a la entrada de un microcontrolador, cuando está suelto la entrada queda «al aire» y puede leer valores al azar. Se resuelve con un resistor de 10 kΩ que la lleve a un nivel conocido, un pull-down o un pull-up. Lo verás en el curso de microcontroladores.",
        },
        {
          type: "callout",
          title: "¿SABÍAS QUE?",
          text: "Los contactos de un pulsador real rebotan durante unos milisegundos antes de asentarse. Para una luz no se nota, pero un contador de pulsaciones puede contar de más. El pulsador del simulador es ideal.",
        },
      ],
      quiz: {
        question: "En el circuito de 9 V, 470 Ω y un LED rojo (2 V), ¿cuánta corriente circula mientras mantienes presionado el pulsador?",
        options: ["19 mA", "14.9 mA", "4.3 mA", "0 mA"],
        answer: 1,
        explanation: "Con el contacto cerrado, I = (9 − 2) / 470 ≈ 14.9 mA. Los 19 mA olvidan la caída del LED; con el pulsador suelto la corriente sería 0.",
      },
    },
    {
      slug: "potenciometro",
      title: "El potenciómetro",
      summary: "Un resistor con perilla que sirve para regular.",
      scene: "potentiometer",
      blocks: [
        {
          type: "paragraph",
          text: "Un potenciómetro es un resistor cuyo valor cambias girando una perilla. Tiene tres terminales: los extremos A y B, que son los de la pista resistiva, y el cursor W, un contacto móvil que se desliza por ella.",
        },
        {
          type: "paragraph",
          text: "El del simulador es de 10 kΩ y su posición va de 0 a 1, desde el extremo A (0) hasta el B (1). El cursor divide la pista en dos partes que siempre suman 10 kΩ:",
        },
        {
          type: "formula", expression: "R(A–W) = 10 kΩ × posición · R(W–B) = 10 kΩ × (1 − posición)",
        },
        {
          type: "paragraph",
          text: "Si pones A a 9 V y B a 0 V, el potenciómetro es un divisor de voltaje con perilla y el cursor saca una parte del voltaje:",
        },
        { type: "formula", expression: "Vout = Vin × (1 − posición)", caption: "Con A a Vin y B a 0 V" },
        {
          type: "list",
          items: [
            "Posición 0.25: Vout = 9 × 0.75 = 6.75 V",
            "Posición 0.50: Vout = 9 × 0.50 = 4.5 V",
            "Posición 0.75: Vout = 9 × 0.25 = 2.25 V",
          ],
        },
        { type: "playground", kind: "divider" },
        {
          type: "callout",
          title: "DOS USOS",
          text: "Como divisor, con los tres terminales (volumen, brillo, entrada analógica). Como resistor variable, con solo A y W, para ajustar una corriente.",
        },
        {
          type: "callout",
          tone: "warning",
          title: "FALLOS TÍPICOS",
          text: "Con el uso, el cursor se ensucia o se desgasta y la resistencia cambia a saltos, con ruido o cortes. También puede romperse la pista y perderse la continuidad.",
        },
      ],
      quiz: {
        question: "Con A a 9 V, B a 0 V y el potenciómetro en la posición 0.25, ¿cuánto sale por el cursor?",
        options: ["2.25 V", "4.5 V", "6.75 V", "9 V"],
        answer: 2,
        explanation: "Entre el cursor y B quedan 10 kΩ × 0.75 = 7.5 kΩ de los 10 kΩ, así que Vout = 9 V × 0.75 = 6.75 V.",
      },
    },
    {
      slug: "diodo",
      title: "El diodo",
      summary: "Una válvula que deja pasar la corriente en un solo sentido.",
      scene: "diode",
      blocks: [
        {
          type: "paragraph",
          text: "El diodo es una válvula antirretorno para la corriente. Tiene dos terminales: el ánodo (A) y el cátodo (K). En el símbolo, el triángulo apunta hacia donde se deja pasar la corriente y la barra marca el cátodo.",
        },
        {
          type: "list",
          items: [
            "Polarización directa (ánodo más positivo que el cátodo): conduce y se queda con unos 0.7 V. Es la caída directa del modelo.",
            "Polarización inversa: bloquea y casi no pasa corriente. El del simulador aguanta hasta 50 V inversos.",
            "Corriente directa máxima del modelo: 1 A.",
          ],
        },
        {
          type: "paragraph",
          text: "Con 9 V, un diodo en directa y un resistor de 1 kΩ en serie, el diodo se queda con 0.7 V y el resistor con el resto:",
        },
        { type: "formula", expression: "I = (9 V − 0.7 V) / 1 kΩ = 8.3 mA", caption: "Al revés, I ≈ 0 y los 9 V caen sobre el diodo" },
        {
          type: "list",
          items: [
            "Protección contra polaridad invertida: un diodo en serie con la entrada bloquea la corriente si conectas la batería al revés (a cambio, pierdes 0.7 V).",
            "Diodo de protección (flyback): en paralelo con un motor o una bobina, absorbe el pico de voltaje que aparece al cortar la corriente.",
            "Rectificación: convierte corriente alterna en continua.",
          ],
        },
        {
          type: "callout",
          tone: "warning",
          title: "OJO",
          text: "Un diodo no limita la corriente: en directa casi no se opone a ella. Sin un resistor en serie, la corriente solo la frena el resto del circuito y el diodo se daña si supera su límite.",
        },
        {
          type: "callout",
          title: "FALLOS TÍPICOS",
          text: "Abierto, no conduce ni en directa. En corto, conduce en los dos sentidos. Si superas la tensión inversa máxima entra en ruptura y puede quedar dañado.",
        },
      ],
      quiz: {
        question: "Una fuente de 9 V, un diodo en directa (0.7 V) y un resistor de 1 kΩ en serie. ¿Qué corriente circula?",
        options: ["9 mA", "8.3 mA", "0 mA", "7 mA"],
        answer: 1,
        explanation: "El diodo se queda con 0.7 V, así que el resistor tiene 8.3 V y I = 8.3 / 1000 = 8.3 mA. Los 7 mA serían con un LED rojo (2 V).",
      },
    },
    {
      slug: "led-rojo",
      title: "El LED rojo",
      summary: "Un diodo que emite luz y cómo elegir su resistor.",
      scene: "led",
      blocks: [
        {
          type: "paragraph",
          text: "El LED (diodo emisor de luz) es un diodo que, al conducir, se ilumina. Por eso también tiene polaridad: la pata larga es el ánodo (+) y el lado plano de la cápsula marca el cátodo (−). Conectado al revés no se enciende.",
        },
        {
          type: "list",
          items: [
            "Caída directa del modelo: 2 V (un LED rojo real ronda esa cifra, y cambia según el modelo).",
            "Corriente máxima: 20 mA. Más allá pierde brillo con el tiempo o se daña.",
            "Su brillo depende de la corriente, no del voltaje.",
          ],
        },
        {
          type: "paragraph",
          text: "Como casi no se opone a la corriente, hay que limitarla con un resistor en serie. La fórmula sirve para cualquier fuente:",
        },
        { type: "formula", expression: "R = (Vfuente − 2 V) / I", caption: "I es la corriente que quieres, por debajo de 20 mA" },
        {
          type: "list",
          items: [
            "9 V y 10 mA: R = 7 V / 10 mA = 700 Ω. Con el valor comercial de 680 Ω circulan 10.3 mA.",
            "5 V (Arduino) y 220 Ω: I = 3 V / 220 Ω ≈ 13.6 mA.",
            "5 V y 330 Ω: I = 3 V / 330 Ω ≈ 9.1 mA, más suave.",
          ],
        },
        { type: "playground", kind: "led" },
        {
          type: "callout",
          tone: "warning",
          title: "FALLOS TÍPICOS",
          text: "Abierto: queda apagado. En corto: no ilumina y deja de limitar la corriente. Con exceso de corriente o calor, pierde brillo o se daña de forma permanente.",
        },
      ],
      quiz: {
        question: "Con una fuente de 5 V, un LED rojo (2 V) y un resistor de 330 Ω, ¿qué corriente circula?",
        options: ["15.2 mA", "9.1 mA", "6.1 mA", "20 mA"],
        answer: 1,
        explanation: "I = (5 − 2) / 330 ≈ 9.1 mA. Los 15.2 mA olvidan la caída del LED y los 6.1 mA salen de usar solo los 2 V del LED.",
      },
    },
  ],
};
