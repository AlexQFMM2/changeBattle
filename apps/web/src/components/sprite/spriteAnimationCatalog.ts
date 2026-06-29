export type SpriteActionKeyV4 =
  | "idle"
  | "wait"
  | "intro"
  | "get"
  | "pull"
  | "present"
  | "happy"
  | "sorry"
  | "confirm";

export type SpriteActionSetV4 = {
  id: string;
  label: string;
  actor: "shop-clerk" | "trainer" | "pokemon";
  defaultAction: SpriteActionKeyV4;
  actions: Partial<Record<SpriteActionKeyV4, string>>;
};

export type SpriteSequenceV4 = {
  id: string;
  src: string;
  frameWidth: number;
  frameHeight: number;
  frameCount: number;
  stepX: number;
  stepY?: number;
  durationMs: number;
  repeatDelayMs?: number;
  loop: boolean;
};

export const SPRITE_ACTION_SETS_V4: Record<string, SpriteActionSetV4> = {
  "shop-clerk-gardevoir": {
    id: "shop-clerk-gardevoir",
    label: "商店服务员",
    actor: "shop-clerk",
    defaultAction: "wait",
    actions: {
      idle: "shop-clerk-gardevoir-wait",
      wait: "shop-clerk-gardevoir-wait",
      intro: "shop-clerk-gardevoir-intro",
      get: "shop-clerk-gardevoir-get",
      pull: "shop-clerk-gardevoir-pull",
    },
  },
};

export const SPRITE_SEQUENCES_V4: Record<string, SpriteSequenceV4> = {
  "shop-clerk-gardevoir-wait": {
    id: "shop-clerk-gardevoir-wait",
    src: "/shop/rest-store/clerk-wait-runtime.png",
    frameWidth: 122,
    frameHeight: 185,
    frameCount: 5,
    stepX: 122,
    durationMs: 1000,
    repeatDelayMs: 2000,
    loop: true,
  },
  "shop-clerk-gardevoir-idle": {
    id: "shop-clerk-gardevoir-idle",
    src: "/shop/rest-store/clerk-smile-runtime.png",
    frameWidth: 122,
    frameHeight: 182,
    frameCount: 4,
    stepX: 122,
    durationMs: 2400,
    loop: true,
  },
  "shop-clerk-gardevoir-get": {
    id: "shop-clerk-gardevoir-get",
    src: "/shop/rest-store/clerk-get-runtime.png",
    frameWidth: 122,
    frameHeight: 185,
    frameCount: 5,
    stepX: 122,
    durationMs: 900,
    loop: false,
  },
  "shop-clerk-gardevoir-pull": {
    id: "shop-clerk-gardevoir-pull",
    src: "/shop/rest-store/clerk-pull-runtime.png",
    frameWidth: 122,
    frameHeight: 187,
    frameCount: 4,
    stepX: 122,
    durationMs: 760,
    loop: false,
  },
  "shop-clerk-gardevoir-intro": {
    id: "shop-clerk-gardevoir-intro",
    src: "/shop/rest-store/clerk-intro-runtime.png",
    frameWidth: 122,
    frameHeight: 182,
    frameCount: 6,
    stepX: 122,
    durationMs: 1150,
    loop: false,
  },
};

export function resolveSpriteSequence(actionSetId: string, action: SpriteActionKeyV4): SpriteSequenceV4 {
  const actionSet = SPRITE_ACTION_SETS_V4[actionSetId];
  if (!actionSet) return missingSpriteSequence(actionSetId, action);
  const sequenceId = actionSet.actions[action] || actionSet.actions[actionSet.defaultAction];
  return sequenceId && SPRITE_SEQUENCES_V4[sequenceId]
    ? SPRITE_SEQUENCES_V4[sequenceId]
    : missingSpriteSequence(actionSetId, action);
}

function missingSpriteSequence(actionSetId: string, action: SpriteActionKeyV4): SpriteSequenceV4 {
  return {
    id: `${actionSetId}-${action}-missing`,
    src: "",
    frameWidth: 1,
    frameHeight: 1,
    frameCount: 1,
    stepX: 1,
    durationMs: 1000,
    loop: true,
  };
}
