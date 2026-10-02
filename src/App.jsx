import React, { useEffect, useMemo, useState } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import {
  Bell, Bookmark, Film, Home, LogOut, Menu, Play, Search, Settings,
  Shield, Tv, User, X, Pencil, Trash2, Ban, CheckCircle2, ChevronRight,
  Radio, Clapperboard, Layers3, Trophy, Baby, Sparkles
} from "lucide-react";
import { supabase } from "./lib/supabase";
import {
  getProfile, getChannels, getMovies, getSeries, getFeaturedChannels,
  toggleFavorite, isFavorite, saveWatch,
  adminList, adminUpsert, adminDelete, adminUpdateUser
} from "./lib/api";
// TEMPORARILY DISABLED AUTH
// import Auth, { ResetPassword } from "./pages/Auth";
import Player from "./components/Player";

function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadProfile = async (user) => {
      if (!user) {
        if (mounted) setProfile(null);
        return;
      }

      try {
        const p = await getProfile(user.id);
        if (mounted) setProfile(p);
      } catch {
        if (mounted) setProfile(null);
      }
    };

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (!mounted) return;

      setSession(nextSession);

      if (nextSession?.user) {
        setTimeout(() => {
          loadProfile(nextSession.user);
        }, 0);
      } else {
        setProfile(null);
      }

      if (
        event === "INITIAL_SESSION" ||
        event === "SIGNED_IN" ||
        event === "TOKEN_REFRESHED" ||
        event === "SIGNED_OUT"
      ) {
        setLoading(false);
      }
    });

    supabase.auth.getSession().then(({ data, error }) => {
      if (!mounted) return;

      if (!error && data?.session) {
        setSession(data.session);
        loadProfile(data.session.user);
      }

      setLoading(false);
    });

    const safetyTimer = setTimeout(() => {
      if (mounted) setLoading(false);
    }, 5000);

    return () => {
      mounted = false;
      clearTimeout(safetyTimer);
      subscription.unsubscribe();
    };
  }, []);

  if (loading) return <Splash />;

  // AUTH TEMPORARILY DISABLED
  // Auth and ResetPassword are kept above for later re-enable.
  // <Route path="/auth" element={<Auth />} />
  // <Route path="/reset-password" element={<ResetPassword />} />

  // Temporary guest session so the existing UI can work
  // without forcing login.
  const guestSession = session || {
    user: {
      id: null,
      email: ""
    }
  };

  return (
    <Routes>
      <Route
        path="*"
        element={
          <Shell
            session={guestSession}
            profile={profile}
            setProfile={setProfile}
          />
        }
      />
    </Routes>
  );
}

function Splash() {
  return (
    <div className="splash">
      <div className="brand-mark">K</div>
      <strong>KadoTV</strong>
      <span>Loading your entertainment…</span>
    </div>
  );
}

