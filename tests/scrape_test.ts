import { assertSnapshot } from "std/testing/snapshot.ts";
import { ChannelId, scrapeProfile } from "../src/scrape.ts";

function getProfileUrl(channelId: ChannelId): URL | string {
  return new URL(
    `data/profile-${channelId.cpName}-${channelId.subId}.json`,
    import.meta.url,
  );
}

Deno.test("scrapeProfile()", async (ctx) => {
  const nonPartner = await scrapeProfile(
    { cpName: "historia9110", subId: "historia91" },
    getProfileUrl,
  );
  await assertSnapshot(ctx, nonPartner);
  const partner = await scrapeProfile(
    { cpName: "astrotales", subId: "knowledge" },
    getProfileUrl,
  );
  await assertSnapshot(ctx, partner);
});
