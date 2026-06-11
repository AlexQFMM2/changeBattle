import {useEffect, useMemo, useRef, useState} from "react";
import type {AudioSettings, LocalSave} from "@changebattle/shared";
import {DEFAULT_AUDIO_SETTINGS} from "@changebattle/shared";
import {assetUrl, setPokemonCryVolume} from "../../lib/ui";
import {BGM_SCENE_LABELS, MUSIC_MANIFEST, type BgmScene, type MusicTrack} from "./musicManifest";

const CROSSFADE_MS = 1800;

function normalizedSettings(settings?: Partial<AudioSettings> | null): AudioSettings {
  const volume = Number(settings?.bgm_volume ?? DEFAULT_AUDIO_SETTINGS.bgm_volume);
  return {
    bgm_enabled: settings?.bgm_enabled !== false,
    bgm_volume: Math.max(0, Math.min(1, Number.isFinite(volume) ? volume : DEFAULT_AUDIO_SETTINGS.bgm_volume)),
  };
}

function randomTrack(scene: BgmScene, previousId?: string): MusicTrack | null {
  const tracks = MUSIC_MANIFEST[scene] || [];
  if (!tracks.length) return null;
  const pool = tracks.length > 1 ? tracks.filter(track => track.id !== previousId) : tracks;
  return pool[Math.floor(Math.random() * pool.length)] || tracks[0];
}

function fadeAudio(audio: HTMLAudioElement, from: number, to: number, durationMs: number, onDone?: () => void): number {
  const startedAt = performance.now();
  const tick = (now: number) => {
    const progress = Math.min(1, (now - startedAt) / Math.max(1, durationMs));
    audio.volume = from + (to - from) * progress;
    if (progress < 1) {
      frame = window.requestAnimationFrame(tick);
      return;
    }
    audio.volume = to;
    onDone?.();
  };
  let frame = window.requestAnimationFrame(tick);
  return frame;
}

