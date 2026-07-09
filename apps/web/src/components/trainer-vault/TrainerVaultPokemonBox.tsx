import type {ChangeBattleV2Api} from "@changebattle-v2/api";
import {ImageWithFallback} from "../shared/ImageWithFallback";
import {PlayerBagItemIcon} from "../training/PlayerBagPanel";
import {itemRecordView, pokemonRecordView, POKEMON_PAGE_SIZE, spriteStyleFromCss, STORAGE_BOX_UNLOCK_BP_COST, type VaultPageEntry} from "./TrainerVaultModel";
import {VaultPagination} from "./VaultPagination";
import "./TrainerVaultPokemonBox.css";

export function TrainerVaultPokemonBox({api, entries, pageIndex, totalPageCount, locked, saving, unlocking, useModeActive, onSelectEntry, onUnlock, onPageChange}: {
  api: ChangeBattleV2Api;
  entries: VaultPageEntry[];
  pageIndex: number;
  totalPageCount: number;
  locked: boolean;
  saving: boolean;
  unlocking: boolean;
  useModeActive: boolean;
  onSelectEntry: (entry: VaultPageEntry) => void;
  onUnlock: () => void;
  onPageChange: (page: number) => void;
}) {
  return (
    <section className="trainer-vault-pokemon-box" aria-label="宝可梦区域">
      <header>
        <div>
          <small>宝可梦区域</small>
          <strong>宝可梦箱</strong>
        </div>
        {useModeActive ? <span>选择目标</span> : null}
      </header>
      <section className={`trainer-vault-pokemon-box-grid ${locked ? "locked" : ""} ${useModeActive ? "using-item" : ""}`} aria-label="宝可梦存储箱">
        {locked ? <div className="trainer-vault-pokemon-box-lock-badge" aria-hidden="true">LOCK</div> : null}
        {entries.slice(0, POKEMON_PAGE_SIZE).map((entry, index) => (
          <VaultPokemonCell
            api={api}
            entry={entry}
            useTarget={Boolean(useModeActive && entry.kind === "pokemon" && !locked)}
            onSelect={() => onSelectEntry(entry)}
            key={`${entry.key}-${index}`}
          />
        ))}
      </section>
      <VaultPagination
        locked={locked}
        pageIndex={pageIndex}
        totalPageCount={totalPageCount}
        unlockLabel={unlocking ? "解锁中..." : `解锁 ${STORAGE_BOX_UNLOCK_BP_COST} BP`}
        disabled={saving || unlocking}
        onUnlock={onUnlock}
        onPageChange={onPageChange}
      />
    </section>
  );
}

function VaultPokemonCell({api, entry, useTarget, onSelect}: {
  api: ChangeBattleV2Api;
  entry: VaultPageEntry;
  useTarget: boolean;
  onSelect: () => void;
}) {
  if (entry.kind !== "pokemon") return <span className="trainer-vault-pokemon-box-cell empty" aria-hidden="true" />;
  const pokemonView = pokemonRecordView(api, entry.pokemon);
  const heldItemView = entry.pokemon.heldItemId ? itemRecordView(api, {itemId: entry.pokemon.heldItemId, quantity: 1}, {preferSpriteIcon: true}) : null;
  return (
    <button className={`trainer-vault-pokemon-box-cell pokemon ${entry.pokemon.battleMarked ? "battle-marked" : ""} ${useTarget ? "use-target" : ""}`} type="button" title={pokemonView.name} onClick={onSelect}>
      <VaultPokemonCellIcon view={pokemonView} />
      {entry.pokemon.shiny ? <em>★</em> : null}
      {heldItemView ? <span className="trainer-vault-pokemon-box-held-item"><span><PlayerBagItemIcon api={api} item={heldItemView.iconItem} /></span></span> : null}
    </button>
  );
}

function VaultPokemonCellIcon({view}: {view: ReturnType<typeof pokemonRecordView>}) {
  const iconStyle = view.iconStyle ? spriteStyleFromCss(view.iconStyle) : null;
  if (iconStyle) return <span className="trainer-vault-pokemon-box-pokemon-icon picon" aria-label={view.name} style={iconStyle} />;
  return <ImageWithFallback src={view.iconUrl || ""} alt={view.name} fallback={view.name.slice(0, 1) || "?"} />;
}
