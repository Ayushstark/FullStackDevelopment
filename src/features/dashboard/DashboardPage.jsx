import { Activity, Award, BarChart3, CalendarDays, Code2, Flame, GitCommit, TrendingUp } from "lucide-react";
import { useAppContext } from "../../shared/context/AppContext.jsx";
import BorderGlow from "../../components/ui/BorderGlow.jsx";
import ContributionSkyline from "../../components/ui/contribution-skyline.jsx";
import { useState } from "react";

const glowColors = ["#38bdf8", "#22d3ee", "#a3e635"];

function HomeStat({ icon: Icon, label, value, detail, content, tint = "#7dd3fc" }) {
  return (
    <BorderGlow
      className="home-stat-glow"
      edgeSensitivity={30}
      glowColor="190 95 65"
      backgroundColor="#0d1114"
      borderRadius={14}
      glowRadius={24}
      glowIntensity={0.7}
      coneSpread={25}
      animated={false}
      colors={glowColors}
    >
      <article className="home-stat-card">
        <span className="home-stat-icon" style={{ color: tint }}><Icon size={17} /></span>
        <span className="home-stat-label">{label}</span>
        {content ?? <strong>{value}</strong>}
        <small>{detail}</small>
      </article>
    </BorderGlow>
  );
}

function PlatformCard({ id, platform, handle, accent, primaryValue, primaryLabel, difficulty, breakdownLabel = "Difficulty breakdown", metrics = [], note, isFlipped, isFrozen, onTogglePin, onPreview }) {
  const showDifficulty = (value) => value == null ? "—" : value.toLocaleString();

  return (
    <button
      className={"home-platform-flip " + (isFlipped ? "is-flipped" : "") + (isFrozen ? " is-frozen" : "")}
      style={{ "--platform-accent": accent }}
      type="button"
      aria-label={platform.name + " statistics" + (handle ? " for " + handle : "") + ". Hover to preview; click to pin or unpin."}
      aria-pressed={isFrozen}
      onClick={() => onTogglePin(id)}
      onMouseEnter={() => onPreview(id)}
      onFocus={() => onPreview(id)}
    >
      <span className="home-platform-card-inner">
        <span className="home-platform-face home-platform-front">
          <span className="home-platform-brand">
            <img src={"https://cdn.simpleicons.org/" + platform.logo + "/" + accent.replace("#", "")} alt="" loading="lazy" />
            <span>
              <strong>{platform.name}</strong>
              <small>{handle ? "@" + handle : "Add handle in Settings"}</small>
            </span>
          </span>
          <span className="home-platform-hint">Hover to preview · click to pin or unpin <span aria-hidden="true">↗</span></span>
        </span>

        <span className="home-platform-face home-platform-back">
          <span className="home-platform-back-heading">
            <span>{platform.name}</span>
            <small>{handle ? "@" + handle : "Profile not connected"}</small>
          </span>
          <span className="home-platform-total"><strong>{primaryValue ?? "—"}</strong><span>{primaryLabel}</span></span>
          <span className="home-platform-difficulty" aria-label={breakdownLabel}>
            <span className="home-platform-breakdown-title">{breakdownLabel}</span>
            {difficulty.map(({ label, value, color }) => (
              <span className="home-platform-difficulty-row" key={label}>
                <span><i style={{ background: color }} />{label}</span>
                <strong>{showDifficulty(value)}</strong>
              </span>
            ))}
          </span>
          {metrics.length > 0 && (
            <span className="home-platform-metrics">
              {metrics.map(({ label, value }) => (
                <span key={label}><small>{label}</small><strong>{value ?? "—"}</strong></span>
              ))}
            </span>
          )}
          <span className="home-platform-footnote">{note}</span>
        </span>
      </span>
    </button>
  );
}

