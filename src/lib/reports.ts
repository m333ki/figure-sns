import { supabase } from "@/lib/supabase";

export type ReportTargetType = "post" | "user" | "message";

export const REPORT_REASONS = ["スパム", "不適切なコンテンツ", "嫌がらせ", "その他"] as const;
export type ReportReason = (typeof REPORT_REASONS)[number];

export type CreateReportInput = {
  targetType: ReportTargetType;
  targetId: string;
  reason: ReportReason;
  detail?: string;
};

export async function createReport(input: CreateReportInput): Promise<void> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Deliberately no .select()/.single() here: reports has no SELECT RLS
  // policy, so asking PostgREST to return the inserted row would fail even
  // though the insert itself succeeds.
  const { error } = await supabase.from("reports").insert({
    target_type: input.targetType,
    target_id: input.targetId,
    // Kept in sync for any existing admin queries built against the
    // original posts-only shape of this table.
    post_id: input.targetType === "post" ? input.targetId : null,
    reason: input.reason,
    detail: input.detail?.trim() || null,
    reporter_id: session?.user.id ?? null,
  });

  if (error) throw error;
}
