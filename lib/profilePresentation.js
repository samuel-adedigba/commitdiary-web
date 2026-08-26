export const DEFAULT_AVATAR_URL = "/images/avatar/avatar-1.jpg";

export function getProfileAvatarUrl(user) {
  return user?.user_metadata?.avatar_url || DEFAULT_AVATAR_URL;
}

export function getProfileCoverUrl(user) {
  return user?.user_metadata?.cover_url || "";
}
