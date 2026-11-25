import type { CourseSource } from "../types";

// Cifras del curso, tomadas de los perfiles de placa del simulador:
// Arduino UNO R3 (5 V, 16 MHz, ADC de 1024 niveles, 20 pines) y ESP32 DevKit V1 (3.3 V, 240 MHz, ADC de 4096 niveles).
export const MICROCONTROLADORES: CourseSource = {
  slug: "microcontroladores",
  title: "Microcontroladores: Arduino UNO y ESP32",
  description:
    "Qué es un microcontrolador, cómo se diferencian el Arduino UNO y el ESP32, y cómo leer entradas y activar salidas con un programa.",
  level: "Intermedio",
  duration: "30 min",
  art: "digital",
  lessons: [
    {
      slug: "que-es-un-microcontrolador",
      title: "Qué es un microcontrolador",
      summary: "Una computadora diminuta que lee entradas y activa salidas.",
      scene: "mcu",
      blocks: [
        {
          type: "paragraph",
          text: "Un microcontrolador es una computadora completa en un solo chip: procesador, memoria y pines para conectarlo con el mundo. No tiene pantalla ni teclado; su trabajo es ejecutar un programa, el sketch, leyendo señales de entrada y activando salidas.",
        },
        {
          type: "list",
          items: [
            "Entradas: lo que el microcontrolador lee. Un pulsador, una fotorresistencia, un sensor ultrasónico.",
            "Salidas: lo que activa. Un LED, un buzzer, un motor (con un transistor de por medio).",
            "El programa: decide qué salida activar según lo que lea.",
          ],
        },
        {
          type: "paragraph",
          text: "Un sketch tiene siempre dos partes: setup(), que se ejecuta una vez al arrancar, y loop(), que se repite sin parar. Este programa enciende y apaga un LED cada medio segundo:",
        },
        {
          type: "code",
          language: "cpp",
          code: "void setup() {\n  pinMode(13, OUTPUT);   // el pin 13 será una salida\n}\n\nvoid loop() {\n  digitalWrite(13, HIGH); // nivel alto: enciende\n  delay(500);\n  digitalWrite(13, LOW);  // nivel bajo: apaga\n  delay(500);\n}",
        },
        {
          type: "paragraph",
          text: "Los pines digitales solo tienen dos estados: HIGH (el voltaje de la placa) y LOW (0 V). Los pines analógicos de entrada, en cambio, convierten un voltaje en un número.",
        },
        {
          type: "paragraph",
          text: "El simulador incluye dos placas, el Arduino UNO R3 y el ESP32 DevKit V1. Hacen lo mismo con diferencias que importan, y las verás en las dos lecciones siguientes.",
        },
        {
          type: "callout",
          tone: "warning",
          title: "NO ES UNA FUENTE DE POTENCIA",
          text: "Un pin entrega miliamperios, no amperios. Alcanza para un LED con su resistor, pero no para un buzzer o un motor: esos se manejan con un transistor.",
        },
      ],
      quiz: {
        question: "En un sketch, ¿qué función se repite una y otra vez mientras la placa está encendida?",
        options: ["setup()", "loop()", "main()", "pinMode()"],
        answer: 1,
        explanation: "setup() corre una sola vez al arrancar y loop() se repite sin parar, millones de veces por segundo si el programa es corto.",
      },
    },
    {
      slug: "arduino-uno",
      title: "Arduino UNO R3",
      summary: "La placa más popular: 5 V, 14 pines digitales y 6 analógicos.",
      scene: "uno",
      blocks: [
        {
          type: "paragraph",
          text: "El Arduino UNO R3 lleva un microcontrolador ATmega328P. Trabaja con señales de 5 V, corre a 16 MHz y es una placa sencilla y robusta, ideal para empezar.",
        },
        {
          type: "list",
          items: [
            "Pines digitales D0 a D13: 14 pines que pueden ser entrada o salida.",
            "Pines analógicos A0 a A5: 6 entradas analógicas, que también pueden usarse como digitales. En el simulador son los pines 14 a 19, 20 en total.",
            "Alimentación: 5V y 3V3 como salidas de voltaje, GND (tierra) y VIN.",
            "Convertidor analógico-digital de 10 bits: convierte 0–5 V en un número de 0 a 1023.",
          ],
        },
        {
          type: "list",
          items: [
            "Límite de corriente por pin: 20 mA recomendados, 40 mA como máximo absoluto.",
            "D0 y D1 son el puerto serie (RX y TX) que usa la comunicación con el computador: conviene evitarlos para otras cosas.",
            "Seis pines (3, 5, 6, 9, 10 y 11) pueden dar una señal PWM con analogWrite(), útil para regular el brillo de un LED.",
          ],
        },
        {
          type: "paragraph",
          text: "Un LED con un resistor de 220 Ω en un pin de 5 V consume (5 − 2) / 220 ≈ 13.6 mA: dentro del límite.",
        },
        {
          type: "callout",
          tone: "warning",
          title: "OJO",
          text: "Las entradas analógicas del UNO solo aceptan de 0 a 5 V. Un voltaje mayor, o negativo, puede dañar el pin; el simulador rechaza esos valores.",
        },
        {
          type: "callout",
          title: "PARA RECORDAR",
          text: "El pin de 5 V de la placa te sirve para alimentar un sensor ultrasónico (VCC) o un divisor de voltaje con una LDR, y todas las señales de salida del UNO quedan a 5 V.",
        },
      ],
      quiz: {
        question: "¿Cuántas entradas analógicas tiene el Arduino UNO R3?",
        options: ["4", "6", "14", "20"],
        answer: 1,
        explanation: "Tiene seis, A0 a A5. Los 14 son los pines digitales y 20 es el total de pines que maneja el simulador.",
      },
    },
    {
      slug: "esp32-devkit",
      title: "ESP32 DevKit",
      summary: "Más rápido y con WiFi, pero a 3.3 V.",
      scene: "esp32",
      blocks: [
        {
          type: "paragraph",
          text: "El ESP32 DevKit V1 es una placa mucho más potente: procesador de dos núcleos a 240 MHz, WiFi y Bluetooth integrados. A cambio, trabaja con señales de 3.3 V y tiene algunas reglas propias.",
        },
        {
          type: "list",
          items: [
            "Voltaje lógico: 3.3 V. Un pin en HIGH da 3.3 V, no 5 V.",
            "Convertidor analógico-digital de 12 bits: convierte 0–3.3 V en un número de 0 a 4095. En el simulador están habilitados los GPIO 32, 33, 34, 35, 36 y 39.",
            "Pines: 15 por cada borde de la placa, nombrados por su número de GPIO, como 26 o 34.",
          ],
        },
        {
          type: "paragraph",
          text: "Así se comparan las dos placas del simulador:",
        },
        {
          type: "list",
          items: [
            "Voltaje lógico: UNO 5 V · ESP32 3.3 V",
            "Velocidad: UNO 16 MHz · ESP32 240 MHz",
            "Escala analógica: UNO 1024 pasos · ESP32 4096 pasos",
          ],
        },
        {
          type: "callout",
          tone: "warning",
          title: "LOS PINES NO SOPORTAN 5 V",
          text: "No conectes una señal de 5 V directo a un pin del ESP32: puedes dañarlo. El pin ECHO de un sensor ultrasónico de 5 V, por ejemplo, necesita un divisor de voltaje. Con 1 kΩ y 2 kΩ, 5 V × 2 / 3 ≈ 3.3 V.",
        },
        {
          type: "callout",
          title: "PINES ESPECIALES",
          text: "Los GPIO 34, 35, 36 y 39 solo funcionan como entradas: no pueden dar una salida. Y algunos pines, como los GPIO 0, 2, 12 y 15, definen cómo arranca la placa; evita conectarles algo que fuerce un nivel al encender.",
        },
      ],
      quiz: {
        question: "¿Qué pasa si conectas directamente una señal de 5 V a un pin del ESP32?",
        options: [
          "Nada, sus pines aceptan 5 V",
          "Puedes dañar el pin, porque solo tolera 3.3 V",
          "El ESP32 la convierte solo a 3.3 V",
          "Siempre la lee como HIGH sin problemas",
        ],
        answer: 1,
        explanation: "La lógica del ESP32 es de 3.3 V y sus pines no toleran 5 V. Usa un divisor de voltaje o un adaptador de nivel.",
      },
    },
    {
      slug: "salidas-digitales",
      title: "Salidas digitales: LED, buzzer y motor",
      summary: "Cuándo un pin basta y cuándo necesitas un transistor.",
      scene: "gpio-out",
      blocks: [
        {
          type: "paragraph",
          text: "Para usar un pin como salida: pinMode(pin, OUTPUT) y luego digitalWrite(pin, HIGH) o digitalWrite(pin, LOW). En HIGH el pin entrega el voltaje de la placa (5 V en el UNO, 3.3 V en el ESP32) y en LOW, 0 V.",
        },
        {
          type: "paragraph",
          text: "La pregunta clave es cuánta corriente pide la carga. Con un LED y un resistor de 220 Ω:",
        },
        {
          type: "list",
          items: [
            "Arduino UNO (5 V): I = (5 − 2) / 220 ≈ 13.6 mA",
            "ESP32 (3.3 V): I = (3.3 − 2) / 220 ≈ 5.9 mA. Si lo quieres más brillante, baja a 100 Ω (13 mA).",
          ],
        },
        {
          type: "paragraph",
          text: "El programa es el mismo en las dos placas; solo cambia el número de pin. Este hace parpadear el LED una vez por segundo:",
        },
        {
          type: "code",
          language: "cpp",
          code: "const int LED = 13;   // en el ESP32 usa un GPIO de salida, por ejemplo 26\n\nvoid setup() {\n  pinMode(LED, OUTPUT);\n}\n\nvoid loop() {\n  digitalWrite(LED, HIGH);\n  delay(500);\n  digitalWrite(LED, LOW);\n  delay(500);\n}",
        },
        {
          type: "list",
          items: [
            "LED con su resistor: directo al pin (5 a 15 mA).",
            "Buzzer activo (30 mA): con un transistor NPN y un resistor de 1 kΩ en la base.",
            "Motor DC (70 mA y más): con un transistor, un resistor de base y un diodo en paralelo con el motor.",
          ],
        },
        {
          type: "callout",
          tone: "warning",
          title: "REGLA PRÁCTICA",
          text: "Si la carga pide más de unos 20 mA, no la conectes directo al pin. Usa el pin solo para dar la orden al transistor y que este lleve la corriente.",
        },
      ],
      quiz: {
        question: "Un pin del ESP32 (3.3 V) alimenta un LED rojo (2 V) con un resistor de 220 Ω. ¿Qué corriente circula?",
        options: ["5.9 mA", "13.6 mA", "15 mA", "1.3 mA"],
        answer: 0,
        explanation: "I = (3.3 − 2) / 220 ≈ 5.9 mA. Los 13.6 mA serían los del Arduino UNO, que da 5 V.",
      },
    },
    {
      slug: "entradas-digitales-y-analogicas",
      title: "Entradas: pulsadores y sensores",
      summary: "Cómo lee un microcontrolador un botón y un voltaje.",
      scene: "adc",
      blocks: [
        {
          type: "paragraph",
          text: "La entrada digital más común es un pulsador. Si lo conectas entre el pin y GND, sin nada más, cuando está suelto el pin queda «al aire» y lee valores al azar. La solución más simple es activar el resistor interno que lleva el pin a HIGH, con INPUT_PULLUP:",
        },
        {
          type: "code",
          language: "cpp",
          code: "void setup() {\n  pinMode(2, INPUT_PULLUP);  // pulsador entre el pin 2 y GND\n  pinMode(13, OUTPUT);\n}\n\nvoid loop() {\n  bool pulsado = digitalRead(2) == LOW;  // LOW = presionado\n  digitalWrite(13, pulsado ? HIGH : LOW);\n}",
        },
        {
          type: "paragraph",
          text: "Con el pull-up, suelto lee HIGH y presionado lee LOW (el pulsador lo conecta a tierra). Si prefieres que presionado sea HIGH, usa un resistor externo de 10 kΩ a GND, un pull-down. Los pines GPIO 34 a 39 del ESP32 no tienen pull-up interno y necesitan uno externo.",
        },
        {
          type: "paragraph",
          text: "Para un voltaje, como el de un divisor con una LDR o un potenciómetro, se usa analogRead(pin). El resultado depende de la placa:",
        },
        {
          type: "list",
          items: [
            "Arduino UNO: 0 a 5 V se convierten en 0 a 1023. Cada paso son unos 4.9 mV.",
            "ESP32: 0 a 3.3 V se convierten en 0 a 4095. Cada paso son unos 0.8 mV.",
          ],
        },
        { type: "formula", expression: "V ≈ lectura × 5 V / 1024", caption: "En el UNO. En el ESP32: lectura × 3.3 V / 4096" },
        {
          type: "paragraph",
          text: "Ejemplo con una LDR en un divisor con un resistor de 10 kΩ, alimentado a 5 V y leído con un UNO: 1 lx da unos 4.2 V (≈ 853), 10 lx da 2.5 V (≈ 512) y 100 lx da 0.83 V (≈ 170). La lectura baja cuando sube la luz.",
        },
        {
          type: "callout",
          title: "SENSOR ULTRASÓNICO",
          text: "Con el HC-SR04 se da un pulso de 10 µs en TRIG y se mide con pulseIn(ECHO, HIGH) cuánto dura el pulso de ECHO. Dividido entre 58 da los centímetros. Recuerda que ECHO sale a 5 V: en el ESP32 va con divisor de voltaje.",
        },
        {
          type: "callout",
          tone: "warning",
          title: "OJO",
          text: "Una entrada analógica del UNO solo acepta de 0 a 5 V, y una del ESP32 de 0 a 3.3 V. El simulador rechaza voltajes fuera de ese rango.",
        },
      ],
      quiz: {
        question: "En un Arduino UNO, analogRead() devuelve 512. ¿Qué voltaje hay aproximadamente en el pin?",
        options: ["1.65 V", "2.5 V", "3.3 V", "5 V"],
        answer: 1,
        explanation: "V ≈ 512 × 5 V / 1024 = 2.5 V, la mitad de la escala. En el ESP32, un 2048 equivaldría a 1.65 V.",
      },
    },
  ],
};
