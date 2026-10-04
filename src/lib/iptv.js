export function parseM3U(content) {
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const channels = [];
  let current = null;

  for (const line of lines) {
    if (line.startsWith("#EXTINF")) {
      const commaIndex = line.indexOf(",");
      const info = commaIndex >= 0 ? line.slice(0, commaIndex) : line;
      const name =
        commaIndex >= 0
          ? line.slice(commaIndex + 1).trim()
          : "Unknown Channel";

      const getAttr = (attr) => {
        const regex = new RegExp(`${attr}="([^"]*)"`, "i");
        return info.match(regex)?.[1]?.trim() || "";
      };

      current = {
        name: name || "Unknown Channel",
        logo: getAttr("tvg-logo"),
        group: getAttr("group-title") || "Other",
        tvgId: getAttr("tvg-id"),
        tvgName: getAttr("tvg-name"),
      };

      continue;
    }

    if (!line.startsWith("#") && current) {
      if (
        line.startsWith("http://") ||
        line.startsWith("https://")
      ) {
        channels.push({
          ...current,
          url: line,
          id: `${current.name}-${channels.length}-${line}`,
        });
      }

      current = null;
    }
  }

  return channels;
}

export function getCategories(channels) {
  const categories = [
    ...new Set(
      channels
        .map((channel) => channel.group?.trim())
        .filter(Boolean)
    ),
  ];

  return categories.sort((a, b) => a.localeCompare(b));
}
