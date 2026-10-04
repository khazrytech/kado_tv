import { useEffect, useMemo, useState } from "react";
import {
  Search,
  RefreshCw,
  Play,
  Radio,
  Tv,
  X,
  ChevronRight,
  Loader2,
  AlertCircle,
  Wifi,
} from "lucide-react";
import HLSPlayer from "./HLSPlayer";
import { parseM3U, getCategories } from "../lib/iptv";

const IPTV_URL =
  import.meta.env.VITE_IPTV_M3U_URL || "";

function ChannelLogo({ channel }) {
  const [failed, setFailed] = useState(false);

  if (!channel.logo || failed) {
    return (
      <div className="iptv-logo-fallback">
        <Tv size={28} />
      </div>
    );
  }

  return (
    <img
      src={channel.logo}
      alt=""
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}

function IPTVCard({ channel, onPlay }) {
  return (
    <button
      className="iptv-channel-card"
      onClick={() => onPlay(channel)}
    >
      <div className="iptv-card-image">
        <ChannelLogo channel={channel} />

        <span className="iptv-live-badge">
          <span />
          LIVE
        </span>

        <div className="iptv-play">
          <Play size={20} fill="currentColor" />
        </div>
      </div>

      <div className="iptv-card-info">
        <strong>{channel.name}</strong>
        <span>{channel.group}</span>
      </div>
    </button>
  );
}

export default function IPTVPage() {
  const [channels, setChannels] = useState([]);
  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const loadPlaylist = async () => {
    if (!IPTV_URL) {
      setError(
        "IPTV playlist haijawekwa. Weka VITE_IPTV_M3U_URL kwenye Vercel."
      );
      setLoading(false);
      return;
    }

    try {
      setError("");

      const response = await fetch(
        `${IPTV_URL}${IPTV_URL.includes("?") ? "&" : "?"}_=${Date.now()}`,
        {
          cache: "no-store",
        }
      );

      if (!response.ok) {
        throw new Error(
          `Playlist HTTP ${response.status}`
        );
      }

      const text = await response.text();
      const parsed = parseM3U(text);

      setChannels(parsed);
      setLastUpdated(new Date());
    } catch (err) {
      console.error("IPTV playlist error:", err);
      setError(
        "Imeshindikana kufetch IPTV playlist. Hakikisha M3U URL ni sahihi na inaruhusu CORS."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadPlaylist();
  }, []);

  const categories = useMemo(
    () => getCategories(channels),
    [channels]
  );

  const filteredChannels = useMemo(() => {
    const query = search.trim().toLowerCase();

    return channels.filter((channel) => {
      const matchesCategory =
        activeCategory === "All" ||
        channel.group === activeCategory;

      const matchesSearch =
        !query ||
        channel.name.toLowerCase().includes(query) ||
        channel.group.toLowerCase().includes(query);

      return matchesCategory && matchesSearch;
    });
  }, [channels, activeCategory, search]);

  const groupedChannels = useMemo(() => {
    if (activeCategory !== "All" || search.trim()) {
      return [];
    }

    return categories
      .map((category) => ({
        category,
        channels: channels
          .filter((channel) => channel.group === category)
          .slice(0, 20),
      }))
      .filter((item) => item.channels.length > 0);
  }, [channels, categories, activeCategory, search]);

  const refresh = () => {
    setRefreshing(true);
    loadPlaylist();
  };

  return (
    <main className="iptv-page">
      <section className="iptv-header">
        <div>
          <div className="iptv-title-row">
            <div className="iptv-title-icon">
              <Radio size={25} />
            </div>

            <div>
              <h1>IPTV</h1>
              <p>Thousands of live channels</p>
            </div>
          </div>
        </div>

        <button
          className="iptv-refresh"
          onClick={refresh}
          disabled={refreshing}
        >
          {refreshing ? (
            <Loader2 className="spin" size={18} />
          ) : (
            <RefreshCw size={18} />
          )}
          <span>Refresh</span>
        </button>
      </section>

      <section className="iptv-stats">
        <div>
          <Radio size={18} />
          <span>
            <strong>{channels.length.toLocaleString()}</strong>
            Channels
          </span>
        </div>

        <div>
          <Tv size={18} />
          <span>
            <strong>{categories.length}</strong>
            Categories
          </span>
        </div>

        <div>
          <Wifi size={18} />
          <span>
            <strong>LIVE</strong>
            IPTV
          </span>
        </div>
      </section>

      <div className="iptv-search">
        <Search size={19} />
        <input
          type="search"
          placeholder="Search IPTV channels..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setActiveCategory("All");
          }}
        />

        {search && (
          <button onClick={() => setSearch("")}>
            <X size={17} />
          </button>
        )}
      </div>

      {categories.length > 0 && (
        <div className="iptv-categories">
          <button
            className={
              activeCategory === "All" ? "active" : ""
            }
            onClick={() => {
              setActiveCategory("All");
              setSearch("");
            }}
          >
            All
          </button>

          {categories.map((category) => (
            <button
              key={category}
              className={
                activeCategory === category ? "active" : ""
              }
              onClick={() => {
                setActiveCategory(category);
                setSearch("");
              }}
            >
              {category}
            </button>
          ))}
        </div>
      )}

      {loading && (
        <div className="iptv-state">
          <Loader2 className="spin" size={35} />
          <h3>Loading IPTV</h3>
          <p>Fetching channels...</p>
        </div>
      )}

      {!loading && error && (
        <div className="iptv-error">
          <AlertCircle size={30} />
          <div>
            <h3>IPTV unavailable</h3>
            <p>{error}</p>
          </div>

          <button onClick={refresh}>
            Try again
          </button>
        </div>
      )}

      {!loading &&
        !error &&
        channels.length > 0 &&
        activeCategory === "All" &&
        !search.trim() && (
          <div className="iptv-category-list">
            {groupedChannels.map((section) => (
              <section
                className="iptv-section"
                key={section.category}
              >
                <div className="iptv-section-heading">
                  <div>
                    <h2>{section.category}</h2>
                    <span>
                      {channels.filter(
                        (c) => c.group === section.category
                      ).length}{" "}
                      channels
                    </span>
                  </div>

                  <button
                    onClick={() =>
                      setActiveCategory(section.category)
                    }
                  >
                    See all
                    <ChevronRight size={17} />
                  </button>
                </div>

                <div className="iptv-rail">
                  {section.channels.map((channel) => (
                    <IPTVCard
                      key={channel.id}
                      channel={channel}
                      onPlay={setSelectedChannel}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}

      {!loading &&
        !error &&
        (activeCategory !== "All" || search.trim()) && (
          <section className="iptv-results">
            <div className="iptv-results-heading">
              <h2>
                {search
                  ? `Results for "${search}"`
                  : activeCategory}
              </h2>

              <span>
                {filteredChannels.length} channels
              </span>
            </div>

            {filteredChannels.length > 0 ? (
              <div className="iptv-grid">
                {filteredChannels.map((channel) => (
                  <IPTVCard
                    key={channel.id}
                    channel={channel}
                    onPlay={setSelectedChannel}
                  />
                ))}
              </div>
            ) : (
              <div className="iptv-state compact">
                <Search size={30} />
                <h3>No channels found</h3>
                <p>Try another search or category.</p>
              </div>
            )}
          </section>
        )}

      {!loading &&
        !error &&
        channels.length === 0 && (
          <div className="iptv-state">
            <Radio size={38} />
            <h3>No IPTV channels</h3>
            <p>Your M3U playlist is empty.</p>
          </div>
        )}

      {lastUpdated && (
        <div className="iptv-updated">
          Updated{" "}
          {lastUpdated.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      )}

      {selectedChannel && (
        <HLSPlayer
          channel={selectedChannel}
          onClose={() => setSelectedChannel(null)}
        />
      )}
    </main>
  );
}
