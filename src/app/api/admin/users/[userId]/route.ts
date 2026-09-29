import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// Verifies the caller's own access token (sent as a bearer header, not
// cookies -- this app's client is plain @supabase/supabase-js with no SSR
// cookie bridge) and that their profile is flagged is_admin, using the
// service-role client so this check itself isn't subject to RLS.
async function requireAdmin(request: Request) {
  const token = request.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return null;

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) return null;

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("is_admin")
    .eq("user_id", data.user.id)
    .maybeSingle();

  return profile?.is_admin ? data.user : null;
}

export async function DELETE(request: Request, { params }: { params: Promise<{ userId: string }> }) {
  const admin = await requireAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  const { userId } = await params;
  if (userId === admin.id) {
    return NextResponse.json({ error: "自分自身は削除できません" }, { status: 400 });
  }

  const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
