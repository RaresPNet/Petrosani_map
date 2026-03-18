// POST /api/images  — upload a single image for a pin
// Body: multipart/form-data  { pin_id: string, file: File }
export async function onRequestPost({ request, env }) {
  const form  = await request.formData();
  const pinId = form.get("pin_id");
  const file  = form.get("file");

  if (!pinId || !file) {
    return Response.json({ error: "pin_id and file are required" }, { status: 400 });
  }

  const id     = crypto.randomUUID().replace(/-/g, "");
  const mime   = file.type || "image/jpeg";

  // Store as base64 TEXT — avoids BLOB binary encoding ambiguity across
  // local wrangler dev and remote D1.
  const buffer  = await file.arrayBuffer();
  const bytes   = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i += 8192) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
  }
  const base64 = btoa(binary);

  await env.DB.prepare(
    "INSERT INTO images (id, pin_id, mime, data) VALUES (?, ?, ?, ?)"
  ).bind(id, pinId, mime, base64).run();

  return Response.json({ id }, { status: 201 });
}

// GET /api/images?pin_id=xxx  — list image IDs for a pin (no binary data)
export async function onRequestGet({ request, env }) {
  const pinId = new URL(request.url).searchParams.get("pin_id");

  if (!pinId) {
    return Response.json({ error: "pin_id is required" }, { status: 400 });
  }

  const { results } = await env.DB.prepare(
    "SELECT id, mime FROM images WHERE pin_id = ? ORDER BY rowid"
  ).bind(pinId).all();

  return Response.json(results);
}
