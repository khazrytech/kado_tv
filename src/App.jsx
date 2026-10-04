import IPTVPage from "./components/IPTVPage";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Home,
  Tv,
  User,
  Play,
  Pause,
  Cast,
  X,
  Radio,
  Volume2,
  Trophy,
  Tv2,
  Search,
  ChevronRight,
  Star,
  RefreshCw,
  Wifi,
  AlertCircle,
  Layers3
} from "lucide-react";
import { supabase } from "./lib/supabase";

const CATEGORY_ICONS = {
  Sports: Trophy,
  "Local TV": Tv2,
  Entertainment: Star,
  News: Radio,
  Kids: Layers3
};

function getCategoryIcon(category) {
  const key = Object.keys(CATEGORY_ICONS).find(
    (item) => item.toLowerCase() === String(category || "").toLowerCase()
  );

  return CATEGORY_ICONS[key] || Tv2;
}

function normalizeCategory(value) {
  if (!value) return "Other";

  const text = String(value).trim();

  if (text.toLowerCase() === "local") return "Local TV";
  if (text.toLowerCase() === "local tv") return "Local TV";
  if (text.toLowerCase() === "sport") return "Sports";
  if (text.toLowerCase() === "sports") return "Sports";
  if (text.toLowerCase() === "entertainment") return "Entertainment";
  if (text.toLowerCase() === "news") return "News";
  if (text.toLowerCase() === "kids") return "Kids";

  return text;
}

function ChannelLogo({ channel, large = false }) {
  const [failed, setFailed] = useState(false);

  const sizeClass = large
    ? "channel-logo channel-logo-large"
    : "channel-logo";

  if (!channel?.logo_url || failed) {
    return (
      <div className={`${sizeClass} channel-logo-fallback`}>
        <Tv2 size={large ? 42 : 28} />
      </div>
    );
  }

  return (
    <img
      src={channel.logo_url}
      alt={channel.name || "Channel"}
      className={sizeClass}
      onError={() => setFailed(true)}
    />
  );
}

function ChannelCard({
  channel,
  selected,
  onSelect,
  featured = false
}) {
  const category = normalizeCategory(channel.category);
  const CategoryIcon = getCategoryIcon(category);

  return (
    <button
      type="button"
      onClick={() => onSelect(channel)}
      className={`channel-card ${selected ? "channel-card-selected" : ""} ${
        featured ? "channel-card-featured" : ""
      }`}
    >
      <div className="channel-card-media">
        <ChannelLogo channel={channel} />

        <div className="live-badge">
          <span />
          LIVE
        </div>

        {channel.is_featured && (
          <div className="featured-badge">
            <Star size={10} fill="currentColor" />
            Featured
          </div>
        )}

        <div className="channel-play">
          <Play size={18} fill="currentColor" />
        </div>
      </div>

      <div className="channel-card-info">
        <div className="channel-title-row">
          <h3>{channel.name}</h3>

          <span className="category-mini">
            <CategoryIcon size={11} />
          </span>
        </div>

        <p>{category}</p>
      </div>
    </button>
  );
}

function HorizontalChannelRow({
  title,
  icon,
  channels,
  onSelect,
  selectedId
}) {
  if (!channels?.length) return null;

  return (
    <section className="content-section">
      <div className="section-heading">
        <div className="section-title-wrap">
          {icon}
          <div>
            <h2>{title}</h2>
            <p>{channels.length} channels</p>
          </div>
        </div>

        <button type="button" className="see-all-btn">
          See all
          <ChevronRight size={15} />
        </button>
      </div>

      <div className="horizontal-channel-row scrollbar-none">
        {channels.map((channel) => (
          <ChannelCard
            key={channel.id}
            channel={channel}
            selected={selectedId === channel.id}
            onSelect={onSelect}
          />
        ))}
      </div>
    </section>
  );
}

function CategoryFilter({ categories, selected, onChange }) {
  return (
    <div className="category-filter scrollbar-none">
      <button
        type="button"
        className={`category-pill ${
          selected === "All" ? "category-pill-active" : ""
        }`}
        onClick={() => onChange("All")}
      >
        <Layers3 size={14} />
        All
      </button>

      {categories.map((category) => {
        const Icon = getCategoryIcon(category);

        return (
          <button
            type="button"
            key={category}
            className={`category-pill ${
              selected === category ? "category-pill-active" : ""
            }`}
            onClick={() => onChange(category)}
          >
            <Icon size={14} />
            {category}
          </button>
        );
      })}
    </div>
  );
}

