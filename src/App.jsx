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
  Shield,
  Trash2,
  Edit,
  Heart
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

// Supabase Configuration
const SUPABASE_URL = 'https://fqixivwmtggpuftrnxxq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZxaXhpd3dtdGdncHVmdHJueHhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEyMDI3MjMsImV4cCI6MjA1Njc3ODcyM30.4sI6Uo7Q4oQWb4a9G02pW4z_c3-Yg-3hX1b9_p4mX4';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default function App() {
  const [activeTab, setActiveTab] = useState('home'); // home, discover, live, myspace
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [myList, setMyList] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Continue Watching Mock Data
  const continueWatching = [
    {
      id: 'cw-1',
      title: 'THE NEURAL NET',
      episode: 'S2:E4',
      progress: 45,
      image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=600&auto=format&fit=crop'
    },
    {
      id: 'cw-2',
      title: 'QUANTUM DRIFT',
      episode: 'S1:E8',
      progress: 70,
      image: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=600&auto=format&fit=crop'
    }
  ];

  // Fetch Channels kutoka Supabase
  useEffect(() => {
    fetchChannels();
  }, []);

  const fetchChannels = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('channels').select('*');
      if (error) throw error;
      setChannels(data || []);
    } catch (err) {
      console.error('Error fetching channels:', err);
    } finally {
      setLoading(false);
    }
  };

  // Channel inayoonyeshwa kwenye Hero Banner
  const featuredChannel = channels.find(c => c.is_featured) || channels[0] || {
    name: 'QUANTUM HORIZON 2088',
    category: 'Sci-Fi • Cyberpunk',
    description: 'The Future is Now. Surrender to the digital realm of hyper-tech dominance.',
    logo_url: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=800&auto=format&fit=crop'
  };

  const toggleMyList = (channelId) => {
    if (myList.includes(channelId)) {
      setMyList(myList.filter(id => id !== channelId));
    } else {
      setMyList([...myList, channelId]);
    }
  };

  const filteredChannels = channels.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.category && c.category.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-[#080b11] text-slate-100 pb-24 font-sans selection:bg-cyan-500 selection:text-black">
      
      {/* 1. TOP HEADER */}
      <header className="sticky top-0 z-40 bg-[#080b11]/90 backdrop-blur-xl border-b border-white/5 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-purple-600 flex items-center justify-center font-black text-white text-lg shadow-lg shadow-cyan-500/20">
            K
          </div>
          <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white via-cyan-200 to-cyan-400 bg-clip-text text-transparent">
            Tech TV
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
            <p className="text-sm text-slate-400 mt-1">{selectedChannel.description || 'Live Tanzanian Stream'}</p>
          </div>
        </div>
      )}

      {/* MAIN CONTAINER */}
      <main className="max-w-md mx-auto px-4 pt-3">

        {/* ==================== TAB 1: HOME ==================== */}
        {activeTab === 'home' && (
          <div className="space-y-6">

            {/* HERO BANNER */}
            <div className="relative w-full h-[360px] rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-slate-900 group">
              <img 
                src={featuredChannel.logo_url || "https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=800&auto=format&fit=crop"} 
                alt="Featured" 
                className="w-full h-full object-cover object-center filter brightness-90 group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#080b11] via-[#080b11]/50 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#080b11] via-transparent to-transparent" />

              <div className="absolute bottom-0 inset-x-0 p-5 flex flex-col items-start z-10">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-400/40 backdrop-blur-md mb-2">
                  <Sparkles size={12} className="text-cyan-400" />
                  <span className="text-[10px] font-bold text-cyan-300 uppercase tracking-widest">
                    4K ULTRA HD • DOLBY ATMOS
                  </span>
                </div>

                <h1 className="text-2xl font-black text-white tracking-tight leading-tight uppercase drop-shadow-md">
                  {featuredChannel.name}
                </h1>

                <p className="text-xs text-slate-300 line-clamp-2 mt-1 mb-4 font-normal">
                  {featuredChannel.description || 'Sci-Fi • Cyberpunk | The Future is Now. Surrender to the digital realm.'}
                </p>

                <div className="flex items-center gap-3 w-full">
                  <button 
                    onClick={() => setSelectedChannel(featuredChannel)}
                    className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-black font-extrabold text-sm transition-all shadow-lg shadow-cyan-500/25 active:scale-95"
                  >
                    <Play size={16} className="fill-black" />
                    Watch Now
                  </button>

                  <button 
                    onClick={() => toggleMyList(featuredChannel.id || 'feat')}
                    className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm backdrop-blur-md border border-white/10 transition-all active:scale-95"
                  >
                    {myList.includes(featuredChannel.id || 'feat') ? <Check size={16} className="text-cyan-400" /> : <Plus size={16} />}
                    My List
                  </button>
                </div>
              </div>
            </div>

            {/* CONTINUE WATCHING */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold text-white tracking-wide uppercase">Continue Watching</h2>
                <button className="text-xs font-semibold text-cyan-400 hover:underline flex items-center gap-0.5">
                  See all <ChevronRight size={14} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {continueWatching.map((item) => (
                  <div key={item.id} className="glass-card rounded-2xl overflow-hidden group cursor-pointer border border-white/5 hover:border-cyan-500/40 transition-all">
                    <div className="relative aspect-video w-full overflow-hidden bg-slate-900">
                      <img src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="w-9 h-9 rounded-full bg-cyan-400 text-black flex items-center justify-center shadow-lg">
                          <Play size={16} className="fill-black ml-0.5" />
                        </div>
                      </div>
                      <div className="absolute bottom-0 inset-x-0 h-1 bg-white/20">
                        <div className="h-full bg-cyan-400" style={{ width: `${item.progress}%` }} />
                      </div>
                    </div>
                    <div className="p-2.5">
                      <h3 className="text-xs font-bold text-white truncate">{item.title}</h3>
                      <p className="text-[10px] text-slate-400 mt-0.5">{item.episode} • {item.progress}%</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* TRENDING CHANNELS */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold text-white tracking-wide uppercase">Trending Tech Originals</h2>
              </div>

              {loading ? (
                <div className="text-center py-8 text-xs text-slate-500">Inapakia channels kutoka Supabase...</div>
              ) : (
                <div className="space-y-3">
                  {channels.slice(0, 3).map((channel, index) => (
                    <div 
                      key={channel.id} 
                      onClick={() => setSelectedChannel(channel)}
                      className="glass-card rounded-2xl p-3 flex items-center gap-4 cursor-pointer hover:border-cyan-500/50 transition-all group relative overflow-hidden"
                    >
                      <span className="text-3xl font-black italic text-cyan-400/40 group-hover:text-cyan-400 transition-colors w-6 text-center">
                        {index + 1}
                      </span>

                      <div className="w-16 h-12 bg-slate-950/80 rounded-xl overflow-hidden border border-white/10 flex items-center justify-center shrink-0">
                        <img 
                          src={channel.logo_url} 
                          alt={channel.name} 
                          className="channel-logo-fix"
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-sm text-white truncate group-hover:text-cyan-300 transition-colors">
                          {channel.name}
                        </h3>
                        <p className="text-xs text-slate-400 truncate mt-0.5">
                          {channel.description || channel.category || 'Local Channel'}
                        </p>
                      </div>

                      <div className="w-8 h-8 rounded-full bg-cyan-500/10 text-cyan-400 flex items-center justify-center shrink-0 group-hover:bg-cyan-400 group-hover:text-black transition-all">
                        <Play size={14} className="fill-current" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
                placeholder="Search channels, movies, genres..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900/90 border border-white/10 rounded-2xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              {['Sci-Fi', 'Cyberpunk', 'Robotics & AI', 'Space Odyssey', 'Local News', 'Sports'].map((genre, idx) => (
                <div key={idx} className="h-20 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 border border-white/10 p-3 flex items-end justify-between cursor-pointer hover:border-cyan-400 transition-all">
                  <span className="font-bold text-sm text-white">{genre}</span>
                  <Compass className="text-cyan-400/40" size={20} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ==================== TAB 3: LIVE & SPORTS ==================== */}
        {activeTab === 'live' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {['All Live', 'Local TV', 'News', 'Sports'].map((cat, i) => (
                <button key={i} className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap ${i === 0 ? 'bg-cyan-400 text-black' : 'bg-slate-900 text-slate-300 border border-white/10'}`}>
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
              <h2 className="font-bold text-lg text-white">Tech TV Admin</h2>
              <p className="text-xs text-slate-400 mt-1">Supabase ID: fqixivwmtggpuftrnxxq</p>
            </div>

            <button 
              onClick={fetchChannels}
              className="w-full py-3 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-bold text-xs flex items-center justify-center gap-2"
            >
              <Radio size={16} /> Refresh Channels Database
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
          <span className="text-[10px] font-bold">Live & Sports</span>
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
