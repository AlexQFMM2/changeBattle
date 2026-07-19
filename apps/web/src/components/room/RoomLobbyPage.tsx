import {useMemo, useState} from "react";
import type {BattlePreferenceV4, ChangeBattleV2Api, FormalCompetitionModeV4, FormalGameModeV4, FormalRoomMatchV1, FormalRoomMemberV1, FormalRoomV1, UserProfileV2} from "@changebattle-v2/api";
import {BATTLE_GENERATION_OPTIONS_V4, BATTLE_RULE_PRESET_OPTIONS_V4, normalizeBattlePreferenceV4} from "@changebattle-v2/api";
import {assetUrl} from "../../lib/assetUrl";
import {ImageWithFallback} from "../shared/ImageWithFallback";
import {GameDrawer} from "../shared/GameDrawer";
import "./RoomLobbyPage.css";

export type RoomLobbyPageProps = {
  api: ChangeBattleV2Api;
  profile: UserProfileV2;
  room: FormalRoomV1;
  roomToken: string;
  busyMessage?: string | null;
  error?: string | null;
  onCreateMatch: (input: {mode: FormalGameModeV4; battlePreferenceSnapshot: BattlePreferenceV4}) => Promise<void>;
  onReadyChange: (ready: boolean, matchId: string) => Promise<void>;
  onStartMatch: (matchId: string) => Promise<void>;
  onLeave: () => void;
};

type DrawerKind = "mode" | "competition" | "generations" | "rule-set" | "legendary" | "battle-bag" | "match-info" | null;

const MODE_OPTIONS: Array<{mode: FormalGameModeV4; label: string; description: string}> = [
  {mode: "singles", label: "单打-AI", description: "标准单人流程，先跑通正式闭环。"},
  {mode: "doubles", label: "双打-AI", description: "双打正式流程，沿用当前正式能力。"},
  {mode: "coop", label: "合作-AI", description: "实验可用：玩家与 AI 队友合作挑战 AI 队伍。"},
];

