# Plan de implementación: ampliar componentes del playground

**Diseño aprobado:** `docs/superpowers/specs/2026-11-19-ampliar-componentes-playground-design.md`

## Cambios

1. Generalizar el catálogo de componentes del playground y conservar batería, resistencia y LED.
2. Representar terminales por posición y etiqueta para componentes de dos, tres y cuatro terminales; dibujar los símbolos en el estilo SVG existente.
3. Extender la fábrica de simulación para construir los 11 modelos restantes y conservar la validación/conexiones de `simulacion`.
4. Organizar la paleta en pasivos/controles, sensores/actuadores y semiconductores; configurar valores iniciales editables con unidades legibles.
5. Añadir estados interactivos para switch, pulsador, potenciómetro y entradas de sensores; mostrar mediciones DC para los componentes seleccionados.
6. Ejecutar la compilación de Next y el lint acotado a los archivos editados; revisar el diff sin instalar dependencias ni añadir tests.

## Tandas de entrega

- Pasivos y controles: diodo, capacitor, inductor, switch, pulsador y potenciómetro.
- Sensores y actuadores: LDR, ultrasonido, motor DC y buzzer.
- Semiconductor: transistor BJT.

Los valores se almacenan en unidades prácticas para la interfaz y se convierten a las unidades SI que reciben los modelos. Cada cambio al circuito invalida las mediciones anteriores hasta simular de nuevo. Los mensajes señalan las aproximaciones DC ya documentadas por el solver.
