# Diseño: interfaz de lectura de cursos

## Intención

Rediseñar la lectura de cada lección con la referencia visual compartida: fondo oscuro cálido, acento naranja, encabezado editorial contundente y un motivo técnico animado. Mantener el contenido y los controles reales del curso.

## Enfoques considerados

- **Lección editorial (elegido):** centrar el título y el contenido, enmarcados por el avance, los metadatos y un esquema de circuito animado. Conserva el curso mediante breadcrumb y navegación anterior/siguiente.
- **Temario lateral persistente:** facilita saltar entre lecciones, pero se aparta de la composición centrada de la referencia.

## Alcance

- Rediseñar la vista de lección sin cambiar contenido ni URLs.
- Conservar quiz y navegación anterior/siguiente; mantener una medida cómoda para la columna de lectura.
- Adaptar título, diagrama y contenido a móvil; respetar movimiento reducido.

## Fuera de alcance

No incluye progreso guardado, cambios al contenido de las lecciones ni ajustes al resto del sitio.

## Restricciones y decisiones de implementación

- Mantener Next.js, los datos del repositorio actual y sus rutas dinámicas.
- Usar CSS y componentes locales; no añadir dependencias ni inventar duraciones o ejercicios.
- El dibujo animado es un esquema ilustrativo de un circuito en serie, no una simulación eléctrica.
