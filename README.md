This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Importar fotos de protoboard

Instala Python 3.12 o posterior. Para preparar la importación de fotos, ejecuta estos comandos desde la raíz del repositorio:

```sh
npm install
npm run setup:protoboard
npm run dev
```

El comando `setup:protoboard` crea o reutiliza `protoboard_mapper/.venv`, instala las dependencias de `protoboard_mapper/requirements.txt` y carga Grounding DINO para descargar sus pesos antes de importar una foto. La primera preparación requiere internet y puede tardar varios minutos. Puedes volver a ejecutar el comando si se interrumpe o si cambian las dependencias. El entorno y los pesos se guardan localmente. Para usar el simulador sin importar fotos, basta con `npm install` y `npm run dev`.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Coordenadas del simulador

En `/componentes/coordenadas` se puede consultar el mapa de cada componente, con sus cuatro esquinas, centro y terminales. Las coordenadas se derivan de `src/components/simulador/layout.ts`, la geometría compartida por las vistas isométrica y 3D. El origen `(0, 0)` está en el centro del protoboard y las medidas son unidades del modelo, no milímetros calibrados.
## Experimentos DINOv2

En Windows, crea un entorno con Python 3.12 e instala las dependencias desde la raíz del proyecto:

```powershell
py -3.12 -m venv .venv
.\.venv\Scripts\python.exe -m pip install --upgrade pip
.\.venv\Scripts\python.exe -m pip install -r src\app\experiments\requirements.txt
```

### Comparar dos imágenes

El script `src\app\experiments\dinov2\compare_pair.py` compara dos imágenes usando DINOv2 ViT-S/14. Imprime la similitud coseno de las representaciones globales y una comparación adicional por parches. Los valores son índices de similitud, no porcentajes ni probabilidades.

```powershell
.\.venv\Scripts\python.exe src\app\experiments\dinov2\compare_pair.py "C:\ruta\a\imagen1.jpg" "C:\ruta\a\imagen2.jpg"
```

La primera ejecución descarga el código y los pesos de DINOv2 mediante `torch.hub`. Para comparar componentes, conviene usar fotos o recortes con encuadre similar: la comparación por parches empareja regiones que ocupan la misma posición y ambas medidas pueden verse afectadas por el fondo, la iluminación y la orientación.

### Primer paso: clases del dataset

La primera versión del clasificador usará dos clases:

```text
src\app\experiments\dinov2\dataset\
├── train\
│   ├── led\
│   └── no_led\
├── validation\
│   ├── led\
│   └── no_led\
└── test\
    ├── led\
    └── no_led\
```

Coloca en `led` fotografías de LEDs y en `no_led` fotografías de componentes u objetos que no sean LEDs. Mantén separadas las imágenes de entrenamiento, validación y prueba; no copies la misma imagen a más de una partición. Conviene comenzar con imágenes recortadas donde aparezca principalmente un solo componente.

### Entrenar y usar el clasificador

El clasificador usa embeddings congelados de DINOv2 y una regresión logística. Selecciona la regularización con `validation`, vuelve a ajustar con `train` y `validation`, y reporta el resultado final usando `test`.

```powershell
.\.venv\Scripts\python.exe src\app\experiments\dinov2\train_classifier.py
```

El modelo queda en `src\app\experiments\dinov2\models\led_classifier.joblib`. Los embeddings de train, validation y test, junto con sus etiquetas, particiones y rutas, quedan en `src\app\experiments\dinov2\models\led_embeddings.npz`. El entrenamiento excluye de validation/test imágenes cuyo contenido sea idéntico al de una partición anterior y muestra cuáles excluyó.

Para clasificar una imagen:

```powershell
.\.venv\Scripts\python.exe src\app\experiments\dinov2\predict_image.py "C:\ruta\a\componente.jpg"
```

Usa imágenes diferentes para `train`, `validation` y `test`; no ajustes el modelo basándote en el resultado de `test`.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
