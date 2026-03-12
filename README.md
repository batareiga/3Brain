# Запасной Мозг

Минималистичный Astro-сайт для личного блога и базы знаний. Контент публикуется напрямую из папки `publish/`, в том числе без frontmatter.

## Что уже есть

- Astro-проект со статической сборкой;
- автопоиск markdown-файлов в `publish/`;
- генерация `title`, `description`, `date`, `section`, `slug`, `tags`, если frontmatter отсутствует;
- человекочитаемые URL с транслитерацией кириллицы;
- главная, архив, страница раздела, страница тега, страница материала, 404, RSS, `robots.txt`, sitemap;
- тёмный минималистичный интерфейс с нормальной мобильной сеткой.

## Быстрый старт

```bash
npm install
npm run dev
```

Сборка:

```bash
npm run build
```

## Как публиковать

Достаточно положить markdown-файл в `publish/`.

Примеры:

- `publish/tools/top-ai-cli.md` -> `/tools/top-ai-cli/`
- `publish/money/cashback/stack-without-chaos.md` -> `/money/cashback/stack-without-chaos/`

Если frontmatter нет, сайт сам определяет:

- `title` из `# Заголовка` или имени файла;
- `section` из первой папки;
- `slug` из относительного пути;
- `description` из первых осмысленных строк;
- `date` из даты изменения файла;
- `tags` из хэштегов внутри текста.

## Frontmatter необязателен

Если нужно, можно переопределить поля:

```yaml
---
title: Мой материал
description: Короткое описание
date: 2026-03-12
featured: true
tags:
  - tools
  - obsidian
draft: false
---
```

## Следующий практичный шаг

Логичнее всего дальше добавить локальный поиск без внешнего сервиса и подготовить deploy на GitHub Pages.
