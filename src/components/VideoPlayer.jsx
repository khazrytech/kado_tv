import React, { useEffect, useRef } from 'react';
import Hls from 'hls.js';

export default function VideoPlayer({ streamUrl }) {
  const videoRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !streamUrl) return;

    let hls;

    if (Hls.isSupported()) {
      hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 30,
        maxBufferLength: 10,
        liveSyncDurationCount: 2,
        liveMaxLatencyDurationCount: 4,
        startLevel: -1,
      });

      hls.loadSource(streamUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.muted = true;
        video.play().catch((err) => {
          console.log("Autoplay blocked:", err);
        });
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              hls.destroy();
              break;
          }
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = streamUrl;
      video.muted = true;
      video.addEventListener('loadedmetadata', () => video.play());
    }

    return () => {
      if (hls) hls.destroy();
    };
  }, [streamUrl]);

  return (
    <div className="w-full aspect-video bg-black rounded-lg overflow-hidden relative">
      <video
        ref={videoRef}
        controls
        playsInline
        autoPlay
        muted
        className="w-full h-full object-contain"
      />
    </div>
  );
}
