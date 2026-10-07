export default async function handler(req, res) {
  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({
        error: "Supabase environment variables missing"
      });
    }

    const dbUrl =
      `${supabaseUrl}/rest/v1/channels` +
      `?select=id,name,stream_url,category,is_active,created_at` +
      `&is_active=eq.true` +
      `&stream_url=not.is.null` +
      `&name=ilike.*IPTV*` +
      `&order=created_at.desc`;

    const db = await fetch(dbUrl, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`
      }
    });

    if (!db.ok) {
      const body = await db.text();

      return res.status(502).json({
        error: `Supabase error ${db.status}`,
        details: body
      });
    }

    const rows = await db.json();

    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(404).json({
        error: "No IPTV playlist found in Supabase"
      });
    }

    const playlistUrls = [
      ...rows.map(row => row.stream_url).filter(Boolean),

      // Tanzania local channels
      "https://iptv-org.github.io/iptv/countries/tz.m3u"
    ];

    const uniqueUrls = [
      ...new Set(playlistUrls)
    ];

    const results = await Promise.allSettled(
      uniqueUrls.map(async (url) => {
        const remote = await fetch(url, {
          headers: {
            "User-Agent": "KadoTV/1.0",
            "Accept": "text/plain,*/*"
          }
        });

        if (!remote.ok) {
          throw new Error(
            `${url} returned HTTP ${remote.status}`
          );
        }

        return await remote.text();
      })
    );

    const validPlaylists = results
      .filter(result => result.status === "fulfilled")
      .map(result => result.value)
      .filter(content =>
        content.includes("#EXTM3U") ||
        content.includes("#EXTINF")
      );

    if (!validPlaylists.length) {
      return res.status(502).json({
        error: "None of the IPTV playlists could be loaded."
      });
    }

    const merged = [
      "#EXTM3U",

      ...validPlaylists.map(content =>
        content
          .replace(/^\s*#EXTM3U\s*/i, "")
          .trim()
      )
    ]
      .filter(Boolean)
      .join("\n");

    if (!merged.includes("#EXTINF")) {
      return res.status(502).json({
        error: "No valid IPTV channels found."
      });
    }

    res.setHeader(
      "Content-Type",
      "text/plain; charset=utf-8"
    );

    res.setHeader(
      "Cache-Control",
      "no-store, no-cache, must-revalidate"
    );

    return res.status(200).send(merged);

  } catch (error) {
    console.error("KadoTV IPTV API:", error);

    return res.status(500).json({
      error: error?.message || "IPTV server error"
    });
  }
}
