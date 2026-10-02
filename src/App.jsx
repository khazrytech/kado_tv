import React, { useState, useEffect, useRef } from 'react';
import { 
  Home, 
  Compass, 
  Tv, 
  User, 
  Play, 
  Pause, 
  Plus, 
  Check, 
  Search, 
  Cast, 
  Bell, 
  X, 
  Radio, 
  Sparkles,
  Volume2,
  VolumeX,
  Maximize,
  Tv2
} from 'lucide-react';

const DEFAULT_CHANNELS = [
  {
    id: 'ch-1',
    name: 'Dodoma TV',
    category: 'Local',
    description: 'Kituo cha habari na matukio ya kijamii mubashara kutoka makao makuu ya nchi Dodoma.',
    stream_url: 'https://goliveafrica.media:9998/live/625965017ed69/index.m3u8',
    logo_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/TBC1_logo.png/320px-TBC1_logo.png',
    is_featured: true
  },
  {
    id: 'ch-2',
    name: 'ITV Tanzania',
    category: 'Local',
    description: 'Kituo kinara cha habari, vipindi vya kijamii, utamaduni, michezo na burudani nchini Tanzania.',
    stream_url: 'https://goliveafrica.media:9998/live/625965017ed68/index.m3u8',
    logo_url: 'https://upload.wikimedia.org/wikipedia/commons/4/46/ITV_Tanzania_logo.jpg',
    is_featured: true
  },
  {
    id: 'ch-3',
    name: 'TBC 1',
    category: 'Local',
    description: 'Shirika la Utangazaji la Taifa (TBC) linalorusha habari za serikali na masuala ya kitaifa.',
    stream_url: 'https://goliveafrica.media:9998/live/625965017ed67/index.m3u8',
    logo_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/TBC1_logo.png/320px-TBC1_logo.png',
    is_featured: false
  },
  {
    id: 'ch-4',
    name: 'Clouds TV',
    category: 'Entertainment',
    description: 'Kituo cha burudani, muziki, filamu, maisha ya vijana na matukio ya sanaa.',
    stream_url: 'https://goliveafrica.media:9998/live/625965017ed70/index.m3u8',
    logo_url: '',
    is_featured: false
  },
  {
    id: 'ch-5',
    name: 'Wasafi TV',
    category: 'Entertainment',
    description: 'Kituo cha burudani cha Wasafi Media kinachorusha muziki, maisha ya wasanii na michezo.',
    stream_url: 'https://goliveafrica.media:9998/live/625965017ed71/index.m3u8',
    logo_url: '',
    is_featured: false
  },
  {
    id: 'ch-6',
    name: 'EATV',
    category: 'Sports & Youth',
    description: 'East Africa TV - Kituo cha vijana kinachorusha burudani, muziki na habari za Afrika Mashariki.',
    stream_url: 'https://goliveafrica.media:9998/live/625965017ed72/index.m3u8',
    logo_url: '',
    is_featured: false
  }
];

