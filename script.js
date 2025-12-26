/* ---------------------------------------------------
   TAB SWITCHING
--------------------------------------------------- */
document.querySelectorAll(".tab-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));

    btn.classList.add("active");
    document.getElementById(btn.dataset.tab).classList.add("active");
  });
});

/* HOME → DEMONLIST BUTTON */
function openDemonlistFromHome() {
  document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
  document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));

  document.querySelector('.tab-btn[data-tab="demonlist"]').classList.add("active");
  document.getElementById("demonlist").classList.add("active");
}

/* ---------------------------------------------------
   THEME TOGGLE
--------------------------------------------------- */
function toggleTheme() {
  document.body.classList.toggle("light-mode");
  localStorage.setItem("theme", document.body.classList.contains("light-mode") ? "light" : "dark");
}

if (localStorage.getItem("theme") === "light") {
  document.body.classList.add("light-mode");
}

/* ---------------------------------------------------
   GLOBAL DEMON STORAGE
--------------------------------------------------- */
let globalDemons = [];
let minusDemons = [];

/* ---------------------------------------------------
   LOAD MAIN DEMONLIST
--------------------------------------------------- */
async function loadDemonList() {
  try {
    const list = await fetch("data/list.json").then(r => r.json());
    const container = document.getElementById("demon-container");

    const demonFiles = await Promise.all(
      list.map(id =>
        fetch(`data/demons/${id}.json`)
          .then(r => (r.ok ? r.json() : null))
          .catch(() => null)
      )
    );

    globalDemons = demonFiles
      .map((d, i) => (d ? { ...d, position: i + 1 } : null))
      .filter(Boolean);

    globalDemons.forEach(demon => {
      const card = createDemonCard(demon);
      container.appendChild(card);
    });

    setupSearchBar();
    loadLeaderboard();
  } catch (e) {
    console.error("Error loading main demonlist:", e);
  }
}

/* ---------------------------------------------------
   LOAD DEMONLIST -
--------------------------------------------------- */
async function loadDemonListMinus() {
  try {
    const list = await fetch("data/list_minus.json").then(r => r.json());
    const container = document.getElementById("demon-container-minus");

    const demonFiles = await Promise.all(
      list.map(id =>
        fetch(`data/demons/${id}.json`)
          .then(r => (r.ok ? r.json() : null))
          .catch(() => null)
      )
    );

    minusDemons = demonFiles.filter(Boolean);

    minusDemons.forEach(demon => {
      const card = createDemonCard(demon);
      container.appendChild(card);
    });

    setupMinusSearch();
    loadLeaderboardMinus(minusDemons);
  } catch (e) {
    console.error("Error loading Demonlist -:", e);
  }
}

/* ---------------------------------------------------
   SEARCH BAR (MAIN)
--------------------------------------------------- */
function setupSearchBar() {
  const searchBar = document.getElementById("search-bar");
  if (!searchBar) return;

  searchBar.addEventListener("input", () => {
    const query = searchBar.value.toLowerCase();

    document.querySelectorAll("#demon-container .demon-card").forEach(card => {
      const name = card.querySelector("h2").textContent.toLowerCase();
      card.style.display = name.includes(query) ? "flex" : "none";
    });
  });
}

/* ---------------------------------------------------
   SEARCH BAR (MINUS)
--------------------------------------------------- */
function setupMinusSearch() {
  const searchBar = document.getElementById("search-bar-minus");
  if (!searchBar) return;

  searchBar.addEventListener("input", () => {
    const query = searchBar.value.toLowerCase();

    document.querySelectorAll("#demon-container-minus .demon-card").forEach(card => {
      const name = card.querySelector("h2").textContent.toLowerCase();
      card.style.display = name.includes(query) ? "flex" : "none";
    });
  });
}

/* ---------------------------------------------------
   YOUTUBE HELPERS
--------------------------------------------------- */
function getYoutubeThumbnail(url) {
  if (!url || typeof url !== "string") return null;

  try {
    let videoId = null;

    if (url.includes("youtube.com/watch")) {
      videoId = new URL(url).searchParams.get("v");
    } else if (url.includes("youtu.be/")) {
      videoId = url.split("youtu.be/")[1].split("?")[0];
    }

    if (!videoId || videoId.length < 5) return null;
    return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
  } catch {
    return null;
  }
}

function extractVideoID(url) {
  try {
    if (url.includes("youtube.com/watch")) {
      return new URL(url).searchParams.get("v");
    }
    if (url.includes("youtu.be/")) {
      return url.split("youtu.be/")[1].split("?")[0];
    }
  } catch {}
  return null;
}

/* ---------------------------------------------------
   DEMON CARD
--------------------------------------------------- */
function createDemonCard(demon) {
  const card = document.createElement("div");
  card.className = "demon-card";

  const img = document.createElement("img");
  img.src = getYoutubeThumbnail(demon.verification) || "fallback.png";

  const info = document.createElement("div");
  info.className = "demon-info";

  const creatorsText = Array.isArray(demon.creators)
    ? demon.creators.join(", ")
    : (demon.creators || "Unknown");

  const demonScore = demon.position <= 75
    ? (350 / Math.sqrt(demon.position))
    : 0;

  const positionLabel = demon.position > 75 ? "Legacy" : "#" + demon.position;

  info.innerHTML = `
    <h2>${positionLabel} — ${demon.name}</h2>
    <p><strong>Author:</strong> ${demon.author}</p>
    <p><strong>Creators:</strong> ${creatorsText}</p>
    <p><strong>Verifier:</strong> ${demon.verifier}</p>
    <p><strong>Percent to Qualify:</strong> ${demon.percentToQualify}%</p>
    <p><strong>Score Value:</strong> ${demonScore.toFixed(2)}</p>
  `;

  const viewBtn = document.createElement("button");
  viewBtn.className = "dropdown-btn";
  viewBtn.textContent = "View Demon Page";
  viewBtn.addEventListener("click", () => openDemonPage(demon));
  info.appendChild(viewBtn);

  const btn = document.createElement("button");
  btn.className = "dropdown-btn";
  btn.textContent = "Show Records";

  const dropdown = document.createElement("div");
  dropdown.className = "record-dropdown";

  if (Array.isArray(demon.records) && demon.records.length > 0) {
    demon.records.forEach(r => {
      const p = document.createElement("p");
      p.innerHTML = `
        <strong>${r.user}</strong> — ${r.percent}% (${r.hz}hz)
        ${r.link ? `<br><a href="${r.link}" target="_blank">Video</a>` : ""}
      `;
      dropdown.appendChild(p);
    });
  } else {
    dropdown.innerHTML = "<p>No records yet.</p>";
  }

  btn.addEventListener("click", () => {
    const visible = dropdown.style.display === "block";
    dropdown.style.display = visible ? "none" : "block";
    btn.textContent = visible ? "Show
