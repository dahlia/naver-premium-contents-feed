import { assertSnapshot } from "std/testing/snapshot.ts";
import { Feed } from "../src/feed.tsx";
import { scrape } from "../src/scrape.ts";
import { getUrl } from "./fixture.ts";

Deno.test("Feed()", async (ctx) => {
  const selfUrl = new URL("https://exmaple.com/feed.xml");
  const nonPartner = await scrape(
    { cpName: "historia9110", subId: "historia91", categoryId: null },
    getUrl,
  );
  const nonPartnerFeed = Feed({ channel: nonPartner, selfUrl });
  await assertSnapshot(ctx, nonPartnerFeed);
  const partner = await scrape(
    { cpName: "astrotales", subId: "knowledge", categoryId: null },
    getUrl,
  );
  const partnerFeed = Feed({ channel: partner, selfUrl });
  await assertSnapshot(ctx, partnerFeed);
  const contentsByCategory = await scrape(
    {
      cpName: "historia9110",
      subId: "historia91",
      categoryId: "17f256afade00085s",
    },
    getUrl,
  );
  const feedByCategory = Feed({ channel: contentsByCategory, selfUrl });
  await assertSnapshot(ctx, feedByCategory);
});
