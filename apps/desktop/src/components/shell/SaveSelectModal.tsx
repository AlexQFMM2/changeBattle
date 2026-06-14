import {useEffect, useRef, useState} from "react";
import type {LocalSave, TrainerCatalogState, TrainerNpcView} from "@changebattle/shared";
import {AnimatePresence, motion} from "motion/react";
import {trainerImageUrl} from "../../lib/ui";
import {PokopiaModal, pokopiaItemVariants} from "../motion/PokopiaModal";
import {TrainerAvatar} from "./TrainerAvatar";
import "./SaveSelectPanel.css";

type SaveSlot = {
  index: number;
  save: LocalSave | null;
};

type DeletePhase = "confirm" | "deleting" | "done";
type CreateStep = "slots" | "name" | "look" | "avatar" | "done";

const DELETE_MIN_DURATION = 760;
const DELETE_DONE_DURATION = 920;

export function SaveSelectPanel({active, save, catalog, defaultAvatarAsset, onBack, onLoad, onNew, onCreate, onDelete}: {active: boolean; save: LocalSave | null; catalog: TrainerCatalogState; defaultAvatarAsset?: string; onBack: () => void; onLoad: () => void; onNew: () => void; onCreate: (name: string, playerId: string, avatarAsset: string) => Promise<LocalSave | null>; onDelete: () => void | Promise<void>}) {
  const [deleteTarget, setDeleteTarget] = useState<LocalSave | null>(null);
  const [deletePhase, setDeletePhase] = useState<DeletePhase>("confirm");
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [createStep, setCreateStep] = useState<CreateStep>("slots");
  const [newName, setNewName] = useState("训练师");
  const [newPlayerId, setNewPlayerId] = useState("");
  const [newAvatarAsset, setNewAvatarAsset] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const createTimerRef = useRef<number | null>(null);
  const closeTimerRef = useRef<number | null>(null);
  const slots: SaveSlot[] = [0, 1, 2].map(index => ({index, save: index === 0 ? save : null}));
  const selectedPlayer = catalog.players.find(entry => entry.id === newPlayerId) || catalog.players[0];
  const selectedAvatar = newAvatarAsset || selectedPlayer?.avatar_asset || catalog.avatars[0]?.avatar_asset || "";

  useEffect(() => {
    return () => {
      clearCloseTimer();
      clearCreateTimer();
    };
  }, []);

  useEffect(() => {
    setNewPlayerId(current => current || catalog.players[0]?.id || "");
    setNewAvatarAsset(current => current || catalog.players[0]?.avatar_asset || catalog.avatars[0]?.avatar_asset || "");
  }, [catalog.players, catalog.avatars]);

  function clearCloseTimer() {
    if (closeTimerRef.current === null) return;
    window.clearTimeout(closeTimerRef.current);
    closeTimerRef.current = null;
  }

  function clearCreateTimer() {
    if (createTimerRef.current === null) return;
    window.clearTimeout(createTimerRef.current);
    createTimerRef.current = null;
  }

  function openDelete(saveData: LocalSave) {
    clearCloseTimer();
    setDeletePhase("confirm");
    setDeleteError(null);
    setDeleteTarget(saveData);
  }

  function startCreate() {
    onNew();
    clearCreateTimer();
    setCreateError(null);
    setCreating(false);
    setNewName(save?.trainer.name && save.trainer.name !== "训练师" ? `${save.trainer.name}2` : "训练师");
    setNewPlayerId(current => current || catalog.players[0]?.id || "");
    setNewAvatarAsset(current => current || catalog.players[0]?.avatar_asset || catalog.avatars[0]?.avatar_asset || "");
    setCreateStep("name");
  }

  function backFromCreate() {
    clearCreateTimer();
    setCreateError(null);
    setCreating(false);
    if (createStep === "avatar") {
      setCreateStep("look");
      return;
    }
    if (createStep === "look") {
      setCreateStep("name");
      return;
    }
    setCreateStep("slots");
  }

  function choosePlayer(player: TrainerNpcView) {
    setNewPlayerId(player.id);
    setNewAvatarAsset(player.avatar_asset || selectedAvatar);
  }

  async function createSave() {
    if (creating || !selectedPlayer) return;
    setCreating(true);
    setCreateError(null);

    try {
      await onCreate(newName, selectedPlayer.id, selectedAvatar);
      setCreateStep("done");
      clearCreateTimer();
      createTimerRef.current = window.setTimeout(() => {
        setCreating(false);
        setCreateStep("slots");
      }, 980);
    } catch (error) {
      setCreating(false);
      setCreateError(error instanceof Error ? error.message : "创建失败，请重试。");
    }
  }

  function pageBack() {
    if (createStep !== "slots") {
      backFromCreate();
      return;
    }
    onBack();
  }

  async function confirmDelete(requestClose: (force?: boolean) => void) {
    if (!deleteTarget || deletePhase !== "confirm") return;
    setDeleteError(null);
    setDeletePhase("deleting");

    const minDuration = new Promise<void>(resolve => {
      window.setTimeout(resolve, DELETE_MIN_DURATION);
    });

    try {
      await Promise.all([Promise.resolve(onDelete()), minDuration]);
      setDeletePhase("done");
      clearCloseTimer();
      closeTimerRef.current = window.setTimeout(() => requestClose(true), DELETE_DONE_DURATION);
    } catch (error) {
      setDeletePhase("confirm");
      setDeleteError(error instanceof Error ? error.message : "删除失败，请重试。");
    }
  }

  return (
    <section className="save-select-page" aria-labelledby="save-select-title">
      <header className="save-select-page-header">
        <button className="save-back-button" onClick={pageBack}>返回</button>
        <div>
          <span>Save Data</span>
          <h2 id="save-select-title">{createStep === "slots" ? "选择存档" : createStep === "name" ? "新建训练师" : createStep === "look" ? "打扮自己" : createStep === "avatar" ? "选择头像" : "创建完成"}</h2>
        </div>
      </header>
      <AnimatePresence mode="wait" initial={false}>
        {createStep === "slots" ? (
          <motion.div className="save-card-grid" key="slots" initial={{opacity: 0, y: 22}} animate={active ? {opacity: 1, y: 0} : {opacity: 0, y: 22}} exit={{opacity: 0, y: -28}} transition={{type: "spring", stiffness: 360, damping: 31}}>
            {slots.map(slot => {
              const slotSave = slot.save;
              return (
                <motion.article
                  className={`save-card ${slotSave ? "filled" : "empty"}`}
                  key={slot.index}
                  initial={false}
                  animate={active ? {opacity: 1, y: 0} : {opacity: 0, y: 22}}
                  transition={{delay: slot.index * 0.07, type: "spring", stiffness: 420, damping: 30}}
                >
                  <button className="save-card-main" onClick={slotSave ? onLoad : startCreate}>
                    <span className="save-card-index">{String(slot.index + 1).padStart(2, "0")}</span>
                    {slotSave ? (
                      <>
                        <span className="save-card-avatar">
                          <TrainerAvatar candidates={[slotSave.trainer.avatar_asset, slotSave.trainer.front_gif_asset, slotSave.trainer.front_asset, defaultAvatarAsset]} alt={slotSave.trainer.name} fallbackText={slotSave.trainer.name.slice(0, 1)} />
                        </span>
                        <span className="save-card-info">
                          <strong>{slotSave.trainer.name}</strong>
                          <small>{slotSave.stats.battle_points} BP</small>
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="save-card-plus">+</span>
                        <span className="save-card-empty-copy">
                          <strong>空存档位</strong>
                          <small>新建训练师</small>
                        </span>
                      </>
                    )}
                  </button>
                  {slotSave ? <button className="save-card-delete" onClick={() => openDelete(slotSave)} aria-label={`删除 ${slotSave.trainer.name} 的存档`}>×</button> : null}
                </motion.article>
              );
            })}
          </motion.div>
        ) : null}
        {createStep === "name" ? (
          <motion.section className="create-save-step create-name-step" key="name" initial={{opacity: 0, y: 26}} animate={{opacity: 1, y: 0}} exit={{opacity: 0, y: -28}} transition={{type: "spring", stiffness: 360, damping: 31}}>
            <label>
              <span>你叫什么名字？</span>
              <input autoFocus maxLength={16} value={newName} onChange={event => setNewName(event.target.value)} onKeyDown={event => { if (event.key === "Enter") setCreateStep("look"); }} />
            </label>
            <button className="create-next-button" disabled={!newName.trim()} onClick={() => setCreateStep("look")}>下一步</button>
          </motion.section>
        ) : null}
        {createStep === "look" ? (
          <motion.section className="create-save-step create-look-step" key="look" initial={{opacity: 0, y: 26}} animate={{opacity: 1, y: 0}} exit={{opacity: 0, y: -28}} transition={{type: "spring", stiffness: 360, damping: 31}}>
            <div className="create-look-preview">
              {selectedPlayer ? <img src={trainerImageUrl(selectedPlayer, "frontGif")} alt={selectedPlayer.name_zh} /> : null}
              <strong>{newName.trim() || "训练师"}</strong>
              <small>{selectedPlayer?.name_zh || "选择立绘"}</small>
            </div>
            <div className="create-look-pickers">
              <div className="create-player-list" aria-label="选择立绘">
                {catalog.players.map(player => <button className={player.id === selectedPlayer?.id ? "selected" : ""} title={player.name_zh} aria-label={player.name_zh || "训练师立绘"} onClick={() => choosePlayer(player)} key={player.id}><img src={trainerImageUrl(player, player.id === selectedPlayer?.id ? "frontGif" : "front")} alt="" /></button>)}
              </div>
            </div>
            <div className="create-save-actions">
              <button onClick={backFromCreate}>上一步</button>
              <button className="primary" disabled={!selectedPlayer} onClick={() => setCreateStep("avatar")}>下一步</button>
            </div>
          </motion.section>
        ) : null}
        {createStep === "avatar" ? (
          <motion.section className="create-save-step create-avatar-step" key="avatar" initial={{opacity: 0, y: 26}} animate={{opacity: 1, y: 0}} exit={{opacity: 0, y: -28}} transition={{type: "spring", stiffness: 360, damping: 31}}>
            <div className="create-look-preview">
              <TrainerAvatar candidates={[selectedAvatar, selectedPlayer?.avatar_asset, selectedPlayer?.front_asset, defaultAvatarAsset]} alt={newName.trim() || "训练师"} fallbackText={(newName.trim() || "训").slice(0, 1)} />
              <strong>{newName.trim() || "训练师"}</strong>
              <small>选择头像</small>
            </div>
            <div className="create-avatar-list" aria-label="选择头像">
              {catalog.avatars.map(avatar => {
                const asset = avatar.avatar_asset || "";
                return <button className={asset === selectedAvatar ? "selected" : ""} onClick={() => setNewAvatarAsset(asset)} key={avatar.id}><img src={trainerImageUrl(avatar, "avatar")} alt={avatar.name_zh} /></button>;
              })}
            </div>
            {createError ? <p className="create-save-error">{createError}</p> : null}
            <div className="create-save-actions">
              <button onClick={backFromCreate}>上一步</button>
              <button className="primary" disabled={creating || !selectedPlayer} onClick={() => void createSave()}>{creating ? "创建中..." : "确定创建"}</button>
            </div>
          </motion.section>
        ) : null}
        {createStep === "done" ? (
          <motion.section className="create-save-step create-done-step" key="done" initial={{opacity: 0, y: -20}} animate={{opacity: 1, y: 0}} exit={{opacity: 0, y: 34}} transition={{type: "spring", stiffness: 360, damping: 31}}>
            <motion.svg className="create-done-check" viewBox="0 0 48 48" aria-hidden="true" initial={{scale: 0.84}} animate={{scale: 1}} transition={{type: "spring", stiffness: 520, damping: 22}}>
              <motion.circle cx="24" cy="24" r="19" initial={{pathLength: 0, opacity: 0}} animate={{pathLength: 1, opacity: 1}} transition={{duration: 0.22, ease: "easeOut"}} />
              <motion.path d="M15 24.5 21.2 30.5 34 17.5" initial={{pathLength: 0, opacity: 0}} animate={{pathLength: 1, opacity: 1}} transition={{delay: 0.12, duration: 0.28, ease: "easeOut"}} />
            </motion.svg>
            <strong>创建完成</strong>
            <small>正在返回存档页</small>
          </motion.section>
        ) : null}
      </AnimatePresence>
      {deleteTarget ? (
        <PokopiaModal className="delete-save-modal" closeDisabled={deletePhase !== "confirm"} labelledBy="delete-save-title" onClose={() => { clearCloseTimer(); setDeleteTarget(null); setDeletePhase("confirm"); }}>
          {requestClose => (
            <div className="delete-save-content">
              <AnimatePresence mode="wait" initial={false}>
                {deletePhase === "confirm" ? (
                  <motion.div className="delete-save-state" key="confirm" variants={pokopiaItemVariants} initial="idle" animate="expand" exit="exit">
                    <span>Delete Save</span>
                    <h2 id="delete-save-title">删除存档？</h2>
                    <p className="delete-save-warning">{deleteTarget.trainer.name} 的存档会被移除。</p>
                    {deleteError ? <p className="delete-save-error">{deleteError}</p> : null}
                    <div className="delete-save-actions">
                      <button onClick={() => requestClose()}>取消</button>
                      <button className="danger" onClick={() => void confirmDelete(requestClose)}>删除</button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div className="delete-save-state delete-save-progress" key={deletePhase} variants={pokopiaItemVariants} initial="idle" animate="expand" exit="exit">
                    {deletePhase === "deleting" ? <DeleteSpinner /> : <DeleteCheckmark />}
                    <span>{deletePhase === "deleting" ? "Deleting" : "Deleted"}</span>
                    <h2 id="delete-save-title">{deletePhase === "deleting" ? "正在删除..." : "存档已删除"}</h2>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </PokopiaModal>
      ) : null}
    </section>
  );
}

function DeleteSpinner() {
  return (
    <motion.div className="delete-save-status-icon spinner" aria-hidden="true" animate={{rotate: 360}} transition={{duration: 0.72, ease: "linear", repeat: Infinity}}>
      <i />
    </motion.div>
  );
}

function DeleteCheckmark() {
  return (
    <motion.svg className="delete-save-status-icon check" viewBox="0 0 48 48" aria-hidden="true" initial={{scale: 0.82}} animate={{scale: 1}} transition={{type: "spring", stiffness: 520, damping: 22}}>
      <motion.circle cx="24" cy="24" r="19" initial={{pathLength: 0, opacity: 0}} animate={{pathLength: 1, opacity: 1}} transition={{duration: 0.22, ease: "easeOut"}} />
      <motion.path d="M15 24.5 21.2 30.5 34 17.5" initial={{pathLength: 0, opacity: 0}} animate={{pathLength: 1, opacity: 1}} transition={{delay: 0.12, duration: 0.28, ease: "easeOut"}} />
    </motion.svg>
  );
}
