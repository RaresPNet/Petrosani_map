// GET /api/images/:id  — reassemble chunks and serve raw image binary
export async function onRequestGet({ params, env }) {
  const { results } = await env.DB.prepare(
    "SELECT mime, data FROM images WHERE id = ? ORDER BY chunk_index"
  ).bind(params.id).all();

  if (!results.length) return new Response("Not found", { status: 404 });

  const base64 = results.map(r => r.data).join("");
  const mime   = results[0].mime;

  const binary = atob(base64);
  const bytes  = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

  return new Response(bytes, {
    headers: {
      "Content-Type":  mime,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}

// DELETE /api/images/:id  — removes all chunks for this image
export async function onRequestDelete({ params, env }) {
  await env.DB.prepare("DELETE FROM images WHERE id = ?").bind(params.id).run();
  return new Response(null, { status: 204 });
}
