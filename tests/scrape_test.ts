import { assertSnapshot } from "std/testing/snapshot.ts";
import { assertEquals, assertRejects } from "std/testing/asserts.ts";
import { ChannelError, scrape } from "../src/scrape.ts";
import { getUrl } from "./fixture.ts";

Deno.test("scrape()", async (ctx) => {
  const nonPartner = await scrape(
    { cpName: "historia9110", subId: "historia91", categoryId: null },
    getUrl,
  );
  await assertSnapshot(ctx, nonPartner);
  const partner = await scrape(
    { cpName: "astrotales", subId: "knowledge", categoryId: null },
    getUrl,
  );
  await assertSnapshot(ctx, partner);
  const contentsByCategory = await scrape(
    {
      cpName: "historia9110",
      subId: "historia91",
      categoryId: "17f256afade00085s",
    },
    getUrl,
  );
  await assertSnapshot(ctx, contentsByCategory);
  const e = await assertRejects(
    () =>
      scrape(
        { cpName: "notfound", subId: "notfound404", categoryId: null },
        getUrl,
      ),
    ChannelError,
  );
  assertEquals(e.channelId, {
    cpName: "notfound",
    subId: "notfound404",
    categoryId: null,
  });
  const e2 = await assertRejects(
    () =>
      scrape(
        {
          cpName: "historia9110",
          subId: "historia91",
          categoryId: "notfound404",
        },
        getUrl,
      ),
    ChannelError,
  );
  assertEquals(e2.channelId, {
    cpName: "historia9110",
    subId: "historia91",
    categoryId: "notfound404",
  });
});
