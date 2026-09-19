import { supabase } from "@/lib/supabase";

export type CreateReportInput = {
  postId: string;
  reason?: string | null;
};

export async function createReport(input: CreateReportInput): Promise<void> {
  // Deliberately no .select()/.single() here: reports has no SELECT RLS
  // policy, so asking PostgREST to return the inserted row would fail even
  // though the insert itself succeeds.
  const { error } = await supabase.from("reports").insert({
    post_id: input.postId,
    reason: input.reason ?? null,
  });

  if (error) throw error;
}
