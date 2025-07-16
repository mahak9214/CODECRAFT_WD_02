let ms = 0, s = 0, m = 0, h = 0;
let countdownTotal = 0;
let timer;
let mode = "stopwatch";
let theme = localStorage.getItem("theme") || "dark";
let isMuted = localStorage.getItem("muted") === "true";

const display = document.querySelector(".timer-Display");
const laps = document.querySelector(".laps");
const alarmBox = document.querySelector(".alarm-box");
const stopAlarmBtn = document.getElementById("stopAlarmBtn");
const snoozeBtn = document.getElementById("snoozeBtn");
const toast = document.getElementById("toast");
const ring = document.querySelector(".ring");
const realTimeClock = document.getElementById("realTimeClock");
const analogClock = document.getElementById("analogClock");
const loader = document.getElementById("loader");

let alarmAudio = new Audio("https://assets.mixkit.co/sfx/preview/mixkit-alarm-digital-clock-beep-989.mp3");
alarmAudio.crossOrigin = "anonymous";
alarmAudio.loop = true;


const backgrounds = {
  dark: {
    stopwatch: "https://images.unsplash.com/photo-1543965170-4c01a86b9cfb?auto=format&fit=crop&w=1950&q=80",
    countdown: "https://images.unsplash.com/photo-1603791440384-56cd371ee9a7?auto=format&fit=crop&w=1950&q=80"
  },
  light: {
    stopwatch: "https://images.unsplash.com/photo-1509114397022-ed747cca3f65?auto=format&fit=crop&w=1950&q=80",
    countdown: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1950&q=80"
  }
};

const getTimer = () => (
  `${String(h).padStart(2, "0")} : ${String(m).padStart(2, "0")} : ${String(s).padStart(2, "0")} : ${String(ms).padStart(2, "0")}`
);

const updateTimerDisplay = () => {
  const timeStr = getTimer();
  const html = timeStr.split("").map(char =>
    char === ":" ? `<span class="digit colon">:</span>` : `<span class="digit">${char}</span>`
  ).join("");
  display.innerHTML = html;
  const digits = display.querySelectorAll(".digit");
  digits.forEach(d => {
    d.classList.remove("flip");
    void d.offsetWidth;
    d.classList.add("flip");
  });
};

const start = () => {
  if (mode === "countdown" && countdownTotal === 0) {
    toastMessage("⚠️ Set countdown time first");
    return;
  }
  if (!timer) {
    timer = setInterval(run, 10);
    toastMessage("▶ Timer started");
  }
};

const run = () => {
  if (mode === "stopwatch") {
    ms++;
    if (ms === 100) { ms = 0; s++; }
    if (s === 60) { s = 0; m++; }
    if (m === 60) { m = 0; h++; }
  } else {
    let total = h * 360000 + m * 6000 + s * 100 + ms;
    if (total <= 0) {
      stopTimer();
      h = m = s = ms = 0;
      updateTimerDisplay();
      updateProgressRing();
      triggerAlarm();
      return;
    }

    ms--;
    if (ms < 0) { ms = 99; s--; }
    if (s < 0) { s = 59; m--; }
    if (m < 0) { m = 59; h--; }
  }
  updateTimerDisplay();
  updateProgressRing();
};

document.body.addEventListener("click", () => {
  alarmAudio.play().then(() => {
    alarmAudio.pause();
    alarmAudio.currentTime = 0;
  }).catch(() => {});
}, { once: true });

const pause = () => {
  clearInterval(timer);
  timer = null;
  toastMessage("⏸ Timer paused");
};

const stopTimer = () => {
  clearInterval(timer);
  timer = null;
};

const reset = () => {
  stopTimer();
  ms = s = m = h = 0;
  updateTimerDisplay();
  updateProgressRing();
  toastMessage("🔁 Timer reset");
};

const restart = () => {
  reset();
  start();
  toastMessage("⏩ Timer restarted");
};

const setCountdown = () => {
  h = parseInt(document.getElementById("inputH").value) || 0;
  m = parseInt(document.getElementById("inputM").value) || 0;
  s = parseInt(document.getElementById("inputS").value) || 0;
  ms = 0;
  countdownTotal = (h * 3600 + m * 60 + s) * 100;
  if (countdownTotal === 0) {
    toastMessage("⚠️ Set a valid time");
    return;
  }
  document.getElementById("progressRing").style.display = "block";
  updateTimerDisplay();
  updateProgressRing();
  showLoader();
  toastMessage("⏲ Countdown set");
};

const lap = () => {
  if (timer && mode === "stopwatch") {
    const li = document.createElement("li");
    li.innerText = getTimer();
    laps.appendChild(li);
    toastMessage("📌 Lap recorded");
  } else {
    toastMessage("❌ Laps are only available in stopwatch mode");
  }
};

const resetLap = () => {
  laps.innerHTML = "";
  toastMessage("🧹 Laps cleared");
};

