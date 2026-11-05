import { Activity, Award, BarChart3, CalendarDays, Code2, Flame, GitCommit, TrendingUp } from "lucide-react";
import { useAppContext } from "../../shared/context/AppContext.jsx";
import ContributionSkyline from "../../components/ui/contribution-skyline.jsx";
import { useState } from "react";

function HomeStat({ icon: Icon, label, value, detail, content, tint = "#7dd3fc" }) {
  return (
    <article className="home-stat-glow">
      <div className="home-stat-card" style={{ "--stat-tint": tint }}>
        <span className="home-stat-icon" style={{ color: tint }}><Icon size={17} /></span>
        <span className="home-stat-label">{label}</span>
        {content ?? <strong>{value}</strong>}
        <small>{detail}</small>
      </div>
    </article>
  );
}

function PlatformCard({ id, platform, handle, accent, primaryValue, primaryLabel, difficulty, breakdownLabel = "Difficulty breakdown", metrics = [], note, isOpen, onToggle }) {
  const showDifficulty = (value) => value == null ? "—" : value.toLocaleString();
  const glanceMetrics = metrics.length ? metrics.slice(0, 2) : difficulty.slice(0, 2);

  return (
    <article
      className={`home-platform-card ${isOpen ? "is-open" : ""}`}
      style={{ "--platform-accent": accent }}
    >
      <div className="platform-flip-shell">
        <div className={`platform-card-inner ${isOpen ? "is-turned" : ""}`}>
          <div className="home-platform-face home-platform-front">
            <header className="home-platform-card-head">
              <img src={`https://cdn.simpleicons.org/${platform.logo}/${accent.replace("#", "")}`} alt="" loading="lazy" />
              <div><strong>{platform.name}</strong><small>{handle ? `@${handle}` : "Connect profile in settings"}</small></div>
              <span className="platform-signal" aria-label={handle ? "Profile connected" : "Profile not connected"} />
            </header>
            <div className="home-platform-primary">
              <strong>{primaryValue ?? "—"}</strong>
              <span>{primaryLabel}</span>
            </div>
            <div className="home-platform-glance">
              {glanceMetrics.map(({ label, value }) => (
                <span key={label}><small>{label}</small><strong>{value ?? "—"}</strong></span>
              ))}
              {glanceMetrics.length === 1 && <span><small>Profile</small><strong>{handle ? "Connected" : "Pending"}</strong></span>}
            </div>
            <button
              className="platform-detail-toggle"
              type="button"
              aria-expanded={isOpen}
              aria-controls={`platform-details-${id}`}
              onClick={() => onToggle(id)}
            >Flip for breakdown<span aria-hidden="true">↗</span></button>
          </div>

          <div className="home-platform-face home-platform-back" id={`platform-details-${id}`}>
            <div className="home-platform-back-heading"><span>{platform.name}</span><small>{breakdownLabel}</small></div>
            <div className="home-platform-difficulty">
              {difficulty.map(({ label, value }) => (
                <span className="home-platform-difficulty-row" key={label}>
                  <span><i />{label}</span>
                  <strong>{showDifficulty(value)}</strong>
                </span>
              ))}
            </div>
            {metrics.length > 2 && (
              <div className="home-platform-metrics">
                {metrics.slice(2).map(({ label, value }) => (
                  <span key={label}><small>{label}</small><strong>{value ?? "—"}</strong></span>
                ))}
              </div>
            )}
            <p className="home-platform-footnote">{note}</p>
            <button className="platform-detail-toggle" type="button" aria-expanded={isOpen} onClick={() => onToggle(id)}>Return to summary<span aria-hidden="true">↙</span></button>
          </div>
        </div>
      </div>
    </article>
  );
}

