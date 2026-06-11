process.env.CHANGEBATTLE_MOBILE_SHOWDOWN_BUNDLE ||= "apps/mobile/public/showdown/showdown-mobile.mjs";
process.env.CHANGEBATTLE_MOBILE_SHOWDOWN_SKIP_SMOKE ||= "1";

await import("./mobile_showdown_smoke.mjs");
