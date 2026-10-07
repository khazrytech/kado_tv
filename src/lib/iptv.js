const CATEGORY_RULES = [
  {
    name: "Sports",
    keywords: [
      "sport",
      "sports",
      "football",
      "soccer",
      "nba",
      "nfl",
      "nhl",
      "mlb",
      "tennis",
      "golf",
      "boxing",
      "ufc",
      "wrestling",
      "formula 1",
      "f1",
      "motorsport",
      "racing",
      "cricket",
      "rugby"
    ]
  },

  {
    name: "News",
    keywords: [
      "news",
      "breaking news",
      "world news",
      "international news",
      "business news",
      "financial news",
      "politics",
      "current affairs"
    ]
  },

  {
    name: "Movies",
    keywords: [
      "movie",
      "movies",
      "cinema",
      "film",
      "films",
      "hollywood",
      "bollywood"
    ]
  },

  {
    name: "Entertainment",
    keywords: [
      "entertainment",
      "ent",
      "show",
      "shows",
      "reality",
      "celebrity",
      "lifestyle",
      "comedy",
      "variety"
    ]
  },

  {
    name: "Kids",
    keywords: [
      "kids",
      "kid",
      "children",
      "child",
      "cartoon",
      "cartoons",
      "animation",
      "family"
    ]
  },

  {
    name: "Music",
    keywords: [
      "music",
      "musics",
      "mtv",
      "concert",
      "radio",
      "audio"
    ]
  },

  {
    name: "Documentary",
    keywords: [
      "documentary",
      "documentaries",
      "history",
      "science",
      "nature",
      "discovery"
    ]
  }
];

function normalizeText(value = "") {
  return String(value)
    .toLowerCase()
    .replace(/[|/\\_\-.()[\]{}]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isTanzania(
  country = "",
  tvgId = "",
  channelName = "",
  group = ""
) {
  const values = [
    country,
    tvgId,
    channelName,
    group
  ].map(normalizeText);

  return values.some(value =>
    value === "tz" ||
    value === "tza" ||
    value.includes("tanzania") ||
    value.endsWith(".tz") ||
    value.includes(" tanzania ")
  );
}

export function normalizeCategory(
  groupTitle = "",
  channelName = ""
) {
  const group = normalizeText(groupTitle);
  const name = normalizeText(channelName);

  for (const category of CATEGORY_RULES) {
    for (const keyword of category.keywords) {
      const normalizedKeyword =
        normalizeText(keyword);

      if (
        group.includes(normalizedKeyword) ||
        name.includes(normalizedKeyword)
      ) {
        return category.name;
      }
    }
  }

  if (groupTitle?.trim()) {
    return groupTitle.trim();
  }

  return "Other";
}

export function parseM3U(content = "") {
  const lines = content
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean);

  const channels = [];
  const seen = new Set();

  let current = null;

  for (const line of lines) {
    if (line.startsWith("#EXTINF")) {
      const commaIndex = line.indexOf(",");

      const info =
        commaIndex >= 0
          ? line.slice(0, commaIndex)
          : line;

      const rawName =
        commaIndex >= 0
          ? line.slice(commaIndex + 1).trim()
          : "Unknown Channel";

      const getAttr = (attribute) => {
        const regex = new RegExp(
          `${attribute}="([^"]*)"`,
          "i"
        );

        return (
          info.match(regex)?.[1]?.trim() || ""
        );
      };

      const originalGroup =
        getAttr("group-title") ||
        getAttr("group") ||
        "";

      const tvgLogo =
        getAttr("tvg-logo");

      const tvgId =
        getAttr("tvg-id");

      const tvgName =
        getAttr("tvg-name");

      const country =
        getAttr("tvg-country");

      const language =
        getAttr("tvg-language");

      const name =
        rawName ||
        tvgName ||
        "Unknown Channel";

      const localTanzania =
        isTanzania(
          country,
          tvgId,
          name,
          originalGroup
        );

      current = {
        name,
        logo: tvgLogo,
        originalGroup,

        group: localTanzania
          ? "Tanzania"
          : normalizeCategory(
              originalGroup,
              name
            ),

        country,
        language,
        tvgId,
        tvgName,

        isTanzania: localTanzania
      };

      continue;
    }

    if (
      !line.startsWith("#") &&
      current &&
      (
        line.startsWith("http://") ||
        line.startsWith("https://")
      )
    ) {
      const url = line;

      const duplicateKey =
        current.tvgId ||
        `${normalizeText(current.name)}|${url}`;

      if (!seen.has(duplicateKey)) {
        seen.add(duplicateKey);

        channels.push({
          ...current,
          url,

          id:
            current.tvgId ||
            `${normalizeText(current.name)}-${channels.length}`
        });
      }

      current = null;
    }
  }

  return channels;
}

export function getCategories(channels = []) {
  const categories = [
    ...new Set(
      channels
        .map(channel => channel.group)
        .filter(Boolean)
    )
  ];

  const preferred = [
    "Tanzania",
    "Sports",
    "News",
    "Movies",
    "Entertainment",
    "Kids",
    "Music",
    "Documentary",
    "Other"
  ];

  return categories.sort((a, b) => {
    const ai = preferred.indexOf(a);
    const bi = preferred.indexOf(b);

    if (ai !== -1 && bi !== -1) {
      return ai - bi;
    }

    if (ai !== -1) return -1;
    if (bi !== -1) return 1;

    return a.localeCompare(b);
  });
}

export function groupChannelsByCategory(
  channels = []
) {
  return channels.reduce((groups, channel) => {
    const category =
      channel.group || "Other";

    if (!groups[category]) {
      groups[category] = [];
    }

    groups[category].push(channel);

    return groups;
  }, {});
}