export function DashboardPage() {
  const { profile, growthStats } = useAppContext();
  const [openPlatformCards, setOpenPlatformCards] = useState(() => new Set());
  const togglePlatformCard = (id) => setOpenPlatformCards((open) => {
    const next = new Set(open);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  });
  const leetcode = growthStats.leetcode ?? {};
  const codeforces = growthStats.codeforces ?? {};
  const codechef = growthStats.codechef ?? {};
  const geeksforgeeks = growthStats.geeksforgeeks ?? {};
  const github = growthStats.github ?? {};
  const recentLogs = growthStats.recentLogs ?? [];
  const loggedDifficulty = (platform, difficulty) => {
    const normalizedPlatform = platform.toLowerCase();
    const normalizedDifficulty = difficulty.toLowerCase();
    const count = recentLogs
      .filter((log) => log.platform?.toLowerCase() === normalizedPlatform && log.difficulty?.toLowerCase() === normalizedDifficulty)
      .reduce((sum, log) => sum + (Number(log.problemsSolved) || 1), 0);
    return count || null;
  };
  const needsAttention = growthStats.streakAtRisk || growthStats.streakBroken;
  const monthlyActivity = growthStats.monthlyActivity ?? [];
  const today = new Date();
  const dayKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  const dateOffset = (daysAgo) => {
    const date = new Date(today);
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - daysAgo);
    return dayKey(date);
  };
  const dayRows = new Map(monthlyActivity.filter((day) => day.date).map((day) => [day.date, {
    activity: Number(day.count) || 0,
    problems: Number(day.problemCount ?? day.count) || 0,
  }]));
  const activityInRange = (start, end) => [...dayRows]
    .filter(([date]) => date >= start && date <= end)
    .map(([, count]) => count);
  const last28Days = activityInRange(dateOffset(27), dateOffset(0));
  const last7Days = activityInRange(dateOffset(6), dateOffset(0));
  const previous7Days = activityInRange(dateOffset(13), dateOffset(7));
  const activeDaysLast28 = last28Days.filter((day) => day.activity > 0).length;
  const problemDaysLast28 = last28Days.filter((day) => day.problems > 0).length;
  const problemsLast28 = last28Days.reduce((sum, day) => sum + day.problems, 0);
  const solvedLast7 = last7Days.reduce((sum, day) => sum + day.problems, 0);
  const solvedPrevious7 = previous7Days.reduce((sum, day) => sum + day.problems, 0);
  const weeklyDifference = solvedLast7 - solvedPrevious7;
  const weeklyComparison = weeklyDifference > 0
    ? `+${weeklyDifference} vs previous 7 days`
    : weeklyDifference < 0
      ? `${weeklyDifference} vs previous 7 days`
      : "No change vs previous 7 days";
  const difficultyTotals = growthStats.difficultyTotals ?? {
    easy: leetcode.easy ?? 0,
    medium: leetcode.medium ?? 0,
    hard: leetcode.hard ?? 0,
    unclassified: Math.max(0, (growthStats.totalProblemsSolved ?? 0) - (leetcode.solved ?? 0)),
  };
  const difficultyCounts = {
    easy: Number(difficultyTotals.easy) || 0,
    medium: Number(difficultyTotals.medium) || 0,
    hard: Number(difficultyTotals.hard) || 0,
    unclassified: Number(difficultyTotals.unclassified) || 0,
  };
  const classifiedProblems = difficultyCounts.easy + difficultyCounts.medium + difficultyCounts.hard;
  const difficultyPercent = (count) => classifiedProblems ? Math.round((count / classifiedProblems) * 100) : 0;
  const last14Days = Array.from({ length: 14 }, (_, index) => {
    const date = dateOffset(13 - index);
    const row = dayRows.get(date) ?? { activity: 0, problems: 0 };
    return { date, ...row };
  });
  const chartMax = Math.max(1, ...last14Days.map((day) => day.problems));
  const chartPoints = last14Days.map((day, index) => ({
    ...day,
    x: 30 + index * (660 / 13),
    y: 126 - (day.problems / chartMax) * 96,
  }));
  const chartLine = chartPoints.map((point, index) => `${index ? "L" : "M"}${point.x},${point.y}`).join(" ");
  const chartArea = `${chartLine} L690,138 L30,138 Z`;
  const maxActivity = Math.max(1, ...last14Days.map((day) => day.activity));
  const total14Days = last14Days.reduce((sum, day) => sum + day.problems, 0);
  const active14Days = last14Days.filter((day) => day.activity > 0).length;

  return (
    <main className="page-content dashboard-page home-dashboard">
      <section className="rhythm-masthead" aria-labelledby="home-streak-title">
        <div className="rhythm-intro">
          <div className="rhythm-kickers">
            <span className="rhythm-kicker">DEV / RHYTHM — 01</span>
            <span className="rhythm-kicker-muted">CADENCE: {needsAttention ? "NEEDS ATTENTION" : "IN RHYTHM"}</span>
            <span className="rhythm-kicker-muted">PRACTICE DATA · 5 PLATFORMS</span>
          </div>
          <h1 id="home-streak-title">Your practice.<br /><em>In full view.</em></h1>
          <p>
            {growthStats.streakBroken
              ? "Your last streak has ended. Every new session is a chance to set the next rhythm."
              : growthStats.streakAtRisk
                ? "Your streak is waiting on today. A small session is enough to keep the rhythm alive."
              : "Problems, contests, and commits—brought into one clear view."}
          </p>
          <span className={`rhythm-status ${needsAttention ? "is-attention" : ""}`}>
            <i aria-hidden="true" />{growthStats.streakBroken ? "STREAK RESET · START A NEW RUN TODAY" : growthStats.streakAtRisk ? "TODAY KEEPS YOUR RUN ALIVE" : "PRACTICE RECORDED TODAY"}
          </span>
        </div>
        <div className="rhythm-hero-metrics" aria-label="Developer rhythm summary">
          <article className="rhythm-metric rhythm-metric-ink">
            <span>{growthStats.streakBroken ? "LAST STREAK" : "CURRENT STREAK"}</span><strong>{growthStats.currentStreak ?? 0}<small>d</small></strong>
            <small>PERSONAL BEST · {growthStats.longestStreak ?? 0} DAYS</small>
          </article>
          <article className="rhythm-metric">
            <span>WEEKLY VELOCITY</span><strong>{(solvedLast7 / 7).toFixed(1)}<small>/d</small></strong>
            <small>{solvedLast7} SOLVED · LAST 7 DAYS</small>
          </article>
          <article className="rhythm-metric">
            <span>CONSISTENCY</span><strong>{Math.round((activeDaysLast28 / 28) * 100)}<small>%</small></strong>
            <small>{activeDaysLast28} ACTIVE DAYS · 28D</small>
          </article>
          <article className="rhythm-metric rhythm-metric-dark">
            <span>TOTAL SOLVED</span><strong>{growthStats.totalProblemsSolved ?? 0}</strong>
            <small>ACROSS CONNECTED PLATFORMS</small>
          </article>
        </div>
      </section>

      <section className="practice-trend-section" aria-labelledby="practice-trend-title">
        <header className="practice-trend-heading">
          <div><span className="home-section-kicker">THE LAST TWO WEEKS</span><h2 id="practice-trend-title">A rhythm you can see</h2></div>
          <div className="trend-summary"><strong>{total14Days}</strong><span>problems<br />{active14Days} active days</span></div>
        </header>
        <div className="practice-trend-grid">
          <div className="practice-line-chart">
            <svg viewBox="0 0 720 166" role="img" aria-label={`Daily problems solved over the last 14 days. ${total14Days} total problems across ${active14Days} active days.`}>
              <defs><linearGradient id="practice-area-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="var(--accent)" stopOpacity="0.27" /><stop offset="100%" stopColor="var(--accent)" stopOpacity="0" /></linearGradient></defs>
              {[30, 62, 94, 126].map((y) => <line key={y} x1="30" x2="690" y1={y} y2={y} className="chart-gridline" />)}
              <path d={chartArea} fill="url(#practice-area-fill)" />
              <path d={chartLine} className="chart-line" />
              {chartPoints.map((point, index) => (
                <g key={point.date} className="chart-point">
                  <circle cx={point.x} cy={point.y} r={point.problems ? 3.2 : 2} />
                  <title>{`${point.date}: ${point.problems} problems`}</title>
                  {index % 3 === 0 && <text x={point.x} y="157" textAnchor="middle">{point.date.slice(5)}</text>}
                </g>
              ))}
            </svg>
            <div className="chart-legend"><span><i /> PROBLEMS SOLVED / DAY</span><span>DAILY COUNT · LOCAL HISTORY</span></div>
          </div>
          <aside className="activity-heatmap-card" aria-label="Practice activity in the last 14 days">
            <div className="activity-heatmap-heading">
              <span className="home-section-kicker">PRACTICE PULSE <small>· 14 DAYS</small></span>
              <strong>{active14Days}<small>/14</small></strong>
            </div>
            <div className="activity-heatmap-grid">
              {last14Days.map((day) => {
                const level = day.activity ? Math.max(1, Math.ceil((day.activity / maxActivity) * 4)) : 0;
                return (
                  <span
                    key={day.date}
                    className={`activity-heatmap-cell level-${level}`}
                    title={`${day.date}: ${day.problems} problems, ${day.activity} activity events`}
                    aria-label={`${day.date}: ${day.problems} problems`}
                  />
                );
              })}
            </div>
            <div className="activity-heatmap-legend"><span>QUIET</span><i /><i /><i /><i /><span>ACTIVE</span></div>
            <p>{total14Days} problems solved across {active14Days} active days.</p>
          </aside>
        </div>
      </section>

      <section className="rhythm-workspace" aria-label="Practice activity and telemetry">
        <div className="rhythm-skyline-column">
          <div className="rhythm-section-bar">
            <div><i aria-hidden="true" /><span>ACTIVITY FIELD <small>// LAST 365 DAYS</small></span></div>
            <span className="rhythm-control-hint">DRAG TO ORBIT · HOVER TO INSPECT</span>
          </div>
          <ContributionSkyline
            endDate={new Date()}
            title={<span className="home-skyline-title"><GitCommit size={15} /> Contribution skyline</span>}
            palette={["#d8d8d4", "#a3aaa5", "#545d57", "#111111"]}
            defaultView="3d"
            defaultYaw={24}
            zoom={1}
            maxHeight={300}
            className="home-skyline-panel"
          />
          <div className="rhythm-chart-caption">
            <span>ONE DAY AT A TIME, EVERY SESSION ADDS HEIGHT.</span>
            <span>28D ACTIVE <strong>{activeDaysLast28}/28</strong></span>
          </div>
        </div>

        <aside className="rhythm-sidecar" aria-label="Practice telemetry">
          <div className="rhythm-sidecar-head">
            <div><span className="rhythm-kicker">LIVE READOUT</span><h2>Practice signal</h2></div>
            <span className="rhythm-live-mark"><i aria-hidden="true" />LIVE</span>
          </div>
          <div className="rhythm-sidecar-feature">
            <span>WEEK-OVER-WEEK MOMENTUM</span>
            <strong>{weeklyDifference > 0 ? "+" : ""}{weeklyDifference}<small> problems</small></strong>
            <p>{weeklyComparison}</p>
          </div>
          <div className="rhythm-distribution">
            <div className="rhythm-distribution-title"><span>DIFFICULTY MIX</span><small>{classifiedProblems} RATED</small></div>
            <div className="home-difficulty-bar" role="img" aria-label={`Difficulty distribution: ${difficultyCounts.easy} easy, ${difficultyCounts.medium} medium, ${difficultyCounts.hard} hard`}>
              <span className="is-easy" style={{ width: `${difficultyPercent(difficultyCounts.easy)}%` }} />
              <span className="is-medium" style={{ width: `${difficultyPercent(difficultyCounts.medium)}%` }} />
              <span className="is-hard" style={{ width: `${difficultyPercent(difficultyCounts.hard)}%` }} />
            </div>
            <div className="rhythm-distribution-legend">
              <span><i className="is-easy" />Easy <strong>{difficultyCounts.easy}</strong></span>
              <span><i className="is-medium" />Medium <strong>{difficultyCounts.medium}</strong></span>
              <span><i className="is-hard" />Hard <strong>{difficultyCounts.hard}</strong></span>
            </div>
          </div>
          <div className="rhythm-recent">
            <div className="rhythm-recent-title"><span>RECENT SESSIONS</span><span>{recentLogs.length} LOGGED</span></div>
            {recentLogs.length ? recentLogs.slice(0, 3).map((log, index) => (
              <div className="rhythm-log-row" key={log.id ?? `${log.date}-${index}`}>
                <i aria-hidden="true" />
                <span><strong>{log.platform || "Practice"}</strong><small>{log.notes || `${log.difficulty || "Coding"} session`}</small></span>
                <b>+{Number(log.problemsSolved) || 1}</b>
              </div>
            )) : <p className="rhythm-empty-log">Your next session will appear here.</p>}
          </div>
          <div className="rhythm-narration">{activeDaysLast28} active practice days in the last 28.</div>
        </aside>
      </section>

      <section className="home-practice-section" aria-labelledby="home-statistics-title">
        <div className="home-section-heading">
          <div>
            <span className="home-section-kicker"><Award size={14} /> Streak &amp; practice</span>
            <h2 id="home-statistics-title">Practice statistics</h2>
          </div>
        </div>

        <div className="home-stats-grid">
          <HomeStat icon={Code2} label="Problems solved" value={growthStats.totalProblemsSolved ?? 0} detail="Across connected platforms" />
          <HomeStat icon={CalendarDays} label="Active practice days" value={`${activeDaysLast28}/28`} detail="Across platforms · last 28 days" tint="#86efac" />
          <HomeStat icon={TrendingUp} label="Problems · last 7 days" value={solvedLast7} detail={weeklyComparison} tint="#91c7fa" />
          <HomeStat
            icon={Activity}
            label="Daily average"
            value={problemDaysLast28 ? (problemsLast28 / problemDaysLast28).toFixed(1) : "0.0"}
            detail="Problems per active problem-solving day · last 28 days"
            tint="#fbbf24"
          />
          <HomeStat
            icon={BarChart3}
            label="Difficulty breakdown"
            content={(
              <div className="home-difficulty-content">
                <div
                  className="home-difficulty-bar"
                  role="img"
                  aria-label={`Difficulty distribution: ${difficultyCounts.easy} easy, ${difficultyCounts.medium} medium, ${difficultyCounts.hard} hard`}
                >
                  <span className="is-easy" style={{ width: `${difficultyPercent(difficultyCounts.easy)}%` }} />
                  <span className="is-medium" style={{ width: `${difficultyPercent(difficultyCounts.medium)}%` }} />
                  <span className="is-hard" style={{ width: `${difficultyPercent(difficultyCounts.hard)}%` }} />
                </div>
                <div className="home-difficulty-legend">
                  <span><i className="is-easy" /><small>Easy</small><strong>{difficultyCounts.easy}</strong><em>{difficultyPercent(difficultyCounts.easy)}%</em></span>
                  <span><i className="is-medium" /><small>Medium</small><strong>{difficultyCounts.medium}</strong><em>{difficultyPercent(difficultyCounts.medium)}%</em></span>
                  <span><i className="is-hard" /><small>Hard</small><strong>{difficultyCounts.hard}</strong><em>{difficultyPercent(difficultyCounts.hard)}%</em></span>
                  <span className="is-unrated"><i /><small>Unrated</small><strong>{difficultyCounts.unclassified}</strong><em>—</em></span>
                </div>
              </div>
            )}
            detail="Share of rated problem logs · across connected platforms"
            tint="#c4b5fd"
          />
        </div>

        <div className="home-platform-area">
          <div className="home-section-heading home-platform-heading">
            <div>
              <span className="home-section-kicker">Connected platforms</span>
              <h2>Platform statistics</h2>
            </div>
          </div>
          <div className="home-platform-grid">
          <PlatformCard
            id="leetcode"
            isOpen={openPlatformCards.has("leetcode")}
            onToggle={togglePlatformCard}
            platform={{ name: "LeetCode", logo: "leetcode" }}
            handle={profile.platformHandles?.leetcode}
            accent="#171717"
            primaryValue={leetcode.solved}
            primaryLabel="problems solved"
            difficulty={[
              { label: "Easy", value: leetcode.easy, color: "#4ade80" },
              { label: "Medium", value: leetcode.medium, color: "#fbbf24" },
              { label: "Hard", value: leetcode.hard, color: "#fb7185" },
            ]}
            metrics={[{ label: "Global rank", value: leetcode.ranking ? `Top ${Math.round(leetcode.ranking / 1000)}k` : "—" }]}
            note="Difficulty and global ranking from your LeetCode profile."
          />

          <PlatformCard
            id="codeforces"
            isOpen={openPlatformCards.has("codeforces")}
            onToggle={togglePlatformCard}
            platform={{ name: "Codeforces", logo: "codeforces" }}
            handle={profile.platformHandles?.codeforces}
            accent="#171717"
            primaryValue={codeforces.solved}
            primaryLabel="problems solved"
            difficulty={[
              { label: "Easy", value: loggedDifficulty("Codeforces", "Easy"), color: "#4ade80" },
              { label: "Medium", value: loggedDifficulty("Codeforces", "Medium"), color: "#fbbf24" },
              { label: "Hard", value: loggedDifficulty("Codeforces", "Hard"), color: "#fb7185" },
            ]}
            metrics={[
              { label: "Rating", value: codeforces.rating },
              { label: "Rank", value: codeforces.rank },
              { label: "Contests", value: codeforces.contests },
            ]}
            note="Difficulty counts reflect logged sessions; rating and rank are platform-specific."
          />

          <PlatformCard
            id="codechef"
            isOpen={openPlatformCards.has("codechef")}
            onToggle={togglePlatformCard}
            platform={{ name: "CodeChef", logo: "codechef" }}
            handle={profile.platformHandles?.codechef}
            accent="#171717"
            primaryValue={codechef.solved}
            primaryLabel="problems solved"
            difficulty={[
              { label: "Easy", value: loggedDifficulty("CodeChef", "Easy"), color: "#4ade80" },
              { label: "Medium", value: loggedDifficulty("CodeChef", "Medium"), color: "#fbbf24" },
              { label: "Hard", value: loggedDifficulty("CodeChef", "Hard"), color: "#fb7185" },
            ]}
            metrics={[
              { label: "Rating", value: codechef.rating },
              { label: "Stars", value: codechef.stars },
              { label: "Contests", value: codechef.contests },
            ]}
            note={profile.platformHandles?.codechef ? "Stats appear when CodeChef profile sync is available." : "Add your CodeChef handle in Settings to connect this profile."}
          />

          <PlatformCard
            id="geeksforgeeks"
            isOpen={openPlatformCards.has("geeksforgeeks")}
            onToggle={togglePlatformCard}
            platform={{ name: "GeeksforGeeks", logo: "geeksforgeeks" }}
            handle={profile.platformHandles?.geeksforgeeks}
            accent="#171717"
            primaryValue={geeksforgeeks.solved}
            primaryLabel="problems solved"
            difficulty={[
              { label: "Easy", value: loggedDifficulty("GeeksforGeeks", "Easy"), color: "#4ade80" },
              { label: "Medium", value: loggedDifficulty("GeeksforGeeks", "Medium"), color: "#fbbf24" },
              { label: "Hard", value: loggedDifficulty("GeeksforGeeks", "Hard"), color: "#fb7185" },
            ]}
            metrics={[
              { label: "Coding score", value: geeksforgeeks.score },
              { label: "Institute rank", value: geeksforgeeks.instituteRank },
            ]}
            note={profile.platformHandles?.geeksforgeeks ? "Difficulty mix uses your logged sessions." : "Add your GeeksforGeeks handle in Settings to connect this profile."}
          />

          <PlatformCard
            id="github"
            isOpen={openPlatformCards.has("github")}
            onToggle={togglePlatformCard}
            platform={{ name: "GitHub", logo: "github" }}
            handle={profile.platformHandles?.github}
            accent="#171717"
            primaryValue={github.contributions}
            primaryLabel="contributions"
            difficulty={[
              { label: "Repositories", value: github.repos, color: "#8b949e" },
              { label: "Activity streak", value: github.streak == null ? null : github.streak + " days", color: "#8b949e" },
            ]}
            breakdownLabel="Open-source activity"
            note="Contribution total, public repositories, and your activity streak."
          />
          </div>
        </div>
      </section>
    </main>
  );
}
