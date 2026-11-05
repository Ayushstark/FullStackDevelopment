import {
  AlertTriangle,
  Award,
  Bell,
  BookOpen,
  ChefHat,
  Code2,
  Download,
  ExternalLink,
  FileSpreadsheet,
  FileText,
  Flame,
  GitCommit,
  Trophy,
  Plus,
  RotateCw,
  Search,
  Shield,
  Terminal,
  TrendingUp,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useAppContext } from "../../shared/context/AppContext.jsx";
import { streakMilestones } from "../../shared/data/sampleData.js";
import { exportLogsAsCsv, exportLogsAsJson } from "./utils/exportLogs.js";
import { PlatformAnalyticsDrawer } from "./PlatformAnalyticsDrawer.jsx";

export const MINDMAP_CONFIG = {
  view: { width: 1000, height: 760 },
  hubRadius: 70,
  platformRadius: 50,
  portRadius: 24,
  slotRadius: 210,
  branchGrowMs: 520,
  branchWidths: { start: 14, end: 4 },
  branchSamples: 28,
  platforms: [
    { id: "leetcode", color: "#38bdf8", label: "LEETCODE", short: "LC" },
    { id: "geeksforgeeks", color: "#ec4899", label: "GEEKSFORGEEKS", short: "GFG" },
    { id: "codechef", color: "#06b6d4", label: "CODECHEF", short: "CC" },
    { id: "github", color: "#f43f5e", label: "GITHUB", short: "GH" },
    { id: "codeforces", color: "#3b82f6", label: "CODEFORCES", short: "CF" },
  ],
};

function cubicPoint(points, t) {
  const inverse = 1 - t;
  return {
    x: inverse ** 3 * points.p0.x + 3 * inverse ** 2 * t * points.p1.x + 3 * inverse * t ** 2 * points.p2.x + t ** 3 * points.p3.x,
    y: inverse ** 3 * points.p0.y + 3 * inverse ** 2 * t * points.p1.y + 3 * inverse * t ** 2 * points.p2.y + t ** 3 * points.p3.y,
  };
}

export function computeLayout(config = MINDMAP_CONFIG, activePlatform = null) {
  const hub = { cx: config.view.width / 2, cy: config.view.height / 2, r: config.hubRadius, angle: -90, depth: 0 };
  const slotCount = config.platforms.length;
  const nodes = new Map([["hub", hub]]);
  const edges = new Map();
  const ports = config.platforms.map((platform, index) => {
    const angle = -90 + (index * 360) / slotCount;
    const radians = (angle * Math.PI) / 180;
    const direction = { x: Math.cos(radians), y: Math.sin(radians) };
    const cx = hub.cx + direction.x * config.slotRadius;
    const cy = hub.cy + direction.y * config.slotRadius;
    const node = { ...platform, cx, cy, r: config.platformRadius, angle, depth: 1, direction };
    nodes.set(platform.id, node);
    const dx = cx - hub.cx;
    const dy = cy - hub.cy;
    const distance = Math.hypot(dx, dy) || 1;
    const dir = { x: dx / distance, y: dy / distance };
    const start = { x: hub.cx + dir.x * hub.r, y: hub.cy + dir.y * hub.r };
    const end = { x: cx - dir.x * node.r, y: cy - dir.y * node.r };
    const edgeDistance = Math.hypot(end.x - start.x, end.y - start.y);
    edges.set(platform.id, {
      p0: start,
      p1: { x: start.x + dir.x * edgeDistance * 0.45, y: start.y + dir.y * edgeDistance * 0.45 },
      p2: { x: end.x - dir.x * edgeDistance * 0.45, y: end.y - dir.y * edgeDistance * 0.45 },
      p3: end,
      midpoint: null,
      color: platform.color,
      depth: 1,
    });
    return {
      ...platform,
      angle,
      cx,
      cy,
      r: config.portRadius,
      depth: 1,
    };
  });
  for (const edge of edges.values()) edge.midpoint = cubicPoint(edge, 0.5);
  return { nodes, edges, ports, hub: nodes.get("hub"), active: activePlatform ? nodes.get(activePlatform) : null };
}

function createTaperedBranchPath(edge, progress = 1, width = 14, tipWidth = 4, samples = 28) {
  const endT = Math.max(0, Math.min(1, progress));
  if (endT <= 0) return "";
  const left = [];
  const right = [];
  for (let index = 0; index <= samples; index += 1) {
    const t = (index / samples) * endT;
    const point = cubicPoint(edge, t);
    const before = cubicPoint(edge, Math.max(0, t - 0.002));
    const after = cubicPoint(edge, Math.min(1, t + 0.002));
    const tangentLength = Math.hypot(after.x - before.x, after.y - before.y) || 1;
    const normal = { x: -(after.y - before.y) / tangentLength, y: (after.x - before.x) / tangentLength };
    const eased = 1 - (1 - t) ** 2;
    const halfWidth = (width + (tipWidth - width) * eased) / 2;
    left.push({ x: point.x + normal.x * halfWidth, y: point.y + normal.y * halfWidth });
    right.push({ x: point.x - normal.x * halfWidth, y: point.y - normal.y * halfWidth });
  }
  const outline = [...left, ...right.reverse()];
  return `${outline.map((point, index) => `${index ? "L" : "M"}${point.x.toFixed(2)} ${point.y.toFixed(2)}`).join(" ")} Z`;
}

