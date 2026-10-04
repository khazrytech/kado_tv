import { useEffect, useRef, useState } from "react";
import {
  X,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Maximize,
  Loader2,
  AlertCircle,
} from "lucide-react";

export default function HLSPlayer({ channel, onClose }) {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);

  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function setupPlayer() {
      const video = videoRef.current;

      if (!video || !channel?.url) return;

      try {
        setLoading(true);
        setError("");

        // Safari / native HLS
        if (video.canPlayType("application/vnd.apple.mpegurl")) {
          video.src = channel.url;

          await video.play().catch(() => {});

          if (mounted) {
            setPlaying(true);
            setLoading(false);
          }

          return;
        }

        // Chrome / Android / other browsers
        const Hls = (await import("hls.js")).default;

        if (!Hls.isSupported()) {
          throw new Error("HLS is not supported by this browser.");
        }

        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
          backBufferLength: 30,
          maxBufferLength: 30,
        });

        hlsRef.current = hls;

        hls.loadSource(channel.url);
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, async () => {
          if (!mounted) return;

          setLoading(false);

          try {
            await video.play();
            setPlaying(true);
          } catch {
            setPlaying(false);
          }
        });

        hls.on(Hls.Events.ERROR, (_, data) => {
          if (!mounted) return;

          if (data?.fatal) {
            setLoading(false);
            setError("This channel stream is unavailable.");
          }
        });
      } catch (err) {
        console.error("HLS Player:", err);

        if (mounted) {
          setLoading(false);
          setError("Unable to start this stream.");
        }
      }
    }

    setupPlayer();

    return () => {
      mounted = false;

      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }

      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.removeAttribute("src");
        videoRef.current.load();
      }
    };
  }, [channel]);

  const togglePlay = async () => {
    const video = videoRef.current;

    if (!video) return;

    if (video.paused) {
      try {
        await video.play();
        setPlaying(true);
      } catch {
        setError("Unable to play this stream.");
      }
    } else {
      video.pause();
      setPlaying(false);
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;

    if (!video) return;

    video.muted = !video.muted;
    setMuted(video.muted);
  };

  const toggleFullscreen = async () => {
    const video = videoRef.current;

    if (!video) return;

    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else if (video.requestFullscreen) {
        await video.requestFullscreen();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="hls-overlay">
      <div className="hls-player">

        <div className="hls-topbar">
          <div className="hls-channel-name">
            <span className="hls-live-dot" />

            <div>
              <strong>{channel.name}</strong>
              <small>{channel.group}</small>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close player"
          >
            <X size={23} />
          </button>
        </div>

        <div className="hls-video-wrapper">

          <video
            ref={videoRef}
            playsInline
            autoPlay
            controls={false}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
          />

          {loading && !error && (
            <div className="hls-loading">
              <Loader2
                className="spin"
                size={42}
              />

              <span>
                Connecting to stream...
              </span>
            </div>
          )}

          {error && (
            <div className="hls-error">
              <AlertCircle size={42} />

              <strong>
                Stream unavailable
              </strong>

              <span>
                {error}
              </span>
            </div>
          )}

          {!error && !loading && (
            <div className="hls-controls">

              <button
                type="button"
                onClick={togglePlay}
                aria-label="Play or pause"
              >
                {playing ? (
                  <Pause size={20} />
                ) : (
                  <Play
                    size={20}
                    fill="currentColor"
                  />
                )}
              </button>

              <button
                type="button"
                onClick={toggleMute}
                aria-label="Mute or unmute"
              >
                {muted ? (
                  <VolumeX size={20} />
                ) : (
                  <Volume2 size={20} />
                )}
              </button>

              <div className="hls-spacer" />

              <button
                type="button"
                onClick={toggleFullscreen}
                aria-label="Fullscreen"
              >
                <Maximize size={20} />
              </button>

            </div>
          )}

        </div>
      </div>
    </div>
  );
}
