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
import {
  parseM3U,
  getCategories,
} from "../lib/iptv";

import { getIPTVPlaylist } from "../lib/api";

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
          <Play
            size={20}
            fill="currentColor"
          />
        </div>

      </div>

      <div className="iptv-card-info">
        <strong>
          {channel.name}
        </strong>

        <span>
          {channel.group}
        </span>
      </div>
    </button>
  );
}

export default function IPTVPage() {

  const [channels, setChannels] = useState([]);

  const [activeCategory, setActiveCategory] =
    useState("All");

  const [search, setSearch] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  const [selectedChannel, setSelectedChannel] =
    useState(null);

  const [lastUpdated, setLastUpdated] =
    useState(null);

  const [playlistInfo, setPlaylistInfo] =
    useState(null);

  const loadPlaylist = async () => {

    try {

      setError("");

      /*
       * GET IPTV PLAYLIST FROM SUPABASE
       *
       * channels.name contains "IPTV"
       * channels.stream_url contains M3U URL
       */

      const playlist =
        await getIPTVPlaylist();

      if (!playlist) {
        throw new Error(
          "Hakuna IPTV playlist kwenye Supabase. Weka IPTV kwenye channels table."
        );
      }

      if (!playlist.stream_url) {
        throw new Error(
          "IPTV stream_url haijawekwa kwenye Supabase."
        );
      }

      setPlaylistInfo(playlist);

      /*
       * Fetch M3U playlist
       */

      /*
       * Fetch playlist through Vercel proxy.
       * This avoids browser CORS restrictions.
       */
      const response = await fetch(
        `/api/iptv?_=${Date.now()}`,
        {
          cache: "no-store",
        }
      );

      if (!response.ok) {
        throw new Error(
          `Playlist HTTP ${response.status}`
        );
      }

      const content =
        await response.text();

      /*
       * Parse + AUTO CATEGORY
       */

      const parsed =
        parseM3U(content);

      if (!parsed.length) {
        throw new Error(
          "Playlist imefunguka lakini hakuna channels zilizotambulika."
        );
      }

      setChannels(parsed);

      setLastUpdated(
        new Date()
      );

      /*
       * Reset filter after refresh
       */

      setActiveCategory("All");
      setSearch("");

    } catch (err) {

      console.error(
        "IPTV error:",
        err
      );

      setError(
        err?.message ||
        "Imeshindikana kufetch IPTV playlist."
      );

    } finally {

      setLoading(false);
      setRefreshing(false);

    }
  };

  useEffect(() => {
    loadPlaylist();
  }, []);

  /*
   * AUTO CATEGORIES
   */

  const categories =
    useMemo(
      () => getCategories(channels),
      [channels]
    );

  /*
   * FILTER
   */

  const filteredChannels =
    useMemo(() => {

      const query =
        search
          .trim()
          .toLowerCase();

      return channels.filter(
        (channel) => {

          const matchesCategory =
            activeCategory === "All" ||
            channel.group === activeCategory;

          const matchesSearch =
            !query ||
            channel.name
              .toLowerCase()
              .includes(query) ||
            channel.group
              .toLowerCase()
              .includes(query);

          return (
            matchesCategory &&
            matchesSearch
          );
        }
      );

    }, [
      channels,
      activeCategory,
      search
    ]);

  /*
   * CATEGORY RAILS
   */

  const groupedChannels =
    useMemo(() => {

      if (
        activeCategory !== "All" ||
        search.trim()
      ) {
        return [];
      }

      return categories
        .map(category => {

          const categoryChannels =
            channels.filter(
              channel =>
                channel.group === category
            );

          return {
            category,
            total:
              categoryChannels.length,
            channels:
              categoryChannels.slice(0, 20)
          };

        })
        .filter(
          section =>
            section.channels.length > 0
        );

    }, [
      channels,
      categories,
      activeCategory,
      search
    ]);

  const refresh = () => {
    setRefreshing(true);
    loadPlaylist();
  };

  return (
    <main className="iptv-page">

      {/* HEADER */}

      <section className="iptv-header">

        <div>

          <div className="iptv-title-row">

            <div className="iptv-title-icon">
              <Radio size={25} />
            </div>

            <div>

              <h1>
                IPTV
              </h1>

              <p>
                Live channels from your playlist
              </p>

            </div>

          </div>

        </div>

        <button
          type="button"
          className="iptv-refresh"
          onClick={refresh}
          disabled={refreshing}
        >

          {refreshing ? (
            <Loader2
              className="spin"
              size={18}
            />
          ) : (
            <RefreshCw size={18} />
          )}

          <span>
            Refresh
          </span>

        </button>

      </section>

      {/* SUPABASE STATUS */}

      {playlistInfo && (
        <div className="iptv-source">

          <span className="iptv-source-dot" />

          <span>
            Connected to Supabase
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
            <strong>
              {categories.length}
            </strong>

            Categories
          </span>
        </div>

        <div>
          <Wifi size={18} />

          <span>
            <strong>
              LIVE
            </strong>

            IPTV
          </span>
        </div>

      </section>

      {/* SEARCH */}

      <div className="iptv-search">

        <Search size={19} />

        <input
          type="search"
          placeholder="Search IPTV channels..."
          value={search}
          onChange={(e) => {

            setSearch(
              e.target.value
            );

            setActiveCategory(
              "All"
            );

          }}
        />

        {search && (
          <button
            type="button"
            onClick={() =>
              setSearch("")
            }
          >
            <X size={17} />
          </button>
        )}

      </div>

      {/* CATEGORIES */}

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

              setActiveCategory(
                "All"
              );

              setSearch("");

            }}
          >
            All
          </button>

          {categories.map(
            category => (

              <button
                type="button"
                key={category}
                className={
                  activeCategory === category
                    ? "active"
                    : ""
                }
                onClick={() => {

                  setActiveCategory(
                    category
                  );

                  setSearch("");

                }}
              >
                {category}
              </button>

            )
          )}

        </div>

      )}

      {/* LOADING */}

      {loading && (

        <div className="iptv-state">

          <Loader2
            className="spin"
            size={35}
          />

          <h3>
            Loading IPTV
          </h3>

          <p>
            Fetching channels from Supabase playlist...
          </p>

        </div>

      )}

      {/* ERROR */}

      {!loading && error && (

        <div className="iptv-error">

          <AlertCircle size={30} />

          <div>

            <h3>
              IPTV unavailable
            </h3>

            <p>
              {error}
            </p>

          </div>

          <button
            type="button"
            onClick={refresh}
          >
            Try again
          </button>

        </div>

      )}

      {/* ALL CATEGORY RAILS */}

      {!loading &&
        !error &&
        channels.length > 0 &&
        activeCategory === "All" &&
        !search.trim() && (

          <div className="iptv-category-list">

            {groupedChannels.map(
              section => (

                <section
                  className="iptv-section"
                  key={section.category}
                >

                  <div className="iptv-section-heading">

                    <div>

                      <h2>
                        {section.category}
                      </h2>

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

                      <ChevronRight
                        size={17}
                      />

                    </button>

                  </div>

                  <div className="iptv-rail">

                    {section.channels.map(
                      channel => (

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

              )
            )}

          </div>

        )}

      {/* FILTERED RESULTS */}

      {!loading &&
        !error &&
        (
          activeCategory !== "All" ||
          search.trim()
        ) && (

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
                  channel => (

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

              <div className="iptv-state compact">

                <Search size={30} />

                <h3>
                  No channels found
                </h3>

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

          <div className="iptv-state">

            <Radio size={38} />

            <h3>
              No IPTV channels
            </h3>

            <p>
              Your Supabase IPTV playlist is empty.
            </p>

          </div>

        )}

      {/* LAST UPDATED */}

      {lastUpdated && (

        <div className="iptv-updated">

          Updated{" "}
          {lastUpdated.toLocaleTimeString(
            [],
            {
              hour: "2-digit",
              minute: "2-digit"
            }
          )}

        </div>

      )}

      {/* PLAYER */}

      {selectedChannel && (

        <HLSPlayer
          channel={
            selectedChannel
          }
          onClose={() =>
            setSelectedChannel(null)
          }
        />

      )}

    </main>
  );
}
