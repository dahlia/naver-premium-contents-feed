import { ChannelId } from "../src/scrape.ts";

export function getUrl(channelId: ChannelId): URL | string {
  return new URL(
    `data/contents-${channelId.cpName}-${channelId.subId}.json`,
    import.meta.url,
  );
}
