import fs from "node:fs";
import path from "node:path";

const ROOT_DIR = process.cwd();
const PUBLISH_DIR = path.join(ROOT_DIR, "3апасной Мозг. Публикации в интернетах");
const PUBLIC_ASSET_DIR = path.join(ROOT_DIR, "public", "_vault");
const IGNORED_DIRECTORIES = new Set([".obsidian", "Шаблоны"]);

function walk(dir) {
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

    if (!entry.isFile() || entry.name.endsWith(".md")) {
      return [];
    }

    return [fullPath];
  });
}

function syncFile(filePath) {
  const relativePath = path.relative(PUBLISH_DIR, filePath);
  const outputPath = path.join(PUBLIC_ASSET_DIR, relativePath);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });

  if (!fs.existsSync(outputPath)) {
    fs.copyFileSync(filePath, outputPath);
    return;
  }

  const sourceStat = fs.statSync(filePath);
  const targetStat = fs.statSync(outputPath);
  if (sourceStat.mtimeMs > targetStat.mtimeMs || sourceStat.size !== targetStat.size) {
    fs.copyFileSync(filePath, outputPath);
  }
}

for (const filePath of walk(PUBLISH_DIR)) {
  syncFile(filePath);
}
