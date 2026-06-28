import { graphGet } from './client';

export type InstagramProfile = {
  id: string;
  user_id?: string;
  username?: string;
  account_type?: string;
  name?: string;
  profile_picture_url?: string;
  followers_count?: number;
  follows_count?: number;
  media_count?: number;
};

const PROFILE_FIELDS = [
  'user_id',
  'username',
  'account_type',
  'name',
  'profile_picture_url',
  'followers_count',
  'follows_count',
  'media_count',
].join(',');

/** Fetch the connected account's own profile via the /me endpoint. */
export async function getProfile(accessToken: string): Promise<InstagramProfile> {
  return graphGet<InstagramProfile>('me', { fields: PROFILE_FIELDS }, accessToken);
}
