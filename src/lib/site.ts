export const siteMeta = {
  title: "Запасной Мозг",
  description:
    "Личный блог и база знаний о практичных инструментах, идеях, цифровых системах и полевых наблюдениях.",
  site: "https://batareiga.github.io",
  basePath: "/3Brain",
  author: "Запасной Мозг"
};

export function withBase(pathname: string): string {
  const cleanPath = pathname.startsWith("/") ? pathname : `/${pathname}`;
  const normalizedBase = siteMeta.basePath === "/" ? "" : siteMeta.basePath.replace(/\/$/, "");
  return `${normalizedBase}${cleanPath}`;
}