export function RoomLobbyPage({api: _api, profile, room, busyMessage, error, onCreateMatch, onReadyChange, onStartMatch, onLeave}: RoomLobbyPageProps) {
  const [panel, setPanel] = useState<"list" | "create" | "detail">(() => room.matches?.length ? "detail" : "list");
  const [drawer, setDrawer] = useState<DrawerKind>(null);
  const [draftMode, setDraftMode] = useState<FormalGameModeV4>("singles");
  const [draftPreference, setDraftPreference] = useState<BattlePreferenceV4>(() => normalizeBattlePreferenceV4());
  const activeMatch = useMemo(() => room.matches?.find(match => match.matchId === room.activeMatchId) || room.matches?.[0] || null, [room.activeMatchId, room.matches]);
  const selfMember = useMemo(() => room.members?.find(member => member.memberId === room.selfMemberId) || room.members?.[0] || null, [room.members, room.selfMemberId]);
  const selfReady = Boolean(selfMember?.ready);
  const allReady = Boolean(activeMatch && (room.members || []).filter(member => activeMatch.participantMemberIds.includes(member.memberId)).every(member => member.ready));
  const modeLabel = modeLabelFor(draftMode);
  const preferenceCards = useMemo(() => [
    {
      key: "competition" as const,
      label: "赛程长度",
      value: competitionModeLabel(draftPreference.competitionMode),
      caption: competitionModeCaption(draftPreference.competitionMode),
      mark: "RUN",
    },
    {
      key: "generations" as const,
      label: "地区限制",
      value: generationSummary(draftPreference),
      caption: generationCaption(draftPreference),
      mark: "MAP",
    },
    {
      key: "rule-set" as const,
      label: "战斗环境",
      value: ruleSetLabel(draftPreference),
      caption: ruleSetShortCaption(draftPreference.ruleSet),
      mark: "SYS",
    },
    {
      key: "legendary" as const,
      label: "神战",
      value: draftPreference.legendaryBattle ? "开启" : "关闭",
      caption: draftPreference.legendaryBattle ? "神兽入池" : "普通池",
      mark: "EX",
    },
    {
      key: "battle-bag" as const,
      label: "战斗背包",
      value: draftPreference.battleBagEnabled ? "开启" : "关闭",
      caption: draftPreference.battleBagEnabled ? "可用道具" : "禁用道具",
      mark: "BAG",
    },
  ], [draftPreference]);

  async function createMatch() {
    await onCreateMatch({mode: draftMode, battlePreferenceSnapshot: draftPreference});
    setPanel("detail");
  }

  async function toggleReady() {
    if (!activeMatch) return;
    await onReadyChange(!selfReady, activeMatch.matchId);
  }

  async function startMatch() {
    if (!activeMatch) return;
    await onStartMatch(activeMatch.matchId);
  }

  return (
    <main className="room-lobby-page">
      <img className="room-lobby-bg" src={assetUrl("shop/rest-store/back-lounge-menu-v4-640.png")} alt="" draggable={false} />
      <button className="room-lobby-exit" type="button" onClick={onLeave}>退出</button>
      {activeMatch ? <button className="room-lobby-info-button" type="button" onClick={() => setDrawer("match-info")}>对局信息</button> : null}
      <RoomInfoBoard room={room} selfMember={selfMember} />
      <RoomMemberListBoard members={room.members || []} selfMemberId={room.selfMemberId || ""} />
      <section className="room-lobby-main-board" aria-label="对局面板">
        {panel === "list" ? (
          <MatchListPanel
            matches={room.matches || []}
            onCreate={() => setPanel("create")}
            onOpen={() => setPanel("detail")}
          />
        ) : null}
        {panel === "create" ? (
          <section className="room-lobby-create-panel">
            <header className="room-lobby-create-header">
              <div>
                <span>MATCH SETUP</span>
                <strong>创建对局</strong>
              </div>
              <button type="button" onClick={() => setPanel(activeMatch ? "detail" : "list")}>返回上一步</button>
            </header>
            <div className="room-lobby-create-layout">
              <button type="button" className="room-lobby-match-type-card" onClick={() => setDrawer("mode")}>
                <small>对局类型</small>
                <strong>{modeLabel}</strong>
                <em>{modeCaption(draftMode)}</em>
                <span>房间 {room.roomId.slice(0, 6)}</span>
                <i>点击切换赛制</i>
              </button>
              <div className="room-lobby-rule-cluster">
                {preferenceCards.map(card => (
                  <button type="button" className="room-lobby-rule-token" key={card.key} onClick={() => setDrawer(card.key)}>
                    <b>{card.mark}</b>
                    <span>{card.label}</span>
                    <strong>{card.value}</strong>
                    <small>{card.caption}</small>
                  </button>
                ))}
              </div>
              <footer className="room-lobby-create-actions">
                <span>{preferenceSummary(draftPreference)}</span>
                <button type="button" className="room-lobby-primary" disabled={Boolean(busyMessage)} onClick={() => void createMatch()}>
                  创建对局
                </button>
              </footer>
            </div>
          </section>
        ) : null}
        {panel === "detail" && activeMatch ? (
          <MatchDetailPanel
            match={activeMatch}
            members={room.members || []}
            selfReady={selfReady}
            allReady={allReady}
            busy={Boolean(busyMessage)}
            onBack={() => setPanel("list")}
            onReady={() => void toggleReady()}
            onStart={() => void startMatch()}
          />
        ) : null}
      </section>
      {busyMessage ? <div className="room-lobby-busy" role="status">{busyMessage}</div> : null}
      {error ? <div className="room-lobby-error" role="alert">{error}</div> : null}
      <GameDrawer open={drawer === "mode"} placement="right" title="选择赛制" width={190} onClose={() => setDrawer(null)}>
        <div className="room-lobby-drawer-list">
          {MODE_OPTIONS.map(option => (
            <button className={draftMode === option.mode ? "selected" : ""} type="button" key={option.mode} onClick={() => { setDraftMode(option.mode); setDrawer(null); }}>
              <strong>{option.label}</strong>
              <span>{option.description}</span>
            </button>
          ))}
        </div>
      </GameDrawer>
      <PreferenceDrawer
        kind={drawer}
        preference={draftPreference}
        onChange={setDraftPreference}
        onClose={() => setDrawer(null)}
      />
      <GameDrawer open={drawer === "match-info"} placement="right" title="对局信息" width={210} className="room-match-info-panel" onClose={() => setDrawer(null)}>
        {activeMatch ? <MatchInfoDrawer match={activeMatch} members={room.members || []} /> : <p>暂无对局。</p>}
      </GameDrawer>
    </main>
  );
}

