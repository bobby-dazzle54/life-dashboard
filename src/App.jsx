Ximport { useState, useMemo, useEffect } from "react";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from "recharts";
import { fetchAllData, isConfigured, SHEET_ID } from "./sheets.js";

// âââ colour palette âââ
const COLORS = {
  work: "#3B82F6",
  diet: "#10B981",
  family: "#F59E0B",
  personal: "#8B5CF6",
  bg: "#0F172A",
  card: "#1E293B",
  cardAlt: "#334155",
  accent: "#38BDF8",
  text: "#F1F5F9",
  muted: "#94A3B8",
  success: "#22C55E",
  danger: "#EF4444",
};

const PIE_COLORS = [COLORS.work, COLORS.diet, COLORS.family, COLORS.personal];

// âââ initial data âââ
const INITIAL_WEIGHT = {
  start: 268,
  current: 243,
  goal: 210,
  unit: "lbs",
  history: [
    { date: "Jan", weight: 268 },
    { date: "Feb", weight: 261 },
    { date: "Mar", weight: 253 },
    { date: "Apr", weight: 243 },
  ],
};

const INITIAL_FITNESS_GOALS = [
  { id: 1, name: "Press-ups", icon: "ðª", start: 8, current: 8, goal: 50, unit: "reps", doneToday: false },
  { id: 2, name: "Cycling", icon: "ð´", start: 8, current: 8, goal: 30, unit: "miles", doneToday: false },
  { id: 3, name: "Running", icon: "ð", start: 8, current: 8, goal: 30, unit: "mins", doneToday: false },
  { id: 4, name: "Weight Lifting", icon: "ðï¸", start: 25, current: 70, goal: 120, unit: "kg", doneToday: false },
  { id: 5, name: "Rowing", icon: "ð£", start: 1000, current: 8000, goal: 20000, unit: "m", doneToday: false },
];

const INITIAL_DEBTS = [
  { id: 2, name: "American Express BA", icon: "âï¸", used: 8100, limit: 9000 },
  { id: 5, name: "MBNA", icon: "ð³", used: 8000, limit: 25000 },
  { id: 1, name: "American Express Gold", icon: "ð³", used: 6100, limit: 6900 },
  { id: 3, name: "Barclaycard", icon: "ð³", used: 3900, limit: 4000 },
  { id: 4, name: "Natwest Credit Card", icon: "ð¦", used: 0, limit: 3500 },
];

const INITIAL_TASKS = [
  // Work
  { id: 1, category: "work", text: "Finish Q2 project proposal", done: false },
  { id: 2, category: "work", text: "Review team pull requests", done: false },
  { id: 3, category: "work", text: "Update client invoices", done: true },
  { id: 4, category: "work", text: "Prepare Monday standup notes", done: false },
  { id: 5, category: "work", text: "Complete compliance training", done: false },
  // Diet
  { id: 6, category: "diet", text: "Meal prep for the week", done: false },
  { id: 7, category: "diet", text: "Hit daily protein target (150g)", done: false },
  { id: 8, category: "diet", text: "Drink 3 litres of water", done: true },
  { id: 9, category: "diet", text: "No snacking after 8pm", done: false },
  { id: 10, category: "diet", text: "Log all meals in tracker", done: false },
  // Family
  { id: 11, category: "family", text: "Plan weekend day out", done: false },
  { id: 12, category: "family", text: "Call parents", done: true },
  { id: 13, category: "family", text: "Organise family photos", done: false },
  { id: 14, category: "family", text: "Help kids with homework", done: false },
  // Personal
  { id: 15, category: "personal", text: "Read 30 pages of current book", done: false },
  { id: 16, category: "personal", text: "Tidy the garage", done: false },
  { id: 17, category: "personal", text: "Learn a new recipe", done: true },
  { id: 18, category: "personal", text: "Update personal budget", done: false },
];

// âââ helper components âââ

function ProgressBar({ value, max, color, height = 12, showLabel = true }) {
  const pct = Math.min(100, Math.max(0, ((value) / max) * 100));
  return (
    <div style={{ width: "100%" }}>
      <div style={{
        width: "100%", height, borderRadius: height, background: "rgba(255,255,255,0.08)",
        overflow: "hidden", position: "relative",
      }}>
        <div style={{
          width: `${pct}%`, height: "100%", borderRadius: height,
          background: `linear-gradient(90deg, ${color}, ${color}cc)`,
          transition: "width 0.5s ease",
        }} />
      </div>
      {showLabel && (
        <div style={{ fontSize: 12, color: COLORS.muted, marginTop: 4, textAlign: "right" }}>
          {Math.round(pct)}%
        </div>
      )}
    </div>
  );
}

function Card({ children, style }) {
  return (
    <div style={{
      background: COLORS.card, borderRadius: 16, padding: 24,
      border: "1px solid rgba(255,255,255,0.06)",
      boxShadow: "0 4px 24px rgba(0,0,0,0.2)",
      ...style,
    }}>
      {children}
    </div>
  );
}

function SectionTitle({ children, emoji }) {
  return (
    <h2 style={{
      fontSize: 20, fontWeight: 700, color: COLORS.text, margin: "0 0 16px 0",
      display: "flex", alignItems: "center", gap: 8,
    }}>
      <span>{emoji}</span> {children}
    </h2>
  );
}

