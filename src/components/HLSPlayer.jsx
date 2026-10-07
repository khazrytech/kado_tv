import React, { useEffect, useRef, useState } from "react";
import {
  X,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Maximize,
  Loader2,
  AlertCircle,
  RotateCcw,
  ExternalLink,
} from "lucide-react";

export default function HLSPlayer({ channel, onClose }) {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const recoveryRef = useRef(false);

  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [errorDetails, setErrorDetails] = useState("");

  useEffect(() => {
    let mounted = true;
    let hls = null;

    const video = videoRef.current;

    if (!video || !channel?.url) {
      setLoading(false);
      setError("No stream URL was found for this channel.");
      return;
    }

    const streamUrl = String(channel.url).trim();

    // Prevent known webpage URLs from being sent to <video>.
    const lowerUrl = streamUrl.toLowerCase();

    const unsupportedPage =
      lowerUrl.includes("twitch.tv/") ||
      lowerUrl.includes("youtube.com/watch") ||
      lowerUrl.includes("youtu.be/") ||
      lowerUrl.includes("facebook.com/") ||
      lowerUrl.includes("tiktok.com/");

    if (unsupportedPage) {
      setLoading(false);
      setError("This channel uses a webpage URL, not a direct video stream.");
      setErrorDetails(
        "This IPTV source needs a direct HLS (.m3u8) or compatible video URL."
      );
      return;
    }

    async function startPlayer() {
      try {
        setLoading(true);
        setError("");
        setErrorDetails("");
        setPlaying(false);
        recoveryRef.current = false;

        // Important for Android autoplay.
        video.muted = true;
        video.playsInline = true;
        video.autoplay = true;
        video.preload = "auto";

        /*
         * Native HLS
         * Safari / iOS / some Android browsers.
         */
        if (
          video.canPlayType("application/vnd.apple.mpegurl") ||
          video.canPlayType("application/x-mpegURL")
        ) {
          video.src = streamUrl;
          video.load();

          const handleLoaded = async () => {
            if (!mounted) return;

            setLoading(false);

            try {
              await video.play();

              if (mounted) {
                setPlaying(true);
              }
            } catch {
              if (mounted) {
                setPlaying(false);
              }
            }
          };

          const handlePlaying = () => {
            if (!mounted) return;

            setLoading(false);
            setPlaying(true);
          };

          const handleWaiting = () => {
            if (!mounted) return;
            setLoading(true);
          };

          const handleError = () => {
            if (!mounted) return;

            setLoading(false);
            setPlaying(false);
            setError("This stream could not be played.");
            setErrorDetails(
              "The stream may be offline, blocked by CORS, geo-restricted, or incompatible with this browser."
            );
          };

          video.addEventListener("loadedmetadata", handleLoaded);
          video.addEventListener("playing", handlePlaying);
          video.addEventListener("waiting", handleWaiting);
          video.addEventListener("error", handleError);

          return () => {
            video.removeEventListener("loadedmetadata", handleLoaded);
            video.removeEventListener("playing", handlePlaying);
            video.removeEventListener("waiting", handleWaiting);
            video.removeEventListener("error", handleError);
          };
        }

        /*
         * HLS.js
         * Chrome / Edge / Firefox / Android browsers.
         */
        const HlsModule = await import("hls.js");
        const Hls = HlsModule.default;

        if (!Hls || !Hls.isSupported()) {
          /*
           * Try normal HTML5 video as a final fallback.
           */
          video.src = streamUrl;
          video.load();

          try {
            await video.play();

            if (mounted) {
              setLoading(false);
              setPlaying(true);
            }
          } catch {
            if (mounted) {
              setLoading(false);
              setError("HLS is not supported by this browser.");
              setErrorDetails(
                "Try Chrome, Firefox, Edge, Safari, or another browser with HLS support."
              );
            }
          }

          return;
        }

        hls = new Hls({
          enableWorker: true,

          lowLatencyMode: false,

          backBufferLength: 30,

          maxBufferLength: 30,

          maxMaxBufferLength: 60,

          liveSyncDurationCount: 3,

          liveMaxLatencyDurationCount: 6,

          startLevel: -1,

          capLevelToPlayerSize: true,

          manifestLoadingMaxRetry: 2,

          levelLoadingMaxRetry: 2,

          fragLoadingMaxRetry: 2,

          fragLoadingRetryDelay: 1000,

          manifestLoadingRetryDelay: 1000,

          levelLoadingRetryDelay: 1000,

          fragLoadingRetryDelay: 1000,
        });

        hlsRef.current = hls;

        hls.attachMedia(video);

        hls.on(Hls.Events.MEDIA_ATTACHED, () => {
          if (!mounted) return;

          try {
            hls.loadSource(streamUrl);
          } catch (err) {
            console.error("KadoTV HLS load error:", err);
          }
        });

        hls.on(Hls.Events.MANIFEST_LOADING, () => {
          if (!mounted) return;

          setLoading(true);
          setError("");
        });

        hls.on(Hls.Events.MANIFEST_PARSED, async (_, data) => {
          if (!mounted) return;

          setLoading(false);
          setError("");

          console.log("KadoTV HLS manifest loaded:", {
            url: streamUrl,
            levels: data?.levels?.length || 0,
          });

          try {
            video.muted = true;
            await video.play();

            if (mounted) {
              setPlaying(true);
            }
          } catch (err) {
            console.log("Autoplay blocked:", err);

            if (mounted) {
              setPlaying(false);
            }
          }
        });

        hls.on(Hls.Events.FRAG_BUFFERED, () => {
          if (!mounted) return;

          setLoading(false);
        });

        hls.on(Hls.Events.ERROR, (_, data) => {
          if (!mounted) return;

          console.error("KadoTV HLS error:", data);

          if (!data?.fatal) {
            return;
          }

          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              /*
               * First fatal network error:
               * try loading the manifest again.
               */
              if (!recoveryRef.current) {
                recoveryRef.current = true;

                console.log(
                  "KadoTV HLS: recovering from network error..."
                );

                setLoading(true);

                try {
                  hls.startLoad();
                } catch (err) {
                  console.error(err);
                }

                return;
              }

              break;

            case Hls.ErrorTypes.MEDIA_ERROR:
              /*
               * Try recovering decoder/media once.
               */
              if (!recoveryRef.current) {
                recoveryRef.current = true;

                console.log(
                  "KadoTV HLS: recovering from media error..."
                );

                setLoading(true);

                try {
                  hls.recoverMediaError();
                } catch (err) {
                  console.error(err);
                }

                return;
              }

              break;

            default:
              break;
          }

          setLoading(false);
          setPlaying(false);

          let message = "This channel stream is unavailable.";

          if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
            message = "Unable to connect to this stream.";
          }

          if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
            message = "The stream format could not be decoded.";
          }

          setError(message);

          setErrorDetails(
            data?.details
              ? `HLS error: ${data.details}`
              : "The stream may be offline, blocked by CORS, geo-restricted, or incompatible."
          );
        });

        /*
         * Extra video events.
         */
        const handlePlay = () => {
          if (!mounted) return;

          setPlaying(true);
          setLoading(false);
        };

        const handlePause = () => {
          if (!mounted) return;

          setPlaying(false);
        };

        const handleWaiting = () => {
          if (!mounted) return;

          setLoading(true);
        };

        const handlePlaying = () => {
          if (!mounted) return;

          setLoading(false);
          setPlaying(true);
        };

        const handleVideoError = () => {
          if (!mounted) return;

          setLoading(false);
          setPlaying(false);

          if (!error) {
            setError("The browser could not play this stream.");
            setErrorDetails(
              "The stream may require a different player or may not be available."
            );
          }
        };

        video.addEventListener("play", handlePlay);
        video.addEventListener("pause", handlePause);
        video.addEventListener("waiting", handleWaiting);
        video.addEventListener("playing", handlePlaying);
        video.addEventListener("error", handleVideoError);

        return () => {
          video.removeEventListener("play", handlePlay);
          video.removeEventListener("pause", handlePause);
          video.removeEventListener("waiting", handleWaiting);
          video.removeEventListener("playing", handlePlaying);
          video.removeEventListener("error", handleVideoError);
        };
      } catch (err) {
        console.error("KadoTV HLS Player:", err);

        if (!mounted) return;

        setLoading(false);
        setPlaying(false);
        setError("Unable to start this stream.");
        setErrorDetails(
          err?.message ||
            "The player encountered an unexpected error."
        );
      }
    }

    const cleanup = startPlayer();

    return () => {
      mounted = false;

      if (hls) {
        try {
          hls.destroy();
        } catch (err) {
          console.error("HLS destroy error:", err);
        }
      }

      if (hlsRef.current) {
        try {
          hlsRef.current.destroy();
        } catch (err) {
          console.error(err);
        }

        hlsRef.current = null;
      }

      if (video) {
        try {
          video.pause();
        } catch {}

        video.removeAttribute("src");

        try {
          video.load();
        } catch {}
      }

      if (typeof cleanup === "function") {
        cleanup();
      }
    };
  }, [channel]);

  const togglePlay = async () => {
    const video = videoRef.current;

    if (!video) return;

    try {
      if (video.paused) {
        await video.play();
        setPlaying(true);
        setError("");
      } else {
        video.pause();
        setPlaying(false);
      }
    } catch (err) {
      console.error("Play error:", err);

      setError("Unable to play this stream.");
      setErrorDetails(
        "Press Play again or try another channel."
      );
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
        return;
      }

      if (video.requestFullscreen) {
        await video.requestFullscreen();
        return;
      }

      const wrapper = video.parentElement;

      if (wrapper?.requestFullscreen) {
        await wrapper.requestFullscreen();
      }
    } catch (err) {
      console.error("Fullscreen error:", err);
    }
  };

  const retryStream = () => {
    const currentChannel = channel;

    setError("");
    setErrorDetails("");
    setLoading(true);
    setPlaying(false);

    /*
     * Force React to remount the player by changing
     * the video source manually.
     */
    const video = videoRef.current;

    if (!video || !currentChannel?.url) {
      return;
    }

    try {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    } catch {}

    video.pause();
    video.removeAttribute("src");
    video.load();

    /*
     * Native HLS retry.
     */
    if (
      video.canPlayType("application/vnd.apple.mpegurl") ||
      video.canPlayType("application/x-mpegURL")
    ) {
      video.src = currentChannel.url;
      video.load();

      video.play().catch(() => {
        setLoading(false);
      });

      return;
    }

    /*
     * HLS.js retry.
     */
    import("hls.js")
      .then(({ default: Hls }) => {
        if (!Hls?.isSupported()) {
          throw new Error("HLS is not supported.");
        }

        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: false,
          backBufferLength: 30,
          maxBufferLength: 30,
        });

        hlsRef.current = hls;

        hls.attachMedia(video);

        hls.on(Hls.Events.MEDIA_ATTACHED, () => {
          hls.loadSource(currentChannel.url);
        });

        hls.on(Hls.Events.MANIFEST_PARSED, async () => {
          setLoading(false);

          try {
            video.muted = true;
            await video.play();
            setPlaying(true);
          } catch {
            setPlaying(false);
          }
        });

        hls.on(Hls.Events.ERROR, (_, data) => {
          if (data?.fatal) {
            setLoading(false);
            setPlaying(false);
            setError("This stream is still unavailable.");
            setErrorDetails(
              data?.details ||
                "Try another channel."
            );
          }
        });
      })
      .catch((err) => {
        console.error(err);

        setLoading(false);
        setError("Unable to restart this stream.");
      });
  };

  const openStream = () => {
    if (!channel?.url) return;

    window.open(
      channel.url,
      "_blank",
      "noopener,noreferrer"
    );
  };

  return (
    <div className="hls-overlay">
      <div className="hls-player">
        <div className="hls-topbar">
          <div className="hls-channel-name">
            <span className="hls-live-dot" />

            <div>
              <strong>
                {channel?.name || "Unknown Channel"}
              </strong>

              <small>
                {channel?.group || "Live TV"}
              </small>
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
            muted
            controls={false}
            preload="auto"
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
                Connecting to {channel?.name || "stream"}...
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

              {errorDetails && (
                <small>
                  {errorDetails}
                </small>
              )}

              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  flexWrap: "wrap",
                  justifyContent: "center",
                  marginTop: "14px",
                }}
              >
                <button
                  type="button"
                  onClick={retryStream}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "7px",
                  }}
                >
                  <RotateCcw size={17} />
                  Retry
                </button>

                <button
                  type="button"
                  onClick={openStream}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "7px",
                  }}
                >
                  <ExternalLink size={17} />
                  Open Stream
                </button>
              </div>
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
