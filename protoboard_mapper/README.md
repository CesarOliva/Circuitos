# Mapeador de protoboard

Prototipo independiente para analizar imágenes locales de un protoboard. Detecta el protoboard y componentes con Grounding DINO, calcula cuatro puntos y un centro por componente, y transforma esos puntos a un plano de coordenadas del tablero.

La inferencia ocurre localmente: la primera ejecución descarga el modelo a `models/`; las fotos no se envían a ningún servicio. El detector es de vocabulario abierto y puede confundir o no detectar componentes pequeños. Revisa las imágenes anotadas antes de usar sus coordenadas.

## Preparación

Requiere Python 3.12 o posterior y conexión a internet solo para instalar dependencias y descargar el modelo en la primera ejecución.

Desde la raíz del repositorio:

```sh
npm run setup:protoboard
```

El comando prepara el entorno e instala el modelo antes del primer análisis. Para los pasos de uso independiente, entra a `protoboard_mapper`.

## Uso

1. Copia imágenes JPG, PNG, BMP o WebP a `input\`.
2. Ejecuta:

   ```powershell
   .\.venv\Scripts\python.exe analyze.py
   ```

3. Revisa `output\`: por cada foto se genera un JSON con las detecciones y una imagen anotada.

El plano usa unidades de modelo: X va a lo largo de las columnas, Y a lo ancho del tablero, y el origen `(0, 0)` está en el centro del protoboard. Por defecto mide `400 × 230` unidades; se pueden cambiar con `--board-width` y `--board-height`. Cada punto también conserva su posición en píxeles de la imagen original.

Grounding DINO se consulta con nombres de componentes comunes, pero no es un detector entrenado específicamente para este protoboard. La confianza y la imagen anotada permiten revisar qué cajas sirven; no se debe interpretar una detección como certeza.
