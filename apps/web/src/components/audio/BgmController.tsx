import {useEffect, useRef, useState} from "react";
import {assetUrl} from "../../lib/assetUrl";
import {BGM_SCENE_LABELS_V2, MUSIC_MANIFEST_V2, type BgmSceneV2, type MusicTrackV2} from "./musicManifest";

const BGM_STORAGE_KEY = "changebattle-v2:audio-settings";
const CROSSFADE_MS = 1600;
const DEFAULT_SETTINGS: BgmSettingsV2 = {
  enabled: true,
  volume: 0.36,
};

type BgmSettingsV2 = {
  enabled: boolean;
  volume: number;
};

function normalizeSettings(value: Partial<BgmSettingsV2> | null | undefined): BgmSettingsV2 {
  const volume = Number(value?.volume ?? DEFAULT_SETTINGS.volume);
  return {
    enabled: value?.enabled !== false,
    volume: Math.max(0, Math.min(1, Number.isFinite(volume) ? volume : DEFAULT_SETTINGS.volume)),
  };
}

function loadSettings(): BgmSettingsV2 {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    return normalizeSettings(JSON.parse(window.localStorage.getItem(BGM_STORAGE_KEY) || "null") as Partial<BgmSettingsV2> | null);
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function saveSettings(settings: BgmSettingsV2) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(BGM_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Audio settings are comfort state; failure should not affect gameplay.
  }
}

function randomTrack(scene: BgmSceneV2, previousId?: string): MusicTrackV2 | null {
  const tracks = MUSIC_MANIFEST_V2[scene] || [];
  if (!tracks.length) return null;
  const pool = tracks.length > 1 ? tracks.filter(track => track.id !== previousId) : tracks;
  return pool[Math.floor(Math.random() * pool.length)] || tracks[0] || null;
}

function clampedVolume(volume: number): number {
  return Math.max(0, Math.min(1, Number.isFinite(volume) ? volume : 0));
}

function fadeAudio(audio: HTMLAudioElement, from: number, to: number, durationMs: number, onDone?: () => void): number {
  const startedAt = performance.now();
  let frame = 0;
  const fromVolume = clampedVolume(from);
  const toVolume = clampedVolume(to);
  const tick = (now: number) => {
    const progress = Math.min(1, (now - startedAt) / Math.max(1, durationMs));
    audio.volume = clampedVolume(fromVolume + (toVolume - fromVolume) * progress);
    if (progress < 1) {
      frame = window.requestAnimationFrame(tick);
      return;
    }
    audio.volume = toVolume;
    onDone?.();
  };
  frame = window.requestAnimationFrame(tick);
  return frame;
}

