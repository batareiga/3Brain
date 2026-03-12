import { siteMeta } from "./site";

export function absoluteUrl(pathname: string): string {
  return new URL(pathname, siteMeta.site).toString();
}