export function GrowthPage() {
  const {
    growthStats,
    profile,
    logCodingActivity,
    useStreakFreeze,
    rekindleStreak,
    syncCodeChefData,
    syncGfgData,
    syncLeetCodeData,
    syncGitHubData,
    syncCodeforcesData,
  } = useAppContext();

  const [timeRange, setTimeRange] = useState("Past 24 Hours");
  const [expandedPlatform, setExpandedPlatform] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [hubOpen, setHubOpen] = useState(false);
  const [drawerTab, setDrawerTab] = useState("Overview");
  const [branchProgress, setBranchProgress] = useState(1);
  const mindmapLayout = computeLayout(MINDMAP_CONFIG, expandedPlatform);
  useEffect(() => {
    if (!expandedPlatform) return undefined;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;
    let frameId;
    const start = performance.now();
    const animate = (now) => {
      const requestedSlowmo = Number(new URLSearchParams(window.location.search).get("slowmo")) || 1;
      const slowmo = Math.min(5, Math.max(1, requestedSlowmo));
      const linear = Math.min(1, (now - start) / (MINDMAP_CONFIG.branchGrowMs * slowmo));
      setBranchProgress(1 - (1 - linear) ** 3);
      if (linear < 1) frameId = window.requestAnimationFrame(animate);
    };
    frameId = window.requestAnimationFrame(animate);
    return () => window.cancelAnimationFrame(frameId);
  }, [expandedPlatform]);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);

  // Practice History Filter & Search State
  const [logSearchQuery, setLogSearchQuery] = useState("");
  const [logPlatformFilter, setLogPlatformFilter] = useState("all");
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);

  // Form State for Log Activity
  const [logPlatform, setLogPlatform] = useState("LeetCode");
  const [problemsCount, setProblemsCount] = useState(2);
  const [logNotes, setLogNotes] = useState("");
  const [difficulty, setDifficulty] = useState("Medium");
  const [category, setCategory] = useState("Algorithms & DSA");

  const leetcode = growthStats.leetcode ?? {};
  const codechef = growthStats.codechef ?? {};
  const gfg = growthStats.geeksforgeeks ?? growthStats.gfg ?? {};
  const codeforces = growthStats.codeforces ?? {};
  const github = growthStats.github ?? {};

  const handleLogSubmit = (e) => {
    e.preventDefault();
    logCodingActivity({
      platform: logPlatform,
      problemsSolved: Number(problemsCount) || 1,
      notes: logNotes,
      difficulty,
      category,
    });
    setIsLogModalOpen(false);
    setLogNotes("");
  };

  // Metrics calculations
  const totalSolved = growthStats.totalProblemsSolved || 0;
  const currentStreak = growthStats.currentStreak || 0;
  const longestStreak = growthStats.longestStreak || 0;

  const easyCount = (leetcode.easy || 0) + (gfg.easy || 0);
  const medCount = (leetcode.medium || 0) + (gfg.medium || 0);
  const hardCount = (leetcode.hard || 0) + (gfg.hard || 0);
  const totalDiff = Math.max(1, easyCount + medCount + hardCount);
  const hardPct = Math.round((hardCount / totalDiff) * 100);
  const medPct = Math.round((medCount / totalDiff) * 100);
  const easyPct = Math.max(0, 100 - hardPct - medPct);

  const lcSolved = leetcode.solved || 0;
  const gfgSolved = gfg.solved || 0;
  const ccSolved = codechef.solved || 0;
  const ghCommits = github.contributions || 0;
  const totalPlat = Math.max(1, lcSolved + gfgSolved + ccSolved + Math.round(ghCommits / 2));
  const lcShare = Math.round((lcSolved / totalPlat) * 100);
  const gfgShare = Math.round((gfgSolved / totalPlat) * 100);
  const ccShare = Math.round((ccSolved / totalPlat) * 100);

  const platformData = {
    leetcode: { id: "leetcode", title: "LeetCode", short: "LC", accent: "#f6a83b", icon: Code2, stats: leetcode, handle: profile.platformHandles?.leetcode, solved: leetcode.solved, rating: leetcode.contestRating, peak: leetcode.highestRating, rank: leetcode.ranking, practiceUrl: "https://leetcode.com/problemset/", contestUrl: "https://leetcode.com/contest/", difficulty: { easy: leetcode.easy, medium: leetcode.medium, hard: leetcode.hard } },
    geeksforgeeks: { id: "geeksforgeeks", title: "GeeksforGeeks", short: "GFG", accent: "#4ade80", icon: BookOpen, stats: gfg, handle: profile.platformHandles?.geeksforgeeks || profile.platformHandles?.gfg, solved: gfg.solved, rating: gfg.score, peak: gfg.highestScore, rank: gfg.instituteRank, practiceUrl: "https://www.geeksforgeeks.org/explore", contestUrl: "https://www.geeksforgeeks.org/events/", difficulty: { easy: gfg.easy, medium: gfg.medium, hard: gfg.hard } },
    codechef: { id: "codechef", title: "CodeChef", short: "CC", accent: "#c08457", icon: ChefHat, stats: codechef, handle: profile.platformHandles?.codechef, solved: codechef.solved, rating: codechef.rating, peak: codechef.highestRating, rank: codechef.globalRank, practiceUrl: "https://www.codechef.com/practice", contestUrl: "https://www.codechef.com/contests", difficulty: null },
    codeforces: { id: "codeforces", title: "Codeforces", short: "CF", accent: "#60a5fa", icon: Award, stats: codeforces, handle: profile.platformHandles?.codeforces, solved: codeforces.solved, rating: codeforces.rating, peak: codeforces.highestRating, rank: codeforces.rank, practiceUrl: "https://codeforces.com/problemset", contestUrl: "https://codeforces.com/contests", difficulty: null },
    github: { id: "github", title: "GitHub", short: "GH", accent: "#c084fc", icon: GitCommit, stats: github, handle: profile.platformHandles?.github, solved: github.contributions, rating: github.repos, peak: null, rank: github.followers, practiceUrl: "https://github.com/", contestUrl: null, difficulty: null },
  };
  const activePlatformData = expandedPlatform ? platformData[expandedPlatform] : null;
  const activePlatformLogs = (growthStats.recentLogs || [])
    .filter((log) => String(log.platform || "").toLowerCase().replace(/[^a-z]/g, "") === String(activePlatformData?.title || "").toLowerCase().replace(/[^a-z]/g, ""))
    .slice(0, 7)
    .reverse();
  const leastPracticedDifficulty = activePlatformData?.difficulty
    ? Object.entries(activePlatformData.difficulty).filter(([, count]) => Number.isFinite(Number(count))).sort((a, b) => Number(a[1]) - Number(b[1]))[0]?.[0]
    : null;
  const recommendation = growthStats.streakBroken || growthStats.streakAtRisk
    ? { title: "Log a short session today", reason: "Your overall streak needs attention. A small practice session can help you keep your routine moving.", action: "Log activity", kind: "log" }
    : leastPracticedDifficulty
      ? { title: `Practice more ${leastPracticedDifficulty} problems`, reason: `Your connected platform profile has fewer ${leastPracticedDifficulty} solves than the other tracked difficulties.`, action: "Practice problems", kind: "practice" }
      : { title: "Keep your profile current", reason: "Recent activity and contest history are limited for this platform. Sync its profile or record a session to add useful signals.", action: "Log activity", kind: "log" };

  const monthlyActivity = useMemo(
    () => growthStats.monthlyActivity || [],
    [growthStats.monthlyActivity]
  );
  const activeDaysCount = useMemo(
    () => monthlyActivity.filter((d) => d.count > 0).length,
    [monthlyActivity]
  );
  const consistencyRate = useMemo(
    () => (monthlyActivity.length > 0 ? Math.round((activeDaysCount / monthlyActivity.length) * 100) : 86),
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
        const matchesDifficulty = log.difficulty && log.difficulty.toLowerCase().includes(q);
        return matchesNotes || matchesPlatform || matchesCategory || matchesDifficulty;
      }
      return true;
    });
  }, [growthStats.recentLogs, logPlatformFilter, logSearchQuery]);

  const toggleExpand = (platformKey) => {
    setExpandedPlatform((prev) => (prev === platformKey ? null : platformKey));
    setDrawerTab("Overview");
    setDrawerOpen(true);
    setHubOpen(false);
  };

  return (
    <main className="page-content" style={{ padding: "16px 20px", background: "transparent" }}>
      {/* Streak Recovery Banner when broken */}
      {growthStats.streakBroken && (
        <div
          style={{
            background: "rgba(239, 68, 68, 0.12)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            borderRadius: 12,
            padding: "10px 16px",
            marginBottom: 14,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12 }}>
            <AlertTriangle size={18} color="#ef4444" />
            <span>Coding streak broken. Use a freeze shield or rekindle Day 1.</span>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {(growthStats.streakFreezesAvailable ?? 0) > 0 && (
              <button
                type="button"
                className="visual-icon-btn"
                onClick={useStreakFreeze}
                style={{ color: "#a855f7" }}
              >
                <Shield size={12} /> Use Freeze
              </button>
            )}
            <button
              type="button"
              className="visual-icon-btn"
              onClick={rekindleStreak}
              style={{ color: "#ef4444" }}
            >
              <Flame size={12} /> Rekindle
            </button>
          </div>
        </div>
      )}

      {/* Main Full-Bleed Visual Dashboard: Transparent Root with Translucent Constellation Figure */}
      <div className={`visual-root analytics-explorer${drawerOpen || hubOpen ? " has-analytics-drawer" : ""}`}>
        {/* Left Area: Full Screen Translucent Constellation Graph */}
        <div className="visual-constellation-container">
          <svg viewBox={`0 0 ${MINDMAP_CONFIG.view.width} ${MINDMAP_CONFIG.view.height}`} className="visual-constellation-svg" role="group" aria-label="Coding platform contribution mind map">
            <defs>
              {/* Outer Donut Gradient */}
              <linearGradient id="cyberDonutGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#22c55e" />
                <stop offset="50%" stopColor="#06b6d4" />
                <stop offset="100%" stopColor="#3b82f6" />
              </linearGradient>
              <linearGradient id="mindmapBranchGradient" gradientUnits="userSpaceOnUse"
                x1={mindmapLayout.hub.cx} y1={mindmapLayout.hub.cy}
                x2={mindmapLayout.active?.cx ?? mindmapLayout.hub.cx}
                y2={mindmapLayout.active?.cy ?? mindmapLayout.hub.cy}>
                <stop offset="0%" stopColor="#22c55e" />
                <stop offset="100%" stopColor={mindmapLayout.active?.color ?? "#38bdf8"} />
              </linearGradient>
              <filter id="mindmapBranchGlow" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="3" result="softGlow" />
                <feMerge><feMergeNode in="softGlow" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>

              {/* Cyan Glow Filter */}
              <filter id="glowCyan" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="5" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>

              {/* Magenta Glow Filter */}
              <filter id="glowPink" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="5" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            <g className="mindmap-world">

            {/* CENTRAL DONUT CORE (51% pulse indicator) */}
            <g className="mindmap-hub-trigger" role="button" tabIndex="0" aria-label="Open cross-platform analytics" onClick={() => { setHubOpen(true); setDrawerOpen(false); setExpandedPlatform(null); setBranchProgress(0); }} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setHubOpen(true); setDrawerOpen(false); setExpandedPlatform(null); setBranchProgress(0); } }}>
            <circle className="mindmap-core-halo" cx={mindmapLayout.hub.cx} cy={mindmapLayout.hub.cy} r={mindmapLayout.hub.r} fill="none" stroke="rgba(56, 189, 248, 0.18)" strokeWidth="2" />
            <circle className="mindmap-core-progress"
              cx={mindmapLayout.hub.cx}
              cy={mindmapLayout.hub.cy}
              r="52"
              fill="none"
              stroke="url(#cyberDonutGrad)"
              strokeWidth="12"
              strokeDasharray="327"
              strokeDashoffset={327 * (1 - 0.51)}
              strokeLinecap="round"
            />
            <circle className="mindmap-core-face" cx={mindmapLayout.hub.cx} cy={mindmapLayout.hub.cy} r="56" fill="#080b0f" stroke="rgba(255, 255, 255, 0.12)" strokeWidth="1.5" />
            <text className="mindmap-core-check" x={mindmapLayout.hub.cx} y={mindmapLayout.hub.cy - 6} textAnchor="middle" fill="#4ade80" fontSize="10" fontWeight="bold">✓</text>
            <text className="mindmap-core-value"
              x={mindmapLayout.hub.cx}
              y={mindmapLayout.hub.cy + 8}
              textAnchor="middle"
              fill="#ffffff"
              fontSize="12"
              fontWeight="800"
              fontFamily="monospace"
            >
              51%
            </text>
            </g>

            {mindmapLayout.active && (
              <g className="mindmap-platform-branch" key={expandedPlatform}>
                <g filter="url(#mindmapBranchGlow)">
                  <path d={createTaperedBranchPath(mindmapLayout.edges.get(expandedPlatform), branchProgress, MINDMAP_CONFIG.branchWidths.start, MINDMAP_CONFIG.branchWidths.end, MINDMAP_CONFIG.branchSamples)} fill="url(#mindmapBranchGradient)" opacity="0.92" />
                </g>
                {branchProgress > 0 && (() => {
                  const edge = mindmapLayout.edges.get(expandedPlatform);
                  const branchTip = cubicPoint(edge, branchProgress);
                  const tip = { x: branchTip.x + mindmapLayout.active.direction.x * MINDMAP_CONFIG.platformRadius, y: branchTip.y + mindmapLayout.active.direction.y * MINDMAP_CONFIG.platformRadius };
                  return (
                    <g className="mindmap-entering-node" transform={`translate(${tip.x} ${tip.y}) scale(${0.4 + branchProgress * 0.6})`} style={{ "--branch-color": mindmapLayout.active.color, opacity: branchProgress }} role="button" tabIndex={branchProgress >= 1 ? 0 : -1} aria-label={`Open ${mindmapLayout.active.label} analytics`} onClick={() => { if (branchProgress >= 1) { setDrawerTab("Overview"); setDrawerOpen(true); setHubOpen(false); } }} onKeyDown={(event) => { if (branchProgress >= 1 && (event.key === "Enter" || event.key === " ")) { event.preventDefault(); setDrawerTab("Overview"); setDrawerOpen(true); setHubOpen(false); } }}>
                      <circle r={mindmapLayout.active.r} fill="#0b1016" stroke={mindmapLayout.active.color} strokeWidth="4" />
                      <circle r={mindmapLayout.active.r - 9} fill="#070b10" stroke="rgba(255,255,255,.16)" />
                      <text y="5" textAnchor="middle" fill={mindmapLayout.active.color} fontSize="15" fontWeight="bold">{mindmapLayout.active.short}</text>
                      {branchProgress >= 1 && <>
                        <text y={-mindmapLayout.active.r - 15} textAnchor="middle" fill="#f8fafc" fontSize="13" fontWeight="800"><title>{mindmapLayout.active.label}</title>{mindmapLayout.active.label.length > 14 ? `${mindmapLayout.active.label.slice(0, 12)}…` : mindmapLayout.active.label}</text>
                        <text y={mindmapLayout.active.r + 20} textAnchor="middle" fill={mindmapLayout.active.color} fontSize="12">{mindmapLayout.active.id === "leetcode" ? `${lcSolved} solved` : mindmapLayout.active.id === "geeksforgeeks" ? `${gfg.score ?? 0} score` : mindmapLayout.active.id === "codechef" ? `${codechef.rating ?? 0} rating` : mindmapLayout.active.id === "github" ? `${ghCommits} contributions` : `${codeforces.rating || 0} rating`}</text>
                      </>}
                    </g>
                  );
                })()}
                {branchProgress >= 1 && (() => {
                  const midpoint = mindmapLayout.edges.get(expandedPlatform).midpoint;
                  return <g className="mindmap-remove" style={{ "--branch-color": mindmapLayout.active.color }} transform={`translate(${midpoint.x} ${midpoint.y})`} role="button" tabIndex="0" aria-label={`Close ${mindmapLayout.active.label} analytics`} onClick={() => { setExpandedPlatform(null); setDrawerOpen(false); setBranchProgress(0); }} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setExpandedPlatform(null); setDrawerOpen(false); setBranchProgress(0); } }}>
                    <circle r="15" fill="#080c10" stroke={mindmapLayout.active.color} strokeWidth="3" />
                    <text y="6" textAnchor="middle" fill={mindmapLayout.active.color} fontSize="19" fontWeight="bold">−</text>
                  </g>;
                })()}
              </g>
            )}

            {/* INTERACTIVE EXPAND BUTTONS '+' ALONG SPOKES (Exact Match to Image 2) */}
            {mindmapLayout.ports.filter((platform) => platform.id !== expandedPlatform).map((platform) => (
              <g key={platform.id} className="mindmap-plus" transform={`translate(${platform.cx}, ${platform.cy})`} onClick={() => { setBranchProgress(0); toggleExpand(platform.id); }} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setBranchProgress(0); toggleExpand(platform.id); } }} role="button" tabIndex="0" aria-label={`Open ${platform.label} analytics`} style={{ "--branch-color": platform.color, cursor: "pointer" }}>
                <circle cx="0" cy="0" r={platform.r} fill="#080c10" stroke={platform.color} strokeWidth="3" />
                <text className="mindmap-plus-glyph" x="0" y="7" fill={platform.color} fontSize="24" textAnchor="middle" fontWeight="bold">+</text>
              </g>
            ))}

              {new URLSearchParams(window.location.search).get("debug") === "1" && <g className="mindmap-debug" pointerEvents="none">
                <rect x="1" y="1" width={MINDMAP_CONFIG.view.width - 2} height={MINDMAP_CONFIG.view.height - 2} fill="none" stroke="#facc15" strokeDasharray="8 6" />
                <circle cx={mindmapLayout.hub.cx} cy={mindmapLayout.hub.cy} r={mindmapLayout.hub.r} fill="none" stroke="#facc15" />
                <text x={mindmapLayout.hub.cx + 12} y={mindmapLayout.hub.cy - 75} fill="#facc15" fontSize="12">hub ({mindmapLayout.hub.cx},{mindmapLayout.hub.cy}) r={mindmapLayout.hub.r}</text>
                {mindmapLayout.ports.map((port) => <g key={`debug-${port.id}`}>
                  <circle cx={port.cx} cy={port.cy} r={port.r} fill="none" stroke="#facc15" />
                  <text x={port.cx + 28} y={port.cy} fill="#facc15" fontSize="11">{port.label} {port.angle}°</text>
                </g>)}
                {mindmapLayout.active && (() => { const edge = mindmapLayout.edges.get(expandedPlatform); return <g>
                  <circle cx={mindmapLayout.active.cx} cy={mindmapLayout.active.cy} r={mindmapLayout.active.r} fill="none" stroke="#facc15" />
                  <circle cx={edge.p0.x} cy={edge.p0.y} r="4" fill="#22c55e" />
                  <circle cx={edge.p3.x} cy={edge.p3.y} r="4" fill="#ef4444" />
                  <text x={edge.p0.x + 6} y={edge.p0.y - 6} fill="#22c55e" fontSize="11">edge start</text>
                  <text x={edge.p3.x + 6} y={edge.p3.y - 6} fill="#ef4444" fontSize="11">edge end</text>
                </g>; })()}
              </g>}
            </g>
          </svg>


          {/* Bottom Left Legend */}
          <div className="visual-legend">
            <div className="visual-legend-item">
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#38bdf8" }} />
              <span>Live Synced</span>
            </div>
            <div className="visual-legend-item">
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#ec4899" }} />
              <span>Local Profile</span>
            </div>
          </div>
        </div>


          {drawerOpen && activePlatformData && <PlatformAnalyticsDrawer
            platform={activePlatformData}
            stats={activePlatformData.stats}
            status={activePlatformData.stats?.error ? "Needs attention" : activePlatformData.stats?.loading ? "Syncing" : activePlatformData.handle ? "Connected" : "Handle not set"}
            onClose={() => setDrawerOpen(false)}
            tab={drawerTab}
            setTab={setDrawerTab}
            logs={activePlatformLogs}
            currentStreak={currentStreak}
            longestStreak={longestStreak}
            activeDays={activeDaysCount}
            monthlyActivity={monthlyActivity}
            milestones={streakMilestones}
            recommendation={recommendation}
            onRecommendation={() => { if (recommendation.kind === "log") { setLogPlatform(activePlatformData.title); setIsLogModalOpen(true); } else window.open(activePlatformData.practiceUrl, "_blank", "noopener,noreferrer"); }}
            onLog={() => { setLogPlatform(activePlatformData.title); setIsLogModalOpen(true); }}
            onRetry={() => { const handle=activePlatformData.handle; if (!handle) return; if(expandedPlatform === "leetcode") syncLeetCodeData(handle,{force:true}); else if(expandedPlatform === "codechef") syncCodeChefData(handle,{force:true}); else if(expandedPlatform === "geeksforgeeks") syncGfgData(handle,{force:true}); else if(expandedPlatform === "github") syncGitHubData(handle,{force:true}); }}
          />}
          {hubOpen && <PlatformAnalyticsDrawer mode="hub" onClose={() => setHubOpen(false)} totalSolved={totalSolved} currentStreak={currentStreak} easyCount={easyCount} mediumCount={medCount} hardCount={hardCount} platformTotals={[{name:"LeetCode",value:lcSolved,color:"#38bdf8"},{name:"GeeksforGeeks",value:gfgSolved,color:"#ec4899"},{name:"CodeChef",value:ccSolved,color:"#06b6d4"},{name:"Codeforces",value:codeforces.solved ?? 0,color:"#3b82f6"}]} />}
        {/* Right Sidebar: Telemetry Command Panel (OpportunityOS Developer Metrics) */}
        <div className="visual-sidebar">
          {/* Top Control Bar with '+', alerts, freeze shields, and Time Range Dropdown */}
          <div className="visual-top-bar">
            <div style={{ display: "flex", gap: 6 }}>
              <button
                type="button"
                className="visual-icon-btn"
                onClick={() => setIsLogModalOpen(true)}
                title="Log Today's Practice Session"
              >
                <Plus size={13} />
              </button>
              <span className="visual-icon-btn" style={{ cursor: "default" }}>
                <Bell size={12} color="#fbbf24" /> {growthStats.streakAtRisk ? "1" : "0"}
              </span>
              <span className="visual-icon-btn" style={{ cursor: "default" }}>
                <Shield size={12} color="#4ade80" /> {growthStats.streakFreezesAvailable ?? 2}
              </span>
            </div>

            <select
              className="visual-dropdown-select"
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
            >
              <option value="Past 24 Hours">Past 24 Hours</option>
              <option value="Past 7 Days">Past 7 Days</option>
              <option value="Past 28 Days">Past 28 Days</option>
              <option value="All Time">All Time</option>
            </select>
          </div>

          {/* Top Telemetry Header Card (Total Solved & Active Coding Streak) */}
          <div className="visual-header-card">
            <div className="visual-header-progress">
              <div style={{ width: "80%", background: "#22c55e" }} />
              <div style={{ width: "20%", background: "#f59e0b" }} />
            </div>

            <div className="visual-header-cols">
              <div className="visual-header-col-item">
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e" }} />
                <div>
                  <span>Total Solved</span>
                  <strong>{totalSolved}</strong>
                </div>
              </div>

              <div className="visual-header-col-item">
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#f59e0b" }} />
                <div>
                  <span>Active Streak</span>
                  <strong>{currentStreak} Days</strong>
                </div>
              </div>
            </div>
          </div>

          {/* 6-Tile Developer Telemetry Grid */}
          <div className="visual-grid-6">
            <div className="visual-grid-tile">
              <div className="visual-grid-tile-label">Daily Velocity</div>
              <div className="visual-grid-tile-val">
                <span className="visual-grid-tile-num">4.2 / d</span>
                <span className="visual-grid-tile-trend up">↑ 29%</span>
              </div>
            </div>

            <div className="visual-grid-tile">
              <div className="visual-grid-tile-label">Weekly Solved</div>
              <div className="visual-grid-tile-val">
                <span className="visual-grid-tile-num">29 Solved</span>
                <span className="visual-grid-tile-trend down">↓ 15%</span>
              </div>
            </div>

            <div className="visual-grid-tile">
              <div className="visual-grid-tile-label">Consistency Rate</div>
              <div className="visual-grid-tile-val">
                <span className="visual-grid-tile-num">{consistencyRate}%</span>
                <span className="visual-grid-tile-trend up">↑ 15%</span>
              </div>
            </div>

            <div className="visual-grid-tile">
              <div className="visual-grid-tile-label">Active Days</div>
              <div className="visual-grid-tile-val">
                <span className="visual-grid-tile-num">{activeDaysCount} / 28</span>
                <span className="visual-grid-tile-trend neutral">↑ 0%</span>
              </div>
            </div>

            <div className="visual-grid-tile">
              <div className="visual-grid-tile-label">Total Contributions</div>
              <div className="visual-grid-tile-val">
                <span className="visual-grid-tile-num">{ghCommits}</span>
                <span className="visual-grid-tile-trend up">↑ 12%</span>
              </div>
            </div>

            <div className="visual-grid-tile">
              <div className="visual-grid-tile-label">Peak Streak</div>
              <div className="visual-grid-tile-val">
                <span className="visual-grid-tile-num">{longestStreak}d</span>
                <span className="visual-grid-tile-trend up">● Live</span>
              </div>
            </div>
          </div>

          {/* Difficulty Breakdown (Replacing Severity Breakdown with Developer Metrics) */}
          <div className="visual-sidebar-card">
            <div className="visual-breakdown-title">Difficulty Breakdown</div>
            <div className="visual-breakdown-bar">
              <div style={{ width: `${hardPct}%`, background: "#ef4444" }} />
              <div style={{ width: `${medPct}%`, background: "#f59e0b" }} />
              <div style={{ width: `${easyPct}%`, background: "#22c55e" }} />
            </div>

            <div className="visual-breakdown-cards">
              <div className="visual-breakdown-pill-card">
                <div className="visual-breakdown-pill-label">
                  <span className="visual-breakdown-pill-dot" style={{ background: "#ef4444" }} />
                  Hard
                </div>
                <div className="visual-breakdown-pill-val">{hardCount} Solved</div>
              </div>

              <div className="visual-breakdown-pill-card">
                <div className="visual-breakdown-pill-label">
                  <span className="visual-breakdown-pill-dot" style={{ background: "#f59e0b" }} />
                  Medium
                </div>
                <div className="visual-breakdown-pill-val">{medCount} Solved</div>
              </div>

              <div className="visual-breakdown-pill-card">
                <div className="visual-breakdown-pill-label">
                  <span className="visual-breakdown-pill-dot" style={{ background: "#22c55e" }} />
                  Easy
                </div>
                <div className="visual-breakdown-pill-val">{easyCount} Solved</div>
              </div>
            </div>
          </div>

          {/* Platform Distribution (LeetCode, GFG, CodeChef, GitHub) */}
          <div className="visual-sidebar-card">
            <div className="visual-breakdown-title">Platform Distribution</div>
            <div className="visual-breakdown-bar">
              <div style={{ width: `${lcShare}%`, background: "#38bdf8" }} />
              <div style={{ width: `${gfgShare}%`, background: "#ec4899" }} />
              <div style={{ width: `${ccShare}%`, background: "#06b6d4" }} />
              <div style={{ width: `${Math.max(4, 100 - lcShare - gfgShare - ccShare)}%`, background: "#f43f5e" }} />
            </div>

            <div className="visual-breakdown-cards">
              <div
                className="visual-breakdown-pill-card"
                onClick={() => toggleExpand("leetcode")}
              >
                <div className="visual-breakdown-pill-label">
                  <span className="visual-breakdown-pill-dot" style={{ background: "#38bdf8" }} />
                  LeetCode
                </div>
                <div className="visual-breakdown-pill-val" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span>{lcSolved} Solved</span>
                  {profile.platformHandles?.leetcode && (
                    <button
                      type="button"
                      style={{ background: "none", border: "none", color: "#38bdf8", cursor: "pointer", padding: 0 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        syncLeetCodeData(profile.platformHandles?.leetcode, { force: true });
                      }}
                      title="Sync LeetCode Live"
                      disabled={leetcode.loading}
                    >
                      <RotateCw size={10} className={leetcode.loading ? "spin" : ""} />
                    </button>
                  )}
                </div>
              </div>

              <div
                className="visual-breakdown-pill-card"
                onClick={() => toggleExpand("geeksforgeeks")}
              >
                <div className="visual-breakdown-pill-label">
                  <span className="visual-breakdown-pill-dot" style={{ background: "#ec4899" }} />
                  GeeksforGeeks
                </div>
                <div className="visual-breakdown-pill-val" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span>{gfgSolved} Solved</span>
                  {(profile.platformHandles?.geeksforgeeks || profile.platformHandles?.gfg) && (
                    <button
                      type="button"
                      style={{ background: "none", border: "none", color: "#ec4899", cursor: "pointer", padding: 0 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        syncGfgData(profile.platformHandles?.geeksforgeeks || profile.platformHandles?.gfg, { force: true });
                      }}
                      title="Sync GFG Live"
                      disabled={gfg.loading}
                    >
                      <RotateCw size={10} className={gfg.loading ? "spin" : ""} />
                    </button>
                  )}
                </div>
              </div>

              <div
                className="visual-breakdown-pill-card"
                onClick={() => toggleExpand("codechef")}
              >
                <div className="visual-breakdown-pill-label">
                  <span className="visual-breakdown-pill-dot" style={{ background: "#06b6d4" }} />
                  CodeChef
                </div>
                <div className="visual-breakdown-pill-val" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span>{ccSolved} Solved</span>
                  {profile.platformHandles?.codechef && (
                    <button
                      type="button"
                      style={{ background: "none", border: "none", color: "#06b6d4", cursor: "pointer", padding: 0 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        syncCodeChefData(profile.platformHandles?.codechef, { force: true });
                      }}
                      title="Sync CodeChef Live"
                      disabled={codechef.loading}
                    >
                      <RotateCw size={10} className={codechef.loading ? "spin" : ""} />
                    </button>
                  )}
                </div>
              </div>

              <div
                className="visual-breakdown-pill-card"
                onClick={() => toggleExpand("codeforces")}
              >
                <div className="visual-breakdown-pill-label">
                  <span className="visual-breakdown-pill-dot" style={{ background: "#fbbf24" }} />
                  Codeforces
                </div>
                <div className="visual-breakdown-pill-val" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span>{codeforces.solved ?? 0} Solved</span>
                  {profile.platformHandles?.codeforces && (
                    <button
                      type="button"
                      style={{ background: "none", border: "none", color: "#fbbf24", cursor: "pointer", padding: 0 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        syncCodeforcesData(profile.platformHandles?.codeforces, { force: true });
                      }}
                      title="Sync Codeforces Live"
                      disabled={codeforces.loading}
                    >
                      <RotateCw size={10} className={codeforces.loading ? "spin" : ""} />
                    </button>
                  )}
                </div>
              </div>

              <div
                className="visual-breakdown-pill-card"
                onClick={() => toggleExpand("github")}
              >
                <div className="visual-breakdown-pill-label">
                  <span className="visual-breakdown-pill-dot" style={{ background: "#f43f5e" }} />
                  GitHub
                </div>
                <div className="visual-breakdown-pill-val" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span>{ghCommits} Commits</span>
                  {profile.platformHandles?.github && (
                    <button
                      type="button"
                      style={{ background: "none", border: "none", color: "#f43f5e", cursor: "pointer", padding: 0 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        syncGitHubData(profile.platformHandles?.github, { force: true });
                      }}
                      title="Sync GitHub Live"
                      disabled={github.loading}
                    >
                      <RotateCw size={10} className={github.loading ? "spin" : ""} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Streak Milestones Badges (Image 1 Fixed Contrast & Visual Polish) */}
      <section className="milestones-section" style={{ marginTop: 28, marginBottom: 32 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div>
            <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 700, color: "#38bdf8", letterSpacing: "0.08em", textTransform: "uppercase" }}>
              Milestones
            </p>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 750, color: "#f8fafc", letterSpacing: "-0.02em" }}>
              Streak Consistency Badges
            </h2>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: "#8da0aa" }}>
              Unlock developer badges by maintaining unbroken coding streaks.
            </p>
          </div>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 14px",
              borderRadius: 999,
              background: "rgba(245, 158, 11, 0.15)",
              border: "1px solid rgba(245, 158, 11, 0.3)",
              color: "#fbbf24",
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            <Flame size={14} color="#f59e0b" />
            {currentStreak} Days Current
          </span>
        </div>

        <div className="milestones-grid">
          {streakMilestones.map((m) => {
            const isUnlocked = (currentStreak || 0) >= m.targetDays;
            const progressPct = Math.min(
              100,
              Math.round(((currentStreak || 0) / m.targetDays) * 100)
            );
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
                <p className="milestone-desc">
                  {m.description}
                </p>
                <div>
                  <div className="milestone-meta-row">
                    <span>
                      {isUnlocked ? "Achieved" : `${currentStreak}/${m.targetDays} days`}
                    </span>
                    <span>{progressPct}%</span>
                  </div>
                  <div className="milestone-progress-bar">
                    <div
                      className="milestone-progress-fill"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* PRACTICE HISTORY & EXPORT FEED */}
      <section className="milestones-section" style={{ marginTop: 24, marginBottom: 32 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
          <div>
            <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 700, color: "#38bdf8", letterSpacing: "0.08em", textTransform: "uppercase" }}>
              Activity Feed
            </p>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 750, color: "#f8fafc", letterSpacing: "-0.02em" }}>
              Practice History Logs
            </h2>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: "#8da0aa" }}>
              Review recent problem sessions, filter by platform, or export your logs for portfolio and mentor reviews.
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            {/* Search Input */}
            <div style={{ position: "relative" }}>
              <Search
                size={14}
                style={{
                  position: "absolute",
                  left: 10,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#64748b",
                }}
              />
              <input
                type="text"
                placeholder="Search notes, topics..."
                value={logSearchQuery}
                onChange={(e) => setLogSearchQuery(e.target.value)}
                style={{
                  background: "rgba(13, 17, 23, 0.75)",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                  borderRadius: 8,
                  padding: "6px 12px 6px 30px",
                  fontSize: 12,
                  color: "#f8fafc",
                  outline: "none",
                  width: 180,
                }}
              />
            </div>

            {/* Platform Filter */}
            <select
              value={logPlatformFilter}
              onChange={(e) => setLogPlatformFilter(e.target.value)}
              style={{
                background: "rgba(13, 17, 23, 0.75)",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                borderRadius: 8,
                padding: "6px 10px",
                fontSize: 12,
                color: "#f8fafc",
                outline: "none",
                cursor: "pointer",
              }}
              aria-label="Filter practice history by platform"
            >
              <option value="all">All Platforms</option>
              <option value="LeetCode">LeetCode</option>
              <option value="Codeforces">Codeforces</option>
              <option value="CodeChef">CodeChef</option>
              <option value="GeeksforGeeks">GeeksforGeeks</option>
              <option value="GitHub">GitHub</option>
            </select>

            {/* Export Dropdown */}
            <div style={{ position: "relative" }}>
              <button
                type="button"
                onClick={() => setIsExportMenuOpen((prev) => !prev)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "6px 12px",
                  background: "rgba(56, 189, 248, 0.15)",
                  border: "1px solid rgba(56, 189, 248, 0.35)",
                  borderRadius: 8,
                  color: "#38bdf8",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                <Download size={13} /> Export Report
              </button>

              {isExportMenuOpen && (
                <div
                  style={{
                    position: "absolute",
                    right: 0,
                    top: "100%",
                    marginTop: 6,
                    background: "#0d1117",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    borderRadius: 8,
                    boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
                    zIndex: 20,
                    minWidth: 150,
                    overflow: "hidden",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      exportLogsAsCsv(filteredLogs);
                      setIsExportMenuOpen(false);
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      width: "100%",
                      padding: "8px 12px",
                      background: "none",
                      border: "none",
                      color: "#f8fafc",
                      fontSize: 12,
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                  >
                    <FileSpreadsheet size={13} color="#22c55e" /> Export as CSV
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      exportLogsAsJson(filteredLogs);
                      setIsExportMenuOpen(false);
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      width: "100%",
                      padding: "8px 12px",
                      background: "none",
                      border: "none",
                      color: "#f8fafc",
                      fontSize: 12,
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                  >
                    <FileText size={13} color="#38bdf8" /> Export as JSON
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Logs List Cards - Displays scrollable feed when exceeding 3 entries */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 10,
            maxHeight: filteredLogs.length > 3 ? "280px" : "none",
            overflowY: filteredLogs.length > 3 ? "auto" : "visible",
            paddingRight: filteredLogs.length > 3 ? "6px" : "0px",
          }}
        >
          {filteredLogs.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "32px 16px",
                background: "rgba(13, 17, 23, 0.5)",
                border: "1px dashed rgba(255, 255, 255, 0.15)",
                borderRadius: 12,
                color: "#8da0aa",
              }}
            >
              <p style={{ margin: 0, fontSize: 13 }}>No practice logs match your search or filter criteria.</p>
              {(logSearchQuery || logPlatformFilter !== "all") && (
                <button
                  type="button"
                  onClick={() => {
                    setLogSearchQuery("");
                    setLogPlatformFilter("all");
                  }}
                  style={{
                    marginTop: 10,
                    background: "rgba(255, 255, 255, 0.08)",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    borderRadius: 6,
                    padding: "4px 12px",
                    color: "#f8fafc",
                    fontSize: 12,
                    cursor: "pointer",
                  }}
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
                  padding: "12px 16px",
                  background: "rgba(13, 17, 23, 0.65)",
                  backdropFilter: "blur(8px)",
                  borderRadius: 10,
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <strong style={{ fontSize: 13, color: "#f8fafc" }}>
                      {log.platform} · {log.problemsSolved} Solved
                    </strong>
                    {log.difficulty && (
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          padding: "2px 7px",
                          borderRadius: 999,
                          background:
                            log.difficulty === "Easy"
                              ? "rgba(34, 197, 94, 0.15)"
                              : log.difficulty === "Hard"
                              ? "rgba(239, 68, 68, 0.15)"
                              : "rgba(245, 158, 11, 0.15)",
                          color:
                            log.difficulty === "Easy"
                              ? "#4ade80"
                              : log.difficulty === "Hard"
                              ? "#f87171"
                              : "#fbbf24",
                          border: `1px solid ${
                            log.difficulty === "Easy"
                              ? "rgba(34, 197, 94, 0.3)"
                              : log.difficulty === "Hard"
                              ? "rgba(239, 68, 68, 0.3)"
                              : "rgba(245, 158, 11, 0.3)"
                          }`,
                        }}
                      >
                        {log.difficulty}
                      </span>
                    )}
                    {log.category && (
                      <span
                        style={{
                          fontSize: 10,
                          padding: "2px 7px",
                          borderRadius: 999,
                          background: "rgba(255, 255, 255, 0.06)",
                          color: "#94a3b8",
                          border: "1px solid rgba(255, 255, 255, 0.1)",
                        }}
                      >
                        {log.category}
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: 11, color: "#8da0aa" }}>{log.date}</span>
                </div>
                {log.notes && (
                  <p style={{ margin: 0, fontSize: 12, color: "#cbd5e1", lineHeight: 1.5 }}>
                    {log.notes}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </section>

      {/* PRACTICE LOGGING MODAL */}
      {isLogModalOpen && (
        <div className="modal-overlay" onClick={() => setIsLogModalOpen(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2 style={{ margin: 0, fontSize: 17, color: "var(--color-primary)" }}>
                  Log Today's Practice Session
                </h2>
                <span style={{ fontSize: 12, color: "#8da0aa" }}>Record problems or commits to keep your streak live</span>
              </div>
              <button
                className="close-btn"
                onClick={() => setIsLogModalOpen(false)}
                type="button"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleLogSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label htmlFor="platSelect">Platform / Activity *</label>
                  <select
                    id="platSelect"
                    className="form-select"
                    value={logPlatform}
                    onChange={(e) => setLogPlatform(e.target.value)}
                  >
                    <option value="LeetCode">LeetCode</option>
                    <option value="Codeforces">Codeforces</option>
                    <option value="CodeChef">CodeChef</option>
                    <option value="GeeksforGeeks">GeeksforGeeks</option>
                    <option value="GitHub">GitHub</option>
                  </select>
                </div>

                {logPlatform === "LeetCode" && (
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
                  <label htmlFor="countInput">Problems / Commits Solved *</label>
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
                  <label htmlFor="notesPractice">Problem / Project Topic</label>
                  <input
                    id="notesPractice"
                    className="form-input"
                    placeholder="e.g. Dynamic Programming / Graph BFS"
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
                  <Terminal size={14} /> Record Practice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
