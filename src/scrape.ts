export interface ChannelId {
  cpName: string;
  subId: string;
}

export interface Channel {
  url: URL;
  name: string;
  description: string;
  partner: boolean;
  provider: null | {
    name: string;
    email: string | null;
  };
  thumbnailUrl: URL;
  coverImageUrl: URL;
  categories: Record<CategoryId, Category>;
  latestUpdated: Date;
}

export type CategoryId = string;

export interface Category {
  id: CategoryId;
  name: string;
  url: URL;
}

function getUrl(channelId: ChannelId): URL | string {
  return "https://contents.premium.naver.com/ch/template/SCS_PREMIUM_CONTENT_LIST" +
    `?cpName=${channelId.cpName}&subId=${channelId.subId}`;
}

export async function scrape(
  channelId: ChannelId,
  urlGetter: (channelId: ChannelId) => URL | string = getUrl,
): Promise<Channel> {
  const url = urlGetter(channelId);
  const response = await fetch(url);
  const data = await response.json();
  const channelInfo = data.component.SCS_PREMIUM_CHANNEL_INFO_V1.value;
  const providerName: string | undefined = channelInfo.provider ??
    channelInfo.representativeName?.trim();
  const cpRegisterInfo = channelInfo.cpInfo?.cpRegisterInfo;
  const categoryList: {
    categoryId: string;
    categoryName: string;
    contentListByCategoryIdUrl: string;
  }[] = data.component.SCS_PREMIUM_CATEGORY_LIST_V1.value.data;
  const categories: Record<CategoryId, Category> = Object.fromEntries(
    categoryList
      .filter((c) => c.categoryId !== "")
      .map((c) => [c.categoryId, {
        id: c.categoryId,
        name: c.categoryName,
        url: new URL(
          c.contentListByCategoryIdUrl,
          channelInfo.absoluteHomeUrl,
        ),
      }]),
  );
  return {
    url: new URL(channelInfo.absoluteHomeUrl),
    name: channelInfo.channelName,
    description: channelInfo.description,
    partner: channelInfo.isPartner,
    provider: providerName != null && providerName.trim() != ""
      ? {
        name: channelInfo.provider ??
          (channelInfo.representativeName?.trim() || undefined),
        email: cpRegisterInfo?.cpTitle?.trim() === providerName
          ? cpRegisterInfo?.email?.trim() ?? null
          : null,
      }
      : null,
    thumbnailUrl: new URL(channelInfo.thumbnail),
    coverImageUrl: new URL(channelInfo.coverImage),
    categories,
    latestUpdated: new Date(
      channelInfo.channelInfo.lastContentPublishDt + "+09:00",
    ),
  };
}
