# Comportamiento de fallos de componentes

## Intención

Completar el comportamiento de fallo del simulador tomando como catálogo las fallas de las fichas técnicas. La galería `/componentes/fallos`, las fichas y el playground deben describir los mismos fallos para cada componente que el simulador representa.

## Objetivos

- Hacer que `/componentes/fallos` presente todos los fallos de las fichas de los componentes simulados, con el mismo nombre y efecto. La ficha será la fuente del texto; las señales visuales serán datos complementarios.
- Detectar automáticamente fallos deducibles de voltaje, corriente o potencia medidos al simular, usando los límites compartidos de `componentSpecs.ts`.
- Aplicar automáticamente solo las fallas eléctricas con condición medible que aprobó el usuario; no agregar selector ni marcas de daño físico para fallas cualitativas al playground. Se conserva el comportamiento ya implementado de LED quemado.
- Reflejar los efectos eléctricos/funcionales aprobados en la simulación y mantener los fallos aislados por componente.

## No objetivos

- Simular temperatura, envejecimiento, tolerancias, ruido, arcos, rebotes, daños físicos cualitativos o propagación temporal del daño.
- Activar daños de placas Arduino/ESP32 o errores de montaje de protoboard como fallos de un componente de dos terminales.

## Enfoques considerados

1. **Solo detección automática:** cubre sobrevoltaje, sobrecorriente y sobrepotencia, pero deja sin comportamiento los fallos mecánicos y de contacto de las fichas.
2. **Solo selección manual:** permite provocar cada falla, pero no representa el daño que el circuito ya causa al exceder un límite.
3. **Detección automática cuantitativa:** activa solo los estados aprobados por mediciones eléctricas. Las fallas cualitativas se quedan documentadas en fichas y galería, sin inyección manual. **Elegido por el usuario.**

## Reglas de comportamiento

- La primera simulación resuelve el circuito sano y determina si algún límite que implica daño fue excedido.
- Los fallos se vuelven a calcular en cada ejecución y no persisten al cambiar o reiniciar el circuito.
- Si una ficha permite abierto o corto, se elige corto. Si describe un estado específico, se respeta ese estado.
- `/componentes/fallos` deriva nombres y efectos de las fichas de los componentes simulados. Los recursos gráficos pueden seguir mostrando fallos cualitativos como referencia; no implican que estén inyectados en el playground.

## Alcance

Incluye los componentes eléctricos disponibles en el playground y sus fichas: fuente DC, resistor, LED, diodo, capacitor, inductor, interruptor, pulsador, potenciómetro, LDR, sensor ultrasónico, motor DC, buzzer y transistor. Se activan los fallos automáticos aceptados: resistor >0.25 W (abierto); potenciómetro >0.2 W (cursor sin conexión); inductor >1 A (saturado); diodo >50 V en inversa (corto); buzzer >120 % del voltaje nominal (silencioso); transistor >600 mA o >40 V entre colector y emisor (corto C–E); y motor bloqueado (0 RPM). El capacitor con sobrevoltaje no se incluye porque su ficha solo describe daño físico sin estado eléctrico.

La galería debe incluir todos los fallos de las fichas que tienen modelo y componente en el catálogo, incluidos los que no se activan automáticamente.

Los fallos de Arduino/ESP32, protoboard y problemas externos (por ejemplo no poner un diodo de rueda libre o apuntar el sensor a una superficie blanda) quedan documentados en sus fichas; no se activan desde el modelo eléctrico individual.

## Implementación

El playground resuelve primero el circuito sano, detecta las fallas con las mediciones resultantes y vuelve a resolver cuando cambia la topología. El inductor saturado se reporta; no cambia el resultado eléctrico DC porque su modelo de estado estable es un corto ideal. La galería deriva los nombres y efectos de `Ficha.fallos`, y los recursos visuales solo aportan señales gráficas.
