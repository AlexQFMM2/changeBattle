import type {DesktopGameState, RestAction} from "@changebattle/shared";

export type RestActionResult = DesktopGameState | boolean | void;
export type RestActionHandler = (action: RestAction, successMessage?: string) => RestActionResult | Promise<RestActionResult>;
