/** @jsx h */
import { h, render } from "https://esm.sh/preact@10.11.3";
import { useState } from "https://esm.sh/preact@10.11.3/hooks";

const BASE_URL = "https://contents.premium.naver.com/";

export interface ChannelId {
  cpName: string;
  subId: string;
  categoryId: string | null;
}

const CATEGORY_LIST_PATTERN =
  /^\/([A-Za-z0-9._-]+)\/([A-Za-z0-9._-]+)\/contents$/;
const LIST_PATTERN = /^\/([A-Za-z0-9._-]+)\/([A-Za-z0-9._-]+)(?:\/|$)/;

function parseUrl(url: string): ChannelId | null {
  url = url.trim().replace(/^http:/, "https:");
  if (!url.startsWith(BASE_URL)) return null;
  const parsed = new URL(url);
  let match;
  if (
    null !== (match = CATEGORY_LIST_PATTERN.exec(parsed.pathname)) &&
    (parsed.searchParams.get("categoryId") ?? "").trim() !== ""
  ) {
    return {
      cpName: match[1],
      subId: match[2],
      categoryId: parsed.searchParams.get("categoryId"),
    };
  }
  if (null === (match = LIST_PATTERN.exec(parsed.pathname))) return null;
  return { cpName: match[1], subId: match[2], categoryId: null };
}

function getFeedUrl(channelId: ChannelId): URL {
  return new URL(
    channelId.categoryId == null
      ? `./${channelId.cpName}/${channelId.subId}.xml`
      : `./${channelId.cpName}/${channelId.subId}/${channelId.categoryId}.xml`,
    location.href,
  );
}

export function Widget() {
  const [url, setUrl] = useState("");
  const channelId = parseUrl(url);
  return (
    <form>
      <fieldset>
        <label>
          채널 URL:
          <input
            type="url"
            placeholder={`${BASE_URL}XXX/YYY`}
            aria-invalid={url.trim() == "" || channelId != null ? "" : "true"}
            value={url}
            onInput={(e) => setUrl((e.target as HTMLInputElement).value)}
          />
          <small>
            RSS로 구독하려는 네이버 프리미엄 콘텐츠 채널 링크를 붙여주세요.
            (특정 카테고리만 구독하려면 카테고리 페이지 링크를 붙여주세요.)
          </small>
        </label>
      </fieldset>
      {channelId != null && (
        <fieldset>
          <div class="grid">
            <label>
              채널 핸들:
              <input
                readonly={true}
                value={`${channelId.cpName}/${channelId.subId}`}
              />
            </label>
            <label>
              카테고리 ID:
              <input
                readonly={true}
                value={channelId.categoryId ?? "(전체)"}
                disabled={channelId.categoryId == null}
              />
            </label>
          </div>
          <label>
            RSS 피드 URL:
            <input
              readonly={true}
              value={getFeedUrl(channelId).toString()}
              aria-invalid="false"
            />
            <small>위 링크 URL을 RSS 리더에서 구독하세요.</small>
          </label>
        </fieldset>
      )}
    </form>
  );
}

render(<Widget />, document.getElementById("widget")!);
