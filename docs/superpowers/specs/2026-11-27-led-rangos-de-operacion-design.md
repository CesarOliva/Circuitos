# LED: rangos de operación en el simulador

## Intención

Hacer que cada LED del simulador represente lo que indica su ficha: apagado si no alcanza su caída directa, encendido dentro del rango seguro y quemado cuando excede los límites eléctricos. El mismo estado debe verse en 2D y 3D.

## Alcance

- Usar las mediciones del LED y los límites existentes de la ficha: caída directa configurable, umbral visual de 2 mA, corriente máxima de 20 mA y voltaje inverso máximo de 5 V.
- Un LED por debajo de su caída directa o polarizado en inversa no se ilumina. Si supera 20 mA o recibe más de 5 V en inversa, se muestra quemado y apagado.
- Aplicar los estados a cada LED individualmente en las vistas 2D y 3D; un LED activo no debe encender los demás.
- Mantener el ejemplo válido de la ficha: fuente de 9 V, resistencia de 470 Ω y LED rojo de 2.1 V (aprox. 14.7 mA) enciende sin quemarse.
- El estado se deriva de la última simulación y no persiste entre ejecuciones.

## Fuera de alcance

No se añade degradación gradual, memoria de daños entre simulaciones, ni cambios al solucionador eléctrico o a los límites publicados en la ficha.

## Enfoques considerados

1. Comparar directamente el voltaje de la fuente con la caída directa del LED. Es sencillo, pero marcaría como quemado el ejemplo de 9 V + 470 Ω de la ficha.
2. Evaluar el voltaje y la corriente medidos en cada LED contra la ficha y llevar ese estado a ambas vistas. Conserva el modelo eléctrico y el ejemplo de la ficha. **Elegido**, de acuerdo con la petición de seguir el comportamiento de la ficha.

## Pendiente para implementación

Reutilizar los límites existentes para derivar estado por componente y actualizar el dibujo 2D y el modelo 3D. Ajustar el mensaje de simulación cuando el LED esté quemado para no anunciar que está encendido.
