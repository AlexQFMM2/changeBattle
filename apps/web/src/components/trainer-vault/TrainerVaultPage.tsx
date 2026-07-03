import type {ChangeBattleV2Api, LocalPokemonV4, PlayerItemInstanceV4, UserProfileV2} from "@changebattle-v2/api";
import {ImageWithFallback} from "../shared/ImageWithFallback";
import {displayItemName, PlayerBagItemIcon} from "../training/PlayerBagPanel";
import {assetUrl} from "../../lib/assetUrl";
import {localPokemonFrontSpriteUrl} from "../../lib/showdownPokemonSpriteAdapter";
import "./TrainerVaultPage.css";

type TrainerVaultTab = "bag" | "pokemon";

export function TrainerVaultPage({api, profile, tab, onTabChange, onBack}: {
  api: ChangeBattleV2Api;
  profile: UserProfileV2;
  tab: TrainerVaultTab;
  onTabChange: (tab: TrainerVaultTab) => void;
  onBack: () => void;
}) {
  const vault = profile.trainerVault;
  const items = vault.bag.items;
  const pokemonBox = vault.pokemonBox;

  return (
    <section className="trainer-vault-page" aria-label="训练家仓库">
      <video className="trainer-vault-video-bg" autoPlay muted loop playsInline controls={false} aria-hidden="true">
        <source src={assetUrl("title/pokemon-room-bg.mp4")} type="video/mp4" />
      </video>
      <div className="trainer-vault-backdrop" aria-hidden="true" />
      <header className="trainer-vault-header">
        <div>
          <span>训练家仓库</span>
          <strong>{tab === "bag" ? "我的背包" : "我的宝可梦"}</strong>
        </div>
        <button type="button" onClick={onBack}>返回主页</button>
      </header>
      <nav className="trainer-vault-tabs" aria-label="训练家仓库分区">
        <button className={tab === "bag" ? "active" : ""} type="button" onClick={() => onTabChange("bag")}>我的背包</button>
        <button className={tab === "pokemon" ? "active" : ""} type="button" onClick={() => onTabChange("pokemon")}>我的宝可梦</button>
      </nav>
      {tab === "bag" ? (
        <TrainerVaultBag api={api} items={items} maxSize={vault.bag.maxSize} />
      ) : (
        <TrainerVaultPokemonBox pokemon={pokemonBox} />
      )}
    </section>
  );
}

function TrainerVaultBag({api, items, maxSize}: {api: ChangeBattleV2Api; items: PlayerItemInstanceV4[]; maxSize: number}) {
  return (
    <main className="trainer-vault-content">
      <section className="trainer-vault-summary" aria-label="背包概览">
        <strong>{items.length}/{maxSize}</strong>
        <span>长期持有道具</span>
      </section>
      {items.length ? (
        <section className="trainer-vault-grid bag" aria-label="我的背包道具">
          {items.map(item => (
            <article className="trainer-vault-item" key={item.id}>
              <PlayerBagItemIcon api={api} item={item} />
              <div>
                <strong>{displayItemName(item)}</strong>
                <span>{itemTypeLabel(item.type)}</span>
              </div>
            </article>
          ))}
        </section>
      ) : (
        <TrainerVaultEmpty
          title="训练家行囊还是空的"
          text="后续正式流程结算、长期奖励和自养成系统会把可长期保存的道具放到这里。"
        />
      )}
    </main>
  );
}

function TrainerVaultPokemonBox({pokemon}: {pokemon: LocalPokemonV4[]}) {
  return (
    <main className="trainer-vault-content">
      <section className="trainer-vault-summary" aria-label="宝可梦概览">
        <strong>{pokemon.length}</strong>
        <span>长期伙伴</span>
      </section>
      {pokemon.length ? (
        <section className="trainer-vault-grid pokemon" aria-label="我的宝可梦">
          {pokemon.map(mon => (
            <article className="trainer-vault-pokemon" key={mon.localPokemonId}>
              <ImageWithFallback src={pokemonSprite(mon)} alt={mon.nameZh || mon.name} fallback={(mon.nameZh || mon.name || "?").slice(0, 1)} />
              <div>
                <strong>{mon.nickname || mon.nameZh || mon.name}</strong>
                <span>Lv.{mon.level} · {mon.abilityNameZh || mon.abilityName}</span>
              </div>
              {mon.shiny ? <em>★</em> : null}
            </article>
          ))}
        </section>
      ) : (
        <TrainerVaultEmpty
          title="伙伴盒还没有宝可梦"
          text="这里会存放脱离单局流程后仍属于玩家的自养成宝可梦。"
        />
      )}
    </main>
  );
}

function TrainerVaultEmpty({title, text}: {title: string; text: string}) {
  return (
    <section className="trainer-vault-empty">
      <strong>{title}</strong>
      <span>{text}</span>
    </section>
  );
}

function pokemonSprite(pokemon: LocalPokemonV4): string {
  return localPokemonFrontSpriteUrl(pokemon);
}

function itemTypeLabel(type: PlayerItemInstanceV4["type"]): string {
  const labels: Record<PlayerItemInstanceV4["type"], string> = {
    system: "系统道具",
    "system-battle": "系统战斗道具",
    held: "携带道具",
    medicine: "回复道具",
    berry: "树果",
    training: "训练道具",
    battle: "战斗道具",
    tm: "技能机器",
    key: "重要道具",
    misc: "其他道具",
  };
  return labels[type] || type;
}
