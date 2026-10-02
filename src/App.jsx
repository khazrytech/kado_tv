import React, { useState, useEffect, useRef } from 'react';
import { 
  Home, Compass, Tv, User, Play, Pause, 
  Search, Cast, X, Radio, Volume2, Trophy, Tv2, ListTree
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

// DEFAULT IPTV CHANNELS (ZITATUMIKA IKITOKEA SUPABASE HAINA DATA)
const DEFAULT_IPTV_CHANNELS = [
  { id: '1', name: 'Azam Sports 1 HD', category: 'Sports', stream_url: 'https://goliveafrica.media:9998/live/625965017ed73/index.m3u8', is_featured: true },
  { id: '2', name: 'Azam Sports 2 HD', category: 'Sports', stream_url: 'https://goliveafrica.media:9998/live/625965017ed74/index.m3u8', is_featured: false },
  { id: '3', name: 'SuperSport Football', category: 'Sports', stream_url: 'https://goliveafrica.media:9998/live/625965017ed76/index.m3u8', is_featured: true },
  { id: '4', name: 'Red Bull TV Sports', category: 'Sports', stream_url: 'https://rbmn-live.akamaized.net/hls/live/591079/GEO_RBMN_KOR_RBMNTV1_GLOBAL/master.m3u8', is_featured: false },
  { id: '5', name: 'TBC 1 Tanzania', category: 'Local', stream_url: 'https://edge1.my-live-stream.com/tbc1/index.m3u8', is_featured: true },
  { id: '6', name: 'Azam TV News', category: 'Local', stream_url: 'https://goliveafrica.media:9998/live/azamnews/index.m3u8', is_featured: false },
  { id: '7', name: 'EATV Tanzania', category: 'Entertainment', stream_url: 'https://edge2.my-live-stream.com/eatv/index.m3u8', is_featured: false }
];

export default function App() {
  const [activeTab, setActiveTab] = useState('home'); 
  const [channels, setChannels] = useState(DEFAULT_IPTV_CHANNELS);
  const [playingChannel, setPlayingChannel] = useState(null);
  const [heroIndex, setHeroIndex] = useState(0);

  // Player States
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [hasError, setHasError] = useState(false);
  
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

  // Fetch Channels kutoka Supabase na Fallback kwenye Default
  const fetchSupabaseChannels = async () => {
    try {
      const res = await fetch('https://fqixivwmtggpuftrnxxq.supabase.co/rest/v1/channels?select=*', {
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZxaXhpd3dtdGdncHVmdHJueHhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEyMDI3MjMsImV4cCI6MjA1Njc3ODcyM30.4sI6Uo7Q4oQWb4a9G02pW4z_c3-Yg-3hX1b9_p4mX4',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZxaXhpd3dtdGdncHVmdHJueHhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEyMDI3MjMsImV4cCI6MjA1Njc3ODcyM30.4sI6Uo7Q4oQWb4a9G02pW4z_c3-Yg-3hX1b9_p4mX4'
        }
      });
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        setChannels(data);
      }
    } catch (err) {
      console.log('Tumetumia default channels kwa sababu ya Supabase connection.');
    }
  };

  // CORS FIX & SINGLE HLS PLAYER WITH PROXY FALLBACK
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStopStream = () => {
    if (hlsRef.current) hlsRef.current.destroy();
    setPlayingChannel(null);
  };

  return (
    <div className="min-h-screen bg-[#06090e] text-slate-100 pb-24 font-sans">
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
        {/* SINGLE HLS VIDEO PLAYER */}
        {playingChannel && (
          <div className="relative w-full aspect-video rounded-3xl overflow-hidden border border-cyan-500/40 shadow-2xl bg-black group mb-6">
            <video ref={videoRef} playsInline autoPlay className="w-full h-full object-contain" onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)} />
            {hasError && (
              <div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center p-4 text-center z-20">
                <Tv2 className="text-rose-500 mb-2" size={32} />
                <p className="text-xs font-bold text-white">Stream Imegoma Kucheza</p>
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
        )}

        {/* HOME TAB */}
        {activeTab === 'home' && (
          <div className="space-y-2">
            {!playingChannel && currentHero && (
              <div className="relative w-full h-[320px] rounded-3xl overflow-hidden bg-slate-950 border border-white/10 mb-6 flex flex-col justify-end p-5">
                <div className="absolute inset-0 bg-gradient-to-t from-[#06090e] via-slate-900/40 to-transparent flex items-center justify-center">
                   <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-3xl font-black text-white shadow-xl">
                      {currentHero?.name?.charAt(0) || 'K'}
                    </div>
                </div>
                <div className="relative z-15">
                  <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[9px] font-black uppercase tracking-wider">Featured</span>
                  <h1 className="text-xl font-black text-white mt-2">{currentHero?.name}</h1>
                  <p className="text-xs text-slate-300 mt-1 mb-3">{currentHero?.category} Live Stream</p>
                  <button onClick={() => handlePlayChannel(currentHero)} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 text-black font-extrabold text-sm shadow-lg shadow-cyan-500/25">
                    <Play size={16} className="fill-black" /> Watch Live
                  </button>
                </div>
              </div>
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

        {/* IPTV TAB MAALUM (GRID SYSTEM NA CATEGORIES) */}
        {activeTab === 'iptv' && (
          <div className="space-y-6 pt-2">
            <div className="glass-card rounded-3xl p-5 border border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 to-transparent">
              <h2 className="text-base font-black text-white flex items-center gap-2">
                <ListTree className="text-cyan-400" size={20} /> IPTV Channels Hub
              </h2>
              <p className="text-xs text-slate-300 mt-1">Chaneli zote za michezo na burudani zimepangwa hapa chini kwa mfumo wa Grid.</p>
            </div>

            {uniqueCategories.map((cat, idx) => {
              const catChannels = channels.filter(c => (c.category || 'Uncategorized') === cat);
              if (catChannels.length === 0) return null;

              return (
                <div key={idx} className="space-y-3">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <h3 className="text-xs font-extrabold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                      {cat.toLowerCase().includes('sport') ? <Trophy size={14} className="text-amber-400" /> : <Tv2 size={14} />}
                      {cat} ({catChannels.length})
                    </h3>
                  </div>
                  {/* Grid layout safi kabisa */}
                  <div className="grid grid-cols-2 gap-3">
                    {catChannels.map((channel) => (
                      <div 
                        key={channel.id || channel.name} 
                        onClick={() => handlePlayChannel(channel)}
                        className={`glass-card rounded-2xl overflow-hidden group cursor-pointer border transition-all active:scale-95 p-2.5 flex flex-col justify-between ${playingChannel?.id === channel.id ? 'border-cyan-400 shadow-md shadow-cyan-500/20 ring-1 ring-cyan-400' : 'border-white/5 hover:border-cyan-500/40'}`}
                      >
                        <div className="aspect-video w-full bg-slate-950 rounded-xl flex items-center justify-center relative p-2 mb-2">
                          <Tv2 className="text-cyan-400/80" size={26} />
                          <span className="absolute top-1 right-1 px-1.5 py-0.5 rounded text-[7px] font-black bg-red-600 text-white uppercase">Live</span>
                        </div>
                        <h4 className="font-bold text-xs text-white truncate">{channel.name}</h4>
                        <span className="text-[9px] text-slate-400 mt-0.5">{channel.category}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* MYSPACE TAB */}
        {activeTab === 'myspace' && (
          <div className="space-y-4 pt-4">
             <div className="glass-card rounded-3xl p-5 text-center border border-white/10">
                <h2 className="font-bold text-lg text-white">KadoTV Player</h2>
                <p className="text-xs text-slate-400 mt-1">Total Loaded Channels: {channels.length}</p>
             </div>
             <button onClick={fetchSupabaseChannels} className="w-full py-3 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-bold text-xs flex items-center justify-center gap-2">
               <Radio size={16} /> Re-sync Channels
             </button>
          </div>
        )}
      </main>

      {/* BOTTOM NAVIGATION */}
      <nav className="fixed bottom-0 inset-x-0 z-50 bg-[#06090e]/95 backdrop-blur-xl border-t border-white/10 px-6 py-2.5 flex items-center justify-between max-w-md mx-auto">
        {[
          { id: 'home', label: 'Home', icon: Home },
          { id: 'iptv', label: 'IPTV', icon: Tv },
          { id: 'discover', label: 'Discover', icon: Compass },
          { id: 'myspace', label: 'My Space', icon: User }
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex flex-col items-center gap-1 transition-colors ${activeTab === tab.id ? 'text-cyan-400 font-bold' : 'text-slate-400 hover:text-slate-200'}`}>
              <Icon size={20} />
              <span className="text-[10px] capitalize">{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
