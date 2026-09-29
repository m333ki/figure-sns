import { supabase } from "@/lib/supabase";

export const CONTACT_CATEGORIES = [
  "サービスへのご意見・ご要望",
  "不具合の報告",
  "規約違反の報告",
  "その他",
] as const;
export type ContactCategory = (typeof CONTACT_CATEGORIES)[number];

export type CreateContactMessageInput = {
  category: ContactCategory;
  email?: string;
  message: string;
};

export async function createContactMessage(input: CreateContactMessageInput): Promise<void> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // No SELECT RLS policy on this table by design -- submissions are
  // checked in the Supabase table editor, not read back into the app.
  const { error } = await supabase.from("contact_messages").insert({
    user_id: session?.user.id ?? null,
    category: input.category,
    email: input.email?.trim() || null,
    message: input.message.trim(),
  });

  if (error) throw error;
}
