fetch("items.json", { cache: "no-store" })
  .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
  .then(startGame)
  .catch(err => {
    console.error(err);
    document.getElementById("items").innerHTML =
      '<p style="color:#ff8a7a">Couldn\'t load items.json. Run the game through <code>npm start</code> or GitHub Pages instead of opening the file directly.</p>';
  });

function startGame(config) {
  const ITEMS = config.items;
  const WIN_POINTS = config.winPoints;
  if (config.winMessage) document.getElementById("winMessage").textContent = config.winMessage;
  const STORAGE_KEY = "agrabah-quest-v2"; // bumped when the treasure list changed, so old progress doesn't carry over
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

  // An item shows its "icon" image if it has one, otherwise its emoji
  const iconHTML = item => item.icon
    ? `<img src="${item.icon}" alt="" class="icon-img">`
    : item.emoji;

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
        <div class="emoji">${iconHTML(item)}</div>
        <div class="name">${got ? item.name : "???"}</div>
        <div class="pts">${got ? "+" + item.points + " pts" : item.points + " pts"}</div>`;
      div.title = got ? item.desc : "Not found yet";
      itemsEl.appendChild(div);
    });
  }

  // ----- toast -----
  let toastTimer;
  function toast(msg, warn, icon) {
    const t = $("toast");
    t.innerHTML = "";
    if (icon) t.insertAdjacentHTML("beforeend", `<span class="toast-icon">${icon}</span>`);
    t.appendChild(document.createTextNode(msg));
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
    if (!item) { flash("miss"); return toast("That's not a treasure of Agrabah… 🐍", true); }
    if (state.found.includes(item.code)) { flash("miss"); return toast(`You already found the ${item.name}!`, true); }
    flash("hit");

    state.found.push(item.code);
    save();
    render(item.code);
    meter.classList.remove("pulse"); void meter.offsetWidth; meter.classList.add("pulse");
    toast(`${item.name} found! +${item.points}`, false, iconHTML(item));
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
  const camera = $("camera");
  let flashTimer;
  function flash(kind) {
    camera.classList.remove("hit", "miss"); void camera.offsetWidth;
    camera.classList.add(kind);
    clearTimeout(flashTimer);
    flashTimer = setTimeout(() => camera.classList.remove(kind), 700);
  }
  // ----- camera help panel -----
  const help = $("camHelp");
  function showHelp(title, html) {
    $("camHelpTitle").textContent = title;
    $("camHelpBody").innerHTML = html;
    help.hidden = false;
  }
  function hideHelp() { help.hidden = true; }
  $("retryBtn").onclick = () => { hideHelp(); btn.click(); };

  const ua = navigator.userAgent;
  const isIOS = /iPhone|iPad|iPod/i.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const inAppBrowser = /Instagram|FBAN|FBAV|Snapchat|TikTok|musical_ly|Line\/|WhatsApp|LinkedInApp|GSA\//i.test(ua);
  const permissionSteps = isIOS
    ? `<ol>
         <li>Tap the <b>aA</b> (or ⋯) button in Safari's address bar → <b>Website Settings</b> → <b>Camera</b> → <b>Allow</b>.</li>
         <li>If that's not there: iPhone <b>Settings → Apps → Safari → Camera → Allow</b>.</li>
         <li>Come back and tap <b>Try again</b>.</li>
       </ol>`
    : `<ol>
         <li>Tap the <b>🔒 lock / ⚙ icon</b> left of the web address.</li>
         <li>Tap <b>Permissions</b> (or Site settings) → <b>Camera</b> → <b>Allow</b>.</li>
         <li>Reload the page and tap <b>Try again</b>.</li>
       </ol>
       <p>Still blocked? Check phone <b>Settings → Apps → Chrome → Permissions → Camera</b>.</p>`;

  const inAppHelp =
    `<p>This looks like an app's built-in browser (Instagram, WhatsApp, a QR scanner app…). Those usually block the camera.</p>
     <p>Tap the <b>⋯</b> menu and choose <b>Open in Safari</b> / <b>Open in Chrome</b> / <b>Open in browser</b>.</p>
     <p>Or use <b>Scan a photo</b> below.</p>`;

  function explain(err) {
    const msg = String((err && (err.name || "")) + " " + (err && err.message ? err.message : err));
    if (inAppBrowser) {
      showHelp("Open this in Safari or Chrome", inAppHelp);
    } else if (/NotAllowed|Permission|denied/i.test(msg)) {
      showHelp("Camera permission is blocked", `<p>Your browser said no to the camera. Unblock it like this:</p>${permissionSteps}`);
    } else if (/NotFound|DevicesNotFound|no camera/i.test(msg)) {
      showHelp("No camera found", `<p>This device doesn't seem to have a camera. Try on a phone, or use <b>Scan a photo</b>.</p>`);
    } else if (/NotReadable|TrackStart|in use|Could not start/i.test(msg)) {
      showHelp("Camera is busy", `<p>Another app or browser tab is using the camera. Close other camera apps / tabs, then tap <b>Try again</b>.</p>`);
    } else {
      showHelp("Couldn't start the camera", `<p>Tap <b>Try again</b>, or use <b>Scan a photo</b> instead.</p><p class="err">${msg.replace(/</g, "&lt;")}</p>`);
    }
  }

  // Checks we can do BEFORE asking for the camera
  function preflight() {
    if (!window.isSecureContext) {
      const here = location.protocol + "//" + location.host;
      showHelp("This link isn't secure (https)",
        `<p>Phones only allow the camera on <b>https://</b> links. You're on <code>${here}</code>.</p>
         <p>Open your GitHub Pages link instead, it looks like <code>https://yourname.github.io/your-repo/</code>.</p>
         <p>(A laptop address like <code>http://192.168…:3000</code> won't work on a phone. Only <code>localhost</code> on the laptop itself is allowed.)</p>`);
      return false;
    }
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      showHelp("Open this in Safari or Chrome", inAppHelp);
      return false;
    }
    if (typeof Html5Qrcode === "undefined") {
      showHelp("Scanner didn't load", `<p>Check your internet connection and refresh the page.</p>`);
      return false;
    }
    return true;
  }

  async function startCamera(facing) {
    scanner = scanner || new Html5Qrcode("reader");
    await scanner.start({ facingMode: facing }, { fps: 12, aspectRatio: 1.0 }, handleScan, () => {});
  }

  btn.onclick = async () => {
    if (running) return stop();
    hideHelp();
    if (!preflight()) return;
    btn.disabled = true;
    btn.textContent = "Opening camera…";
    try {
      try {
        await startCamera("environment");
      } catch (e) {
        // some laptops / phones reject the back camera request: try any camera
        if (/Overconstrained|NotFound|DevicesNotFound/i.test(String(e && e.name) + String(e))) await startCamera("user");
        else throw e;
      }
      running = true;
      camera.classList.add("scanning");
      btn.textContent = "Stop Scanning";
    } catch (err) {
      console.error(err);
      camera.classList.remove("scanning");
      btn.textContent = "Start Scanning";
      explain(err);
    } finally {
      btn.disabled = false;
    }
  };

  // ----- backup: scan from a photo (works even when live camera is blocked) -----
  $("photoBtn").onclick = () => $("photoInput").click();
  $("photoInput").onchange = async e => {
    const file = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!file) return;
    if (typeof Html5Qrcode === "undefined") return showHelp("Scanner didn't load", `<p>Check your internet connection and refresh the page.</p>`);
    if (running) await stop();
    try {
      const fileScanner = new Html5Qrcode("fileReader");
      const text = await fileScanner.scanFile(file, false);
      fileScanner.clear();
      hideHelp();
      lastText = ""; // allow it even if just scanned
      handleScan(text);
    } catch (err) {
      console.error(err);
      toast("No QR code found in that photo. Get closer and try again.", true);
    }
  };
  async function stop() {
    try { await scanner.stop(); scanner.clear(); } catch (e) {}
    running = false;
    btn.textContent = "Start Scanning";
    camera.classList.remove("scanning");
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
}
