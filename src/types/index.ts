export type Post = {
  id: string;
  userId: string | null;
  username: string;
  userAvatarUrl: string;
  figureName: string | null;
  makerName: string | null;
  imageUrls: string[];
  caption?: string | null;
  likeCount: number;
  commentCount: number;
  isPinned?: boolean;
};

export type PostComment = {
  id: string;
  postId: string;
  parentId: string | null;
  userId: string | null;
  username: string;
  userAvatarUrl: string | null;
  body: string;
  createdAt: string;
};

export type AppNotification = {
  id: string;
  type: "like" | "comment";
  actorUsername: string;
  postId: string | null;
  commentBody: string | null;
  isRead: boolean;
  createdAt: string;
};

export type ChatMessage = {
  id: string;
  senderId: string;
  senderUsername: string;
  recipientId: string;
  recipientUsername: string;
  body: string;
  imageUrls: string[];
  isRead: boolean;
  createdAt: string;
};

export type ChatThreadSummary = {
  otherUserId: string;
  otherUsername: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
};

export type ShelfItem = {
  id: string;
  slotIndex: number;
  figureName: string | null;
  makerName: string | null;
  description: string | null;
  price: number | null;
  imageUrl: string; // background-removed (transparent) version
  originalImageUrl: string | null; // pre-processing original; null for figures saved before this existed
  backgroundRemoved: boolean; // which of the above the user wants displayed
  displayScale: number; // zoom applied within the shelf cell only; the stored image itself is untouched
  // Pan applied within the shelf cell only, alongside displayScale -- each is
  // a fraction of the cell's own width/height (not pixels), so it stays
  // correct across the different cell sizes the same figure renders at
  // (edit-preview box vs. the actual shelf grid).
  offsetX: number;
  offsetY: number;
};

export type UserProfile = {
  username: string;
  displayName: string;
  bio: string;
  avatarUrl: string | null;
  postCount: number;
  followerCount: number;
  followingCount: number;
};
