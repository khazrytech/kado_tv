import React, { useState, useEffect, useRef } from 'react';
import { 
  Home, Compass, Tv, User, Play, Pause, 
  Search, Cast, X, Radio, Volume2, Trophy, Tv2
} from 'lucide-react';

// COMPONENT YA AUTO-SCROLL KWA KILA CATEGORY
function CategoryRow({ categoryTitle, channels, onSelectChannel, playingChannelId }) {
  const scrollRef = useRef(null);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const timer = setInterval(() => {
      if (!isPaused && el) {
        if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 2) {
          el.scrollLeft = 0; 
        } else {
          el.scrollLeft += 1;
        }
      }
    }, 30);

    return () => clearInterval(timer);
  }, [isPaused]);

  return (
    <div className="space-y-3 mt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-extrabold text-white tracking-wide uppercase flex items-center gap-2">
          {categoryTitle.toLowerCase().includes('sport') ? (
            <Trophy className="text-amber-400" size={16} />
          ) : (
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          )}
          {categoryTitle}
        </h2>
        <span className="text-[10px] font-semibold text-cyan-400/90 bg-cyan-500/10 px-2.5 py-0.5 rounded-full border border-cyan-500/20">
          Auto Scroll &rarr;
        </span>
      </div>

      <div 
        ref={scrollRef}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
        className="flex items-center gap-3 overflow-x-auto scrollbar-none py-1 scroll-smooth"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {channels.map((channel) => (
          <div 
            key={channel.id || channel.name} 
            onClick={() => onSelectChannel(channel)}
            className={`w-40 shrink-0 glass-card rounded-2xl overflow-hidden group cursor-pointer border transition-all active:scale-95 ${playingChannelId === channel.id ? 'border-cyan-400 shadow-lg shadow-cyan-500/20 ring-2 ring-cyan-400/50' : 'border-white/5 hover:border-cyan-500/50'}`}
          >
            <div className="aspect-video w-full bg-slate-950 flex items-center justify-center relative p-2">
              {channel.logo_url ? (
                <img 
                  src={channel.logo_url} 
                  alt={channel.name} 
                  className="max-h-full max-w-full object-contain filter drop-shadow"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-indigo-500/20 border border-cyan-500/30 flex items-center justify-center">
                  {channel.category?.toLowerCase().includes('sport') ? <Trophy className="text-amber-400" size={22} /> : <Tv2 className="text-cyan-400" size={22} />}
                </div>
              )}

              <span className={`absolute top-2 left-2 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${playingChannelId === channel.id ? 'bg-cyan-400 text-black' : 'bg-red-600 text-white'}`}>
                {playingChannelId === channel.id ? 'PLAYING' : 'LIVE'}
              </span>
            </div>

            <div className="p-2.5 bg-slate-900/60">
              <h3 className="font-bold text-xs text-white truncate group-hover:text-cyan-300 transition-colors">{channel.name}</h3>
              <p className="text-[10px] text-slate-400 truncate mt-0.5">{channel.category}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState('home'); 
  const [channels, setChannels] = useState([]);
  const [playingChannel, setPlayingChannel] = useState(null);
  const [heroIndex, setHeroIndex] = useState(0);

  // Player States
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isLoadingSupabase, setIsLoadingSupabase] = useState(true);
  
  const videoRef = useRef(null);
  const hlsRef = useRef(null);

  // Load HLS.js
  useEffect(() => {
    if (!document.getElementById('hls-script')) {
      const script = document.createElement('script');
      script.id = 'hls-script';
      script.src = 'https://cdn.jsdelivr.net/npm/hls.js@latest';
      document.head.appendChild(script);
    }
    fetchSupabaseChannels();
  }, []);

  // Fetch Channels KUTOKA SUPABASE PEKEE
  const fetchSupabaseChannels = async () => {
    setIsLoadingSupabase(true);
    try {
      const res = await fetch('https://fqixivwmtggpuftrnxxq.supabase.co/rest/v1/channels?select=*', {
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZxaXhpd3dtdGdncHVmdHJueHhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEyMDI3MjMsImV4cCI6MjA1Njc3ODcyM30.4sI6Uo7Q4oQWb4a9G02pW4z_c3-Yg-3hX1b9_p4mX4',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZxaXhpd3dtdGdncHVmdHJueHhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEyMDI3MjMsImV4cCI6MjA1Njc3ODcyM30.4sI6Uo7Q4oQWb4a9G02pW4z_c3-Yg-3hX1b9_p4mX4'
        }
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setChannels(data);
      }
    } catch (err) {
      console.log('Failed to fetch from Supabase.');
    } finally {
      setIsLoadingSupabase(false);
    }
  };

  // CORS FIX: ADVANCED STREAM PLAYER WITH PROXY FALLBACK
  const startStream = (url, forceProxy = false) => {
    if (!videoRef.current) return;
    setHasError(false);
    setIsPlaying(true);

    const video = videoRef.current;
    const targetUrl = forceProxy ? `https://corsproxy.io/?${encodeURIComponent(url)}` : url;

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const initHls = () => {
      if (window.Hls && window.Hls.isSupported()) {
        const hls = new window.Hls({ 
          enableWorker: true, 
          lowLatencyMode: true,
          xhrSetup: (xhr) => {
            xhr.withCredentials = false;
          }
        });
        hlsRef.current = hls;
        hls.loadSource(targetUrl);
        hls.attachMedia(video);

        hls.on(window.Hls.Events.MANIFEST_PARSED, () => {
          video.play().catch(() => {});
        });

        hls.on(window.Hls.Events.ERROR, (event, data) => {
          if (data.fatal) {
            if (!forceProxy) {
              console.log('Direct stream blocked by CORS. Switching to Proxy Mode...');
              startStream(url, true);
            } else {
              setHasError(true);
            }
          }
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = targetUrl;
        video.play().catch(() => {});
      } else {
        setHasError(true);
      }
    };

    if (window.Hls) {
      initHls();
    } else {
      setTimeout(initHls, 600);
    }
  };

  useEffect(() => {
    if (!playingChannel) return;
    startStream(playingChannel.stream_url, false);

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [playingChannel]);

  const uniqueCategories = [...new Set(channels.map(c => c.category || 'Uncategorized'))];
  const featuredChannels = channels.filter(c => c.is_featured);
  const currentHero = featuredChannels.length > 0 ? featuredChannels[heroIndex % featuredChannels.length] : channels[0];

  useEffect(() => {
    if (playingChannel || featuredChannels.length <= 1) return;
    const timer = setInterval(() => {
      setHeroIndex((prev) => prev + 1);
    }, 6000);
    return () => clearInterval(timer);
  }, [playingChannel, featuredChannels.length]);

  const handlePlayChannel = (channel) => {
    setPlayingChannel(channel);
    setActiveTab('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStopStream = () => {
    if (hlsRef.current) hlsRef.current.destroy();
    setPlayingChannel(null);
  };

  return (
    <div className="min-h-screen bg-[#06090e] text-slate-100 pb-20 font-sans">
      <header className="sticky top-0 z-40 bg-[#06090e]/90 backdrop-blur-xl border-b border-white/5 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-purple-600 flex items-center justify-center font-black text-white text-lg">K</div>
          <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white via-cyan-200 to-cyan-400 bg-clip-text text-transparent">KadoTV</span>
        </div>
        <div className="flex items-center gap-3">
          <button className="p-2 text-slate-400 hover:text-cyan-400"><Cast size={20} /></button>
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 p-[2px] cursor-pointer" onClick={() => setActiveTab('myspace')}>
            <div className="w-full h-full rounded-full bg-[#06090e] flex items-center justify-center text-xs font-bold text-cyan-400">U</div>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 pt-3">
        {activeTab === 'home' && (
          <div className="space-y-2">
            {playingChannel ? (
              <div className="relative w-full aspect-video rounded-3xl overflow-hidden border border-cyan-500/40 shadow-2xl bg-black group mb-6">
                <video ref={videoRef} playsInline autoPlay className="w-full h-full object-contain" onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)} />
                {hasError && (
                  <div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center p-4 text-center z-20">
                    <Tv2 className="text-rose-500 mb-2" size={32} />
                    <p className="text-xs font-bold text-white">Stream Imegoma Kucheza (CORS/Network Issue)</p>
                    <button onClick={() => startStream(playingChannel.stream_url, true)} className="mt-3 px-3 py-1.5 rounded-xl bg-cyan-500 text-black font-bold text-[11px]">Jaribu Proxy Tena</button>
                  </div>
                )}
                <button onClick={handleStopStream} className="absolute top-3 right-3 z-30 p-2 rounded-full bg-black/80 text-white border border-white/20"><X size={18} /></button>
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/30 opacity-90 group-hover:opacity-100 transition-opacity p-3 flex flex-col justify-end pointer-events-none">
                  <div className="flex items-center justify-between gap-3 bg-slate-950/85 p-2.5 rounded-2xl border border-white/10 pointer-events-auto shadow-xl">
                    <button onClick={() => { videoRef.current[isPlaying ? 'pause' : 'play'](); setIsPlaying(!isPlaying); }} className="p-2.5 rounded-xl bg-cyan-400 text-black">
                      {isPlaying ? <Pause size={16} /> : <Play size={16} className="fill-current" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xs font-bold text-white truncate">{playingChannel.name}</h3>
                    </div>
                    <button onClick={() => { videoRef.current.muted = !isMuted; setIsMuted(!isMuted); }} className="p-2 rounded-lg bg-white/10 text-white"><Volume2 size={15} /></button>
                  </div>
                </div>
              </div>
            ) : currentHero ? (
              <div className="relative w-full h-[360px] rounded-3xl overflow-hidden bg-slate-950 border border-white/10 mb-6">
                <div className="absolute inset-0 bg-gradient-to-b from-slate-900/40 to-[#06090e] flex items-center justify-center p-8">
                   <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-3xl font-black text-white shadow-xl">
                      {currentHero?.name?.charAt(0) || 'K'}
                    </div>
                </div>
                <div className="absolute bottom-0 inset-x-0 p-5 flex flex-col items-start z-10">
                  <h1 className="text-2xl font-black text-white">{currentHero?.name}</h1>
                  <p className="text-xs text-slate-300 mt-1 mb-4">{currentHero?.description || 'Watch live broadcast from Supabase.'}</p>
                  <button onClick={() => handlePlayChannel(currentHero)} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 text-black font-extrabold text-sm shadow-lg shadow-cyan-500/25">
                    <Play size={16} className="fill-black" /> Watch Live
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-20 glass-card rounded-3xl p-6 border border-white/10">
                <Tv2 className="mx-auto text-cyan-400 mb-3" size={40} />
                <h2 className="text-sm font-bold text-white">Hakuna Chaneli Zilizopatikana</h2>
                <p className="text-xs text-slate-400 mt-1">Tafadhali ongeza chaneli (ikiwemo Sports) kwenye database yako ya Supabase.</p>
              </div>
            )}

            {isLoadingSupabase && (
              <div className="text-center py-4 text-xs text-cyan-400 animate-pulse">Inapakia chaneli kutoka Supabase...</div>
            )}

            {uniqueCategories.map((cat, idx) => {
              const catChannels = channels.filter(c => (c.category || 'Uncategorized') === cat);
              if (catChannels.length === 0) return null;

              return (
                <CategoryRow 
                  key={idx}
                  categoryTitle={cat}
                  channels={catChannels}
                  onSelectChannel={handlePlayChannel}
                  playingChannelId={playingChannel?.id}
                />
              );
            })}
          </div>
        )}

        {activeTab === 'myspace' && (
          <div className="space-y-4 pt-4">
             <div className="glass-card rounded-3xl p-5 text-center border border-white/10">
                <h2 className="font-bold text-lg text-white">Supabase Database</h2>
                <p className="text-xs text-slate-400 mt-1">Total Channels Loaded: {channels.length}</p>
             </div>
             <button onClick={fetchSupabaseChannels} className="w-full py-3 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-bold text-xs flex items-center justify-center gap-2">
               <Radio size={16} /> Re-sync Channels from Supabase
             </button>
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 inset-x-0 z-50 bg-[#06090e]/90 backdrop-blur-lg border-t border-white/5 px-6 py-2.5 flex items-center justify-between max-w-md mx-auto">
        {['home', 'discover', 'live', 'myspace'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`flex flex-col items-center gap-1 ${activeTab === tab ? 'text-cyan-400' : 'text-slate-500'}`}>
            {tab === 'home' && <Home size={20} />}
            {tab === 'discover' && <Compass size={20} />}
            {tab === 'live' && <Tv size={20} />}
            {tab === 'myspace' && <User size={20} />}
            <span className="text-[10px] font-bold capitalize">{tab}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
