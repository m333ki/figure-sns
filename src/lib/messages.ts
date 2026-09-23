import { supabase } from "@/lib/supabase";
import { ChatMessage, ChatThreadSummary } from "@/types";

type DbMessage = {
  id: string;
  sender_id: string;
  sender_username: string;
  recipient_id: string;
  recipient_username: string;
  body: string;
  // Optional: rows written before the image_urls migration (or a client
  // that hasn't picked it up yet) simply won't have it.
  image_urls?: string[] | null;
  is_read: boolean;
  created_at: string;
};

function mapDbMessageToMessage(row: DbMessage): ChatMessage {
  return {
    id: row.id,
    senderId: row.sender_id,
    senderUsername: row.sender_username,
    recipientId: row.recipient_id,
    recipientUsername: row.recipient_username,
    body: row.body,
    imageUrls: row.image_urls ?? [],
    isRead: row.is_read,
    createdAt: row.created_at,
  };
}

// 会話一覧: 自分が関わる全メッセージを取得し、相手ユーザーごとに
// 「最新の1件」と「未読数」へクライアント側で集約する（conversationsテーブルは
// 持たない設計のため）。
export async function fetchThreads(): Promise<ChatThreadSummary[]> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return [];
  const myId = session.user.id;

  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .or(`sender_id.eq.${myId},recipient_id.eq.${myId}`)
    .order("created_at", { ascending: false });

  if (error) throw error;

  const rows = (data as DbMessage[]).map(mapDbMessageToMessage);
  const threads = new Map<string, ChatThreadSummary>();

  for (const m of rows) {
    const otherUserId = m.senderId === myId ? m.recipientId : m.senderId;
    const otherUsername = m.senderId === myId ? m.recipientUsername : m.senderUsername;
    const existing = threads.get(otherUserId);
    if (!existing) {
      threads.set(otherUserId, {
        otherUserId,
        otherUsername,
        lastMessage: m.body || (m.imageUrls.length > 0 ? "📷 画像" : m.body),
        lastMessageAt: m.createdAt,
        unreadCount: m.recipientId === myId && !m.isRead ? 1 : 0,
      });
    } else if (m.recipientId === myId && !m.isRead) {
      existing.unreadCount += 1;
    }
  }

  return Array.from(threads.values()).sort(
    (a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
  );
}

export async function fetchThread(otherUserId: string): Promise<ChatMessage[]> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return [];
  const myId = session.user.id;

  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .or(
      `and(sender_id.eq.${myId},recipient_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},recipient_id.eq.${myId})`
    )
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data as DbMessage[]).map(mapDbMessageToMessage);
}

export async function sendMessage(
  recipientId: string,
  recipientUsername: string,
  body: string,
  imageUrls: string[] = []
): Promise<ChatMessage> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error("ログインが必要です");
  const senderUsername =
    (session.user.user_metadata?.username as string | undefined) ??
    session.user.email?.split("@")[0] ??
    "unknown";

  const basePayload = {
    sender_id: session.user.id,
    sender_username: senderUsername,
    recipient_id: recipientId,
    recipient_username: recipientUsername,
    body,
  };

  let { data, error } = await supabase
    .from("messages")
    .insert({ ...basePayload, image_urls: imageUrls })
    .select()
    .single();

  // Fallback for before the image_urls migration has been run: send as a
  // text-only message rather than failing the whole submission.
  if (error?.message?.includes("image_urls")) {
    ({ data, error } = await supabase.from("messages").insert(basePayload).select().single());
  }

  if (error) throw error;
  return mapDbMessageToMessage(data as DbMessage);
}

export async function markThreadRead(otherUserId: string): Promise<void> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return;

  const { error } = await supabase
    .from("messages")
    .update({ is_read: true })
    .eq("sender_id", otherUserId)
    .eq("recipient_id", session.user.id)
    .eq("is_read", false);
  if (error) throw error;
}

export async function fetchUnreadMessageCount(): Promise<number> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return 0;
  const myId = session.user.id;

  // recipient_id scopes this to messages addressed to me (without it, this
  // counted every unread row in the table, including ones I just sent
  // myself -- new messages default to is_read=false until the recipient
  // reads them, so the badge grew every time I sent one). sender_id!=myId
  // guards against a self-message ever being double-counted, though the UI
  // never lets a user message themselves.
  const { count, error } = await supabase
    .from("messages")
    .select("*", { count: "exact", head: true })
    .eq("recipient_id", myId)
    .eq("is_read", false)
    .neq("sender_id", myId);

  if (error) throw error;
  return count ?? 0;
}

// スレッドを開いている間だけ購読する（常時接続はしない設計）。新着メッセージ
// （相手からの INSERT）に加えて、既読の付いた瞬間（自分が送った行の
// is_read が相手側の操作で true になる UPDATE）も同じチャンネルで拾い、
// 開いたままのチャット画面に「既読」表示をリアルタイムで反映する。
// 戻り値の関数を呼ぶと購読解除される。
export function subscribeToThread(
  myUserId: string,
  otherUserId: string,
  handlers: {
    onMessage: (message: ChatMessage) => void;
    onReadReceipt: (messageId: string) => void;
  }
): () => void {
  const channel = supabase
    .channel(`messages:thread:${myUserId}:${otherUserId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `recipient_id=eq.${myUserId}`,
      },
      (payload) => {
        const message = mapDbMessageToMessage(payload.new as DbMessage);
        if (message.senderId === otherUserId) handlers.onMessage(message);
      }
    )
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "messages",
        filter: `sender_id=eq.${myUserId}`,
      },
      (payload) => {
        const row = payload.new as DbMessage;
        if (row.recipient_id === otherUserId && row.is_read) handlers.onReadReceipt(row.id);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
