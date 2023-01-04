export interface ChannelId {
  cpName: string;
  subId: string;
  categoryId: CategoryId | null;
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
  selectedCategory: Category | null;
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
  category: Category | null;
  thumbnailUrl: URL | null;
  tags: Set<string>;
  published: Date;
  updated: Date;
  url: URL;
}

const BASE_URL = new URL("https://contents.premium.naver.com/ch/template/");

function getUrl({ cpName, subId, categoryId }: ChannelId): URL | string {
  return new URL(
    categoryId == null
      ? `./SCS_PREMIUM_CONTENT_LIST?cpName=${cpName}&subId=${subId}`
      : "./SCS_PREMIUM_CONTENT_LIST_BY_CATEGORY" +
        `?cpName=${cpName}&subId=${subId}&categoryId=${categoryId}`,
    BASE_URL,
  );
}

export async function scrape(
  channelId: ChannelId,
  urlGetter: (channelId: ChannelId) => URL | string = getUrl,
): Promise<Channel> {
  const url = urlGetter(channelId);
  const response = await fetch(url);
  if (!response.ok) throw new ChannelError(channelId);
  const data = await response.json();
  const errorCode = data.component.SCS_PREMIUM_CHANNEL_INFO_V1.error?.code;
  if (
    errorCode != null && errorCode >= 400 || data.component.ERROR?.code === 404
  ) throw new ChannelError(channelId);
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
  const selectedCategory: Category | null = channelId.categoryId == null
    ? null
    : categories[channelId.categoryId] ?? null;
  if (channelId.categoryId != null && selectedCategory == null) {
    throw new ChannelError(channelId);
  }
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
  }[] = data
    .component[
      channelId.categoryId == null
        ? "SCS_PREMIUM_CONTENT_LIST"
        : "SCS_PREMIUM_CONTENT_LIST_BY_CATEGORY"
    ].value.data;
  const contents: Content[] = contentList.map((c) => {
    const published = new Date(c.publishDatetime + "+09:00");
    const updated = new Date(c.modifyDatetime + "+09:00");
    return {
      author: c.author === provider?.name
        ? provider
        : { name: c.author, email: null },
      title: c.title,
      readingSeconds: c.readTime,
      category: categories[c.categoryId] ?? null,
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
    selectedCategory,
    categories,
    contents,
    latestUpdated: new Date(
      channelInfo.channelInfo.lastContentPublishDt + "+09:00",
    ),
  };
}

export class ChannelError extends Error {
  constructor(readonly channelId: ChannelId) {
    super(
      `Channel not found: ${channelId.cpName}/${channelId.subId}` +
        (channelId.categoryId == null
          ? ""
          : ` (category: ${channelId.categoryId})`),
    );
  }
}
