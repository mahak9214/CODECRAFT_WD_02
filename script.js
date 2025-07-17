let ms = 0, s = 0, m = 0, h = 0;
let countdownTotal = 0;
let timer;
let mode = "stopwatch";
let theme = localStorage.getItem("theme") || "dark";
let isMuted = localStorage.getItem("muted") === "true";
let audioUnlocked = false;
let alarmTimeout;
let alarmPlayed = false;
let isRunning = false;
let lapsData = [];

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

let alarmAudio = new Audio("alarm.mp3");
alarmAudio.crossOrigin = "anonymous";
alarmAudio.loop = true;
alarmAudio.volume = 1.0;

document.body.addEventListener("click", () => {
  if (!audioUnlocked) {
    alarmAudio.play().then(() => {
      alarmAudio.pause();
      alarmAudio.currentTime = 0;
      audioUnlocked = true;
      toastMessage("🔓 Alarm sound enabled");
    }).catch(() => {
      toastMessage("⚠️ Click again to enable alarm");
    });
  }
}, { once: true });

const backgrounds = {
  dark: {
    stopwatch: "https://images.unsplash.com/photo-1593642634315-48f5414c3ad9?auto=format&fit=crop&w=1950&q=80",
    countdown: "https://images.unsplash.com/photo-1603791440384-56cd371ee9a7?auto=format&fit=crop&w=1950&q=80"
  },
  light: {
    stopwatch: "https://images.unsplash.com/photo-1509114397022-ed747cca3f65?auto=format&fit=crop&w=1950&q=80",
    countdown: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1950&q=80"
  }
};


const getTimer = () => `${String(h).padStart(2, "0")} : ${String(m).padStart(2, "0")} : ${String(s).padStart(2, "0")} : ${String(ms).padStart(2, "0")}`;

const updateTimerDisplay = () => {
  const timeStr = getTimer();
  display.innerHTML = timeStr.split("").map(char =>
    char === ":" ? `<span class="digit colon">:</span>` : `<span class="digit">${char}</span>`
  ).join("");
  display.querySelectorAll(".digit").forEach(d => {
    d.classList.remove("flip");
    void d.offsetWidth;
    d.classList.add("flip");
  });
};

const start = () => {
  if (mode === "countdown" && countdownTotal === 0) return toastMessage("⚠️ Set countdown time first");
  if (!timer) {
    timer = setInterval(run, 10);
    isRunning = true;
    toastMessage("▶ Timer started");
  }
};

const pause = () => {
  clearInterval(timer);
  isRunning = false;
  timer = null;
  toastMessage("⏸ Timer paused");
};

const lap = () => {
  if (!isRunning || mode !== "stopwatch") return;
  const time = getTimer();
  const lapItem = document.createElement("li");
  lapItem.textContent = `Lap ${lapsData.length + 1}: ${time}`;
  laps.appendChild(lapItem);
  lapsData.push(time);
};

const resetLap = () => {
  laps.innerHTML = "";
  lapsData = [];
  toastMessage("🗑 Laps cleared");
};

