import { useState, useMemo, useEffect } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from "recharts";
import { fetchAllData, isConfigured, SHEET_ID } from "./sheets.js";

// âââ colour palette âââ
const C = {
  work: "#3B82F6",
  diet: "#10B981",
  family: "#F59E0B",
  personal: "#8B5CF6",
  bg: "#0B1120",
  card: "rgba(15,23,42,0.7)",
  cardSolid: "#0F172A",
  glass: "rgba(30,41,59,0.5)",
  accent: "#38BDF8",
  text: "#F1F5F9",
  muted: "#94A3B8",
  mutedLight: "#CBD5E1",
  success: "#22C55E",
  danger: "#EF4444",
  orange: "#F97316",
  purple: "#A855F7",
  border: "rgba(255,255,255,0.07)",
  borderLight: "rgba(255,255,255,0.12)",
  glow: "0 0 40px rgba(56,189,248,0.08)",
};

const PIE_COLORS = [C.work, C.diet, C.family, C.personal];

// âââ global styles injected once âââ
const GLOBAL_CSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; }
  body {
    background: ${C.bg};
    color: ${C.text};
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
  ::-webkit-scrollbar { width: 8px; }
  ::-webkit-scrollbar-track { background: ${C.bg}; }
  ::-webkit-scrollbar-thumb { background: rgba(148,163,184,0.2); border-radius: 4px; }
  ::-webkit-scrollbar-thumb:hover { background: rgba(148,163,184,0.3); }
  input[type=number]::-webkit-outer-spin-button,
  input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
  input[type=number] { -moz-appearance: textfield; }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.7; } }
  @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
