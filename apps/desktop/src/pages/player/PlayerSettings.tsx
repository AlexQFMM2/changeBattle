import type {ComponentProps} from "react";
import {PlayerSettings as PlayerSettingsComponent} from "../../components/player/PlayerSettings";

export function PlayerSettings(props: ComponentProps<typeof PlayerSettingsComponent>) {
  return <PlayerSettingsComponent {...props} />;
}
