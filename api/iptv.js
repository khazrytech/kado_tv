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
      `&order=created_at.desc` +
      `&limit=1`;

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

    if (!Array.isArray(rows) || !rows.length) {
      return res.status(404).json({
        error: "No IPTV playlist found in Supabase"
      });
    }

    const playlist = rows[0];

    if (!playlist.stream_url) {
      return res.status(404).json({
        error: "IPTV stream_url is empty"
      });
    }

    const remote = await fetch(playlist.stream_url, {
      headers: {
        "User-Agent": "KadoTV/1.0",
        "Accept": "text/plain,*/*"
      }
    });

    if (!remote.ok) {
      return res.status(502).json({
        error: `Playlist server returned ${remote.status}`
      });
    }

    const content = await remote.text();

    if (!content.includes("#EXTM3U") &&
        !content.includes("#EXTINF")) {
      return res.status(502).json({
        error: "Supabase URL did not return a valid M3U playlist"
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

    return res.status(200).send(content);

  } catch (error) {
    console.error("KadoTV IPTV API:", error);

    return res.status(500).json({
      error: error?.message || "IPTV server error"
    });
  }
}
