import type {PlayerPokemonHonorBadgeViewV4} from "@changebattle-v2/api";
import {useState} from "react";
import {VaultPokemonHonorBadgeModal, VaultPokemonHonorBadges} from "./VaultPokemonHonorBadges";
import "./VaultPokemonHonorBadges.preview.css";

export function VaultPokemonHonorBadgesPreview() {
  const [selectedBadge, setSelectedBadge] = useState<PlayerPokemonHonorBadgeViewV4 | null>(null);
  return (
    <section className="vault-pokemon-honor-preview" aria-label="宝可梦个人奖章预览">
      <div className="vault-pokemon-honor-preview-panel">
        <VaultPokemonHonorBadges badges={previewBadges} onSelectBadge={setSelectedBadge} />
      </div>
      {selectedBadge ? <VaultPokemonHonorBadgeModal badge={selectedBadge} onClose={() => setSelectedBadge(null)} /> : null}
    </section>
  );
}

const previewBadges: PlayerPokemonHonorBadgeViewV4[] = [
  badge("kanto", "关都制霸奖章", "关都", "runtime/soulmate-badges/kanto-medal.png", true, 3, 3),
  badge("johto", "城都制霸奖章", "城都", "runtime/soulmate-badges/johto-medal.png", false, 2, 4),
  badge("hoenn", "丰缘制霸奖章", "丰缘", "runtime/soulmate-badges/hoenn-medal.png", false, 0, 3),
  badge("sinnoh", "神奥制霸奖章", "神奥", "runtime/soulmate-badges/sinnoh-medal.png", false, 1, 5),
  badge("unova", "合众制霸奖章", "合众", "runtime/soulmate-badges/unova-medal.png", false, 0, 4),
  badge("kalos", "卡洛斯制霸奖章", "卡洛斯", "runtime/soulmate-badges/kalos-medal.png", false, 0, 4),
  badge("alola", "阿罗拉制霸奖章", "阿罗拉", "runtime/soulmate-badges/alola-medal.png", false, 0, 4),
  badge("galar", "伽勒尔制霸奖章", "伽勒尔", "runtime/soulmate-badges/galar-medal.png", false, 0, 4),
  badge("paldea", "帕底亚制霸奖章", "帕底亚", "runtime/soulmate-badges/paldea-medal.png", false, 0, 4),
  badge("villain", "反派肃清奖章", "反派", "runtime/soulmate-badges/villain-medal.png", false, 1, 6),
];

function badge(id: PlayerPokemonHonorBadgeViewV4["id"], name: string, shortName: string, iconPath: string, earned: boolean, completedTargetCount: number, targetCount: number): PlayerPokemonHonorBadgeViewV4 {
  const targets = Array.from({length: targetCount}, (_, index) => ({
    trainerId: `${id}:target:${index + 1}`,
    name: index === 0 ? "很长很长名字的冠军训练师" : `目标${index + 1}`,
    trainerType: index === targetCount - 1 ? "champion" as const : "gym" as const,
    region: id === "villain" ? "彩虹火箭队" : `${shortName}地区`,
    completed: index < completedTargetCount,
  }));
  return {
    id,
    name,
    shortName,
    description: `与这只宝可梦一起完成${shortName}相关挑战后点亮。`,
    assetPath: iconPath,
    iconPath,
    targetKinds: id === "villain" ? ["villain"] : ["gym", "elite4", "champion"],
    earned,
    completedTargetCount,
    targetCount,
    targets,
    statusLabel: earned ? "已点亮" : `${completedTargetCount}/${targetCount}`,
    missingTargets: targets.filter((target): target is typeof target & {completed: false} => !target.completed),
  };
}
