export function requireAuth(request, env) {
  const token = request.headers.get("X-Edit-Token") || "";
  if (token !== (env.EDIT_TOKEN ?? "")) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}
