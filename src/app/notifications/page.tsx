import { Heart, MessageCircle, UserPlus } from "lucide-react";

const DUMMY_NOTIFICATIONS = [
  {
    id: "1",
    type: "like" as const,
    username: "figure_lover99",
    message: "があなたの投稿にいいねしました",
    timeAgo: "3分前",
  },
  {
    id: "2",
    type: "comment" as const,
    username: "nendo_collector",
    message: "があなたの投稿にコメントしました：「これめちゃくちゃ良いですね！」",
    timeAgo: "22分前",
  },
  {
    id: "3",
    type: "follow" as const,
    username: "scale_master",
    message: "があなたをフォローしました",
    timeAgo: "1時間前",
  },
  {
    id: "4",
    type: "like" as const,
    username: "prize_hunter",
    message: "があなたの投稿にいいねしました",
    timeAgo: "5時間前",
  },
];

const ICONS = {
  like: { Icon: Heart, className: "text-pink-500", filled: true },
  comment: { Icon: MessageCircle, className: "text-blue-500", filled: false },
  follow: { Icon: UserPlus, className: "text-green-500", filled: false },
};

export default function NotificationsPage() {
  return (
    <div className="mx-auto w-full px-4 py-6">
      <h1 className="mb-1 text-xl font-bold text-gray-900 dark:text-gray-100">通知</h1>
      <p className="mb-4 text-xs text-gray-400 dark:text-gray-500">
        ここに表示される通知はサンプルです（準備中の機能です）
      </p>

      <div className="flex flex-col divide-y divide-gray-100 dark:divide-gray-800">
        {DUMMY_NOTIFICATIONS.map((n) => {
          const { Icon, className, filled } = ICONS[n.type];
          return (
            <div key={n.id} className="flex items-start gap-3 py-4">
              <Icon
                size={20}
                className={`mt-0.5 shrink-0 ${className}`}
                fill={filled ? "currentColor" : "none"}
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm text-gray-800 dark:text-gray-200">
                  <span className="font-semibold">{n.username}</span>
                  {n.message}
                </p>
                <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">{n.timeAgo}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
