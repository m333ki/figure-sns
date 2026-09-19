export type Post = {
  id: string;
  username: string;
  userAvatarUrl: string;
  figureName: string | null;
  makerName: string | null;
  imageUrl: string;
  caption?: string | null;
  likeCount: number;
  commentCount: number;
  isPinned?: boolean;
};

export type PostComment = {
  id: string;
  postId: string;
  parentId: string | null;
  username: string;
  userAvatarUrl: string | null;
  body: string;
  createdAt: string;
};

export type ShelfItem = {
  id: string;
  figureName: string;
  makerName: string;
  imageUrl: string;
  price: number;
};

export type UserProfile = {
  username: string;
  handle: string;
  bio: string;
  avatarUrl: string | null;
  postCount: number;
  followerCount: number;
  followingCount: number;
};
