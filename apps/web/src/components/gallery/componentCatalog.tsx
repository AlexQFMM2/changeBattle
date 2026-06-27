import type {ReactNode} from "react";
import type {ChangeBattleV2Api} from "@changebattle-v2/api";
import {TrainingRestNewActionBoardPreview} from "../training/TrainingRestNewActionBoard.preview";
import {TrainingRestNewBagPanelPreview} from "../training/TrainingRestNewBagPanel.preview";
import {TrainingRestNewTeamPanelPreview} from "../training/TrainingRestNewTeamPanel.preview";
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
