import {useEffect, useMemo, useState} from "react";
import type {BattleRecordEntry, BattleState, BattleTurnRecord, ResultSummaryState} from "@changebattle/shared";
import {BattleRoundList} from "./BattleRoundList";
import {ResultHeader} from "./ResultHeader";
import {ResultProgressList} from "./ResultProgressList";
import {ResultSettlementGrid} from "./ResultSettlementGrid";
import {ResultTeamSummary} from "./ResultTeamSummary";
import {fallbackProgress, fallbackUsedPokemon, playerWonBattleResult} from "./resultUtils";
import "./ResultPage.css";

export type ResultPageProps = {
  message: string;
  battle: BattleState | null;
  summary: ResultSummaryState | null;
  onBack: () => void;
  backLabel?: string;
  previewRecords?: BattleRecordEntry[];
};

export function ResultPage({message, battle, summary, onBack, backLabel = "返回主界面", previewRecords}: ResultPageProps) {
  const playerWon = summary ? summary.outcome === "win" : battle ? playerWonBattleResult(battle) : false;
  const outcome = summary?.outcome || (playerWon ? "win" : "loss");
  const rows = summary?.rows?.length ? summary.rows : [{label: "结算说明", value: message}];
  const coinRows = (summary?.coin_rows?.length ? summary.coin_rows : rows.filter(row => row.value.includes("金币"))).filter(row => !row.value.includes("BP") && row.label !== "金币折算 BP");
  const usedPokemon = summary?.used_pokemon?.length ? summary.used_pokemon : fallbackUsedPokemon(summary, battle);
  const progressRows = summary?.progress?.length ? summary.progress : fallbackProgress(summary, battle, outcome);
  const defaultProgressNo = progressRows.find(row => row.battle_no === 7)?.battle_no || progressRows.at(-1)?.battle_no || 1;
  const [selectedProgressNo, setSelectedProgressNo] = useState(defaultProgressNo);
  const [battleRecords, setBattleRecords] = useState<BattleRecordEntry[]>(previewRecords || []);
  const [recordsLoaded, setRecordsLoaded] = useState(Boolean(previewRecords));
  const [roundPanelOpen, setRoundPanelOpen] = useState(false);
  const [selectedTurnId, setSelectedTurnId] = useState<string | null>(null);
  const selectedProgress = progressRows.find(row => row.battle_no === selectedProgressNo) || progressRows.find(row => row.battle_no === defaultProgressNo) || progressRows[0] || null;
  const selectedBattleRecord = useMemo(() => {
    if (!selectedProgress) return null;
    const byId = selectedProgress.battle_record_id ? battleRecords.find(record => record.id === selectedProgress.battle_record_id) : null;
    if (byId) return byId;
    const seed = Number(summary?.run_seed || 0);
    return battleRecords
      .filter(record => Number(record.battle_no) === Number(selectedProgress.battle_no))
      .filter(record => !seed || Number(record.run_seed || 0) === seed)
      .sort((left, right) => Date.parse(right.created_at || "") - Date.parse(left.created_at || ""))[0] || null;
  }, [battleRecords, selectedProgress, summary?.run_seed]);
  const selectedTurn = selectedBattleRecord?.turn_records?.find(record => record.id === selectedTurnId)
    || selectedBattleRecord?.turn_records?.at(-1)
    || null;

  useEffect(() => {
    if (!progressRows.some(row => row.battle_no === selectedProgressNo)) setSelectedProgressNo(defaultProgressNo);
  }, [defaultProgressNo, progressRows, selectedProgressNo]);

  useEffect(() => {
    if (previewRecords) {
      setBattleRecords(previewRecords);
      setRecordsLoaded(true);
      return;
    }
    let cancelled = false;
    void window.changeBattle?.battleRecords().then(table => {
      if (cancelled) return;
      setBattleRecords(table?.records || []);
      setRecordsLoaded(true);
    }).catch(() => {
      if (cancelled) return;
      setBattleRecords([]);
      setRecordsLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, [previewRecords]);

  useEffect(() => {
    setRoundPanelOpen(false);
    setSelectedTurnId(null);
  }, [selectedProgressNo]);

  return (
    <div className={`result-screen result-${outcome}`}>
      <section className="result-panel">
        <main className="result-left">
          <ResultHeader
            outcome={outcome}
            headline={summary?.headline || (playerWon ? "胜利结算" : "结算")}
            subtitle={summary?.subtitle || message || "本局挑战已结束。"}
            onBack={onBack}
            backLabel={backLabel}
          />
          <ResultSettlementGrid rows={coinRows} />
          <ResultTeamSummary usedPokemon={usedPokemon} />
        </main>
        <ResultProgressList
          progressRows={progressRows}
          selectedBattleNo={selectedProgressNo}
          selectedProgress={selectedProgress}
          selectedBattleRecord={selectedBattleRecord}
          recordsLoaded={recordsLoaded}
          roundPanelOpen={roundPanelOpen && Boolean(selectedBattleRecord?.turn_records?.length)}
          onSelectProgress={setSelectedProgressNo}
          onOpenRounds={() => setRoundPanelOpen(true)}
        >
          {selectedBattleRecord?.turn_records?.length ? (
            <BattleRoundList
              record={selectedBattleRecord}
              selectedTurn={selectedTurn}
              onSelectTurn={(turn: BattleTurnRecord) => setSelectedTurnId(turn.id)}
              onBack={() => setRoundPanelOpen(false)}
            />
          ) : null}
        </ResultProgressList>
      </section>
    </div>
  );
}
