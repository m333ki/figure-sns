import { Post, UserProfile } from "@/types";

const figureImage = (seed: string, label: string) =>
  `https://placehold.co/600x800/e5e7eb/374151/png?text=${encodeURIComponent(label)}&font=roboto`;

const avatarImage = (label: string) =>
  `https://placehold.co/80x80/f3f4f6/374151/png?text=${encodeURIComponent(label)}`;

export const dummyPosts: Post[] = [
  {
    id: "1",
    userId: null,
    username: "figure_taro",
    userAvatarUrl: avatarImage("太"),
    figureName: "初音ミク Birthday 2023 Ver.",
    makerName: "グッドスマイルカンパニー",
    imageUrls: [figureImage("1", "初音ミク")],
    likeCount: 128,
    commentCount: 12,
  },
  {
    id: "2",
    userId: null,
    username: "gk_collector",
    userAvatarUrl: avatarImage("G"),
    figureName: "ネフェルピトー",
    makerName: "メガハウス",
    imageUrls: [figureImage("2", "ネフェルピトー")],
    likeCount: 342,
    commentCount: 28,
  },
  {
    id: "3",
    userId: null,
    username: "hana_figure",
    userAvatarUrl: avatarImage("花"),
    figureName: "リヴァイ・アッカーマン",
    makerName: "アルター",
    imageUrls: [figureImage("3", "リヴァイ")],
    likeCount: 89,
    commentCount: 7,
  },
  {
    id: "4",
    userId: null,
    username: "otaku_shelf",
    userAvatarUrl: avatarImage("棚"),
    figureName: "エルフのアーニャ",
    makerName: "ホビージャパン",
    imageUrls: [figureImage("4", "エルフのアーニャ")],
    likeCount: 210,
    commentCount: 15,
  },
];

export const dummyUserProfile: UserProfile = {
  username: "figure_taro",
  displayName: "figure_taro",
  bio: "フィギュア沼歴8年。主にグッスマ、メガハウス、アルターを収集中。同担歓迎！",
  avatarUrl: null,
  postCount: dummyPosts.length,
  followerCount: 512,
  followingCount: 128,
};

