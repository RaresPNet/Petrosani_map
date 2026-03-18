// GET /api/images/:id  — serve raw image binary
export async function onRequestGet({ params, env }) {
  const row = await env.DB.prepare(
    "SELECT mime, data FROM images WHERE id = ?"
  ).bind(params.id).first();

  if (!row) return new Response("Not found", { status: 404 });

  return new Response(row.data, {
    headers: {
      "Content-Type":  row.mime,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}

// DELETE /api/images/:id
export async function onRequestDelete({ params, env }) {
  await env.DB.prepare("DELETE FROM images WHERE id = ?").bind(params.id).run();
  return new Response(null, { status: 204 });
}
