const normalizedBasePath = (value: string | undefined): string => {
  if (!value || value === "/") return "";
  return `/${value.replace(/^\/+|\/+$/g, "")}`;
};

/** The single source of truth for URLs emitted into the PWA shell. */
export const appBasePath = normalizedBasePath(process.env.NEXT_PUBLIC_BASE_PATH);

export const withBasePath = (path = "/"): string => {
  const normalizedPath = path === "/" ? "/" : `/${path.replace(/^\/+/, "")}`;
  return `${appBasePath}${normalizedPath}`;
};

