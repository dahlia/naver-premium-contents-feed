import { assertSnapshot } from "std/testing/snapshot.ts";
import { scrape } from "../src/scrape.ts";
import { getUrl } from "./fixture.ts";

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
