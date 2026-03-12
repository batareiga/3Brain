import fs from "node:fs";
import path from "node:path";
import MarkdownIt from "markdown-it";
import { withBase } from "./site";

const ROOT_DIR = process.cwd();
const PUBLISH_DIR = path.join(ROOT_DIR, "3апасной Мозг. Публикации в интернетах");
const IGNORED_DIRECTORIES = new Set([".obsidian", "Шаблоны"]);

const md = new MarkdownIt({
  html: false,
  linkify: true,
  typographer: true
});

type Frontmatter = {
  title?: string;
  description?: string;
  slug?: string;
  date?: string;
  tags?: string[] | string;
  draft?: boolean | string;
  featured?: boolean | string;
};

export type Post = {
  id: string;
  title: string;
  description: string;
  section: string;
  slug: string;
  url: string;
  rawContent: string;
  html: string;
  tags: string[];
  date: string;
  updatedAt: string;
  draft: boolean;
  featured: boolean;
  readingTime: number;
  relativePath: string;
};

function walk(dir: string): string[] {
  if (!fs.existsSync(dir)) {
    return [];
  }

  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (IGNORED_DIRECTORIES.has(entry.name)) {
        return [];
      }
      return walk(fullPath);
    }

    return entry.isFile() && entry.name.endsWith(".md") ? [fullPath] : [];
  });
}

function getTopLevelSections(): string[] {
  if (!fs.existsSync(PUBLISH_DIR)) {
    return [];
  }

  return fs.readdirSync(PUBLISH_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !IGNORED_DIRECTORIES.has(entry.name) && !entry.name.startsWith("."))
    .map((entry) => slugifySegment(entry.name))
    .filter(Boolean);
}

function resolveDirectoryBySlug(parentDir: string, slug: string): string | null {
  if (!fs.existsSync(parentDir)) {
    return null;
  }

  const match = fs.readdirSync(parentDir, { withFileTypes: true })
    .find((entry) =>
      entry.isDirectory() &&
      !IGNORED_DIRECTORIES.has(entry.name) &&
      !entry.name.startsWith(".") &&
      slugifySegment(entry.name) === slug
    );

  return match ? path.join(parentDir, match.name) : null;
}

function getSectionDirectory(section: string): string {
  return resolveDirectoryBySlug(PUBLISH_DIR, section) ?? path.join(PUBLISH_DIR, section);
}

function getDisplayNameBySlug(parentDir: string, slug: string): string | null {
  const directory = resolveDirectoryBySlug(parentDir, slug);
  return directory ? path.basename(directory) : null;
}

function transliterate(value: string): string {
  const map: Record<string, string> = {
    а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z",
    и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r",
    с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "cz", ч: "ch", ш: "sh", щ: "sch",
    ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya"
  };

  return value
    .toLowerCase()
    .split("")
    .map((char) => map[char] ?? char)
    .join("");
}

