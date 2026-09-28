import React, { useEffect, useMemo, useState } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import {
  Bell, Bookmark, Film, Home, LogOut, Menu, Play, Search, Settings,
  Shield, Tv, User, X, LayoutDashboard, Users, Plus, Trash2, Pencil,
  Ban, CheckCircle2, ChevronRight
} from "lucide-react";
import { supabase } from "./lib/supabase";
import {
  getProfile, getChannels, getMovies, getSeries, getFeaturedChannels,
  getCategories, toggleFavorite, isFavorite, saveWatch,
  adminList, adminUpsert, adminDelete, adminUpdateUser
} from "./lib/api";
import Auth from "./pages/Auth";
import Player from "./components/Player";

function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!alive) return;
      setSession(data.session);
      if (data.session?.user) {
        try { setProfile(await getProfile(data.session.user.id)); } catch {}
      }
      setLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, next) => {
      setSession(next);
      if (next?.user) {
        try { setProfile(await getProfile(next.user.id)); } catch {}
      } else setProfile(null);
    });
    return () => { alive = false; listener.subscription.unsubscribe(); };
  }, []);

  if (loading) return <Splash />;

  return (
    <Routes>
      <Route path="/auth" element={session ? <Navigate to="/" replace /> : <Auth />} />
      <Route path="*" element={
        session ? <Shell session={session} profile={profile} setProfile={setProfile} /> : <Navigate to="/auth" replace />
      } />
    </Routes>
  );
}

function Splash() {
  return <div className="splash"><div className="brand-mark">K</div><strong>KadoTV</strong><span>Loading your entertainment…</span></div>;
}

