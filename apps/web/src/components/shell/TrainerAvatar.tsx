import type {UserProfileV2} from "@changebattle-v2/api";
import {ImageWithFallback} from "../shared/ImageWithFallback";

export function TrainerAvatar({profile, fallbackText}: {profile: UserProfileV2 | null; fallbackText?: string}) {
  const label = profile?.name || "训练师";
  return (
    <span className="trainer-avatar">
      <ImageWithFallback src={profile?.avatarAsset || profile?.frontAsset} alt={label} fallback={fallbackText || label.slice(0, 1) || "?"} />
    </span>
  );
}