function Shell({ session, profile, setProfile }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileNav, setMobileNav] = useState(false);
  // TEMPORARY ADMIN ACCESS
  // Authentication will be restored later.
  const admin = true;

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
        <div className="logo">
          <span className="logo-icon">K</span>
          <span>KadoTV</span>
        </div>

        <nav>
          {nav.map(([path, label, Icon]) => (
            <button
              key={path}
              className={
                location.pathname === path
                  ? "nav-item active"
                  : "nav-item"
              }
              onClick={() => {
                navigate(path);
                setMobileNav(false);
              }}
            >
              <Icon size={19} />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <button
            className="nav-item"
            onClick={() => navigate("/settings")}
          >
            <Settings size={19} />
            <span>Settings</span>
          </button>

          <button
            className="nav-item logout"
            onClick={logout}
          >
            <LogOut size={19} />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {mobileNav && (
        <div
          className="scrim"
          onClick={() => setMobileNav(false)}
        />
      )}

      <main className="main">
        <header className="topbar">
          <button
            className="icon-btn mobile-menu"
            onClick={() => setMobileNav(true)}
          >
            <Menu />
          </button>

          <button
            className="mobile-logo"
            onClick={() => navigate("/")}
          >
            <span>K</span>KadoTV
          </button>

          <div
            className="top-search"
            onClick={() => navigate("/search")}
          >
            <Search size={18} />
            <span>Search channels, movies & series</span>
          </div>

          <div className="top-actions">
            <button className="icon-btn">
              <Bell size={19} />
            </button>

            <button
              className="avatar"
              onClick={() => navigate("/profile")}
            >
              {(profile?.display_name ||
                session.user.email ||
                "U")
                .slice(0, 1)
                .toUpperCase()}
            </button>
          </div>
        </header>

        <div className="page">
          <Routes>
            <Route
              path="/"
              element={<HomePage session={session} />}
            />

            <Route
              path="/channels"
              element={<ChannelsPage session={session} />}
            />

            <Route
              path="/movies"
              element={<MoviesPage session={session} />}
            />

            <Route
              path="/series"
              element={<SeriesPage session={session} />}
            />

            <Route
              path="/search"
              element={<SearchPage session={session} />}
            />

            <Route
              path="/profile"
              element={
                <ProfilePage
                  session={session}
                  profile={profile}
                  setProfile={setProfile}
                />
              }
            />

            <Route
              path="/settings"
              element={<SettingsPage />}
            />

            <Route
              path="/watch/:type/:id"
              element={<WatchPage session={session} />}
            />

            {/* TEMPORARY: Admin accessible without login */}
            <Route
              path="/admin"
              element={<AdminPage />}
            />

            <Route
              path="*"
              element={<Navigate to="/" replace />}
            />
          </Routes>
        </div>
      </main>
    </div>
  );
}

function useData(loader, deps = []) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let ok = true;

    setLoading(true);

    loader()
      .then(v => ok && setData(v))
      .catch(e => ok && setError(e.message || "Unable to load"))
      .finally(() => ok && setLoading(false));

    return () => {
      ok = false;
    };
  }, deps);

  return {
    data,
    loading,
    error,
    setData
  };
}

