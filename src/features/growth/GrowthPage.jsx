import {
  AlertTriangle,
  Award,
  ChefHat,
  CheckCircle,
  Flame,
  GitCommit,
  Plus,
  RotateCw,
  Search,
  Shield,
  Sparkles,
  Target,
  Terminal,
  Trophy,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useAppContext } from "../../shared/context/AppContext.jsx";
import { streakMilestones } from "../../shared/data/sampleData.js";

export function GrowthPage() {
  const {
    growthStats,
    profile,
    logCodingActivity,
    setDailyGoal,
    useStreakFreeze,
    rekindleStreak,
    syncCodeChefData,
  } = useAppContext();

  // Tab navigation
  const [activeTab, setActiveTab] = useState("all"); // 'all' | 'builds'

  // Practice History Filter State
  const [logSearchQuery, setLogSearchQuery] = useState("");
  const [logPlatformFilter, setLogPlatformFilter] = useState("all");

  // Log Modal State
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState("LeetCode");
  const [problemsCount, setProblemsCount] = useState(2);
  const [logNotes, setLogNotes] = useState("");
  const [difficulty, setDifficulty] = useState("Medium");
  const [category, setCategory] = useState("Algorithms & DSA");

  const handleLogSubmit = (e) => {
    e.preventDefault();
    logCodingActivity({
      platform: selectedPlatform,
      problemsSolved: Number(problemsCount) || 1,
      notes: logNotes,
      difficulty,
      category,
    });
    setIsLogModalOpen(false);
    setLogNotes("");
  };

  const totalLeetCode = growthStats.leetcode.solved;
  const easyPct = Math.round((growthStats.leetcode.easy / totalLeetCode) * 100);
  const medPct = Math.round((growthStats.leetcode.medium / totalLeetCode) * 100);
  const hardPct = Math.round((growthStats.leetcode.hard / totalLeetCode) * 100);

  const monthlyActivity = useMemo(
    () => growthStats.monthlyActivity || [],
    [growthStats.monthlyActivity]
  );
  const activeDaysCount = useMemo(
    () => monthlyActivity.filter((d) => d.count > 0).length,
    [monthlyActivity]
  );
  const consistencyRate = useMemo(
    () =>
      monthlyActivity.length > 0
        ? Math.round((activeDaysCount / monthlyActivity.length) * 100)
        : 0,
    [activeDaysCount, monthlyActivity]
  );

  const filteredLogs = useMemo(() => {
    return (growthStats.recentLogs || []).filter((log) => {
      if (logPlatformFilter !== "all" && (log.platform || "").toLowerCase() !== logPlatformFilter.toLowerCase()) {
        return false;
      }
      if (logSearchQuery.trim()) {
        const q = logSearchQuery.toLowerCase();
        const matchesNotes = log.notes && log.notes.toLowerCase().includes(q);
        const matchesPlatform = log.platform && log.platform.toLowerCase().includes(q);
        const matchesCategory = log.category && log.category.toLowerCase().includes(q);
        return matchesNotes || matchesPlatform || matchesCategory;
      }
      return true;
    });
  }, [growthStats.recentLogs, logPlatformFilter, logSearchQuery]);

  return (
    <main className="page-content">
      {/* Page Heading */}
      <div className="page-heading">
        <div>
          <p className="eyebrow">Developer Growth</p>
          <h1>Individual Analytics &amp; Practice</h1>
          <p className="muted">
            Detailed performance analytics across LeetCode, CodeChef, Codeforces, and GitHub with habit logs.
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            className="button button-primary"
            onClick={() => setIsLogModalOpen(true)}
            type="button"
          >
            <Plus size={16} /> Log Today's Activity
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="tab-bar">
        <button
          className={`tab-btn ${activeTab === "all" ? "active" : ""}`}
          onClick={() => setActiveTab("all")}
          type="button"
        >
          Individual Analytics
        </button>
        <button
          className={`tab-btn ${activeTab === "builds" ? "active" : ""}`}
          onClick={() => setActiveTab("builds")}
          type="button"
        >
          Daily Builds ({growthStats.autonomousProjects?.length || 0})
        </button>
      </div>

      {/* Bare Body / Onboarding State */}
      {growthStats.totalProblemsSolved === 0 && (
        <section
          style={{
            background: "linear-gradient(135deg, rgba(35, 78, 64, 0.25), rgba(56, 189, 248, 0.08))",
            border: "1px dashed var(--color-border-subtle, rgba(255, 255, 255, 0.15))",
            borderRadius: "var(--radius-lg)",
            padding: "24px 28px",
            marginBottom: 24,
            textAlign: "center",
          }}
        >
          <Sparkles size={28} color="#38bdf8" style={{ margin: "0 auto 10px" }} />
          <h2 style={{ fontSize: 18, margin: "0 0 6px", color: "var(--color-text-title)" }}>
            Welcome to Your Coding Rhythm Hub
          </h2>
          <p className="muted" style={{ maxWidth: 560, margin: "0 auto 16px", fontSize: 13 }}>
            Connect your platforms (CodeChef, LeetCode, Codeforces, GitHub) to aggregate all your problem solving, ratings, and daily contribution skyline in one dashboard.
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: 10, flexWrap: "wrap" }}>
            <button
              className="button button-primary button-sm"
              onClick={() => setIsLogModalOpen(true)}
              type="button"
            >
              <Plus size={14} /> Log Your First Practice
            </button>
          </div>
        </section>
      )}

      {/* Streak Alert / Active State Banner */}
      {growthStats.streakBroken ? (
        <section
          style={{
            background: "rgba(239, 68, 68, 0.12)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            borderRadius: "var(--radius-lg)",
            padding: "16px 20px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 24,
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <AlertTriangle size={26} color="#ef4444" />
            <div>
              <strong style={{ color: "#f87171", display: "block", fontSize: 15 }}>
                Streak Broken: Prior Inactivity
              </strong>
              <span style={{ fontSize: 13, color: "var(--color-text-main)" }}>
                You were inactive for more than 24 hours. Use a Streak Freeze to salvage your record, or rekindle a fresh streak today!
              </span>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            {(growthStats.streakFreezesAvailable ?? 0) > 0 && (
              <button
                className="button button-accent button-sm"
                onClick={useStreakFreeze}
                type="button"
              >
                <Shield size={14} /> Use Streak Freeze ({growthStats.streakFreezesAvailable ?? 0} left)
              </button>
            )}
            <button
              className="button button-secondary button-sm"
              onClick={rekindleStreak}
              type="button"
              style={{ borderColor: "#ef4444", color: "#fca5a5" }}
            >
              <Flame size={14} /> Rekindle Streak (Day 1)
            </button>
            <button
              className="button button-primary button-sm"
              onClick={() => setIsLogModalOpen(true)}
              type="button"
            >
              Log Practice Now
            </button>
          </div>
        </section>
      ) : growthStats.streakAtRisk ? (
        <section className="streak-alert-banner" aria-label="Streak warning">
          <div className="streak-alert-content">
            <AlertTriangle size={24} color="#d97706" />
            <div>
              <strong>Streak Alert: No activity logged today yet!</strong>
              <span>
                Your <strong>{growthStats.currentStreak}-day</strong> coding streak will reset at midnight if you do not log today.
              </span>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            {growthStats.streakFreezesAvailable > 0 && (
              <button
                className="button button-secondary button-sm"
                onClick={useStreakFreeze}
                type="button"
              >
                <Shield size={14} /> Use Freeze ({growthStats.streakFreezesAvailable})
              </button>
            )}
            <button
              className="button button-accent button-sm"
              onClick={() => setIsLogModalOpen(true)}
              type="button"
            >
              Log Activity Now
            </button>
          </div>
        </section>
      ) : (
        <div
          style={{
            background: "var(--color-success-bg)",
            border: "1px solid var(--color-success-border)",
            color: "#166534",
            borderRadius: "var(--radius-lg)",
            padding: "12px 18px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
            marginBottom: 24,
            fontSize: 13,
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <CheckCircle size={18} color="#166534" />
            <span>
              Awesome work! You have logged activity for today. Current streak is active at{" "}
              <strong>{growthStats.currentStreak} days</strong>.
            </span>
          </div>
          <span style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
            🛡️ {growthStats.streakFreezesAvailable ?? 2} Streak Freezes available
          </span>
        </div>
      )}

      {/* Daily Target Progress & Streak Goal */}
      <section
        className="panel"
        style={{
          marginBottom: 24,
          padding: "18px 22px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 20,
          flexWrap: "wrap",
        }}
      >
        <div style={{ flex: "1 1 300px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--color-text-title)", display: "flex", alignItems: "center", gap: 6 }}>
              <Target size={15} color="var(--color-primary)" /> Daily Milestone Target
            </span>
            <span style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
              {growthStats.todayCompletedCount || 0} / {growthStats.dailyGoal || 2} items completed today
            </span>
          </div>
          <div style={{ height: 8, background: "rgba(0, 0, 0, 0.06)", borderRadius: 99, overflow: "hidden" }}>
            <div
              style={{
                height: "100%",
                width: `${Math.min(100, Math.round(((growthStats.todayCompletedCount || 0) / (growthStats.dailyGoal || 2)) * 100))}%`,
                background: (growthStats.todayCompletedCount || 0) >= (growthStats.dailyGoal || 2) ? "#16a34a" : "var(--color-primary)",
                transition: "width 0.3s ease",
              }}
            />
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 12, color: "var(--color-text-muted)" }}>Set Daily Target:</span>
          <select
            className="form-select"
            value={growthStats.dailyGoal || 2}
            onChange={(e) => setDailyGoal(e.target.value)}
            style={{ width: "auto", padding: "6px 10px", fontSize: 12 }}
          >
            <option value="1">1 Activity / day (Relaxed)</option>
            <option value="2">2 Activities / day (Standard)</option>
            <option value="3">3 Activities / day (Ambitious)</option>
            <option value="5">5 Activities / day (Intensive)</option>
          </select>
        </div>
      </section>

      {/* Top Metrics Cards */}
      <section className="stats-grid" aria-label="Streak and platform statistics">
        <article className="stat-card">
          <div className="stat-icon" style={{ background: "#ffedd5", color: "#ea580c" }}>
            <Flame size={20} />
          </div>
          <p className="muted">Coding Streak</p>
          <strong>{growthStats.currentStreak} Days</strong>
          <span className="stat-trend" style={{ color: "#ea580c" }}>
            Longest: {growthStats.longestStreak} days
          </span>
        </article>

        <article className="stat-card">
          <div className="stat-icon" style={{ background: "#fef3c7", color: "#d97706" }}>
            <Trophy size={20} />
          </div>
          <p className="muted">Total Problems Solved</p>
          <strong>{growthStats.totalProblemsSolved}</strong>
          <span className="stat-trend">Across LeetCode & Codeforces</span>
        </article>

        <article className="stat-card">
          <div className="stat-icon" style={{ background: "#dbeafe", color: "#1d4ed8" }}>
            <Award size={20} />
          </div>
          <p className="muted">Codeforces Rating</p>
          <strong>{growthStats.codeforces.rating}</strong>
          <span className="stat-trend" style={{ color: "#1d4ed8" }}>
            {growthStats.codeforces.rank} · {growthStats.codeforces.contests} contests
          </span>
        </article>

        <article className="stat-card">
          <div className="stat-icon" style={{ background: "#f3e8ff", color: "#7e22ce" }}>
            <GitCommit size={20} />
          </div>
          <p className="muted">GitHub Contributions</p>
          <strong>{growthStats.github.contributions}</strong>
          <span className="stat-trend" style={{ color: "#7e22ce" }}>
            {growthStats.github.repos} active repos
          </span>
        </article>
      </section>

      {/* TAB 1: OVERVIEW & PRACTICE */}
      {(activeTab === "all" || activeTab === "practice") && (
        <>
          {/* Platform Profiles Breakdown */}
          <section className="platform-grid">
            {/* LeetCode Card */}
            <div className="platform-card">
              <div className="platform-header">
                <div>
                  <h3>LeetCode</h3>
                  <span className="muted" style={{ fontSize: 12 }}>
                    @{profile.platformHandles.leetcode} · Top {Math.round(growthStats.leetcode.ranking / 1000)}k
                  </span>
                </div>
                <span className="tag" style={{ background: "#fef3c7", color: "#b45309" }}>
                  {growthStats.leetcode.solved} Solved
                </span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 14 }}>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                    <span style={{ color: "#16a34a", fontWeight: 600 }}>Easy</span>
                    <span>
                      {growthStats.leetcode.easy} ({easyPct}%)
                    </span>
                  </div>
                  <div style={{ height: 6, background: "rgba(255, 255, 255, 0.08)", borderRadius: 99, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${easyPct}%`, background: "#16a34a" }} />
                  </div>
                </div>

                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                    <span style={{ color: "#d97706", fontWeight: 600 }}>Medium</span>
                    <span>
                      {growthStats.leetcode.medium} ({medPct}%)
                    </span>
                  </div>
                  <div style={{ height: 6, background: "rgba(255, 255, 255, 0.08)", borderRadius: 99, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${medPct}%`, background: "#d97706" }} />
                  </div>
                </div>

                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                    <span style={{ color: "#dc2626", fontWeight: 600 }}>Hard</span>
                    <span>
                      {growthStats.leetcode.hard} ({hardPct}%)
                    </span>
                  </div>
                  <div style={{ height: 6, background: "rgba(255, 255, 255, 0.08)", borderRadius: 99, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${hardPct}%`, background: "#dc2626" }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Codeforces Card */}
            <div className="platform-card">
              <div className="platform-header">
                <div>
                  <h3>Codeforces</h3>
                  <span className="muted" style={{ fontSize: 12 }}>
                    @{profile.platformHandles.codeforces}
                  </span>
                </div>
                <span className="tag tag-research">{growthStats.codeforces.rank}</span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 16 }}>
                <div style={{ background: "rgba(255, 255, 255, 0.04)", border: "1px solid var(--color-border)", padding: 12, borderRadius: "var(--radius-md)" }}>
                  <span style={{ fontSize: 11, color: "var(--color-text-muted)" }}>CURRENT RATING</span>
                  <strong style={{ display: "block", fontSize: 20, color: "#818cf8" }}>
                    {growthStats.codeforces.rating}
                  </strong>
                </div>
                <div style={{ background: "rgba(255, 255, 255, 0.04)", border: "1px solid var(--color-border)", padding: 12, borderRadius: "var(--radius-md)" }}>
                  <span style={{ fontSize: 11, color: "var(--color-text-muted)" }}>CONTESTS</span>
                  <strong style={{ display: "block", fontSize: 20, color: "#818cf8" }}>
                    {growthStats.codeforces.contests}
                  </strong>
                </div>
              </div>
              <p className="muted" style={{ marginTop: 16, fontSize: 12 }}>
                Target: Reach Specialist (1400+) in the upcoming div 2 round.
              </p>
            </div>

            {/* GitHub & Open Source Card */}
            <div className="platform-card">
              <div className="platform-header">
                <div>
                  <h3>GitHub</h3>
                  <span className="muted" style={{ fontSize: 12 }}>
                    @{profile.platformHandles.github}
                  </span>
                </div>
                <span className="tag tag-hackathon">{growthStats.github.streak} day streak</span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 16 }}>
                <div style={{ background: "rgba(255, 255, 255, 0.04)", border: "1px solid var(--color-border)", padding: 12, borderRadius: "var(--radius-md)" }}>
                  <span style={{ fontSize: 11, color: "var(--color-text-muted)" }}>CONTRIBUTIONS</span>
                  <strong style={{ display: "block", fontSize: 20, color: "#818cf8" }}>
                    {growthStats.github.contributions}
                  </strong>
                </div>
                <div style={{ background: "rgba(255, 255, 255, 0.04)", border: "1px solid var(--color-border)", padding: 12, borderRadius: "var(--radius-md)" }}>
                  <span style={{ fontSize: 11, color: "var(--color-text-muted)" }}>PUBLIC REPOS</span>
                  <strong style={{ display: "block", fontSize: 20, color: "#818cf8" }}>
                    {growthStats.github.repos}
                  </strong>
                </div>
              </div>
              <p className="muted" style={{ marginTop: 16, fontSize: 12 }}>
                Active repositories include opportunity-os, algorithms-ts, and streak.
              </p>
            </div>

            {/* CodeChef Card */}
            <div className="platform-card">
              <div className="platform-header">
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <ChefHat size={18} color="#d97706" />
                    <h3 style={{ margin: 0 }}>CodeChef</h3>
                  </div>
                  <span className="muted" style={{ fontSize: 12 }}>
                    @{profile.platformHandles?.codechef || "Not configured"}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span className="tag" style={{ background: "rgba(217, 119, 6, 0.15)", color: "#d97706" }}>
                    {growthStats.codechef?.stars || "1★"}
                  </span>
                  <span className="tag tag-research">{growthStats.codechef?.division || "Div 2"}</span>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 16 }}>
                <div style={{ background: "rgba(255, 255, 255, 0.04)", border: "1px solid var(--color-border)", padding: 12, borderRadius: "var(--radius-md)" }}>
                  <span style={{ fontSize: 11, color: "var(--color-text-muted)" }}>CURRENT RATING</span>
                  <strong style={{ display: "block", fontSize: 20, color: "#d97706" }}>
                    {growthStats.codechef?.rating ?? 0}
                  </strong>
                  <span style={{ fontSize: 10, color: "var(--color-text-muted)" }}>
                    Peak: {growthStats.codechef?.highestRating ?? growthStats.codechef?.rating ?? 0}
                  </span>
                </div>
                <div style={{ background: "rgba(255, 255, 255, 0.04)", border: "1px solid var(--color-border)", padding: 12, borderRadius: "var(--radius-md)" }}>
                  <span style={{ fontSize: 11, color: "var(--color-text-muted)" }}>SOLVED</span>
                  <strong style={{ display: "block", fontSize: 20, color: "#d97706" }}>
                    {growthStats.codechef?.solved ?? 0}
                  </strong>
                  <span style={{ fontSize: 10, color: "var(--color-text-muted)" }}>
                    Rank: {growthStats.codechef?.globalRank && growthStats.codechef.globalRank !== "—" && growthStats.codechef.globalRank !== "Inactive"
                      ? `#${growthStats.codechef.globalRank}`
                      : (growthStats.codechef?.globalRank || "—")}
                  </span>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 14, paddingTop: 10, borderTop: "1px solid var(--color-border-subtle, rgba(255, 255, 255, 0.08))" }}>
                <span className="muted" style={{ fontSize: 11 }}>
                  {growthStats.codechef?.lastSynced
                    ? `Synced at ${growthStats.codechef.lastSynced}`
                    : "Real-time sync available"}
                </span>
                <button
                  type="button"
                  className="button button-secondary button-sm"
                  style={{ fontSize: 11, padding: "3px 8px" }}
                  onClick={() => syncCodeChefData(profile.platformHandles?.codechef, { force: true })}
                  disabled={growthStats.codechef?.loading}
                >
                  <RotateCw size={11} className={growthStats.codechef?.loading ? "animate-spin" : ""} />
                  {growthStats.codechef?.loading ? "Syncing..." : "Sync Live"}
                </button>
              </div>

              {growthStats.codechef?.error && (
                <div style={{ marginTop: 8, fontSize: 11, color: "#ef4444" }}>
                  ⚠️ {growthStats.codechef.error}
                </div>
              )}
            </div>
          </section>

          {/* Multi-Platform Streak & Contributions Aggregator */}
          <section className="panel" style={{ marginBottom: 24, padding: "20px 24px" }}>
            <div className="panel-heading" style={{ marginBottom: 16 }}>
              <div>
                <p className="eyebrow">Unified Activity Stream</p>
                <h2 style={{ fontSize: 18 }}>Multi-Platform Streak Distribution</h2>
              </div>
            </div>
            <p className="muted" style={{ marginBottom: 16, fontSize: 13 }}>
              Aggregated breakdown of consistency across LeetCode, Codeforces, and autonomous GitHub builds.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
              <div
                style={{
                  background: "rgba(0, 0, 0, 0.02)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-md)",
                  padding: "14px 16px",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <div style={{ width: 38, height: 38, borderRadius: "var(--radius-sm)", background: "#fef3c7", color: "#b45309", display: "grid", placeItems: "center", fontWeight: 800, fontSize: 14 }}>
                  LC
                </div>
                <div>
                  <strong style={{ display: "block", fontSize: 16, color: "var(--color-text-title)" }}>
                    {growthStats.leetcode.solved} Solved
                  </strong>
                  <span style={{ fontSize: 11, color: "var(--color-text-muted)" }}>
                    Top {Math.round(growthStats.leetcode.ranking / 1000)}k globally
                  </span>
                </div>
              </div>

              <div
                style={{
                  background: "rgba(0, 0, 0, 0.02)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-md)",
                  padding: "14px 16px",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <div style={{ width: 38, height: 38, borderRadius: "var(--radius-sm)", background: "#e0e7ff", color: "#3730a3", display: "grid", placeItems: "center", fontWeight: 800, fontSize: 14 }}>
                  CF
                </div>
                <div>
                  <strong style={{ display: "block", fontSize: 16, color: "var(--color-text-title)" }}>
                    {growthStats.codeforces.rating} Rating
                  </strong>
                  <span style={{ fontSize: 11, color: "var(--color-text-muted)" }}>
                    {growthStats.codeforces.rank} · {growthStats.codeforces.contests} rounds
                  </span>
                </div>
              </div>

              <div
                style={{
                  background: "rgba(0, 0, 0, 0.02)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-md)",
                  padding: "14px 16px",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <div style={{ width: 38, height: 38, borderRadius: "var(--radius-sm)", background: "#f3e8ff", color: "#6b21a8", display: "grid", placeItems: "center", fontWeight: 800, fontSize: 14 }}>
                  GH
                </div>
                <div>
                  <strong style={{ display: "block", fontSize: 16, color: "var(--color-text-title)" }}>
                    {growthStats.github.contributions} Commits
                  </strong>
                  <span style={{ fontSize: 11, color: "var(--color-text-muted)" }}>
                    {growthStats.github.streak} day build streak
                  </span>
                </div>
              </div>

              <div
                style={{
                  background: "rgba(0, 0, 0, 0.02)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-md)",
                  padding: "14px 16px",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <div style={{ width: 38, height: 38, borderRadius: "var(--radius-sm)", background: "#fef3c7", color: "#b45309", display: "grid", placeItems: "center", fontWeight: 800, fontSize: 14 }}>
                  CC
                </div>
                <div>
                  <strong style={{ display: "block", fontSize: 16, color: "var(--color-text-title)" }}>
                    {growthStats.codechef?.rating ?? 0} ({growthStats.codechef?.stars || "1★"})
                  </strong>
                  <span style={{ fontSize: 11, color: "var(--color-text-muted)" }}>
                    {growthStats.codechef?.solved ?? 0} Solved · {growthStats.codechef?.division || "Div 2"}
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Consistency Heatmap & Practice History */}
          <section className="content-grid" style={{ marginBottom: 24 }}>
            {/* 28-Day Activity Heatmap */}
            <div className="panel">
              <div className="panel-heading">
                <div>
                  <p className="eyebrow">Habit Tracking</p>
                  <h2>28-Day Consistency Heatmap</h2>
                </div>
              </div>
              <p className="muted">Rolling 4-week overview of daily coding consistency and intensity.</p>

              <div className="heatmap-container">
                <div className="heatmap-meta">
                  <span>
                    <strong>{activeDaysCount} / {monthlyActivity.length}</strong> active days
                  </span>
                  <span>
                    <strong>{consistencyRate}%</strong> consistency score
                  </span>
                </div>
                <div className="heatmap-grid">
                  {monthlyActivity.map((day, idx) => (
                    <div
                      key={idx}
                      className={`heatmap-cell level-${day.level ?? 0}`}
                      title={`${day.date || day.day}: ${day.count} problems solved`}
                    >
                      <span>{day.count > 0 ? day.count : "·"}</span>
                      <small>{day.day}</small>
                    </div>
                  ))}
                </div>
                <div className="heatmap-legend">
                  <span>Less</span>
                  <span className="legend-swatch" style={{ background: "#ebe7dc", border: "1px solid #dfdacd" }} />
                  <span className="legend-swatch" style={{ background: "#d8e8b7" }} />
                  <span className="legend-swatch" style={{ background: "#b5db6c" }} />
                  <span className="legend-swatch" style={{ background: "#234e40" }} />
                  <span>More</span>
                </div>
              </div>
            </div>

            {/* Recent Daily Logs */}
            <div className="panel">
              <div className="panel-heading" style={{ flexWrap: "wrap", gap: 12 }}>
                <div>
                  <p className="eyebrow">Recent Sessions</p>
                  <h2>Practice History</h2>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                  <div style={{ position: "relative" }}>
                    <Search
                      size={14}
                      style={{
                        position: "absolute",
                        left: 10,
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: "var(--color-text-muted)",
                      }}
                    />
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Search topics, notes..."
                      value={logSearchQuery}
                      onChange={(e) => setLogSearchQuery(e.target.value)}
                      style={{ paddingLeft: 30, paddingRight: 10, fontSize: 12, height: 32, width: 170 }}
                    />
                  </div>
                  <select
                    className="form-select"
                    value={logPlatformFilter}
                    onChange={(e) => setLogPlatformFilter(e.target.value)}
                    style={{ fontSize: 12, height: 32, padding: "0 8px" }}
                    aria-label="Filter practice history by platform"
                  >
                    <option value="all">All Platforms</option>
                    <option value="LeetCode">LeetCode</option>
                    <option value="Codeforces">Codeforces</option>
                    <option value="GitHub">GitHub</option>
                    <option value="AtCoder">AtCoder</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {filteredLogs.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "24px 12px", color: "var(--color-text-muted)" }}>
                    <p style={{ margin: 0, fontSize: 13 }}>No practice logs match your filter criteria.</p>
                    {(logSearchQuery || logPlatformFilter !== "all") && (
                      <button
                        className="button button-secondary"
                        onClick={() => {
                          setLogSearchQuery("");
                          setLogPlatformFilter("all");
                        }}
                        style={{ marginTop: 8, fontSize: 12, padding: "4px 10px" }}
                        type="button"
                      >
                        Reset Filters
                      </button>
                    )}
                  </div>
                ) : (
                  filteredLogs.map((log, index) => (
                    <div
                      key={index}
                      style={{
                        padding: "12px 14px",
                        background: "rgba(0, 0, 0, 0.02)",
                        borderRadius: "var(--radius-md)",
                        border: "1px solid var(--color-border)",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                        <strong style={{ color: "var(--color-text-title)" }}>
                          {log.platform} · {log.problemsSolved} Solved
                        </strong>
                        <span style={{ color: "var(--color-text-muted)" }}>{log.date}</span>
                      </div>
                      <p style={{ margin: 0, fontSize: 12, color: "var(--color-text-main)" }}>{log.notes}</p>
                      {(log.category || log.difficulty) && (
                        <div style={{ marginTop: 6, display: "flex", gap: 6 }}>
                          {log.category && (
                            <span className="tag" style={{ fontSize: 10, padding: "2px 6px" }}>
                              {log.category}
                            </span>
                          )}
                          {log.difficulty && (
                            <span
                              className="tag"
                              style={{
                                fontSize: 10,
                                padding: "2px 6px",
                                color:
                                  log.difficulty === "Easy"
                                    ? "#16a34a"
                                    : log.difficulty === "Hard"
                                    ? "#dc2626"
                                    : "#d97706",
                              }}
                            >
                              {log.difficulty}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>

          {/* Streak Milestones Badges */}
          <section className="panel" style={{ marginBottom: 32 }}>
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Milestones</p>
                <h2>Streak Consistency Badges</h2>
              </div>
              <span className="tag" style={{ background: "#fef3c7", color: "#b45309" }}>
                {growthStats.currentStreak} Days Current
              </span>
            </div>
            <p className="muted">Unlock developer badges by maintaining unbroken coding streaks.</p>

            <div className="milestones-grid">
              {streakMilestones.map((m) => {
                const isUnlocked = (growthStats.currentStreak || 0) >= m.targetDays;
                const progressPct = Math.min(100, Math.round(((growthStats.currentStreak || 0) / m.targetDays) * 100));
                const isInProgress = !isUnlocked && progressPct > 0;
                return (
                  <article key={m.id} className={`milestone-card ${isUnlocked ? "unlocked" : ""}`}>
                    <div className="milestone-card-top">
                      <span className="milestone-title">{m.name}</span>
                      <span
                        className={`milestone-badge-pill ${
                          isUnlocked ? "unlocked" : isInProgress ? "in-progress" : "locked"
                        }`}
                      >
                        {isUnlocked ? "Unlocked" : `${m.targetDays} Days`}
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: 12, color: "var(--color-text-muted)", lineHeight: 1.4 }}>
                      {m.description}
                    </p>
                    <div>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          fontSize: 11,
                          color: "var(--color-text-muted)",
                          marginTop: 6,
                        }}
                      >
                        <span>
                          {isUnlocked ? "Achieved" : `${growthStats.currentStreak}/${m.targetDays} days`}
                        </span>
                        <span>{progressPct}%</span>
                      </div>
                      <div className="milestone-progress-bar">
                        <div className="milestone-progress-fill" style={{ width: `${progressPct}%` }} />
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        </>
      )}

      {/* TAB: DAILY BUILDS (Inspired by Autonomous Streak Projects) */}
      {activeTab === "builds" && (
        <section style={{ marginBottom: 32 }}>
          <div className="panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Daily Streak Projects</p>
                <h2>Autonomous Builds & Mini-Projects</h2>
              </div>
            </div>
            <p className="muted" style={{ marginBottom: 20 }}>
              Repositories and automated projects completed to build real-world software and keep your streak strong.
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                gap: 16,
              }}
            >
              {(growthStats.autonomousProjects || []).map((project) => (
                <article
                  key={project.id}
                  style={{
                    background: "rgba(255, 255, 255, 0.03)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "var(--radius-lg)",
                    padding: 18,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    gap: 12,
                  }}
                >
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "var(--color-primary)", textTransform: "uppercase" }}>
                        {project.language}
                      </span>
                      <span className="tag" style={{ background: "rgba(52, 211, 153, 0.15)", color: "#166534", fontWeight: 600, fontSize: 11 }}>
                        ✓ {project.status}
                      </span>
                    </div>
                    <h3 style={{ fontSize: 16, margin: "0 0 6px 0", color: "var(--color-text-title)" }}>
                      {project.name}
                    </h3>
                    <p style={{ fontSize: 13, color: "var(--color-text-main)", margin: 0, lineHeight: 1.5 }}>
                      {project.description}
                    </p>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: 12,
                      color: "var(--color-text-muted)",
                      paddingTop: 10,
                      borderTop: "1px solid rgba(255, 255, 255, 0.06)",
                    }}
                  >
                    <span>{project.commits} commits</span>
                    <span>{project.date}</span>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Log Activity Modal */}
      {isLogModalOpen && (
        <div className="modal-overlay" onClick={() => setIsLogModalOpen(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2 style={{ margin: 0, fontSize: 18, color: "var(--color-primary)" }}>
                  Log Today's Activity
                </h2>
                <p className="muted">Record problems solved or repository commits to protect your streak.</p>
              </div>
              <button
                className="close-btn"
                onClick={() => setIsLogModalOpen(false)}
                type="button"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleLogSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label htmlFor="platSelect">Platform / Activity *</label>
                  <select
                    id="platSelect"
                    className="form-select"
                    value={selectedPlatform}
                    onChange={(e) => setSelectedPlatform(e.target.value)}
                  >
                    <option value="LeetCode">LeetCode (Algorithm practice)</option>
                    <option value="Codeforces">Codeforces (Contest round)</option>
                    <option value="CodeChef">CodeChef (Star practice / Contest)</option>
                    <option value="AtCoder">AtCoder (Contest practice)</option>
                    <option value="GitHub">GitHub (Build / Project commits)</option>
                    <option value="HackerRank">HackerRank</option>
                  </select>
                </div>

                {selectedPlatform === "LeetCode" && (
                  <div className="form-group">
                    <label htmlFor="diffSelect">Difficulty Level</label>
                    <select
                      id="diffSelect"
                      className="form-select"
                      value={difficulty}
                      onChange={(e) => setDifficulty(e.target.value)}
                    >
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Hard">Hard</option>
                    </select>
                  </div>
                )}

                <div className="form-group">
                  <label htmlFor="catSelect">Focus Area</label>
                  <select
                    id="catSelect"
                    className="form-select"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    <option value="Algorithms & DSA">Algorithms & DSA</option>
                    <option value="Contest Round">Contest Round</option>
                    <option value="System Design">System Design</option>
                    <option value="Open Source & Git">Open Source & Git</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="countInput">Items / Problems / Commits Completed *</label>
                  <input
                    id="countInput"
                    type="number"
                    min="1"
                    max="50"
                    className="form-input"
                    value={problemsCount}
                    onChange={(e) => setProblemsCount(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="notesPractice">Details or Problem / Project Name</label>
                  <input
                    id="notesPractice"
                    className="form-input"
                    placeholder="e.g. Solved 3Sum Closest or Built Auth Middleware"
                    value={logNotes}
                    onChange={(e) => setLogNotes(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={() => setIsLogModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="button button-primary">
                  <Terminal size={15} /> Save Activity
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
