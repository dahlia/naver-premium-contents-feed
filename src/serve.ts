import { ConnInfo, PathParams, serve } from "sift";
import { makeFeed } from "./feed.tsx";
import { ChannelError, ChannelId, scrape } from "./scrape.ts";

serve({
  "/:cpName/:subId.xml": serveFeed,
  "/:cpName/:subId/:categoryId.xml": serveFeed,
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
