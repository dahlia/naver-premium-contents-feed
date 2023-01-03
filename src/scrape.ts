export interface ChannelId {
  cpName: string;
  subId: string;
}

export interface ChannelProfile {
  name: string;
  description: string;
  partner: boolean;
  provider: null | {
    name: string;
    email: string | null;
  };
  thumbnailUrl: URL;
  coverImageUrl: URL;
  latestUpdated: Date;
}

function getProfileUrl(channelId: ChannelId): URL | string {
  return `https://contents.premium.naver.com/ch/template/SCS_PREMIUM_COMMON,SCS_PREMIUM_CHANNEL_HOME_CHANNEL_PROFILE?cpName=${channelId.cpName}&subId=${channelId.subId}`;
}

export async function scrapeProfile(
  channelId: ChannelId,
  profileUrlGetter: (channelId: ChannelId) => URL | string = getProfileUrl,
): Promise<ChannelProfile> {
  const url = profileUrlGetter(channelId);
  const response = await fetch(url);
  const data = await response.json();
  const info = data.component.SCS_PREMIUM_CHANNEL_INFO_V1.value;
  const providerName: string | undefined = info.provider ??
    info.representativeName?.trim();
  const cpRegisterInfo = info.cpInfo?.cpRegisterInfo;
  return {
    name: info.channelName,
    description: info.description,
    partner: info.isPartner,
    provider: providerName != null && providerName.trim() != ""
      ? {
        name: info.provider ?? (info.representativeName?.trim() || undefined),
        email: cpRegisterInfo?.cpTitle?.trim() === providerName
          ? cpRegisterInfo?.email?.trim() ?? null
          : null,
      }
      : null,
    thumbnailUrl: new URL(info.thumbnail),
    coverImageUrl: new URL(info.coverImage),
    latestUpdated: new Date(info.channelInfo.lastContentPublishDt + "+09:00"),
  };
}
