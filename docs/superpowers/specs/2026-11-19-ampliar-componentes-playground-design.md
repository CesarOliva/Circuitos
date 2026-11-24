# Diseño: ampliar los componentes del playground

## Intención

Ampliar el constructor existente con los otros 11 componentes que ya están modelados en `simulacion`, para que el usuario pueda armar circuitos con más variedad y observar los resultados.

## Enfoques considerados

- **Agregar todo en una tanda:** cobertura rápida, pero mezcla controles, sensores y salidas con interacciones distintas y hace difícil revisar cada familia.
- **Agregar por familias (elegido):** cada grupo queda integrado y utilizable antes de añadir el siguiente. Respeta la petición de ir ampliando el playground y permite aprovechar los modelos existentes de cada componente.

## Alcance

- Incorporar diodo, capacitor, inductor, switch, pulsador, potenciómetro, LDR, sensor ultrasónico, motor DC, buzzer activo y transistor BJT.
- Organizar la bandeja por familias y ofrecer valores iniciales editables donde el modelo los permita.
- Añadir terminales, controles, dibujo y lecturas para cada componente; los controles de switch, pulsador, potenciómetro y sensores deben afectar las simulaciones.
- Usar `DCSolver` y reflejar sus aproximaciones educativas, incluidos capacitor e inductor en estado estacionario.
- Implementar en tres tandas: pasivos y controles; sensores y actuadores; transistor.

## Fuera de alcance

No se añaden nuevas clases al solver, análisis transitorio, componentes Arduino, persistencia, compartir ni autoruteo de conexiones.

## Restricciones y decisiones

- Mantener Next.js y la biblioteca `simulacion` existentes, sin dependencias nuevas.
- Preservar el uso actual de batería, resistencia y LED.
- Mantener conexiones explícitas entre terminales; mostrar valores y estados devueltos por el solver, sin presentar la aproximación como física de fabricante.
- Las variaciones internas de cada clase que no estén expuestas en el editor quedan con valores iniciales documentados.
