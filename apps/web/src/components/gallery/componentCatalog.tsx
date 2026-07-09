import type {ReactNode} from "react";
import type {ChangeBattleV2Api} from "@changebattle-v2/api";
import {TrainingRestNewActionBoardPreview} from "../training/TrainingRestNewActionBoard.preview";
import {TrainingRestNewBagPanelPreview} from "../training/TrainingRestNewBagPanel.preview";
import {TrainingRestNewTeamPanelPreview} from "../training/TrainingRestNewTeamPanel.preview";
import {TrainingRestShopDialoguePreview} from "../training/TrainingRestShopDialogue.preview";
import {TrainingRestShopScenePreview} from "../training/TrainingRestShopScene.preview";
import {TrainingRestTrainingGroundScenePreview} from "../training/TrainingRestTrainingGroundScene.preview";
import {TrainingRestNextPreviewPanelPreview} from "../training/TrainingRestNextPreviewPanel.preview";
import {TrainerVaultPagePreview} from "../trainer-vault/TrainerVaultPage.preview";
import {GameDrawerPreview} from "../shared/GameDrawer.preview";
import {GameEvolutionModalPreview} from "../shared/GameEvolutionModal.preview";

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
    id: "training-rest-shop-scene",
    title: "商店独立场景",
    description: "复合组件：商店背景、金币显示和常驻欢迎菜单。",
    render: () => <TrainingRestShopScenePreview />,
  },
  {
    id: "training-rest-training-ground-scene",
    title: "训练场独立场景",
    description: "复合组件：训练场背景、课程对话、翻转面板、宝可梦选择、技能学习和自习结果。",
    render: api => <TrainingRestTrainingGroundScenePreview api={api} />,
  },
  {
    id: "training-rest-shop-dialogue",
    title: "商店菜单对话",
    description: "独立组件：黑色半透明对话层、条纹边框和三按钮菜单。",
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
  {
    id: "trainer-vault-page",
    title: "训练家仓库",
    description: "复合页面：同屏背包列表、宝可梦箱、通用浮层抽屉和局外道具使用流程。",
    render: api => <TrainerVaultPagePreview api={api} />,
  },
  {
    id: "game-drawer",
    title: "通用抽屉",
    description: "全局组件：motion 滑入抽屉、默认阻塞遮罩、四方向 placement。",
    render: () => <GameDrawerPreview />,
  },
  {
    id: "game-evolution-modal",
    title: "通用进化弹窗",
    description: "全局组件：异样提示、进化动画、结果提示和形态对比。",
    render: () => <GameEvolutionModalPreview />,
  },
];
