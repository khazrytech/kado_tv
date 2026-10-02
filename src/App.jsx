import React, { useState, useEffect } from 'react';
import { 
  Home, 
  Compass, 
  Tv, 
  User, 
  Play, 
  Plus, 
  Check, 
  Search, 
  Cast, 
  Bell, 
  ChevronRight, 
  X, 
  Radio, 
  Sparkles,
  Heart
} from 'lucide-react';

// Channel za Mwanzo (Default Channels) ili site isiwahi kubaki tupu!
const INITIAL_CHANNELS = [
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
    category: 'Local',
    description: 'Kituo cha burudani, muziki, filamu, maisha ya vijana na matukio ya sanaa.',
    stream_url: 'https://goliveafrica.media:9998/live/625965017ed70/index.m3u8',
    logo_url: 'https://upload.wikimedia.org/wikipedia/commons/4/46/ITV_Tanzania_logo.jpg',
    is_featured: false
  },
  {
    id: 'ch-5',
    name: 'Wasafi TV',
    category: 'Local',
    description: 'Kituo cha burudani cha Wasafi Media kinachorusha muziki, maisha ya wasanii na michezo.',
    stream_url: 'https://goliveafrica.media:9998/live/625965017ed71/index.m3u8',
    logo_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/TBC1_logo.png/320px-TBC1_logo.png',
    is_featured: false
  },
  {
    id: 'ch-6',
    name: 'EATV',
    category: 'Local',
    description: 'East Africa TV - Kituo cha vijana kinachorusha burudani, muziki na habari za Afrika Mashariki.',
    stream_url: 'https://goliveafrica.media:9998/live/625965017ed72/index.m3u8',
    logo_url: 'https://upload.wikimedia.org/wikipedia/commons/4/46/ITV_Tanzania_logo.jpg',
    is_featured: false
  }
];

