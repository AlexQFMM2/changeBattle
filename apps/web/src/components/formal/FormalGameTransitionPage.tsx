import {type ChangeBattleV2Api, type DesktopFormalGameBridge, type FormalGameModeV4, type FormalGameRunV4, type PlayerVaultV4, type UserProfileV2} from "@changebattle-v2/api";
import {TrainingRunTransitionPage} from "../training/TrainingRunTransitionPage";
import "./FormalGameTransitionPage.css";

export function FormalGameTransitionPage(_props: {
  api: ChangeBattleV2Api;
  formalGameBridge?: DesktopFormalGameBridge;
  profile: UserProfileV2;
  playerVault: PlayerVaultV4;
  mode: FormalGameModeV4;
  onRunReady: (run: FormalGameRunV4) => void;
}) {
  return (
    <section className="formal-game-transition-wrap">
      <TrainingRunTransitionPage
        title="准备正式游戏"
        detail="请先进入正式房间"
        tip="正式游戏现在由房间页负责连接服务器、创建房间和恢复进度。"
        onReady={() => undefined}
      />
    </section>
  );
}
