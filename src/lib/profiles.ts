import { supabase } from "@/lib/supabase";

// UserProfile.avatarUrl is `string | null`; Post.userAvatarUrl is a
// non-nullable `string`. This covers the gap in both directions.
// (Lives here rather than in posts.ts so posts.ts/comments.ts can import it
// from profiles.ts without a circular dependency.)
export const FALLBACK_AVATAR_URL =
  "https://placehold.co/80x80/f3f4f6/374151/png?text=%3F";

export type Profile = {
  userId: string;
  username: string;
  displayName: string;
  bio: string;
  avatarUrl: string | null;
};

type DbProfile = {
  user_id: string;
  username: string;
  display_name: string;
  bio: string;
  avatar_url: string | null;
};

function mapDbProfileToProfile(row: DbProfile): Profile {
  return {
    userId: row.user_id,
    username: row.username,
    displayName: row.display_name,
    bio: row.bio,
    avatarUrl: row.avatar_url,
  };
}

// Escapes ILIKE's own wildcard characters so a literal "%"/"_" typed by the
// user is matched literally instead of acting as a pattern wildcard.
function escapeIlike(value: string): string {
  return value.replace(/[\\%_]/g, (c) => `\\${c}`);
}

// Two separate queries (rather than one `.or("username.ilike...,display_name.ilike...")`)
// to sidestep PostgREST's `.or()` filter syntax, which treats commas/parens
// in the value as its own delimiters -- arbitrary user-typed search text
// could easily contain either.
export async function searchProfiles(query: string, limit = 20): Promise<Profile[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];
  const pattern = `%${escapeIlike(trimmed)}%`;

  const [byUsername, byDisplayName] = await Promise.all([
    supabase.from("profiles").select("*").ilike("username", pattern).limit(limit),
    supabase.from("profiles").select("*").ilike("display_name", pattern).limit(limit),
  ]);
  if (byUsername.error) throw byUsername.error;
  if (byDisplayName.error) throw byDisplayName.error;

  const byId = new Map<string, Profile>();
  for (const row of [...byUsername.data, ...byDisplayName.data] as DbProfile[]) {
    const profile = mapDbProfileToProfile(row);
    byId.set(profile.userId, profile);
  }
  return [...byId.values()].slice(0, limit);
}

export async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return data ? mapDbProfileToProfile(data as DbProfile) : null;
}

export async function updateMyProfile(
  userId: string,
  username: string,
  input: { displayName: string; bio: string; avatarUrl: string | null }
): Promise<Profile> {
  const { data, error } = await supabase
    .from("profiles")
    .upsert(
      {
        user_id: userId,
        username,
        display_name: input.displayName,
        bio: input.bio,
        avatar_url: input.avatarUrl,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    )
    .select()
    .single();

  if (error) throw error;
  return mapDbProfileToProfile(data as DbProfile);
}

function extensionFromFile(file: File): string {
  const fromName = file.name.split(".").pop();
  if (fromName && fromName.length <= 5 && !fromName.includes("/")) {
    return fromName.toLowerCase();
  }
  const fromType = file.type.split("/").pop();
  return fromType ? fromType.toLowerCase() : "jpg";
}

export async function uploadAvatarImage(file: File): Promise<string> {
  const ext = extensionFromFile(file);
  const path = `avatars/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("figures")
    .upload(path, file, { contentType: file.type || "image/jpeg" });
  if (uploadError) throw uploadError;

  const {
    data: { publicUrl },
  } = supabase.storage.from("figures").getPublicUrl(path);
  return publicUrl;
}

// Best-effort: guarantees a profile row exists for anyone who's ever
// posted/commented (so their real username is resolvable from another
// user's "view profile" page later), without touching the signup flow
// (which may have no session yet if email confirmation is pending).
//
// Deliberately two round-trips rather than a single
// `.upsert(..., {ignoreDuplicates:true}).select().single()`: ON CONFLICT DO
// NOTHING returns zero rows for the conflicting key, so `.single()` would
// throw for every user who already has a profile -- i.e. the common case.
export async function ensureProfileAndGetAvatarUrl(
  userId: string,
  username: string
): Promise<string> {
  const { data } = await supabase
    .from("profiles")
    .select("avatar_url")
    .eq("user_id", userId)
    .maybeSingle();

  if (data) return data.avatar_url ?? FALLBACK_AVATAR_URL;

  await supabase
    .from("profiles")
    .upsert(
      { user_id: userId, username, display_name: username },
      { onConflict: "user_id", ignoreDuplicates: true }
    );
  return FALLBACK_AVATAR_URL;
}
