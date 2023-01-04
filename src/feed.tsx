/** @jsx JSXXML */
import { Fragment, JSXNode, JSXXML, render } from "jsx-xml";
import {
  Category as ContentCategory,
  Channel,
  Content,
  Person,
} from "./scrape.ts";

export function makeFeed(channel: Channel, selfUrl: URL): string {
  return render(<Feed channel={channel} selfUrl={selfUrl} />, {
    createOptions: {
      encoding: "utf-8",
    },
    endOptions: { pretty: true },
  });
}

export function Feed(
  { channel, selfUrl }: { channel: Channel; selfUrl: URL },
): JSXNode {
  return (
    <feed xmlns="http://www.w3.org/2005/Atom">
      <id>{selfUrl.href}</id>
      <link rel="self" type="application/atom+xml" href={selfUrl.href} />
      <link rel="alternate" href={channel.url.href} />
      <title>{channel.name}</title>
      <subtitle>{channel.description}</subtitle>
      <Author author={channel.provider} />
      <updated>{channel.latestUpdated.toISOString()}</updated>
      <icon>{channel.thumbnailUrl.href}</icon>
      <logo>{channel.coverImageUrl.href}</logo>
      {channel.selectedCategory && (
        <Category category={channel.selectedCategory} />
      )}
      {channel.contents.map((content) => <Entry content={content} />)}
    </feed>
  );
}

export function Author(
  { author }: { author?: Person | null },
): JSXNode {
  if (author == null) return <Fragment />;
  return (
    <Fragment>
      <author>
        <name>{author.name}</name>
        {author.email && <email>{author.email}</email>}
      </author>
    </Fragment>
  );
}

export function Category({ category }: { category: ContentCategory }): JSXNode {
  return (
    <category
      term={category.id}
      label={category.name}
      scheme={category.url.href}
    />
  );
}

export function Entry({ content }: { content: Content }): JSXNode {
  const summary = render(
    <p>
      <a href={content.url.href}>{content.title}</a>
    </p>,
    { createOptions: { headless: true } },
  );
  return (
    <entry>
      <id>{content.url.href}</id>
      <link rel="alternate" href={content.url.href} />
      <title>{content.title}</title>
      <published>{content.published.toISOString()}</published>
      <updated>{content.updated.toISOString()}</updated>
      <Author author={content.author} />
      {content.category && <Category category={content.category} />}
      <summary type="html">{summary}</summary>
    </entry>
  );
}
