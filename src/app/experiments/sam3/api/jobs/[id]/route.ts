export async function GET(
  _: Request,
  context: { params: Promise<{ id: string }> | { id: string } },
) {
  const { id } = await context.params;
  const res = await fetch(`${process.env.DETECTOR_URL}/jobs/${id}`, {
    headers: { "x-api-key": process.env.DETECTOR_KEY! },
  });
  return new Response(res.body, {
    status: res.status,
    headers: { "content-type": "application/json" },
  });
}