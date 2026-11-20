# Diseño: playground básico de circuitos

## Intención

Crear en la página principal de Circuitos un playground web de prueba donde se puedan colocar componentes, conectar sus terminales y simular un circuito. El primer resultado comprobable es encender un LED con una batería y una resistencia.

## Enfoques considerados

- **Constructor interactivo (elegido):** agregar componentes desde una bandeja, moverlos en el área de trabajo, unir terminales y ejecutar la simulación. Es la experiencia de playground solicitada y aprovecha los modelos existentes.
- **Circuito prearmado:** ofrecer una batería, resistencia y LED ya conectados para ajustar valores. Es más corto de construir, pero no permite practicar conexiones.

## Alcance

- La página `/` muestra el área de trabajo y una bandeja para batería DC, resistencia y LED.
- Se pueden añadir, mover y quitar componentes; conectar y desconectar terminales; ajustar el voltaje de la batería y la resistencia.
- Una acción de simulación construye el circuito con las clases de `simulacion` y usa `DCSolver` para mostrar si el LED conduce y su corriente.
- El caso inicial incluye una ruta sencilla para colocar en serie batería, resistencia y LED, cerrando el circuito de vuelta a la batería.
- La experiencia sirve para escritorio y móvil, con controles utilizables sin depender únicamente de arrastrar.

## Fuera de alcance

No incluye todavía otros componentes, análisis transitorio, guardar/compartir circuitos, curvas, ni un editor de diagramas eléctricos de propósito general.

## Restricciones y decisiones de implementación

- Mantener Next.js y React del proyecto; conectar la interfaz con la biblioteca TypeScript `simulacion` existente.
- No añadir dependencias para el editor básico.
- La interfaz debe distinguir circuito incompleto/error de simulación y LED encendido.
- El diseño visual y los detalles de interacción quedan a criterio de implementación, respetando el idioma español y la sencillez de una prueba funcional.