function PreferenceDrawer({kind, preference, onChange, onClose}: {
  kind: DrawerKind;
  preference: BattlePreferenceV4;
  onChange: (preference: BattlePreferenceV4) => void;
  onClose: () => void;
}) {
  const open = kind === "competition" || kind === "generations" || kind === "rule-set" || kind === "legendary" || kind === "battle-bag";
  const title = kind === "competition" ? "赛程长度"
    : kind === "generations" ? "地区限制"
    : kind === "rule-set" ? "战斗环境"
    : kind === "legendary" ? "是否神战"
    : "战斗背包";

  function apply(next: Partial<BattlePreferenceV4>) {
    onChange(normalizeBattlePreferenceV4({...preference, ...next}));
  }

  function toggleGeneration(generation: number) {
    const selected = preference.allowedGenerations.includes(generation);
    if (selected && preference.allowedGenerations.length <= 1) return;
    const allowedGenerations = selected
      ? preference.allowedGenerations.filter(value => value !== generation)
      : [...preference.allowedGenerations, generation].sort((a, b) => a - b);
    apply({allowedGenerations});
  }

  return (
    <GameDrawer open={open} placement="right" title={title} width={240} onClose={onClose}>
      {kind === "competition" ? (
        <CompetitionChoiceDrawer
          value={preference.competitionMode}
          onSelect={value => { apply({competitionMode: value}); onClose(); }}
        />
      ) : null}
      {kind === "generations" ? (
        <div className="room-lobby-generation-grid">
          {BATTLE_GENERATION_OPTIONS_V4.map(option => {
            const selected = preference.allowedGenerations.includes(option.generation);
            return (
              <button className={selected ? "selected" : ""} type="button" key={option.generation} onClick={() => toggleGeneration(option.generation)}>
                <strong>第 {option.generation} 世代</strong>
                <span>{option.region}</span>
              </button>
            );
          })}
        </div>
      ) : null}
      {kind === "rule-set" ? (
        <div className="room-lobby-drawer-list">
          {BATTLE_RULE_PRESET_OPTIONS_V4.map(option => (
            <button className={preference.ruleSet === option.id ? "selected" : ""} type="button" key={option.id} onClick={() => { apply({ruleSet: option.id}); onClose(); }}>
              <strong>{option.name}</strong>
              <span>{ruleSetDescription(option.id)}</span>
            </button>
          ))}
        </div>
      ) : null}
      {kind === "legendary" ? (
        <BooleanChoiceDrawer
          value={preference.legendaryBattle}
          trueLabel="开启神战"
          trueText="允许神兽与幻兽进入正式生成池。"
          falseLabel="关闭神战"
          falseText="正式生成池排除神兽与幻兽。"
          onSelect={value => { apply({legendaryBattle: value}); onClose(); }}
        />
      ) : null}
      {kind === "battle-bag" ? (
        <BooleanChoiceDrawer
          value={preference.battleBagEnabled}
          trueLabel="开启战斗背包"
          trueText="战斗页允许打开背包并提交训练师道具。"
          falseLabel="关闭战斗背包"
          falseText="战斗页隐藏背包入口。"
          onSelect={value => { apply({battleBagEnabled: value}); onClose(); }}
        />
      ) : null}
    </GameDrawer>
  );
}