function HomePage({ session }) {
  const channels = useData(getChannels);
  const movies = useData(getMovies);
  const series = useData(getSeries);
  const featured = useData(getFeaturedChannels);

  const [slide, setSlide] = useState(0);

  const channelItems = channels.data || [];
  const movieItems = movies.data || [];
  const seriesItems = series.data || [];
  const featuredItems = featured.data || [];

  useEffect(() => {
    if (featuredItems.length <= 1) return;

    const timer = setInterval(() => {
      setSlide((current) => (current + 1) % featuredItems.length);
    }, 6500);

    return () => clearInterval(timer);
  }, [featuredItems.length]);

  useEffect(() => {
    if (slide >= featuredItems.length && featuredItems.length) {
      setSlide(0);
    }
  }, [slide, featuredItems.length]);

  return (
    <div className="kado-home">

      {/* HERO */}
      <section className="kado-hero">
        <HomeHeroSlider
          items={featuredItems}
          index={slide}
          setIndex={setSlide}
        />
      </section>

      {/* CONTINUE WATCHING */}
      {session?.user?.id && (
        <section className="kado-section">
          <div className="kado-section-head">
            <div>
              <span>YOUR LIBRARY</span>
              <h2>Continue Watching</h2>
            </div>

            <button onClick={() => window.location.href = "/profile"}>
              See all <ChevronRight size={16} />
            </button>
          </div>

          <div className="kado-horizontal">
            {movieItems.slice(0, 5).map((item) => (
              <a
                key={item.id}
                href={`/watch/movie/${item.id}`}
                className="kado-continue-card"
              >
                <div className="kado-continue-image">
                  <img
                    src={item.backdrop_url || item.poster_url || "/placeholder.png"}
                    alt={item.title}
                    loading="lazy"
                  />
                  <div className="kado-progress">
                    <span />
                  </div>
                  <div className="kado-continue-play">
                    <Play size={18} fill="currentColor" />
                  </div>
                </div>

                <strong>{item.title}</strong>
                <span>{item.release_year || "Movie"}</span>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* TRENDING */}
      {movieItems.length > 0 && (
        <section className="kado-section">
          <div className="kado-section-head">
            <div>
              <span>TRENDING NOW</span>
              <h2>Popular Movies</h2>
            </div>

            <button onClick={() => window.location.href = "/movies"}>
              See all <ChevronRight size={16} />
            </button>
          </div>

          <div className="kado-poster-rail">
            {movieItems.slice(0, 12).map((item, index) => (
              <a
                key={item.id}
                href={`/watch/movie/${item.id}`}
                className="kado-poster"
              >
                <div className="kado-rank">
                  {String(index + 1).padStart(2, "0")}
                </div>

                <div className="kado-poster-image">
                  <img
                    src={item.poster_url || item.backdrop_url || "/placeholder.png"}
                    alt={item.title}
                    loading="lazy"
                  />

                  <div className="kado-poster-overlay">
                    <div>
                      <Play size={18} fill="currentColor" />
                    </div>
                  </div>

                  {item.quality && (
                    <small>{item.quality}</small>
                  )}
                </div>

                <strong>{item.title}</strong>

                <span>
                  {item.release_year || "Movie"}
                  {item.category ? ` • ${item.category}` : ""}
                </span>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* LIVE CHANNELS */}
      {channelItems.length > 0 && (
        <section className="kado-section">
          <div className="kado-section-head">
            <div>
              <span className="kado-live-label">
                <i />
                LIVE NOW
              </span>
              <h2>Live Channels</h2>
            </div>

            <button onClick={() => window.location.href = "/channels"}>
              See all <ChevronRight size={16} />
            </button>
          </div>

          <div className="kado-channel-rail">
            {channelItems.slice(0, 12).map((item) => (
              <a
                key={item.id}
                href={`/watch/channel/${item.id}`}
                className="kado-channel-card"
              >
                <div className="kado-channel-image">
                  <img
                    src={
                      item.logo_url ||
                      item.backdrop_url ||
                      "/placeholder.png"
                    }
                    alt={item.name}
                    loading="lazy"
                  />

                  <div className="kado-live-badge">
                    <i />
                    LIVE
                  </div>

                  <div className="kado-channel-play">
                    <Play size={18} fill="currentColor" />
                  </div>
                </div>

                <strong>{item.name}</strong>
                <span>{item.category || "Live Channel"}</span>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* SERIES */}
      {seriesItems.length > 0 && (
        <section className="kado-section">
          <div className="kado-section-head">
            <div>
              <span>POPULAR SERIES</span>
              <h2>Watch Your Favorites</h2>
            </div>

            <button onClick={() => window.location.href = "/series"}>
              See all <ChevronRight size={16} />
            </button>
          </div>

          <div className="kado-poster-rail">
            {seriesItems.slice(0, 12).map((item, index) => (
              <a
                key={item.id}
                href={`/watch/series/${item.id}`}
                className="kado-poster"
              >
                <div className="kado-rank">
                  {String(index + 1).padStart(2, "0")}
                </div>

                <div className="kado-poster-image">
                  <img
                    src={
                      item.poster_url ||
                      item.backdrop_url ||
                      "/placeholder.png"
                    }
                    alt={item.title}
                    loading="lazy"
                  />

                  <div className="kado-poster-overlay">
                    <div>
                      <Play size={18} fill="currentColor" />
                    </div>
                  </div>
                </div>

                <strong>{item.title}</strong>
                <span>{item.release_year || "Series"}</span>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* BOTTOM DISCOVERY */}
      <section className="kado-discover">
        <div className="kado-discover-glow" />

        <span>EXPLORE KADOTV</span>
        <h2>Find something you'll love.</h2>
        <p>
          Discover live channels, movies and series in one cinematic
          streaming experience.
        </p>

        <button onClick={() => window.location.href = "/search"}>
          Start Exploring
          <ChevronRight size={17} />
        </button>
      </section>

    </div>
  );
}


function HomeHeroSlider({ items, index, setIndex }) {
  const navigate = useNavigate();

  if (!items.length) {
    return (
      <div className="kado-hero-empty">
        <div className="kado-hero-glow" />

        <div className="kado-hero-copy">
          <span>
            <i />
            KADOTV
          </span>

          <h1>
            Entertainment
            <strong> without limits.</strong>
          </h1>

          <p>
            Live channels, movies and series in one modern streaming
            experience.
          </p>

          <button onClick={() => navigate("/channels")}>
            <Play size={17} fill="currentColor" />
            Explore KadoTV
          </button>
        </div>
      </div>
    );
  }

  const item = items[index] || items[0];

  const title =
    item.name ||
    item.title ||
    item.channel_name ||
    "Featured on KadoTV";

  const description =
    item.description ||
    "Stream your favorite entertainment on KadoTV.";

  const image =
    item.backdrop_url ||
    item.backdrop ||
    item.poster_url ||
    item.poster ||
    item.logo_url ||
    item.logo ||
    "";

  return (
    <div className="kado-hero-slide">

      <div
        className="kado-hero-image"
        style={{
          backgroundImage: `
            linear-gradient(
              90deg,
              rgba(4,5,10,.98) 0%,
              rgba(4,5,10,.82) 32%,
              rgba(4,5,10,.35) 68%,
              rgba(4,5,10,.78) 100%
            ),
            linear-gradient(
              0deg,
              rgba(4,5,10,1) 0%,
              transparent 55%
            ),
            url("${image}")
          `
        }}
      />

      <div className="kado-hero-copy" key={item.id || index}>

        <span className="kado-featured">
          <i />
          FEATURED
        </span>

        <h1>{title}</h1>

        <p>{description}</p>

        <div className="kado-hero-buttons">
          <button
            className="kado-watch"
            onClick={() => {
              if (item.id) {
                navigate(`/watch/channel/${item.id}`);
              } else {
                navigate("/channels");
              }
            }}
          >
            <Play size={17} fill="currentColor" />
            Watch Now
          </button>

          <button
            className="kado-browse"
            onClick={() => navigate("/channels")}
          >
            Browse
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {items.length > 1 && (
        <div className="kado-hero-navigation">

          <div className="kado-hero-dots">
            {items.map((entry, i) => (
              <button
                key={entry.id || i}
                className={i === index ? "active" : ""}
                onClick={() => setIndex(i)}
                aria-label={`Slide ${i + 1}`}
              />
            ))}
          </div>

          <div className="kado-hero-counter">
            <strong>
              {String(index + 1).padStart(2, "0")}
            </strong>
            <span>/</span>
            <span>
              {String(items.length).padStart(2, "0")}
            </span>
          </div>

        </div>
      )}

    </div>
  );
}


function MobileBottomNav() {
  const location = useLocation();

  const items = [
    { to: "/", label: "Home", icon: Home },
    { to: "/discover", label: "Discover", icon: Search },
    { to: "/channels", label: "Live", icon: Radio },
    { to: "/library", label: "Library", icon: Bookmark },
    { to: "/profile", label: "Profile", icon: User }
  ];

  return (
    <nav className="mobile-bottom-nav">
      {items.map(({ to, label, icon: Icon }) => {
        const active =
          to === "/"
            ? location.pathname === "/"
            : location.pathname.startsWith(to);

        return (
          <Link
            key={to}
            to={to}
            className={active ? "mobile-nav-item active" : "mobile-nav-item"}
          >
            <Icon size={20} strokeWidth={active ? 2.5 : 2} />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function QuickCategories() {
  const navigate = useNavigate();

  const categories = [
    ["/channels", "Live TV", Radio],
    ["/movies", "Movies", Film],
    ["/series", "Series", Clapperboard],
    ["/channels?category=Sports", "Sports", Trophy],
    ["/movies?category=Kids", "Kids", Baby],
    ["/search", "Explore", Layers3]
  ];

  return (
    <section className="quick-categories">

      <div className="quick-head">

        <div>
          <span className="mini-label">
            DISCOVER
          </span>

          <h2>
            What do you want to watch?
          </h2>
        </div>

      </div>

      <div className="category-rail">

        {categories.map(([path, label, Icon]) => (
          <button
            key={label}
            className="category-card"
            onClick={() => navigate(path)}
          >

            <span className="category-icon">
              <Icon size={19} />
            </span>

            <span className="category-name">
              {label}
            </span>

            <ChevronRight
              size={15}
              className="category-arrow"
            />

          </button>
        ))}

      </div>

    </section>
  );
}


function HomeFooter() {
  const navigate = useNavigate();

  return (
    <footer className="home-footer">

      <div className="footer-main">

        <div className="footer-brand">

          <span className="footer-logo">
            K
          </span>

          <div>
            <strong>KadoTV</strong>
            <span>
              Entertainment, reimagined.
            </span>
          </div>

        </div>

        <div className="footer-links">

          <button onClick={() => navigate("/")}>
            Home
          </button>

          <button onClick={() => navigate("/channels")}>
            Live TV
          </button>

          <button onClick={() => navigate("/movies")}>
            Movies
          </button>

          <button onClick={() => navigate("/series")}>
            Series
          </button>

          <button onClick={() => navigate("/search")}>
            Search
          </button>

        </div>

      </div>

      <div className="footer-bottom">

        <span>
          © {new Date().getFullYear()} KadoTV
        </span>

        <span>
          Stream • Discover • Enjoy
        </span>

      </div>

    </footer>
  );
}


function Hero({ item, type }) {
  const navigate = useNavigate();

  return (
    <div
      className="hero"
      style={{
        backgroundImage:
          `linear-gradient(90deg, rgba(5,6,10,.96), rgba(5,6,10,.55), rgba(5,6,10,.1)), url("${item.backdrop_url || item.logo_url || ""}")`
      }}
    >
      <div className="hero-content">
        <span className="eyebrow">FEATURED</span>
        <h1>{item.name || item.title}</h1>
        <p>
          {item.description || "Watch now on KadoTV."}
        </p>

        <button
          className="primary-btn"
          onClick={() =>
            navigate(`/watch/${type}/${item.id}`)
          }
        >
          <Play size={17} fill="currentColor" />
          Watch now
        </button>
      </div>
    </div>
  );
}

function Section({ title, action, children }) {
  const navigate = useNavigate();

  return (
    <section className="section">
      <div className="section-head">
        <h2>{title}</h2>

        <button onClick={() => navigate(action)}>
          See all
          <ChevronRight size={16} />
        </button>
      </div>

      {children}
    </section>
  );
}

function CardRow({ items, type, session }) {
  if (!items.length) {
    return (
      <div className="empty-row">
        No content has been added yet.
      </div>
    );
  }

  return (
    <div className="card-row">
      {items.map(item => (
        <ContentCard
          key={item.id}
          item={item}
          type={type}
          session={session}
        />
      ))}
    </div>
  );
}

function ContentCard({ item, type, session }) {
  const navigate = useNavigate();
  const [fav, setFav] = useState(false);

  useEffect(() => {
    if (session?.user?.id) {
      isFavorite(
        session.user.id,
        type,
        item.id
      )
        .then(setFav)
        .catch(() => {});
    }
  }, [session?.user?.id, type, item.id]);

  async function favIt(e) {
    e.stopPropagation();

    if (!session?.user?.id) return;

    try {
      setFav(
        await toggleFavorite(
          session.user.id,
          type,
          item.id
        )
      );
    } catch {}
  }

  const title = item.name || item.title;

  return (
    <article
      className="content-card"
      onClick={() =>
        navigate(`/watch/${type}/${item.id}`)
      }
    >
      <div className="poster">
        {item.poster_url || item.logo_url ? (
          <img
            src={item.poster_url || item.logo_url}
            alt=""
          />
        ) : (
          <div className="poster-fallback">
            {title?.slice(0, 1)}
          </div>
        )}

        <button
          className={
            "fav-mini " + (fav ? "liked" : "")
          }
          onClick={favIt}
        >
          {fav ? "♥" : "♡"}
        </button>

        <div className="poster-overlay">
          <Play size={20} fill="currentColor" />
        </div>
      </div>

      <div className="card-title">{title}</div>

      <div className="card-meta">
        {item.category ||
          item.release_year ||
          (type === "channel" ? "LIVE" : "")}
      </div>
    </article>
  );
}

function ChannelsPage({ session }) {
  const { data, loading } = useData(getChannels);

  return (
    <LibraryPage
      title="Live Channels"
      subtitle="Your live streaming channels"
      items={data}
      loading={loading}
      type="channel"
      session={session}
    />
  );
}

function MoviesPage({ session }) {
  const { data, loading } = useData(getMovies);

  return (
    <LibraryPage
      title="Movies"
      subtitle="Movies available in your KadoTV library"
      items={data}
      loading={loading}
      type="movie"
      session={session}
    />
  );
}

function SeriesPage({ session }) {
  const { data, loading } = useData(getSeries);

  return (
    <LibraryPage
      title="Series"
      subtitle="Series and episodic content"
      items={data}
      loading={loading}
      type="series"
      session={session}
    />
  );
}

function LibraryPage({
  title,
  subtitle,
  items,
  loading,
  type,
  session
}) {
  return (
    <div>
      <div className="page-heading">
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>

      {loading ? (
        <div className="loading-line">Loading…</div>
      ) : items.length ? (
        <div className="grid">
          {items.map(i => (
            <ContentCard
              key={i.id}
              item={i}
              type={type}
              session={session}
            />
          ))}
        </div>
      ) : (
        <EmptyState />
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="empty-state">
      <Tv size={32} />
      <h3>Nothing here yet</h3>
      <p>
        Content added from the KadoTV admin panel
        will appear here.
      </p>
    </div>
  );
}

function SearchPage({ session }) {
  const channels = useData(getChannels);
  const movies = useData(getMovies);
  const series = useData(getSeries);

  const [q, setQ] = useState("");

  const all = useMemo(
    () => [
      ...channels.data.map(x => ({
        ...x,
        _type: "channel"
      })),
      ...movies.data.map(x => ({
        ...x,
        _type: "movie"
      })),
      ...series.data.map(x => ({
        ...x,
        _type: "series"
      }))
    ],
    [
      channels.data,
      movies.data,
      series.data
    ]
  );

  const results = all.filter(x =>
    (x.name || x.title || "")
      .toLowerCase()
      .includes(q.toLowerCase())
  );

  return (
    <div>
      <div className="page-heading">
        <h1>Search</h1>
        <p>Find something to watch.</p>
      </div>

      <div className="search-box">
        <Search />
        <input
          autoFocus
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Search…"
        />
      </div>

      {q ? (
        <div className="grid">
          {results.map(i => (
            <ContentCard
              key={i._type + i.id}
              item={i}
              type={i._type}
              session={session}
            />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <Search size={32} />
          <h3>Start searching</h3>
          <p>
            Search across channels, movies and series.
          </p>
        </div>
      )}
    </div>
  );
}

function ProfilePage({
  session,
  profile,
  setProfile
}) {
  const [name, setName] = useState(
    profile?.display_name || ""
  );

  async function save() {
    const {
      data,
      error
    } = await supabase
      .from("profiles")
      .update({
        display_name: name
      })
      .eq("id", session.user.id)
      .select()
      .single();

    if (!error) setProfile(data);
  }

  return (
    <div className="settings-page">
      <div className="page-heading">
        <h1>Your Profile</h1>
        <p>Manage your KadoTV account.</p>
      </div>

      <div className="panel profile-panel">
        <div className="big-avatar">
          {(name || session.user.email)
            .slice(0, 1)
            .toUpperCase()}
        </div>

        <div className="profile-info">
          <label>Display name</label>

          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Your name"
          />

          <label>Email</label>

          <input
            value={session.user.email}
            disabled
          />

          <button
            className="primary-btn"
            onClick={save}
          >
            Save profile
          </button>
        </div>
      </div>
    </div>
  );
}

function SettingsPage() {
  return (
    <div className="settings-page">
      <div className="page-heading">
        <h1>Settings</h1>
        <p>KadoTV preferences.</p>
      </div>

      <div className="panel">
        <div className="setting-row">
          <div>
            <b>Account security</b>
            <span>
              Authentication is handled by Supabase.
            </span>
          </div>
          <Shield size={20} />
        </div>

        <div className="setting-row">
          <div>
            <b>Streaming</b>
            <span>
              Use the highest quality available from
              each source.
            </span>
          </div>
          <Tv size={20} />
        </div>
      </div>
    </div>
  );
}

function WatchPage({ session }) {
  const { type, id } = useParamsSafe();

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const table =
          type === "channel"
            ? "channels"
            : type === "movie"
            ? "movies"
            : "series";

        const { data } = await supabase
          .from(table)
          .select("*")
          .eq("id", id)
          .single();

        setItem(data);
      } finally {
        setLoading(false);
      }
    })();
  }, [type, id]);

  if (loading) {
    return (
      <div className="loading-line">
        Loading player…
      </div>
    );
  }

  if (!item) return <EmptyState />;

  return (
    <div className="watch-page">
      <Player
        src={item.stream_url}
        poster={
          item.backdrop_url ||
          item.poster_url ||
          item.logo_url
        }
        live={type === "channel"}
        onProgress={(p, d) =>
          session?.user?.id
            ? saveWatch(
                session.user.id,
                type,
                id,
                p,
                d
              ).catch(() => {})
            : undefined
        }
      />

      <div className="watch-info">
        <span className="eyebrow">
          {type === "channel"
            ? "LIVE"
            : type.toUpperCase()}
        </span>

        <h1>{item.name || item.title}</h1>

        <p>
          {item.description ||
            "No description has been added."}
        </p>
      </div>
    </div>
  );
}

function useParamsSafe() {
  const location = useLocation();
  const parts = location.pathname
    .split("/")
    .filter(Boolean);

  return {
    type: parts[1],
    id: parts[2]
  };
}

function AdminPage() {
  const [tab, setTab] = useState("channels");

  const tabs = {
    channels: "channels",
    movies: "movies",
    series: "series",
    users: "profiles",
    categories: "categories"
  };

  return (
    <div>
      <div className="page-heading">
        <h1>Admin</h1>
        <p>
          Manage the real KadoTV library and users.
        </p>
      </div>

      <div className="admin-tabs">
        {Object.keys(tabs).map(x => (
          <button
            className={tab === x ? "active" : ""}
            onClick={() => setTab(x)}
            key={x}
          >
            {x}
          </button>
        ))}
      </div>

      <AdminManager
        table={tabs[tab]}
        kind={tab}
      />
    </div>
  );
}

function AdminManager({ table, kind }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);

  async function load() {
    setLoading(true);

    try {
      setRows(await adminList(table));
    } catch (e) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [table]);

  async function remove(id) {
    if (!confirm("Delete this item?")) return;

    try {
      await adminDelete(table, id);
      load();
    } catch (e) {
      alert(e.message);
    }
  }

  async function save(row) {
    try {
      await adminUpsert(table, row);
      setEditing(null);
      load();
    } catch (e) {
      alert(e.message);
    }
  }

  if (kind === "users") {
    return (
      <UsersManager
        rows={rows}
        reload={load}
      />
    );
  }

  return (
    <div className="admin-panel">
      <div className="admin-toolbar">
        <b>{rows.length} records</b>

        <button
          className="primary-btn"
          onClick={() => setEditing({})}
        >
          Add
        </button>
      </div>

      {loading ? (
        <div className="loading-line">
          Loading…
        </div>
      ) : (
        <div className="admin-list">
          {rows.map(r => (
            <div
              className="admin-row"
              key={r.id}
            >
              <div className="admin-thumb">
                {r.logo_url || r.poster_url ? (
                  <img
                    src={
                      r.logo_url ||
                      r.poster_url
                    }
                    alt=""
                  />
                ) : (
                  <span>
                    {(r.name ||
                      r.title ||
                      "C").slice(0, 1)}
                  </span>
                )}
              </div>

              <div className="admin-main">
                <b>{r.name || r.title}</b>
                <small>
                  {r.category ||
                    r.status ||
                    ""}
                </small>
              </div>

              <button
                className="icon-btn"
                onClick={() => setEditing(r)}
              >
                <Pencil size={16} />
              </button>

              <button
                className="icon-btn danger"
                onClick={() =>
                  remove(r.id)
                }
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      {editing !== null && (
        <EditModal
          table={table}
          kind={kind}
          row={editing}
          close={() => setEditing(null)}
          save={save}
        />
      )}
    </div>
  );
}

function UsersManager({ rows, reload }) {
  async function change(id, status) {
    try {
      await adminUpdateUser(id, status);
      reload();
    } catch (e) {
      alert(e.message);
    }
  }

  return (
    <div className="admin-panel">
      <div className="admin-toolbar">
        <b>{rows.length} users</b>
      </div>

      <div className="admin-list">
        {rows.map(r => (
          <div
            className="admin-row"
            key={r.id}
          >
            <div className="admin-thumb">
              <span>
                {(r.display_name ||
                  r.email ||
                  "U").slice(0, 1)}
              </span>
            </div>

            <div className="admin-main">
              <b>
                {r.display_name ||
                  "Unnamed user"}
              </b>

              <small>
                {r.email} · {r.status}
              </small>
            </div>

            {r.status === "blocked" ? (
              <button
                className="small-btn"
                onClick={() =>
                  change(r.id, "active")
                }
              >
                <CheckCircle2 size={15} />
                Unblock
              </button>
            ) : (
              <button
                className="small-btn danger"
                onClick={() =>
                  change(r.id, "blocked")
                }
              >
                <Ban size={15} />
                Block
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function EditModal({
  table,
  kind,
  row,
  close,
  save
}) {
  const [form, setForm] = useState(() => {
    if (row && Object.keys(row).length > 0) {
      return row;
    }

    if (kind === "channels") {
      return {
        name: "",
        description: "",
        logo_url: "",
        backdrop_url: "",
        stream_url: "",
        category: "",
        is_active: true,
        is_featured: true,
        sort_order: 0
      };
    }

    if (kind === "movies") {
      return {
        title: "",
        description: "",
        poster_url: "",
        backdrop_url: "",
        stream_url: "",
        category: "",
        release_year: new Date().getFullYear(),
        duration_minutes: 0,
        is_featured: true,
        is_trending: true
      };
    }

    if (kind === "series") {
      return {
        title: "",
        description: "",
        poster_url: "",
        backdrop_url: "",
        category: "",
        release_year: new Date().getFullYear(),
        is_featured: true
      };
    }

    return {};
  });

  const fields =
    kind === "channels"
      ? [
          "name",
          "description",
          "logo_url",
          "backdrop_url",
          "stream_url",
          "category",
          "is_active",
          "is_featured",
          "sort_order"
        ]
      : kind === "movies"
      ? [
          "title",
          "description",
          "poster_url",
          "backdrop_url",
          "stream_url",
          "category",
          "release_year",
          "duration_minutes",
          "is_featured"
        ]
      : kind === "series"
      ? [
          "title",
          "description",
          "poster_url",
          "backdrop_url",
          "category",
          "release_year",
          "is_featured"
        ]
      : ["name"];

  function set(k, v) {
    setForm(x => ({
      ...x,
      [k]: v
    }));
  }

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <div className="modal-head">
          <h2>
            {row.id ? "Edit" : "Add"}{" "}
            {kind.slice(0, -1)}
          </h2>

          <button
            className="icon-btn"
            onClick={close}
          >
            <X />
          </button>
        </div>

        {fields.map(f => (
          <label
            className="field"
            key={f}
          >
            {f}

            <input
              type={
                typeof row[f] === "boolean"
                  ? "checkbox"
                  : "text"
              }
              checked={
                typeof form[f] === "boolean"
                  ? form[f]
                  : undefined
              }
              value={
                typeof form[f] === "boolean"
                  ? ""
                  : form[f] ?? ""
              }
              onChange={e =>
                set(
                  f,
                  typeof row[f] === "boolean"
                    ? e.target.checked
                    : e.target.value
                )
              }
            />
          </label>
        ))}

        <div className="modal-actions">
          <button
            className="ghost-btn"
            onClick={close}
          >
            Cancel
          </button>

          <button
            className="primary-btn"
            onClick={() => save(form)}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