export default function App() {
  const [activeTab, setActiveTab] = useState('home'); 
  const [channels, setChannels] = useState(DEFAULT_CHANNELS);
  const [playingChannel, setPlayingChannel] = useState(null);
  const [myList, setMyList] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [heroIndex, setHeroIndex] = useState(0);

  // Player States
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [hasError, setHasError] = useState(false);
  const videoRef = useRef(null);
  const hlsRef = useRef(null);

  // Load HLS.js Dynamically kwa ajili ya Browser za Android
  useEffect(() => {
    if (!document.getElementById('hls-script')) {
      const script = document.createElement('script');
      script.id = 'hls-script';
      script.src = 'https://cdn.jsdelivr.net/npm/hls.js@latest';
      document.head.appendChild(script);
    }
  }, []);

  // Fetch Supabase
  useEffect(() => {
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
        setChannels(data);
      }
    } catch (err) {
      console.log('Using fallback channels:', err);
    }
  };

  // Playback HLS Engine Integration
  useEffect(() => {
    if (!playingChannel || !videoRef.current) return;

    setHasError(false);
    setIsPlaying(true);
    const video = videoRef.current;
    const streamUrl = playingChannel.stream_url;

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const startHls = () => {
      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = streamUrl;
        video.play().catch(err => console.log('Autoplay blocked:', err));
      } else if (window.Hls && window.Hls.isSupported()) {
        const hls = new window.Hls({ enableWorker: true, lowLatencyMode: true });
        hlsRef.current = hls;
        hls.loadSource(streamUrl);
        hls.attachMedia(video);
        hls.on(window.Hls.Events.MANIFEST_PARSED, () => {
          video.play().catch(err => console.log('Autoplay blocked:', err));
        });
        hls.on(window.Hls.Events.ERROR, (event, data) => {
          if (data.fatal) {
            console.warn('HLS Fatal Error:', data);
            setHasError(true);
          }
        });
      } else {
        video.src = streamUrl;
        video.play().catch(err => console.log('Playback error:', err));
      }
    };

    if (window.Hls) {
      startHls();
    } else {
      const timer = setTimeout(() => {
        startHls();
      }, 500);
      return () => clearTimeout(timer);
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [playingChannel]);

  const categoriesList = ['Local', 'Entertainment', 'Sports & Youth', 'News'];

  const getChannelsByCategory = (cat) => {
    return channels.filter(c => (c.category || 'Local').toLowerCase().includes(cat.toLowerCase()));
  };

  const featuredChannels = channels.filter(c => c.is_featured).length > 0 
    ? channels.filter(c => c.is_featured) 
    : channels;

  useEffect(() => {
    if (playingChannel || featuredChannels.length <= 1) return;
    const timer = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % featuredChannels.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [playingChannel, featuredChannels.length]);

  const currentHero = featuredChannels[heroIndex] || channels[0];

  const handlePlayChannel = (channel) => {
    setPlayingChannel(channel);
    setActiveTab('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStopStream = () => {
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
    setPlayingChannel(null);
  };

  const toggleMyList = (channelId) => {
    if (myList.includes(channelId)) {
      setMyList(myList.filter(id => id !== channelId));
    } else {
      setMyList([...myList, channelId]);
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleFullscreen = () => {
    if (videoRef.current) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen();
      } else if (videoRef.current.webkitRequestFullscreen) {
        videoRef.current.webkitRequestFullscreen();
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#06090e] text-slate-100 pb-20 font-sans selection:bg-cyan-500 selection:text-black">
      
      {/* HEADER */}
      <header className="sticky top-0 z-40 bg-[#06090e]/90 backdrop-blur-xl border-b border-white/5 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-purple-600 flex items-center justify-center font-black text-white text-lg shadow-lg shadow-cyan-500/20">
            K
          </div>
          <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white via-cyan-200 to-cyan-400 bg-clip-text text-transparent">
            KadoTV
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button className="p-2 text-slate-400 hover:text-cyan-400 transition-colors">
            <Cast size={20} />
          </button>
          <button className="p-2 text-slate-400 hover:text-cyan-400 transition-colors relative">
            <Bell size={20} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-cyan-400" />
          </button>
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 p-[2px] cursor-pointer" onClick={() => setActiveTab('myspace')}>
            <div className="w-full h-full rounded-full bg-[#06090e] flex items-center justify-center text-xs font-bold text-cyan-400">
              U
            </div>
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="max-w-md mx-auto px-4 pt-3">

        {/* ==================== TAB 1: HOME ==================== */}
        {activeTab === 'home' && (
          <div className="space-y-6">

            {/* HERO AREA: SINGLE CUSTOM PLAYER */}
            {playingChannel ? (
              <div className="relative w-full aspect-video rounded-3xl overflow-hidden border border-cyan-500/40 shadow-2xl bg-black group fade-in-hero">
                
                {/* HTML5 Video without browser default controls */}
                <video
                  ref={videoRef}
                  playsInline
                  autoPlay
                  className="w-full h-full object-contain"
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onError={() => setHasError(true)}
                />

                {/* Error Overlay */}
                {hasError && (
                  <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center p-4 text-center z-20">
                    <Tv2 className="text-rose-500 mb-2" size={32} />
                    <p className="text-xs font-bold text-white">Stream Haipatikani kwa Sasa</p>
                    <p className="text-[10px] text-slate-400 mt-1">Kituo hiki kinaweza kuwa hakirushi matangazo kwa sasa.</p>
                  </div>
                )}

                {/* Close Button */}
                <button 
                  onClick={handleStopStream}
                  className="absolute top-3 right-3 z-30 p-2 rounded-full bg-black/80 text-white hover:bg-rose-600 transition-colors border border-white/20 backdrop-blur-md"
                  title="Funga Stream"
                >
                  <X size={18} />
                </button>

                {/* Custom Overlay Controls */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/30 opacity-90 group-hover:opacity-100 transition-opacity p-3 flex flex-col justify-between pointer-events-none">
                  
                  <div className="flex items-center justify-between pointer-events-auto">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-600/90 text-white text-[9px] font-black uppercase tracking-wider shadow-lg">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                      LIVE
                    </div>
                  </div>

                  {/* Single Player Control Bar */}
                  <div className="flex items-center justify-between gap-3 bg-slate-950/85 p-2.5 rounded-2xl backdrop-blur-md border border-white/10 pointer-events-auto shadow-xl">
                    <button 
                      onClick={togglePlay} 
                      className="p-2.5 rounded-xl bg-cyan-400 text-black font-extrabold hover:bg-cyan-300 transition-transform active:scale-95"
                    >
                      {isPlaying ? <Pause size={16} /> : <Play size={16} className="fill-current" />}
                    </button>

                    <div className="flex-1 min-w-0">
                      <h3 className="text-xs font-bold text-white truncate">{playingChannel.name}</h3>
                      <p className="text-[10px] text-cyan-400 font-medium truncate">{playingChannel.category || 'Local'}</p>
                    </div>

                    <div className="flex items-center gap-1">
                      <button onClick={toggleMute} className="p-2 rounded-lg bg-white/10 text-white hover:bg-white/20">
                        {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
                      </button>
                      <button onClick={handleFullscreen} className="p-2 rounded-lg bg-white/10 text-white hover:bg-white/20">
                        <Maximize size={15} />
                      </button>
                    </div>
                  </div>

                </div>

              </div>
            ) : (
              /* HERO BANNER CAROUSEL */
              <div key={currentHero.id || heroIndex} className="fade-in-hero relative w-full h-[360px] rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-slate-950 group">
                
                <div className="absolute inset-0 bg-gradient-to-b from-slate-900/40 via-slate-950/80 to-[#06090e] flex items-center justify-center p-8">
                  {currentHero.logo_url ? (
                    <img 
                      src={currentHero.logo_url} 
                      alt={currentHero.name} 
                      className="max-h-44 object-contain filter drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)] group-hover:scale-105 transition-transform duration-700"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-3xl font-black text-white shadow-xl shadow-cyan-500/20">
                      {currentHero.name.charAt(0)}
                    </div>
                  )}
                </div>
                
                <div className="absolute inset-0 bg-gradient-to-t from-[#06090e] via-[#06090e]/60 to-transparent" />

                {/* Dots Indicator */}
                <div className="absolute top-4 right-4 flex items-center gap-1.5 z-20">
                  {featuredChannels.map((_, idx) => (
                    <span 
                      key={idx} 
                      onClick={() => setHeroIndex(idx)}
                      className={`h-1.5 rounded-full transition-all cursor-pointer ${idx === heroIndex ? 'w-5 bg-cyan-400' : 'w-1.5 bg-white/30'}`} 
                    />
                  ))}
                </div>

                {/* Hero Info */}
                <div className="absolute bottom-0 inset-x-0 p-5 flex flex-col items-start z-10">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-400/40 backdrop-blur-md mb-2">
                    <Sparkles size={12} className="text-cyan-400" />
                    <span className="text-[10px] font-bold text-cyan-300 uppercase tracking-widest">
                      {currentHero.category || 'FEATURED LIVE TV'}
                    </span>
                  </div>

                  <h1 className="text-2xl font-black text-white tracking-tight leading-tight uppercase drop-shadow-md">
                    {currentHero.name}
                  </h1>

                  <p className="text-xs text-slate-300 line-clamp-2 mt-1 mb-4 font-normal">
                    {currentHero.description || 'Matangazo mubashara na vipindi vya hali ya juu.'}
                  </p>

                  <div className="flex items-center gap-3 w-full">
                    <button 
                      onClick={() => handlePlayChannel(currentHero)}
                      className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-black font-extrabold text-sm transition-all shadow-lg shadow-cyan-500/25 active:scale-95"
                    >
                      <Play size={16} className="fill-black" />
                      Watch Live
                    </button>

                    <button 
                      onClick={() => toggleMyList(currentHero.id)}
                      className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm backdrop-blur-md border border-white/10 transition-all active:scale-95"
                    >
                      {myList.includes(currentHero.id) ? <Check size={16} className="text-cyan-400" /> : <Plus size={16} />}
                      My List
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* CATEGORIES WITH CAROUSELS (HAKUNA DUPLICATED TEXT) */}
            {categoriesList.map((cat, idx) => {
              const catChannels = getChannelsByCategory(cat);
              if (catChannels.length === 0) return null;

              return (
                <div key={idx} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-extrabold text-white tracking-wide uppercase flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-cyan-400" />
                      {cat} Channels
                    </h2>
                    <span className="text-[11px] font-semibold text-cyan-400/80">Swipe &rarr;</span>
                  </div>

                  {/* Horizontal Scroll Row */}
                  <div className="flex items-center gap-3 overflow-x-auto scrollbar-none py-1">
                    {catChannels.map((channel) => (
                      <div 
                        key={channel.id} 
                        onClick={() => handlePlayChannel(channel)}
                        className={`w-40 shrink-0 glass-card rounded-2xl overflow-hidden group cursor-pointer border transition-all active:scale-95 ${playingChannel?.id === channel.id ? 'border-cyan-400 shadow-lg shadow-cyan-500/20 ring-2 ring-cyan-400/50' : 'border-white/5 hover:border-cyan-500/50'}`}
                      >
                        {/* Thumbnail Container */}
                        <div className="aspect-video w-full bg-slate-950 flex items-center justify-center relative p-2">
                          {channel.logo_url ? (
                            <img 
                              src={channel.logo_url} 
                              alt={channel.name} 
                              className="channel-logo-fix"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          
                          {/* Fallback Icon Badge (Haioneshi majina yaliyojirudia) */}
                          <div 
                            className={`w-12 h-12 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-indigo-500/20 border border-cyan-500/30 items-center justify-center ${channel.logo_url ? 'hidden' : 'flex'}`}
                          >
                            <Tv2 className="text-cyan-400" size={22} />
                          </div>

                          <span className={`absolute top-2 left-2 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${playingChannel?.id === channel.id ? 'bg-cyan-400 text-black' : 'bg-red-600 text-white'}`}>
                            {playingChannel?.id === channel.id ? 'PLAYING' : 'LIVE'}
                          </span>
                        </div>

                        {/* Card Title Section */}
                        <div className="p-2.5 bg-slate-900/60">
                          <h3 className="font-bold text-xs text-white truncate group-hover:text-cyan-300 transition-colors">{channel.name}</h3>
                          <p className="text-[10px] text-slate-400 truncate mt-0.5">{channel.category || 'Local'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

          </div>
        )}

        {/* ==================== TAB 2: DISCOVER ==================== */}
        {activeTab === 'discover' && (
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3.5 top-3 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Tafuta channel au category..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900/90 border border-white/10 rounded-2xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              {channels.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase())).map((channel) => (
                <div 
                  key={channel.id} 
                  onClick={() => handlePlayChannel(channel)}
                  className="glass-card rounded-2xl overflow-hidden cursor-pointer group border border-white/5 hover:border-cyan-500/50 transition-all"
                >
                  <div className="aspect-video w-full bg-slate-950 flex items-center justify-center relative p-2">
                    {channel.logo_url ? (
                      <img 
                        src={channel.logo_url} 
                        alt={channel.name} 
                        className="channel-logo-fix"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div className={`w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 items-center justify-center ${channel.logo_url ? 'hidden' : 'flex'}`}>
                      <Tv2 className="text-cyan-400" size={20} />
                    </div>
                  </div>
                  <div className="p-2.5 bg-slate-900/60">
                    <h3 className="font-bold text-xs text-white truncate">{channel.name}</h3>
                    <p className="text-[10px] text-slate-400 truncate mt-0.5">{channel.category || 'Local'}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ==================== TAB 3: LIVE TV ==================== */}
        {activeTab === 'live' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {channels.map((channel) => (
                <div 
                  key={channel.id} 
                  onClick={() => handlePlayChannel(channel)}
                  className="glass-card rounded-2xl overflow-hidden cursor-pointer group border border-white/5 hover:border-cyan-500/50 transition-all"
                >
                  <div className="aspect-video w-full bg-slate-950 flex items-center justify-center relative p-2">
                    {channel.logo_url ? (
                      <img 
                        src={channel.logo_url} 
                        alt={channel.name} 
                        className="channel-logo-fix"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div className={`w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 items-center justify-center ${channel.logo_url ? 'hidden' : 'flex'}`}>
                      <Tv2 className="text-cyan-400" size={20} />
                    </div>
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md text-[9px] font-black bg-red-600 text-white uppercase tracking-wider">
                      LIVE
                    </span>
                  </div>
                  <div className="p-2.5 bg-slate-900/60">
                    <h3 className="font-bold text-xs text-white truncate">{channel.name}</h3>
                    <p className="text-[10px] text-slate-400 truncate mt-0.5">{channel.category || 'Local'}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ==================== TAB 4: MY SPACE ==================== */}
        {activeTab === 'myspace' && (
          <div className="space-y-4">
            <div className="glass-card rounded-3xl p-5 text-center border border-white/10">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-cyan-400 to-blue-600 p-1 mx-auto mb-3">
                <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center font-extrabold text-xl text-cyan-400">
                  U
                </div>
              </div>
              <h2 className="font-bold text-lg text-white">KadoTV Dashboard</h2>
              <p className="text-xs text-slate-400 mt-1">Total Channels: {channels.length}</p>
            </div>

            <button 
              onClick={fetchSupabaseChannels}
              className="w-full py-3 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-bold text-xs flex items-center justify-center gap-2 hover:bg-cyan-500/20 transition-all"
            >
              <Radio size={16} /> Sync Database Channels
            </button>
          </div>
        )}

        {/* FOOTER */}
        <footer className="mt-12 pt-8 pb-12 border-t border-white/5 text-center text-slate-500 text-xs space-y-3">
          <div className="flex items-center justify-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-cyan-500 flex items-center justify-center text-black font-black text-xs">
              K
            </div>
            <span className="font-bold text-slate-300 text-sm">KadoTV Cinema</span>
          </div>
          <p className="text-[11px] text-slate-400">Pata matangazo mubashara ya channels zote za Tanzania na kimataifa 24/7.</p>
          <div className="flex items-center justify-center gap-4 text-[11px] text-cyan-400/80">
            <span>Privacy Policy</span>
            <span>•</span>
            <span>Terms of Service</span>
            <span>•</span>
            <span>Support</span>
          </div>
          <p className="text-[10px] text-slate-600 pt-2">&copy; 2026 KadoTV. Designed by techboytz. All Rights Reserved.</p>
        </footer>

      </main>

      {/* BOTTOM NAVIGATION BAR */}
      <nav className="fixed bottom-0 inset-x-0 z-50 glass-nav px-6 py-2.5 flex items-center justify-between max-w-md mx-auto">
        <button 
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'home' ? 'text-cyan-400 scale-105' : 'text-slate-500 hover:text-slate-300'}`}
        >
          <Home size={20} className={activeTab === 'home' ? 'drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]' : ''} />
          <span className="text-[10px] font-bold">Home</span>
        </button>

        <button 
          onClick={() => setActiveTab('discover')}
          className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'discover' ? 'text-cyan-400 scale-105' : 'text-slate-500 hover:text-slate-300'}`}
        >
          <Compass size={20} className={activeTab === 'discover' ? 'drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]' : ''} />
          <span className="text-[10px] font-bold">Discover</span>
        </button>

        <button 
          onClick={() => setActiveTab('live')}
          className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'live' ? 'text-cyan-400 scale-105' : 'text-slate-500 hover:text-slate-300'}`}
        >
          <Tv size={20} className={activeTab === 'live' ? 'drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]' : ''} />
          <span className="text-[10px] font-bold">Live TV</span>
        </button>

        <button 
          onClick={() => setActiveTab('myspace')}
          className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'myspace' ? 'text-cyan-400 scale-105' : 'text-slate-500 hover:text-slate-300'}`}
        >
          <User size={20} className={activeTab === 'myspace' ? 'drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]' : ''} />
          <span className="text-[10px] font-bold">My Space</span>
        </button>
      </nav>

    </div>
  );
}
