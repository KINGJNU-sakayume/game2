/** Resolve public assets for both root development and a GitHub Pages project base path. */
export function resolveAssetUrl(src: string, basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? ""): string {
  if (/^(?:https?:)?\/\//.test(src) || src.startsWith("data:") || src.startsWith("blob:")) return src;
  const normalizedBase = basePath && basePath !== "/" ? `/${basePath.replace(/^\/+|\/+$/g, "")}` : "";
  return `${normalizedBase}/${src.replace(/^\/+/, "")}`;
}
