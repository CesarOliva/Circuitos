export async function POST(req: Request) {
  const url = process.env.DETECTOR_URL;
  const key = process.env.DETECTOR_KEY;
  if (!url || !key) {
    return Response.json(
      { error: "Faltan DETECTOR_URL o DETECTOR_KEY en .env.local (reinicia npm run dev)" },
      { status: 500 },
    );
  }
  try {
    const form = await req.formData();
    const res = await fetch(`${url}/analyze`, {
      method: "POST",
      headers: { "x-api-key": key },
      body: form,
    });
    const text = await res.text();
    console.log("[analyze]", res.status, text.slice(0, 200));
    return new Response(text, {
      status: res.status,
      headers: { "content-type": res.headers.get("content-type") ?? "application/json" },
    });
  } catch (e) {
    console.error("[analyze] fallo", e);
    return Response.json(
      { error: `No se pudo contactar al servidor: ${e instanceof Error ? e.message : String(e)}` },
      { status: 502 },
    );
  }
}