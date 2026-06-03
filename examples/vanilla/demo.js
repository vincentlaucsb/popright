import { contextMenuTheme, createContextMenu, createDropdownMenu } from "../../packages/core/dist/index.js";

// The visual tests use these globals to verify that the demo is exercising
// the package API rather than a private test-only helper.
window.__poprightCreateContextMenu = createContextMenu;
window.__poprightCreateDropdownMenu = createDropdownMenu;

const albums = [
  { id: "kill", year: "1983", title: "Kill 'Em All", songs: ["Seek & Destroy", "The Four Horsemen", "Whiplash"] },
  { id: "ride", year: "1984", title: "Ride the Lightning", songs: ["For Whom the Bell Tolls", "Fade to Black", "Creeping Death"] },
  { id: "master", year: "1986", title: "Master of Puppets", songs: ["Master of Puppets", "Battery", "Welcome Home (Sanitarium)"] },
  { id: "justice", year: "1988", title: "...And Justice for All", songs: ["One", "Blackened", "Harvester of Sorrow"] },
  { id: "black", year: "1991", title: "Metallica", songs: ["Enter Sandman", "Nothing Else Matters", "Sad but True"] },
  { id: "load", year: "1996", title: "Load", songs: ["Until It Sleeps", "King Nothing", "Hero of the Day"] },
  { id: "reload", year: "1997", title: "Reload", songs: ["Fuel", "The Memory Remains", "The Unforgiven II"] },
  { id: "st-anger", year: "2003", title: "St. Anger", trash: true, songs: ["Frantic", "St. Anger", "Some Kind of Monster"] },
  { id: "magnetic", year: "2008", title: "Death Magnetic", songs: ["The Day That Never Comes", "All Nightmare Long", "Cyanide"] },
  { id: "hardwired", year: "2016", title: "Hardwired... to Self-Destruct", songs: ["Hardwired", "Moth Into Flame", "Spit Out the Bone"] },
  { id: "seasons", year: "2023", title: "72 Seasons", songs: ["Lux Aeterna", "72 Seasons", "If Darkness Had a Son"] }
];

const albumList = document.querySelector("#albums");
const log = document.querySelector("#log");
const themeButtons = document.querySelectorAll("[data-theme-value]");

function trashIcon() {
  return `
    <span class="trash-icon" title="This one knows what it did" aria-label="Trash">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M3 6h18"></path>
        <path d="M8 6V4h8v2"></path>
        <path d="M19 6l-1 14H6L5 6"></path>
        <path d="M10 11v5"></path>
        <path d="M14 11v5"></path>
      </svg>
    </span>
  `;
}

