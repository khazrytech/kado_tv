import React, { useState, useEffect, useRef } from 'react';
import { 
  Home, Tv, User, Play, Pause, 
  Cast, X, Radio, Volume2, Trophy, Tv2, ListTree, Bell
} from 'lucide-react';

// KATI YA MWANZO ZINAZOWEKA MUONEKANO WAKO HARAKA BILA KUSUBIRI
const DEFAULT_CHANNELS = [
  { id: '1', name: 'Azam Sports 1 HD', category: 'Sports', stream_url: 'https://goliveafrica.media:9998/live/625965017ed73/index.m3u8', is_featured: true },
  { id: '2', name: 'SuperSport Football', category: 'Sports', stream_url: 'https://goliveafrica.media:9998/live/625965017ed76/index.m3u8', is_featured: false },
  { id: '3', name: 'Dodoma TV', category: 'Local', stream_url: 'https://edge1.my-live-stream.com/tbc1/index.m3u8', is_featured: false },
  { id: '4', name: 'ITV Tanzania', category: 'Local', stream_url: 'https://edge2.my-live-stream.com/itv/index.m3u8', is_featured: false },
  { id: '5', name: 'Clouds TV', category: 'Entertainment', stream_url: 'https://edge1.my-live-stream.com/cloudstv/index.m3u8', is_featured: false },
  { id: '6', name: 'Wasafi TV', category: 'Entertainment', stream_url: 'https://edge2.my-live-stream.com/wasafi/index.m3u8', is_featured: false }
];

