import { Pin } from "../pins.js";

export async function fetchPins() {
  const res = await fetch("/api/pins");
  if (!res.ok) throw new Error("Failed to fetch pins");
  const data = await res.json();
  return data.map(row => new Pin(row));
}

export async function createPin(pin) {
  const res = await fetch("/api/pins", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id:          pin.id,
      name:        pin.name,
      description: pin.description,
      type:        pin.type,
      x:           pin.x,
      y:           pin.y,
    }),
  });
  if (!res.ok) throw new Error("Failed to create pin");
  return res.json();
}

export async function updatePin(id, fields) {
  const res = await fetch(`/api/pins/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(fields),
  });
  if (!res.ok) throw new Error("Failed to update pin");
  return res.json();
}

export async function deletePin(id) {
  const res = await fetch(`/api/pins/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete pin");
}