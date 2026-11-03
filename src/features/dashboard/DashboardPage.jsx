import { Award, Code2, Flame, GitCommit, Shield, Terminal } from "lucide-react";
import { useAppContext } from "../../shared/context/AppContext.jsx";
import BorderGlow from "../../components/ui/BorderGlow.jsx";
import ContributionSkyline from "../../components/ui/contribution-skyline.jsx";

const glowColors = ["#38bdf8", "#22d3ee", "#a3e635"];

function HomeStat({ icon: Icon, label, value, detail, tint = "#7dd3fc" }) {
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
        <strong>{value}</strong>
        <small>{detail}</small>
      </article>
    </BorderGlow>
  );
}

function PlatformCard({ icon: Icon, name, handle, accent, children }) {
  return (
    <BorderGlow
      className="home-platform-glow"
      edgeSensitivity={30}
      glowColor="190 95 65"
      backgroundColor="#0d1114"
      borderRadius={15}
      glowRadius={24}
      glowIntensity={0.7}
      coneSpread={25}
      animated={false}
      colors={glowColors}
    >
      <article className="home-platform-card">
        <header className="home-platform-header">
          <span className="home-platform-icon" style={{ color: accent }}><Icon size={18} /></span>
          <div>
            <h3>{name}</h3>
            {handle && <small>@{handle}</small>}
          </div>
          <span className="home-platform-dot" style={{ background: accent }} />
        </header>
        {children}
      </article>
    </BorderGlow>
  );
}