function CompetitionChoiceDrawer({value, onSelect}: {value: FormalCompetitionModeV4; onSelect: (value: FormalCompetitionModeV4) => void}) {
  const options: Array<{value: FormalCompetitionModeV4; label: string; text: string; disabled?: boolean}> = [
    {value: "standard", label: "标准赛程", text: "完整正式流程，按当前赛制生成多场对局。"},
    {value: "single", label: "单局验收", text: "只生成 1 场，适合快速测试休整、战斗和结算闭环。"},
    {value: "leagueLoop", label: "循环联赛", text: "预留赛制，后续开放。", disabled: true},
  ];
  return (
    <div className="room-lobby-drawer-list">
      {options.map(option => (
        <button
          className={value === option.value ? "selected" : ""}
          type="button"
          key={option.value}
          disabled={option.disabled}
          onClick={() => onSelect(option.value)}
        >
          <strong>{option.label}</strong>
          <span>{option.text}</span>
        </button>
      ))}
    </div>
  );
}

function BooleanChoiceDrawer({value, trueLabel, trueText, falseLabel, falseText, onSelect}: {
  value: boolean;
  trueLabel: string;
  trueText: string;
  falseLabel: string;
  falseText: string;
  onSelect: (value: boolean) => void;
}) {
  return (
    <div className="room-lobby-drawer-list">
      <button className={value ? "selected" : ""} type="button" onClick={() => onSelect(true)}>
        <strong>{trueLabel}</strong>
        <span>{trueText}</span>
      </button>
      <button className={!value ? "selected" : ""} type="button" onClick={() => onSelect(false)}>
        <strong>{falseLabel}</strong>
        <span>{falseText}</span>
      </button>
    </div>
  );
}

function RoomInfoBoard({room, selfMember}: {room: FormalRoomV1; selfMember: FormalRoomMemberV1 | null}) {
  return (
    <section className="room-info-board" aria-label="房间信息">
      <small>ROOM</small>
      <strong>{room.roomId.slice(0, 8)}</strong>
      <span>游客 {selfMember?.roomCustomId || room.roomCustomId || "----"}</span>
      <span>{room.connectionState === "online" ? "在线" : "连接中"}</span>
      <em>{selfMember?.role === "host" ? "房主" : "成员"}</em>
    </section>
  );
}

function RoomMemberListBoard({members, selfMemberId}: {members: FormalRoomMemberV1[]; selfMemberId: string}) {
  const slots = [...members.slice(0, 4), ...Array.from({length: Math.max(0, 4 - members.length)}, (_, index) => ({memberId: `empty-${index}`} as FormalRoomMemberV1))].slice(0, 4);
  return (
    <section className="room-member-board" aria-label="成员列表">
      <strong>成员列表</strong>
      {slots.map(member => member.name ? (
        <div className="room-member-row" key={member.memberId}>
          <span>{member.name}{member.memberId === selfMemberId ? "（我）" : ""}</span>
          <i>{member.connectionState === "online" ? "在线" : "离线"}</i>
          <ReadyDot ready={member.ready} />
        </div>
      ) : (
        <div className="room-member-row empty" key={member.memberId}>
          <span>空位</span>
          <i>等待</i>
        </div>
      ))}
    </section>
  );
}

