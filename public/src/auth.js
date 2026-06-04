let _canEdit = false;
let _token   = "";

export function canEdit()      { return _canEdit; }
export function authHeaders()  { return _token ? { "X-Edit-Token": _token } : {}; }

export async function initAuth() {
  const token = new URLSearchParams(window.location.search).get("edit");
  if (!token) return;
  try {
    const res  = await fetch(`/api/auth?token=${encodeURIComponent(token)}`);
    const data = await res.json();
    if (data.ok === true) { _canEdit = true; _token = token; }
  } catch {
    _canEdit = false;
  }
}
