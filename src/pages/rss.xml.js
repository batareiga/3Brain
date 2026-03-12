import rss from "@astrojs/rss";
import { getAllPosts } from "../lib/content";
import { siteMeta } from "../lib/site";

export function GET() {
  const posts = getAllPosts();

  return rss({
    title: siteMeta.title,
    description: siteMeta.description,
    site: siteMeta.site,
    items: posts.map((post) => ({
      title: post.title,
      description: post.description,
      pubDate: new Date(post.date),
      link: post.url
    }))
  });
}