function MatchListPanel({matches, onCreate, onOpen}: {matches: FormalRoomMatchV1[]; onCreate: () => void; onOpen: () => void}) {
  const canCreate = !matches.some(match => match.status !== "ended");
  if (!matches.length) {
    return (
      <div className="room-lobby-empty">
        <div className="room-lobby-empty-poster">
          <span>ROOM MATCH</span>
          <strong>暂无对局</strong>
          <i>创建对局后即可准备</i>
        </div>
        <button type="button" onClick={onCreate}>新建对局</button>
      </div>
    );
  }
  return (
    <section className="room-match-list-panel">
      <header>
        <span>ROOM MATCH</span>
        <strong>对局列表</strong>
      </header>
      <div className="room-match-list">
        {matches.map(match => (
          <button type="button" className="room-match-list-card" key={match.matchId} onClick={onOpen}>
            <span>{modeLabelFor(match.mode)}</span>
            <strong>{match.phaseLabel}</strong>
            <i>{preferenceSummary(match.config.battlePreferenceSnapshot as BattlePreferenceV4)}</i>
          </button>
        ))}
      </div>
      <footer>
        <button type="button" disabled={!canCreate} onClick={onCreate}>{canCreate ? "新建对局" : "当前已有对局"}</button>
      </footer>
    </section>
  );
}

function MatchDetailPanel({match, members, selfReady, allReady, busy, onBack, onReady, onStart}: {match: FormalRoomMatchV1; members: FormalRoomMemberV1[]; selfReady: boolean; allReady: boolean; busy: boolean; onBack: () => void; onReady: () => void; onStart: () => void}) {
  const participantMembers = match.participantMemberIds.map(id => members.find(member => member.memberId === id)).filter(Boolean) as FormalRoomMemberV1[];
  const slots = [...participantMembers, ...Array.from({length: Math.max(0, 4 - participantMembers.length)}, (_, index) => null)].slice(0, 4);
  const ended = match.status === "ended";
  return (
    <section className="room-match-detail">
      <header className="room-match-detail-header">
        <div>
          <span>ROOM MATCH</span>
          <strong>{modeLabelFor(match.mode)}</strong>
        </div>
        <div className="room-match-detail-head-actions">
          <i>{match.phaseLabel}</i>
          <button type="button" onClick={onBack}>返回</button>
        </div>
      </header>
      <div className="room-match-cards">
        {slots.map((member, index) => (
          <MatchParticipantCard member={member} key={member?.memberId || `empty-${index}`} />
        ))}
      </div>
      <div className="room-match-actions">
        {ended ? (
          <p className="room-match-ended-note">本场对局已结束，结果快照已保留在房间内。</p>
        ) : match.status !== "not_started" ? (
          <button type="button" disabled={busy} onClick={onStart}>继续游戏</button>
        ) : (
          <>
            <button type="button" disabled={busy || match.status !== "not_started"} onClick={onReady}>{selfReady ? "取消准备" : "准备"}</button>
            <button type="button" disabled={busy || !allReady || match.status !== "not_started"} onClick={onStart}>开始游戏</button>
          </>
        )}
      </div>
    </section>
  );
}

function MatchParticipantCard({member}: {member: FormalRoomMemberV1 | null}) {
  const avatarSrc = member ? member.avatarAsset || member.frontAsset || "npc/avatars/red-asset-a73f3e71.webp" : "";
  return (
    <article className={`room-participant-card ${member ? "" : "empty"}`}>
      {member ? (
        <>
          <div className="room-participant-avatar">
            <ImageWithFallback src={avatarSrc} alt={member.name} fallback={member.name.slice(0, 1) || "?"} />
          </div>
          <ReadyDot ready={member.ready} />
          <strong>{member.name}</strong>
          <span>{member.roomCustomId}</span>
          <i>{member.connectionState === "online" ? "网络在线" : "网络离线"}</i>
        </>
      ) : (
        <>
          <div className="room-participant-avatar muted">?</div>
          <strong>空位</strong>
          <span>等待成员</span>
        </>
      )}
    </article>
  );
}