// âââ weather helpers âââ
const WMO_ICONS = {
  0: "âï¸", 1: "ð¤ï¸", 2: "â", 3: "âï¸",
  45: "ð«ï¸", 48: "ð«ï¸",
  51: "ð¦ï¸", 53: "ð¦ï¸", 55: "ð§ï¸",
  56: "ð¨ï¸", 57: "ð¨ï¸",
  61: "ð§ï¸", 63: "ð§ï¸", 65: "ð§ï¸",
  66: "ð¨ï¸", 67: "ð¨ï¸",
  71: "âï¸", 73: "âï¸", 75: "âï¸", 77: "âï¸",
  80: "ð¦ï¸", 81: "ð§ï¸", 82: "ð§ï¸",
  85: "ð¨ï¸", 86: "ð¨ï¸",
  95: "âï¸", 96: "âï¸", 99: "âï¸",
};
const WMO_DESC = {
  0: "Clear sky", 1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast",
  45: "Fog", 48: "Freezing fog",
  51: "Light drizzle", 53: "Drizzle", 55: "Heavy drizzle",
  56: "Freezing drizzle", 57: "Heavy freezing drizzle",
  61: "Light rain", 63: "Rain", 65: "Heavy rain",
  66: "Freezing rain", 67: "Heavy freezing rain",
  71: "Light snow", 73: "Snow", 75: "Heavy snow", 77: "Snow grains",
  80: "Light showers", 81: "Showers", 82: "Heavy showers",
  85: "Light snow showers", 86: "Heavy snow showers",
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
  const [editingWeight, setEditingWeight] = useState(false);
  const [tempWeight, setTempWeight] = useState("");

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
      const pct = total > 0 ? Math.round((count / total) * 100) : 0;
      return {
        name: c.charAt(0).toUpperCase() + c.slice(1),
        value: count,
        pct,
      };
    });
  }, [tasks]);

  // ââ weight helpers ââ
  const weightLost = weight.start - weight.current;
  const weightToGo = weight.current - weight.goal;
  const weightTotalToLose = weight.start - weight.goal;
  const weightPct = Math.round((weightLost / weightTotalToLose) * 100);

  // ââ handlers ââ
  const toggleTask = (id) => setTasks((prev) => prev.map((t) => t.id === id ? { ...t, done: !t.done } : t));
  const deleteTask = (id) => setTasks((prev) => prev.filter((t) => t.id !== id));
  const addTask = () => {
    if (!newTask.trim()) return;
    setTasks((prev) => [...prev, { id: Date.now(), category: newTaskCat, text: newTask.trim(), done: false }]);
    setNewTask("");
  };

  const updateGoalCurrent = (id, val) => {
    setFitnessGoals((prev) => prev.map((g) => g.id === id ? { ...g, current: Math.max(0, Number(val) || 0) } : g));
  };

  const toggleFitnessToday = (id) => {
    setFitnessGoals((prev) => prev.map((g) => g.id === id ? { ...g, doneToday: !g.doneToday } : g));
  };

  const updateCurrentWeight = () => {
    const w = Number(tempWeight);
    if (w > 0 && w <= weight.start) {
      setWeight((prev) => ({ ...prev, current: w }));
    }
    setEditingWeight(false);
    setTempWeight("");
  };

  // ââ body comp state (editable) ââ
  const [bodyFat, setBodyFat] = useState({ current: 28, start: 35, goal: 15, unit: "%" });
  const [fatMass, setFatMass] = useState({ start: 97, current: 69, goal: 30, unit: "lbs" });
  const [muscle, setMuscle] = useState({ current: 155, start: 140, unit: "lbs" });
  const [editingSummary, setEditingSummary] = useState(null);
  const [tempSummaryVal, setTempSummaryVal] = useState("");

  const [activeTab, setActiveTab] = useState("all");
  const [weather, setWeather] = useState(null);
  const [weatherError, setWeatherError] = useState(false);

  const [sheetsLoaded, setSheetsLoaded] = useState(false);

  // ââ Load from Google Sheets on mount ââ
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
    // Kingston upon Thames: 51.4123, -0.3007
    fetch("https://api.open-meteo.com/v1/forecast?latitude=51.4123&longitude=-0.3007&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m,relative_humidity_2m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=Europe/London&forecast_days=7")
      .then((r) => r.json())
      .then((data) => setWeather(data))
      .catch(() => setWeatherError(true));
  }, []);

  // ââ live clock ââ
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const worldClocks = [
    { city: "London", flag: "ð¬ð§", tz: "Europe/London" },
    { city: "New York", flag: "ðºð¸", tz: "America/New_York" },
    { city: "India", flag: "ð®ð³", tz: "Asia/Kolkata" },
    { city: "Philippines", flag: "ðµð­", tz: "Asia/Manila" },
  ];

  const catEmoji = { work: "ð¼", diet: "ð¥", family: "ð¨âð©âð§âð¦", personal: "ð" };
  const catLabel = { work: "Work", diet: "Diet", family: "Family", personal: "Personal" };

  return (
    <div style={{
      minHeight: "100vh", background: COLORS.bg, color: COLORS.text,
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      padding: "32px 24px",
    }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <h1 style={{
            fontSize: 36, fontWeight: 800, margin: 0,
            background: "linear-gradient(135deg, #38BDF8, #818CF8, #C084FC)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>
            James's Life Dashboard
          </h1>
          <p style={{ color: COLORS.muted, marginTop: 8, fontSize: 16 }}>
            Track your progress. Crush your goals. One day at a time.
          </p>
          {isConfigured() && sheetsLoaded && (
            <p style={{ color: COLORS.success, marginTop: 4, fontSize: 12 }}>Connected to Google Sheets</p>
          )}
          {!isConfigured() && (
            <div style={{
              marginTop: 12, padding: "10px 20px", background: "rgba(249,115,22,0.1)",
              borderRadius: 10, border: "1px solid rgba(249,115,22,0.2)", display: "inline-block",
            }}>
              <span style={{ fontSize: 13, color: "#F97316" }}>
                Using default data â update SHEET_ID in src/sheets.js to connect your Google Sheet
              </span>
            </div>
          )}
        </div>

        {/* âââ TAB NAVIGATION âââ */}
        <div style={{
          display: "flex", justifyContent: "center", gap: 8, marginBottom: 28,
          background: COLORS.card, borderRadius: 14, padding: 6,
          border: "1px solid rgba(255,255,255,0.06)", maxWidth: 500, margin: "0 auto 28px auto",
        }}>
          {[
            { id: "all", label: "All", icon: "ð" },
            { id: "tasks", label: "Tasks", icon: "â" },
            { id: "health", label: "Health", icon: "ðª" },
            { id: "money", label: "Money", icon: "ð°" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1, padding: "10px 16px", borderRadius: 10, border: "none",
                background: activeTab === tab.id
                  ? "linear-gradient(135deg, #38BDF8, #818CF8)"
                  : "transparent",
                color: activeTab === tab.id ? "#fff" : COLORS.muted,
                fontSize: 14, fontWeight: activeTab === tab.id ? 700 : 500,
                cursor: "pointer", transition: "all 0.2s",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              }}
            >
              <span>{tab.icon}</span> {tab.label}
            </button>
          ))}
        </div>

        {/* âââ WORLD CLOCK âââ */}
        {(activeTab === "all") && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
            {worldClocks.map((clock) => {
              const timeStr = now.toLocaleString("en-GB", {
                timeZone: clock.tz, hour: "numeric", minute: "2-digit", hour12: true,
              });
              const dateStr = now.toLocaleString("en-GB", {
                timeZone: clock.tz, weekday: "short", day: "numeric", month: "short",
              });
              // Determine if it's daytime (6am-8pm) in that timezone
              const hour = parseInt(now.toLocaleString("en-GB", { timeZone: clock.tz, hour: "numeric", hour12: false }));
              const isDaytime = hour >= 6 && hour < 20;
              return (
                <div key={clock.tz} style={{
                  background: COLORS.card, borderRadius: 14, padding: "16px 14px", textAlign: "center",
                  border: "1px solid rgba(255,255,255,0.06)", boxShadow: "0 2px 12px rgba(0,0,0,0.15)",
                }}>
                  <div style={{ fontSize: 11, color: COLORS.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>
                    {clock.flag} {clock.city}
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: COLORS.text, letterSpacing: 0.5 }}>
                    {timeStr.replace(/ /g, "").toUpperCase()}
                  </div>
                  <div style={{ fontSize: 11, color: COLORS.muted, marginTop: 2 }}>
                    {dateStr} {isDaytime ? "âï¸" : "ð"}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* âââ WEATHER WIDGET âââ */}
        {(activeTab === "all") && weather && weather.current && (
          <Card style={{ marginBottom: 24 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
              {/* Current weather */}
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <span style={{ fontSize: 48 }}>{WMO_ICONS[weather.current.weather_code] || "ð¤ï¸"}</span>
                <div>
                  <div style={{ fontSize: 11, color: COLORS.muted, textTransform: "uppercase", letterSpacing: 1 }}>Kingston upon Thames</div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                    <span style={{ fontSize: 36, fontWeight: 800, color: COLORS.text }}>{Math.round(weather.current.temperature_2m)}Â°C</span>
                    <span style={{ fontSize: 14, color: COLORS.muted }}>Feels {Math.round(weather.current.apparent_temperature)}Â°C</span>
                  </div>
                  <div style={{ fontSize: 13, color: COLORS.muted }}>
                    {WMO_DESC[weather.current.weather_code] || "Unknown"} Â· ð¨ {Math.round(weather.current.wind_speed_10m)} km/h Â· ð§ {weather.current.relative_humidity_2m}%
                  </div>
                </div>
              </div>

              {/* 7-day forecast */}
              <div style={{ display: "flex", gap: 8 }}>
                {weather.daily && weather.daily.time.map((date, i) => {
                  const day = new Date(date);
                  const dayName = i === 0 ? "Today" : day.toLocaleDateString("en-GB", { weekday: "short" });
                  return (
                    <div key={date} style={{
                      textAlign: "center", padding: "8px 10px", borderRadius: 10,
                      background: i === 0 ? "rgba(56,189,248,0.1)" : COLORS.cardAlt,
                      border: i === 0 ? "1px solid rgba(56,189,248,0.2)" : "1px solid rgba(255,255,255,0.04)",
                      minWidth: 64,
                    }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: i === 0 ? COLORS.accent : COLORS.muted, marginBottom: 4 }}>{dayName}</div>
                      <div style={{ fontSize: 24 }}>{WMO_ICONS[weather.daily.weather_code[i]] || "ð¤ï¸"}</div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.text, marginTop: 4 }}>
                        {Math.round(weather.daily.temperature_2m_max[i])}Â°
                      </div>
                      <div style={{ fontSize: 11, color: COLORS.muted }}>
                        {Math.round(weather.daily.temperature_2m_min[i])}Â°
                      </div>
                      {weather.daily.precipitation_probability_max[i] > 0 && (
                        <div style={{ fontSize: 10, color: COLORS.accent, marginTop: 2 }}>
                          ð§ {weather.daily.precipitation_probability_max[i]}%
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>
        )}
        {(activeTab === "all") && !weather && !weatherError && (
          <Card style={{ marginBottom: 24, textAlign: "center" }}>
            <span style={{ color: COLORS.muted, fontSize: 14 }}>ð¤ï¸ Loading weather...</span>
          </Card>
        )}
        {(activeTab === "all") && weatherError && (
          <Card style={{ marginBottom: 24, textAlign: "center" }}>
            <span style={{ color: COLORS.muted, fontSize: 14 }}>ð¤ï¸ Weather unavailable â check your connection</span>
          </Card>
        )}

        {/* âââ SUMMARY BOXES âââ */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 16, marginBottom: 24 }}>
          {/* Sober Days */}
          {(() => {
            const soberDate = new Date(2025, 10, 5); // Nov 5, 2025
            const today = new Date();
            const diffMs = today - soberDate;
            const soberDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
            const soberMonths = Math.floor(soberDays / 30);
            return (
              <div style={{
                background: "linear-gradient(135deg, #1E293B, #0D3320)", borderRadius: 14, padding: "18px 16px", textAlign: "center",
                border: "1px solid rgba(34,197,94,0.3)", boxShadow: "0 2px 12px rgba(34,197,94,0.1)",
              }}>
                <div style={{ fontSize: 11, color: COLORS.success, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Sober Days</div>
                <div style={{ fontSize: 30, fontWeight: 800, color: COLORS.success }}>{soberDays}</div>
                <div style={{ fontSize: 12, color: COLORS.success }}>~{soberMonths} months ð</div>
              </div>
            );
          })()}

          {/* Current Weight */}
          <div style={{
            background: COLORS.card, borderRadius: 14, padding: "18px 16px", textAlign: "center",
            border: "1px solid rgba(255,255,255,0.06)", boxShadow: "0 2px 12px rgba(0,0,0,0.15)",
          }}>
            <div style={{ fontSize: 11, color: COLORS.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Current Weight</div>
            <div style={{ fontSize: 30, fontWeight: 800, color: COLORS.accent }}>{weight.current}</div>
            <div style={{ fontSize: 12, color: COLORS.muted }}>{weight.unit}</div>
          </div>

          {/* Weight Lost */}
          <div style={{
            background: COLORS.card, borderRadius: 14, padding: "18px 16px", textAlign: "center",
            border: "1px solid rgba(34,197,94,0.15)", boxShadow: "0 2px 12px rgba(0,0,0,0.15)",
          }}>
            <div style={{ fontSize: 11, color: COLORS.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Weight Lost</div>
            <div style={{ fontSize: 30, fontWeight: 800, color: COLORS.success }}>-{weightLost}</div>
            <div style={{ fontSize: 12, color: COLORS.success }}>{weight.unit} lost</div>
          </div>

          {/* Fat Lost */}
          <div style={{
            background: COLORS.card, borderRadius: 14, padding: "18px 16px", textAlign: "center",
            border: "1px solid rgba(249,115,22,0.15)", boxShadow: "0 2px 12px rgba(0,0,0,0.15)",
          }}>
            <div style={{ fontSize: 11, color: COLORS.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Body Fat</div>
            <div style={{ fontSize: 30, fontWeight: 800, color: "#F97316" }}>
              {editingSummary === "fat" ? (
                <input
                  type="number"
                  value={tempSummaryVal}
                  onChange={(e) => setTempSummaryVal(e.target.value)}
                  onBlur={() => { setBodyFat((p) => ({ ...p, current: Number(tempSummaryVal) || p.current })); setEditingSummary(null); }}
                  onKeyDown={(e) => { if (e.key === "Enter") { setBodyFat((p) => ({ ...p, current: Number(tempSummaryVal) || p.current })); setEditingSummary(null); } }}
                  autoFocus
                  style={{ width: 60, background: COLORS.cardAlt, border: `1px solid #F97316`, borderRadius: 8, color: COLORS.text, fontSize: 26, textAlign: "center", padding: "2px", fontWeight: 800 }}
                />
              ) : (
                <span
                  onClick={() => { setEditingSummary("fat"); setTempSummaryVal(String(bodyFat.current)); }}
                  style={{ cursor: "pointer", borderBottom: "2px dashed rgba(255,255,255,0.15)" }}
                  title="Click to update"
                >
                  {bodyFat.current}{bodyFat.unit}
                </span>
              )}
            </div>
            <div style={{ fontSize: 12, color: COLORS.muted }}>down from {bodyFat.start}%</div>
          </div>

          {/* Fat Mass */}
          <div style={{
            background: COLORS.card, borderRadius: 14, padding: "18px 16px", textAlign: "center",
            border: "1px solid rgba(255,255,255,0.06)", boxShadow: "0 2px 12px rgba(0,0,0,0.15)",
          }}>
            <div style={{ fontSize: 11, color: COLORS.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Fat Mass</div>
            <div style={{ fontSize: 30, fontWeight: 800, color: COLORS.accent }}>{fatMass.current}</div>
            <div style={{ fontSize: 12, color: COLORS.success }}>-{fatMass.start - fatMass.current} lbs</div>
          </div>

          {/* Muscle */}
          <div style={{
            background: COLORS.card, borderRadius: 14, padding: "18px 16px", textAlign: "center",
            border: "1px solid rgba(139,92,246,0.15)", boxShadow: "0 2px 12px rgba(0,0,0,0.15)",
          }}>
            <div style={{ fontSize: 11, color: COLORS.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Muscle</div>
            <div style={{ fontSize: 30, fontWeight: 800, color: "#8B5CF6" }}>{muditingSummary === "muscle" ? (
                <input
                  type="number"
                  value={tempSummaryVal}
                  onChange={(e) => setTempSummaryVal(e.target.value)}
                  onBlur={() => { setMuscle((p) => ({ ...p, current: Number(tempSummaryVal) || p.current })); setEditingSummary(null); }}
                  onKeyDown={(e) => { if (e.key === "Enter") { setMuscle((p) => ({ ...p, current: Number(tempSummaryVal) || p.current })); setEditingSummary(null); } }}
                  autoFocus
                  style={{ width: 60, background: COLORS.cardAlt, border: `1px solid #A855F7`, borderRadius: 8, color: COLORS.text, fontSize: 26, textAlign: "center", padding: "2px", fontWeight: 800 }}
                />
              ) : (
                <span
                  onClick={() => { setEditingSummary("muscle"); setTempSummaryVal(String(muscle.current)); }}
                  style={{ cursor: "pointer", borderBottom: "2px dashed rgba(255,255,255,0.15)" }}
                  title="Click to update"
                >
                  {muscle.current}
                </span>
              )}
            </div>
            <div style={{ fontSize: 12, color: "#A855F7" }}>+{muscle.current - muscle.start} {muscle.unit} gained</div>
          </div>

          {/* Tasks Done */}
          <div style={{
            background: COLORS.card, borderRadius: 14, padding: "18px 16px", textAlign: "center",
            border: "1px solid rgba(56,189,248,0.15)", boxShadow: "0 2px 12px rgba(0,0,0,0.15)",
          }}>
            <div style={{ fontSize: 11, color: COLORS.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Tasks Done</div>
            <div style={{ fontSize: 30, fontWeight: 800, color: COLORS.accent }}>{taskStats.all?.done || 0}/{taskStats.all?.total || 0}</div>
            <div style={{ fontSize: 12, color: COLORS.accent }}>{taskStats.all?.pct || 0}% complete</div>
          </div>
        </div>

        {/* âââ ROW 1: Weight + Fitness Goals (All + Health) âââ */}
        {(activeTab === "all" || activeTab === "health") && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24 }}>
          {/* Weight Loss Card */}
          <Card>
            <SectionTitle emoji="âï¸">Weight Loss Journey</SectionTitle>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 12, color: COLORS.muted, textTransform: "uppercase", letterSpacing: 1 }}>Started</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: COLORS.danger }}>{weight.start}</div>
                <div style={{ fontSize: 12, color: COLORS.muted }}>{weight.unit}</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 12, color: COLORS.muted, textTransform: "uppercase", letterSpacing: 1 }}>Current</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: COLORS.accent }}>
                  {editingWeight ? (
                    <input
                      type="number"
                      value={tempWeight}
                      onChange={(e) => setTempWeight(e.target.value)}
                      onBlur={updateCurrentWeight}
                      onKeyDown={(e) => e.key === "Enter" && updateCurrentWeight()}
                      autoFocus
                      style={{
                        width: 80, background: COLORS.cardAlt, border: `1px solid ${COLORS.accent}`,
                        borderRadius: 8, color: COLORS.text, fontSize: 24, textAlign: "center",
                        padding: "2px 4px", fontWeight: 800,
                      }}
                    />
                  ) : (
                    <span
                      onClick={() => { setEditingWeight(true); setTempWeight(String(weight.current)); }}
                      style={{ cursor: "pointer", borderBottom: "2px dashed rgba(255,255,255,0.2)" }}
                      title="Click to update"
                    >
                      {weight.current}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 12, color: COLORS.muted }}>{weight.unit}</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 12, color: COLORS.muted, textTransform: "uppercase", letterSpacing: 1 }}>Goal</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: COLORS.success }}>{weight.goal}</div>
                <div style={{ fontSize: 12, color: COLORS.muted }}>{weight.unit}</div>
              </div>
            </div>
            <ProgressBar value={weightLost} max={weightTotalToLose} color={COLORS.success} height={16} />
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 13 }}>
              <span style={{ color: COLORS.success }}>Lost: {weightLost} {weight.unit} ð</span>
              <span style={{ color: COLORS.muted }}>To go: {weightToGo} {weight.unit}</span>
            </div>
            <div style={{
              marginTop: 16, padding: "12px 16px", background: "rgba(34,197,94,0.1)",
              borderRadius: 10, border: "1px solid rgba(34,197,94,0.2)", textAlign: "center",
            }}>
              <span style={{ fontSize: 32, fontWeight: 800, color: COLORS.success }}>{weightPct}%</span>
              <span style={{ fontSize: 14, color: COLORS.muted, marginLeft: 8 }}>of the way there!</span>
            </div>

            {/* Body Fat Progress */}
            <div style={{ marginTop: 20, paddingTop: 20, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <span style={{ fontWeight: 700, fontSize: 16, color: COLORS.text }}>ð Body Fat %</span>
                <span style={{ fontSize: 13, color: COLORS.muted }}>
                  {editingSummary === "fatGoal" ? (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                      <span
                        onClick={() => { setEditingSummary("fatCurrent"); setTempSummaryVal(String(bodyFat.current)); }}
                        style={{ cursor: "pointer", borderBottom: "1px dashed rgba(255,255,255,0.3)", color: COLORS.accent, fontWeight: 700 }}
                      >{bodyFat.current}%</span>
                      {" â "}
                      <input
                        type="number"
                        value={tempSummaryVal}
                        onChange={(e) => setTempSummaryVal(e.target.value)}
                        onBlur={() => { setBodyFat((p) => ({ ...p, goal: Number(tempSummaryVal) || p.goal })); setEditingSummary(null); }}
                        onKeyDown={(e) => { if (e.key === "Enter") { setBodyFat((p) => ({ ...p, goal: Number(tempSummaryVal) || p.goal })); setEditingSummary(null); } }}
                        autoFocus
                        style={{ width: 45, background: COLORS.cardAlt, border: `1px solid #F97316`, borderRadius: 6, color: COLORS.text, fontSize: 13, textAlign: "center", padding: "2px" }}
                      />%
                    </span>
                  ) : editingSummary === "fatCurrent" ? (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                      <input
                        type="number"
                        value={tempSummaryVal}
                        onChange={(e) => setTempSummaryVal(e.target.value)}
                        onBlur={() => { setBodyFat((p) => ({ ...p, current: Number(tempSummaryVal) || p.current })); setEditingSummary(null); }}
                        onKeyDown={(e) => { if (e.key === "Enter") { setBodyFat((p) => ({ ...p, current: Number(tempSummaryVal) || p.current })); setEditingSummary(null); } }}
                        autoFocus
                        style={{ width: 45, background: COLORS.cardAlt, border: `1px solid ${COLORS.accent}`, borderRadius: 6, color: COLORS.text, fontSize: 13, textAlign: "center", padding: "2px" }}
                      />%
                      {" â "}
                      <span
                        onClick={() => { setEditingSummary("fatGoal"); setTempSummaryVal(String(bodyFat.goal || 15)); }}
                        style={{ cursor: "pointer", borderBottom: "1px dashed rgba(255,255,255,0.3)", color: COLORS.success }}
                      >{bodyFat.goal || 15}%</span>
                    </span>
                  ) : (
                    <span>
                      <span
                        onClick={() => { setEditingSummary("fatCurrent"); setTempSummaryVal(String(bodyFat.current)); }}
                        style={{ cursor: "pointer", borderBottom: "1px dashed rgba(255,255,255,0.3)", color: COLORS.accent, fontWeight: 700 }}
                        title="Click to update"
                      >{bodyFat.current}%</span>
                      {" â "}
                      <span
                        onClick={() => { setEditingSummary("fatGoal"); setTempSummaryVal(String(bodyFat.goal || 15)); }}
                        style={{ cursor: "pointer", borderBottom: "1px dashed rgba(255,255,255,0.3)", color: COLORS.success }}
                        title="Click to update goal"
                      >{bodyFat.goal || 15}%</span>
                    </span>
                  )}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 11, color: COLORS.muted, textTransform: "uppercase", letterSpacing: 1 }}>Started</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: COLORS.danger }}>{bodyFat.start}%</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 11, color: COLORS.muted, textTransform: "uppercase", letterSpacing: 1 }}>Current</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: "#F97316" }}>{bodyFat.current}%</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 11, color: COLORS.muted, textTransform: "uppercase", letterSpacing: 1 }}>Goal</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: COLORS.success }}>{bodyFat.goal || 15}%</div>
                </div>
              </div>
              {(() => {
                const fatLost = bodyFat.start - bodyFat.current;
                const fatTotal = bodyFat.start - (bodyFat.goal || 15);
                const fatPct = fatTotal > 0 ? Math.round((fatLost / fatTotal) * 100) : 0;
                return (
                  <>
                    <ProgressBar value={Math.max(0, fatLost)} max={Math.max(1, fatTotal)} color="#F97316" height={12} />
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, fontSize: 12 }}>
                      <span style={{ color: "#F97316" }}>Dropped: {fatLost}% ð¥</span>
                      <span style={{ color: COLORS.muted }}>To go: {bodyFat.current - (bodyFat.goal || 15)}%</span>
                    </div>
                    <div style={{
                      marginTop: 10, padding: "8px 12px", background: "rgba(249,115,22,0.1)",
                      borderRadius: 8, border: "1px solid rgba(249,115,22,0.2)", textAlign: "center",
                    }}>
                      <span style={{ fontSize: 24, fontWeight: 800, color: "#F97316" }}>{fatPct}%</span>
                      <span style={{ fontSize: 13, color: COLORS.muted, marginLeft: 6 }}>of fat loss goal</span>
                    </div>
                  </>
                );
              })()}
            </div>

            {/* Fat Loss (lbs) */}
            <div style={{ marginTop: 20, paddingTop: 20, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <span style={{ fontWeight: 700, fontSize: 16, color: COLORS.text }}>ð¥ Fat Loss (lbs)</span>
                <span style={{ fontSize: 13, color: COLORS.muted }}>
                  <span
                    onClick={() => { setEditingSummary("fatMassCurrent"); setTempSummaryVal(String(fatMass.current)); }}
                    style={{ cursor: "pointer", borderBottom: "1px dashed rgba(255,255,255,0.3)", color: COLORS.accent, fontWeight: 700 }}
                    title="Click to update"
                  >
                    {editingSummary === "fatMassCurrent" ? (
                      <input
                        type="number"
                        value={tempSummaryVal}
                        onChange={(e) => setTempSummaryVal(e.target.value)}
                        onBlur={() => { setFatMass((p) => ({ ...p, current: Number(tempSummaryVal) || p.current })); setEditingSummary(null); }}
                        onKeyDown={(e) => { if (e.key === "Enter") { setFatMass((p) => ({ ...p, current: Number(tempSummaryVal) || p.current })); setEditingSummary(null); } }}
                        autoFocus
                        style={{ width: 45, background: COLORS.cardAlt, border: `1px solid ${COLORS.accent}`, borderRadius: 6, color: COLORS.text, fontSize: 13, textAlign: "center", padding: "2px" }}
                      />
                    ) : fatMass.current}
                  </span>
                  {" â "}
                  <span
                    onClick={() => { setEditingSummary("fatMassGoal"); setTempSummaryVal(String(fatMass.goal)); }}
                    style={{ cursor: "pointer", borderBottom: "1px dashed rgba(255,255,255,0.3)", color: COLORS.success }}
                    title="Click to update goal"
                  >
                    {editingSummary === "fatMassGoal" ? (
                      <input
                        type="number"
                        value={tempSummaryVal}
                        onChange={(e) => setTempSummaryVal(e.target.value)}
                        onBlur={() => { setFatMass((p) => ({ ...p, goal: Number(tempSummaryVal) || p.goal })); setEditingSummary(null); }}
                        onKeyDown={(e) => { if (e.key === "Enter") { setFatMass((p) => ({ ...p, goal: Number(tempSummaryVal) || p.goal })); setEditingSummary(null); } }}
                        autoFocus
                        style={{ width: 45, background: COLORS.cardAlt, border: `1px solid ${COLORS.success}`, borderRadius: 6, color: COLORS.text, fontSize: 13, textAlign: "center", padding: "2px" }}
                      />
                    ) : fatMass.goal}
                  </span> lbs
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 11, color: COLORS.muted, textTransform: "uppercase", letterSpacing: 1 }}>Started</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: COLORS.danger }}>{fatMass.start}</div>
                  <div style={{ fontSize: 11, color: COLORS.muted }}>lbs</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 11, color: COLORS.muted, textTransform: "uppercase", letterSpacing: 1 }}>Current</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: "#EF4444" }}>{fatMass.current}</div>
                  <div style={{ fontSize: 11, color: COLORS.muted }}>lbs</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 11, color: COLORS.muted, textTransform: "uppercase", letterSpacing: 1 }}>Goal</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: COLORS.success }}>{fatMass.goal}</div>
                  <div style={{ fontSize: 11, color: COLORS.muted }}>lbs</div>
                </div>
              </div>
              {(() => {
                const fatLbs = fatMass.start - fatMass.current;
                const fatLbsTotal = fatMass.start - fatMass.goal;
                const fatLbsPct = fatLbsTotal > 0 ? Math.round((fatLbs / fatLbsTotal) * 100) : 0;
                return (
                  <>
                    <ProgressBar value={Math.max(0, fatLbs)} max={Math.max(1, fatLbsTotal)} color="#EF4444" height={12} />
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, fontSize: 12 }}>
                      <span style={{ color: COLORS.success }}>Lost: {fatLbs} lbs ðª</span>
                      <span style={{ color: COLORS.muted }}>To go: {fatMass.current - fatMass.goal} lbs</span>
                    </div>
                    <div style={{
                      marginTop: 10, padding: "8px 12px", background: "rgba(239,68,68,0.1)",
                      borderRadius: 8, border: "1px solid rgba(239,68,68,0.2)", textAlign: "center",
                    }}>
                      <span style={{ fontSize: 24, fontWeight: 800, color: "#EF4444" }}>{fatLbsPct}%</span>
                      <span style={{ fontSize: 13, color: COLORS.muted, marginLeft: 6 }}>of fat burned</span>
                    </div>
                  </>
                );
              })()}
            </div>
          </Card>

          {/* Fitness Goals Card */}
          <Card>
            <SectionTitle emoji="ðï¸">Fitness Goals</SectionTitle>
            <p style={{ fontSize: 12, color: COLORS.muted, margin: "-8px 0 14px 0" }}>
              Pick one to smash today â tick it off, then update your progress
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {fitnessGoals.map((goal) => {
                const pct = goal.goal > 0 ? Math.round((goal.current / goal.goal) * 100) : 0;
                return (
                  <div key={goal.id} style={{
                    padding: "14px 16px", borderRadius: 12,
                    background: goal.doneToday ? "rgba(34,197,94,0.1)" : COLORS.cardAlt,
                    border: goal.doneToday ? "1px solid rgba(34,197,94,0.25)" : "1px solid rgba(255,255,255,0.04)",
                    transition: "all 0.2s",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                      {/* Today's checkbox */}
                      <div
                        onClick={() => toggleFitnessToday(goal.id)}
                        style={{
                          width: 26, height: 26, borderRadius: 8, flexShrink: 0,
                          border: goal.doneToday ? "none" : "2px solid rgba(255,255,255,0.2)",
                          background: goal.doneToday ? COLORS.success : "transparent",
                          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 14, color: "#fff", transition: "all 0.2s",
                        }}
                      >
                        {goal.doneToday && "â"}
                      </div>
                      <span style={{ fontWeight: 700, fontSize: 16, flex: 1, color: goal.doneToday ? COLORS.success : COLORS.text }}>
                        {goal.icon} {goal.name}
                      </span>
                      <span style={{
                        fontSize: 11, color: goal.doneToday ? COLORS.success : COLORS.muted,
                        fontWeight: 600, textTransform: "uppercase", letterSpacing: 1,
                      }}>
                        {goal.doneToday ? "Done today!" : "Today?"}
                      </span>
                    </div>
                    {/* Progress towards overall goal */}
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ flex: 1 }}>
                        <ProgressBar value={goal.current} max={goal.goal} color={goal.doneToday ? COLORS.success : COLORS.accent} height={8} showLabel={false} />
                      </div>
                      <span style={{ fontSize: 12, color: COLORS.muted, minWidth: 90, textAlign: "right" }}>
                        {editingGoal === goal.id ? (
                          <input
                            type="number"
                            defaultValue={goal.current}
                            onBlur={(e) => { updateGoalCurrent(goal.id, e.target.value); setEditingGoal(null); }}
                            onKeyDown={(e) => { if (e.key === "Enter") { updateGoalCurrent(goal.id, e.target.value); setEditingGoal(null); } }}
                            autoFocus
                            style={{
                              width: 45, background: COLORS.cardAlt, border: `1px solid ${COLORS.accent}`,
                              borderRadius: 6, color: COLORS.text, fontSize: 12, textAlign: "center", padding: "2px",
                            }}
                          />
                        ) : (
                          <span
                            onClick={() => setEditingGoal(goal.id)}
                            style={{ cursor: "pointer", borderBottom: "1px dashed rgba(255,255,255,0.3)" }}
                            title="Click to update"
                          >
                            {goal.current}
                          </span>
                        )} / {goal.goal} {goal.unit}
                      </span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: COLORS.muted, marginTop: 4 }}>
                      <span>Started: {goal.start} {goal.unit}</span>
                      <span>{pct}% to goal</span>
                    </div>
                  </div>
                );
              })}
            </div>
            {/* Daily summary */}
            <div style={{
              marginTop: 14, padding: "10px 14px",
              background: fitnessGoals.some((g) => g.doneToday) ? "rgba(34,197,94,0.1)" : "rgba(255,255,255,0.03)",
              borderRadius: 10, border: fitnessGoals.some((g) => g.doneToday) ? "1px solid rgba(34,197,94,0.2)" : "1px solid rgba(255,255,255,0.06)",
              textAlign: "center",
            }}>
              {fitnessGoals.some((g) => g.doneToday) ? (
                <span style={{ fontSize: 14, color: COLORS.success, fontWeight: 600 }}>
                  ð¥ {fitnessGoals.filter((g) => g.doneToday).map((g) => g.name).join(" + ")} done today!
                </span>
              ) : (
                <span style={{ fontSize: 14, color: COLORS.muted }}>
                  Pick an activity for today âï¸
                </span>
              )}
            </div>
          </Card>
        </div>

        )}

        {/* âââ ROW 2: Add task bar + Task Lists (All + Tasks) âââ */}
        {(activeTab === "all" || activeTab === "tasks") && (<>
        <Card style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <select
              value={newTaskCat}
              onChange={(e) => setNewTaskCat(e.target.value)}
              style={{
                background: COLORS.cardAlt, color: COLORS.text, border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 8, padding: "10px 14px", fontSize: 14, cursor: "pointer",
              }}
            >
              {["work", "diet", "family", "personal"].map((c) => (
                <option key={c} value={c}>{catEmoji[c]} {catLabel[c]}</option>
              ))}
            </select>
            <input
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addTask()}
              placeholder="Add a new task..."
              style={{
                flex: 1, minWidth: 200, background: COLORS.cardAlt, color: COLORS.text,
                border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8,
                padding: "10px 14px", fontSize: 14,
              }}
            />
            <button
              onClick={addTask}
              style={{
                background: `linear-gradient(135deg, ${COLORS.accent}, #818CF8)`,
                color: "#fff", border: "none", borderRadius: 8,
                padding: "10px 24px", fontSize: 14, fontWeight: 600,
                cursor: "pointer",
              }}
            >
              + Add
            </button>
          </div>
        </Card>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24 }}>
          {["work", "diet", "family", "personal"].map((cat) => {
            const catTasks = [...tasks.filter((t) => t.category === cat)].sort((a, b) => a.done === b.done ? 0 : a.done ? 1 : -1);
            return (
              <Card key={cat} style={{ borderTop: `3px solid ${COLORS[cat] || COLORS.accent}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <SectionTitle emoji={catEmoji[cat]}>{catLabel[cat]} Tasks</SectionTitle>
                  <span style={{
                    background: COLORS.cardAlt, borderRadius: 20,
                    padding: "4px 12px", fontSize: 12, color: COLORS.muted,
                  }}>
                    {taskStats[cat]?.done}/{taskStats[cat]?.total}
                  </span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {catTasks.length === 0 && (
                    <div style={{ color: COLORS.muted, fontSize: 13, fontStyle: "italic", textAlign: "center", padding: 16 }}>
                      No tasks yet â add one above!
                    </div>
                  )}
                  {catTasks.map((task) => (
                    <div
                      key={task.id}
                      style={{
                        display: "flex", alignItems: "center", gap: 10,
                        padding: "10px 12px", borderRadius: 10,
                        background: task.done ? "rgba(34,197,94,0.08)" : COLORS.cardAlt,
                        border: task.done ? "1px solid rgba(34,197,94,0.15)" : "1px solid rgba(255,255,255,0.04)",
                        transition: "all 0.2s",
                      }}
                    >
                      <div
                        onClick={() => toggleTask(task.id)}
                        style={{
                          width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                          border: task.done ? "none" : "2px solid rgba(255,255,255,0.2)",
                          background: task.done ? COLORS.success : "transparent",
                          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 13, color: "#fff", transition: "all 0.2s",
                        }}
                      >
                        {task.done && "â"}
                      </div>
                      <span style={{
                        flex: 1, fontSize: 14,
                        textDecoration: task.done ? "line-through" : "none",
                        color: task.done ? COLORS.muted : COLORS.text,
                      }}>
                        {task.text}
                      </span>
                      <button
                        onClick={() => deleteTask(task.id)}
                        style={{
                          background: "none", border: "none", color: "rgba(255,255,255,0.2)",
                          cursor: "pointer", fontSize: 16, padding: "0 4px",
                          transition: "color 0.2s",
                        }}
                        onMouseEnter={(e) => e.target.style.color = COLORS.danger}
                        onMouseLeave={(e) => e.target.style.color = "rgba(255,255,255,0.2)"}
                        title="Delete task"
                      >
                        Ã
                      </button>
                    </div>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>

        {/* âââ ROW 3: Radar + Pie Chart + Stats (All + Tasks) âââ */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 24, marginBottom: 24 }}>
          {/* Attention Radar */}
          <Card>
            <SectionTitle emoji="ð§­">Focus Radar</SectionTitle>
            <p style={{ fontSize: 12, color: COLORS.muted, margin: "0 0 12px 0" }}>
              Higher = more attention needed (more incomplete tasks)
            </p>
            {(() => {
              const radarData = ["work", "diet", "family", "personal"].map((cat) => {
                const s = taskStats[cat] || { total: 0, done: 0 };
                const incomplete = s.total - s.done;
                return {
                  category: catLabel[cat],
                  attention: incomplete,
                  fullMark: Math.max(taskStats.all?.total || 1, 1),
                };
              });
              // Find highest attention area
              const maxAttention = radarData.reduce((a, b) => a.attention > b.attention ? a : b, radarData[0]);
              return (
                <>
                  <div style={{ height: 250 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                        <PolarGrid stroke="rgba(255,255,255,0.1)" />
                        <PolarAngleAxis
                          dataKey="category"
                          tick={{ fill: COLORS.text, fontSize: 12, fontWeight: 600 }}
                        />
                        <PolarRadiusAxis
                          angle={90}
                          domain={[0, "auto"]}
                          tick={{ fill: COLORS.muted, fontSize: 10 }}
                          axisLine={false}
                        />
                        <Radar
                          name="Attention Needed"
                          dataKey="attention"
                          stroke={COLORS.accent}
                          fill={COLORS.accent}
                          fillOpacity={0.25}
                          strokeWidth={2}
                        />
                        <Tooltip
                          contentStyle={{ background: COLORS.card, border: "none", borderRadius: 8, color: COLORS.text }}
                          formatter={(value) => [`${value} incomplete tasks`, "Attention"]}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                  <div style={{
                    marginTop: 8, padding: "10px 14px", background: "rgba(56,189,248,0.1)",
                    borderRadius: 10, border: "1px solid rgba(56,189,248,0.2)", textAlign: "center",
                  }}>
                    <span style={{ fontSize: 13, color: COLORS.muted }}>Top priority: </span>
                    <span style={{ fontSize: 16, fontWeight: 800, color: COLORS.accent }}>{maxAttention.category}</span>
                    <span style={{ fontSize: 13, color: COLORS.muted }}> ({maxAttention.attention} tasks remaining)</span>
                  </div>
                </>
              );
            })()}
          </Card>

          {/* Pie Chart with Percentages */}
          <Card>
            <SectionTitle emoji="ð">Task Distribution</SectionTitle>
            <div style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={4}
                    dataKey="value"
                    stroke="none"
                    label={({ name, pct, cx, cy, midAngle, outerRadius: or }) => {
                      const RADIAN = Math.PI / 180;
                      const radius = or + 25;
                      const x = cx + radius * Math.cos(-midAngle * RADIAN);
                      const y = cy + radius * Math.sin(-midAngle * RADIAN);
                      return (
                        <text x={x} y={y} fill={COLORS.text} textAnchor={x > cx ? "start" : "end"} dominantBaseline="central" fontSize={13} fontWeight={600}>
                          {name} {pct}%
                        </text>
                      );
                    }}
                  >
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: COLORS.card, border: "none", borderRadius: 8, color: COLORS.text }}
                    formatter={(value, name) => {
                      const entry = pieData.find((d) => d.name === name);
                      return [`${value} tasks (${entry?.pct || 0}%)`, name];
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Category Stats */}
          <Card>
            <SectionTitle emoji="ð">Completion Stats</SectionTitle>
            <div style={{
              display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16,
            }}>
              {["work", "diet", "family", "personal"].map((cat) => (
                <div key={cat} style={{
                  background: COLORS.cardAlt, borderRadius: 12, padding: 16, textAlign: "center",
                  border: `2px solid ${COLORS[cat] || COLORS.accent}22`,
                }}>
                  <div style={{ fontSize: 24 }}>{catEmoji[cat]}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.text, marginTop: 4 }}>{catLabel[cat]}</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: COLORS[cat] || COLORS.accent, marginTop: 4 }}>
                    {taskStats[cat]?.pct || 0}%
                  </div>
                  <div style={{ fontSize: 11, color: COLORS.muted }}>
                    {taskStats[cat]?.done || 0} / {taskStats[cat]?.total || 0} done
                  </div>
                </div>
              ))}
            </div>
            <div style={{
              padding: "12px 16px", background: "rgba(56,189,248,0.1)",
              borderRadius: 10, border: "1px solid rgba(56,189,248,0.2)", textAlign: "center",
            }}>
              <span style={{ fontSize: 14, color: COLORS.muted }}>Overall: </span>
              <span style={{ fontSize: 24, fontWeight: 800, color: COLORS.accent }}>{taskStats.all?.pct || 0}%</span>
              <span style={{ fontSize: 14, color: COLORS.muted }}> complete ({taskStats.all?.done}/{taskStats.all?.total} tasks)</span>
            </div>
          </Card>
        </div>
        </>)}

        {/* âââ FINANCES: Debt Tracker (All + Money) âââ */}
        {(activeTab === "all" || activeTab === "money") && (
        <Card style={{ marginTop: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
            <SectionTitle emoji="ð°">Finances â Debt Tracker</SectionTitle>
            {(() => {
              const totalUsed = debts.reduce((s, d) => s + d.used, 0);
              const totalLimit = debts.reduce((s, d) => s + d.limit, 0);
              return (
                <span style={{ fontSize: 13, color: COLORS.muted }}>
                  Total: <span style={{ fontWeight: 800, color: totalUsed > 0 ? COLORS.danger : COLORS.success }}>Â£{totalUsed.toLocaleString()}</span>
                  <span style={{ color: COLORS.muted }}> / Â£{totalLimit.toLocaleString()}</span>
                </span>
              );
            })()}
          </div>
          <p style={{ fontSize: 12, color: COLORS.muted, margin: "-8px 0 16px 0" }}>
            Click any balance to update it â goal is Â£0 across the board
          </p>

          {/* Overall debt progress */}
          {(() => {
            const totalUsed = debts.reduce((s, d) => s + d.used, 0);
            const totalStarted = debts.reduce((s, d) => s + d.limit, 0);
            const paidOff = totalStarted - totalUsed;
            const paidPct = totalStarted > 0 ? Math.round((paidOff / totalStarted) * 100) : 0;
            return (
              <div style={{ marginBottom: 20, padding: "14px 18px", background: COLORS.cardAlt, borderRadius: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: COLORS.text }}>Overall Debt Freedom</span>
                  <span style={{ fontSize: 14, fontWeight: 800, color: totalUsed === 0 ? COLORS.success : COLORS.accent }}>{paidPct}%</span>
                </div>
                <ProgressBar value={paidOff} max={totalStarted} color={COLORS.success} height={10} showLabel={false} />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginTop: 6 }}>
                  <span style={{ color: COLORS.success }}>Available: Â£{(totalStarted - totalUsed).toLocaleString()}</span>
                  <span style={{ color: COLORS.danger }}>Owed: Â£{totalUsed.toLocaleString()}</span>
                </div>
              </div>
            );
          })()}

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[...debts].sort((a, b) => b.used - a.used).map((debt) => {
              const usedPct = debt.limit > 0 ? Math.round((debt.used / debt.limit) * 100) : 0;
              const available = debt.limit - debt.used;
              const severity = usedPct >= 90 ? COLORS.danger : usedPct >= 70 ? "#F97316" : usedPct >= 40 ? COLORS.accent : COLORS.success;
              return (
                <div key={debt.id} style={{
                  padding: "14px 16px", borderRadius: 12,
                  background: debt.used === 0 ? "rgba(34,197,94,0.08)" : COLORS.cardAlt,
                  border: debt.used === 0 ? "1px solid rgba(34,197,94,0.2)" : `1px solid ${severity}22`,
                  transition: "all 0.2s",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <span style={{ fontWeight: 700, fontSize: 15, color: debt.used === 0 ? COLORS.success : COLORS.text }}>
                      {debt.icon} {debt.name}
                    </span>
                    <span style={{
                      fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1,
                      color: debt.used === 0 ? COLORS.success : severity,
                    }}>
                      {debt.used === 0 ? "Clear!" : usedPct >= 90 ? "Critical" : usedPct >= 70 ? "High" : usedPct >= 40 ? "Moderate" : "Low"}
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <ProgressBar value={debt.used} max={debt.limit} color={severity} height={8} showLabel={false} />
                    </div>
                    <span style={{ fontSize: 13, color: COLORS.muted, minWidth: 160, textAlign: "right" }}>
                      Â£{editingDebt === debt.id ? (
                        <input
                          type="number"
                          value={tempDebtVal}
                          onChange={(e) => setTempDebtVal(e.target.value)}
                          onBlur={() => { setDebts((prev) => prev.map((d) => d.id === debt.id ? { ...d, used: Math.max(0, Number(tempDebtVal) || 0) } : d)); setEditingDebt(null); }}
                          onKeyDown={(e) => { if (e.key === "Enter") { setDebts((prev) => prev.map((d) => d.id === debt.id ? { ...d, used: Math.max(0, Number(tempDebtVal) || 0) } : d)); setEditingDebt(null); } }}
                          autoFocus
                          style={{ width: 60, background: COLORS.card, border: `1px solid ${severity}`, borderRadius: 6, color: COLORS.text, fontSize: 13, textAlign: "center", padding: "2px" }}
                        />
                      ) : (
                        <span
                          onClick={() => { setEditingDebt(debt.id); setTempDebtVal(String(debt.used)); }}
                          style={{ cursor: "pointer", borderBottom: "1px dashed rgba(255,255,255,0.3)", fontWeight: 700, color: severity }}
                          title="Click to update balance"
                        >
                          {debt.used.toLocaleString()}
                        </span>
                      )} / Â£{debt.limit.toLocaleString()}
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: COLORS.muted, marginTop: 4 }}>
                    <span>{usedPct}% used</span>
                    <span style={{ color: COLORS.success }}>Â£{available.toLocaleString()} available</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Debt summary */}
          {(() => {
            const cleared = debts.filter((d) => d.used === 0).length;
            const totalUsed = debts.reduce((s, d) => s + d.used, 0);
            return (
              <div style={{
                marginTop: 14, padding: "10px 14px",
                background: cleared === debts.length ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.06)",
                borderRadius: 10, border: cleared === debts.length ? "1px solid rgba(34,197,94,0.2)" : "1px solid rgba(239,68,68,0.1)",
                textAlign: "center",
              }}>
                {cleared === debts.length ? (
                  <span style={{ fontSize: 14, color: COLORS.success, fontWeight: 700 }}>ð DEBT FREE! All cards cleared!</span>
                ) : (
                  <span style={{ fontSize: 14, color: COLORS.muted }}>
                    {cleared > 0 && <span style={{ color: COLORS.success, fontWeight: 600 }}>{cleared} card{cleared > 1 ? "s" : ""} clear! </span>}
                    <span style={{ fontWeight: 700, color: COLORS.danger }}>Â£{totalUsed.toLocaleString()}</span> total to pay off across {debts.length - cleared} card{debts.length - cleared !== 1 ? "s" : ""}
                  </span>
                )}
              </div>
            );
          })()}
        </Card>
        )}

        {/* Serenity Prayer */}
        {(activeTab === "all") && (
          <div style={{
            marginTop: 40, padding: "28px 32px", textAlign: "center",
            background: "linear-gradient(135deg, rgba(56,189,248,0.06), rgba(129,140,248,0.06), rgba(192,132,252,0.06))",
            borderRadius: 16, border: "1px solid rgba(255,255,255,0.06)",
          }}>
            <div style={{ fontSize: 13, color: COLORS.accent, textTransform: "uppercase", letterSpacing: 2, marginBottom: 16, fontWeight: 600 }}>
              The Serenity Prayer
            </div>
            <div style={{ fontSize: 18, color: COLORS.text, lineHeight: 1.8, fontStyle: "italic", maxWidth: 500, margin: "0 auto" }}>
              God, grant me the serenity
              <br />to accept the things I cannot change,
              <br />the courage to change the things I can,
              <br />and the wisdom to know the difference.
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ textAlign: "center", marginTop: 24, color: COLORS.muted, fontSize: 12 }}>
          Last updated: {new Date().toLocaleDateString("en-GB", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          <br />Click on weight or health goal numbers to update them
        </div>
      </div>
    </div>
  );
}
