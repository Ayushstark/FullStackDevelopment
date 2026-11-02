import {
  ArrowRight,
  Check,
  CheckCircle,
  ChevronRight,
  Code2,
  ExternalLink,
  Flame,
  Globe,
  Plus,
  Terminal,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useAppContext } from "../../shared/context/AppContext.jsx";

export function DashboardPage() {
  const {
    profile,
    calendarEvents,
    growthStats,
    dailyChallenge,
    completeDailyChallenge,
    setActivePage,
    logCodingActivity,
  } = useAppContext();

  // Daily Consistency Checklist with derived challenge completion
  const [completedTaskIds, setCompletedTaskIds] = useState(() => new Set());
  const isChallengeDone = Boolean(dailyChallenge?.completed);

  const tasks = useMemo(
    () => [
      { id: 1, text: "Solve daily LeetCode challenge", done: isChallengeDone || completedTaskIds.has(1) },
      { id: 2, text: "Commit progress to GitHub project", done: completedTaskIds.has(2) },
      { id: 3, text: "Review 1 problem editorial or concept", done: completedTaskIds.has(3) },
    ],
    [isChallengeDone, completedTaskIds],
  );

  const toggleTask = (taskId) => {
    try {
      setCompletedTaskIds((prev) => {
        const next = new Set(prev);
        if (next.has(taskId)) {
          next.delete(taskId);
        } else {
          next.add(taskId);
        }
        return next;
      });
    } catch (err) {
      console.error("Failed to toggle daily task:", err);
    }
  };

  const remainingTasks = tasks.filter((task) => !task.done).length;
  const firstName = profile?.name ? profile.name.split(" ")[0] : "Developer";
  const formattedDate = new Intl.DateTimeFormat("en", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date());

  // Filter upcoming coding contests
  const upcomingContests = (calendarEvents || []).filter(
    (event) => event.type === "Contest" || event.type === "Hackathon",
  );
  const nextContest = upcomingContests[0];

  return (
    <main className="page-content dashboard-page">
      {/* Top Greeting */}
      <div className="dashboard-greeting">
        <div>
          <p className="eyebrow">{formattedDate}</p>
          <h1>Good morning, {firstName}.</h1>
          <p className="muted">
            {growthStats.streakAtRisk
              ? "Your streak needs attention today. Solve 1 problem to keep it going!"
              : "Consistency is your superpower. Your daily streak is active and strong."}
          </p>
        </div>
        <button
          className="button button-primary"
          onClick={() => setActivePage("growth")}
          type="button"
        >
          <Flame size={16} /> Log Practice
        </button>
      </div>

      {/* Hero Streak Banner */}
      <section className="dashboard-hero">
        <div className="hero-copy">
          <span className="hero-kicker">Developer Consistency</span>
          <h2>
            {growthStats.streakAtRisk
              ? "Keep the momentum going."
              : "Streak is on track today!"}
          </h2>
          <p>
            {growthStats.streakAtRisk
              ? "Log your practice on LeetCode, Codeforces, or GitHub to safeguard your streak."
              : `${growthStats.currentStreak}-day coding streak maintained. Best record: ${growthStats.longestStreak} days.`}
          </p>
          <button
            className="hero-action"
            onClick={() => {
              if (growthStats.streakAtRisk) {
                logCodingActivity("LeetCode", 1, "Daily problem solved");
              } else {
                setActivePage("growth");
              }
            }}
            type="button"
          >
            {growthStats.streakAtRisk ? "Quick-Check In (+1 Problem)" : "View Practice History"}
            <ArrowRight size={16} />
          </button>
        </div>
        <div className="hero-orbit" aria-hidden="true">
          <span className="orbit-ring orbit-ring-one" />
          <span className="orbit-ring orbit-ring-two" />
          <span className="orbit-core">
            <Flame size={28} />
          </span>
          <span className="orbit-caption">
            {growthStats.currentStreak}
            <small>day streak</small>
          </span>
        </div>
      </section>

      {/* Metrics Row: Streak-First */}
      <section className="dashboard-metrics" aria-label="Consistency and Practice Metrics">
        <button
          className="metric-item"
          onClick={() => setActivePage("growth")}
          type="button"
        >
          <span className="metric-value">{growthStats.currentStreak}d</span>
          <span className="metric-label">
            {growthStats.streakAtRisk ? "Streak (Action needed)" : "Active Streak"}
          </span>
          <ChevronRight size={16} />
        </button>
        <button
          className="metric-item"
          onClick={() => setActivePage("growth")}
          type="button"
        >
          <span className="metric-value">{growthStats.totalProblemsSolved}</span>
          <span className="metric-label">Problems Solved</span>
          <ChevronRight size={16} />
        </button>
        <button
          className="metric-item"
          onClick={() => setActivePage("calendar")}
          type="button"
        >
          <span className="metric-value">
            {upcomingContests.length.toString().padStart(2, "0")}
          </span>
          <span className="metric-label">Upcoming Contests</span>
          <ChevronRight size={16} />
        </button>
      </section>

      {/* Featured Daily Coding Challenge Card */}
      {dailyChallenge && (
        <section
          style={{
            marginTop: 20,
            background: dailyChallenge.completed
              ? "linear-gradient(135deg, rgba(35, 78, 64, 0.22), rgba(16, 185, 129, 0.08))"
              : "var(--bg-card)",
            border: dailyChallenge.completed
              ? "1px solid rgba(16, 185, 129, 0.4)"
              : "1px solid var(--color-border)",
            borderRadius: "var(--radius-lg)",
            padding: "20px 24px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 20,
            flexWrap: "wrap",
          }}
        >
          <div style={{ maxWidth: 640 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <span className="tag" style={{ background: "#ffedd5", color: "#c2410c", fontWeight: 700 }}>
                {dailyChallenge.platform}
              </span>
              <span
                className="tag"
                style={{
                  background:
                    dailyChallenge.difficulty === "Hard"
                      ? "#fee2e2"
                      : dailyChallenge.difficulty === "Medium"
                        ? "#fef3c7"
                        : "#dcfce7",
                  color:
                    dailyChallenge.difficulty === "Hard"
                      ? "#b91c1c"
                      : dailyChallenge.difficulty === "Medium"
                        ? "#b45309"
                        : "#15803d",
                  fontWeight: 700,
                }}
              >
                {dailyChallenge.difficulty}
              </span>
              <span className="muted" style={{ fontSize: 12 }}>
                {dailyChallenge.category}
              </span>
            </div>
            <h3 style={{ margin: "0 0 6px", fontSize: 18, color: "var(--color-text-title)" }}>
              {dailyChallenge.title}
            </h3>
            <p className="muted" style={{ margin: 0, fontSize: 13, lineHeight: 1.5 }}>
              {dailyChallenge.description}
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <a
              href={dailyChallenge.link}
              target="_blank"
              rel="noreferrer noopener"
              className="button button-secondary"
              style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13 }}
            >
              Solve Problem <ExternalLink size={14} />
            </a>
            {dailyChallenge.completed ? (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "8px 14px",
                  borderRadius: "var(--radius-md)",
                  background: "#d8e8b7",
                  color: "#233e14",
                  fontSize: 13,
                  fontWeight: 700,
                }}
              >
                <CheckCircle size={15} /> Streak Protected!
              </span>
            ) : (
              <button
                className="button button-primary"
                onClick={completeDailyChallenge}
                type="button"
                style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
              >
                <CheckCircle size={15} /> Mark Solved
              </button>
            )}
          </div>
        </section>
      )}

      {/* Lower Grid: Platform Activity & Daily Practice Plan */}
      <section className="dashboard-lower-grid">
        {/* Left Section: Platform Breakdown & Activity */}
        <div className="dashboard-section">
          <div className="section-title-row">
            <div>
              <p className="eyebrow">Practice snapshot</p>
              <h2>Coding Platforms</h2>
            </div>
            <button
              className="quiet-link"
              onClick={() => setActivePage("growth")}
              type="button"
            >
              Full analytics <ArrowRight size={15} />
            </button>
          </div>

          <div className="preview-list">
            {/* LeetCode Row */}
            <button
              className="preview-role"
              onClick={() => setActivePage("growth")}
              type="button"
            >
              <span className="role-index role-index-1">
                <Code2 size={16} />
              </span>
              <span className="preview-role-main">
                <strong>LeetCode Practice</strong>
                <small>
                  {growthStats.leetcode?.solved ?? 0} Solved <i>·</i>{" "}
                  {growthStats.leetcode?.easy ?? 0} Easy, {growthStats.leetcode?.medium ?? 0} Med, {growthStats.leetcode?.hard ?? 0} Hard
                </small>
              </span>
              <span className="preview-deadline" style={{ color: "var(--color-primary)" }}>
                {profile.platformHandles?.leetcode || "Active"}
              </span>
              <ChevronRight size={16} />
            </button>

            {/* Codeforces Row */}
            <button
              className="preview-role"
              onClick={() => setActivePage("growth")}
              type="button"
            >
              <span className="role-index role-index-2">
                <Terminal size={16} />
              </span>
              <span className="preview-role-main">
                <strong>Codeforces Contests</strong>
                <small>
                  {growthStats.codeforces?.solved ?? 0} Solved <i>·</i> Rating: {growthStats.codeforces?.rating ?? 1420} ({growthStats.codeforces?.rank ?? "Specialist"})
                </small>
              </span>
              <span className="preview-deadline" style={{ color: "var(--color-primary)" }}>
                {profile.platformHandles?.codeforces || "Active"}
              </span>
              <ChevronRight size={16} />
            </button>

            {/* GitHub Contributions Row */}
            <button
              className="preview-role"
              onClick={() => setActivePage("growth")}
              type="button"
            >
              <span className="role-index role-index-3">
                <Globe size={16} />
              </span>
              <span className="preview-role-main">
                <strong>GitHub Activity</strong>
                <small>
                  {growthStats.github?.contributions ?? 0} Contributions <i>·</i> {growthStats.github?.repos ?? 0} Repositories
                </small>
              </span>
              <span className="preview-deadline" style={{ color: "var(--color-primary)" }}>
                {growthStats.github?.streak ?? 0}d streak
              </span>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Right Section: Daily Consistency Plan */}
        <aside className="dashboard-section daily-plan">
          <div className="section-title-row">
            <div>
              <p className="eyebrow">Daily discipline</p>
              <h2>Today’s plan</h2>
            </div>
            <span className="plan-count">{remainingTasks} left</span>
          </div>

          <div className="plan-list">
            {tasks.map((task) => (
              <button
                className={`plan-item ${task.done ? "is-done" : ""}`}
                key={task.id}
                onClick={() => toggleTask(task.id)}
                type="button"
              >
                <span className="plan-check">
                  {task.done && <Check size={13} />}
                </span>
                <span>{task.text}</span>
              </button>
            ))}
          </div>

          <button
            className="plan-add"
            onClick={() => setActivePage("calendar")}
            type="button"
          >
            <Plus size={15} /> View contest calendar
          </button>

          {nextContest && (
            <p className="plan-note">
              Next event: <strong>{nextContest.title} ({nextContest.date})</strong>
            </p>
          )}
        </aside>
      </section>
    </main>
  );
}
