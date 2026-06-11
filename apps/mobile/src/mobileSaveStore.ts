import {Directory, Encoding, Filesystem} from "@capacitor/filesystem";
import type {RuntimeSaveFileStorage} from "@changebattle/game-runtime";
import {SplitJsonSaveStore} from "@changebattle/game-runtime";

class CapacitorSaveFileStorage implements RuntimeSaveFileStorage {
  async readText(path: string): Promise<string> {
    const result = await Filesystem.readFile({path, directory: Directory.Data, encoding: Encoding.UTF8});
    return String(result.data || "");
  }

  async writeText(path: string, text: string): Promise<void> {
    await this.mkdir(parentPath(path));
    await Filesystem.writeFile({path, directory: Directory.Data, encoding: Encoding.UTF8, data: text});
  }

  async exists(path: string): Promise<boolean> {
    return Filesystem.stat({path, directory: Directory.Data}).then(() => true, () => false);
  }

  async mkdir(path: string): Promise<void> {
    if (!path) return;
    await Filesystem.mkdir({path, directory: Directory.Data, recursive: true}).catch(() => undefined);
  }

  async delete(path: string): Promise<void> {
    await Filesystem.rmdir({path, directory: Directory.Data, recursive: true}).catch(async () => {
      await Filesystem.deleteFile({path, directory: Directory.Data}).catch(() => undefined);
    });
  }
}

export function createMobileSaveStore(): SplitJsonSaveStore {
  return new SplitJsonSaveStore(new CapacitorSaveFileStorage(), "changebattle/saves");
}

function parentPath(path: string): string {
  const normalized = String(path || "").replace(/\\/g, "/");
  const index = normalized.lastIndexOf("/");
  return index <= 0 ? "" : normalized.slice(0, index);
}