function playIcon() {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("class", "menu-svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  const polygon = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
  polygon.setAttribute("points", "8 5 19 12 8 19 8 5");
  polygon.setAttribute("fill", "currentColor");
  svg.append(polygon);
  return svg;
}

function setThemeFromMenu(theme, event) {
  setTheme(theme);
  event.preventClose();
  log.textContent = `Theme set to ${theme}`;
}

albumList.innerHTML = albums.map((album) => `
  <div class="album-row" tabindex="0" data-album-id="${album.id}">
    <span class="album-mark">${album.year.slice(2)}</span>
    <span>
      <span class="album-title">${album.title}</span>
      <span class="album-meta">${album.year} · ${album.songs.length} menu tracks</span>
    </span>
    <span class="album-actions">
      ${album.trash ? trashIcon() : ""}
      <button class="album-action-button" type="button">Actions</button>
    </span>
  </div>
`).join("");

function setTheme(theme) {
  document.documentElement.dataset.theme = theme;
  contextMenuTheme.set(theme);
  for (const button of themeButtons) {
    button.setAttribute("aria-pressed", String(button.dataset.themeValue === theme));
  }
}

for (const button of themeButtons) {
  button.addEventListener("click", () => setTheme(button.dataset.themeValue));
}

setTheme("automatic");

const menuOptions = {
  // Popright can compute items at open time. The trigger event tells us which
  // row was clicked, so one menu definition can serve every album.
  items(context) {
    const row = context.triggerEvent.target.closest(".album-row");
    const album = albums.find((candidate) => candidate.id === row.dataset.albumId);
    const songItems = album.songs.map((song, index) => ({
      id: `${album.id}-${index}`,
      label: song,
      shortcut: `#${index + 1}`,
      icon: playIcon,
      value: { album, song, action: "play" }
    }));

    return [
      { type: "header", label: album.title, align: "items" },
      { type: "separator" },
      ...songItems,
      { type: "separator" },
      {
        type: "submenu",
        id: `${album.id}-more`,
        label: "More Info",
        value: { album },
        items: [
          {
            id: `${album.id}-search`,
            label: "Search YouTube",
            value: { album, action: "youtube" }
          },
          {
            id: `${album.id}-album`,
            label: "Album Details",
            value: { album, action: "album" }
          },
          {
            id: `${album.id}-lyrics`,
            label: "Find Lyrics",
            value: { album, action: "lyrics" }
          },
          {
            id: `${album.id}-wikipedia`,
            label: "Wikipedia",
            value: { album, action: "wikipedia" }
          },
          {
            id: `${album.id}-napster`,
            label: "Listen on Napster",
            disabled: true,
            value: { album, action: "napster" }
          }
        ]
      }
    ];
  },
  minWidth: 260,
  // Values travel with their item, so selection handlers do not need to parse
  // labels or ids to recover application data.
  onSelect({ item }) {
    const { album, song, action } = item.value;
    const query = encodeURIComponent(
      action === "album"
        ? `Metallica ${album.title} album`
        : action === "lyrics"
          ? `Metallica ${album.title} lyrics`
          : action === "wikipedia"
            ? `Metallica ${album.title} Wikipedia`
            : song
              ? `Metallica ${song}`
              : `Metallica ${album.title}`
    );
    log.textContent =
      action === "album"
        ? `Looking up ${album.title}`
        : action === "lyrics"
          ? `Finding lyrics for ${album.title}`
          : action === "wikipedia"
            ? `Opening Wikipedia results for ${album.title}`
            : `Opening ${song} from ${album.title}`;
    const url =
      action === "wikipedia"
        ? `https://en.wikipedia.org/w/index.php?search=${query}`
        : `https://www.youtube.com/results?search_query=${query}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }
};

// Context menus and dropdown/action menus share the same item model and
// selection behavior. The only difference here is the trigger interaction.
createContextMenu(document.querySelectorAll(".album-row"), menuOptions);
createDropdownMenu(document.querySelectorAll(".album-action-button"), menuOptions);

createContextMenu(document.body, {
  className: "page-context-menu",
  minWidth: 240,
  items: [
    { type: "header", label: "Page Menu" },
    {
      type: "submenu",
      id: "view-source",
      label: "View Source",
      items: [
        {
          id: "source-browser",
          label: "Browser",
          value: { action: "source-browser" }
        },
        {
          id: "source-github",
          label: "On GitHub",
          value: { action: "source-github" }
        }
      ]
    },
    { type: "separator" },
    {
      id: "theme-auto",
      label: "Auto",
      icon: "◐",
      value: { action: "theme", theme: "automatic" },
      onSelect(event) {
        setThemeFromMenu("automatic", event);
      }
    },
    {
      id: "theme-light",
      label: "Light",
      icon: "☼",
      value: { action: "theme", theme: "light" },
      onSelect(event) {
        setThemeFromMenu("light", event);
      }
    },
    {
      id: "theme-dark",
      label: "Dark",
      icon: "☾",
      value: { action: "theme", theme: "dark" },
      onSelect(event) {
        setThemeFromMenu("dark", event);
      }
    }
  ],
  onSelect({ item }) {
    const action = item.value?.action;
    if (action === "source-browser") {
      window.open(`view-source:${window.location.href}`, "_blank", "noopener,noreferrer");
      return;
    }
    if (action === "source-github") {
      window.open(
        "https://github.com/vincentlaucsb/popright/blob/main/examples/vanilla/demo.js",
        "_blank",
        "noopener,noreferrer"
      );
    }
  }
});
