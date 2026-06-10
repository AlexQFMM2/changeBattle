import {useEffect, useMemo, useState} from "react";
import type {BattleState, RentalPokemon, ResultPokemonSummary, ResultProgressRow, ResultSummaryRow, ResultSummaryState} from "@changebattle/shared";
import {PokemonSprite, displayName, trainerDisplayName, trainerImageUrl} from "../../lib/ui";

export function ResultView({message, battle, summary, onBack, backLabel = "返回主界面"}: {message: string; battle: BattleState | null; summary: ResultSummaryState | null; onBack: () => void; backLabel?: string}) {
  const playerWon = summary ? summary.outcome === "win" : battle ? playerWonBattleResult(battle) : false;
  const outcome = summary?.outcome || (playerWon ? "win" : "loss");
  const rows = summary?.rows?.length ? summary.rows : [{label: "结算说明", value: message}];
  const coinRows = (summary?.coin_rows?.length ? summary.coin_rows : rows.filter(row => row.value.includes("金币"))).filter(row => !row.value.includes("BP") && row.label !== "金币折算 BP");
  const usedPokemon = summary?.used_pokemon?.length ? summary.used_pokemon : fallbackUsedPokemon(summary, battle);
  const progressRows = summary?.progress?.length ? summary.progress : fallbackProgress(summary, battle, outcome);
  const [selectedPokemonKey, setSelectedPokemonKey] = useState(() => resultPokemonKey(usedPokemon[0]?.pokemon));
  const defaultProgressNo = progressRows.find(row => row.battle_no === 7)?.battle_no || progressRows.at(-1)?.battle_no || 1;
  const [selectedProgressNo, setSelectedProgressNo] = useState(defaultProgressNo);
  const [usedPage, setUsedPage] = useState(0);
  const selectedPokemon = usedPokemon.find(entry => resultPokemonKey(entry.pokemon) === selectedPokemonKey) || usedPokemon[0] || null;
  const selectedProgress = progressRows.find(row => row.battle_no === selectedProgressNo) || progressRows.find(row => row.battle_no === defaultProgressNo) || progressRows[0] || null;
  const usedPageSize = 3;
  const usedPageCount = Math.max(1, Math.ceil(usedPokemon.length / usedPageSize));
  const currentUsedPage = Math.min(usedPage, usedPageCount - 1);
  const pagedUsedPokemon = usedPokemon.slice(currentUsedPage * usedPageSize, currentUsedPage * usedPageSize + usedPageSize);

  useEffect(() => {
    if (!usedPokemon.some(entry => resultPokemonKey(entry.pokemon) === selectedPokemonKey)) {
      setSelectedPokemonKey(resultPokemonKey(usedPokemon[0]?.pokemon));
    }
  }, [selectedPokemonKey, usedPokemon]);

  useEffect(() => {
    if (usedPage >= usedPageCount) setUsedPage(Math.max(0, usedPageCount - 1));
  }, [usedPage, usedPageCount]);

  useEffect(() => {
    if (!progressRows.some(row => row.battle_no === selectedProgressNo)) setSelectedProgressNo(defaultProgressNo);
  }, [defaultProgressNo, progressRows, selectedProgressNo]);

  return (
    <div className={`result-screen result-${outcome}`}>
      <section className="result-panel">
        <main className="result-left">
          <header className="result-header">
            <div>
              <span>{outcomeLabel(outcome)}</span>
              <h1>{summary?.headline || (playerWon ? "胜利结算" : "结算")}</h1>
              <p>{summary?.subtitle || message || "本局挑战已结束。"}</p>
            </div>
            <button onClick={onBack}>{backLabel}</button>
          </header>
          <div className="result-settlement-grid">
            <ResultRows title="金币结算" rows={coinRows} tone="coin" />
          </div>
          <section className="result-section result-pokemon-section">
            <header>
              <strong>本局使用过的宝可梦</strong>
              <span>{usedPokemon.length} 只　{currentUsedPage + 1}/{usedPageCount}</span>
            </header>
            <div className="result-pokemon-body">
              <div className="result-used-browser">
                <div className="result-used-list">
                {usedPokemon.length ? Array.from({length: usedPageSize}, (_value, index) => pagedUsedPokemon[index] || null).map((entry, index) => {
                  if (!entry) return <span className="result-used-empty-slot" key={`empty-used-${index}`} />;
                  const key = resultPokemonKey(entry.pokemon);
                  return (
                    <button className={selectedPokemon && resultPokemonKey(selectedPokemon.pokemon) === key ? "selected" : ""} onClick={() => setSelectedPokemonKey(key)} key={key}>
                      <PokemonSprite pokemon={entry.pokemon} alt={displayName(entry.pokemon)} />
                      <span>{displayName(entry.pokemon)}</span>
                    </button>
                  );
                }) : <p>暂无队伍记录。</p>}
                </div>
                <div className="result-used-pager">
                  <button disabled={currentUsedPage <= 0} onClick={() => setUsedPage(page => Math.max(0, page - 1))}>上一页</button>
                  <span>{currentUsedPage + 1}/{usedPageCount}</span>
                  <button disabled={currentUsedPage >= usedPageCount - 1} onClick={() => setUsedPage(page => Math.min(usedPageCount - 1, page + 1))}>下一页</button>
                </div>
              </div>
              <PokemonResultDetail entry={selectedPokemon} />
            </div>
          </section>
        </main>
        <aside className="result-progress-panel">
          <header>
            <strong>挑战进度</strong>
            <span>{selectedProgress ? `第 ${selectedProgress.battle_no} 场` : "--"}</span>
          </header>
          <div className="result-progress-track">
            {progressRows.map(row => (
              <button className={`${row.outcome || "pending"} ${row.battle_no === selectedProgressNo ? "selected" : ""}`} onClick={() => setSelectedProgressNo(row.battle_no)} key={row.battle_no}>
                <i>{row.battle_no}</i>
                <span>{row.label}</span>
              </button>
            ))}
          </div>
          <ProgressDetail row={selectedProgress} />
        </aside>
      </section>
    </div>
  );
}

