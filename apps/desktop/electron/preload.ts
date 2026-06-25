import {contextBridge, ipcRenderer} from "electron";
import type {UserProfileV2} from "@changebattle-v2/api";

contextBridge.exposeInMainWorld("changeBattleV2", {
  userProfile: {
    loadUserProfile: (): Promise<UserProfileV2 | null> => ipcRenderer.invoke("userProfile:load"),
    saveUserProfile: (profile: UserProfileV2): Promise<UserProfileV2> => ipcRenderer.invoke("userProfile:save", profile),
    deleteUserProfile: (): Promise<void> => ipcRenderer.invoke("userProfile:delete"),
    getUserProfilePath: (): Promise<string> => ipcRenderer.invoke("userProfile:path"),
  },
});
