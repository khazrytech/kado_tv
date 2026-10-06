import React, { useEffect, useMemo, useState } from "react";
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

function ChannelLogo({ channel }) {
  const [failed, setFailed] = useState(false);

  if (!channel?.logo || failed) {
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
      type="button"
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
        <strong>{channel.name || "Unknown Channel"}</strong>
        <span>{channel.group || "Other"}</span>
      </div>
    </button>
  );
}

const stateStyle = {
  minHeight: "280px",
  width: "100%",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  padding: "40px 20px",
  boxSizing: "border-box",
};

export default function IPTVPage() {
  const [channels, setChannels] = useState([]);
  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [playlistInfo, setPlaylistInfo] = useState(null);

  const loadPlaylist = async () => {
    setError("");

    try {
      const controller = new AbortController();

      const timeout = setTimeout(() => {
        controller.abort();
      }, 30000);

      const response = await fetch(
        `/api/iptv?_=${Date.now()}`,
        {
          method: "GET",
          cache: "no-store",
          headers: {
            Accept: "text/plain",
          },
          signal: controller.signal,
        }
      );

      clearTimeout(timeout);

      if (!response.ok) {
        const errorText = await response.text().catch(() => "");

        throw new Error(
          `IPTV API HTTP ${response.status}${
            errorText ? ` — ${errorText.slice(0, 180)}` : ""
          }`
        );
      }

      const content = await response.text();

      if (!content.trim()) {
        throw new Error("IPTV API imerudisha playlist tupu.");
      }

      if (
        !content.includes("#EXTM3U") &&
        !content.includes("#EXTINF")
      ) {
        throw new Error(
          "Response ya IPTV si M3U playlist halali."
        );
      }

      const parsed = parseM3U(content);

      if (!parsed.length) {
        throw new Error(
          "M3U imefunguka lakini hakuna channels zilizotambulika."
        );
      }

      setChannels(parsed);

      setPlaylistInfo({
        name: "Supabase IPTV Playlist",
        size: content.length,
        rawLines: content.split(/\r?\n/).length,
      });

      setLastUpdated(new Date());
      setActiveCategory("All");
      setSearch("");
    } catch (err) {
      console.error("KadoTV IPTV:", err);

      let message = err?.message || "Imeshindikana kufungua IPTV.";

      if (err?.name === "AbortError") {
        message =
          "IPTV playlist imechukua muda mrefu kujibu. Hakikisha Vercel API na playlist URL vinafanya kazi.";
      }

      setError(message);
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
      const name = String(channel?.name || "").toLowerCase();
      const group = String(channel?.group || "").toLowerCase();

      const matchesCategory =
        activeCategory === "All" ||
        channel.group === activeCategory;

      const matchesSearch =
        !query ||
        name.includes(query) ||
        group.includes(query);

      return matchesCategory && matchesSearch;
    });
  }, [channels, activeCategory, search]);

  const groupedChannels = useMemo(() => {
    if (activeCategory !== "All" || search.trim()) {
      return [];
    }

    return categories
      .map((category) => {
        const categoryChannels = channels.filter(
          (channel) => channel.group === category
        );

        return {
          category,
          total: categoryChannels.length,
          channels: categoryChannels.slice(0, 20),
        };
      })
      .filter((section) => section.channels.length > 0);
  }, [
    channels,
    categories,
    activeCategory,
    search,
  ]);

  const refresh = () => {
    setRefreshing(true);
    setLoading(true);
    loadPlaylist();
  };

  return (
    <main
      className="iptv-page"
      style={{
        width: "100%",
        minHeight: "60vh",
        boxSizing: "border-box",
      }}
    >
      {/* HEADER */}
      <section className="iptv-header">
        <div className="iptv-title-row">
          <div className="iptv-title-icon">
            <Radio size={25} />
          </div>

          <div>
            <h1>IPTV</h1>
            <p>Live channels from your playlist</p>
          </div>
        </div>

        <button
          type="button"
          className="iptv-refresh"
          onClick={refresh}
          disabled={refreshing}
        >
          {refreshing ? (
            <Loader2 className="spin" size={18} />
          ) : (
            <RefreshCw size={18} />
          )}

          <span>
            {refreshing ? "Loading..." : "Refresh"}
          </span>
        </button>
      </section>

      {/* CONNECTION */}
      {playlistInfo && !error && (
        <div className="iptv-source">
          <span className="iptv-source-dot" />

          <span>
            Connected to Supabase •{" "}
            {playlistInfo.name}
          </span>
        </div>
      )}

      {/* STATS */}
      <section className="iptv-stats">
        <div>
          <Radio size={18} />

          <span>
            <strong>
              {channels.length.toLocaleString()}
            </strong>
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

      {/* LOADING */}
      {loading && (
        <div
          className="iptv-state"
          style={stateStyle}
        >
          <Loader2
            size={42}
            className="spin"
          />

          <h3 style={{ marginTop: 18 }}>
            Loading IPTV...
          </h3>

          <p>
            Connecting to Supabase IPTV playlist.
          </p>

          <small
            style={{
              marginTop: 10,
              opacity: 0.6,
            }}
          >
            Please wait...
          </small>
        </div>
      )}

      {/* ERROR */}
      {!loading && error && (
        <div
          className="iptv-error"
          style={{
            margin: "25px 0",
            padding: "24px",
            borderRadius: "18px",
            border: "1px solid rgba(255,70,90,.25)",
            background: "rgba(255,40,60,.07)",
            display: "flex",
            gap: "16px",
            alignItems: "flex-start",
          }}
        >
          <AlertCircle
            size={32}
            style={{ flexShrink: 0 }}
          />

          <div style={{ flex: 1 }}>
            <h3>IPTV unavailable</h3>

            <p
              style={{
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
            >
              {error}
            </p>

            <button
              type="button"
              onClick={refresh}
              style={{
                marginTop: 12,
                padding: "10px 16px",
                border: 0,
                borderRadius: 10,
                cursor: "pointer",
                fontWeight: 700,
              }}
            >
              Try again
            </button>
          </div>
        </div>
      )}

      {/* SEARCH + CATEGORIES */}
      {!loading && !error && channels.length > 0 && (
        <>
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
              <button
                type="button"
                onClick={() => setSearch("")}
              >
                <X size={17} />
              </button>
            )}
          </div>

          {categories.length > 0 && (
            <div className="iptv-categories">
              <button
                type="button"
                className={
                  activeCategory === "All"
                    ? "active"
                    : ""
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
                  type="button"
                  key={category}
                  className={
                    activeCategory === category
                      ? "active"
                      : ""
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
        </>
      )}

      {/* CATEGORY RAILS */}
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
                      {section.total} channels
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setActiveCategory(
                        section.category
                      )
                    }
                  >
                    See all
                    <ChevronRight size={17} />
                  </button>
                </div>

                <div className="iptv-rail">
                  {section.channels.map(
                    (channel) => (
                      <IPTVCard
                        key={channel.id}
                        channel={channel}
                        onPlay={
                          setSelectedChannel
                        }
                      />
                    )
                  )}
                </div>
              </section>
            ))}
          </div>
        )}

      {/* FILTERED RESULTS */}
      {!loading &&
        !error &&
        (activeCategory !== "All" ||
          search.trim()) && (
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
                {filteredChannels.map(
                  (channel) => (
                    <IPTVCard
                      key={channel.id}
                      channel={channel}
                      onPlay={
                        setSelectedChannel
                      }
                    />
                  )
                )}
              </div>
            ) : (
              <div
                className="iptv-state compact"
                style={stateStyle}
              >
                <Search size={30} />

                <h3>No channels found</h3>

                <p>
                  Try another search or category.
                </p>
              </div>
            )}
          </section>
        )}

      {/* EMPTY */}
      {!loading &&
        !error &&
        channels.length === 0 && (
          <div
            className="iptv-state"
            style={stateStyle}
          >
            <Radio size={38} />

            <h3>No IPTV channels</h3>

            <p>
              Your Supabase IPTV playlist is empty.
            </p>
          </div>
        )}

      {/* UPDATED */}
      {lastUpdated && (
        <div className="iptv-updated">
          Updated{" "}
          {lastUpdated.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      )}

      {/* PLAYER */}
      {selectedChannel && (
        <HLSPlayer
          channel={selectedChannel}
          onClose={() =>
            setSelectedChannel(null)
          }
        />
      )}
    </main>
  );
}