function VideoPlayer({
  channel,
  onClose
}) {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);

  const [playing, setPlaying] = useState(true);
  const [muted, setMuted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadHls = async () => {
      setLoading(true);
      setError(false);

      if (!videoRef.current || !channel?.stream_url) {
        setError(true);
        setLoading(false);
        return;
      }

      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }

      const video = videoRef.current;

      try {
        const HlsModule = await import("hls.js");
        const Hls = HlsModule.default;

        if (cancelled) return;

        if (Hls.isSupported()) {
          const hls = new Hls({
            enableWorker: true,
            lowLatencyMode: true,
            backBufferLength: 30,
            xhrSetup: (xhr) => {
              xhr.withCredentials = false;
            }
          });

          hlsRef.current = hls;

          hls.loadSource(channel.stream_url);
          hls.attachMedia(video);

          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            if (!cancelled) {
              setLoading(false);

              video
                .play()
                .then(() => setPlaying(true))
                .catch(() => setPlaying(false));
            }
          });

          hls.on(Hls.Events.ERROR, (_, data) => {
            if (data?.fatal && !cancelled) {
              setLoading(false);
              setError(true);
            }
          });
        } else if (
          video.canPlayType("application/vnd.apple.mpegurl")
        ) {
          video.src = channel.stream_url;

          video.addEventListener(
            "loadedmetadata",
            () => {
              if (!cancelled) {
                setLoading(false);
                video
                  .play()
                  .then(() => setPlaying(true))
                  .catch(() => setPlaying(false));
              }
            },
            { once: true }
          );

          video.addEventListener(
            "error",
            () => {
              if (!cancelled) {
                setLoading(false);
                setError(true);
              }
            },
            { once: true }
          );
        } else {
          setLoading(false);
          setError(true);
        }
      } catch (err) {
        console.error("HLS player error:", err);

        if (!cancelled) {
          setLoading(false);
          setError(true);
        }
      }
    };

    loadHls();

    return () => {
      cancelled = true;

      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }

      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.removeAttribute("src");
        videoRef.current.load();
      }
    };
  }, [channel]);

  const togglePlay = () => {
    if (!videoRef.current) return;

    if (videoRef.current.paused) {
      videoRef.current
        .play()
        .then(() => setPlaying(true))
        .catch(() => {});
    } else {
      videoRef.current.pause();
      setPlaying(false);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;

    videoRef.current.muted = !videoRef.current.muted;
    setMuted(videoRef.current.muted);
  };

  return (
    <div className="player-shell">
      <video
        ref={videoRef}
        className="player-video"
        playsInline
        autoPlay
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      />

      <div className="player-top-gradient" />

      <div className="player-live-indicator">
        <span />
        LIVE
      </div>

      <button
        type="button"
        className="player-close"
        onClick={onClose}
        aria-label="Close player"
      >
        <X size={17} />
      </button>

      {loading && (
        <div className="player-state">
          <div className="player-spinner" />
          <span>Connecting to live stream...</span>
        </div>
      )}

      {error && (
        <div className="player-state player-error">
          <AlertCircle size={34} />
          <strong>Stream unavailable</strong>
          <span>
            This channel could not be played right now.
          </span>
        </div>
      )}

      <div className="player-bottom-gradient" />

      <div className="player-controls">
        <button
          type="button"
          className="player-control-main"
          onClick={togglePlay}
        >
          {playing ? (
            <Pause size={17} fill="currentColor" />
          ) : (
            <Play size={17} fill="currentColor" />
          )}
        </button>

        <div className="player-channel-info">
          <strong>{channel.name}</strong>
          <span>{normalizeCategory(channel.category)}</span>
        </div>

        <button
          type="button"
          className="player-control"
          onClick={toggleMute}
        >
          <Volume2 size={17} />
          {muted && <span className="mute-line" />}
        </button>
      </div>
    </div>
  );
}