export default function App() {
  const [activeTab, setActiveTab] = useState('home'); // home, discover, live, myspace
  const [channels, setChannels] = useState(INITIAL_CHANNELS);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [myList, setMyList] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [heroIndex, setHeroIndex] = useState(0);

  // Fetch Supabase via Direct REST Endpoint
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
      console.log('Using default local channels list:', err);
    }
  };

  // Categories zote
  const categories = ['All', 'Local', 'Sports', 'News', 'Entertainment'];

  // Hero Channels Filter
  const featuredChannels = channels.filter(c => c.is_featured).length > 0 
    ? channels.filter(c => c.is_featured) 
    : channels;

  // Auto Carousel ya Hero Section (kila sekunde 5)
  useEffect(() => {
    if (featuredChannels.length <= 1) return;
    const timer = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % featuredChannels.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [featuredChannels.length]);

  const currentHero = featuredChannels[heroIndex] || channels[0];

  const toggleMyList = (channelId) => {
    if (myList.includes(channelId)) {
      setMyList(myList.filter(id => id !== channelId));
    } else {
      setMyList([...myList, channelId]);
    }
  };

  // Channel Filtering
  const filteredChannels = channels.filter(c => {
    const matchesCat = selectedCategory === 'All' || (c.category && c.category.toLowerCase() === selectedCategory.toLowerCase());
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (c.category && c.category.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#080b11] text-slate-100 pb-24 font-sans selection:bg-cyan-500 selection:text-black">
      
      {/* 1. HEADER */}
      <header className="sticky top-0 z-40 bg-[#080b11]/90 backdrop-blur-xl border-b border-white/5 px-4 py-3 flex items-center justify-between">
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
            <div className="w-full h-full rounded-full bg-[#080b11] flex items-center justify-center text-xs font-bold text-cyan-400">
              U
            </div>
          </div>
        </div>
      </header>

      {/* VIDEO PLAYER MODAL */}
      {selectedChannel && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-2xl flex flex-col items-center justify-center p-4">
          <button 
            onClick={() => setSelectedChannel(null)}
            className="absolute top-4 right-4 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            <X size={24} />
          </button>
          <div className="w-full max-w-4xl aspect-video bg-black rounded-2xl overflow-hidden border border-white/10 shadow-2xl relative">
            <iframe 
              src={selectedChannel.stream_url} 
              title={selectedChannel.name}
              className="w-full h-full border-0"
              allow="autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
            />
          </div>
          <div className="mt-4 text-center max-w-xl">
            <h2 className="text-2xl font-bold text-white">{selectedChannel.name}</h2>
            <p className="text-sm text-slate-400 mt-1">{selectedChannel.description || 'Matangazo Mubashara'}</p>
          </div>
        </div>
      )}

      {/* MAIN CONTENT CONTAINER */}
      <main className="max-w-md mx-auto px-4 pt-3">

        {/* ==================== TAB 1: HOME ==================== */}
        {activeTab === 'home' && (
          <div className="space-y-6">

            {/* HERO ANIMATED BANNER */}
            <div key={currentHero.id || heroIndex} className="fade-in-hero relative w-full h-[360px] rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-slate-950 group">
              
              <div className="absolute inset-0 bg-gradient-to-b from-slate-900/40 via-slate-950/80 to-[#080b11] flex items-center justify-center p-8">
                {currentHero.logo_url && (
                  <img 
                    src={currentHero.logo_url} 
                    alt={currentHero.name} 
                    className="max-h-44 object-contain filter drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)] group-hover:scale-105 transition-transform duration-700"
                  />
                )}
              </div>
              
              <div className="absolute inset-0 bg-gradient-to-t from-[#080b11] via-[#080b11]/60 to-transparent" />

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

              {/* Banner Info */}
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
                    onClick={() => setSelectedChannel(currentHero)}
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

            {/* ALL LIVE CHANNELS GRID */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold text-white tracking-wide uppercase">All Live Channels</h2>
                <button onClick={() => setActiveTab('live')} className="text-xs font-semibold text-cyan-400 hover:underline flex items-center gap-0.5">
                  See all <ChevronRight size={14} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {channels.map((channel) => (
                  <div 
                    key={channel.id} 
                    onClick={() => setSelectedChannel(channel)}
                    className="glass-card rounded-2xl overflow-hidden group cursor-pointer border border-white/5 hover:border-cyan-500/50 transition-all"
                  >
                    <div className="aspect-video w-full bg-slate-950 flex items-center justify-center relative p-2">
                      <img 
                        src={channel.logo_url} 
                        alt={channel.name} 
                        className="channel-logo-fix"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md text-[9px] font-black bg-red-600 text-white uppercase tracking-wider">
                        LIVE
                      </span>
                    </div>
                    <div className="p-2.5">
                      <h3 className="font-bold text-xs text-white truncate group-hover:text-cyan-300 transition-colors">{channel.name}</h3>
                      <p className="text-[10px] text-slate-400 truncate mt-0.5">{channel.category || 'Local'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

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

            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              {categories.map((cat, idx) => (
                <button 
                  key={idx} 
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${selectedCategory === cat ? 'bg-cyan-400 text-black shadow-lg shadow-cyan-400/20' : 'bg-slate-900 text-slate-300 border border-white/10 hover:bg-slate-800'}`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3">
              {filteredChannels.map((channel) => (
                <div 
                  key={channel.id} 
                  onClick={() => setSelectedChannel(channel)}
                  className="glass-card rounded-2xl overflow-hidden cursor-pointer group border border-white/5 hover:border-cyan-500/50 transition-all"
                >
                  <div className="aspect-video w-full bg-slate-950 flex items-center justify-center relative p-2">
                    <img 
                      src={channel.logo_url} 
                      alt={channel.name} 
                      className="channel-logo-fix"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  </div>
                  <div className="p-2.5">
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
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {categories.map((cat, i) => (
                <button 
                  key={i} 
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${selectedCategory === cat ? 'bg-cyan-400 text-black' : 'bg-slate-900 text-slate-300 border border-white/10'}`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3">
              {filteredChannels.map((channel) => (
                <div 
                  key={channel.id} 
                  onClick={() => setSelectedChannel(channel)}
                  className="glass-card rounded-2xl overflow-hidden cursor-pointer group border border-white/5 hover:border-cyan-500/50 transition-all"
                >
                  <div className="aspect-video w-full bg-slate-950 flex items-center justify-center relative p-2">
                    <img 
                      src={channel.logo_url} 
                      alt={channel.name} 
                      className="channel-logo-fix"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md text-[9px] font-black bg-red-600 text-white uppercase tracking-wider">
                      LIVE
                    </span>
                  </div>
                  <div className="p-2.5">
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

      </main>

      {/* 5. BOTTOM NAVIGATION BAR */}
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
