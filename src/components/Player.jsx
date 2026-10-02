import React, { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import {
  Maximize,
  Pause,
  Play,
  Volume2,
  VolumeX,
  Settings,
  RotateCcw,
  RotateCw,
  PictureInPicture2,
  Loader2,
  AlertCircle
} from "lucide-react";

export default function Player({
  src,
  poster,
  onProgress,
  live = false
}) {
  const videoRef = useRef(null);
  const wrapRef = useRef(null);
  const hlsRef = useRef(null);
  const hideTimerRef = useRef(null);

  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [speed, setSpeed] = useState(1);

  useEffect(() => {
    const video = videoRef.current;

    if (!video || !src) return;

    setLoading(true);
    setError(false);
    setCurrentTime(0);
    setDuration(0);

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const handleLoaded = () => {
      setLoading(false);
      setDuration(video.duration || 0);
    };

    const handleTime = () => {
      const current = video.currentTime || 0;
      const total = video.duration || 0;

      setCurrentTime(current);
      setDuration(total);

      if (!live && onProgress) {
        onProgress(current, total);
      }

      try {
        if (video.buffered.length) {
          const end = video.buffered.end(video.buffered.length - 1);
          setBuffered(total ? (end / total) * 100 : 0);
        }
      } catch {}
    };

    const handleError = () => {
      setLoading(false);
      setError(true);
    };

    if (Hls.isSupported() && src.includes(".m3u8")) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: live,
        backBufferLength: 90
      });

      hls.loadSource(src);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setLoading(false);
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data?.fatal) {
          setLoading(false);
          setError(true);
        }
      });

      hlsRef.current = hls;
    } else {
      video.src = src;
    }

    video.addEventListener("loadedmetadata", handleLoaded);
    video.addEventListener("timeupdate", handleTime);
    video.addEventListener("progress", handleTime);
    video.addEventListener("error", handleError);

    return () => {
      video.removeEventListener("loadedmetadata", handleLoaded);
      video.removeEventListener("timeupdate", handleTime);
      video.removeEventListener("progress", handleTime);
      video.removeEventListener("error", handleError);

      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [src, live, onProgress]);

  useEffect(() => {
    return () => clearTimeout(hideTimerRef.current);
  }, []);

  function revealControls() {
    setShowControls(true);
    clearTimeout(hideTimerRef.current);

    if (playing) {
      hideTimerRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  }

  async function togglePlay() {
    const video = videoRef.current;
    if (!video) return;

    try {
      if (video.paused) {
        await video.play();
      } else {
        video.pause();
      }
    } catch {
      setError(true);
    }

    revealControls();
  }

  function toggleMute() {
    const video = videoRef.current;
    if (!video) return;

    video.muted = !video.muted;
    setMuted(video.muted);

    if (!video.muted && video.volume === 0) {
      video.volume = 0.7;
      setVolume(0.7);
    }

    revealControls();
  }

  function changeVolume(value) {
    const video = videoRef.current;
    if (!video) return;

    const next = Number(value);

    video.volume = next;
    video.muted = next === 0;

    setVolume(next);
    setMuted(next === 0);

    revealControls();
  }

  function seek(seconds) {
    const video = videoRef.current;
    if (!video || live) return;

    video.currentTime = Math.max(
      0,
      Math.min(video.currentTime + seconds, video.duration || 0)
    );

    revealControls();
  }

  function seekTo(value) {
    const video = videoRef.current;
    if (!video || live) return;

    video.currentTime = Number(value);
    revealControls();
  }

  function formatTime(value) {
    if (!Number.isFinite(value)) return "00:00";

    const total = Math.floor(value);
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const seconds = total % 60;

    if (hours > 0) {
      return `${hours}:${String(minutes).padStart(2, "0")}:${String(
        seconds
      ).padStart(2, "0")}`;
    }

    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
      2,
      "0"
    )}`;
  }

  async function fullscreen() {
    const wrapper = wrapRef.current;
    if (!wrapper) return;

    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await wrapper.requestFullscreen();
      }
    } catch {}
  }

  async function pictureInPicture() {
    const video = videoRef.current;

    if (!video || !document.pictureInPictureEnabled) return;

    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        await video.requestPictureInPicture();
      }
    } catch {}
  }

  function changeSpeed(value) {
    const video = videoRef.current;
    if (!video) return;

    video.playbackRate = value;
    setSpeed(value);
    setSettingsOpen(false);
  }

  const progress =
    duration > 0 ? Math.min((currentTime / duration) * 100, 100) : 0;

  return (
    <div
      className={`player player-cinematic ${
        showControls ? "controls-visible" : "controls-hidden"
      }`}
      ref={wrapRef}
      onMouseMove={revealControls}
      onTouchStart={revealControls}
      onClick={() => {
        if (settingsOpen) setSettingsOpen(false);
      }}
    >
      {poster && (
        <div
          className="player-backdrop"
          style={{ backgroundImage: `url("${poster}")` }}
        />
      )}

      <video
        ref={videoRef}
        poster={poster}
        playsInline
        preload="metadata"
        onPlay={() => {
          setPlaying(true);
          revealControls();
        }}
        onPause={() => {
          setPlaying(false);
          setShowControls(true);
        }}
      />

      <div className="player-vignette" />

      {loading && !error && (
        <div className="player-loading">
          <div className="player-loader">
            <Loader2 size={28} />
          </div>
          <span>{live ? "Connecting to live stream…" : "Loading…"}</span>
        </div>
      )}

      {error && (
        <div className="player-error">
          <div className="player-error-icon">
            <AlertCircle size={26} />
          </div>

          <strong>Unable to play this stream</strong>

          <span>
            Check the stream URL or try again.
          </span>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              window.location.reload();
            }}
          >
            Try Again
          </button>
        </div>
      )}

      {!playing && !loading && !error && (
        <button
          className="player-center-play"
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            togglePlay();
          }}
          aria-label="Play"
        >
          <Play fill="currentColor" size={30} />
        </button>
      )}

      {live && (
        <div className="player-live-pill">
          <span />
          LIVE
        </div>
      )}

      <div
        className="player-topbar"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="player-quality">
          <span className="quality-dot" />
          {live ? "LIVE STREAM" : "KadoTV"}
        </div>

        {!live && (
          <div className="player-top-actions">
            <button
              type="button"
              onClick={pictureInPicture}
              title="Picture in Picture"
            >
              <PictureInPicture2 size={18} />
            </button>
          </div>
        )}
      </div>

      <div
        className="player-bottom"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="player-progress-wrap">
          <div className="player-buffer" style={{ width: `${buffered}%` }} />

          <div
            className="player-progress"
            style={{ width: `${progress}%` }}
          />

          {!live && (
            <input
              className="player-range"
              type="range"
              min="0"
              max={duration || 0}
              step="0.1"
              value={currentTime}
              onChange={(e) => seekTo(e.target.value)}
            />
          )}
        </div>

        <div className="player-toolbar">
          <div className="player-toolbar-left">
            <button type="button" onClick={togglePlay}>
              {playing ? (
                <Pause fill="currentColor" size={20} />
              ) : (
                <Play fill="currentColor" size={20} />
              )}
            </button>

            {!live && (
              <>
                <button
                  type="button"
                  onClick={() => seek(-10)}
                  title="Back 10 seconds"
                >
                  <RotateCcw size={18} />
                  <small>10</small>
                </button>

                <button
                  type="button"
                  onClick={() => seek(10)}
                  title="Forward 10 seconds"
                >
                  <RotateCw size={18} />
                  <small>10</small>
                </button>
              </>
            )}

            <div className="player-volume">
              <button type="button" onClick={toggleMute}>
                {muted || volume === 0 ? (
                  <VolumeX size={19} />
                ) : (
                  <Volume2 size={19} />
                )}
              </button>

              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={muted ? 0 : volume}
                onChange={(e) => changeVolume(e.target.value)}
              />
            </div>

            {!live && (
              <span className="player-time">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            )}
          </div>

          <div className="player-toolbar-right">
            <div className="player-settings-wrap">
              <button
                type="button"
                onClick={() => setSettingsOpen((value) => !value)}
                title="Settings"
              >
                <Settings size={19} />
              </button>

              {settingsOpen && (
                <div className="player-settings">
                  <strong>Playback speed</strong>

                  {[0.5, 0.75, 1, 1.25, 1.5, 2].map((value) => (
                    <button
                      key={value}
                      type="button"
                      className={speed === value ? "active" : ""}
                      onClick={() => changeSpeed(value)}
                    >
                      {value}x
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={fullscreen}
              title="Fullscreen"
            >
              <Maximize size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