function ResultRows({title, rows, tone}: {title: string; rows: ResultSummaryRow[]; tone: "coin" | "bp"}) {
  const total = useMemo(() => rows.map(row => row.value).join(" / "), [rows]);
  return (
    <section className={`result-section result-rows ${tone}`}>
      <header>
        <strong>{title}</strong>
        <span>{rows.length ? total : "无变动"}</span>
      </header>
      <div>
        {rows.length ? rows.map((row, index) => (
          <article key={`${title}-${row.label}-${index}`}>
            <span>{row.label}</span>
            <b>{row.value}</b>
            {row.detail ? <small>{row.detail}</small> : null}
          </article>
        )) : <p>本项没有结算变动。</p>}
      </div>
    </section>
  );
}

function PokemonResultDetail({entry}: {entry: ResultPokemonSummary | null}) {
  if (!entry) {
    return <article className="result-pokemon-detail empty">暂无宝可梦统计。</article>;
  }
  const stats = [
    ["K", entry.kills],
    ["D", entry.deaths],
    ["A", entry.assists],
    ["输出", entry.damage_dealt],
    ["承伤", entry.damage_taken],
  ];
  return (
    <article className="result-pokemon-detail">
      <PokemonSprite pokemon={entry.pokemon} alt={displayName(entry.pokemon)} />
      <div>
        <strong>{displayName(entry.pokemon)}</strong>
        <span>Lv{entry.pokemon.level}　{entry.pokemon.item_zh || "无道具"}</span>
      </div>
      <dl>
        {stats.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
    </article>
  );
}

function ProgressDetail({row}: {row: ResultProgressRow | null}) {
  if (!row) return <article className="result-progress-detail">暂无进度记录。</article>;
  const visible = Boolean(row.trainer && row.trainer_visible);
  const image = visible ? trainerImageUrl(row.trainer, "front") || trainerImageUrl(row.trainer, "frontGif") : "";
  return (
    <article className={`result-progress-detail ${visible ? "" : "unknown"}`}>
      {image ? <img src={image} alt={trainerDisplayName(row.trainer)} /> : <i>?</i>}
      <div>
        <strong>{visible && row.trainer ? trainerDisplayName(row.trainer) : "未知训练家"}</strong>
        <span>{row.label}</span>
        <small>{progressOutcomeText(row.outcome)}</small>
      </div>
    </article>
  );
}

function fallbackUsedPokemon(summary: ResultSummaryState | null, battle: BattleState | null): ResultPokemonSummary[] {
  const team = summary?.player_team?.length ? summary.player_team : battle?.player_display || [];
  return team.map(pokemon => ({pokemon, kills: 0, deaths: 0, assists: 0, damage_dealt: 0, damage_taken: 0}));
}

function fallbackProgress(summary: ResultSummaryState | null, battle: BattleState | null, outcome: ResultSummaryState["outcome"]): ResultProgressRow[] {
  const wins = Number(summary?.rows?.find(row => row.label === "连胜")?.value || 0);
  return Array.from({length: 7}, (_value, index) => {
    const battleNo = index + 1;
    return {
      battle_no: battleNo,
      label: battleNo === 7 ? "最终战" : battleNo === 3 ? "馆主战" : "挑战",
      outcome: battleNo <= wins ? "win" : battleNo === wins + 1 ? outcome : "pending",
      trainer: battleNo === wins + 1 ? summary?.enemy_trainer || battle?.enemy_trainer : undefined,
      trainer_visible: battleNo <= wins + 1,
    };
  });
}

function resultPokemonKey(pokemon: RentalPokemon | undefined): string {
  if (!pokemon) return "";
  return pokemon.run_member_id || pokemon.showdown_id || pokemon.species_id || pokemon.name;
}

function outcomeLabel(outcome: ResultSummaryState["outcome"]): string {
  if (outcome === "win") return "WIN";
  if (outcome === "loss") return "LOST";
  return "ABORT";
}

function progressOutcomeText(outcome: ResultProgressRow["outcome"]): string {
  if (outcome === "win") return "已胜利";
  if (outcome === "loss") return "挑战失败";
  if (outcome === "abort") return "已中断";
  return "未挑战";
}

function playerWonBattleResult(battle: BattleState): boolean {
  const winner = String(battle.winner || "").toLowerCase();
  if (!winner || winner === "tie") return false;
  return !["enemy", "opponent", "对手"].includes(winner);
}
