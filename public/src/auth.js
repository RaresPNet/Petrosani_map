let _canEdit = false;

export function canEdit() { return _canEdit; }

export async function initAuth() {
  const token = new URLSearchParams(window.location.search).get("edit");
  if (!token) return;
  try {
    const res  = await fetch(`/api/auth?token=${encodeURIComponent(token)}`);
    const data = await res.json();
    _canEdit = data.ok === true;
  } catch {
    _canEdit = false;
  }
}
