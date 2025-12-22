/* ---------------------------------------------------
   MOBILE DETECTION
--------------------------------------------------- */
function detectMobile() {
  const isMobile =
    /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent) ||
    window.innerWidth < 768;

  if (isMobile) {
    document.body.classList.add("mobile");
  } else {
    document.body.classList.remove("mobile");
  }
}

detectMobile();
window.addEventListener("resize", detectMobile);

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

/* ---------------------------------------------------
   GLOBAL DEMON STORAGE
--------------------------------------------------- */
let globalDemons = []; // used for leaderboard + profiles

/* ---------------------------------------------------
   LOAD ALL DEMONS IN PARALLEL (FAST)
--------------------------------------------------- */
async function loadDemonList() {
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

  loadLeaderboard();
}

/* ---------------------------------------------------
   FIXED YOUTUBE THUMBNAIL (youtube.com + youtu.be)
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

/* ---------------------------------------------------
   DEMON CARD BUILDER
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

  /* UPDATED SCORE FORMULA: 200 instead of 150 */
  const demonScore = demon.position <= 75
    ? (200 / Math.sqrt(demon.position))
    : 0;

  const positionLabel = demon.position > 75 ? "Legacy" : "#" + demon.position;

  info.innerHTML = `
    <h2>${positionLabel} — ${demon.name}</h2>
    <p><strong>Author:</strong> ${demon.author}</p>
    <p><strong>Creators:</strong> ${creatorsText}</p>
    <p><strong>Verifier:</strong> ${demon.verifier}</p>
    <p><strong>Percent to Qualify:</strong> ${demon.percentToQualify}%</p>
    <p><strong>Score Value:</strong> ${demonScore.toFixed(2)}</p>
    ${demon.verification ? `<a href="${demon.verification}" target="_blank">Watch verification</a>` : ""}
  `;

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
    btn.textContent = visible ? "Show Records" : "Hide Records";
  });

  info.appendChild(btn);
  info.appendChild(dropdown);

  card.appendChild(img);
  card.appendChild(info);

  return card;
}

/* ---------------------------------------------------
   LEADERBOARD SYSTEM
--------------------------------------------------- */
function loadLeaderboard() {
  const players = {};

  globalDemons.forEach(demon => {
    const pos = demon.position;

    /* UPDATED SCORE FORMULA: 200 instead of 150 */
    const demonScore = pos <= 75 ? 200 / Math.sqrt(pos) : 0;

    if (demon.verifier) {
      const name = demon.verifier;

      if (!players[name]) {
        players[name] = { score: 0, records: [] };
      }

      players[name].score += demonScore;

      players[name].records.push({
        demon: demon.name,
        position: demon.position,
        percent: 100,
        link: demon.verification || null,
        type: "Verification"
      });
    }

    if (Array.isArray(demon.records)) {
      demon.records.forEach(rec => {
        const playerName = rec.user;
        const scoreGain = demonScore * (rec.percent / 100);

        if (!players[playerName]) {
          players[playerName] = { score: 0, records: [] };
        }

        players[playerName].score += scoreGain;

        players[playerName].records.push({
          demon: demon.name,
          position: demon.position,
          percent: rec.percent,
          link: rec.link,
          type: "Record"
        });
      });
    }
  });

  const sorted = Object.entries(players)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.score - a.score);

  const container = document.getElementById("leaderboard-container");
  container.innerHTML = "";

  sorted.forEach((p, i) => {
    const row = document.createElement("div");
    row.className = "leaderboard-row";
    row.innerHTML = `
      <span>${i + 1}</span>
      <span class="clickable-player" data-player="${p.name}">${p.name}</span>
      <span>${p.score.toFixed(2)}</span>
    `;
    container.appendChild(row);
  });

  document.querySelectorAll(".clickable-player").forEach(el => {
    el.addEventListener("click", () => {
      const name = el.dataset.player;
      showPlayerProfile(name, players[name]);
    });
  });
}

/* ---------------------------------------------------
   PLAYER PROFILE VIEW
--------------------------------------------------- */
function showPlayerProfile(name, data) {
  document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
  document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));

  document.getElementById("profile").classList.add("active");

  const container = document.getElementById("profile-container");
  container.innerHTML = `
    <h2>${name}</h2>
    <p><strong>Total score:</strong> ${data.score.toFixed(2)}</p>
    <h3>Records:</h3>
  `;

  data.records.sort((a, b) => a.position - b.position);

  data.records.forEach(r => {
    const div = document.createElement("div");
    div.className = "leaderboard-row";

    const posLabel = r.position > 75 ? "Legacy" : "#" + r.position;
    const typeLabel = r.type === "Verification" ? "(Verification)" : "";

    div.innerHTML = `
      <span>${posLabel}</span>
      <span>${r.demon}</span>
      <span>${r.percent}% ${typeLabel}</span>
      ${r.link ? `<a href="${r.link}" target="_blank">Video</a>` : ""}
    `;
    container.appendChild(div);
  });
}

/* ---------------------------------------------------
   MODERATORS TAB
--------------------------------------------------- */
function loadModerators() {
  const container = document.getElementById("moderators-container");

  const mods = [
    { name: "UniverDemonlist", role: "Super Moderator" },
    { name: "PowerGreen", role: "Moderator" },
    { name: "Prometheus", role: "Developer" }
  ];

  mods.forEach(mod => {
    const row = document.createElement("div");
    row.className = "moderator-row";

    row.innerHTML = `
      <span>${mod.name}</span>
      <span class="moderator-role">${mod.role}</span>
    `;

    container.appendChild(row);
  });
}

/* ---------------------------------------------------
   START
--------------------------------------------------- */
loadDemonList();
loadModerators();
