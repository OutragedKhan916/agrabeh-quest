(function () {
  const STORAGE_KEY = "agrabah-quest-v1";
  const TOTAL_POINTS = ITEMS.reduce((s, i) => s + i.points, 0);
  const goal = Math.min(WIN_POINTS, TOTAL_POINTS);

  // ----- state -----
  let state = load();
  function load() {
    try {
      const s = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (s && Array.isArray(s.found)) return s;
    } catch (e) {}
    return { found: [], won: false };
  }
  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) {}
  }
  const score = () => ITEMS.filter(i => state.found.includes(i.code)).reduce((s, i) => s + i.points, 0);

  // ----- elements -----
  const $ = id => document.getElementById(id);
  const meter = document.querySelector(".meter");
  const fill = $("meterFill");
  const itemsEl = $("items");

  $("goal").textContent = goal;
  $("totalCount").textContent = ITEMS.length;

  // ----- render -----
  function render(newCode) {
    const s = score();
    const pct = Math.min(100, (s / goal) * 100);
    fill.style.height = pct + "%";
    fill.style.setProperty("--fill", pct + "%");
    $("score").textContent = s;
    $("foundCount").textContent = state.found.length;

    itemsEl.innerHTML = "";
    ITEMS.forEach(item => {
      const got = state.found.includes(item.code);
      const div = document.createElement("div");
      div.className = "item " + (got ? "got" : "locked") + (item.code === newCode ? " new" : "");
      div.innerHTML = `
        <div class="emoji">${item.emoji}</div>
        <div class="name">${got ? item.name : "???"}</div>
        <div class="pts">${got ? "+" + item.points + " pts" : item.points + " pts"}</div>`;
      div.title = got ? item.desc : "Not found yet";
      itemsEl.appendChild(div);
    });
  }

  // ----- toast -----
  let toastTimer;
  function toast(msg, warn) {
    const t = $("toast");
    t.textContent = msg;
    t.className = "toast show" + (warn ? " warn" : "");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (t.className = "toast"), 2600);
  }

  // ----- scanning logic -----
  let lastText = "", lastTime = 0;
  function handleScan(text) {
    text = (text || "").trim();
    const now = Date.now();
    if (text === lastText && now - lastTime < 3000) return; // ignore rapid repeats
    lastText = text; lastTime = now;

    const item = ITEMS.find(i => i.code === text);
    if (!item) return toast("That's not a treasure of Agrabah… 🐍", true);
    if (state.found.includes(item.code)) return toast(`You already found the ${item.name}!`, true);

    state.found.push(item.code);
    save();
    render(item.code);
    meter.classList.remove("pulse"); void meter.offsetWidth; meter.classList.add("pulse");
    toast(`${item.emoji} ${item.name} found! +${item.points}`);
    if (navigator.vibrate) navigator.vibrate(120);

    if (!state.won && score() >= goal) {
      state.won = true; save();
      setTimeout(showWin, 1100);
    }
  }

  // ----- win popup -----
  function showWin() {
    $("finalScore").textContent = score();
    $("winModal").classList.add("open");
    const bits = ["✨", "💰", "💎", "⭐", "🪙"];
    for (let i = 0; i < 40; i++) {
      const s = document.createElement("div");
      s.className = "sparkle";
      s.textContent = bits[i % bits.length];
      s.style.left = Math.random() * 100 + "vw";
      s.style.top = -10 - Math.random() * 20 + "vh";
      s.style.animationDuration = 2.5 + Math.random() * 2.5 + "s";
      document.body.appendChild(s);
      setTimeout(() => s.remove(), 5500);
    }
  }
  $("closeWin").onclick = () => $("winModal").classList.remove("open");

  // ----- camera -----
  let scanner = null, running = false;
  const btn = $("scanBtn");
  btn.onclick = async () => {
    if (running) return stop();
    $("placeholder").style.display = "none";
    try {
      scanner = scanner || new Html5Qrcode("reader");
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: (w, h) => { const s = Math.floor(Math.min(w, h) * 0.7); return { width: s, height: s }; } },
        handleScan,
        () => {}
      );
      running = true;
      btn.textContent = "Stop Scanning";
    } catch (err) {
      $("placeholder").style.display = "";
      toast("Couldn't open the camera. Allow camera access and use HTTPS.", true);
      console.error(err);
    }
  };
  async function stop() {
    try { await scanner.stop(); scanner.clear(); } catch (e) {}
    running = false;
    btn.textContent = "Start Scanning";
    $("placeholder").style.display = "";
  }

  // ----- reset -----
  $("resetBtn").onclick = () => {
    if (!confirm("Reset all collected treasures?")) return;
    state = { found: [], won: false };
    save(); render();
    toast("The sands have been reset.");
  };

  // Allow testing via URL: index.html?code=AGRABAH-LAMP-7731
  const urlCode = new URLSearchParams(location.search).get("code");
  render();
  if (urlCode) { handleScan(urlCode); history.replaceState(null, "", location.pathname); }
})();