function MatchInfoDrawer({match, members}: {match: FormalRoomMatchV1; members: FormalRoomMemberV1[]}) {
  return (
    <div className="room-match-info-drawer">
      <dl>
        <div><dt>Match ID</dt><dd>{match.matchId.slice(0, 10)}</dd></div>
        <div><dt>赛制</dt><dd>{modeLabelFor(match.mode)}</dd></div>
        <div><dt>状态</dt><dd>{match.phaseLabel}</dd></div>
        <div><dt>偏好</dt><dd>{preferenceSummary(match.config.battlePreferenceSnapshot as BattlePreferenceV4)}</dd></div>
        <div><dt>成员</dt><dd>{members.filter(member => match.participantMemberIds.includes(member.memberId)).map(member => member.name).join(" / ") || "无"}</dd></div>
      </dl>
    </div>
  );
}

function ReadyDot({ready}: {ready: boolean}) {
  return <span className={`room-ready-dot ${ready ? "ready" : "pending"}`}>{ready ? "✓" : "…"}</span>;
}

function modeLabelFor(mode: FormalGameModeV4): string {
  if (mode === "doubles") return "双打-AI";
  if (mode === "coop") return "合作-AI";
  return "单打-AI";
}

function modeCaption(mode: FormalGameModeV4): string {
  if (mode === "doubles") return "双人队列";
  if (mode === "coop") return "AI 队友";
  return "单人挑战";
}

function preferenceSummary(preference: BattlePreferenceV4 | Record<string, unknown> | null | undefined): string {
  const ruleSet = typeof preference?.ruleSet === "string" ? preference.ruleSet : "standard";
  const rule = BATTLE_RULE_PRESET_OPTIONS_V4.find(option => option.id === ruleSet) || BATTLE_RULE_PRESET_OPTIONS_V4[0]!;
  const bag = (preference as BattlePreferenceV4 | undefined)?.battleBagEnabled === false ? "背包关" : "背包开";
  const legendary = (preference as BattlePreferenceV4 | undefined)?.legendaryBattle ? "神战开" : "神战关";
  const competition = competitionModeLabel((preference as BattlePreferenceV4 | undefined)?.competitionMode || "standard");
  return `${competition} / ${rule.name} / ${legendary} / ${bag}`;
}

function competitionModeLabel(mode: FormalCompetitionModeV4): string {
  if (mode === "single") return "单局验收";
  if (mode === "leagueLoop") return "循环联赛";
  return "标准赛程";
}

function competitionModeCaption(mode: FormalCompetitionModeV4): string {
  if (mode === "single") return "1 场后结算";
  if (mode === "leagueLoop") return "后续开放";
  return "完整流程";
}

function generationSummary(preference: BattlePreferenceV4): string {
  if (preference.allowedGenerations.length >= 9) return "全地区";
  const generations = [...preference.allowedGenerations].sort((a, b) => a - b);
  const contiguous = generations.every((value, index) => index === 0 || value === generations[index - 1]! + 1);
  if (contiguous && generations.length > 2) return `G${generations[0]}-G${generations[generations.length - 1]}`;
  return generations.map(value => `G${value}`).join(" / ");
}

function generationCaption(preference: BattlePreferenceV4): string {
  const count = preference.allowedGenerations.length;
  if (count >= 9) return "全世代";
  return `${count} 个地区`;
}

function ruleSetLabel(preference: BattlePreferenceV4): string {
  const rule = BATTLE_RULE_PRESET_OPTIONS_V4.find(option => option.id === preference.ruleSet) || BATTLE_RULE_PRESET_OPTIONS_V4[0]!;
  return rule.name;
}

function ruleSetDescription(ruleSet: string): string {
  if (ruleSet === "gen7") return "开放 Mega 进化与 Z 招式。";
  if (ruleSet === "gen8") return "开放极巨化与超极巨化。";
  if (ruleSet === "gen9") return "开放太晶化。";
  return "无特殊系统，使用基础规则。";
}

function ruleSetShortCaption(ruleSet: string): string {
  if (ruleSet === "gen7") return "Mega/Z";
  if (ruleSet === "gen8") return "极巨";
  if (ruleSet === "gen9") return "太晶";
  return "基础规则";
}
