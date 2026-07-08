const releaseChannel = String(import.meta.env.VITE_CHANGEBATTLE_RELEASE_CHANNEL || "stable").trim().toLowerCase();

export const CHANGE_BATTLE_DEBUG_FEATURES_ENABLED = import.meta.env.DEV || releaseChannel === "beta";
export const CHANGE_BATTLE_RELEASE_CHANNEL = releaseChannel;
