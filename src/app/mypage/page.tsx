"use client";

import { useState } from "react";
import ProfileHeader from "@/components/mypage/ProfileHeader";
import ProfileTabs from "@/components/mypage/ProfileTabs";
import {
  dummyUserProfile,
  dummyShelfSlots,
  dummyFigureCatalog,
  dummyMyPosts,
} from "@/lib/dummy-data";

export default function MyPage() {
  const [profile, setProfile] = useState(dummyUserProfile);

  return (
    <div>
      <ProfileHeader profile={profile} onSave={setProfile} />
      <ProfileTabs
        shelfSlots={dummyShelfSlots}
        figureCatalog={dummyFigureCatalog}
        posts={dummyMyPosts}
      />
    </div>
  );
}
