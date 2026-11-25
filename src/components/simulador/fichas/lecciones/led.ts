import type { Leccion } from "../tipos";

export const leccion: Leccion = {
  nivel: "básico",
  duracion: "20 min",
  objetivos: [
    "Identificar el ánodo y el cátodo de un LED.",
    "Calcular la resistencia limitadora para una corriente segura.",
    "Explicar por qué un LED se quema sin resistencia.",
  ],
  secciones: [
    {
      titulo: "Un diodo que emite luz",
      parrafos: [
        "El LED solo conduce de ánodo (A, pata larga) a cátodo (K, pata corta y lado plano). Al revés no enciende.",
        "Cuando conduce, mantiene una caída casi fija llamada voltaje directo (VF): unos 2 V el rojo y unos 3 V el azul o el blanco.",
      ],
    },
    {
      titulo: "La resistencia limitadora",
      parrafos: [
        "El LED no limita su propia corriente: si le aplicas más que VF, la corriente se dispara. Por eso siempre va con una resistencia en serie.",
        "R = (Vfuente − VF) / I. Para 9 V, un LED rojo (2.1 V) y 15 mA: R = 6.9 / 0.015 ≈ 460 Ω, y se usa el valor comercial de 470 Ω.",
      ],
    },
    {
      titulo: "Límites",
      parrafos: [
        "La corriente máxima típica es 20 mA. Con 5–10 mA ya brilla bien.",
        "En inversa soporta solo unos 5 V. El simulador avisa si un LED está invertido o si pasa de 20 mA.",
      ],
    },
  ],
  practica: {
    titulo: "Enciende un LED sin quemarlo",
    pasos: [
      "Arma batería 9 V → resistencia 470 Ω → LED (A) → LED (K) → batería −.",
      "Simula: el LED debe encenderse con unos 14.7 mA.",
      "Quita la resistencia y conecta el LED directo: simula y lee el aviso.",
      "Invierte el LED y simula de nuevo.",
    ],
    preguntaGuia: "¿Qué resistencia necesitarías para 10 mA con una fuente de 5 V? (R = (5 − 2.1) / 0.01 = 290 Ω; usa 330 Ω.)",
  },
  cuestionario: [
    {
      pregunta: "¿Cuál pata del LED va hacia el positivo?",
      opciones: ["La corta (cátodo)", "La larga (ánodo)", "Cualquiera", "La del lado plano"],
      correcta: 1,
      explicacion: "El ánodo, la pata larga, va hacia el +. El lado plano marca el cátodo.",
    },
    {
      pregunta: "Con 9 V, un LED de 2 V y una resistencia de 350 Ω, ¿cuánta corriente circula?",
      opciones: ["2 mA", "20 mA", "26 mA", "200 mA"],
      correcta: 1,
      explicacion: "I = (9 − 2) / 350 = 0.02 A = 20 mA: justo en el límite.",
    },
    {
      pregunta: "¿Por qué no se conecta un LED directo a 9 V?",
      opciones: ["Porque no enciende", "Porque la corriente no tiene límite y se quema", "Porque necesita corriente alterna", "Porque invierte la polaridad"],
      correcta: 1,
      explicacion: "Por encima de VF la corriente crece sin control: hace falta una resistencia en serie.",
    },
  ],
};
