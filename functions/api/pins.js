// used to fetch pin data
export async function onRequestGet({ env }) {
  try {
    const { results } = await env.DB.prepare(
      "SELECT id, name, description, type, x, y FROM pins"
    ).all();

    return Response.json(results);
  } catch (err) {
    return Response.json(
      { error: "Failed to fetch pins" },
      { status: 500 }
    );
  }
}