`;

// âââ initial data âââ
const INITIAL_WEIGHT = {
  start: 268, current: 243, goal: 210, unit: "lbs",
  history: [
    { date: "Jan", weight: 268 }, { date: "Feb", weight: 261 },
    { date: "Mar", weight: 253 }, { date: "Apr", weight: 243 },
  ],
};

const INITIAL_FITNESS_GOALS = [
  { id: 1, name: "Press-ups", icon: "\u{1F4AA}", start: 8, current: 8, goal: 50, unit: "reps", doneToday: false },
  { id: 2, name: "Cycling", icon: "\u{1F6B4}", start: 8, current: 8, goal: 30, unit: "miles", doneToday: false },
  { id: 3, name: "Running", icon: "\u{1F3C3}", start: 8, current: 8, goal: 30, unit: "mins", doneToday: false },
  { id: 4, name: "Weight Lifting", icon: "\u{1F3CB}\uFE0F", start: 25, current: 70, goal: 120, unit: "kg", doneToday: false },
  { id: 5, name: "Rowing", icon: "\u{1F6A3}", start: 1000, current: 8000, goal: 20000, unit: "m", doneToday: false },
];

const INITIAL_DEBTS = [
  { id: 2, name: "American Express BA", icon: "\u2708\uFE0F", used: 8100, limit: 9000 },
  { id: 5, name: "MBNA", icon: "\u{1F4B3}", used: 8000, limit: 25000 },
  { id: 1, name: "American Express Gold", icon: "\u{1F4B3}", used: 6100, limit: 6900 },
  { id: 3, name: "Barclaycard", icon: "\u{1F4B3}", used: 3900, limit: 4000 },
  { id: 4, name: "Natwest Credit Card", icon: "\u{1F3E6}", used: 0, limit: 3500 },
];

const INITIAL_TASKS = [
  { id: 1, category: "work", text: "Finish Q2 project proposal", done: false },
  { id: 2, category: "work", text: "Review team pull requests", done: false },
  { id: 3, category: "work", text: "Update client invoices", done: true },
  { id: 4, category: "work", text: "Prepare Monday standup notes", done: false },
  { id: 5, category: "work", text: "Complete compliance training", done: false },
  { id: 6, category: "diet", text: "Meal prep for the week", done: false },
  { id: 7, category: "diet", text: "Hit daily protein target (150g)", done: false },
  { id: 8, category: "diet", text: "Drink 3 litres of water", done: true },
  { id: 9, category: "diet", text: "No snacking after 8pm", done: false },
  { id: 10, category: "diet", text: "Log all meals in tracker", done: false },
  { id: 11, category: "family", text: "Plan weekend day out", done: false },
  { id: 12, category: "family", text: "Call parents", done: true },
  { id: 13, category: "family", text: "Organise family photos", done: false },
  { id: 14, category: "family", text: "Help kids with homework", done: false },
  { id: 15, category: "personal", text: "Read 30 pages of current book", done: false },
  { id: 16, category: "personal", text: "Tidy the garage", done: false },
  { id: 17, category: "personal", text: "Learn a new recipe", done: true },
  { id: 18, category: "personal", text: "Update personal budget", done: false },
];

// âââ helper components âââ

function ProgressBar({ value, max, color, height = 10, showLabel = true, animated = false }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div style={{ width: "100%" }}>
      <div style={{
        width: "100%", height, borderRadius: 99,
        background: "rgba(255,255,255,0.06)", overflow: "hidden",
      }}>
        <div style={{
          width: `${pct}%`, height: "100%", borderRadius: 99,
          background: `linear-gradient(90deg, ${color}cc, ${color})`,
          transition: "width 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
          boxShadow: `0 0 12px ${color}40`,
          ...(animated ? { animation: "shimmer 2s ease-in-out infinite", backgroundSize: "200% 100%" } : {}),
        }} />
      </div>
      {showLabel && (
        <div style={{ fontSize: 11, color: C.muted, marginTop: 3, textAlign: "right", fontWeight: 500 }}>
          {Math.round(pct)}%
        </div>
      )}
    </div>
  );
}

function Card({ children, style, hover = true, glow = false }) {
  return (
    <div style={{
      background: C.card,
      backdropFilter: "blur(20px)",
      WebkitBackdropFilter: "blur(20px)",
      borderRadius: 20,
      padding: "24px 28px",
      border: `1px solid ${C.border}`,
      boxShadow: glow ? C.glow : "0 4px 24px rgba(0,0,0,0.25)",
      transition: "transform 0.2s ease, box-shadow 0.2s ease",
      animation: "fadeIn 0.4s ease",
      ...style,
    }}>
      {children}
    </div>
  );
}

function SectionTitle({ children, emoji, sub }) {
  return (
    <div style={{ marginBottom: sub ? 4 : 16 }}>
      <h2 style={{
        fontSize: 18, fontWeight: 800, color: C.text, margin: 0,
        display: "flex", alignItems: "center", gap: 10,
        letterSpacing: "-0.02em",
      }}>
        <span style={{ fontSize: 22 }}>{emoji}</span> {children}
      </h2>
      {sub && <p style={{ fontSize: 12, color: C.muted, margin: "4px 0 12px 32px" }}>{sub}</p>}
    </div>
  );
}

function StatBox({ label, value, sub, color, borderColor, bg, icon }) {
  return (
    <div style={{
      background: bg || C.card,
      backdropFilter: "blur(16px)",
      borderRadius: 16, padding: "20px 16px", textAlign: "center",
      border: `1px solid ${borderColor || C.border}`,
      boxShadow: "0 2px 16px rgba(0,0,0,0.2)",
      animation: "fadeIn 0.5s ease",
      transition: "transform 0.2s ease",
      minWidth: 0,
    }}>
      {icon && <div style={{ fontSize: 20, marginBottom: 6 }}>{icon}</div>}
      <div style={{
        fontSize: 10, color: C.muted, textTransform: "uppercase",
        letterSpacing: "0.1em", marginBottom: 6, fontWeight: 600,
      }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 900, color: color || C.accent, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: color || C.muted, marginTop: 4, fontWeight: 500 }}>{sub}</div>}
    </div>
  );
}

function EditableValue({ value, color, onSave, fontSize = 28 }) {
  const [editing, setEditing] = useState(false);
  const [temp, setTemp] = useState("");
  const commit = () => { onSave(Number(temp) || value); setEditing(false); };
  if (editing) return (
    <input type="number" value={temp}
      onChange={(e) => setTemp(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => e.key === "Enter" && commit()}
      autoFocus
      style={{
        width: 70, background: "rgba(255,255,255,0.05)", border: `1px solid ${color || C.accent}`,
        borderRadius: 8, color: C.text, fontSize: fontSize - 2, textAlign: "center",
        padding: "2px 4px", fontWeight: 800, outline: "none",
      }}
    />
  );
  return (
    <span onClick={() => { setEditing(true); setTemp(String(value)); }}
      style={{ cursor: "pointer", borderBottom: "2px dashed rgba(255,255,255,0.15)", transition: "border-color 0.2s" }}
      title="Click to update">
      {value}
    </span>
  );
}

// âââ weather helpers âââ
const WMO_ICONS = {
  0: "\u2600\uFE0F", 1: "\u{1F324}\uFE0F", 2: "\u26C5", 3: "\u2601\uFE0F",
  45: "\u{1F32B}\uFE0F", 48: "\u{1F32B}\uFE0F",
  51: "\u{1F326}\uFE0F", 53: "\u{1F326}\uFE0F", 55: "\u{1F327}\uFE0F",
  61: "\u{1F327}\uFE0F", 63: "\u{1F327}\uFE0F", 65: "\u{1F327}\uFE0F",
  71: "\u2744\uFE0F", 73: "\u2744\uFE0F", 75: "\u2744\uFE0F",
  80: "\u{1F326}\uFE0F", 81: "\u{1F327}\uFE0F", 82: "\u{1F327}\uFE0F",
  95: "\u26C8\uFE0F", 96: "\u26C8\uFE0F", 99: "\u26C8\uFE0F",
};
const WMO_DESC = {
  0: "Clear sky", 1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast",
  45: "Fog", 48: "Freezing fog",
  51: "Light drizzle", 53: "Drizzle", 55: "Heavy drizzle",
  61: "Light rain", 63: "Rain", 65: "Heavy rain",
  71: "Light snow", 73: "Snow", 75: "Heavy snow",
  80: "Light showers", 81: "Showers", 82: "Heavy showers",
  95: "Thunderstorm", 96: "Thunderstorm + hail", 99: "Heavy thunderstorm",
};

// âââ main dashboard âââ
export default function LifeDashboard() {
  const [weight, setWeight] = useState(INITIAL_WEIGHT);
  const [fitnessGoals, setFitnessGoals] = useState(INITIAL_FITNESS_GOALS);
  const [debts, setDebts] = useState(INITIAL_DEBTS);
  const [editingDebt, setEditingDebt] = useState(null);
  const [tempDebtVal, setTempDebtVal] = useState("");
  const [tasks, setTasks] = useState(INITIAL_TASKS);
  const [newTask, setNewTask] = useState("");
  const [newTaskCat, setNewTaskCat] = useState("work");
  const [editingGoal, setEditingGoal] = useState(null);
  const [bodyFat, setBodyFat] = useState({ current: 28, start: 35, goal: 15, unit: "%" });
  const [fatMass, setFatMass] = useState({ start: 97, current: 69, goal: 30, unit: "lbs" });
  const [muscle, setMuscle] = useState({ current: 155, start: 140, unit: "lbs" });
  const [activeTab, setActiveTab] = useState("all");
  const [weather, setWeather] = useState(null);
  const [weatherError, setWeatherError] = useState(false);
  const [sheetsLoaded, setSheetsLoaded] = useState(false);

  // ââ task stats ââ
  const taskStats = useMemo(() => {
    const cats = ["work", "diet", "family", "personal"];
    const stats = {};
    let totalAll = 0, doneAll = 0;
    cats.forEach((c) => {
      const items = tasks.filter((t) => t.category === c);
      const done = items.filter((t) => t.done).length;
      stats[c] = { total: items.length, done, pct: items.length ? Math.round((done / items.length) * 100) : 0 };
      totalAll += items.length;
      doneAll += done;
    });
    stats.all = { total: totalAll, done: doneAll, pct: totalAll ? Math.round((doneAll / totalAll) * 100) : 0 };
    return stats;
  }, [tasks]);

  const pieData = useMemo(() => {
    const total = tasks.length;
    return ["work", "diet", "family", "personal"].map((c) => {
      const count = tasks.filter((t) => t.category === c).length;
      return { name: c.charAt(0).toUpperCase() + c.slice(1), value: count, pct: total > 0 ? Math.round((count / total) * 100) : 0 };
    });
  }, [tasks]);

  const weightLost = weight.start - weight.current;
  const weightToGo = weight.current - weight.goal;
  const weightTotalToLose = weight.start - weight.goal;
  const weightPct = Math.round((weightLost / weightTotalToLose) * 100);

  // ââ handlers ââ
  const toggleTask = (id) => setTasks((p) => p.map((t) => t.id === id ? { ...t, done: !t.done } : t));
  const deleteTask = (id) => setTasks((p) => p.filter((t) => t.id !== id));
  const addTask = () => {
    if (!newTask.trim()) return;
    setTasks((p) => [...p, { id: Date.now(), category: newTaskCat, text: newTask.trim(), done: false }]);
    setNewTask("");
  };
  const updateGoalCurrent = (id, val) => setFitnessGoals((p) => p.map((g) => g.id === id ? { ...g, current: Math.max(0, Number(val) || 0) } : g));
  const toggleFitnessToday = (id) => setFitnessGoals((p) => p.map((g) => g.id === id ? { ...g, doneToday: !g.doneToday } : g));

  // ââ Load from Google Sheets ââ
  useEffect(() => {
    if (!isConfigured()) return;
    fetchAllData().then((data) => {
      if (data.weight) {
        setWeight({ start: data.weight.start, current: data.weight.current, goal: data.weight.goal, unit: "lbs", history: [] });
        setBodyFat({ start: data.weight.bodyFat.start, current: data.weight.bodyFat.current, goal: data.weight.bodyFat.goal, unit: "%" });
        setFatMass({ start: data.weight.fatMass.start, current: data.weight.fatMass.current, goal: data.weight.fatMass.goal, unit: "lbs" });
        setMuscle({ start: data.weight.muscle.start, current: data.weight.muscle.current, unit: "lbs" });
      }
      if (data.fitness) setFitnessGoals(data.fitness);
      if (data.tasks) setTasks(data.tasks);
      if (data.debts) setDebts(data.debts);
      setSheetsLoaded(true);
    });
  }, []);

  useEffect(() => {
    fetch("https://api.open-meteo.com/v1/forecast?latitude=51.4123&longitude=-0.3007&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m,relative_humidity_2m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=Europe/London&forecast_days=7")
      .then((r) => r.json()).then((d) => setWeather(d)).catch(() => setWeatherError(true));
  }, []);

  const [now, setNow] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t); }, []);

  const worldClocks = [
    { city: "London", flag: "\u{1F1EC}\u{1F1E7}", tz: "Europe/London" },
    { city: "New York", flag: "\u{1F1FA}\u{1F1F8}", tz: "America/New_York" },
    { city: "India", flag: "\u{1F1EE}\u{1F1F3}", tz: "Asia/Kolkata" },
    { city: "Philippines", flag: "\u{1F1F5}\u{1F1ED}", tz: "Asia/Manila" },
  ];

  const catEmoji = { work: "\u{1F4BC}", diet: "\u{1F957}", family: "\u{1F468}\u200D\u{1F469}\u200D\u{1F467}\u200D\u{1F466}", personal: "\u{1F31F}" };
  const catLabel = { work: "Work", diet: "Diet", family: "Family", personal: "Personal" };

  // ââ inject global CSS ââ
  useEffect(() => {
    const id = "dashboard-global-css";
    if (!document.getElementById(id)) {
      const style = document.createElement("style");
      style.id = id;
      style.textContent = GLOBAL_CSS;
      document.head.appendChild(style);
    }
  }, []);

  // ââ sober calc ââ
  const soberDate = new Date(2025, 10, 5);
  const soberDays = Math.floor((new Date() - soberDate) / (1000 * 60 * 60 * 24));
  const soberMonths = Math.floor(soberDays / 30);

  return (
    <div style={{ minHeight: "100vh", padding: "32px 20px", position: "relative", overflow: "hidden" }}>
      {/* Background gradient orbs */}
      <div style={{
        position: "fixed", top: -200, left: -200, width: 600, height: 600,
        background: "radial-gradient(circle, rgba(56,189,248,0.08) 0%, transparent 70%)",
        pointerEvents: "none", zIndex: 0,
      }} />
      <div style={{
        position: "fixed", bottom: -200, right: -200, width: 600, height: 600,
        background: "radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 70%)",
        pointerEvents: "none", zIndex: 0,
      }} />

      <div style={{ maxWidth: 1280, margin: "0 auto", position: "relative", zIndex: 1 }}>

        {/* âââ HEADER âââ */}
        <header style={{ textAlign: "center", marginBottom: 36, animation: "fadeIn 0.5s ease" }}>
          <h1 style={{
            fontSize: "clamp(28px, 4vw, 42px)", fontWeight: 900, margin: 0, letterSpacing: "-0.03em",
            background: "linear-gradient(135deg, #38BDF8 0%, #818CF8 50%, #C084FC 100%)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            lineHeight: 1.2,
          }}>
            James's Life Dashboard
          </h1>
          <p style={{ color: C.muted, marginTop: 8, fontSize: 15, fontWeight: 400 }}>
            Track your progress. Crush your goals. One day at a time.
          </p>
          {isConfigured() && sheetsLoaded && (
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              marginTop: 8, padding: "4px 14px", borderRadius: 99,
              background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)",
            }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.success, animation: "pulse 2s infinite" }} />
              <span style={{ fontSize: 11, color: C.success, fontWeight: 600, letterSpacing: "0.02em" }}>Connected to Google Sheets</span>
            </div>
          )}
        </header>

        {/* âââ TAB NAVIGATION âââ */}
        <nav style={{
          display: "flex", justifyContent: "center", gap: 4, marginBottom: 32,
          background: C.glass, backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
          borderRadius: 16, padding: 5,
          border: `1px solid ${C.border}`, maxWidth: 480, margin: "0 auto 32px auto",
          boxShadow: "0 4px 24px rgba(0,0,0,0.15)",
        }}>
          {[
            { id: "all", label: "Overview", icon: "\u{1F4CB}" },
            { id: "tasks", label: "Tasks", icon: "\u2705" },
            { id: "health", label: "Health", icon: "\u{1F4AA}" },
            { id: "money", label: "Money", icon: "\u{1F4B0}" },
          ].map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
              flex: 1, padding: "10px 12px", borderRadius: 12, border: "none",
              background: activeTab === tab.id ? "linear-gradient(135deg, #38BDF8, #818CF8)" : "transparent",
              color: activeTab === tab.id ? "#fff" : C.muted,
              fontSize: 13, fontWeight: activeTab === tab.id ? 700 : 500,
              cursor: "pointer", transition: "all 0.25s ease",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
              boxShadow: activeTab === tab.id ? "0 2px 12px rgba(56,189,248,0.3)" : "none",
            }}>
              <span style={{ fontSize: 14 }}>{tab.icon}</span> {tab.label}
            </button>
          ))}
        </nav>

        {/* âââ WORLD CLOCKS âââ */}
        {activeTab === "all" && (
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
            gap: 12, marginBottom: 20,
          }}>
            {worldClocks.map((clock) => {
              const timeStr = now.toLocaleString("en-GB", { timeZone: clock.tz, hour: "numeric", minute: "2-digit", hour12: true });
              const dateStr = now.toLocaleString("en-GB", { timeZone: clock.tz, weekday: "short", day: "numeric", month: "short" });
              const hour = parseInt(now.toLocaleString("en-GB", { timeZone: clock.tz, hour: "numeric", hour12: false }));
              const isDaytime = hour >= 6 && hour < 20;
              return (
                <div key={clock.tz} style={{
                  background: C.glass, backdropFilter: "blur(16px)",
                  borderRadius: 14, padding: "14px 12px", textAlign: "center",
                  border: `1px solid ${C.border}`,
                  animation: "fadeIn 0.4s ease",
                }}>
                  <div style={{ fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4, fontWeight: 600 }}>
                    {clock.flag} {clock.city}
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: C.text, letterSpacing: "0.02em", fontVariantNumeric: "tabular-nums" }}>
                    {timeStr.replace(/ /g, "").toUpperCase()}
                  </div>
                  <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>
                    {dateStr} {isDaytime ? "\u2600\uFE0F" : "\u{1F319}"}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* âââ WEATHER âââ */}
        {activeTab === "all" && weather && weather.current && (
          <Card style={{ marginBottom: 20, padding: "20px 24px" }} glow>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <span style={{ fontSize: 44 }}>{WMO_ICONS[weather.current.weather_code] || "\u{1F324}\uFE0F"}</span>
                <div>
                  <div style={{ fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600 }}>Kingston upon Thames</div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                    <span style={{ fontSize: 32, fontWeight: 900, color: C.text }}>{Math.round(weather.current.temperature_2m)}\u00B0C</span>
                    <span style={{ fontSize: 13, color: C.muted }}>Feels {Math.round(weather.current.apparent_temperature)}\u00B0C</span>
                  </div>
                  <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
                    {WMO_DESC[weather.current.weather_code] || "Unknown"} \u00B7 \u{1F4A8} {Math.round(weather.current.wind_speed_10m)} km/h \u00B7 \u{1F4A7} {weather.current.relative_humidity_2m}%
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {weather.daily && weather.daily.time.map((date, i) => {
                  const dayName = i === 0 ? "Today" : new Date(date).toLocaleDateString("en-GB", { weekday: "short" });
                  return (
                    <div key={date} style={{
                      textAlign: "center", padding: "8px 8px", borderRadius: 12,
                      background: i === 0 ? "rgba(56,189,248,0.12)" : "rgba(255,255,255,0.03)",
                      border: i === 0 ? "1px solid rgba(56,189,248,0.25)" : `1px solid ${C.border}`,
                      minWidth: 56, transition: "background 0.2s",
                    }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: i === 0 ? C.accent : C.muted, marginBottom: 3 }}>{dayName}</div>
                      <div style={{ fontSize: 20 }}>{WMO_ICONS[weather.daily.weather_code[i]] || "\u{1F324}\uFE0F"}</div>
                      <div style={{ fontSize: 11, fontWeight: 800, color: C.text, marginTop: 3 }}>{Math.round(weather.daily.temperature_2m_max[i])}\u00B0</div>
                      <div style={{ fontSize: 10, color: C.muted }}>{Math.round(weather.daily.temperature_2m_min[i])}\u00B0</div>
                      {weather.daily.precipitation_probability_max[i] > 0 && (
                        <div style={{ fontSize: 9, color: C.accent, marginTop: 1 }}>\u{1F327} {weather.daily.precipitation_probability_max[i]}%</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>
        )}
        {activeTab === "all" && !weather && !weatherError && (
          <Card style={{ marginBottom: 20, textAlign: "center", padding: 16 }}>
            <span style={{ color: C.muted, fontSize: 13, animation: "pulse 1.5s infinite" }}>\u{1F324}\uFE0F Loading weather...</span>
          </Card>
        )}

        {/* âââ SUMMARY STATS âââ */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
          gap: 12, marginBottom: 24,
        }}>
          <StatBox
            label="Sober Days" value={soberDays} sub={`~${soberMonths} months \u{1F31F}`}
            color={C.success} borderColor="rgba(34,197,94,0.25)"
            bg="linear-gradient(135deg, rgba(15,23,42,0.8), rgba(13,51,32,0.6))"
          />
          <StatBox label="Current Weight" value={weight.current} sub={weight.unit} color={C.accent} />
          <StatBox label="Weight Lost" value={`-${weightLost}`} sub={`${weight.unit} lost`} color={C.success} borderColor="rgba(34,197,94,0.15)" />
          <StatBox label="Body Fat" value={`${bodyFat.current}%`} sub={`down from ${bodyFat.start}%`} color={C.orange} borderColor="rgba(249,115,22,0.15)" />
          <StatBox label="Fat Burned" value={`-${fatMass.start - fatMass.current}`} sub="lbs burned" color={C.danger} borderColor="rgba(239,68,68,0.15)" />
          <StatBox label="Muscle Mass" value={muscle.current} sub={`+${muscle.current - muscle.start} ${muscle.unit}`} color={C.purple} borderColor="rgba(168,85,247,0.15)" />
          <StatBox label="Tasks Done" value={`${taskStats.all?.done || 0}/${taskStats.all?.total || 0}`} sub={`${taskStats.all?.pct || 0}% complete`} color={C.accent} borderColor="rgba(56,189,248,0.15)" />
        </div>

        {/* âââ HEALTH SECTION âââ */}
        {(activeTab === "all" || activeTab === "health") && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: 20, marginBottom: 24 }}>

            {/* Weight Loss Journey */}
            <Card glow>
              <SectionTitle emoji="\u2696\uFE0F">Weight Loss Journey</SectionTitle>
              <div style={{ display: "flex", justifyContent: "space-around", marginBottom: 20 }}>
                {[
                  { label: "Started", val: weight.start, color: C.danger },
                  { label: "Current", val: weight.current, color: C.accent, editable: true },
                  { label: "Goal", val: weight.goal, color: C.success },
                ].map((item) => (
                  <div key={item.label} style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600 }}>{item.label}</div>
                    <div style={{ fontSize: 26, fontWeight: 900, color: item.color, marginTop: 4 }}>
                      {item.editable ? (
                        <EditableValue value={item.val} color={item.color} onSave={(v) => setWeight((p) => ({ ...p, current: v }))} />
                      ) : item.val}
                    </div>
                    <div style={{ fontSize: 11, color: C.muted }}>{weight.unit}</div>
                  </div>
                ))}
              </div>
              <ProgressBar value={weightLost} max={weightTotalToLose} color={C.success} height={14} />
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 12 }}>
                <span style={{ color: C.success, fontWeight: 600 }}>Lost: {weightLost} {weight.unit} \u{1F389}</span>
                <span style={{ color: C.muted }}>To go: {weightToGo} {weight.unit}</span>
              </div>
              <div style={{
                marginTop: 16, padding: "14px 16px", textAlign: "center",
                background: "rgba(34,197,94,0.08)", borderRadius: 14, border: "1px solid rgba(34,197,94,0.15)",
              }}>
                <span style={{ fontSize: 30, fontWeight: 900, color: C.success }}>{weightPct}%</span>{" "}
                <span style={{ fontSize: 13, color: C.muted }}>of the way there!</span>
              </div>

              {/* Body Fat */}
              <div style={{ marginTop: 24, paddingTop: 20, borderTop: `1px solid ${C.border}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <span style={{ fontWeight: 700, fontSize: 15, color: C.text }}>\u{1F4C9} Body Fat %</span>
                  <span style={{ fontSize: 12, color: C.muted }}>
                    <EditableValue value={bodyFat.current} color={C.accent} fontSize={14} onSave={(v) => setBodyFat((p) => ({ ...p, current: v }))} />%
                    {" \u2192 "}
                    <EditableValue value={bodyFat.goal} color={C.success} fontSize={14} onSave={(v) => setBodyFat((p) => ({ ...p, goal: v }))} />%
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-around", marginBottom: 10 }}>
                  {[
                    { label: "Started", val: `${bodyFat.start}%`, color: C.danger },
                    { label: "Current", val: `${bodyFat.current}%`, color: C.orange },
                    { label: "Goal", val: `${bodyFat.goal || 15}%`, color: C.success },
                  ].map((x) => (
                    <div key={x.label} style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600 }}>{x.label}</div>
                      <div style={{ fontSize: 20, fontWeight: 800, color: x.color }}>{x.val}</div>
                    </div>
                  ))}
                </div>
                {(() => {
                  const lost = bodyFat.start - bodyFat.current;
                  const total = bodyFat.start - (bodyFat.goal || 15);
                  const pct = total > 0 ? Math.round((lost / total) * 100) : 0;
                  return (
                    <>
                      <ProgressBar value={Math.max(0, lost)} max={Math.max(1, total)} color={C.orange} height={10} />
                      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, fontSize: 11 }}>
                        <span style={{ color: C.orange, fontWeight: 600 }}>Dropped: {lost}% \u{1F525}</span>
                        <span style={{ color: C.muted }}>To go: {bodyFat.current - (bodyFat.goal || 15)}%</span>
                      </div>
                      <div style={{ marginTop: 10, padding: "8px 12px", background: "rgba(249,115,22,0.08)", borderRadius: 10, border: "1px solid rgba(249,115,22,0.15)", textAlign: "center" }}>
                        <span style={{ fontSize: 22, fontWeight: 900, color: C.orange }}>{pct}%</span>{" "}
                        <span style={{ fontSize: 12, color: C.muted }}>of fat loss goal</span>
                      </div>
                    </>
                  );
                })()}
              </div>

              {/* Fat Mass */}
              <div style={{ marginTop: 24, paddingTop: 20, borderTop: `1px solid ${C.border}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <span style={{ fontWeight: 700, fontSize: 15, color: C.text }}>\u{1F525} Fat Loss (lbs)</span>
                  <span style={{ fontSize: 12, color: C.muted }}>
                    <EditableValue value={fatMass.current} color={C.accent} fontSize={14} onSave={(v) => setFatMass((p) => ({ ...p, current: v }))} />
                    {" \u2192 "}
                    <EditableValue value={fatMass.goal} color={C.success} fontSize={14} onSave={(v) => setFatMass((p) => ({ ...p, goal: v }))} /> lbs
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-around", marginBottom: 10 }}>
                  {[
                    { label: "Started", val: fatMass.start, color: C.danger },
                    { label: "Current", val: fatMass.current, color: C.danger },
                    { label: "Goal", val: fatMass.goal, color: C.success },
                  ].map((x) => (
                    <div key={x.label} style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600 }}>{x.label}</div>
                      <div style={{ fontSize: 20, fontWeight: 800, color: x.color }}>{x.val}</div>
                      <div style={{ fontSize: 10, color: C.muted }}>lbs</div>
                    </div>
                  ))}
                </div>
                {(() => {
                  const lost = fatMass.start - fatMass.current;
                  const total = fatMass.start - fatMass.goal;
                  const pct = total > 0 ? Math.round((lost / total) * 100) : 0;
                  return (
                    <>
                      <ProgressBar value={Math.max(0, lost)} max={Math.max(1, total)} color={C.danger} height={10} />
                      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, fontSize: 11 }}>
                        <span style={{ color: C.success, fontWeight: 600 }}>Lost: {lost} lbs \u{1F4AA}</span>
                        <span style={{ color: C.muted }}>To go: {fatMass.current - fatMass.goal} lbs</span>
                      </div>
                      <div style={{ marginTop: 10, padding: "8px 12px", background: "rgba(239,68,68,0.08)", borderRadius: 10, border: "1px solid rgba(239,68,68,0.15)", textAlign: "center" }}>
                        <span style={{ fontSize: 22, fontWeight: 900, color: C.danger }}>{pct}%</span>{" "}
                        <span style={{ fontSize: 12, color: C.muted }}>of fat burned</span>
                      </div>
                    </>
                  );
                })()}
              </div>
            </Card>

            {/* Fitness Goals */}
            <Card>
              <SectionTitle emoji="\u{1F3CB}\uFE0F" sub="Pick one to smash today \u2014 tick it off, then update your progress">Fitness Goals</SectionTitle>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {fitnessGoals.map((goal) => {
                  const pct = goal.goal > 0 ? Math.round((goal.current / goal.goal) * 100) : 0;
                  return (
                    <div key={goal.id} style={{
                      padding: "14px 16px", borderRadius: 14,
                      background: goal.doneToday ? "rgba(34,197,94,0.08)" : "rgba(255,255,255,0.03)",
                      border: goal.doneToday ? "1px solid rgba(34,197,94,0.2)" : `1px solid ${C.border}`,
                      transition: "all 0.25s ease",
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                        <div onClick={() => toggleFitnessToday(goal.id)} style={{
                          width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                          border: goal.doneToday ? "none" : `2px solid ${C.borderLight}`,
                          background: goal.doneToday ? C.success : "transparent",
                          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 14, color: "#fff", transition: "all 0.2s",
                          boxShadow: goal.doneToday ? "0 2px 8px rgba(34,197,94,0.3)" : "none",
                        }}>
                          {goal.doneToday && "\u2713"}
                        </div>
                        <span style={{ fontWeight: 700, fontSize: 15, flex: 1, color: goal.doneToday ? C.success : C.text }}>
                          {goal.icon} {goal.name}
                        </span>
                        <span style={{
                          fontSize: 10, color: goal.doneToday ? C.success : C.muted,
                          fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em",
                          padding: "3px 8px", borderRadius: 6,
                          background: goal.doneToday ? "rgba(34,197,94,0.15)" : "rgba(255,255,255,0.04)",
                        }}>
                          {goal.doneToday ? "Done!" : "Today?"}
                        </span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ flex: 1 }}>
                          <ProgressBar value={goal.current} max={goal.goal} color={goal.doneToday ? C.success : C.accent} height={6} showLabel={false} />
                        </div>
                        <span style={{ fontSize: 11, color: C.muted, minWidth: 85, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                          {editingGoal === goal.id ? (
                            <input type="number" defaultValue={goal.current}
                              onBlur={(e) => { updateGoalCurrent(goal.id, e.target.value); setEditingGoal(null); }}
                              onKeyDown={(e) => { if (e.key === "Enter") { updateGoalCurrent(goal.id, e.target.value); setEditingGoal(null); } }}
                              autoFocus
                              style={{ width: 45, background: "rgba(255,255,255,0.05)", border: `1px solid ${C.accent}`, borderRadius: 6, color: C.text, fontSize: 11, textAlign: "center", padding: "2px", outline: "none" }}
                            />
                          ) : (
                            <span onClick={() => setEditingGoal(goal.id)} style={{ cursor: "pointer", borderBottom: "1px dashed rgba(255,255,255,0.2)" }} title="Click to update">
                              {goal.current}
                            </span>
                          )} / {goal.goal} {goal.unit}
                        </span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: C.muted, marginTop: 4 }}>
                        <span>Started: {goal.start} {goal.unit}</span>
                        <span>{pct}% to goal</span>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div style={{
                marginTop: 12, padding: "10px 14px",
                background: fitnessGoals.some((g) => g.doneToday) ? "rgba(34,197,94,0.08)" : "rgba(255,255,255,0.02)",
                borderRadius: 12, border: fitnessGoals.some((g) => g.doneToday) ? "1px solid rgba(34,197,94,0.15)" : `1px solid ${C.border}`,
                textAlign: "center",
              }}>
                {fitnessGoals.some((g) => g.doneToday) ? (
                  <span style={{ fontSize: 13, color: C.success, fontWeight: 700 }}>
                    \u{1F525} {fitnessGoals.filter((g) => g.doneToday).map((g) => g.name).join(" + ")} done today!
                  </span>
                ) : (
                  <span style={{ fontSize: 13, color: C.muted }}>Pick an activity for today \u261D\uFE0F</span>
                )}
              </div>
            </Card>
          </div>
        )}

        {/* âââ TASKS SECTION âââ */}
        {(activeTab === "all" || activeTab === "tasks") && (
           <>
            {/* Add task bar */}
            <Card style={{ marginBottom: 20, padding: "16px 20px" }}>
              <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                <select value={newTaskCat} onChange={(e) => setNewTaskCat(e.target.value)} style={{
                  background: "rgba(255,255,255,0.05)", color: C.text, border: `1px solid ${C.border}`,
                  borderRadius: 10, padding: "10px 14px", fontSize: 13, cursor: "pointer", outline: "none",
                }}>
                  {["work", "diet", "family", "personal"].map((c) => (
                    <option key={c} value={c}>{catEmoji[c]} {catLabel[c]}</option>
                  ))}
                </select>
                <input value={newTask} onChange={(e) => setNewTask(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addTask()}
                  placeholder="Add a new task..."
                  style={{
                    flex: 1, minWidth: 200, background: "rgba(255,255,255,0.05)", color: C.text,
                    border: `1px solid ${C.border}`, borderRadius: 10,
                    padding: "10px 14px", fontSize: 13, outline: "none",
                    transition: "border-color 0.2s",
                  }}
                />
                <button onClick={addTask} style={{
                  background: "linear-gradient(135deg, #38BDF8, #818CF8)",
                  color: "#fff", border: "none", borderRadius: 10,
                  padding: "10px 22px", fontSize: 13, fontWeight: 700,
                  cursor: "pointer", boxShadow: "0 2px 12px rgba(56,189,248,0.25)",
                  transition: "transform 0.15s, box-shadow 0.15s",
                }}>
                  + Add
                </button>
              </div>
            </Card>

            {/* Task lists */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16, marginBottom: 24 }}>
              {["work", "diet", "family", "personal"].map((cat) => {
                const catTasks = [...tasks.filter((t) => t.category === cat)].sort((a, b) => a.done === b.done ? 0 : a.done ? 1 : -1);
                return (
                  <Card key={cat} style={{ borderTop: `3px solid ${C[cat] || C.accent}`, padding: "20px 22px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                      <SectionTitle emoji={catEmoji[cat]}>{catLabel[cat]}</SectionTitle>
                      <span style={{
                        background: "rgba(255,255,255,0.06)", borderRadius: 20,
                        padding: "3px 10px", fontSize: 11, color: C.muted, fontWeight: 600,
                        fontVariantNumeric: "tabular-nums",
                      }}>
                        {taskStats[cat]?.done}/{taskStats[cat]?.total}
                      </span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {catTasks.length === 0 && (
                        <div style={{ color: C.muted, fontSize: 12, fontStyle: "italic", textAlign: "center", padding: 20 }}>
                          No tasks yet
                        </div>
                      )}
                      {catTasks.map((task) => (
                        <div key={task.id} style={{
                          display: "flex", alignItems: "center", gap: 10,
                          padding: "10px 12px", borderRadius: 10,
                          background: task.done ? "rgba(34,197,94,0.06)" : "rgba(255,255,255,0.03)",
                          border: task.done ? "1px solid rgba(34,197,94,0.1)" : `1px solid ${C.border}`,
                          transition: "all 0.2s",
                        }}>
                          <div onClick={() => toggleTask(task.id)} style={{
                            width: 20, height: 20, borderRadius: 6, flexShrink: 0,
                            border: task.done ? "none" : `2px solid ${C.borderLight}`,
                            background: task.done ? C.success : "transparent",
                            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 11, color: "#fff", transition: "all 0.2s",
                          }}>
                            {task.done && "\u2713"}
                          </div>
                          <span style={{
                            flex: 1, fontSize: 13,
                            textDecoration: task.done ? "line-through" : "none",
                            color: task.done ? C.muted : C.text,
                            transition: "color 0.2s",
                          }}>
                            {task.text}
                          </span>
                          <button onClick={() => deleteTask(task.id)} style={{
                            background: "none", border: "none", color: "rgba(255,255,255,0.15)",
                            cursor: "pointer", fontSize: 18, padding: "0 4px", lineHeight: 1,
                            transition: "color 0.2s",
                          }}
                            onMouseEnter={(e) => e.target.style.color = C.danger}
                            onMouseLeave={(e) => e.target.style.color = "rgba(255,255,255,0.15)"}
                          >
                            \u00D7
                          </button>
                        </div>
                      ))}
                    </div>
                  </Card>
                );
              })}
            </div>

            {/* Charts row */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20, marginBottom: 24 }}>
              {/* Radar */}
              <Card>
                <SectionTitle emoji="\u{1F9ED}" sub="Higher = more attention needed">Focus Radar</SectionTitle>
                {(() => {
                  const radarData = ["work", "diet", "family", "personal"].map((cat) => {
                    const s = taskStats[cat] || { total: 0, done: 0 };
                    return { category: catLabel[cat], attention: s.total - s.done, fullMark: Math.max(taskStats.all?.total || 1, 1) };
                  });
                  const maxAttention = radarData.reduce((a, b) => a.attention > b.attention ? a : b, radarData[0]);
                  return (
                    <>
                      <div style={{ height: 240 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                            <PolarGrid stroke="rgba(255,255,255,0.08)" />
                            <PolarAngleAxis dataKey="category" tick={{ fill: C.text, fontSize: 11, fontWeight: 600 }} />
                            <PolarRadiusAxis angle={90} domain={[0, "auto"]} tick={{ fill: C.muted, fontSize: 9 }} axisLine={false} />
                            <Radar name="Attention" dataKey="attention" stroke={C.accent} fill={C.accent} fillOpacity={0.2} strokeWidth={2} />
                            <Tooltip contentStyle={{ background: C.cardSolid, border: "none", borderRadius: 10, color: C.text, fontSize: 12 }} />
                          </RadarChart>
                        </ResponsiveContainer>
                      </div>
                      <div style={{ marginTop: 8, padding: "8px 12px", background: "rgba(56,189,248,0.08)", borderRadius: 10, border: "1px solid rgba(56,189,248,0.15)", textAlign: "center" }}>
                        <span style={{ fontSize: 12, color: C.muted }}>Top priority: </span>
                        <span style={{ fontSize: 14, fontWeight: 800, color: C.accent }}>{maxAttention.category}</span>
                        <span style={{ fontSize: 12, color: C.muted }}> ({maxAttention.attention} remaining)</span>
                      </div>
                    </>
                  );
                })()}
              </Card>

              {/* Pie */}
              <Card>
                <SectionTitle emoji="\u{1F4CA}">Task Distribution</SectionTitle>
                <div style={{ height: 280 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={95} paddingAngle={4} dataKey="value" stroke="none"
                        label={({ name, pct, cx, cy, midAngle, outerRadius: or }) => {
                          const R = Math.PI / 180;
                          const rad = or + 22;
                          const x = cx + rad * Math.cos(-midAngle * R);
                          const y = cy + rad * Math.sin(-midAngle * R);
                          return <text x={x} y={y} fill={C.text} textAnchor={x > cx ? "start" : "end"} dominantBaseline="central" fontSize={12} fontWeight={600}>{name} {pct}%</text>;
                        }}>
                        {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                      </Pie>
                      <Tooltip contentStyle={{ background: C.cardSolid, border: "none", borderRadius: 10, color: C.text, fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              {/* Completion Stats */}
              <Card>
                <SectionTitle emoji="\u{1F4C8}">Completion Stats</SectionTitle>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
                  {["work", "diet", "family", "personal"].map((cat) => (
                    <div key={cat} style={{
                      background: "rgba(255,255,255,0.03)", borderRadius: 14, padding: "14px 12px", textAlign: "center",
                      border: `2px solid ${C[cat]}20`, transition: "border-color 0.2s",
                    }}>
                      <div style={{ fontSize: 22 }}>{catEmoji[cat]}</div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: C.text, marginTop: 4 }}>{catLabel[cat]}</div>
                      <div style={{ fontSize: 24, fontWeight: 900, color: C[cat], marginTop: 2 }}>{taskStats[cat]?.pct || 0}%</div>
                      <div style={{ fontSize: 10, color: C.muted, fontWeight: 500 }}>{taskStats[cat]?.done || 0} / {taskStats[cat]?.total || 0}</div>
                    </div>
                  ))}
                </div>
                <div style={{ padding: "10px 14px", background: "rgba(56,189,248,0.08)", borderRadius: 12, border: "1px solid rgba(56,189,248,0.15)", textAlign: "center" }}>
                  <span style={{ fontSize: 13, color: C.muted }}>Overall: </span>
                  <span style={{ fontSize: 22, fontWeight: 900, color: C.accent }}>{taskStats.all?.pct || 0}%</span>
                  <span style={{ fontSize: 13, color: C.muted }}> ({taskStats.all?.done}/{taskStats.all?.total})</span>
                </div>
              </Card>
            </div>
          </>
        )}

        {/* âââ FINANCES âââ */}
        {(activeTab === "all" || activeTab === "money") && (
          <Card style={{ marginBottom: 24 }} glow>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4, flexWrap: "wrap", gap: 8 }}>
              <SectionTitle emoji="\u{1F4B0}">Debt Tracker</SectionTitle>
              {(() => {
                const totalUsed = debts.reduce((s, d) => s + d.used, 0);
                const totalLimit = debts.reduce((s, d) => s + d.limit, 0);
                return (
                  <span style={{ fontSize: 12, color: C.muted }}>
                    Total: <span style={{ fontWeight: 800, color: totalUsed > 0 ? C.danger : C.success }}>\u00A3{totalUsed.toLocaleString()}</span>
                    <span> / \u00A3{totalLimit.toLocaleString()}</span>
                  </span>
                );
              })()}
            </div>
            <p style={{ fontSize: 11, color: C.muted, margin: "-8px 0 16px 32px" }}>Click any balance to update it</p>

            {/* Overall progress */}
            {(() => {
              const totalUsed = debts.reduce((s, d) => s + d.used, 0);
              const totalStarted = debts.reduce((s, d) => s + d.limit, 0);
              const paidOff = totalStarted - totalUsed;
              const paidPct = totalStarted > 0 ? Math.round((paidOff / totalStarted) * 100) : 0;
              return (
                <div style={{ marginBottom: 18, padding: "14px 18px", background: "rgba(255,255,255,0.03)", borderRadius: 14, border: `1px solid ${C.border}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>Overall Debt Freedom</span>
                    <span style={{ fontSize: 13, fontWeight: 900, color: totalUsed === 0 ? C.success : C.accent }}>{paidPct}%</span>
                  </div>
                  <ProgressBar value={paidOff} max={totalStarted} color={C.success} height={8} showLabel={false} />
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginTop: 6 }}>
                    <span style={{ color: C.success, fontWeight: 600 }}>Available: \u00A3{(totalStarted - totalUsed).toLocaleString()}</span>
                    <span style={{ color: C.danger, fontWeight: 600 }}>Owed: \u00A3{totalUsed.toLocaleString()}</span>
                  </div>
                </div>
              );
            })()}

            {/* Debt cards */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[...debts].sort((a, b) => b.used - a.used).map((debt) => {
                const usedPct = debt.limit > 0 ? Math.round((debt.used / debt.limit) * 100) : 0;
                const available = debt.limit - debt.used;
                const severity = usedPct >= 90 ? C.danger : usedPct >= 70 ? C.orange : usedPct >= 40 ? C.accent : C.success;
                return (
                  <div key={debt.id} style={{
                    padding: "14px 16px", borderRadius: 14,
                    background: debt.used === 0 ? "rgba(34,197,94,0.06)" : "rgba(255,255,255,0.03)",
                    border: debt.used === 0 ? "1px solid rgba(34,197,94,0.15)" : `1px solid ${severity}18`,
                    transition: "all 0.2s",
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <span style={{ fontWeight: 700, fontSize: 14, color: debt.used === 0 ? C.success : C.text }}>
                        {debt.icon} {debt.name}
                      </span>
                      <span style={{
                        fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em",
                        color: debt.used === 0 ? C.success : severity,
                        padding: "2px 8px", borderRadius: 6,
                        background: debt.used === 0 ? "rgba(34,197,94,0.12)" : `${severity}12`,
                      }}>
                        {debt.used === 0 ? "Clear!" : usedPct >= 90 ? "Critical" : usedPct >= 70 ? "High" : usedPct >= 40 ? "Moderate" : "Low"}
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ flex: 1 }}>
                        <ProgressBar value={debt.used} max={debt.limit} color={severity} height={6} showLabel={false} />
                      </div>
                      <span style={{ fontSize: 12, color: C.muted, minWidth: 150, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                        \u00A3{editingDebt === debt.id ? (
                          <input type="number" value={tempDebtVal}
                            onChange={(e) => setTempDebtVal(e.target.value)}
                            onBlur={() => { setDebts((p) => p.map((d) => d.id === debt.id ? { ...d, used: Math.max(0, Number(tempDebtVal) || 0) } : d)); setEditingDebt(null); }}
                            onKeyDown={(e) => { if (e.key === "Enter") { setDebts((p) => p.map((d) => d.id === debt.id ? { ...d, used: Math.max(0, Number(tempDebtVal) || 0) } : d)); setEditingDebt(null); } }}
                            autoFocus
                            style={{ width: 60, background: "rgba(255,255,255,0.05)", border: `1px solid ${severity}`, borderRadius: 6, color: C.text, fontSize: 12, textAlign: "center", padding: "2px", outline: "none" }}
                          />
                        ) : (
                          <span onClick={() => { setEditingDebt(debt.id); setTempDebtVal(String(debt.used)); }}
                            style={{ cursor: "pointer", borderBottom: "1px dashed rgba(255,255,255,0.25)", fontWeight: 700, color: severity }}
                            title="Click to update">
                            {debt.used.toLocaleString()}
                          </span>
                        )} / \u00A3{debt.limit.toLocaleString()}
                      </span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: C.muted, marginTop: 4 }}>
                      <span>{usedPct}% used</span>
                      <span style={{ color: C.success }}>\u00A3{available.toLocaleString()} available</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Summary */}
            {(() => {
              const cleared = debts.filter((d) => d.used === 0).length;
              const totalUsed = debts.reduce((s, d) => s + d.used, 0);
              return (
                <div style={{
                  marginTop: 12, padding: "10px 14px",
                  background: cleared === debts.length ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.05)",
                  borderRadius: 12, border: cleared === debts.length ? "1px solid rgba(34,197,94,0.15)" : "1px solid rgba(239,68,68,0.08)",
                  textAlign: "center",
                }}>
                  {cleared === debts.length ? (
                    <span style={{ fontSize: 13, color: C.success, fontWeight: 800 }}>\u{1F389} DEBT FREE! All cards cleared!</span>
                  ) : (
                    <span style={{ fontSize: 12, color: C.muted }}>
                      {cleared > 0 && <span style={{ color: C.success, fontWeight: 700 }}>{cleared} card{cleared > 1 ? "s" : ""} clear! </span>}
                      <span style={{ fontWeight: 800, color: C.danger }}>\u00A3{totalUsed.toLocaleString()}</span> total across {debts.length - cleared} card{debts.length - cleared !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>
              );
            })()}
          </Card>
        )}

        {/* âââ SERENITY PRAYER âââ */}
        {activeTab === "all" && (
          <div style={{
            marginTop: 16, padding: "32px 36px", textAlign: "center",
            background: "linear-gradient(135deg, rgba(56,189,248,0.04), rgba(129,140,248,0.04), rgba(192,132,252,0.04))",
            borderRadius: 20, border: `1px solid ${C.border}`,
            backdropFilter: "blur(16px)",
          }}>
            <div style={{ fontSize: 11, color: C.accent, textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 16, fontWeight: 700 }}>
              The Serenity Prayer
            </div>
            <div style={{ fontSize: 17, color: C.mutedLight, lineHeight: 2, fontStyle: "italic", maxWidth: 460, margin: "0 auto", fontWeight: 400 }}>
              God, grant me the serenity<br />
              to accept the things I cannot change,<br />
              the courage to change the things I can,<br />
              and the wisdom to know the difference.
            </div>
          </div>
        )}

        {/* Footer */}
        <footer style={{ textAlign: "center", marginTop: 28, paddingBottom: 20, color: C.muted, fontSize: 11 }}>
          {new Date().toLocaleDateString("en-GB", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          <span style={{ margin: "0 8px", opacity: 0.3 }}>\u00B7</span>
          Click numbers to update them
        </footer>

      </div>
    </div>
  );
}
 <div style={{
                  marginTop: 12, padding: "10px 14px",
                  background: cleared === debts.length ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.05)",
                  borderRadius: 12, border: cleared === debts.length ? "1px solid rgba(34,197,94,0.15)" : "1px solid rgba(239,68,68,0.08)",
                  textAlign: "center",
                }}>
                  {cleared === debts.length ? (
                    <span style={{ fontSize: 13, color: C.success, fontWeight: 800 }}>\u{1F389} DEBT FREE! All cards cleared!</span>
                  ) : (
                    <span style={{ fontSize: 12, color: C.muted }}>
                      {cleared > 0 && <span style={{ color: C.success, fontWeight: 700 }}>{cleared} card{cleared > 1 ? "s" : ""} clear! </span>}
                      <span style={{ fontWeight: 800, color: C.danger }}>\u00A3{totalUsed.toLocaleString()}</span> total across {debts.length - cleared} card{debts.length - cleared !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>
              );
            })()}
          </Card>
        )}

        {/* âââ SERENITY PRAYER âââ */}
        {activeTab === "all" && (
          <div style={{
            marginTop: 16, padding: "32px 36px", textAlign: "center",
            background: "linear-gradient(135deg, rgba(56,189,248,0.04), rgba(129,140,248,0.04), rgba(192,132,252,0.04))",
            borderRadius: 20, border: `1px solid ${C.border}`,
            backdropFilter: "blur(16px)",
          }}>
            <div style={{ fontSize: 11, color: C.accent, textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 16, fontWeight: 700 }}>
              The Serenity Prayer
            </div>
            <div style={{ fontSize: 17, color: C.mutedLight, lineHeight: 2, fontStyle: "italic", maxWidth: 460, margin: "0 auto", fontWeight: 400 }}>
              God, grant me the serenity<br />
              to accept the things I cannot change,<br />
              the courage to change the things I can,<br />
              and the wisdom to know the difference.
            </div>
          </div>
        )}

        {/* Footer */}
        <footer style={{ textAlign: "center", marginTop: 28, paddingBottom: 20, color: C.muted, fontSize: 11 }}>
          {new Date().toLocaleDateString("en-GB", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          <span style={{ margin: "0 8px", opacity: 0.3 }}>\u00B7</span>
          Click numbers to update them
        </footer>

      </div>
    </div>
  );
}