// COMPONENT YA AUTO-SCROLL KWA KILA CATEGORY (KUTOKA KULIA KUJA KUSHOTO)
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
        <h2 className="text-xs font-black text-slate-200 uppercase tracking-wider flex items-center gap-2">
          {categoryTitle.toLowerCase().includes('sport') ? (
            <Trophy className="text-amber-400" size={16} />
          ) : (
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          )}
          {categoryTitle} Channels
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
        {channels.map((channel) => {
          const isSelected = playingChannelId === channel.id;
          return (
            <div 
              key={channel.id || channel.name} 
              onClick={() => onSelectChannel(channel)}
              className={`w-40 shrink-0 bg-slate-900/80 backdrop-blur-md rounded-2xl overflow-hidden group cursor-pointer border transition-all active:scale-95 p-3 flex flex-col justify-between ${isSelected ? 'border-cyan-400 shadow-lg shadow-cyan-500/20 ring-1 ring-cyan-400' : 'border-white/5 hover:border-cyan-500/40'}`}
            >
              <div className="aspect-video w-full bg-slate-950 rounded-xl flex items-center justify-center relative p-2 mb-3 border border-white/5">
                <span className={`absolute top-2 left-2 px-1.5 py-0.5 rounded text-[7px] font-black uppercase tracking-wider ${isSelected ? 'bg-cyan-400 text-black' : 'bg-red-600 text-white'}`}>
                  {isSelected ? 'Playing' : 'Live'}
                </span>
                {channel.category?.toLowerCase().includes('sport') ? (
                  <Trophy className="text-amber-400 group-hover:scale-110 transition-transform" size={26} />
                ) : (
                  <Tv2 className="text-cyan-400/80 group-hover:scale-110 transition-transform" size={26} />
                )}
              </div>

              <div>
                <h3 className="font-extrabold text-xs text-white truncate group-hover:text-cyan-300 transition-colors">{channel.name}</h3>
                <p className="text-[10px] text-slate-400 truncate mt-0.5">{channel.category}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState('home'); 
  const [channels, setChannels] = useState(DEFAULT_CHANNELS);
  const [playingChannel, setPlayingChannel] = useState(DEFAULT_CHANNELS[0]);

  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [hasError, setHasError] = useState(false);
  
  const videoRef = useRef(null);
  const hlsRef = useRef(null);

  // Load HLS.js & Fetch Supabase in Background Real-Time
  useEffect(() => {
    if (!document.getElementById('hls-script')) {
      const script = document.createElement('script');
      script.id = 'hls-script';
      script.src = 'https://cdn.jsdelivr.net/npm/hls.js@latest';
      document.head.appendChild(script);
    }
    fetchSupabaseChannels();
  }, []);

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
        setChannels(data); // Inasasisha real-time bila kuathiri muonekano
      }
    } catch (err) {
      console.log('Kutumia default channels.');
    }
  };

  // SINGLE HLS PLAYER WITH CORS PROXY FALLBACK
  const startStream = (url, forceProxy = false) => {
    if (!videoRef.current || !url) return;
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
          xhrSetup: (xhr) => { xhr.withCredentials = false; }
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

  const handlePlayChannel = (channel) => {
    setPlayingChannel(channel);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleClosePlayer = () => {
    if (hlsRef.current) hlsRef.current.destroy();
    setPlayingChannel(null);
  };

  return (
    <div className="min-h-screen bg-[#06090e] text-slate-100 pb-24 font-sans">
      {/* HEADER YA KISASA */}
      <header className="sticky top-0 z-40 bg-[#06090e]/90 backdrop-blur-xl border-b border-white/5 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-purple-600 flex items-center justify-center font-black text-white text-lg shadow-lg shadow-cyan-500/30">K</div>
          <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white via-cyan-200 to-cyan-400 bg-clip-text text-transparent">KadoTV</span>
        </div>
        <div className="flex items-center gap-3">
          <button className="p-2 text-slate-400 hover:text-cyan-400 transition-colors"><Cast size={20} /></button>
          <button className="p-2 text-slate-400 hover:text-cyan-400 transition-colors"><Bell size={20} /></button>
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 p-[2px] cursor-pointer shadow-md" onClick={() => setActiveTab('myspace')}>
            <div className="w-full h-full rounded-full bg-[#06090e] flex items-center justify-center text-xs font-bold text-cyan-400">U</div>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 pt-3">
        {/* SINGLE HLS VIDEO PLAYER JUU */}
        {playingChannel && (
          <div className="relative w-full aspect-video rounded-3xl overflow-hidden border border-cyan-500/30 shadow-2xl bg-slate-950 group mb-6">
            <video ref={videoRef} playsInline autoPlay className="w-full h-full object-contain" onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)} />
            
            <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-600/90 text-white font-extrabold text-[9px] tracking-wider uppercase shadow-lg">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" /> Live IPTV
            </div>

            {hasError && (
              <div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center p-4 text-center z-20">
                <Tv2 className="text-rose-500 mb-2" size={32} />
                <p className="text-xs font-bold text-white">Stream Imegoma Kucheza</p>
                <button onClick={() => startStream(playingChannel.stream_url, true)} className="mt-3 px-3 py-1.5 rounded-xl bg-cyan-500 text-black font-bold text-[11px]">Jaribu Proxy Tena</button>
              </div>
            )}

            <button onClick={handleClosePlayer} className="absolute top-3 right-3 z-30 p-2 rounded-full bg-black/70 hover:bg-black text-white border border-white/20 transition-all"><X size={16} /></button>

            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/20 opacity-90 group-hover:opacity-100 transition-opacity p-3 flex flex-col justify-end pointer-events-none">
              <div className="flex items-center justify-between gap-3 bg-slate-950/85 backdrop-blur-md p-2.5 rounded-2xl border border-white/10 pointer-events-auto shadow-xl">
                <button onClick={() => { videoRef.current[isPlaying ? 'pause' : 'play'](); setIsPlaying(!isPlaying); }} className="p-2.5 rounded-xl bg-cyan-400 text-black hover:bg-cyan-300 transition-colors">
                  {isPlaying ? <Pause size={16} /> : <Play size={16} className="fill-current" />}
                </button>
                <div className="flex-1 min-w-0">
                  <h3 className="text-xs font-bold text-white truncate">{playingChannel.name}</h3>
                  <p className="text-[10px] text-cyan-400 truncate">{playingChannel.category}</p>
                </div>
                <button onClick={() => { videoRef.current.muted = !isMuted; setIsMuted(!isMuted); }} className="p-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"><Volume2 size={15} /></button>
              </div>
            </div>
          </div>
        )}

        {/* HOME TAB - NA AUTO-SCROLL KWA KILA KATEGORI */}
        {activeTab === 'home' && (
          <div className="space-y-2">
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

        {/* LIVE TV TAB - GRID VIEW */}
        {activeTab === 'iptv' && (
          <div className="space-y-6 pt-2">
            <div className="bg-gradient-to-br from-cyan-500/10 to-indigo-500/10 border border-cyan-500/30 rounded-3xl p-5 shadow-xl">
              <h2 className="text-base font-black text-white flex items-center gap-2">
                <ListTree className="text-cyan-400" size={20} /> Live TV Hub
              </h2>
              <p className="text-xs text-slate-300 mt-1">Orodha kamili ya chaneli zote za TV na Michezo.</p>
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

                  <div className="grid grid-cols-2 gap-3">
                    {catChannels.map((channel) => {
                      const isSelected = playingChannel?.id === channel.id;
                      return (
                        <div 
                          key={channel.id || channel.name} 
                          onClick={() => handlePlayChannel(channel)}
                          className={`bg-slate-900/80 backdrop-blur-md rounded-2xl overflow-hidden group cursor-pointer border transition-all active:scale-95 p-3 flex flex-col justify-between ${isSelected ? 'border-cyan-400 shadow-lg shadow-cyan-500/20 ring-1 ring-cyan-400' : 'border-white/5 hover:border-cyan-500/40'}`}
                        >
                          <div className="aspect-video w-full bg-slate-950 rounded-xl flex items-center justify-center relative p-2 mb-2 border border-white/5">
                            <span className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded text-[7px] font-black uppercase tracking-wider bg-red-600 text-white">Live</span>
                            {channel.category?.toLowerCase().includes('sport') ? (
                              <Trophy className="text-amber-400 group-hover:scale-110 transition-transform" size={24} />
                            ) : (
                              <Tv2 className="text-cyan-400 group-hover:scale-110 transition-transform" size={24} />
                            )}
                          </div>
                          <div>
                            <h4 className="font-bold text-xs text-white truncate">{channel.name}</h4>
                            <span className="text-[10px] text-cyan-400">{channel.category}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* MYSPACE TAB */}
        {activeTab === 'myspace' && (
          <div className="space-y-4 pt-4">
             <div className="bg-slate-900/80 rounded-3xl p-5 text-center border border-white/10">
                <h2 className="font-bold text-base text-white">KadoTV App</h2>
                <p className="text-xs text-slate-400 mt-1">Total Active Channels: {channels.length}</p>
             </div>
             <button onClick={fetchSupabaseChannels} className="w-full py-3 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-bold text-xs flex items-center justify-center gap-2">
               <Radio size={16} /> Re-sync Channels
             </button>
          </div>
        )}
      </main>

      {/* BOTTOM NAVIGATION (3 TABS: HOME, LIVE TV, MY SPACE) */}
      <nav className="fixed bottom-0 inset-x-0 z-50 bg-[#06090e]/95 backdrop-blur-xl border-t border-white/10 px-8 py-2.5 flex items-center justify-between max-w-md mx-auto">
        {[
          { id: 'home', label: 'Home', icon: Home },
          { id: 'iptv', label: 'Live TV', icon: Tv },
          { id: 'myspace', label: 'My Space', icon: User }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex flex-col items-center gap-1 transition-colors ${isActive ? 'text-cyan-400 font-bold scale-105' : 'text-slate-400 hover:text-slate-200'}`}>
              <Icon size={20} />
              <span className="text-[10px] capitalize">{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
