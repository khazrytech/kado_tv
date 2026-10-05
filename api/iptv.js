export default async function handler(request, response) {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return response.status(500).json({
      error: "Supabase environment variables are missing."
    });
  }

  try {
    const params = new URLSearchParams({
      select: "id,name,stream_url,category,is_active",
      is_active: "eq.true",
      stream_url: "not.is.null",
      name: "ilike.*IPTV*",
      order: "created_at.desc",
      limit: "1"
    });

    const dbResponse = await fetch(
      `${supabaseUrl}/rest/v1/channels?${params.toString()}`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`
        },
        cache: "no-store"
      }
    );

    if (!dbResponse.ok) {
      return response.status(502).json({
        error: `Supabase query failed: ${dbResponse.status}`
      });
    }

    const rows = await dbResponse.json();
    const playlist = rows?.[0];

    if (!playlist?.stream_url) {
      return response.status(404).json({
        error: "No active IPTV playlist found in Supabase."
      });
    }

    const playlistResponse = await fetch(
      playlist.stream_url,
      {
        headers: {
          Accept:
            "application/x-mpegURL, application/vnd.apple.mpegurl, text/plain, */*"
        },
        cache: "no-store"
      }
    );

    if (!playlistResponse.ok) {
      return response.status(502).json({
        error:
          `Playlist server returned HTTP ${playlistResponse.status}`
      });
    }

    const content = await playlistResponse.text();

    if (!content.includes("#EXTINF")) {
      return response.status(502).json({
        error:
          "Playlist URL haijarudisha channel-list M3U."
      });
    }

    response.setHeader(
      "Content-Type",
      "text/plain; charset=utf-8"
    );

    response.setHeader(
      "Cache-Control",
      "no-store, no-cache, must-revalidate"
    );

    return response.status(200).send(content);

  } catch (error) {
    console.error("IPTV proxy error:", error);

    return response.status(500).json({
      error:
        error?.message ||
        "Unable to fetch IPTV playlist."
    });
  }
}