export function BgmController({scene}: {scene: BgmSceneV2}) {
  const [settings, setSettings] = useState<BgmSettingsV2>(loadSettings);
  const [open, setOpen] = useState(false);
  const [needsGesture, setNeedsGesture] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<MusicTrackV2 | null>(null);
  const audioRefs = useRef<[HTMLAudioElement | null, HTMLAudioElement | null]>([null, null]);
  const activeIndexRef = useRef(0);
  const sceneRef = useRef(scene);
  const currentTrackRef = useRef<MusicTrackV2 | null>(null);
  const settingsRef = useRef(settings);
  const fadeFramesRef = useRef<number[]>([]);
  settingsRef.current = settings;

  useEffect(() => {
    audioRefs.current = [new Audio(), new Audio()];
    for (const audio of audioRefs.current) {
      if (!audio) continue;
      audio.preload = "auto";
      audio.loop = false;
    }
    return () => {
      cancelFades();
      for (const audio of audioRefs.current) {
        if (!audio) continue;
        audio.pause();
        audio.src = "";
      }
    };
  }, []);

  useEffect(() => {
    saveSettings(settings);
    const activeAudio = audioRefs.current[activeIndexRef.current];
    if (activeAudio && !activeAudio.paused) activeAudio.volume = targetVolume();
    if (settings.enabled && needsGesture) void resumeAfterGesture();
    if (!settings.enabled) stopPlayback();
  }, [settings.enabled, settings.volume]);

  useEffect(() => {
    sceneRef.current = scene;
    if (!settings.enabled) {
      stopPlayback();
      return;
    }
    const activeAudio = audioRefs.current[activeIndexRef.current];
    if (
      currentTrackRef.current
      && activeAudio
      && !activeAudio.paused
      && MUSIC_MANIFEST_V2[scene]?.some(track => track.id === currentTrackRef.current?.id)
    ) {
      return;
    }
    const track = currentTrackRef.current && MUSIC_MANIFEST_V2[scene]?.some(entry => entry.id === currentTrackRef.current?.id)
      ? currentTrackRef.current
      : randomTrack(scene, currentTrackRef.current?.id);
    if (track) playTrack(scene, track);
  }, [scene, settings.enabled]);

  function cancelFades() {
    for (const frame of fadeFramesRef.current) window.cancelAnimationFrame(frame);
    fadeFramesRef.current = [];
  }

  function targetVolume() {
    return settingsRef.current.enabled ? settingsRef.current.volume : 0;
  }

  function stopPlayback() {
    cancelFades();
    for (const audio of audioRefs.current) {
      if (!audio) continue;
      const fromVolume = audio.paused ? 0 : audio.volume;
      fadeFramesRef.current.push(fadeAudio(audio, fromVolume, 0, 360, () => audio.pause()));
    }
  }

  function playTrack(nextScene: BgmSceneV2, track: MusicTrackV2) {
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
      if (followUp && settingsRef.current.enabled) playTrack(sceneRef.current, followUp);
    };
    nextAudio.pause();
    nextAudio.src = nextUrl;
    nextAudio.currentTime = 0;
    nextAudio.volume = 0;
    const playback = nextAudio.play();
    if (playback) {
      void playback.then(() => {
        setNeedsGesture(false);
        if (nextAudio.volume <= 0.001 && targetVolume() > 0) nextAudio.volume = Math.min(targetVolume(), 0.08);
      }).catch(() => setNeedsGesture(true));
    }
    if (activeAudio) {
      activeAudio.onended = null;
      fadeFramesRef.current.push(fadeAudio(activeAudio, activeAudio.paused ? 0 : activeAudio.volume, 0, CROSSFADE_MS, () => {
        activeAudio.pause();
        activeAudio.currentTime = 0;
      }));
    }
    fadeFramesRef.current.push(fadeAudio(nextAudio, 0, targetVolume(), CROSSFADE_MS));
    activeIndexRef.current = nextIndex;
    sceneRef.current = nextScene;
    currentTrackRef.current = track;
    setCurrentTrack(track);
  }

  async function resumeAfterGesture() {
    if (!settingsRef.current.enabled) return;
    const activeAudio = audioRefs.current[activeIndexRef.current];
    if (activeAudio?.src && currentTrackRef.current) {
      activeAudio.volume = targetVolume();
      try {
        await activeAudio.play();
        setNeedsGesture(false);
        return;
      } catch {
        setNeedsGesture(true);
      }
    }
    const track = currentTrackRef.current || randomTrack(sceneRef.current);
    if (track) playTrack(sceneRef.current, track);
  }

  function updateSettings(patch: Partial<BgmSettingsV2>) {
    setSettings(current => normalizeSettings({...current, ...patch}));
  }

  return (
    <div className="bgm-v2-control" data-open={open ? "true" : "false"}>
      <button className="bgm-v2-floating-button" type="button" aria-label="音乐设置" onClick={() => setOpen(value => !value)}>
        <span title={`${settings.enabled ? "音乐开启" : "音乐关闭"} · ${BGM_SCENE_LABELS_V2[scene]}`}>{settings.enabled ? "♪" : "×"}</span>
      </button>
      {open ? (
        <div className="bgm-v2-panel" role="dialog" aria-label="音乐设置">
          <header>
            <strong>{currentTrack?.title || "背景音乐"}</strong>
            <button type="button" aria-label="关闭音乐设置" onClick={() => setOpen(false)}>×</button>
          </header>
          <label className="bgm-v2-toggle-row">
            <input type="checkbox" checked={settings.enabled} onChange={event => updateSettings({enabled: event.currentTarget.checked})} />
            <span>播放背景音乐</span>
          </label>
          <label className="bgm-v2-volume-row">
            <span>音量</span>
            <input type="range" min="0" max="100" value={Math.round(settings.volume * 100)} onChange={event => updateSettings({volume: Number(event.currentTarget.value) / 100})} />
            <b>{Math.round(settings.volume * 100)}%</b>
          </label>
          {needsGesture && settings.enabled ? (
            <button className="bgm-v2-resume" type="button" onClick={() => void resumeAfterGesture()}>点击启用音乐</button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
