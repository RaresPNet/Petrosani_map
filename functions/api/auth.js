export async function onRequestGet({ request, env }) {
  const token = new URL(request.url).searchParams.get("token") || "";
  const ok    = token === (env.EDIT_TOKEN ?? "");
  return Response.json({ ok });
}