const exportLaps = () => {
  if (!lapsData.length) return;
  const blob = new Blob(["Stopwatch Laps:\n" + lapsData.map((lap, i) => `Lap ${i + 1}: ${lap}`).join("\n")], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "laps.txt";
  link.click();
  URL.revokeObjectURL(url);
  toastMessage("📄 Laps exported");
};

const run = () => {
  if (mode === "stopwatch") {
    ms++;
    if (ms === 100) { ms = 0; s++; }
    if (s === 60) { s = 0; m++; }
    if (m === 60) { m = 0; h++; }
  } else {
    let total = h * 360000 + m * 6000 + s * 100 + ms;
    if (total <= 0 && !alarmPlayed) {
      stopTimer();
      h = m = s = ms = 0;
      updateTimerDisplay();
      updateProgressRing();
      alarmPlayed = true;
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

const stopTimer = () => {
  clearInterval(timer);
  timer = null;
};

const reset = () => {
  stopTimer();
  ms = s = m = h = 0;
  updateTimerDisplay();
  updateProgressRing();
  alarmPlayed = false;
  toastMessage("🔁 Timer reset");
};

const restart = () => {
  reset();
  start();
  toastMessage("⏩ Timer restarted");
};

const setCountdown = () => {
  h = +document.getElementById("inputH").value || 0;
  m = +document.getElementById("inputM").value || 0;
  s = +document.getElementById("inputS").value || 0;
  ms = 0;
  countdownTotal = (h * 3600 + m * 60 + s) * 100;
  if (countdownTotal === 0) return toastMessage("⚠️ Set a valid time");

  document.getElementById("progressRing").style.display = "block";
  updateTimerDisplay();
  updateProgressRing();
  alarmPlayed = false;
  showLoader();
  toastMessage("⏲ Countdown set");
};

const triggerAlarm = () => {
  if (!isMuted && audioUnlocked) alarmAudio.play().catch(() => toastMessage("🔇 Alarm blocked"));
  else if (!audioUnlocked) toastMessage("🔒 Click once on screen to enable alarm");

  stopAlarmBtn.style.display = snoozeBtn.style.display = "inline-block";
  ring.classList.add("pulse");
  toastMessage("⏰ Time's up!");
  alarmTimeout = setTimeout(stopAlarm, 30000);
};

const stopAlarm = () => {
  alarmAudio.pause();
  alarmAudio.currentTime = 0;
  clearTimeout(alarmTimeout);
  stopAlarmBtn.style.display = snoozeBtn.style.display = "none";
  ring.classList.remove("pulse");
  alarmPlayed = false;
  toastMessage("🔕 Alarm stopped");
};

const snoozeAlarm = () => {
  stopAlarm();
  h = 0; m = 0; s = 5; ms = 0;
  updateTimerDisplay();
  start();
  toastMessage("😴 Snoozed for 5 seconds");
};

const toggleMute = () => {
  isMuted = !isMuted;
  localStorage.setItem("muted", isMuted);
  document.getElementById("muteToggle").innerText = isMuted ? "🔇" : "🔊";
  if (isMuted && !alarmAudio.paused) {
    alarmAudio.pause();
    alarmAudio.currentTime = 0;
  }
  toastMessage(`Sound ${isMuted ? "Muted" : "Unmuted"}`);
};

const toggleTheme = () => {
  theme = theme === "dark" ? "light" : "dark";
  localStorage.setItem("theme", theme);
  document.body.className = `${theme} ${mode}-mode`;
  document.getElementById("toggleTheme").innerText = theme === "dark" ? "🌙" : "☀️";
  applyBackground();
  toastMessage(`Theme: ${theme.toUpperCase()}`);
};

const toggleMode = () => {
  reset();
  mode = mode === "stopwatch" ? "countdown" : "stopwatch";
  document.getElementById("modeToggle").innerText = mode === "stopwatch" ? "Switch to Countdown" : "Switch to Stopwatch";
  document.body.className = `${theme} ${mode}-mode`;
  applyBackground();

  const isCountdown = mode === "countdown";
  document.getElementById("progressRing").style.display = isCountdown ? "block" : "none";
  alarmBox.style.display = isCountdown ? "block" : "none";
  document.getElementById("lap").style.display = isCountdown ? "none" : "inline-block";
  document.getElementById("resetLap").style.display = isCountdown ? "none" : "inline-block";
  document.querySelector('button[onclick="exportLaps()"]').style.display = isCountdown ? "none" : "inline-block";

  toastMessage(`Mode switched to ${mode.toUpperCase()}`);
};

const toastMessage = (msg) => {
  toast.innerText = msg;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 3000);
};

const updateProgressRing = () => {
  if (!ring || mode !== "countdown" || countdownTotal === 0) return;
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const total = (h * 3600 + m * 60 + s) * 100 + ms;
  const percent = total / countdownTotal;
  ring.style.strokeDasharray = `${circumference}`;
  ring.style.strokeDashoffset = `${circumference * (1 - percent)}`;
};

const updateRealTimeClock = () => {
  realTimeClock.innerText = new Date().toLocaleTimeString();
};

const drawAnalogClock = () => {
  const ctx = analogClock.getContext("2d");
  const now = new Date();
  const radius = analogClock.width / 2;
  ctx.clearRect(0, 0, analogClock.width, analogClock.height);
  ctx.translate(radius, radius);

  ctx.beginPath();
  ctx.arc(0, 0, radius - 4, 0, 2 * Math.PI);
  ctx.fillStyle = "rgba(255,255,255,0.08)";
  ctx.fill();

  const hour = now.getHours() % 12;
  const minute = now.getMinutes();
  const second = now.getSeconds();

  const drawHand = (angle, length, width, color) => {
    ctx.beginPath();
    ctx.lineWidth = width;
    ctx.strokeStyle = color;
    ctx.moveTo(0, 0);
    ctx.rotate(angle);
    ctx.lineTo(0, -length);
    ctx.stroke();
    ctx.rotate(-angle);
  };

  drawHand((hour * Math.PI / 6) + (minute * Math.PI / 360), radius * 0.5, 5, "#fff");
  drawHand(minute * Math.PI / 30, radius * 0.7, 3, "#ccc");
  drawHand(second * Math.PI / 30, radius * 0.9, 2, "#f00");

  ctx.setTransform(1, 0, 0, 1, 0, 0);
};

const applyBackground = () => {
  const image = backgrounds[theme][mode];
  document.body.style.backgroundImage = `url('${image}')`;
};


const showLoader = () => {
  loader.style.display = "flex";
  setTimeout(() => loader.style.display = "none", 1500);
};

window.onload = () => {
  document.body.className = `${theme} ${mode}-mode`;
  document.getElementById("toggleTheme").innerText = theme === "dark" ? "🌙" : "☀️";
  document.getElementById("muteToggle").innerText = isMuted ? "🔇" : "🔊";
  applyBackground();
  updateTimerDisplay();
  setInterval(updateRealTimeClock, 1000);
  setInterval(drawAnalogClock, 1000);
};