export function BgmController({scene, save, onSave}: {scene: BgmScene; save: LocalSave | null; onSave: (save: LocalSave) => void}) {
  const [settings, setSettings] = useState<AudioSettings>(() => normalizedSettings(save?.audio_settings));
  const [open, setOpen] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<MusicTrack | null>(null);
  const [needsGesture, setNeedsGesture] = useState(false);
  const audioRefs = useRef<[HTMLAudioElement | null, HTMLAudioElement | null]>([null, null]);
  const activeIndexRef = useRef(0);
  const sceneRef = useRef(scene);
  const currentTrackRef = useRef<MusicTrack | null>(null);
  const fadeFramesRef = useRef<number[]>([]);
  const volumeSyncTimerRef = useRef<number | null>(null);
  const keepAliveTimerRef = useRef<number | null>(null);
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  useEffect(() => {
    let cancelled = false;
    void window.changeBattle?.getAudioSettings().then(result => {
      if (cancelled) return;
      setSettings(normalizedSettings(result.settings));
      if (result.save) onSave(result.save);
    }).catch(() => undefined);
    return () => { cancelled = true; };
  }, [onSave]);

  useEffect(() => {
    if (save?.audio_settings) setSettings(normalizedSettings(save.audio_settings));
  }, [save?.audio_settings]);

  useEffect(() => {
    audioRefs.current = [new Audio(), new Audio()];
    for (const audio of audioRefs.current) {
      if (!audio) continue;
      audio.preload = "auto";
      audio.loop = false;
    }
    return () => {
      for (const frame of fadeFramesRef.current) window.cancelAnimationFrame(frame);
      if (volumeSyncTimerRef.current !== null) window.clearTimeout(volumeSyncTimerRef.current);
      if (keepAliveTimerRef.current !== null) window.clearInterval(keepAliveTimerRef.current);
      for (const audio of audioRefs.current) {
        if (!audio) continue;
        audio.pause();
        audio.src = "";
      }
    };
  }, []);

  function cancelFades() {
    for (const frame of fadeFramesRef.current) window.cancelAnimationFrame(frame);
    fadeFramesRef.current = [];
  }

  function currentTargetVolume() {
    return settingsRef.current.bgm_enabled ? settingsRef.current.bgm_volume : 0;
  }

  function syncActiveVolume() {
    const activeAudio = audioRefs.current[activeIndexRef.current];
    if (!activeAudio || activeAudio.paused) return;
    activeAudio.volume = currentTargetVolume();
  }

  function resumeActiveAudio(): boolean {
    const activeAudio = audioRefs.current[activeIndexRef.current];
    if (!activeAudio || !activeAudio.src || !currentTrackRef.current) return false;
    activeAudio.volume = currentTargetVolume();
    if (!activeAudio.paused) return true;
    const playback = activeAudio.play();
    if (playback) {
      void playback.then(() => {
        setNeedsGesture(false);
        syncActiveVolume();
      }).catch(() => setNeedsGesture(true));
    }
    return true;
  }

  function scheduleActiveVolumeSync(delayMs = CROSSFADE_MS + 80) {
    if (volumeSyncTimerRef.current !== null) window.clearTimeout(volumeSyncTimerRef.current);
    volumeSyncTimerRef.current = window.setTimeout(() => {
      volumeSyncTimerRef.current = null;
      syncActiveVolume();
    }, delayMs);
  }

  function playTrack(nextScene: BgmScene, track: MusicTrack) {
    const nextUrl = assetUrl(track.path);
    if (!nextUrl) return;
    const activeIndex = activeIndexRef.current;
    const nextIndex = activeIndex ? 0 : 1;
    const activeAudio = audioRefs.current[activeIndex];
    const nextAudio = audioRefs.current[nextIndex];
    if (!nextAudio) return;
    cancelFades();
    nextAudio.onended = () => {
      const followUp = randomTrack(sceneRef.current, currentTrackRef.current?.id);
      if (followUp && settingsRef.current.bgm_enabled) playTrack(sceneRef.current, followUp);
    };
    nextAudio.pause();
    nextAudio.src = nextUrl;
    nextAudio.currentTime = 0;
    nextAudio.volume = 0;
    const targetVolume = currentTargetVolume();
    const playback = nextAudio.play();
    if (playback) {
      void playback.then(() => {
        setNeedsGesture(false);
        if (targetVolume > 0 && nextAudio.volume <= 0.001) nextAudio.volume = Math.min(targetVolume, 0.08);
        scheduleActiveVolumeSync();
      }).catch(() => {
        setNeedsGesture(true);
      });
    }
    if (activeAudio) {
      activeAudio.onended = null;
      const fromVolume = activeAudio.paused ? 0 : activeAudio.volume;
      fadeFramesRef.current.push(fadeAudio(activeAudio, fromVolume, 0, CROSSFADE_MS, () => {
        activeAudio.pause();
        activeAudio.currentTime = 0;
      }));
    }
    fadeFramesRef.current.push(fadeAudio(nextAudio, 0, targetVolume, CROSSFADE_MS, syncActiveVolume));
    activeIndexRef.current = nextIndex;
    sceneRef.current = nextScene;
    currentTrackRef.current = track;
    setCurrentTrack(track);
    scheduleActiveVolumeSync();
  }

  function stopPlayback() {
    cancelFades();
    for (const audio of audioRefs.current) {
      if (!audio) continue;
      const fromVolume = audio.paused ? 0 : audio.volume;
      fadeFramesRef.current.push(fadeAudio(audio, fromVolume, 0, 420, () => audio.pause()));
    }
  }

  function resumePlaybackAfterGesture() {
    if (!settingsRef.current.bgm_enabled) return;
    if (resumeActiveAudio()) return;
    const track = currentTrackRef.current || randomTrack(sceneRef.current);
    if (track) playTrack(sceneRef.current, track);
  }

  function keepCurrentTrackAlive() {
    if (!settingsRef.current.bgm_enabled || !currentTrackRef.current) return;
    if (resumeActiveAudio()) return;
    playTrack(sceneRef.current, currentTrackRef.current);
  }

  useEffect(() => {
    sceneRef.current = scene;
    if (!settings.bgm_enabled) {
      stopPlayback();
      return;
    }
    const activeAudio = audioRefs.current[activeIndexRef.current];
    if (currentTrackRef.current && activeAudio && !activeAudio.paused && sceneRef.current === scene && MUSIC_MANIFEST[scene]?.some(track => track.id === currentTrackRef.current?.id)) {
      return;
    }
    if (currentTrackRef.current && sceneRef.current === scene && MUSIC_MANIFEST[scene]?.some(track => track.id === currentTrackRef.current?.id) && resumeActiveAudio()) {
      return;
    }
    const track = currentTrackRef.current && MUSIC_MANIFEST[scene]?.some(entry => entry.id === currentTrackRef.current?.id)
      ? currentTrackRef.current
      : randomTrack(scene, currentTrackRef.current?.id);
    if (track) playTrack(scene, track);
  }, [scene, settings.bgm_enabled]);

  useEffect(() => {
    const activeAudio = audioRefs.current[activeIndexRef.current];
    if (activeAudio && !activeAudio.paused) activeAudio.volume = settings.bgm_enabled ? settings.bgm_volume : 0;
  }, [settings.bgm_enabled, settings.bgm_volume]);

  useEffect(() => {
    setPokemonCryVolume(settings.bgm_volume);
  }, [settings.bgm_volume]);

  useEffect(() => {
    if (!needsGesture || !settings.bgm_enabled) return;
    const resume = () => resumePlaybackAfterGesture();
    window.addEventListener("pointerdown", resume, {once: true});
    window.addEventListener("keydown", resume, {once: true});
    return () => {
      window.removeEventListener("pointerdown", resume);
      window.removeEventListener("keydown", resume);
    };
  }, [needsGesture, settings.bgm_enabled]);

  useEffect(() => {
    const resume = () => resumePlaybackAfterGesture();
    window.addEventListener("pointerdown", resume, {capture: true});
    window.addEventListener("keydown", resume, {capture: true});
    keepAliveTimerRef.current = window.setInterval(keepCurrentTrackAlive, 850);
    return () => {
      window.removeEventListener("pointerdown", resume, {capture: true});
      window.removeEventListener("keydown", resume, {capture: true});
      if (keepAliveTimerRef.current !== null) {
        window.clearInterval(keepAliveTimerRef.current);
        keepAliveTimerRef.current = null;
      }
    };
  }, []);

  async function persistSettings(nextSettings: AudioSettings) {
    setSettings(nextSettings);
    const result = await window.changeBattle?.updateAudioSettings(nextSettings);
    if (result?.save) onSave(result.save);
    if (result?.settings) setSettings(normalizedSettings(result.settings));
  }

  const sceneLabel = BGM_SCENE_LABELS[scene];
  const volumePercent = useMemo(() => Math.round(settings.bgm_volume * 100), [settings.bgm_volume]);

  return (
    <div className={`bgm-control ${open ? "open" : ""}`}>
      <button className="bgm-floating-button" title="BGM 设置" aria-label="BGM 设置" onClick={() => setOpen(value => !value)}><span>♪</span>设定</button>
      {open ? (
        <section className="bgm-settings-panel" aria-label="BGM 设置">
          <header>
            <strong>BGM</strong>
            <button onClick={() => setOpen(false)}>关闭</button>
          </header>
          <label className="bgm-toggle-row">
            <span>播放</span>
            <input type="checkbox" checked={settings.bgm_enabled} onChange={event => void persistSettings({...settings, bgm_enabled: event.target.checked})} />
          </label>
          <label className="bgm-volume-row">
            <span>音量 {volumePercent}%</span>
            <input type="range" min={0} max={100} value={volumePercent} onChange={event => void persistSettings({...settings, bgm_volume: Number(event.target.value) / 100})} />
          </label>
          <p><span>{sceneLabel}</span><strong>{currentTrack?.title || (settings.bgm_enabled ? "等待播放" : "已关闭")}</strong></p>
          {needsGesture && settings.bgm_enabled ? <small>点击任意位置后开始播放</small> : null}
        </section>
      ) : null}
    </div>
  );
}