export function DashboardPage() {
  const { profile, growthStats, logCodingActivity, useStreakFreeze } = useAppContext();
  const leetcode = growthStats.leetcode ?? {};
  const codeforces = growthStats.codeforces ?? {};
  const github = growthStats.github ?? {};
  const totalLeetCode = Math.max(leetcode.solved ?? 0, 1);
  const easyPct = Math.round(((leetcode.easy ?? 0) / totalLeetCode) * 100);
  const mediumPct = Math.round(((leetcode.medium ?? 0) / totalLeetCode) * 100);
  const hardPct = Math.round(((leetcode.hard ?? 0) / totalLeetCode) * 100);
  const needsAttention = growthStats.streakAtRisk || growthStats.streakBroken;

  const logPractice = () => {
    logCodingActivity({
      platform: "LeetCode",
      problemsSolved: 1,
      notes: "Daily practice",
      difficulty: "Medium",
      category: "Algorithms & DSA",
    });
  };

  return (
    <main className="page-content dashboard-page home-dashboard">
      <section className={`home-streak-section ${needsAttention ? "is-at-risk" : ""}`} aria-labelledby="home-streak-title">
        <div className="home-streak-copy">
          <span className="home-section-kicker"><Flame size={14} /> Your coding rhythm</span>
          <h1 id="home-streak-title">Your streak</h1>
          <p>
            {growthStats.streakBroken
              ? "Your streak needs a fresh start. Log today’s practice to begin again."
              : growthStats.streakAtRisk
                ? "Log a practice session today to keep your streak alive."
                : "You’re keeping a steady pace. Keep showing up, one day at a time."}
          </p>
        </div>
        <div className="home-streak-total" aria-label={`${growthStats.currentStreak} day current streak`}>
          <strong>{growthStats.currentStreak ?? 0}</strong>
          <span>day streak</span>
        </div>
        <div className="home-streak-actions">
          <div className="home-streak-best">
            <span>Personal best</span>
            <strong>{growthStats.longestStreak ?? 0} days</strong>
          </div>
          {needsAttention && (growthStats.streakFreezesAvailable ?? 0) > 0 && (
            <button className="button button-secondary button-sm" onClick={useStreakFreeze} type="button">
              <Shield size={14} /> Use freeze ({growthStats.streakFreezesAvailable})
            </button>
          )}
          <button className="button button-primary" onClick={logPractice} type="button">
            <Flame size={16} /> Log today’s practice
          </button>
        </div>
      </section>

      <section className="home-activity-section" aria-labelledby="home-activity-title">
        <div className="home-section-heading">
          <div>
            <span className="home-section-kicker"><Code2 size={14} /> Activity landscape</span>
            <h2 id="home-activity-title">Your year in code</h2>
          </div>
          <span className="home-section-caption">Practice, commits, and consistency</span>
        </div>
        <BorderGlow
          className="home-skyline-glow"
          edgeSensitivity={30}
          glowColor="190 95 65"
          backgroundColor="rgba(6, 14, 18, 0.74)"
          borderRadius={15}
          glowRadius={24}
          glowIntensity={0.7}
          coneSpread={25}
          animated={false}
          colors={glowColors}
        >
          <ContributionSkyline
            endDate={new Date()}
            title={<span className="home-skyline-title"><GitCommit size={16} /> 3D contribution heatmap</span>}
            palette={["#173b2a", "#16803d", "#36c56a", "#8cf0ad"]}
            defaultView="3d"
            defaultYaw={24}
            zoom={1}
            statScale={0.72}
            maxHeight={480}
            className="home-skyline-panel"
          />
        </BorderGlow>
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
          <HomeStat icon={Terminal} label="Codeforces rating" value={codeforces.rating ?? 0} detail={`${codeforces.rank ?? "Unranked"} · ${codeforces.contests ?? 0} contests`} tint="#91c7fa" />
          <HomeStat icon={GitCommit} label="GitHub contributions" value={github.contributions ?? 0} detail={`${github.repos ?? 0} active repositories`} tint="#a78bfa" />
        </div>

        <div className="home-section-heading home-platform-heading">
          <div>
            <span className="home-section-kicker">Connected platforms</span>
            <h2>Platform statistics</h2>
          </div>
        </div>

        <div className="home-platform-grid">
          <PlatformCard
            icon={Code2}
            name="LeetCode"
            handle={profile.platformHandles?.leetcode}
            accent="#f6b34b"
          >
            <div className="home-platform-total"><strong>{leetcode.solved ?? 0}</strong><span>problems solved</span></div>
            <div className="difficulty-list">
              <div className="difficulty-row"><span>Easy</span><strong>{leetcode.easy ?? 0}</strong><div><i style={{ width: `${easyPct}%`, background: "#4ade80" }} /></div></div>
              <div className="difficulty-row"><span>Medium</span><strong>{leetcode.medium ?? 0}</strong><div><i style={{ width: `${mediumPct}%`, background: "#fbbf24" }} /></div></div>
              <div className="difficulty-row"><span>Hard</span><strong>{leetcode.hard ?? 0}</strong><div><i style={{ width: `${hardPct}%`, background: "#fb7185" }} /></div></div>
            </div>
            <p className="home-platform-footnote">Global rank · {leetcode.ranking ? `Top ${Math.round(leetcode.ranking / 1000)}k` : "Connect your profile"}</p>
          </PlatformCard>

          <PlatformCard
            icon={Terminal}
            name="Codeforces"
            handle={profile.platformHandles?.codeforces}
            accent="#60a5fa"
          >
            <div className="home-platform-total"><strong>{codeforces.rating ?? 0}</strong><span>current rating</span></div>
            <div className="home-platform-pairs">
              <div><span>Rank</span><strong>{codeforces.rank ?? "Unranked"}</strong></div>
              <div><span>Problems solved</span><strong>{codeforces.solved ?? 0}</strong></div>
              <div><span>Contests</span><strong>{codeforces.contests ?? 0}</strong></div>
            </div>
            <p className="home-platform-footnote">Competitive programming profile</p>
          </PlatformCard>

          <PlatformCard
            icon={GitCommit}
            name="GitHub"
            handle={profile.platformHandles?.github}
            accent="#c4a7ff"
          >
            <div className="home-platform-total"><strong>{github.contributions ?? 0}</strong><span>contributions</span></div>
            <div className="home-platform-pairs">
              <div><span>Repositories</span><strong>{github.repos ?? 0}</strong></div>
              <div><span>Current streak</span><strong>{github.streak ?? 0} days</strong></div>
            </div>
            <p className="home-platform-footnote">Open source and project activity</p>
          </PlatformCard>
        </div>
      </section>
    </main>
  );
}