function Shell({ session, profile, setProfile }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileNav, setMobileNav] = useState(false);
  const admin = profile?.role === "admin";

  const nav = [
    ["/", "Home", Home],
    ["/channels", "Channels", Tv],
    ["/movies", "Movies", Film],
    ["/series", "Series", Bookmark],
    ["/search", "Search", Search],
    ["/profile", "Profile", User],
    ...(admin ? [["/admin", "Admin", Shield]] : [])
  ];

  async function logout() {
    await supabase.auth.signOut();
    navigate("/auth");
  }

  return (
    <div className="app-shell">
      <aside className={"sidebar " + (mobileNav ? "open" : "")}>
        <div className="logo"><span className="logo-icon">K</span><span>KadoTV</span></div>
        <nav>
          {nav.map(([path, label, Icon]) => (
            <button key={path} className={location.pathname === path ? "nav-item active" : "nav-item"} onClick={() => {navigate(path); setMobileNav(false);}}>
              <Icon size={19}/><span>{label}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <button className="nav-item" onClick={() => navigate("/settings")}><Settings size={19}/><span>Settings</span></button>
          <button className="nav-item logout" onClick={logout}><LogOut size={19}/><span>Sign out</span></button>
        </div>
      </aside>

      {mobileNav && <div className="scrim" onClick={() => setMobileNav(false)} />}

      <main className="main">
        <header className="topbar">
          <button className="icon-btn mobile-menu" onClick={() => setMobileNav(true)}><Menu/></button>
          <button className="mobile-logo" onClick={() => navigate("/")}><span>K</span>KadoTV</button>
          <div className="top-search" onClick={() => navigate("/search")}><Search size={18}/><span>Search channels, movies & series</span></div>
          <div className="top-actions">
            <button className="icon-btn"><Bell size={19}/></button>
            <button className="avatar" onClick={() => navigate("/profile")}>{(profile?.display_name || session.user.email || "U").slice(0,1).toUpperCase()}</button>
          </div>
        </header>
        <div className="page">
          <Routes>
            <Route path="/" element={<HomePage session={session} />} />
            <Route path="/channels" element={<ChannelsPage session={session} />} />
            <Route path="/movies" element={<MoviesPage session={session} />} />
            <Route path="/series" element={<SeriesPage session={session} />} />
            <Route path="/search" element={<SearchPage session={session} />} />
            <Route path="/profile" element={<ProfilePage session={session} profile={profile} setProfile={setProfile} />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/watch/:type/:id" element={<WatchPage session={session} />} />
            <Route path="/admin" element={admin ? <AdminPage /> : <Navigate to="/" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

function useData(loader, deps=[]) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    let ok = true;
    setLoading(true);
    loader().then(v => ok && setData(v)).catch(e => ok && setError(e.message || "Unable to load")).finally(() => ok && setLoading(false));
    return () => { ok = false; };
  }, deps);
  return {data, loading, error, setData};
}

function HomePage({session}) {
  const channels = useData(getChannels);
  const movies = useData(getMovies);
  const series = useData(getSeries);
  const featured = useData(getFeaturedChannels);
  const hero = featured.data[0];

  return <div className="home">
    {hero ? <Hero item={hero} type="channel"/> : <EmptyHero/>}
    <Section title="Live Channels" action="/channels"><CardRow items={channels.data.slice(0,8)} type="channel" session={session}/></Section>
    <Section title="Movies" action="/movies"><CardRow items={movies.data.slice(0,8)} type="movie" session={session}/></Section>
    <Section title="Series" action="/series"><CardRow items={series.data.slice(0,8)} type="series" session={session}/></Section>
    {(channels.loading || movies.loading || series.loading) && <div className="loading-line">Loading your library…</div>}
  </div>;
}

function EmptyHero() {
  return <div className="hero empty"><div><span className="eyebrow">KadoTV</span><h1>Your streaming library.</h1><p>Add your real channels, movies and series from the admin panel to start filling KadoTV.</p></div></div>;
}

function Hero({item, type}) {
  const navigate = useNavigate();
  return <div className="hero" style={{backgroundImage: `linear-gradient(90deg, rgba(5,6,10,.96), rgba(5,6,10,.55), rgba(5,6,10,.1)), url("${item.backdrop_url || item.logo_url || ""}")`}}>
    <div className="hero-content">
      <span className="eyebrow">FEATURED</span>
      <h1>{item.name || item.title}</h1>
      <p>{item.description || "Watch now on KadoTV."}</p>
      <button className="primary-btn" onClick={() => navigate(`/watch/${type}/${item.id}`)}><Play size={17} fill="currentColor"/> Watch now</button>
    </div>
  </div>;
}

function Section({title, action, children}) {
  const navigate = useNavigate();
  return <section className="section"><div className="section-head"><h2>{title}</h2><button onClick={() => navigate(action)}>See all <ChevronRight size={16}/></button></div>{children}</section>;
}

function CardRow({items, type, session}) {
  if (!items.length) return <div className="empty-row">No content has been added yet.</div>;
  return <div className="card-row">{items.map(item => <ContentCard key={item.id} item={item} type={type} session={session}/>)}</div>;
}

function ContentCard({item, type, session}) {
  const navigate = useNavigate();
  const [fav, setFav] = useState(false);
  useEffect(() => { if (session?.user) isFavorite(session.user.id, type, item.id).then(setFav).catch(()=>{}); }, [session?.user?.id, type, item.id]);
  async function favIt(e) {
    e.stopPropagation();
    try { setFav(await toggleFavorite(session.user.id, type, item.id)); } catch {}
  }
  const title = item.name || item.title;
  return <article className="content-card" onClick={() => navigate(`/watch/${type}/${item.id}`)}>
    <div className="poster">
      {item.poster_url || item.logo_url ? <img src={item.poster_url || item.logo_url} alt="" /> : <div className="poster-fallback">{title?.slice(0,1)}</div>}
      <button className={"fav-mini " + (fav ? "liked" : "")} onClick={favIt}>{fav ? "♥" : "♡"}</button>
      <div className="poster-overlay"><Play size={20} fill="currentColor"/></div>
    </div>
    <div className="card-title">{title}</div>
    <div className="card-meta">{item.category || item.release_year || (type === "channel" ? "LIVE" : "")}</div>
  </article>;
}

function ChannelsPage({session}) {
  const {data, loading} = useData(getChannels);
  return <LibraryPage title="Live Channels" subtitle="Your live streaming channels" items={data} loading={loading} type="channel" session={session}/>;
}
function MoviesPage({session}) {
  const {data, loading} = useData(getMovies);
  return <LibraryPage title="Movies" subtitle="Movies available in your KadoTV library" items={data} loading={loading} type="movie" session={session}/>;
}
function SeriesPage({session}) {
  const {data, loading} = useData(getSeries);
  return <LibraryPage title="Series" subtitle="Series and episodic content" items={data} loading={loading} type="series" session={session}/>;
}
function LibraryPage({title, subtitle, items, loading, type, session}) {
  return <div><div className="page-heading"><h1>{title}</h1><p>{subtitle}</p></div>{loading ? <div className="loading-line">Loading…</div> : items.length ? <div className="grid">{items.map(i=><ContentCard key={i.id} item={i} type={type} session={session}/>)}</div> : <EmptyState/>}</div>;
}
function EmptyState(){ return <div className="empty-state"><Tv size={32}/><h3>Nothing here yet</h3><p>Content added from the KadoTV admin panel will appear here.</p></div>; }

function SearchPage({session}) {
  const channels = useData(getChannels), movies = useData(getMovies), series = useData(getSeries);
  const [q,setQ] = useState("");
  const all = useMemo(()=>[
    ...channels.data.map(x=>({...x,_type:"channel"})),
    ...movies.data.map(x=>({...x,_type:"movie"})),
    ...series.data.map(x=>({...x,_type:"series"}))
  ],[channels.data,movies.data,series.data]);
  const results = all.filter(x=>(x.name||x.title||"").toLowerCase().includes(q.toLowerCase()));
  return <div><div className="page-heading"><h1>Search</h1><p>Find something to watch.</p></div><div className="search-box"><Search/><input autoFocus value={q} onChange={e=>setQ(e.target.value)} placeholder="Search…"/></div>{q ? <div className="grid">{results.map(i=><ContentCard key={i._type+i.id} item={i} type={i._type} session={session}/>)}</div> : <div className="empty-state"><Search size={32}/><h3>Start searching</h3><p>Search across channels, movies and series.</p></div>}</div>;
}

function ProfilePage({session, profile, setProfile}) {
  const [name,setName]=useState(profile?.display_name||"");
  async function save(){
    const {data,error}=await supabase.from("profiles").update({display_name:name}).eq("id",session.user.id).select().single();
    if(!error) setProfile(data);
  }
  return <div className="settings-page"><div className="page-heading"><h1>Your Profile</h1><p>Manage your KadoTV account.</p></div><div className="panel profile-panel"><div className="big-avatar">{(name||session.user.email).slice(0,1).toUpperCase()}</div><div className="profile-info"><label>Display name</label><input value={name} onChange={e=>setName(e.target.value)} placeholder="Your name"/><label>Email</label><input value={session.user.email} disabled/><button className="primary-btn" onClick={save}>Save profile</button></div></div></div>;
}

function SettingsPage(){ return <div className="settings-page"><div className="page-heading"><h1>Settings</h1><p>KadoTV preferences.</p></div><div className="panel"><div className="setting-row"><div><b>Account security</b><span>Authentication is handled by Supabase.</span></div><Shield size={20}/></div><div className="setting-row"><div><b>Streaming</b><span>Use the highest quality available from each source.</span></div><Tv size={20}/></div></div></div>; }

function WatchPage({session}) {
  const {type,id}=useParamsSafe();
  const [item,setItem]=useState(null), [loading,setLoading]=useState(true);
  useEffect(()=>{(async()=>{try{
    const table=type==="channel"?"channels":type==="movie"?"movies":"series";
    const {data}=await supabase.from(table).select("*").eq("id",id).single();
    setItem(data);
  }finally{setLoading(false)}})()},[type,id]);
  if(loading) return <div className="loading-line">Loading player…</div>;
  if(!item) return <EmptyState/>;
  return <div className="watch-page"><Player src={item.stream_url} poster={item.backdrop_url||item.poster_url||item.logo_url} live={type==="channel"} onProgress={(p,d)=>saveWatch(session.user.id,type,id,p,d).catch(()=>{})}/><div className="watch-info"><span className="eyebrow">{type==="channel"?"LIVE":type.toUpperCase()}</span><h1>{item.name||item.title}</h1><p>{item.description||"No description has been added."}</p></div></div>;
}
function useParamsSafe(){ const location=useLocation(); const parts=location.pathname.split("/").filter(Boolean); return {type:parts[1],id:parts[2]}; }

function AdminPage(){
  const [tab,setTab]=useState("channels");
  const tabs={channels:"channels",movies:"movies",series:"series",users:"profiles",categories:"categories"};
  return <div><div className="page-heading"><h1>Admin</h1><p>Manage the real KadoTV library and users.</p></div><div className="admin-tabs">{Object.keys(tabs).map(x=><button className={tab===x?"active":""} onClick={()=>setTab(x)} key={x}>{x}</button>)}</div><AdminManager table={tabs[tab]} kind={tab}/></div>;
}

function AdminManager({table,kind}){
  const [rows,setRows]=useState([]), [loading,setLoading]=useState(true), [editing,setEditing]=useState(null);
  async function load(){setLoading(true);try{setRows(await adminList(table));}catch(e){alert(e.message)}finally{setLoading(false)}}
  useEffect(()=>{load()},[table]);
  async function remove(id){if(!confirm("Delete this item?"))return;try{await adminDelete(table,id);load()}catch(e){alert(e.message)}}
  async function save(row){try{await adminUpsert(table,row);setEditing(null);load()}catch(e){alert(e.message)}}
  if(kind==="users") return <UsersManager rows={rows} reload={load}/>;
  return <div className="admin-panel"><div className="admin-toolbar"><b>{rows.length} records</b><button className="primary-btn" onClick={()=>setEditing({})}><Plus size={16}/> Add</button></div>{loading?<div className="loading-line">Loading…</div>:<div className="admin-list">{rows.map(r=><div className="admin-row" key={r.id}><div className="admin-thumb">{r.logo_url||r.poster_url?<img src={r.logo_url||r.poster_url} alt=""/>:<span>{(r.name||r.title||"C").slice(0,1)}</span>}</div><div className="admin-main"><b>{r.name||r.title}</b><small>{r.category||r.status||""}</small></div><button className="icon-btn" onClick={()=>setEditing(r)}><Pencil size={16}/></button><button className="icon-btn danger" onClick={()=>remove(r.id)}><Trash2 size={16}/></button></div>)}</div>}{editing!==null&&<EditModal table={table} kind={kind} row={editing} close={()=>setEditing(null)} save={save}/>}</div>;
}

function UsersManager({rows,reload}){
  async function change(id,status){try{await adminUpdateUser(id,status);reload()}catch(e){alert(e.message)}}
  return <div className="admin-panel"><div className="admin-toolbar"><b>{rows.length} users</b></div><div className="admin-list">{rows.map(r=><div className="admin-row" key={r.id}><div className="admin-thumb"><span>{(r.display_name||r.email||"U").slice(0,1)}</span></div><div className="admin-main"><b>{r.display_name||"Unnamed user"}</b><small>{r.email} · {r.status}</small></div>{r.status==="blocked"?<button className="small-btn" onClick={()=>change(r.id,"active")}><CheckCircle2 size={15}/> Unblock</button>:<button className="small-btn danger" onClick={()=>change(r.id,"blocked")}><Ban size={15}/> Block</button>}</div>)}</div></div>;
}

function EditModal({table,kind,row,close,save}){
  const [form,setForm]=useState(row);
  const fields=kind==="channels"
    ? ["name","description","logo_url","backdrop_url","stream_url","category","is_featured","sort_order"]
    : kind==="movies"
    ? ["title","description","poster_url","backdrop_url","stream_url","category","release_year","duration_minutes","is_featured"]
    : kind==="series"
    ? ["title","description","poster_url","backdrop_url","category","release_year","is_featured"]
    : ["name"];
  function set(k,v){setForm(x=>({...x,[k]:v}))}
  return <div className="modal-backdrop"><div className="modal"><div className="modal-head"><h2>{row.id?"Edit":"Add"} {kind.slice(0,-1)}</h2><button className="icon-btn" onClick={close}><X/></button></div>{fields.map(f=><label className="field" key={f}>{f}<input type={typeof row[f]==="boolean"?"checkbox":"text"} checked={typeof form[f]==="boolean"?form[f]:undefined} value={typeof form[f]==="boolean"?"":form[f]??""} onChange={e=>set(f,typeof row[f]==="boolean"?e.target.checked:e.target.value)}/></label>)}<div className="modal-actions"><button className="ghost-btn" onClick={close}>Cancel</button><button className="primary-btn" onClick={()=>save(form)}>Save</button></div></div></div>;
}

export default App;
