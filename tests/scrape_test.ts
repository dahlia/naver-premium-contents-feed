import { assertSnapshot } from "std/testing/snapshot.ts";
import { ChannelId, scrape } from "../src/scrape.ts";

function getUrl(channelId: ChannelId): URL | string {
  return new URL(
    `data/contents-${channelId.cpName}-${channelId.subId}.json`,
    import.meta.url,
  );
}

Deno.test("scrape()", async (ctx) => {
  const nonPartner = await scrape(
    { cpName: "historia9110", subId: "historia91" },
    getUrl,
  );
  await assertSnapshot(ctx, nonPartner);
  const partner = await scrape(
    { cpName: "astrotales", subId: "knowledge" },
    getUrl,
  );
  await assertSnapshot(ctx, partner);
});
