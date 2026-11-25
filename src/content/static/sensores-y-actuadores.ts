import type { CourseSource } from "../types";

// Cifras del curso: LDR de 10 kΩ a 10 lx con γ = 0.7, ultrasónico de 2 a 400 cm, motor de 6 V (70 mA sin carga,
// 9000 rpm, 1.2 A de bloqueo), buzzer activo de 5 V / 30 mA y transistor NPN con β = 100, 0.2 A y 40 V.
export const SENSORES_Y_ACTUADORES: CourseSource = {
  slug: "sensores-y-actuadores",
  title: "Sensores y actuadores",
  description:
    "Cómo medir la luz y la distancia, cómo mover un motor y hacer sonar un buzzer, y cómo el transistor BJT maneja cargas que un pin no aguanta.",
  level: "Principiante+",
  duration: "30 min",
  art: "sensors",
  lessons: [
    {
      slug: "fotorresistencia-ldr",
      title: "La fotorresistencia (LDR)",
      summary: "Un resistor que cambia su valor con la luz.",
      scene: "ldr",
      blocks: [
        {
          type: "paragraph",
          text: "La fotorresistencia o LDR es un resistor cuyo valor depende de la luz que recibe: mientras más luz, menos resistencia. No tiene polaridad y se conecta como cualquier resistor de dos terminales.",
        },
        {
          type: "paragraph",
          text: "La del simulador vale 10 kΩ con 10 lux de iluminación (una habitación en penumbra) y sigue esta relación, con γ = 0.7:",
        },
        { type: "formula", expression: "R = 10 kΩ × (10 lx / luz)^0.7", caption: "No es lineal: la resistencia baja más despacio de lo que sube la luz" },
        {
          type: "list",
          items: [
            "1 lx (casi oscuro): R ≈ 50.1 kΩ",
            "10 lx: R = 10 kΩ",
            "100 lx: R ≈ 2.0 kΩ",
            "1000 lx: R ≈ 400 Ω",
          ],
        },
        {
          type: "paragraph",
          text: "Para convertir ese cambio de resistencia en un voltaje que pueda medirse, se pone en un divisor de voltaje. Con 9 V, un resistor fijo de 10 kΩ y la LDR abajo, el voltaje sobre la LDR es:",
        },
        { type: "formula", expression: "Vout = 9 V × R_LDR / (10 kΩ + R_LDR)", caption: "1 lx → 7.5 V · 10 lx → 4.5 V · 100 lx → 1.5 V" },
        {
          type: "callout",
          title: "PARA RECORDAR",
          text: "Con la LDR abajo del divisor, más luz significa menos voltaje de salida. Si la pones arriba y el resistor abajo, ocurre al revés.",
        },
        {
          type: "callout",
          tone: "warning",
          title: "FALLOS TÍPICOS",
          text: "Abierta: la rama no conduce. En corto: queda con muy poca resistencia y no responde a la luz. Con el envejecimiento o la suciedad pierde sensibilidad. Las LDR reales, además, reaccionan despacio, en decenas de milisegundos.",
        },
      ],
      quiz: {
        question: "En un divisor de 9 V con un resistor fijo de 10 kΩ arriba y la LDR abajo, ¿qué pasa con Vout cuando le llega más luz?",
        options: ["Sube", "Baja", "No cambia", "Se vuelve negativo"],
        answer: 1,
        explanation: "Más luz reduce la resistencia de la LDR, y la parte del voltaje que se queda en ella baja: de 4.5 V a 10 lx pasa a 1.5 V a 100 lx.",
      },
    },
    {
      slug: "sensor-ultrasonico",
      title: "El sensor ultrasónico",
      summary: "Medir distancias con un eco de sonido.",
      scene: "ultrasonic",
      blocks: [
        {
          type: "paragraph",
          text: "Los murciélagos se orientan con el eco, y este sensor hace lo mismo: emite un chirrido que no oyes (ultrasonido), espera a que rebote en un objeto y mide cuánto tarda en volver.",
        },
        {
          type: "list",
          items: [
            "VCC: alimentación (5 V en el módulo HC-SR04 de referencia).",
            "TRIG: entrada. Un pulso corto aquí inicia la medición.",
            "ECHO: salida. Se mantiene en alto un tiempo proporcional a la distancia.",
            "GND: tierra.",
          ],
        },
        {
          type: "paragraph",
          text: "El sonido viaja a unos 343 m/s en aire a 20 °C. Como el eco hace ida y vuelta, la distancia es la mitad del recorrido:",
        },
        { type: "formula", expression: "d = v · t / 2", caption: "En centímetros: d ≈ t(µs) / 58" },
        {
          type: "list",
          items: [
            "Objeto a 50 cm (el valor inicial del simulador): el eco tarda 2.9 ms.",
            "Objeto a 2 cm (el mínimo): unos 117 µs.",
            "Objeto a 400 cm (el máximo): unos 23.3 ms.",
          ],
        },
        {
          type: "callout",
          tone: "warning",
          title: "LÍMITES",
          text: "El rango del simulador es de 2 a 400 cm. Fuera de él no hay lectura fiable. Las superficies blandas absorben el sonido y las inclinadas lo desvían, y el eco no vuelve.",
        },
        {
          type: "callout",
          title: "¿SABÍAS QUE?",
          text: "La velocidad del sonido sube unos 0.6 m/s por cada grado de temperatura. Un día muy frío o muy caluroso mueve la medida unos puntos porcentuales.",
        },
      ],
      quiz: {
        question: "El eco tarda 5.8 ms en volver al sensor. ¿A qué distancia está el objeto, aproximadamente?",
        options: ["50 cm", "100 cm", "200 cm", "580 cm"],
        answer: 1,
        explanation: "d = 343 m/s × 0.0058 s / 2 ≈ 0.995 m, casi 100 cm. Recuerda dividir entre 2 porque el sonido va y vuelve.",
      },
    },
    {
      slug: "motor-dc",
      title: "El motor de corriente continua",
      summary: "Convertir electricidad en giro y por qué consume tanto al frenarse.",
      scene: "motor",
      blocks: [
        {
          type: "paragraph",
          text: "El motor DC convierte la energía eléctrica en giro. Tiene dos terminales y, si inviertes la polaridad, cambia el sentido de giro. Su velocidad es aproximadamente proporcional al voltaje que recibe.",
        },
        {
          type: "paragraph",
          text: "El del simulador es nominal de 6 V, consume 70 mA sin carga, gira a 9000 rpm sin carga y alcanza 1.2 A si el eje se bloquea.",
        },
        {
          type: "list",
          items: [
            "Sin carga: gira libre, con la corriente mínima. A 6 V consume 6 V × 70 mA = 0.42 W.",
            "Con carga: cuanto más lo frena la carga, más corriente consume.",
            "Bloqueado: el eje se detiene y la corriente se dispara. A 6 V son 6 V × 1.2 A = 7.2 W de calor que el motor no está hecho para disipar.",
          ],
        },
        { type: "formula", expression: "R(bobinado) ≈ V / I(bloqueo) = 6 V / 1.2 A = 5 Ω", caption: "Parado, el motor es casi solo la resistencia de su alambre" },
        {
          type: "callout",
          tone: "warning",
          title: "NO LO CONECTES DIRECTO A UN PIN",
          text: "Un pin de Arduino entrega apenas 20 mA recomendados, y el motor pide 70 mA vacío y mucho más con carga. Se maneja con un transistor, que verás en esta misma unidad, y con un diodo en paralelo que absorba el pico al apagarlo.",
        },
        {
          type: "callout",
          title: "OJO",
          text: "6 V es el valor nominal del modelo, no un rango físico confirmado. Alimentar con más voltaje lo acelera y lo calienta; usa la ficha del motor real antes de conectarlo.",
        },
        {
          type: "callout",
          title: "FALLOS TÍPICOS",
          text: "Bobinado abierto: no gira. Espiras en corto: más corriente, menos par y calor. Escobillas o rodamientos gastados: arranque irregular, ruido y chispas.",
        },
      ],
      quiz: {
        question: "El eje de un motor de 6 V se bloquea. ¿Qué corriente circula aproximadamente en el simulador?",
        options: ["70 mA", "0.5 A", "1.2 A", "12 A"],
        answer: 2,
        explanation: "La corriente de bloqueo del motor del simulador es de 1.2 A: unas 17 veces la que consume sin carga (70 mA).",
      },
    },
    {
      slug: "buzzer-activo",
      title: "El buzzer activo",
      summary: "Un zumbador que suena con solo alimentarlo.",
      scene: "buzzer",
      blocks: [
        {
          type: "paragraph",
          text: "Un buzzer convierte una señal eléctrica en sonido. Hay dos tipos y no se pueden confundir: el pasivo necesita que le envíes una señal alterna con la frecuencia del tono, y el activo lleva un oscilador interno y suena en cuanto le llega corriente continua.",
        },
        {
          type: "paragraph",
          text: "El del simulador es activo, de 5 V nominales y 30 mA. Tiene polaridad: el terminal + va al positivo. Siempre emite el mismo tono, y lo único que controlas es cuándo suena y cuándo no.",
        },
        { type: "formula", expression: "P = 5 V × 30 mA = 150 mW", caption: "Potencia nominal del buzzer" },
        {
          type: "paragraph",
          text: "Con un microcontrolador, hacer sonar el buzzer es tan simple como encender un LED. Este programa lo hace pitar cada 200 ms:",
        },
        {
          type: "code",
          language: "cpp",
          code: "void setup() {\n  pinMode(8, OUTPUT);\n}\n\nvoid loop() {\n  digitalWrite(8, HIGH);  // suena\n  delay(200);\n  digitalWrite(8, LOW);   // silencio\n  delay(200);\n}",
        },
        {
          type: "callout",
          tone: "warning",
          title: "OJO CON LA CORRIENTE",
          text: "Los 30 mA del buzzer superan los 20 mA que se recomiendan por pin en un Arduino UNO. Para no forzar el pin, conéctalo a través de un transistor, como verás en la siguiente lección.",
        },
        {
          type: "callout",
          title: "FALLOS TÍPICOS",
          text: "Circuito interno abierto: no suena. En corto: demanda demasiada corriente y puede hundir el voltaje de la fuente. Oscilador o membrana dañados: sonido débil, distorsionado o ausente.",
        },
      ],
      quiz: {
        question: "¿Qué diferencia a un buzzer activo de uno pasivo?",
        options: [
          "El activo lleva un oscilador interno y suena con solo alimentarlo",
          "El activo es más grande",
          "El pasivo no necesita energía",
          "El activo solo funciona con corriente alterna",
        ],
        answer: 0,
        explanation: "El oscilador interno genera el tono: al activo le basta corriente continua. El pasivo necesita que la señal de audio venga de fuera.",
      },
    },
    {
      slug: "transistor-bjt",
      title: "El transistor BJT como interruptor",
      summary: "Controlar una corriente grande con una pequeña.",
      scene: "transistor",
      blocks: [
        {
          type: "paragraph",
          text: "El transistor BJT es un interruptor que se acciona con corriente en vez de con la mano. Tiene tres terminales: base (B), colector (C) y emisor (E). El del simulador es NPN, y una corriente pequeña por la base permite que circule una corriente mucho mayor del colector al emisor.",
        },
        {
          type: "list",
          items: [
            "Corte: si la base no recibe corriente (menos de unos 0.7 V entre base y emisor), no pasa corriente por el colector. Es el interruptor abierto.",
            "Saturación: con suficiente corriente de base, el transistor conduce a fondo y el colector queda casi a 0 V respecto al emisor. Es el interruptor cerrado.",
            "Amplificación: entre ambos extremos, Ic = β · Ib. El β del modelo es 100.",
          ],
        },
        {
          type: "paragraph",
          text: "Ejemplo: manejar el buzzer (5 V, 30 mA) desde un pin de 5 V. La base nunca va directa al pin: necesita un resistor, igual que un LED.",
        },
        { type: "formula", expression: "Rb = (5 V − 0.7 V) / 4.3 mA = 1 kΩ", caption: "Ib = 4.3 mA; para 30 mA bastarían 0.3 mA (30 mA / β)" },
        {
          type: "paragraph",
          text: "Se usa mucha más corriente de base de la mínima para que el transistor sature bien, y el pin, con 4.3 mA, queda lejos de su límite. El buzzer va del positivo al colector y el emisor se conecta a tierra.",
        },
        {
          type: "callout",
          tone: "warning",
          title: "LÍMITES DEL MODELO",
          text: "El transistor del simulador soporta 0.2 A de colector y 40 V entre colector y emisor. El buzzer (30 mA) cabe de sobra, pero un motor que se bloquea (1.2 A) no: pasaría de largo el límite. Para eso hace falta un transistor de potencia.",
        },
        {
          type: "callout",
          tone: "warning",
          title: "FALLOS TÍPICOS",
          text: "Unión abierta: no conmuta. Unión en corto: conduce siempre o con mucha fuga. Ganancia degradada: la carga deja de activarse. Y una base sin resistor es la forma más rápida de quemarlo.",
        },
      ],
      quiz: {
        question: "Un pin de 5 V alimenta la base de un transistor NPN por un resistor de 1 kΩ (VBE = 0.7 V). ¿Cuánta corriente de base circula?",
        options: ["5 mA", "4.3 mA", "0.7 mA", "43 mA"],
        answer: 1,
        explanation: "Ib = (5 − 0.7) V / 1000 Ω = 4.3 mA. Los 5 mA olvidan la caída base-emisor de 0.7 V.",
      },
    },
  ],
};
