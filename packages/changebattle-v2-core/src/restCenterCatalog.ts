export type RestCenterActionIdV4 = "pokedex" | "shop" | "team" | "bag" | "save" | "finish-rest" | "abandon-run";

export type RestCenterActionGroupV4 = "paper" | "left-side" | "right-side";

export type RestCenterActionEntryV4 = {
  id: RestCenterActionIdV4 | "placeholder";
  label: string;
  action: string;
  group: RestCenterActionGroupV4;
  iconSrc?: string;
  iconText?: string;
  disabled?: boolean;
  primary?: boolean;
  danger?: boolean;
};

export const REST_CENTER_PAPER_ACTIONS_V4: RestCenterActionEntryV4[] = [
  {id: "pokedex", label: "图鉴", action: "图鉴", group: "paper", iconSrc: "/ui/book.png"},
  {id: "shop", label: "商店", action: "商店", group: "paper", iconSrc: "/aboutIcon/shop.png"},
  {id: "placeholder", label: "未开放", action: "未开放", group: "paper", iconText: "?", disabled: true},
  {id: "placeholder", label: "未开放", action: "未开放", group: "paper", iconText: "?", disabled: true},
  {id: "placeholder", label: "未开放", action: "未开放", group: "paper", iconText: "?", disabled: true},
  {id: "placeholder", label: "未开放", action: "未开放", group: "paper", iconText: "?", disabled: true},
  {id: "placeholder", label: "未开放", action: "未开放", group: "paper", iconText: "?", disabled: true},
  {id: "placeholder", label: "未开放", action: "未开放", group: "paper", iconText: "?", disabled: true},
];

export const REST_CENTER_LEFT_SIDE_ACTIONS_V4: RestCenterActionEntryV4[] = [
  {id: "team", label: "我的队伍", action: "我的队伍", group: "left-side"},
  {id: "bag", label: "我的背包", action: "我的背包", group: "left-side"},
  {id: "save", label: "保存", action: "保存", group: "left-side"},
];

export const REST_CENTER_RIGHT_SIDE_ACTIONS_V4: RestCenterActionEntryV4[] = [
  {id: "finish-rest", label: "结束休整", action: "结束休整", group: "right-side", primary: true},
  {id: "abandon-run", label: "放弃比赛", action: "放弃比赛", group: "right-side", danger: true},
];
