export const siteMeta = {
  title: "3Brain",
  description:
    "3Brain — личный блог и база знаний о практичных инструментах, идеях, цифровых системах и полевых наблюдениях.",
  site: "https://batareiga.github.io",
  basePath: "/3Brain",
  author: "3Brain"
};

export function withBase(pathname: string): string {
  const cleanPath = pathname.startsWith("/") ? pathname : `/${pathname}`;
  const normalizedBase = siteMeta.basePath === "/" ? "" : siteMeta.basePath.replace(/\/$/, "");
  return `${normalizedBase}${cleanPath}`;
}
