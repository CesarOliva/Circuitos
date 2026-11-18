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

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Comparar dos imágenes con DINOv2

El experimento en `src/app/experiments/dinov2/compare_pair.py` compara dos imágenes usando DINOv2 ViT-S/14. Imprime la similitud coseno de las representaciones globales y una comparación adicional por parches. Los valores son índices de similitud, no porcentajes ni probabilidades.

En este equipo ya está disponible Python 3.14. Ejecuta estos comandos en PowerShell desde la raíz del proyecto:

```powershell
py -3.14 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r src\app\experiments\requirements.txt
python src\app\experiments\dinov2\compare_pair.py "C:\ruta\a\imagen1.jpg" "C:\ruta\a\imagen2.jpg"
```

La primera ejecución descarga el código y los pesos de DINOv2 mediante `torch.hub`. Para comparar componentes, conviene usar fotos o recortes con encuadre similar: la comparación por parches empareja regiones que ocupan la misma posición y ambas medidas pueden verse afectadas por el fondo, la iluminación y la orientación. Puedes guardar las imágenes en `src\app\experiments\dinov2\images` o en cualquier otra carpeta e indicar sus rutas al ejecutar el script.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
