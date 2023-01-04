import { ConnInfo, PathParams, serve } from "sift";
import * as esbuild from "esbuild";
import MarkdownIt from "markdown-it";
import { titlePlugin } from "@mdit-vue/plugin-title";
import { makeFeed } from "./feed.tsx";
import { ChannelError, ChannelId, scrape } from "./scrape.ts";

serve({
  "/:cpName/:subId.xml": serveFeed,
  "/:cpName/:subId/:categoryId.xml": serveFeed,
  "/": home,
});

async function serveFeed(
  req: Request,
  _: ConnInfo,
  params: PathParams,
): Promise<Response> {
  const channelId: ChannelId = {
    cpName: params!.cpName,
    subId: params!.subId,
    categoryId: params?.categoryId ?? null,
  };
  let channel;
  try {
    channel = await scrape(channelId);
  } catch (e) {
    if (e instanceof ChannelError) {
      return new Response("Not Found", {
        status: 404,
        headers: {
          "content-type": "text/plain; charset=utf-8",
        },
      });
    }
    throw e;
  }
  const xml = makeFeed(channel, new URL(req.url));
  return new Response(xml, {
    headers: {
      "content-type": "application/atom+xml; charset=utf-8",
    },
  });
}
const widgetJs = await (async () => {
  await esbuild.initialize({
    worker: true,
    wasmURL: "https://deno.land/x/esbuild@v0.16.13/esbuild.wasm",
  });
  const transformResult = await esbuild.transform(
    await Deno.readFile(new URL("./widget.tsx", import.meta.url)),
    {
      sourcefile: "widget.tsx",
      loader: "tsx",
    },
  );
  return transformResult.code;
})();

async function home(
  _req: Request,
  _: ConnInfo,
  _params: PathParams,
): Promise<Response> {
  const markdown = new TextDecoder().decode(
    await Deno.readFile(
      new URL("../README.md", import.meta.url),
    ),
  );
  const env = { title: "" };
  const readme = new MarkdownIt("default", {
    html: true,
    breaks: false,
    typographer: true,
  }).use(titlePlugin).render(markdown, env);
  return new Response(
    `<!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${env.title}</title>
      <link
        href="https://unpkg.com/@picocss/pico@latest/css/pico.min.css"
        rel="stylesheet">
    </head>
    <body>
      <main class="container">${readme}</main>
      <script type="module">${widgetJs}</script>
    </body>
    </html>`,
    {
      headers: {
        "content-type": "text/html; charset=utf-8",
      },
    },
  );
}
