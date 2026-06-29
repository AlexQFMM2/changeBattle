import type {ReactNode} from "react";
import type {ChangeBattleV2Api} from "@changebattle-v2/api";
import {TrainingRestNewActionBoardPreview} from "../training/TrainingRestNewActionBoard.preview";
import {TrainingRestNewBagPanelPreview} from "../training/TrainingRestNewBagPanel.preview";
import {TrainingRestNewTeamPanelPreview} from "../training/TrainingRestNewTeamPanel.preview";
import {TrainingRestShopDialoguePreview} from "../training/TrainingRestShopDialogue.preview";
import {TrainingRestShopPanelPreview} from "../training/TrainingRestShopPanel.preview";
import {TrainingRestShopPartsPreview} from "../training/TrainingRestShopParts.preview";
import {TrainingRestShopScenePreview} from "../training/TrainingRestShopScene.preview";
import {TrainingRestNextPreviewPanelPreview} from "../training/TrainingRestNextPreviewPanel.preview";

export type ComponentPreviewEntry = {
  id: string;
  title: string;
  description: string;
  render: (api: ChangeBattleV2Api) => ReactNode;
};

export const COMPONENT_PREVIEWS: ComponentPreviewEntry[] = [
  {
    id: "training-rest-new-team-panel",
    title: "休整页队伍",
    description: "复合组件：队伍详情、能力锁、技能锁、底部队伍抽屉。",
    render: api => <TrainingRestNewTeamPanelPreview api={api} />,
  },
  {
    id: "training-rest-new-bag-panel",
    title: "休整页背包",
    description: "复合组件：道具详情、当前队伍选择、携带道具快捷跳转、底部横向道具列表。",
    render: api => <TrainingRestNewBagPanelPreview api={api} />,
  },
  {
    id: "training-rest-shop-panel",
    title: "休整页商店",
    description: "复合组件：背包多选卖出、分类商店货架、商品详情和单件购买。",
    render: api => <TrainingRestShopPanelPreview api={api} />,
  },
  {
    id: "training-rest-shop-scene",
    title: "商店独立场景",
    description: "复合组件：商店背景、服务员、柜台前景、右侧货架和返回按钮。",
    render: api => <TrainingRestShopScenePreview api={api} />,
  },
  {
    id: "training-rest-shop-parts",
    title: "商店部件",
    description: "独立部件：服务员 idle/intro sprite 与 24 格货架槽位。",
    render: api => <TrainingRestShopPartsPreview api={api} />,
  },
  {
    id: "training-rest-shop-dialogue",
    title: "商店商品对话",
    description: "独立组件：左侧高清服务员、商品介绍台词和两个购买决策按钮。",
    render: () => <TrainingRestShopDialoguePreview />,
  },
  {
    id: "training-rest-next-preview",
    title: "下一场预览",
    description: "休整页右侧公告栏：对手、未知宝可梦、解锁和图鉴跳转状态。",
    render: api => <TrainingRestNextPreviewPanelPreview api={api} />,
  },
  {
    id: "training-rest-action-board",
    title: "休整功能公告栏",
    description: "休整页左侧大公告栏：图鉴入口和预留功能按钮。",
    render: () => <TrainingRestNewActionBoardPreview />,
  },
];
