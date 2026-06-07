import type {ComponentProps} from "react";
import {MainMenu as MainMenuComponent, TitleScreen as TitleScreenComponent} from "../../components/shell/ShellScreens";

export function TitleScreen(props: ComponentProps<typeof TitleScreenComponent>) {
  return <TitleScreenComponent {...props} />;
}

export function MainMenu(props: ComponentProps<typeof MainMenuComponent>) {
  return <MainMenuComponent {...props} />;
}
