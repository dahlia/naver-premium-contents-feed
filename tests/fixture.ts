import { ChannelId } from "../src/scrape.ts";

export function getUrl(channelId: ChannelId): URL | string {
  return new URL(
    channelId.categoryId == null
      ? `data/contents-${channelId.cpName}-${channelId.subId}.json`
      : `data/contentsbycategory-${channelId.cpName}-${channelId.subId}` +
        `-${channelId.categoryId}.json`,
    import.meta.url,
  );
}
