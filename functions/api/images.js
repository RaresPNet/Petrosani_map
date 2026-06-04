import { requireAuth } from "../_shared/auth.js";

const CHUNK_SIZE = 60_000; // base64 chars per row — stays well under D1's 100KB limit

// POST /api/images  — upload a single image for a pin
// Body: multipart/form-data  { pin_id: string, file: File }
export async function onRequestPost({ request, env }) {
  const unauth = requireAuth(request, env);
  if (unauth) return unauth;
  const form  = await request.formData();
  const pinId = form.get("pin_id");
  const file  = form.get("file");

  if (!pinId || !file) {
    return Response.json({ error: "pin_id and file are required" }, { status: 400 });
  }

  const id   = crypto.randomUUID().replace(/-/g, "");
  const mime = file.type || "image/jpeg";

  const buffer = await file.arrayBuffer();
  const bytes  = new Uint8Array(buffer);
  let binary   = "";
  for (let i = 0; i < bytes.length; i += 8192) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
  }
  const base64 = btoa(binary);

  const stmt = env.DB.prepare(
    "INSERT INTO images (id, pin_id, mime, chunk_index, data) VALUES (?, ?, ?, ?, ?)"
  );
  const inserts = [];
  for (let i = 0; i * CHUNK_SIZE < base64.length; i++) {
    inserts.push(stmt.bind(id, pinId, mime, i, base64.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE)));
  }
  await env.DB.batch(inserts);

  return Response.json({ id }, { status: 201 });
}

// GET /api/images?pin_id=xxx  — list image metadata for a pin (no binary)
export async function onRequestGet({ request, env }) {
  const pinId = new URL(request.url).searchParams.get("pin_id");

  if (!pinId) {
    return Response.json({ error: "pin_id is required" }, { status: 400 });
  }

  const { results } = await env.DB.prepare(
    "SELECT id, mime, description, author, year FROM images WHERE pin_id = ? AND chunk_index = 0 ORDER BY rowid"
  ).bind(pinId).all();

  return Response.json(results);
}
