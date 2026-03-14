// PATCH /api/pins/:id — partial update, only provided fields are written
export async function onRequestPatch({ params, request, env }) {
  try {
    const id     = params.id;
    const fields = await request.json();
 
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
  } catch (err) {
    return Response.json({ error: "Failed to update pin" }, { status: 500 });
  }
}

// DELETE /api/pins/:id
export async function onRequestDelete({ params, env }) {
  try {
    await env.DB.prepare("DELETE FROM pins WHERE id = ?").bind(params.id).run();
    return new Response(null, { status: 204 });
  } catch (err) {
    return Response.json({ error: "Failed to delete pin" }, { status: 500 });
  }
}