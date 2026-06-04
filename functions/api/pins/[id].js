import { requireAuth } from "../../_shared/auth.js";

// PATCH /api/pins/:id — partial update, only provided fields are written
export async function onRequestPatch({ params, request, env }) {
  const unauth = requireAuth(request, env);
  if (unauth) return unauth;
  try {
    const id      = params.id;
    const fields  = await request.json();
    const allowed = ["name", "description", "type", "x", "y"];
    const updates = Object.entries(fields).filter(([k]) => allowed.includes(k));

    if (updates.length === 0) {
      return Response.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const setClauses = updates.map(([k]) => `${k} = ?`).join(", ");
    const values     = updates.map(([, v]) => v);

    await env.DB.prepare(
      `UPDATE pins SET ${setClauses} WHERE id = ?`
    ).bind(...values, id).run();

    return Response.json({ id, ...Object.fromEntries(updates) });
  } catch {
    return Response.json({ error: "Failed to update pin" }, { status: 500 });
  }
}

// DELETE /api/pins/:id — also removes all images for the pin
export async function onRequestDelete({ params, request, env }) {
  const unauth = requireAuth(request, env);
  if (unauth) return unauth;
  try {
    await env.DB.batch([
      env.DB.prepare("DELETE FROM images WHERE pin_id = ?").bind(params.id),
      env.DB.prepare("DELETE FROM pins WHERE id = ?").bind(params.id),
    ]);
    return new Response(null, { status: 204 });
  } catch {
    return Response.json({ error: "Failed to delete pin" }, { status: 500 });
  }
}
