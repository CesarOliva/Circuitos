# Ajuste de patas a la protoboard

## Intención

Al mover un componente en la vista 2D, facilitar que sus patas caigan en los agujeros de la protoboard y queden conectadas a las filas o rieles correspondientes.

## Enfoques

- **Seleccionar terminal y agujero:** ya crea una conexión lógica representada por un cable; no cumple el ajuste físico solicitado.
- **Mover cada pata por separado:** deformaría la geometría del componente.
- **Mover el componente rígido y anclar una pata al agujero cercano:** elegido. Conserva la pieza y su cableado; las patas que coinciden con agujeros crean contactos directos.

## Diseño

- Durante el arrastre 2D, buscar la pareja pata-agujero más cercana en las protoboards colocadas. Si está a menos de aproximadamente dos tercios del paso entre agujeros, trasladar la pieza completa para alinear esa pata con el agujero.
- Después del ajuste, cada pata alineada con un agujero establece contacto directo con la fila o riel de ese agujero. El contacto no dibuja un cable y desaparece si la pieza se mueve fuera del agujero.
- Dibujar los agujeros conectados como ocupados y usar esos contactos al construir la red de simulación.
- Si no hay protoboard cercana, el componente se mueve como ahora. La vista 3D, la escala de las piezas y el comportamiento de los cables explícitos quedan fuera del cambio.

## Límites

La pieza no rota ni se deforma. El ajuste desplaza el componente entero; solo las patas que efectivamente coinciden con agujeros se conectan. Se reutilizan el paso y las coordenadas existentes de la protoboard.
