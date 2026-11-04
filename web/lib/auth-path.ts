export function safeWorkspacePath(value: unknown): string {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) return "/portal";
  try {
    const target = new URL(value, "https://workspace.invalid");
    if (target.origin !== "https://workspace.invalid" || !(target.pathname === "/portal" || target.pathname.startsWith("/portal/"))) return "/portal";
    return target.pathname + target.search;
  } catch { return "/portal"; }
}