const triggerAlarm = () => {
  if (!isMuted) {
    alarmAudio.play().catch(err => {
      console.warn("Alarm audio playback failed:", err);
      toastMessage("🔇 Unable to play alarm (browser blocked?)");
    });
  }
  stopAlarmBtn.style.display = snoozeBtn.style.display = "inline-block";
  toastMessage("⏰ Time's up!");
  ring.classList.add("pulse");
};

const stopAlarm = () => {
  alarmAudio.pause();
  alarmAudio.currentTime = 0;
  stopAlarmBtn.style.display = snoozeBtn.style.display = "none";
  ring.classList.remove("pulse");
  toastMessage("🔕 Alarm stopped");
};

const snoozeAlarm = () => {
  stopAlarm();
  h = 0; m = 0; s = 5; ms = 0;
  updateTimerDisplay();
  start();
  toastMessage("😴 Snoozed for 5 seconds");
};

const updateProgressRing = () => {
  if (!ring || mode !== "countdown" || countdownTotal === 0) return;
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const total = (h * 3600 + m * 60 + s) * 100 + ms;
  const percent = total / countdownTotal;
  const offset = circumference * (1 - percent);
  ring.style.strokeDasharray = `${circumference}`;
  ring.style.strokeDashoffset = `${offset}`;
};

const toastMessage = (msg) => {
  toast.innerText = msg;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 3000);
};

const toggleTheme = () => {
  theme = theme === "dark" ? "light" : "dark";
  document.body.className = `${theme} ${mode}-mode`;
  localStorage.setItem("theme", theme);
  applyBackground();
  const themeBtn = document.getElementById("toggleTheme");
  themeBtn.classList.add("rotated");
  themeBtn.innerText = theme === "dark" ? "🌙" : "☀️";
  setTimeout(() => themeBtn.classList.remove("rotated"), 400);
  toastMessage(`Theme: ${theme.toUpperCase()}`);
};

const applyBackground = () => {
  const image = backgrounds[theme][mode];
  document.body.style.backgroundImage = `url('${image}')`;
};

const updateRealTimeClock = () => {
  const now = new Date();
  realTimeClock.innerText = now.toLocaleTimeString();
};

const drawAnalogClock = () => {
  const ctx = analogClock.getContext("2d");
  const now = new Date();
  const width = analogClock.width;
  const height = analogClock.height;
  const radius = width / 2;
  ctx.clearRect(0, 0, width, height);
  ctx.translate(radius, radius);
  ctx.beginPath();
  ctx.arc(0, 0, radius - 4, 0, 2 * Math.PI);
  ctx.fillStyle = "rgba(255,255,255,0.08)";
  ctx.fill();

  const hour = now.getHours() % 12;
  const minute = now.getMinutes();
  const second = now.getSeconds();

  const drawHand = (pos, len, width, color) => {
    ctx.beginPath();
    ctx.lineWidth = width;
    ctx.strokeStyle = color;
    ctx.moveTo(0, 0);
    ctx.rotate(pos);
    ctx.lineTo(0, -len);
    ctx.stroke();
    ctx.rotate(-pos);
  };

  drawHand((hour * Math.PI / 6) + (minute * Math.PI / 360), radius * 0.5, 5, "#fff");
  drawHand(minute * Math.PI / 30, radius * 0.7, 3, "#ccc");
  drawHand(second * Math.PI / 30, radius * 0.9, 2, "#f00");
  ctx.translate(-radius, -radius);
};

const showLoader = () => {
  loader.style.display = "flex";
  setTimeout(() => loader.style.display = "none", 1500);
};

window.onload = () => {
  document.body.className = `${theme} ${mode}-mode`;
  applyBackground();
  updateTimerDisplay();
  setInterval(updateRealTimeClock, 1000);
  setInterval(drawAnalogClock, 1000);
};

const toggleMode = () => {
  reset();
  mode = mode === "stopwatch" ? "countdown" : "stopwatch";

  document.getElementById("modeToggle").innerText = mode === "stopwatch"
    ? "Switch to Countdown"
    : "Switch to Stopwatch";

  document.body.classList.remove("stopwatch-mode", "countdown-mode");
  document.body.classList.add(`${mode}-mode`);
  applyBackground();

  const ringEl = document.getElementById("progressRing");
  const alarmBoxEl = document.querySelector(".alarm-box");
  const lapBtn = document.getElementById("lap");
  const resetLapBtn = document.getElementById("resetLap");

  if (mode === "countdown") {
    ringEl.style.display = "block";
    alarmBoxEl.style.display = "block";
    lapBtn.disabled = true;
    resetLapBtn.disabled = true;
    setTimeout(() => {
      document.querySelector(".alarm-box").scrollIntoView({ behavior: "smooth", block: "center" });
    }, 300);
  } else {
    ringEl.style.display = "none";
    alarmBoxEl.style.display = "none";
    lapBtn.disabled = false;
    resetLapBtn.disabled = false;
  }

  toastMessage(`Mode switched to ${mode.toUpperCase()}`);
};
