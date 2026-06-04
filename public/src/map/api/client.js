import { Pin } from "../pins.js";
import { authHeaders } from "../../auth.js";

export async function fetchPins() {
  const res = await fetch("/api/pins");
  if (!res.ok) throw new Error("Failed to fetch pins");
  const data = await res.json();
  return data.map(row => new Pin(row));
}

export async function createPin(pin) {
  const res = await fetch("/api/pins", {
    method:  "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body:    JSON.stringify({
      id: pin.id, name: pin.name, description: pin.description,
      type: pin.type, x: pin.x, y: pin.y,
    }),
  });
  if (!res.ok) throw new Error("Failed to create pin");
  return res.json();
}

export async function updatePin(id, fields) {
  const res = await fetch(`/api/pins/${id}`, {
    method:  "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body:    JSON.stringify(fields),
  });
  if (!res.ok) throw new Error("Failed to update pin");
  return res.json();
}

export async function deletePin(id) {
  const res = await fetch(`/api/pins/${id}`, {
    method: "DELETE", headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to delete pin");
}

// ─── Images ───────────────────────────────────────────────────────────────────

export async function uploadImage(pinId, file) {
  const form = new FormData();
  form.append("pin_id", pinId);
  form.append("file",   file);
  const res = await fetch("/api/images", {
    method: "POST", headers: authHeaders(), body: form,
  });
  if (!res.ok) throw new Error(`Failed to upload image: ${res.status}`);
  return res.json();
}

export async function fetchImageMeta(pinId) {
  const res = await fetch(`/api/images?pin_id=${encodeURIComponent(pinId)}`);
  if (!res.ok) throw new Error(`Failed to fetch image list: ${res.status}`);
  return res.json();
}

export async function updateImageMeta(id, fields) {
  const res = await fetch(`/api/images/${id}`, {
    method:  "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body:    JSON.stringify(fields),
  });
  if (!res.ok) throw new Error(`Failed to update image metadata: ${res.status}`);
  return res.json();
}

export async function deleteImage(id) {
  const res = await fetch(`/api/images/${id}`, {
    method: "DELETE", headers: authHeaders(),
  });
  if (!res.ok) throw new Error(`Failed to delete image: ${res.status}`);
}
