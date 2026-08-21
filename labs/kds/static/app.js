const form = document.getElementById("params-form");
const runBtn = document.getElementById("run-btn");
const statusEl = document.getElementById("status");
const canvas = document.getElementById("grid");
const ctx = canvas.getContext("2d");
const stepLabel = document.getElementById("step-label");
const statsEl = document.getElementById("stats");
const btnFirst = document.getElementById("btn-first");
const btnPrev = document.getElementById("btn-prev");
const btnPlay = document.getElementById("btn-play");
const btnNext = document.getElementById("btn-next");
const btnLast = document.getElementById("btn-last");

let history = [];
let gridSize = 30;
let current = 0;
let playTimer = null;

function setControlsEnabled(enabled) {
  for (const b of [btnFirst, btnPrev, btnPlay, btnNext, btnLast]) b.disabled = !enabled;
}

function draw(step) {
  const frame = history[step];
  if (!frame) return;
  const cell = canvas.width / gridSize;
  ctx.fillStyle = "#010409";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#d29922";
  for (const f of frame.food) {
    if (!f.available) continue;
    ctx.beginPath();
    ctx.arc((f.x + 0.5) * cell, (f.y + 0.5) * cell, cell * 0.12, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = "#58a6ff";
  for (const p of frame.prey) {
    ctx.beginPath();
    ctx.arc((p.x + 0.5) * cell, (p.y + 0.5) * cell, cell * 0.32, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = "#f85149";
  for (const p of frame.predators) {
    ctx.beginPath();
    ctx.arc((p.x + 0.5) * cell, (p.y + 0.5) * cell, cell * 0.38, 0, Math.PI * 2);
    ctx.fill();
  }

  stepLabel.textContent = `step ${step} / ${history.length - 1}`;
  statsEl.innerHTML = `
    <dt>Prey</dt><dd>${frame.prey.length} (avg energy ${frame.stats.avgPreyEnergy.toFixed(1)})</dd>
    <dt>Predators</dt><dd>${frame.predators.length} (avg energy ${frame.stats.avgPredatorEnergy.toFixed(1)})</dd>
    <dt>Food available</dt><dd>${frame.stats.availableFood}</dd>
  `;
}

function goTo(step) {
  current = Math.max(0, Math.min(history.length - 1, step));
  draw(current);
}

function stopPlay() {
  if (playTimer) {
    clearInterval(playTimer);
    playTimer = null;
    btnPlay.textContent = "▶";
  }
}

btnFirst.addEventListener("click", () => { stopPlay(); goTo(0); });
btnPrev.addEventListener("click", () => { stopPlay(); goTo(current - 1); });
btnNext.addEventListener("click", () => { stopPlay(); goTo(current + 1); });
btnLast.addEventListener("click", () => { stopPlay(); goTo(history.length - 1); });
btnPlay.addEventListener("click", () => {
  if (playTimer) {
    stopPlay();
    return;
  }
  btnPlay.textContent = "⏸";
  playTimer = setInterval(() => {
    if (current >= history.length - 1) {
      stopPlay();
      return;
    }
    goTo(current + 1);
  }, 200);
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  stopPlay();
  setControlsEnabled(false);
  runBtn.disabled = true;
  statusEl.textContent = "running simulation…";

  const data = new FormData(form);
  const params = {};
  for (const [key, value] of data.entries()) {
    params[key] = key === "food_density" ? parseFloat(value) : parseInt(value, 10);
  }

  try {
    const res = await fetch("/api/simulate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.detail ? JSON.stringify(err.detail) : `HTTP ${res.status}`);
    }
    const body = await res.json();
    history = body.history;
    gridSize = body.gridSize;
    current = 0;
    draw(0);
    setControlsEnabled(true);
    statusEl.textContent = `done — ${history.length} steps`;
  } catch (err) {
    statusEl.textContent = `error: ${err.message}`;
  } finally {
    runBtn.disabled = false;
  }
});

// Run once on load with the defaults so the page isn't blank.
form.dispatchEvent(new Event("submit", { cancelable: true }));
