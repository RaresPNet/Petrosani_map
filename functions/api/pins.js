// GET /api/pins — fetch all pins
export async function onRequestGet({ env }) {
  try {
    const { results } = await env.DB.prepare(
      "SELECT id, name, description, type, x, y FROM pins"
    ).all();
    return Response.json(results);
  } catch (err) {
    return Response.json({ error: "Failed to fetch pins" }, { status: 500 });
  }
}

// POST /api/pins — insert a new pin
export async function onRequestPost({ request, env }) {
  try {
    const { id, name, description, type, x, y } = await request.json();
    await env.DB.prepare(
      "INSERT INTO pins (id, name, description, type, x, y) VALUES (?, ?, ?, ?, ?, ?)"
    ).bind(id, name, description, type, x, y).run();
    return Response.json({ id, name, description, type, x, y }, { status: 201 });
  } catch (err) {
    return Response.json({ error: "Failed to create pin" }, { status: 500 });
  }
}
