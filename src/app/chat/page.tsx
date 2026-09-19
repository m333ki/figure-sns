import { MessageCircle } from "lucide-react";

export default function ChatPage() {
  return (
    <div className="mx-auto flex w-full flex-col items-center px-4 py-24 text-center">
      <MessageCircle size={40} className="mb-4 text-gray-300 dark:text-gray-700" />
      <h1 className="mb-1 text-lg font-bold text-gray-900 dark:text-gray-100">チャット</h1>
      <p className="text-sm text-gray-400 dark:text-gray-500">この機能は準備中です</p>
    </div>
  );
}