function EmptyState({ loading, error, onRetry }) {
  if (loading) {
    return (
      <div className="empty-state">
        <div className="empty-spinner" />
        <h3>Loading channels...</h3>
        <p>Connecting to KadoTV.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="empty-state">
        <AlertCircle size={34} />
        <h3>Unable to load channels</h3>
        <p>Check your Supabase connection and try again.</p>

        <button type="button" onClick={onRetry} className="retry-btn">
          <RefreshCw size={15} />
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="empty-state">
      <Tv size={34} />
      <h3>No channels available</h3>
      <p>
        Add channels from the KadoTV admin dashboard and they
        will appear here automatically.
      </p>
    </div>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState("home");
  const [channels, setChannels] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState(null);

  const [selectedCategory, setSelectedCategory] = useState("All");
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadChannels = async () => {
    setLoading(true);
    setError(false);

    try {
      const { data, error: supabaseError } = await supabase
        .from("channels")
        .select("*")
        .eq("is_active", true)
        .order("is_featured", { ascending: false })
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false });

      if (supabaseError) {
        throw supabaseError;
      }

      setChannels(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("KadoTV channels error:", err);
      setError(true);
      setChannels([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadChannels();

    const channel = supabase
      .channel("kadotv-live-channels")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "channels"
        },
        () => {
          loadChannels();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const categories = useMemo(() => {
    const values = channels
      .map((channel) => normalizeCategory(channel.category))
      .filter(Boolean);

    return [...new Set(values)].sort((a, b) =>
      a.localeCompare(b)
    );
  }, [channels]);

  const featuredChannels = useMemo(
    () => channels.filter((channel) => channel.is_featured),
    [channels]
  );

  const recentlyAdded = useMemo(() => {
    return [...channels]
      .sort(
        (a, b) =>
          new Date(b.created_at || 0) -
          new Date(a.created_at || 0)
      )
      .slice(0, 10);
  }, [channels]);

  const filteredChannels = useMemo(() => {
    const query = search.trim().toLowerCase();

    return channels.filter((channel) => {
      const category = normalizeCategory(channel.category);

      const matchesCategory =
        selectedCategory === "All" ||
        category === selectedCategory;

      const matchesSearch =
        !query ||
        String(channel.name || "")
          .toLowerCase()
          .includes(query) ||
        category.toLowerCase().includes(query);

      return matchesCategory && matchesSearch;
    });
  }, [channels, selectedCategory, search]);

  const handleSelectChannel = (channel) => {
    setSelectedChannel(channel);

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };

  const handleHome = () => {
    setActiveTab("home");
    setSelectedCategory("All");
    setSearch("");
  };

  return (
    <div className="kado-app">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <header className="kado-header">
        <div className="brand">
          <div className="brand-mark">
            K
          </div>

          <div>
            <div className="brand-name">KadoTV</div>
            <div className="brand-subtitle">
              Premium Streaming
            </div>
          </div>
        </div>

        <div className="header-actions">
          <button type="button" className="icon-button">
            <Cast size={18} />
          </button>

          <button
            type="button"
            className="profile-button"
            onClick={() => setActiveTab("profile")}
          >
            <User size={17} />
          </button>
        </div>
      </header>

      <main className="kado-main">
        {selectedChannel && (
          <VideoPlayer
            channel={selectedChannel}
            onClose={() => setSelectedChannel(null)}
          />
        )}

        {activeTab === "home" && (
          <>
            <section className="hero-section">
              <div className="hero-glow" />

              <div className="hero-content">
                <div className="live-pill">
                  <span />
                  LIVE TV
                </div>

                <h1>
                  Watch your
                  <br />
                  <span>favorite channels.</span>
                </h1>

                <p>
                  Stream live television, sports and
                  entertainment in one premium experience.
                </p>

                <button
                  type="button"
                  className="hero-button"
                  onClick={() => setActiveTab("live")}
                >
                  <Play size={16} fill="currentColor" />
                  Explore Live TV
                </button>
              </div>

              <div className="hero-orb">
                <Radio size={82} />
              </div>
            </section>

            {!loading && !error && (
              <>
                <HorizontalChannelRow
                  title="Featured Channels"
                  icon={
                    <Star
                      size={18}
                      className="section-icon gold"
                      fill="currentColor"
                    />
                  }
                  channels={featuredChannels}
                  onSelect={handleSelectChannel}
                  selectedId={selectedChannel?.id}
                />

                <HorizontalChannelRow
                  title="Recently Added"
                  icon={
                    <Radio
                      size={18}
                      className="section-icon cyan"
                    />
                  }
                  channels={recentlyAdded}
                  onSelect={handleSelectChannel}
                  selectedId={selectedChannel?.id}
                />

                {categories.map((category) => {
                  const Icon = getCategoryIcon(category);

                  const items = channels.filter(
                    (channel) =>
                      normalizeCategory(channel.category) ===
                      category
                  );

                  return (
                    <HorizontalChannelRow
                      key={category}
                      title={category}
                      icon={
                        <Icon
                          size={18}
                          className="section-icon cyan"
                        />
                      }
                      channels={items}
                      onSelect={handleSelectChannel}
                      selectedId={selectedChannel?.id}
                    />
                  );
                })}
              </>
            )}

            {(loading || error) && (
              <EmptyState
                loading={loading}
                error={error}
                onRetry={loadChannels}
              />
            )}
          </>
        )}

        {activeTab === "live" && (
          <section className="live-page">
            <div className="page-heading">
              <div>
                <span className="eyebrow">
                  <Wifi size={13} />
                  KadoTV Live
                </span>

                <h1>Live TV</h1>

                <p>
                  {channels.length} active channels available
                </p>
              </div>

              <button
                type="button"
                className="refresh-button"
                onClick={loadChannels}
              >
                <RefreshCw size={16} />
              </button>
            </div>

            <div className="search-box">
              <Search size={17} />
              <input
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search channels..."
              />
            </div>

            <CategoryFilter
              categories={categories}
              selected={selectedCategory}
              onChange={setSelectedCategory}
            />

            {loading || error ? (
              <EmptyState
                loading={loading}
                error={error}
                onRetry={loadChannels}
              />
            ) : filteredChannels.length === 0 ? (
              <div className="empty-state">
                <Search size={34} />
                <h3>No channels found</h3>
                <p>
                  Try another search or category.
                </p>
              </div>
            ) : (
              <div className="live-channel-grid">
                {filteredChannels.map((channel) => (
                  <ChannelCard
                    key={channel.id}
                    channel={channel}
                    selected={
                      selectedChannel?.id === channel.id
                    }
                    onSelect={handleSelectChannel}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {activeTab === "iptv" && (
          <IPTVPage />
        )}

        {activeTab === "profile" && (
          <section className="profile-page">
            <div className="profile-card">
              <div className="profile-avatar">
                <User size={30} />
              </div>

              <h1>KadoTV</h1>

              <p>
                Your premium streaming experience.
              </p>

              <div className="profile-stats">
                <div>
                  <strong>{channels.length}</strong>
                  <span>Channels</span>
                </div>

                <div>
                  <strong>{featuredChannels.length}</strong>
                  <span>Featured</span>
                </div>

                <div>
                  <strong>{categories.length}</strong>
                  <span>Categories</span>
                </div>
              </div>

              <button
                type="button"
                className="profile-refresh"
                onClick={loadChannels}
              >
                <RefreshCw size={16} />
                Refresh Content
              </button>
            </div>
          </section>
        )}
      </main>

      <nav className="bottom-nav">
        <button
          type="button"
          className={activeTab === "home" ? "nav-active" : ""}
          onClick={handleHome}
        >
          <Home size={20} />
          <span>Home</span>
        </button>

        <button
          type="button"
          className={activeTab === "live" ? "nav-active" : ""}
          onClick={() => setActiveTab("live")}
        >
          <Tv size={20} />
          <span>Live TV</span>
        </button>

        <button
          type="button"
          className={activeTab === "iptv" ? "nav-active" : ""}
          onClick={() => setActiveTab("iptv")}
        >
          <Radio size={20} />
          <span>IPTV</span>
        </button>

        <button
          type="button"
          className={
            activeTab === "profile" ? "nav-active" : ""
          }
          onClick={() => setActiveTab("profile")}
        >
          <User size={20} />
          <span>Profile</span>
        </button>
      </nav>
    </div>
  );
}
