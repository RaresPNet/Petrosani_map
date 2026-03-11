import { Pin } from "../pins.js";

export async function fetchPins() {
  const res = await fetch("/api/pins");
  if (!res.ok) throw new Error("Failed to fetch pins");
  const data = await res.json();
  return data.map(row => new Pin(row));
}