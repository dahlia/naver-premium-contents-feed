export interface ChannelId {
  cpName: string;
  subId: string;
}

export interface Person {
  name: string;
  email: string | null;
}

export interface Channel {
  url: URL;
  name: string;
  description: string;
  partner: boolean;
  provider: Person | null;
  thumbnailUrl: URL;
  coverImageUrl: URL;
  categories: Record<CategoryId, Category>;
  contents: Content[];
  latestUpdated: Date;
}

export type CategoryId = string;

export interface Category {
  id: CategoryId;
  name: string;
  url: URL;
}

export interface Content {
  author: Person;
  title: string;
  readingSeconds: number;
  category: Category;
  thumbnailUrl: URL | null;
  tags: Set<string>;
  published: Date;
  updated: Date;
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
  const provider: Person | null =
    providerName != null && providerName.trim() != ""
      ? {
        name: channelInfo.provider ??
          (channelInfo.representativeName?.trim() || undefined),
        email: cpRegisterInfo?.cpTitle?.trim() === providerName
          ? cpRegisterInfo?.email?.trim() ?? null
          : null,
      }
      : null;
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
  const contentList: {
    author: string;
    title: string;
    readTime: number;
    categoryId: string;
    thumbnail: string;
    tagList: string[];
    publishDatetime: string;
    modifyDatetime: string;
    link: string;
  }[] = data.component.SCS_PREMIUM_CONTENT_LIST.value.data;
  const contents: Content[] = contentList.map((c) => {
    const published = new Date(c.publishDatetime + "+09:00");
    const updated = new Date(c.modifyDatetime + "+09:00");
    return {
      author: c.author === provider?.name
        ? provider
        : { name: c.author, email: null },
      title: c.title,
      readingSeconds: c.readTime,
      category: categories[c.categoryId],
      thumbnailUrl: c.thumbnail == null ? null : new URL(c.thumbnail),
      tags: new Set(c.tagList),
      published,
      updated: updated > published ? updated : published,
      url: new URL(c.link),
    };
  });
  return {
    url: new URL(channelInfo.absoluteHomeUrl),
    name: channelInfo.channelName,
    description: channelInfo.description,
    partner: channelInfo.isPartner,
    provider,
    thumbnailUrl: new URL(channelInfo.thumbnail),
    coverImageUrl: new URL(channelInfo.coverImage),
    categories,
    contents,
    latestUpdated: new Date(
      channelInfo.channelInfo.lastContentPublishDt + "+09:00",
    ),
  };
}
