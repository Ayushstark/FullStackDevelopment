import {
  AlertTriangle,
  Award,
  BookOpen,
  ChefHat,
  Code2,
  Download,
  ExternalLink,
  FileSpreadsheet,
  FileText,
  Flame,
  GitCommit,
  Plus,
  RotateCw,
  Search,
  Shield,
  Terminal,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useAppContext } from "../../shared/context/AppContext.jsx";
import { streakMilestones } from "../../shared/data/sampleData.js";
import { exportLogsAsCsv, exportLogsAsJson } from "./utils/exportLogs.js";

const PLATFORM_COLORS = {
  leetcode: "#D8D8D8",
  geeksforgeeks: "#D8D8D8",
  codechef: "#D8D8D8",
  github: "#D8D8D8",
  codeforces: "#D8D8D8",
};

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
  } = useAppContext();


  const [expandedPlatform, setExpandedPlatform] = useState(null);
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

  const currentStreak = growthStats.currentStreak || 0;

  const selectedPlatformLogs = (growthStats.recentLogs || []).filter((log) =>
    (log.platform || "").toLowerCase().replace(/[^a-z]/g, "").includes(expandedPlatform || "")
  );
  const selectedPlatformDays = Array.from({ length: 7 }, (_, index) => {
    const day = new Date();
    day.setDate(day.getDate() - (6 - index));
    const key = day.toISOString().slice(0, 10);
    const count = selectedPlatformLogs
      .filter((log) => log.date === key)
      .reduce((sum, log) => sum + (Number(log.problemsSolved) || 1), 0);
    return { key, label: day.toLocaleDateString(undefined, { weekday: "short" }), count };
  });
  const selectedPlatformActiveDays = selectedPlatformDays.filter((day) => day.count > 0).length;
  const selectedPlatformWeekTotal = selectedPlatformDays.reduce((sum, day) => sum + day.count, 0);
  const selectedPlatformPeak = Math.max(1, ...selectedPlatformDays.map((day) => day.count));

  const lcSolved = leetcode.solved || 0;
  const ghCommits = github.contributions || 0;

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
  };

  return (
    <main className="page-content growth-page">
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
      <div className={`visual-root ${expandedPlatform ? "has-selection" : ""}`}>
        {/* Left Area: Full Screen Translucent Constellation Graph */}
        <div className="visual-constellation-container">
          <svg viewBox="0 0 700 580" className="visual-constellation-svg">
            <defs>
              {/* Outer Donut Gradient */}
              <linearGradient id="cyberDonutGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#22c55e" />
                <stop offset="50%" stopColor="#06b6d4" />
                <stop offset="100%" stopColor="#3b82f6" />
              </linearGradient>

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

            {/* Circular Orbit Dial with Tick Marks around perimeter */}
            <circle cx="340" cy="290" r="270" fill="none" stroke="rgba(255, 255, 255, 0.04)" strokeWidth="1" />
            <circle
              cx="340"
              cy="290"
              r="266"
              fill="none"
              stroke="rgba(255, 255, 255, 0.07)"
              strokeWidth="2"
              strokeDasharray="2 7"
            />
            <circle
              cx="340"
              cy="290"
              r="205"
              fill="none"
              stroke="rgba(56, 189, 248, 0.12)"
              strokeWidth="1"
              strokeDasharray="4 6"
            />
            <circle cx="340" cy="290" r="140" fill="none" stroke="rgba(255, 255, 255, 0.06)" strokeWidth="1" />

            {/* CURVED BEZIER FIBER LINES FROM CORE TO 5 HUBS */}
            {/* 1. To LEETCODE (Top) */}
            <path
              d="M 340 235 C 340 175, 340 155, 340 110"
              fill="none"
              stroke="#0ea5e9"
              strokeWidth={expandedPlatform === "leetcode" ? "2.5" : "1.6"}
              strokeDasharray={expandedPlatform === "leetcode" ? "none" : "3 4"}
              opacity={expandedPlatform === "leetcode" ? "1" : "0.75"}
            />
            {/* 2. To GEEKSFORGEEKS (Top-Left) */}
            <path
              d="M 285 260 C 220 240, 190 220, 140 180"
              fill="none"
              stroke="#ec4899"
              strokeWidth={expandedPlatform === "geeksforgeeks" ? "2.5" : "1.6"}
              strokeDasharray={expandedPlatform === "geeksforgeeks" ? "none" : "3 4"}
              opacity={expandedPlatform === "geeksforgeeks" ? "1" : "0.75"}
            />
            {/* 3. To CODECHEF (Bottom-Left) */}
            <path
              d="M 295 325 C 230 370, 200 390, 175 430"
              fill="none"
              stroke="#06b6d4"
              strokeWidth={expandedPlatform === "codechef" ? "2.5" : "1.6"}
              strokeDasharray={expandedPlatform === "codechef" ? "none" : "3 4"}
              opacity={expandedPlatform === "codechef" ? "1" : "0.75"}
            />
            {/* 4. To GITHUB (Bottom) */}
            <path
              d="M 340 345 C 340 400, 345 430, 345 480"
              fill="none"
              stroke="#f43f5e"
              strokeWidth={expandedPlatform === "github" ? "2.5" : "1.6"}
              strokeDasharray={expandedPlatform === "github" ? "none" : "3 4"}
              opacity={expandedPlatform === "github" ? "1" : "0.75"}
            />
            {/* 5. To CODEFORCES (Right) */}
            <path
              d="M 395 290 C 440 290, 470 285, 510 280"
              fill="none"
              stroke="#3b82f6"
              strokeWidth={expandedPlatform === "codeforces" ? "2.5" : "1.6"}
              strokeDasharray={expandedPlatform === "codeforces" ? "none" : "3 4"}
              opacity={expandedPlatform === "codeforces" ? "1" : "0.75"}
            />

            {/* CURVED BRANCHES FROM HUBS TO LEAF NODES */}
            {/* Hub 1: LEETCODE leaf branches */}
            <path d="M 340 110 C 320 75, 290 65, 280 60" fill="none" stroke="#38bdf8" strokeWidth="1" opacity="0.6" />
            <path d="M 340 110 C 340 65, 340 45, 340 35" fill="none" stroke="#38bdf8" strokeWidth="1" opacity="0.6" />
            <path d="M 340 110 C 360 75, 390 65, 405 55" fill="none" stroke="#38bdf8" strokeWidth="1" opacity="0.6" />
            <circle cx="280" cy="60" r="9" fill="#080c10" stroke="#38bdf8" strokeWidth="1.5" />
            <circle cx="340" cy="35" r="9" fill="#080c10" stroke="#38bdf8" strokeWidth="1.5" />
            <circle cx="405" cy="55" r="9" fill="#080c10" stroke="#38bdf8" strokeWidth="1.5" />
            <text x="280" y="63" fill="#38bdf8" fontSize="6.5" textAnchor="middle" fontWeight="bold">E</text>
            <text x="340" y="38" fill="#38bdf8" fontSize="6.5" textAnchor="middle" fontWeight="bold">M</text>
            <text x="405" y="58" fill="#38bdf8" fontSize="6.5" textAnchor="middle" fontWeight="bold">H</text>

            {/* Hub 2: GEEKSFORGEEKS leaf branches */}
            <path d="M 140 180 C 110 150, 95 140, 85 125" fill="none" stroke="#ec4899" strokeWidth="1" opacity="0.6" />
            <path d="M 140 180 C 105 170, 85 175, 70 185" fill="none" stroke="#ec4899" strokeWidth="1" opacity="0.6" />
            <path d="M 140 180 C 110 205, 95 220, 80 240" fill="none" stroke="#ec4899" strokeWidth="1" opacity="0.6" />
            <circle cx="85" cy="125" r="9" fill="#080c10" stroke="#ec4899" strokeWidth="1.5" />
            <circle cx="70" cy="185" r="9" fill="#080c10" stroke="#ec4899" strokeWidth="1.5" />
            <circle cx="80" cy="240" r="9" fill="#080c10" stroke="#ec4899" strokeWidth="1.5" />

            {/* Hub 3: CODECHEF leaf branches */}
            <path d="M 175 430 C 145 410, 120 415, 105 425" fill="none" stroke="#06b6d4" strokeWidth="1" opacity="0.6" />
            <path d="M 175 430 C 140 445, 120 470, 110 490" fill="none" stroke="#06b6d4" strokeWidth="1" opacity="0.6" />
            <path d="M 175 430 C 160 470, 150 505, 150 525" fill="none" stroke="#06b6d4" strokeWidth="1" opacity="0.6" />
            <circle cx="105" cy="425" r="9" fill="#080c10" stroke="#06b6d4" strokeWidth="1.5" />
            <circle cx="110" cy="490" r="9" fill="#080c10" stroke="#06b6d4" strokeWidth="1.5" />
            <circle cx="150" cy="525" r="9" fill="#080c10" stroke="#06b6d4" strokeWidth="1.5" />

            {/* Hub 4: GITHUB leaf branches */}
            <path d="M 345 480 C 320 520, 310 540, 305 555" fill="none" stroke="#f43f5e" strokeWidth="1" opacity="0.6" />
            <path d="M 345 480 C 350 525, 355 545, 360 560" fill="none" stroke="#f43f5e" strokeWidth="1" opacity="0.6" />
            <path d="M 345 480 C 380 520, 400 540, 415 550" fill="none" stroke="#f43f5e" strokeWidth="1" opacity="0.6" />
            <circle cx="305" cy="555" r="9" fill="#080c10" stroke="#f43f5e" strokeWidth="1.5" />
            <circle cx="360" cy="560" r="9" fill="#080c10" stroke="#f43f5e" strokeWidth="1.5" />
            <circle cx="415" cy="550" r="9" fill="#080c10" stroke="#f43f5e" strokeWidth="1.5" />

            {/* Hub 5: CODEFORCES leaf branches */}
            <path d="M 510 280 C 550 250, 580 240, 605 230" fill="none" stroke="#3b82f6" strokeWidth="1" opacity="0.6" />
            <path d="M 510 280 C 560 280, 595 285, 620 290" fill="none" stroke="#3b82f6" strokeWidth="1" opacity="0.6" />
            <path d="M 510 280 C 555 310, 585 330, 610 350" fill="none" stroke="#3b82f6" strokeWidth="1" opacity="0.6" />
            <circle cx="605" cy="230" r="9" fill="#080c10" stroke="#3b82f6" strokeWidth="1.5" />
            <circle cx="620" cy="290" r="9" fill="#080c10" stroke="#3b82f6" strokeWidth="1.5" />
            <circle cx="610" cy="350" r="9" fill="#080c10" stroke="#3b82f6" strokeWidth="1.5" />

            {/* Clean central core keeps the platform constellation in focus. */}
            <circle cx="340" cy="290" r="62" fill="none" stroke="rgba(255, 255, 255, 0.04)" strokeWidth="1" />
            <circle className="orbit-core-progress" cx="340" cy="290" r="52" fill="none" stroke="#777" strokeWidth="10" strokeDasharray="327" strokeDashoffset="161" strokeLinecap="round" />
            <circle cx="340" cy="290" r="44" fill="#080b0f" stroke="rgba(255, 255, 255, 0.12)" strokeWidth="1.5" />

            {/* 4 Green '+' Ports around Central Donut */}
            <g transform="translate(340, 235)" onClick={() => toggleExpand("leetcode")} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); toggleExpand("leetcode"); } }} className={`platform-node node-leetcode ${expandedPlatform === "leetcode" ? "is-selected" : ""}`} role="button" tabIndex="0" aria-label="Select LeetCode" style={{ cursor: "pointer" }} title="LeetCode">
              <circle cx="0" cy="0" r="6" fill="#080c10" stroke="#22c55e" strokeWidth="1.2" />
              <text x="0" y="2.5" fill="#22c55e" fontSize="7" textAnchor="middle" fontWeight="bold">+</text>
            </g>
            <g transform="translate(285, 290)" onClick={() => toggleExpand("geeksforgeeks")} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); toggleExpand("geeksforgeeks"); } }} className={`platform-node node-geeksforgeeks ${expandedPlatform === "geeksforgeeks" ? "is-selected" : ""}`} role="button" tabIndex="0" aria-label="Select GeeksforGeeks" style={{ cursor: "pointer" }} title="GeeksforGeeks">
              <circle cx="0" cy="0" r="6" fill="#080c10" stroke="#22c55e" strokeWidth="1.2" />
              <text x="0" y="2.5" fill="#22c55e" fontSize="7" textAnchor="middle" fontWeight="bold">+</text>
            </g>
            <g transform="translate(340, 345)" onClick={() => toggleExpand("github")} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); toggleExpand("github"); } }} className={`platform-node node-github ${expandedPlatform === "github" ? "is-selected" : ""}`} role="button" tabIndex="0" aria-label="Select GitHub" style={{ cursor: "pointer" }} title="GitHub">
              <circle cx="0" cy="0" r="6" fill="#080c10" stroke="#22c55e" strokeWidth="1.2" />
              <text x="0" y="2.5" fill="#22c55e" fontSize="7" textAnchor="middle" fontWeight="bold">+</text>
            </g>
            <g transform="translate(395, 290)" onClick={() => toggleExpand("codeforces")} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); toggleExpand("codeforces"); } }} className={`platform-node node-codeforces ${expandedPlatform === "codeforces" ? "is-selected" : ""}`} role="button" tabIndex="0" aria-label="Select Codeforces" style={{ cursor: "pointer" }} title="Codeforces">
              <circle cx="0" cy="0" r="6" fill="#080c10" stroke="#22c55e" strokeWidth="1.2" />
              <text x="0" y="2.5" fill="#22c55e" fontSize="7" textAnchor="middle" fontWeight="bold">+</text>
            </g>

            {/* INTERACTIVE EXPAND BUTTONS '+' ALONG SPOKES (Exact Match to Image 2) */}
            <g transform="translate(340, 172)" onClick={() => toggleExpand("leetcode")} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); toggleExpand("leetcode"); } }} className={`platform-node node-leetcode ${expandedPlatform === "leetcode" ? "is-selected" : ""}`} role="button" tabIndex="0" aria-label="Select LeetCode" style={{ cursor: "pointer" }} title="Expand LeetCode">
              <circle cx="0" cy="0" r="7.5" fill="#080c10" stroke="#0ea5e9" strokeWidth="1.4" />
              <text x="0" y="2.5" fill="#38bdf8" fontSize="8" textAnchor="middle" fontWeight="bold">+</text>
            </g>
            <g transform="translate(212, 220)" onClick={() => toggleExpand("geeksforgeeks")} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); toggleExpand("geeksforgeeks"); } }} className={`platform-node node-geeksforgeeks ${expandedPlatform === "geeksforgeeks" ? "is-selected" : ""}`} role="button" tabIndex="0" aria-label="Select GeeksforGeeks" style={{ cursor: "pointer" }} title="Expand GeeksforGeeks">
              <circle cx="0" cy="0" r="7.5" fill="#080c10" stroke="#ec4899" strokeWidth="1.4" />
              <text x="0" y="2.5" fill="#ec4899" fontSize="8" textAnchor="middle" fontWeight="bold">+</text>
            </g>
            <g transform="translate(235, 378)" onClick={() => toggleExpand("codechef")} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); toggleExpand("codechef"); } }} className={`platform-node node-codechef ${expandedPlatform === "codechef" ? "is-selected" : ""}`} role="button" tabIndex="0" aria-label="Select CodeChef" style={{ cursor: "pointer" }} title="Expand CodeChef">
              <circle cx="0" cy="0" r="7.5" fill="#080c10" stroke="#06b6d4" strokeWidth="1.4" />
              <text x="0" y="2.5" fill="#06b6d4" fontSize="8" textAnchor="middle" fontWeight="bold">+</text>
            </g>
            <g transform="translate(342, 412)" onClick={() => toggleExpand("github")} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); toggleExpand("github"); } }} className={`platform-node node-github ${expandedPlatform === "github" ? "is-selected" : ""}`} role="button" tabIndex="0" aria-label="Select GitHub" style={{ cursor: "pointer" }} title="Expand GitHub">
              <circle cx="0" cy="0" r="7.5" fill="#080c10" stroke="#f43f5e" strokeWidth="1.4" />
              <text x="0" y="2.5" fill="#f43f5e" fontSize="8" textAnchor="middle" fontWeight="bold">+</text>
            </g>
            <g transform="translate(452, 285)" onClick={() => toggleExpand("codeforces")} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); toggleExpand("codeforces"); } }} className={`platform-node node-codeforces ${expandedPlatform === "codeforces" ? "is-selected" : ""}`} role="button" tabIndex="0" aria-label="Select Codeforces" style={{ cursor: "pointer" }} title="Expand Codeforces">
              <circle cx="0" cy="0" r="7.5" fill="#080c10" stroke="#3b82f6" strokeWidth="1.4" />
              <text x="0" y="2.5" fill="#3b82f6" fontSize="8" textAnchor="middle" fontWeight="bold">+</text>
            </g>

            {/* 5 MAIN PLATFORM HUBS (Interactive Click to Expand) */}

            {/* 1. LEETCODE (Top) */}
            <g
              transform="translate(340, 110)"
              onClick={() => toggleExpand("leetcode")} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); toggleExpand("leetcode"); } }} className={`platform-node node-leetcode ${expandedPlatform === "leetcode" ? "is-selected" : ""}`} role="button" tabIndex="0" aria-label="Select LeetCode"
              style={{ cursor: "pointer" }}
            >
              <circle cx="0" cy="0" r="23" fill="#0b1016" stroke="#38bdf8" strokeWidth={expandedPlatform === "leetcode" ? 3.5 : 2.5} filter="url(#glowCyan)" />
              <circle cx="0" cy="0" r="17" fill="#070b10" stroke="rgba(255, 255, 255, 0.15)" strokeWidth="1" />
              <text x="0" y="4" textAnchor="middle" fill="#38bdf8" fontSize="11" fontWeight="bold">LC</text>
              <text x="0" y="-30" textAnchor="middle" fill="#ffffff" fontSize="10.5" fontWeight="800" letterSpacing="0.06em">
                LEETCODE
              </text>
              <rect x="-35" y="28" width="70" height="15" rx="7.5" fill="rgba(56, 189, 248, 0.18)" stroke="#38bdf8" strokeWidth="0.8" />
              <text x="0" y="39" textAnchor="middle" fill="#38bdf8" fontSize="8" fontWeight="bold">
                {lcSolved} Solved
              </text>
            </g>

            {/* 2. GEEKSFORGEEKS (Top-Left) */}
            <g
              transform="translate(140, 180)"
              onClick={() => toggleExpand("geeksforgeeks")} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); toggleExpand("geeksforgeeks"); } }} className={`platform-node node-geeksforgeeks ${expandedPlatform === "geeksforgeeks" ? "is-selected" : ""}`} role="button" tabIndex="0" aria-label="Select GeeksforGeeks"
              style={{ cursor: "pointer" }}
            >
              <circle cx="0" cy="0" r="23" fill="#0b1016" stroke="#ec4899" strokeWidth={expandedPlatform === "geeksforgeeks" ? 3.5 : 2.5} filter="url(#glowPink)" />
              <circle cx="0" cy="0" r="17" fill="#070b10" stroke="rgba(255, 255, 255, 0.15)" strokeWidth="1" />
              <text x="0" y="4" textAnchor="middle" fill="#ec4899" fontSize="9.5" fontWeight="bold">GFG</text>
              <text x="0" y="-30" textAnchor="middle" fill="#ffffff" fontSize="10.5" fontWeight="800" letterSpacing="0.06em">
                GEEKSFORGEEKS
              </text>
              <rect x="-32" y="28" width="64" height="15" rx="7.5" fill="rgba(236, 72, 153, 0.18)" stroke="#ec4899" strokeWidth="0.8" />
              <text x="0" y="39" textAnchor="middle" fill="#f472b6" fontSize="8" fontWeight="bold">
                {gfg.score ?? 350} Score
              </text>
            </g>

            {/* 3. CODECHEF (Bottom-Left) */}
            <g
              transform="translate(175, 430)"
              onClick={() => toggleExpand("codechef")} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); toggleExpand("codechef"); } }} className={`platform-node node-codechef ${expandedPlatform === "codechef" ? "is-selected" : ""}`} role="button" tabIndex="0" aria-label="Select CodeChef"
              style={{ cursor: "pointer" }}
            >
              <circle cx="0" cy="0" r="23" fill="#0b1016" stroke="#06b6d4" strokeWidth={expandedPlatform === "codechef" ? 3.5 : 2.5} filter="url(#glowCyan)" />
              <circle cx="0" cy="0" r="17" fill="#070b10" stroke="rgba(255, 255, 255, 0.15)" strokeWidth="1" />
              <text x="0" y="4" textAnchor="middle" fill="#06b6d4" fontSize="9.5" fontWeight="bold">CC</text>
              <text x="0" y="36" textAnchor="middle" fill="#ffffff" fontSize="10.5" fontWeight="800" letterSpacing="0.06em">
                CODECHEF
              </text>
              <rect x="-35" y="42" width="70" height="15" rx="7.5" fill="rgba(6, 182, 212, 0.18)" stroke="#06b6d4" strokeWidth="0.8" />
              <text x="0" y="53" textAnchor="middle" fill="#22d3ee" fontSize="8" fontWeight="bold">
                {codechef.rating ?? 1650} ({codechef.stars || "3★"})
              </text>
            </g>

            {/* 4. GITHUB (Bottom) */}
            <g
              transform="translate(345, 480)"
              onClick={() => toggleExpand("github")} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); toggleExpand("github"); } }} className={`platform-node node-github ${expandedPlatform === "github" ? "is-selected" : ""}`} role="button" tabIndex="0" aria-label="Select GitHub"
              style={{ cursor: "pointer" }}
            >
              <circle cx="0" cy="0" r="23" fill="#0b1016" stroke="#f43f5e" strokeWidth={expandedPlatform === "github" ? 3.5 : 2.5} filter="url(#glowPink)" />
              <circle cx="0" cy="0" r="17" fill="#070b10" stroke="rgba(255, 255, 255, 0.15)" strokeWidth="1" />
              <text x="0" y="4" textAnchor="middle" fill="#f43f5e" fontSize="9.5" fontWeight="bold">GH</text>
              <circle cx="14" cy="14" r="5" fill="#f43f5e" />
              <text x="14" y="16.5" fill="#ffffff" fontSize="6" textAnchor="middle" fontWeight="bold">✓</text>
              <text x="0" y="36" textAnchor="middle" fill="#ffffff" fontSize="10.5" fontWeight="800" letterSpacing="0.06em">
                GITHUB
              </text>
              <rect x="-35" y="42" width="70" height="15" rx="7.5" fill="rgba(244, 63, 94, 0.18)" stroke="#f43f5e" strokeWidth="0.8" />
              <text x="0" y="53" textAnchor="middle" fill="#fb7185" fontSize="8" fontWeight="bold">
                {ghCommits} Commits
              </text>
            </g>

            {/* 5. CODEFORCES (Right) */}
            <g
              transform="translate(510, 280)"
              onClick={() => toggleExpand("codeforces")} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); toggleExpand("codeforces"); } }} className={`platform-node node-codeforces ${expandedPlatform === "codeforces" ? "is-selected" : ""}`} role="button" tabIndex="0" aria-label="Select Codeforces"
              style={{ cursor: "pointer" }}
            >
              <circle cx="0" cy="0" r="23" fill="#0b1016" stroke="#3b82f6" strokeWidth={expandedPlatform === "codeforces" ? 3.5 : 2.5} filter="url(#glowCyan)" />
              <circle cx="0" cy="0" r="17" fill="#070b10" stroke="rgba(255, 255, 255, 0.15)" strokeWidth="1" />
              <text x="0" y="4" textAnchor="middle" fill="#3b82f6" fontSize="9.5" fontWeight="bold">CF</text>
              <text x="0" y="-30" textAnchor="middle" fill="#ffffff" fontSize="10.5" fontWeight="800" letterSpacing="0.06em">
                CODEFORCES
              </text>
              <rect x="-35" y="28" width="70" height="15" rx="7.5" fill="rgba(59, 130, 246, 0.18)" stroke="#3b82f6" strokeWidth="0.8" />
              <text x="0" y="39" textAnchor="middle" fill="#60a5fa" fontSize="8" fontWeight="bold">
                {codeforces.rating || 1420} Rating
              </text>
            </g>
          </svg>

          {/* Bottom Left Legend */}
          <div className="visual-legend">
            <div className="visual-legend-item">
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#D8D8D8" }} />
              <span>Live Synced</span>
            </div>
            <div className="visual-legend-item">
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#777777" }} />
              <span>Local Profile</span>
            </div>
          </div>
        </div>

                  {/* Expanded Details Panel: Appears Inline on Clicking Any Platform Node */}
          {expandedPlatform && (
            <div className="visual-expand-panel" style={{ "--selected-platform-color": PLATFORM_COLORS[expandedPlatform] }}>
              <div className="visual-expand-header">
                <div className="visual-expand-title">
                  {expandedPlatform === "geeksforgeeks" && <BookOpen size={18} color="#22c55e" />}
                  {expandedPlatform === "codechef" && <ChefHat size={18} color="#ea580c" />}
                  {expandedPlatform === "leetcode" && <Code2 size={18} color="#38bdf8" />}
                  {expandedPlatform === "codeforces" && <Award size={18} color="#3b82f6" />}
                  {expandedPlatform === "github" && <GitCommit size={18} color="#f43f5e" />}
                  <div>
                    <strong style={{ fontSize: 14, color: "#f8fafc", textTransform: "capitalize" }}>
                      {expandedPlatform} Details
                    </strong>
                    <span style={{ fontSize: 11, color: "#8da0aa", marginLeft: 8 }}>
                      @{profile.platformHandles?.[expandedPlatform] || profile.platformHandles?.gfg || "Not configured"}
                    </span>
                  </div>
                </div>

                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  {expandedPlatform === "codechef" && (profile.platformHandles?.codechef) && (
                    <button
                      type="button"
                      className="button button-secondary button-sm"
                      style={{ fontSize: 11, padding: "3px 10px", height: "auto" }}
                      onClick={() => syncCodeChefData(profile.platformHandles?.codechef, { force: true })}
                      disabled={codechef.loading}
                    >
                      <RotateCw size={11} className={codechef.loading ? "spin" : ""} />
                      {codechef.loading ? "Syncing..." : "Sync Live"}
                    </button>
                  )}

                  {expandedPlatform === "geeksforgeeks" && (profile.platformHandles?.geeksforgeeks || profile.platformHandles?.gfg) && (
                    <button
                      type="button"
                      className="button button-secondary button-sm"
                      style={{ fontSize: 11, padding: "3px 10px", height: "auto" }}
                      onClick={() => syncGfgData(profile.platformHandles?.geeksforgeeks || profile.platformHandles?.gfg, { force: true })}
                      disabled={gfg.loading}
                    >
                      <RotateCw size={11} className={gfg.loading ? "spin" : ""} />
                      {gfg.loading ? "Syncing..." : "Sync Live"}
                    </button>
                  )}

                  {expandedPlatform === "leetcode" && profile.platformHandles?.leetcode && (
                    <button
                      type="button"
                      className="button button-secondary button-sm"
                      style={{ fontSize: 11, padding: "3px 10px", height: "auto" }}
                      onClick={() => syncLeetCodeData(profile.platformHandles?.leetcode, { force: true })}
                      disabled={leetcode.loading}
                    >
                      <RotateCw size={11} className={leetcode.loading ? "spin" : ""} />
                      {leetcode.loading ? "Syncing..." : "Sync Live"}
                    </button>
                  )}

                  {expandedPlatform === "github" && profile.platformHandles?.github && (
                    <button
                      type="button"
                      className="button button-secondary button-sm"
                      style={{ fontSize: 11, padding: "3px 10px", height: "auto" }}
                      onClick={() => syncGitHubData(profile.platformHandles?.github, { force: true })}
                      disabled={github.loading}
                    >
                      <RotateCw size={11} className={github.loading ? "spin" : ""} />
                      {github.loading ? "Syncing..." : "Sync Live"}
                    </button>
                  )}

                  <button
                    type="button"
                    style={{ background: "transparent", border: "none", color: "#64748b", cursor: "pointer", padding: 2 }}
                    onClick={() => setExpandedPlatform(null)}
                    title="Close details"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Specific Expanded Metrics for That Particular Platform */}
              {expandedPlatform === "geeksforgeeks" && (
                <>
                  <div className="visual-expand-grid">
                    <div className="visual-expand-tile">
                      <small>Coding Score</small>
                      <strong>{gfg.score ?? 0}</strong>
                    </div>
                    <div className="visual-expand-tile">
                      <small>Problems Solved</small>
                      <strong>{gfg.solved ?? 0}</strong>
                    </div>
                    <div className="visual-expand-tile">
                      <small>Institute Rank</small>
                      <strong>{gfg.instituteRank && gfg.instituteRank !== "—" ? `#${gfg.instituteRank}` : "—"}</strong>
                    </div>
                    <div className="visual-expand-tile">
                      <small>POTD Streak</small>
                      <strong>{gfg.currentStreak ? `${gfg.currentStreak} Days` : "—"}</strong>
                    </div>
                    <div className="visual-expand-tile">
                      <small>Campus / Org</small>
                      <strong style={{ fontSize: 13, textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                        {gfg.instituteName || "Practice"}
                      </strong>
                    </div>
                  </div>
                  {gfg.lastSynced && (
                    <span style={{ fontSize: 11, color: "#4ade80", display: "block" }}>
                      ✓ Real-time synced at {gfg.lastSynced}
                    </span>
                  )}
                  {gfg.error && (
                    <span style={{ fontSize: 11, color: "#ef4444", display: "block", marginTop: 4 }}>
                      ⚠️ {gfg.error}
                    </span>
                  )}
                </>
              )}

              {expandedPlatform === "codechef" && (
                <>
                  <div className="visual-expand-grid">
                    <div className="visual-expand-tile">
                      <small>Current Rating</small>
                      <strong>{codechef.rating ?? 0}</strong>
                    </div>
                    <div className="visual-expand-tile">
                      <small>Stars & Division</small>
                      <strong>{codechef.stars || "1★"} ({codechef.division || "Div 2"})</strong>
                    </div>
                    <div className="visual-expand-tile">
                      <small>Problems Solved</small>
                      <strong>{codechef.solved ?? 0}</strong>
                    </div>
                    <div className="visual-expand-tile">
                      <small>Global Rank</small>
                      <strong>{codechef.globalRank || "—"}</strong>
                    </div>
                    <div className="visual-expand-tile">
                      <small>Peak Rating</small>
                      <strong>{codechef.highestRating ?? codechef.rating ?? 0}</strong>
                    </div>
                  </div>
                  {codechef.lastSynced && (
                    <span style={{ fontSize: 11, color: "#4ade80", display: "block" }}>
                      ✓ Real-time synced at {codechef.lastSynced}
                    </span>
                  )}
                  {codechef.error && (
                    <span style={{ fontSize: 11, color: "#ef4444", display: "block", marginTop: 4 }}>
                      ⚠️ {codechef.error}
                    </span>
                  )}
                </>
              )}

              {expandedPlatform === "leetcode" && (
                <>
                  <div className="visual-expand-grid">
                    <div className="visual-expand-tile">
                      <small>Total Solved</small>
                      <strong>{leetcode.solved ?? 0}</strong>
                    </div>
                    <div className="visual-expand-tile">
                      <small style={{ color: "#4ade80" }}>Easy</small>
                      <strong style={{ color: "#4ade80" }}>{leetcode.easy ?? 0}</strong>
                    </div>
                    <div className="visual-expand-tile">
                      <small style={{ color: "#fbbf24" }}>Medium</small>
                      <strong style={{ color: "#fbbf24" }}>{leetcode.medium ?? 0}</strong>
                    </div>
                    <div className="visual-expand-tile">
                      <small style={{ color: "#f87171" }}>Hard</small>
                      <strong style={{ color: "#f87171" }}>{leetcode.hard ?? 0}</strong>
                    </div>
                    <div className="visual-expand-tile">
                      <small>Global Rank</small>
                      <strong>{leetcode.ranking ? `#${leetcode.ranking.toLocaleString()}` : "—"}</strong>
                    </div>
                    {leetcode.contestRating && (
                      <div className="visual-expand-tile">
                        <small>Contest Rating</small>
                        <strong>{leetcode.contestRating} {leetcode.contestBadge ? `(${leetcode.contestBadge})` : ""}</strong>
                      </div>
                    )}
                  </div>
                  {leetcode.lastSynced && (
                    <span style={{ fontSize: 11, color: "#4ade80", display: "block" }}>
                      ✓ Real-time synced at {leetcode.lastSynced}
                    </span>
                  )}
                  {leetcode.error && (
                    <span style={{ fontSize: 11, color: "#ef4444", display: "block", marginTop: 4 }}>
                      ⚠️ {leetcode.error}
                    </span>
                  )}
                </>
              )}

              {expandedPlatform === "codeforces" && (
                <>
                  <div className="visual-expand-grid">
                    <div className="visual-expand-tile">
                      <small>Rating</small>
                      <strong>{codeforces.rating ?? 0}</strong>
                    </div>
                    <div className="visual-expand-tile">
                      <small>Rank Tier</small>
                      <strong>{codeforces.rank || "Specialist"}</strong>
                    </div>
                    <div className="visual-expand-tile">
                      <small>Max Rating</small>
                      <strong>{codeforces.maxRating ?? codeforces.rating ?? 0}</strong>
                    </div>
                    <div className="visual-expand-tile">
                      <small>Solved Problems</small>
                      <strong>{codeforces.solved ?? 0}</strong>
                    </div>
                  </div>
                  {codeforces.lastSynced && (
                    <span style={{ fontSize: 11, color: "#4ade80", display: "block" }}>
                      ✓ Real-time synced at {codeforces.lastSynced}
                    </span>
                  )}
                  {codeforces.error && (
                    <span style={{ fontSize: 11, color: "#ef4444", display: "block", marginTop: 4 }}>
                      ⚠️ {codeforces.error}
                    </span>
                  )}
                </>
              )}

              {expandedPlatform === "github" && (
                <>
                  <div className="visual-expand-grid">
                    <div className="visual-expand-tile">
                      <small>Contributions</small>
                      <strong>{github.contributions ?? 0}</strong>
                    </div>
                    <div className="visual-expand-tile">
                      <small>Repositories</small>
                      <strong>{github.repos ?? 0}</strong>
                    </div>
                    <div className="visual-expand-tile">
                      <small>Commit Streak</small>
                      <strong>{github.streak ?? 0} Days</strong>
                    </div>
                    <div className="visual-expand-tile">
                      <small>Longest Streak</small>
                      <strong>{github.longestStreak ? `${github.longestStreak} Days` : "—"}</strong>
                    </div>
                    <div className="visual-expand-tile">
                      <small>Followers</small>
                      <strong>{github.followers ?? "—"}</strong>
                    </div>
                  </div>
                  {github.lastSynced && (
                    <span style={{ fontSize: 11, color: "#4ade80", display: "block" }}>
                      ✓ Real-time synced at {github.lastSynced}
                    </span>
                  )}
                  {github.error && (
                    <span style={{ fontSize: 11, color: "#ef4444", display: "block", marginTop: 4 }}>
                      ⚠️ {github.error}
                    </span>
                  )}
                </>
              )}

              <section className="platform-insight" aria-label={`${expandedPlatform} performance visualization`}>
                <div className="platform-insight-heading">
                  <div><span>PERFORMANCE PROFILE</span><strong>Where your progress sits</strong></div>
                  <small>LIVE DATA</small>
                </div>
                {expandedPlatform === "leetcode" ? (() => {
                  const easy = Number(leetcode.easy) || 0;
                  const medium = Number(leetcode.medium) || 0;
                  const hard = Number(leetcode.hard) || 0;
                  const total = easy + medium + hard;
                  const denominator = total || 1;
                  return <>
                    <div className="platform-mix-bar" aria-label={`Difficulty distribution: ${easy} easy, ${medium} medium, ${hard} hard`}>
                      <i style={{ width: `${easy / denominator * 100}%` }} />
                      <i style={{ width: `${medium / denominator * 100}%` }} />
                      <i style={{ width: `${hard / denominator * 100}%` }} />
                    </div>
                    <div className="platform-mix-legend">
                      <span><i />Easy <b>{easy}</b></span><span><i />Medium <b>{medium}</b></span><span><i />Hard <b>{hard}</b></span>
                    </div>
                    <p className="platform-insight-note">A balanced mix builds fluency and problem-solving depth.</p>
                  </>;
                })() : (() => {
                  const metric = expandedPlatform === "github" ? Number(github.contributions) || 0
                    : expandedPlatform === "geeksforgeeks" ? Number(gfg.solved) || 0
                    : expandedPlatform === "codechef" ? Number(codechef.rating) || 0
                    : Number(codeforces.rating) || 0;
                  const label = expandedPlatform === "github" ? "CONTRIBUTIONS"
                    : expandedPlatform === "geeksforgeeks" ? "PROBLEMS SOLVED"
                    : expandedPlatform === "codechef" || expandedPlatform === "codeforces" ? "CURRENT RATING" : "ACTIVITY";
                  return <>
                    <div className="platform-activity-visual" aria-label={`${label}: ${metric}`}>
                      <div className="platform-activity-bars" aria-label={`Last seven days: ${selectedPlatformWeekTotal} activity across ${selectedPlatformActiveDays} active days`}>
                        {selectedPlatformDays.map((day) => <i key={day.key} title={`${day.label}: ${day.count}`} style={{ height: `${Math.max(5, day.count / selectedPlatformPeak * 100)}%` }} />)}
                      </div>
                      <div className="platform-activity-total"><span>{label}</span><strong>{metric.toLocaleString()}</strong></div>
                    </div>
                    <div className="platform-week-summary"><span>LAST 7 DAYS <b>{selectedPlatformWeekTotal}</b></span><span>ACTIVE DAYS <b>{selectedPlatformActiveDays}/7</b></span></div>
                    <p className="platform-insight-note">{selectedPlatformLogs.length ? `From ${selectedPlatformLogs.length} recorded sessions on this platform.` : "Log sessions to build a personal activity trend here."}</p>
                  </>;
                })()}
              </section>
            </div>
          )}


      </div>

            {/* Streak Milestones Badges (Image 1 Fixed Contrast & Visual Polish) */}
      <section className="milestones-section growth-milestones-section">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div>
            <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 700, color: "var(--color-text-muted)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
              Milestones
            </p>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 750, color: "var(--color-text-title)", letterSpacing: "-0.02em" }}>
              Streak Consistency Badges
            </h2>
            <p className="practice-history-intro" style={{ margin: "4px 0 0", fontSize: 13, color: "#5D5D5D" }}>
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
              background: "#f1f1ef",
              border: "1px solid rgba(0, 0, 0, 0.15)",
              color: "#222222",
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            <Flame size={14} color="#222222" />
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
      <section className="milestones-section practice-history-section">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
          <div>
            <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 700, color: "var(--color-text-muted)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
              Activity Feed
            </p>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 750, color: "var(--color-text-title)", letterSpacing: "-0.02em" }}>
              Practice History Logs
            </h2>
            <p className="practice-history-intro" style={{ margin: "4px 0 0", fontSize: 13, color: "#5D5D5D" }}>
              Review recent problem sessions, filter by platform, or export your logs for portfolio and mentor reviews.
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <button type="button" className="button button-primary growth-log-action" onClick={() => setIsLogModalOpen(true)}><Plus size={14} /> Log a session</button>
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
                className="practice-export-trigger"
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
                <div className="practice-export-menu"
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
                    className="practice-export-option"
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
                  >
                    <FileSpreadsheet size={13} color="#22c55e" /> Export as CSV
                  </button>
                  <button
                    className="practice-export-option"
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
            <div className="practice-logs-empty"
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
                className="practice-log-card"
                style={{
                  padding: "12px 16px",
                  background: "#ffffff",
                  borderRadius: 10,
                  border: "1px solid #dededb",
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <strong style={{ fontSize: 13, color: "#222222" }}>
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
                  <span style={{ fontSize: 11, color: "#70706d" }}>{log.date}</span>
                </div>
                {log.notes && (
                  <p style={{ margin: 0, fontSize: 12, color: "#555550", lineHeight: 1.5 }}>
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
