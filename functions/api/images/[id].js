import { requireAuth } from "../../_shared/auth.js";

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

// PATCH /api/images/:id  — update description, author, year
export async function onRequestPatch({ params, request, env }) {
  const unauth = requireAuth(request, env);
  if (unauth) return unauth;
  const body   = await request.json();
  const fields = {};
  if ("description" in body) fields.description = body.description || null;
  if ("author"      in body) fields.author      = body.author      || null;
  if ("year"        in body) fields.year        = body.year ? parseInt(body.year, 10) : null;

  if (!Object.keys(fields).length) {
    return Response.json({ error: "No fields to update" }, { status: 400 });
  }

  const sets   = Object.keys(fields).map(k => `${k} = ?`).join(", ");
  const values = [...Object.values(fields), params.id];
  await env.DB.prepare(`UPDATE images SET ${sets} WHERE id = ?`).bind(...values).run();
  return Response.json({ ok: true });
}

// DELETE /api/images/:id  — removes all chunks for this image
export async function onRequestDelete({ params, request, env }) {
  const unauth = requireAuth(request, env);
  if (unauth) return unauth;
  await env.DB.prepare("DELETE FROM images WHERE id = ?").bind(params.id).run();
  return new Response(null, { status: 204 });
}