function slugifySegment(value: string): string {
  const normalizedValue = value.replace(/\.md$/i, "").trim().toLowerCase();
  const overrides: Record<string, string> = {
    "идеи": "ideas",
    "деньги": "money",
    "кэшбэк": "cashback",
    "проекты": "projects",
    "инструменты": "tools",
    "топы": "tops",
    "сервисы": "services",
    "инструментарий": "tooling"
  };

  if (overrides[normalizedValue]) {
    return overrides[normalizedValue];
  }

  return transliterate(value)
    .replace(/\.md$/i, "")
    .replace(/['"`]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function humanizeFilename(filename: string): string {
  return filename
    .replace(/\.md$/i, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim()
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

function parseScalar(value: string): string | boolean {
  const normalized = value.trim().replace(/^['"]|['"]$/g, "");
  if (normalized === "true") return true;
  if (normalized === "false") return false;
  return normalized;
}

function parseFrontmatter(raw: string): { data: Frontmatter; content: string } {
  if (!raw.startsWith("---\n")) {
    return { data: {}, content: raw };
  }

  const match = raw.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!match) {
    return { data: {}, content: raw };
  }

  const body = match[1];
  const lines = body.split("\n");
  const data: Frontmatter = {};
  let currentArrayKey: "tags" | null = null;

  for (const line of lines) {
    if (/^\s*-\s+/.test(line) && currentArrayKey) {
      const current = Array.isArray(data[currentArrayKey]) ? data[currentArrayKey] : [];
      current.push(String(parseScalar(line.replace(/^\s*-\s+/, ""))));
      data[currentArrayKey] = current;
      continue;
    }

    currentArrayKey = null;
    const separatorIndex = line.indexOf(":");
    if (separatorIndex === -1) continue;

    const key = line.slice(0, separatorIndex).trim() as keyof Frontmatter;
    const value = line.slice(separatorIndex + 1).trim();

    if (value === "" && key === "tags") {
      data.tags = [];
      currentArrayKey = "tags";
      continue;
    }

    if (key === "tags") {
      if (value.startsWith("[") && value.endsWith("]")) {
        data.tags = value
          .slice(1, -1)
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean)
          .map((item) => String(parseScalar(item)));
      } else {
        data.tags = value.split(",").map((item) => item.trim()).filter(Boolean);
      }
      continue;
    }

    data[key] = parseScalar(value) as never;
  }

  return {
    data,
    content: raw.slice(match[0].length)
  };
}

function extractTitle(content: string, fallback: string): string {
  const headingMatch = content.match(/^#\s+(.+)$/m);
  if (headingMatch) {
    return headingMatch[1].trim();
  }

  return fallback;
}

function extractDescription(content: string): string {
  const lines = content
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#") && !line.startsWith("![](") && !line.startsWith("```"));

  return lines.slice(0, 3).join(" ").slice(0, 220).trim();
}

function extractTags(content: string): string[] {
  const matches = content.match(/(^|\s)#([\p{L}\p{N}_/-]+)/gu) ?? [];
  return [...new Set(matches.map((item) => item.replace(/(^|\s)#/u, "").trim().toLowerCase()))];
}

function readingTime(content: string): number {
  const words = content.replace(/[#>*_`-]/g, " ").trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 180));
}

function normalizeDate(input: string | undefined, fallback: Date): string {
  if (!input) {
    return fallback.toISOString();
  }

  const parsed = new Date(input);
  return Number.isNaN(parsed.getTime()) ? fallback.toISOString() : parsed.toISOString();
}

function normalizeTags(frontmatterTags: Frontmatter["tags"], content: string): string[] {
  const fromFrontmatter = Array.isArray(frontmatterTags)
    ? frontmatterTags
    : typeof frontmatterTags === "string"
      ? frontmatterTags.split(",")
      : [];

  const values = fromFrontmatter.length > 0 ? fromFrontmatter : extractTags(content);
  return [...new Set(values.map((item) => item.trim().toLowerCase()).filter(Boolean))];
}

export function getAllPosts(): Post[] {
  return walk(PUBLISH_DIR)
    .map((filePath) => {
      const raw = fs.readFileSync(filePath, "utf8");
      const stats = fs.statSync(filePath);
      const { data, content } = parseFrontmatter(raw);
      const relativePath = path.relative(PUBLISH_DIR, filePath).replace(/\\/g, "/");
      const segments = relativePath.split("/");
      const filename = segments.at(-1) ?? "post.md";
      const section = slugifySegment(segments[0] ?? "notes") || "notes";
      const nestedDirectories = segments.slice(1, -1).map(slugifySegment).filter(Boolean);
      const leafSlug = slugifySegment(data.slug?.trim() || filename) || "post";
      const slug = [section, ...nestedDirectories, leafSlug].join("/");
      const titleFallback = humanizeFilename(filename);
      const title = data.title?.trim() || extractTitle(content, titleFallback);
      const description = data.description?.trim() || extractDescription(content) || "Материал без описания.";
      const updatedAt = stats.mtime.toISOString();
      const date = normalizeDate(data.date, stats.mtime);
      const draft = data.draft === true || data.draft === "true";
      const featured = data.featured === true || data.featured === "true";
      const tags = normalizeTags(data.tags, content);

      return {
        id: relativePath,
        title,
        description,
        section,
        slug,
        url: withBase(`/${slug}/`),
        rawContent: content,
        html: md.render(content),
        tags,
        date,
        updatedAt,
        draft,
        featured,
        readingTime: readingTime(content),
        relativePath
      };
    })
    .filter((post) => !post.draft)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getSections(posts = getAllPosts()): string[] {
  return [...new Set([...getTopLevelSections(), ...posts.map((post) => post.section)])];
}

export function getPostsBySection(section: string, posts = getAllPosts()): Post[] {
  return posts.filter((post) => post.section === section);
}

export function getPostsByPrefix(prefix: string, posts = getAllPosts()): Post[] {
  const normalizedPrefix = prefix.replace(/^\/+|\/+$/g, "");
  return posts.filter((post) => post.slug.startsWith(`${normalizedPrefix}/`));
}

export function getSectionSubsections(section: string): string[] {
  const directory = getSectionDirectory(section);
  if (!fs.existsSync(directory)) {
    return [];
  }

  return fs.readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !IGNORED_DIRECTORIES.has(entry.name) && !entry.name.startsWith("."))
    .map((entry) => slugifySegment(entry.name))
    .filter(Boolean);
}

export function getAllTags(posts = getAllPosts()): string[] {
  return [...new Set(posts.flatMap((post) => post.tags))].sort((a, b) => a.localeCompare(b, "ru"));
}

export function getPostsByTag(tag: string, posts = getAllPosts()): Post[] {
  return posts.filter((post) => post.tags.includes(tag));
}

export function getFeaturedPosts(posts = getAllPosts(), count = 3): Post[] {
  const featured = posts.filter((post) => post.featured);
  return (featured.length > 0 ? featured : posts).slice(0, count);
}

export function getRecentPosts(posts = getAllPosts(), count = 6): Post[] {
  return posts.slice(0, count);
}

export function getRelatedPosts(post: Post, posts = getAllPosts(), count = 3): Post[] {
  return posts
    .filter((candidate) => candidate.id !== post.id)
    .map((candidate) => {
      let score = 0;
      if (candidate.section === post.section) score += 3;
      score += candidate.tags.filter((tag) => post.tags.includes(tag)).length * 2;
      return { candidate, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, count)
    .map((item) => item.candidate);
}

export function formatDate(date: string): string {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(new Date(date));
}

export function sectionLabel(section: string): string {
  const map: Record<string, string> = {
    idea: "Идеи",
    idei: "Идеи",
    tools: "Инструменты",
    instrumenty: "Инструменты",
    money: "Деньги",
    dengi: "Деньги",
    ideas: "Идеи",
    life: "Жизнь",
    notes: "Заметки",
    project: "Проекты",
    projects: "Проекты",
    proekty: "Проекты",
    partners: "Партнерства",
    topy: "Топы",
    tops: "Топы",
    keshbek: "Кэшбэк",
    servisy: "Сервисы",
    instrumentariy: "Инструментарий"
  };

  return map[section] ?? getDisplayNameBySlug(PUBLISH_DIR, section) ?? humanizeFilename(section);
}

export function subsectionLabel(section: string, subsection: string): string {
  const map: Record<string, Record<string, string>> = {
    tops: {
      servisy: "Сервисы",
      instrumentariy: "Инструментарий"
    },
    topy: {
      servisy: "Сервисы",
      instrumentariy: "Инструментарий"
    }
  };

  return map[section]?.[subsection]
    ?? getDisplayNameBySlug(getSectionDirectory(section), subsection)
    ?? sectionLabel(subsection);
}

export function subsectionDescription(section: string, subsection: string): string {
  const map: Record<string, Record<string, string>> = {
    tops: {
      servisy: "Подборки сервисов, платформ и утилит с практическим применением.",
      instrumentariy: "Инструменты, наборы и рабочий стек для конкретных задач."
    },
    topy: {
      servisy: "Подборки сервисов, платформ и утилит с практическим применением.",
      instrumentariy: "Инструменты, наборы и рабочий стек для конкретных задач."
    }
  };

  return map[section]?.[subsection] ?? "Материалы и подборки внутри подкатегории.";
}
