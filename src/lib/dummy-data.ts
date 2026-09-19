import { Post, ShelfItem, UserProfile } from "@/types";

const figureImage = (seed: string, label: string) =>
  `https://placehold.co/600x800/e5e7eb/374151/png?text=${encodeURIComponent(label)}&font=roboto`;

const avatarImage = (label: string) =>
  `https://placehold.co/80x80/f3f4f6/374151/png?text=${encodeURIComponent(label)}`;

export const dummyPosts: Post[] = [
  {
    id: "1",
    username: "figure_taro",
    userAvatarUrl: avatarImage("太"),
    figureName: "初音ミク Birthday 2023 Ver.",
    makerName: "グッドスマイルカンパニー",
    imageUrl: figureImage("1", "初音ミク"),
    likeCount: 128,
    commentCount: 12,
  },
  {
    id: "2",
    username: "gk_collector",
    userAvatarUrl: avatarImage("G"),
    figureName: "ネフェルピトー",
    makerName: "メガハウス",
    imageUrl: figureImage("2", "ネフェルピトー"),
    likeCount: 342,
    commentCount: 28,
  },
  {
    id: "3",
    username: "hana_figure",
    userAvatarUrl: avatarImage("花"),
    figureName: "リヴァイ・アッカーマン",
    makerName: "アルター",
    imageUrl: figureImage("3", "リヴァイ"),
    likeCount: 89,
    commentCount: 7,
  },
  {
    id: "4",
    username: "otaku_shelf",
    userAvatarUrl: avatarImage("棚"),
    figureName: "エルフのアーニャ",
    makerName: "ホビージャパン",
    imageUrl: figureImage("4", "エルフのアーニャ"),
    likeCount: 210,
    commentCount: 15,
  },
];

export const dummyUserProfile: UserProfile = {
  username: "figure_taro",
  handle: "@figure_taro",
  bio: "フィギュア沼歴8年。主にグッスマ、メガハウス、アルターを収集中。同担歓迎！",
  avatarUrl: null,
  postCount: dummyPosts.length,
  followerCount: 512,
  followingCount: 128,
};

export const dummyFigureCatalog: ShelfItem[] = [
  {
    id: "s1",
    figureName: "初音ミク Birthday 2023 Ver.",
    makerName: "グッドスマイルカンパニー",
    imageUrl: figureImage("s1", "初音ミク"),
    price: 16800,
  },
  {
    id: "s2",
    figureName: "ゾンビ子ちゃん",
    makerName: "コトブキヤ",
    imageUrl: figureImage("s2", "ゾンビ子"),
    price: 14300,
  },
  {
    id: "s3",
    figureName: "レム 白ワンピースVer.",
    makerName: "グッドスマイルカンパニー",
    imageUrl: figureImage("s3", "レム"),
    price: 22000,
  },
  {
    id: "s4",
    figureName: "アスナ",
    makerName: "ワークスタジオ",
    imageUrl: figureImage("s4", "アスナ"),
    price: 28600,
  },
  {
    id: "s5",
    figureName: "ネフェルピトー",
    makerName: "メガハウス",
    imageUrl: figureImage("s5", "ネフェルピトー"),
    price: 45000,
  },
  {
    id: "s6",
    figureName: "リヴァイ・アッカーマン",
    makerName: "アルター",
    imageUrl: figureImage("s6", "リヴァイ"),
    price: 19800,
  },
  {
    id: "s7",
    figureName: "エルフのアーニャ",
    makerName: "ホビージャパン",
    imageUrl: figureImage("s7", "アーニャ"),
    price: 17600,
  },
  {
    id: "s8",
    figureName: "ダークエルフの魔法使い",
    makerName: "フリュー",
    imageUrl: figureImage("s8", "ダークエルフ"),
    price: 12800,
  },
];

export const dummyShelfSlots: (ShelfItem | null)[] = [
  dummyFigureCatalog[0],
  dummyFigureCatalog[1],
  dummyFigureCatalog[2],
  dummyFigureCatalog[3],
  null,
  null,
  null,
  null,
  null,
];

export const dummyMyPosts: Post[] = dummyPosts.slice(0, 2);