export function DashboardPage() {
  const { profile, growthStats } = useAppContext();
  const [openPlatformCards, setOpenPlatformCards] = useState(() => new Set());
  const [pinnedPlatformCards, setPinnedPlatformCards] = useState(() => new Set());
  const previewPlatformCard = (id) => {
    if (pinnedPlatformCards.has(id)) return;
    setOpenPlatformCards((open) => new Set(open).add(id));
  };
  const togglePlatformCardPin = (id) => {
    const nextPinned = new Set(pinnedPlatformCards);
    const nextOpen = new Set(openPlatformCards);
    if (nextPinned.has(id)) {
      nextPinned.delete(id);
      nextOpen.delete(id);
    } else {
      nextPinned.add(id);
      nextOpen.add(id);
    }
    setPinnedPlatformCards(nextPinned);
    setOpenPlatformCards(nextOpen);
  };
  const closeUnpinnedPlatformCards = () => {
    setOpenPlatformCards(new Set(pinnedPlatformCards));
  };
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

  return (
    <main className="page-content dashboard-page home-dashboard">
      <section className={`home-streak-section ${needsAttention ? "is-at-risk" : ""}`} aria-labelledby="home-streak-title">
        <div className="home-streak-copy">
          <span className="home-section-kicker"><Flame size={14} /> Your coding rhythm</span>
          <h1 id="home-streak-title">Your streak</h1>
          <p>
            {growthStats.streakBroken
              ? "Your previous run has ended. Your longest run is still here to beat."
              : growthStats.streakAtRisk
                ? "Your current run is ready for its next active day."
                : "A steady rhythm is built one active day at a time."}
          </p>
        </div>
        <div className="home-streak-stats" aria-label="Streak statistics">
          <div className="home-streak-stat is-current" aria-label={`${growthStats.currentStreak ?? 0} day current streak`}>
            <span>Current streak</span>
            <div><strong>{growthStats.currentStreak ?? 0}</strong><small>days</small></div>
          </div>
          <div className="home-streak-stat" aria-label={`${growthStats.longestStreak ?? 0} day longest streak`}>
            <span>Longest streak</span>
            <div><strong>{growthStats.longestStreak ?? 0}</strong><small>days</small></div>
          </div>
        </div>
      </section>

      <section className="home-activity-section" aria-label="Contribution heatmap">
        <ContributionSkyline
          endDate={new Date()}
          title={<span className="home-skyline-title"><GitCommit size={16} /> 3D contribution heatmap</span>}
          palette={["#173b2a", "#16803d", "#36c56a", "#8cf0ad"]}
          defaultView="3d"
          defaultYaw={24}
          zoom={1}
          maxHeight={360}
          className="home-skyline-panel"
        />
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

        <div className="home-platform-area" onMouseLeave={closeUnpinnedPlatformCards}>
          <div className="home-section-heading home-platform-heading">
            <div>
              <span className="home-section-kicker">Connected platforms</span>
              <h2>Platform statistics</h2>
            </div>
          </div>
          <div className="home-platform-grid">
          <PlatformCard
            id="leetcode"
            isFlipped={openPlatformCards.has("leetcode")}
            isFrozen={pinnedPlatformCards.has("leetcode")}
            onPreview={previewPlatformCard}
            onTogglePin={togglePlatformCardPin}
            platform={{ name: "LeetCode", logo: "leetcode" }}
            handle={profile.platformHandles?.leetcode}
            accent="#f6b34b"
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
            isFlipped={openPlatformCards.has("codeforces")}
            isFrozen={pinnedPlatformCards.has("codeforces")}
            onPreview={previewPlatformCard}
            onTogglePin={togglePlatformCardPin}
            platform={{ name: "Codeforces", logo: "codeforces" }}
            handle={profile.platformHandles?.codeforces}
            accent="#60a5fa"
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
            isFlipped={openPlatformCards.has("codechef")}
            isFrozen={pinnedPlatformCards.has("codechef")}
            onPreview={previewPlatformCard}
            onTogglePin={togglePlatformCardPin}
            platform={{ name: "CodeChef", logo: "codechef" }}
            handle={profile.platformHandles?.codechef}
            accent="#b68061"
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
            isFlipped={openPlatformCards.has("geeksforgeeks")}
            isFrozen={pinnedPlatformCards.has("geeksforgeeks")}
            onPreview={previewPlatformCard}
            onTogglePin={togglePlatformCardPin}
            platform={{ name: "GeeksforGeeks", logo: "geeksforgeeks" }}
            handle={profile.platformHandles?.geeksforgeeks}
            accent="#2f8d46"
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
            isFlipped={openPlatformCards.has("github")}
            isFrozen={pinnedPlatformCards.has("github")}
            onPreview={previewPlatformCard}
            onTogglePin={togglePlatformCardPin}
            platform={{ name: "GitHub", logo: "github" }}
            handle={profile.platformHandles?.github}
            accent="#e6edf3"
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
