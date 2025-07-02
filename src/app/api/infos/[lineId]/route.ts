import { getMetroLineInfo } from "@/lib/metroinfo";

export async function GET(
    req: Request,
    context: { params: Promise<{ lineId: string }> }
) {
  const params = await context.params;
  const lineId = params.lineId;
  const info = getMetroLineInfo(lineId as string);
  if (!info) {
    return new Response(JSON.stringify({ error: "Line not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }
  return new Response(JSON.stringify(info), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}