/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from "react";
import {
  initialApplications,
  initialCalendarEvents,
  initialDailyChallenge,
  initialGrowthStats,
  initialOpportunities,
  initialProfile,
} from "../data/sampleData.js";
import {
  checkSession,
  getStoredUser,
  loginUser,
  logoutUser,
  registerUser,
  submitGrowthLog,
} from "../services/authService.js";
import { fetchLiveCodeChefStats } from "../services/codechefService.js";
import { fetchLiveGfgStats } from "../services/gfgService.js";
import { fetchLiveLeetCodeStats } from "../services/leetcodeService.js";
import { fetchLiveGitHubStats } from "../services/githubService.js";
import { fetchLiveCodeforcesStats } from "../services/codeforcesService.js";
import { fetchLiveContests } from "../services/contestClientService.js";
import { fetchOpportunities } from "../services/opportunityService.js";
import {
  fetchApplications,
  createRemoteApplication,
  updateRemoteApplication,
  deleteRemoteApplication,
} from "../services/applicationService.js";

const STORAGE_KEYS = {
  PROFILE: "opportunity_os_profile_v1",
  OPPORTUNITIES: "opportunity_os_opportunities_v1",
  SAVED_IDS: "opportunity_os_saved_ids_v1",
  APPLICATIONS: "opportunity_os_applications_v1",
  GROWTH: "opportunity_os_growth_v1",
  CALENDAR: "opportunity_os_calendar_nov_test_v3",
  DAILY_CHALLENGE: "opportunity_os_daily_challenge_v1",
};

function loadFromStorage(key, fallback) {
  try {
    const item = localStorage.getItem(key);
    if (item) {
      return JSON.parse(item);
    }
  } catch (err) {
    console.warn(`Failed to read ${key} from localStorage:`, err);
  }
  return fallback;
}

function saveToStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn(`Failed to write ${key} to localStorage:`, err);
  }
}

const AppContext = createContext(undefined);

// Helper to compute streak health, risk, and days since last active
function calculateStreakStatus(lastActiveDate, currentStreak) {
  try {
    if (!lastActiveDate) {
      return { streakAtRisk: true, daysInactive: 1, isBroken: false };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const last = new Date(lastActiveDate);
    last.setHours(0, 0, 0, 0);

    const diffMs = today.getTime() - last.getTime();
    const daysInactive = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (daysInactive === 0) {
      // Solved something today!
      return { streakAtRisk: false, daysInactive: 0, isBroken: false };
    } else if (daysInactive === 1) {
      // Solved yesterday, needs activity today to keep going
      return { streakAtRisk: true, daysInactive: 1, isBroken: false };
    } else {
      // Inactive 2+ days, streak is broken or needs freeze/recovery
      return { streakAtRisk: true, daysInactive, isBroken: currentStreak > 0 };
    }
  } catch (err) {
    console.error("Error evaluating streak status:", err);
    return { streakAtRisk: true, daysInactive: 1, isBroken: false };
  }
}

function getPageFromUrl() {
  if (typeof window === "undefined") return "overview";
  const path = window.location.pathname.replace(/^\/+|\/+$/g, "").toLowerCase();
  if (!path) return "overview";
  const validPages = ["overview", "career", "opportunities", "applications", "growth", "calendar", "settings", "auth"];
  return validPages.includes(path) ? path : "404";
}

export function AppProvider({ children }) {
  const [activePage, setActivePageState] = useState(() => getPageFromUrl());

  const setActivePage = (page) => {
    setActivePageState(page);
    try {
      if (typeof window !== "undefined") {
        const targetUrl = page === "overview" ? "/" : `/${page}`;
        if (window.location.pathname !== targetUrl) {
          window.history.pushState({ page }, "", targetUrl);
        }
      }
    } catch (e) {
      console.warn("Failed to update history state:", e);
    }
  };

  useEffect(() => {
    const handlePopState = () => {
      setActivePageState(getPageFromUrl());
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Authentication State
  const [user, setUser] = useState(() => getStoredUser());
  const [authReturnPage, setAuthReturnPage] = useState("overview");
  const openAuthPage = () => {
    setAuthReturnPage(activePage === "auth" ? "overview" : activePage);
    setActivePage("auth");
  };
  const closeAuthPage = () => setActivePage(authReturnPage);

  const [profile, setProfile] = useState(() => {
    const stored = getStoredUser();
    if (stored) {
      return {
        name: stored.name || initialProfile.name,
        email: stored.email || initialProfile.email,
        university: stored.university || initialProfile.university,
        degree: stored.degree || initialProfile.degree,
        gradYear: stored.gradYear || initialProfile.gradYear,
        targetRoles: stored.targetRoles || initialProfile.targetRoles,
        skills: stored.skills || initialProfile.skills,
        resumeSummary: stored.resumeSummary || initialProfile.resumeSummary,
        platformHandles: stored.platformHandles || initialProfile.platformHandles,
      };
    }
    return loadFromStorage(STORAGE_KEYS.PROFILE, initialProfile);
  });

  const [opportunities, setOpportunities] = useState(() =>
    loadFromStorage(STORAGE_KEYS.OPPORTUNITIES, initialOpportunities),
  );

  const [savedOpportunityIds, setSavedOpportunityIds] = useState(() =>
    loadFromStorage(STORAGE_KEYS.SAVED_IDS, ["stripe-swe-intern", "cred-frontend-intern", "google-swe-intern"]),
  );

  const [applications, setApplications] = useState(() =>
    loadFromStorage(STORAGE_KEYS.APPLICATIONS, initialApplications),
  );

  const [isContestsLoading, setIsContestsLoading] = useState(false);
  const [isOpportunitiesLoading, setIsOpportunitiesLoading] = useState(false);
  const [isApplicationsLoading, setIsApplicationsLoading] = useState(false);

  const [growthStats, setGrowthStats] = useState(() => {
    try {
      const loaded = loadFromStorage(STORAGE_KEYS.GROWTH, initialGrowthStats);

      // Clean out any legacy static mock entries saved in browser localStorage
      const legacyStaticNotes = [
        "Solved Binary Tree Maximum Path Sum and 2 medium tree traversals.",
        "Participated in Round 980 Div 3, upsolved problem D.",
        "Dynamic Programming knapsack practice.",
      ];
      const cleanedLogs = (loaded.recentLogs || []).filter(
        (log) => !legacyStaticNotes.includes(log.notes)
      );

      // Reconcile stale cached dates so rolling analytics stay fresh and accurate
      const latestActivityDate = loaded.monthlyActivity?.length
        ? loaded.monthlyActivity[loaded.monthlyActivity.length - 1]?.date
        : null;
      const todayStr = new Date().toISOString().split("T")[0];
      const isOutdated = !latestActivityDate || latestActivityDate < todayStr;
      const activityToUse = isOutdated ? initialGrowthStats.monthlyActivity : loaded.monthlyActivity;
      const lastActive = isOutdated ? initialGrowthStats.lastActiveDate : loaded.lastActiveDate;
      const freshStatus = calculateStreakStatus(lastActive, loaded.currentStreak);

      return {
        ...loaded,
        lastActiveDate: lastActive,
        monthlyActivity: activityToUse,
        recentLogs: cleanedLogs.length > 0 ? cleanedLogs : initialGrowthStats.recentLogs,
        codechef: loaded.codechef || initialGrowthStats.codechef,
        gfg: loaded.gfg || initialGrowthStats.gfg,
        streakAtRisk: freshStatus.streakAtRisk,
        streakBroken: freshStatus.isBroken,
        streakFreezesAvailable: loaded.streakFreezesAvailable ?? 2,
      };
    } catch (err) {
      console.error("Failed to initialize growth stats:", err);
      return initialGrowthStats;
    }
  });

  const [calendarEvents, setCalendarEvents] = useState(() =>
    loadFromStorage(STORAGE_KEYS.CALENDAR, initialCalendarEvents),
  );

  const [dailyChallenge, setDailyChallenge] = useState(() =>
    loadFromStorage(STORAGE_KEYS.DAILY_CHALLENGE, initialDailyChallenge),
  );

  const [selectedOpportunityForAnalysis, setSelectedOpportunityForAnalysis] =
    useState(null);


  // Live Data Refresh Handlers
  const refreshLiveContests = async (force = false) => {
    setIsContestsLoading(true);
    try {
      const res = await fetchLiveContests({ force });
      if (res.success && Array.isArray(res.contests) && res.contests.length > 0) {
        setCalendarEvents(res.contests);
      }
    } catch (err) {
      console.warn("Failed to fetch live contests:", err);
    } finally {
      setIsContestsLoading(false);
    }
  };

  const refreshOpportunities = async (filters = {}) => {
    setIsOpportunitiesLoading(true);
    try {
      const res = await fetchOpportunities(filters);
      if (res.success && Array.isArray(res.opportunities) && res.opportunities.length > 0) {
        setOpportunities(res.opportunities);
      }
    } catch (err) {
      console.warn("Failed to fetch opportunities:", err);
    } finally {
      setIsOpportunitiesLoading(false);
    }
  };

  const refreshApplications = async () => {
    setIsApplicationsLoading(true);
    try {
      const res = await fetchApplications();
      if (res.success && Array.isArray(res.applications) && res.applications.length > 0) {
        setApplications(res.applications);
      }
    } catch (err) {
      console.warn("Failed to fetch applications:", err);
    } finally {
      setIsApplicationsLoading(false);
    }
  };

  // Check auth session & fetch initial live data on mount
  useEffect(() => {
    // Remove keys saved by earlier browser-side AI configuration.
    try {
      localStorage.removeItem("opportunity_os_llm_api_key");
      localStorage.removeItem("opportunity_os_llm_provider");
    } catch {
      // Storage may be unavailable in a restricted browser session.
    }

    checkSession().then((verifiedUser) => {
      if (verifiedUser) {
        setUser(verifiedUser);
        setProfile((prev) => ({
          ...prev,
          name: verifiedUser.name || prev.name,
          email: verifiedUser.email || prev.email,
          university: verifiedUser.university || prev.university,
          degree: verifiedUser.degree || prev.degree,
          gradYear: verifiedUser.gradYear || prev.gradYear,
          skills: verifiedUser.skills || prev.skills,
          platformHandles: verifiedUser.platformHandles || prev.platformHandles,
        }));
      }
    });

    // Wire real live data on startup asynchronously to prevent cascading renders
    let cancelled = false;
    const loadInitialData = async () => {
      await Promise.resolve();
      if (!cancelled) {
        refreshLiveContests();
        refreshOpportunities();
        refreshApplications();
      }
    };
    loadInitialData();

    return () => {
      cancelled = true;
    };
  }, []);

  const login = async (email, password) => {
    const data = await loginUser(email, password);
    setUser(data.user);
    if (data.user) {
      setProfile((prev) => ({
        ...prev,
        name: data.user.name || prev.name,
        email: data.user.email || prev.email,
        university: data.user.university || prev.university,
        degree: data.user.degree || prev.degree,
        gradYear: data.user.gradYear || prev.gradYear,
        skills: data.user.skills || prev.skills,
        platformHandles: data.user.platformHandles || prev.platformHandles,
      }));
      refreshApplications();
    }
    return data;
  };

  const register = async (userData) => {
    const data = await registerUser(userData);
    setUser(data.user);
    if (data.user) {
      setProfile((prev) => ({
        ...prev,
        name: data.user.name || prev.name,
        email: data.user.email || prev.email,
        university: data.user.university || prev.university,
        degree: data.user.degree || prev.degree,
      }));
    }
    return data;
  };

  const logout = async () => {
    await logoutUser();
    setUser(null);
  };


  // Sync state changes with localStorage
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.PROFILE, profile);
  }, [profile]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.SAVED_IDS, savedOpportunityIds);
  }, [savedOpportunityIds]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.APPLICATIONS, applications);
  }, [applications]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.GROWTH, growthStats);
  }, [growthStats]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.CALENDAR, calendarEvents);
  }, [calendarEvents]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.DAILY_CHALLENGE, dailyChallenge);
  }, [dailyChallenge]);

  // Profile actions
  const updateProfile = (updated) => {
    setProfile((prev) => {
      const next = { ...prev, ...updated };
      // Also sync to backend if logged in
      const token = localStorage.getItem("opportunity_os_auth_token");
      if (token) {
        fetch("/api/user/profile", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(next),
        }).catch((e) => console.warn("Failed to sync profile with server:", e));
      }
      return next;
    });
  };

  const addSkill = (skill) => {
    const trimmed = skill.trim();
    if (!trimmed) return;
    setProfile((prev) => {
      if (prev.skills.some((s) => s.toLowerCase() === trimmed.toLowerCase())) return prev;
      return { ...prev, skills: [...prev.skills, trimmed] };
    });
  };

  const removeSkill = (skillToRemove) => {
    setProfile((prev) => ({
      ...prev,
      skills: prev.skills.filter((s) => s !== skillToRemove),
    }));
  };

  // Opportunity actions
  const toggleSaveOpportunity = (id) => {
    setSavedOpportunityIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  // Application tracker actions
  const addApplicationFromOpportunity = (opp) => {
    const oppId = opp.id || opp._id;
    setApplications((prev) => {
      if (prev.some((a) => a.opportunityId === oppId)) {
        return prev;
      }
      const newApp = {
        id: `app-${Date.now()}`,
        opportunityId: oppId,
        role: opp.title,
        company: opp.company,
        location: opp.location,
        status: "Applied",
        appliedDate: new Date().toISOString().split("T")[0],
        deadline: opp.deadline,
        notes: `Applied via ${opp.source || "OpportunityOS"}.`,
        sourceUrl: opp.sourceUrl,
      };
      createRemoteApplication(newApp).catch((err) => {
        console.warn("Offline application sync:", err);
      });
      return [newApp, ...prev];
    });
  };

  const createManualApplication = (appData) => {
    const newApp = {
      ...appData,
      id: `app-${Date.now()}`,
    };
    setApplications((prev) => [newApp, ...prev]);
    createRemoteApplication(newApp).catch((err) => {
      console.warn("Offline application sync:", err);
    });
  };

  const updateApplicationStatus = (id, status) => {
    setApplications((prev) =>
      prev.map((app) => (app.id === id || app._id === id ? { ...app, status } : app)),
    );
    updateRemoteApplication(id, { status }).catch((err) => {
      console.warn("Offline application status update:", err);
    });
  };

  const updateApplicationNotes = (id, notes) => {
    setApplications((prev) =>
      prev.map((app) => (app.id === id || app._id === id ? { ...app, notes } : app)),
    );
    updateRemoteApplication(id, { notes }).catch((err) => {
      console.warn("Offline application notes update:", err);
    });
  };

  const deleteApplication = (id) => {
    setApplications((prev) => prev.filter((app) => app.id !== id && app._id !== id));
    deleteRemoteApplication(id).catch((err) => {
      console.warn("Offline application delete:", err);
    });
  };

  // Developer Growth & Streak actions (Streak Module)
  const logCodingActivity = (activityOrPlatform = {}, optionalCount = 1) => {
    let platform = "LeetCode";
    let problemsSolved = 1;
    let activityNotes = "";
    let problemDifficulty = "Medium";
    let activityCategory = "Algorithms";

    if (typeof activityOrPlatform === "object" && activityOrPlatform !== null) {
      platform = activityOrPlatform.platform || "LeetCode";
      problemsSolved = Number(activityOrPlatform.problemsSolved) || 1;
      activityNotes = activityOrPlatform.notes || "";
      problemDifficulty = activityOrPlatform.difficulty || "Medium";
      activityCategory = activityOrPlatform.category || "Algorithms";
    } else {
      platform = activityOrPlatform || "LeetCode";
      problemsSolved = Number(optionalCount) || 1;
    }

    // Attempt asynchronous sync with backend if user has an active session
    submitGrowthLog({ platform, problemsSolved, notes: activityNotes }).catch((err) => {
      console.warn("Offline or unauthenticated; saving activity locally:", err);
    });

    const today = new Date().toISOString().split("T")[0];
    setGrowthStats((prev) => {
      const isFirstActivityToday = prev.streakAtRisk;
      const nextStreak = isFirstActivityToday ? prev.currentStreak + 1 : prev.currentStreak;
      const nextLongest = Math.max(nextStreak, prev.longestStreak);

      const updatedWeekly = [...(prev.weeklyActivity || initialGrowthStats.weeklyActivity)];
      const todayIndex = updatedWeekly.length - 1;
      if (todayIndex >= 0) {
        updatedWeekly[todayIndex] = {
          ...updatedWeekly[todayIndex],
          count: updatedWeekly[todayIndex].count + problemsSolved,
          completed: true,
        };
      }

      // Keep a rolling, date-keyed 28-day activity history for the dashboard metrics.
      const activityByDate = new Map(
        (prev.monthlyActivity || initialGrowthStats.monthlyActivity).map((day) => [day.date, {
          count: Number(day.count) || 0,
          problemCount: Number(day.problemCount ?? day.count) || 0,
        }]),
      );
      const updatedMonthly = Array.from({ length: 28 }, (_, index) => {
        const date = new Date(`${today}T00:00:00.000Z`);
        date.setUTCDate(date.getUTCDate() - (27 - index));
        const dateKey = date.toISOString().slice(0, 10);
        const previousDay = activityByDate.get(dateKey) || { count: 0, problemCount: 0 };
        const isToday = dateKey === today;
        const count = previousDay.count + (isToday ? problemsSolved : 0);
        const problemCount = previousDay.problemCount + (isToday && platform !== "GitHub" ? problemsSolved : 0);
        const level = count >= 5 ? 3 : count >= 3 ? 2 : count >= 1 ? 1 : 0;
        return {
          date: dateKey,
          day: new Intl.DateTimeFormat("en-US", { weekday: "short", timeZone: "UTC" }).format(date),
          count,
          problemCount,
          level,
        };
      });

      // Accurately update platform specific counters
      let updatedLeetCode = prev.leetcode;
      if (platform === "LeetCode") {
        const diffLower = (problemDifficulty || "medium").toLowerCase();
        const diffKey = ["easy", "medium", "hard"].includes(diffLower) ? diffLower : "medium";
        updatedLeetCode = {
          ...prev.leetcode,
          solved: (prev.leetcode?.solved || 0) + problemsSolved,
          [diffKey]: (prev.leetcode?.[diffKey] || 0) + problemsSolved,
        };
      }

      const updatedCodeforces =
        platform === "Codeforces"
          ? {
              ...prev.codeforces,
              solved: (prev.codeforces?.solved || 0) + problemsSolved,
            }
          : prev.codeforces;

      const updatedCodechef =
        platform === "CodeChef"
          ? {
              ...prev.codechef,
              solved: (prev.codechef?.solved || 0) + problemsSolved,
            }
          : prev.codechef;

      const updatedGfg =
        platform === "GeeksforGeeks" || platform === "GFG"
          ? {
              ...prev.gfg,
              solved: (prev.gfg?.solved || 0) + problemsSolved,
            }
          : prev.gfg;

      const updatedGithub =
        platform === "GitHub"
          ? {
              ...prev.github,
              contributions: (prev.github?.contributions || 0) + problemsSolved,
            }
          : prev.github;

      const difficultyTotals = {
        ...(prev.difficultyTotals ?? {
          easy: prev.leetcode?.easy || 0,
          medium: prev.leetcode?.medium || 0,
          hard: prev.leetcode?.hard || 0,
          unclassified: Math.max(0, (prev.totalProblemsSolved || 0) - (prev.leetcode?.solved || 0)),
        }),
      };
      if (platform !== "GitHub") {
        const diffLower = (problemDifficulty || "medium").toLowerCase();
        const diffKey = ["easy", "medium", "hard"].includes(diffLower) ? diffLower : "medium";
        difficultyTotals[diffKey] = (difficultyTotals[diffKey] || 0) + problemsSolved;
      }

      const newLog = {
        date: today,
        platform,
        problemsSolved,
        difficulty: problemDifficulty,
        category: activityCategory,
        notes: activityNotes || `Completed ${problemsSolved} items on ${platform}.`,
      };

      const updatedAutonomous = [...(prev.autonomousProjects || [])];
      if (platform === "GitHub" && activityNotes) {
        updatedAutonomous.unshift({
          id: `proj-${Date.now()}`,
          name: activityNotes.length > 40 ? activityNotes.slice(0, 37) + "..." : activityNotes,
          language: "JavaScript",
          commits: problemsSolved,
          date: today,
          status: "Completed",
          description: activityNotes,
        });
      }

      const updatedTodayCount = (prev.todayCompletedCount || 0) + problemsSolved;

      return {
        ...prev,
        currentStreak: nextStreak,
        longestStreak: nextLongest,
        lastActiveDate: today,
        streakAtRisk: false,
        streakBroken: false,
        todayCompletedCount: updatedTodayCount,
        totalProblemsSolved: (prev.totalProblemsSolved || 0) + (platform === "GitHub" ? 0 : problemsSolved),
        leetcode: updatedLeetCode,
        codeforces: updatedCodeforces,
        codechef: updatedCodechef,
        gfg: updatedGfg,
        github: updatedGithub,
        difficultyTotals,
        weeklyActivity: updatedWeekly,
        monthlyActivity: updatedMonthly,
        recentLogs: [newLog, ...(prev.recentLogs || [])].slice(0, 10),
        autonomousProjects: updatedAutonomous.slice(0, 10),
      };
    });
  };

  // Update Daily Target Goal
  const setDailyGoal = (goal) => {
    try {
      const target = Math.max(1, parseInt(goal, 10) || 1);
      setGrowthStats((prev) => ({ ...prev, dailyGoal: target }));
    } catch (err) {
      console.error("Failed to update daily goal:", err);
    }
  };

  // Streak Recovery / Freeze action
  const useStreakFreeze = () => {
    try {
      setGrowthStats((prev) => {
        if ((prev.streakFreezesAvailable ?? 0) <= 0) return prev;
        const today = new Date().toISOString().split("T")[0];
        return {
          ...prev,
          lastActiveDate: today,
          streakAtRisk: false,
          streakBroken: false,
          streakFreezesAvailable: (prev.streakFreezesAvailable ?? 2) - 1,
        };
      });
    } catch (err) {
      console.error("Failed to use streak freeze:", err);
    }
  };

  // Rekindle broken streak
  const rekindleStreak = () => {
    try {
      const today = new Date().toISOString().split("T")[0];
      setGrowthStats((prev) => ({
        ...prev,
        currentStreak: 1,
        streakBroken: false,
        streakAtRisk: false,
        lastActiveDate: today,
      }));
    } catch (err) {
      console.error("Failed to rekindle streak:", err);
    }
  };

  // Real-time CodeChef Data Synchronization
  const syncCodeChefData = async (handleToUse, options = { force: true }) => {
    const handle = handleToUse || profile.platformHandles?.codechef;
    if (!handle) {
      return { success: false, error: "No CodeChef handle configured." };
    }

    setGrowthStats((prev) => ({
      ...prev,
      codechef: {
        ...(prev.codechef || initialGrowthStats.codechef),
        loading: true,
        error: null,
      },
    }));

    const result = await fetchLiveCodeChefStats(handle, options);

    if (result.success && result.data) {
      const live = result.data;
      setGrowthStats((prev) => {
        const currentCodeChef = prev.codechef || initialGrowthStats.codechef;
        const prevSolved = currentCodeChef.solved ?? 0;
        const liveSolved = typeof live.problemsSolved === "number" ? live.problemsSolved : prevSolved;
        const diffSolved = liveSolved - prevSolved;

        // Record live CodeChef sync activity entry
        const currentLogs = prev.recentLogs || [];
        const ccLog = {
          date: new Date().toISOString().split("T")[0],
          platform: "CodeChef",
          problemsSolved: diffSolved > 0 ? diffSolved : 1,
          difficulty: live.division || "Medium",
          category: "Contest Division",
          notes: `Synced CodeChef rating ${live.rating || 0} (${live.stars || "1★"}, ${live.division || "Div 4"})`,
        };
        const incomingLogs = currentLogs.some((l) => l.notes === ccLog.notes && l.date === ccLog.date)
          ? []
          : [ccLog];

        return {
          ...prev,
          totalProblemsSolved: Math.max(0, (prev.totalProblemsSolved || 0) + diffSolved),
          codechef: {
            ...currentCodeChef,
            rating: typeof live.rating === "number" ? live.rating : (currentCodeChef.rating ?? 0),
            highestRating: typeof live.highestRating === "number" ? live.highestRating : (currentCodeChef.highestRating ?? 0),
            stars: live.stars ?? currentCodeChef.stars,
            starsCount: typeof live.starsCount === "number" ? live.starsCount : (currentCodeChef.starsCount ?? 1),
            division: live.division || currentCodeChef.division,
            globalRank: live.globalRank ?? currentCodeChef.globalRank,
            countryRank: live.countryRank ?? currentCodeChef.countryRank,
            solved: liveSolved,
            name: live.name || currentCodeChef.name,
            lastSynced: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            loading: false,
            error: null,
          },
          recentLogs: [...incomingLogs, ...currentLogs].slice(0, 20),
        };
      });
      return { success: true, data: result.data };
    } else {
      setGrowthStats((prev) => ({
        ...prev,
        codechef: {
          ...(prev.codechef || initialGrowthStats.codechef),
          loading: false,
          error: result.error || "Failed to sync CodeChef statistics.",
        },
      }));
      return { success: false, error: result.error };
    }
  };

  // Real-time GeeksforGeeks Data Synchronization
  const syncGfgData = async (handleToUse, options = { force: true }) => {
    const handle = handleToUse || profile.platformHandles?.gfg || profile.platformHandles?.geeksforgeeks;
    if (!handle) {
      return { success: false, error: "No GeeksforGeeks handle configured." };
    }

    setGrowthStats((prev) => {
      const currentGfg = prev.geeksforgeeks || prev.gfg || initialGrowthStats.gfg;
      const loadingState = {
        ...currentGfg,
        loading: true,
        error: null,
      };
      return {
        ...prev,
        gfg: loadingState,
        geeksforgeeks: loadingState,
      };
    });

    const result = await fetchLiveGfgStats(handle, options);

    if (result.success && result.data) {
      const live = result.data;
      setGrowthStats((prev) => {
        const currentGfg = prev.geeksforgeeks || prev.gfg || initialGrowthStats.gfg;
        const prevSolved = currentGfg.solved ?? 0;
        const liveSolved = typeof live.problemsSolved === "number" ? live.problemsSolved : prevSolved;
        const diffSolved = liveSolved - prevSolved;
        const updatedGfg = {
          ...currentGfg,
          score: typeof live.score === "number" ? live.score : (currentGfg.score ?? 0),
          monthlyScore: typeof live.monthlyScore === "number" ? live.monthlyScore : (currentGfg.monthlyScore ?? 0),
          solved: liveSolved,
          instituteRank: live.instituteRank ?? currentGfg.instituteRank,
          instituteName: live.instituteName || currentGfg.instituteName,
          currentStreak: typeof live.currentStreak === "number" ? live.currentStreak : (currentGfg.currentStreak ?? 0),
          longestStreak: typeof live.longestStreak === "number" ? live.longestStreak : (currentGfg.longestStreak ?? 0),
          easy: live.difficultyBreakdown?.easy ?? currentGfg.easy,
          medium: live.difficultyBreakdown?.medium ?? currentGfg.medium,
          hard: live.difficultyBreakdown?.hard ?? currentGfg.hard,
          recentSubmissions: live.recentSubmissions || currentGfg.recentSubmissions,
          lastSynced: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          loading: false,
          error: null,
        };

        // Merge live GeeksforGeeks problems into recentLogs
        const currentLogs = prev.recentLogs || [];
        const incomingLogs = (live.recentSubmissions || []).slice(0, 5).map((pTitle) => ({
          date: new Date().toISOString().split("T")[0],
          platform: "GeeksforGeeks",
          problemsSolved: 1,
          difficulty: "Medium",
          category: "Practice Problem",
          notes: `Solved "${pTitle}" on GeeksforGeeks`,
        })).filter((inc) => {
          return !currentLogs.some((exist) => exist.notes === inc.notes && exist.date === inc.date);
        });

        return {
          ...prev,
          totalProblemsSolved: Math.max(0, (prev.totalProblemsSolved || 0) + diffSolved),
          gfg: updatedGfg,
          geeksforgeeks: updatedGfg,
          recentLogs: [...incomingLogs, ...currentLogs].slice(0, 20),
        };
      });
      return { success: true, data: result.data };
    } else {
      setGrowthStats((prev) => {
        const currentGfg = prev.geeksforgeeks || prev.gfg || initialGrowthStats.gfg;
        const errorState = {
          ...currentGfg,
          loading: false,
          error: result.error || "Failed to sync GeeksforGeeks statistics.",
        };
        return {
          ...prev,
          gfg: errorState,
          geeksforgeeks: errorState,
        };
      });
      return { success: false, error: result.error };
    }
  };

  // Real-time LeetCode Data Synchronization
  const syncLeetCodeData = async (handleToUse, options = { force: true }) => {
    const handle = handleToUse || profile.platformHandles?.leetcode;
    if (!handle) {
      return { success: false, error: "No LeetCode handle configured." };
    }

    setGrowthStats((prev) => ({
      ...prev,
      leetcode: {
        ...(prev.leetcode || initialGrowthStats.leetcode),
        loading: true,
        error: null,
      },
    }));

    const result = await fetchLiveLeetCodeStats(handle, options);

    if (result.success && result.data) {
      const live = result.data;
      setGrowthStats((prev) => {
        const currentLC = prev.leetcode || initialGrowthStats.leetcode;
        const prevSolved = currentLC.solved ?? 0;
        const liveSolved = typeof live.solved === "number" ? live.solved : prevSolved;
        const diffSolved = liveSolved - prevSolved;

        const updatedLC = {
          ...currentLC,
          solved: liveSolved,
          easy: typeof live.easy === "number" ? live.easy : (currentLC.easy ?? 0),
          medium: typeof live.medium === "number" ? live.medium : (currentLC.medium ?? 0),
          hard: typeof live.hard === "number" ? live.hard : (currentLC.hard ?? 0),
          ranking: live.ranking ?? currentLC.ranking,
          name: live.name || currentLC.name,
          avatar: live.avatar || currentLC.avatar,
          contestRating: live.contestRating ?? currentLC.contestRating,
          contestRank: live.contestRank ?? currentLC.contestRank,
          contestBadge: live.contestBadge ?? currentLC.contestBadge,
          lastSynced: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          loading: false,
          error: null,
        };

        // Merge live LeetCode submissions into recentLogs avoiding duplicates
        const currentLogs = prev.recentLogs || [];
        const incomingLogs = (live.recentSubmissions || []).filter((inc) => {
          return !currentLogs.some((exist) => exist.notes === inc.notes && exist.date === inc.date);
        });

        return {
          ...prev,
          totalProblemsSolved: Math.max(0, (prev.totalProblemsSolved || 0) + diffSolved),
          leetcode: updatedLC,
          recentLogs: [...incomingLogs, ...currentLogs].slice(0, 15),
        };
      });
      return { success: true, data: result.data };
    } else {
      setGrowthStats((prev) => ({
        ...prev,
        leetcode: {
          ...(prev.leetcode || initialGrowthStats.leetcode),
          loading: false,
          error: result.error || "Failed to sync LeetCode statistics.",
        },
      }));
      return { success: false, error: result.error };
    }
  };

  // Real-time GitHub Data Synchronization
  const syncGitHubData = async (handleToUse, options = { force: true }) => {
    const handle = handleToUse || profile.platformHandles?.github;
    if (!handle) {
      return { success: false, error: "No GitHub handle configured." };
    }

    setGrowthStats((prev) => ({
      ...prev,
      github: {
        ...(prev.github || initialGrowthStats.github),
        loading: true,
        error: null,
      },
    }));

    const result = await fetchLiveGitHubStats(handle, options);

    if (result.success && result.data) {
      const live = result.data;
      setGrowthStats((prev) => {
        const currentGH = prev.github || initialGrowthStats.github;
        const updatedGH = {
          ...currentGH,
          contributions: typeof live.contributions === "number" ? live.contributions : (currentGH.contributions ?? 0),
          repos: typeof live.repos === "number" ? live.repos : (currentGH.repos ?? 0),
          streak: typeof live.streak === "number" ? live.streak : (currentGH.streak ?? 0),
          longestStreak: typeof live.longestStreak === "number" ? live.longestStreak : (currentGH.longestStreak ?? 0),
          followers: live.followers ?? currentGH.followers,
          name: live.name || currentGH.name,
          avatar: live.avatar || currentGH.avatar,
          bio: live.bio || currentGH.bio,
          lastSynced: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          loading: false,
          error: null,
        };

        // Merge live GitHub commit events into recentLogs avoiding duplicates
        const currentLogs = prev.recentLogs || [];
        const incomingLogs = (live.recentEvents || []).filter((inc) => {
          return !currentLogs.some((exist) => exist.notes === inc.notes && exist.date === inc.date);
        });

        return {
          ...prev,
          github: updatedGH,
          recentLogs: [...incomingLogs, ...currentLogs].slice(0, 15),
        };
      });
      return { success: true, data: result.data };
    } else {
      setGrowthStats((prev) => ({
        ...prev,
        github: {
          ...(prev.github || initialGrowthStats.github),
          loading: false,
          error: result.error || "Failed to sync GitHub statistics.",
        },
      }));
      return { success: false, error: result.error };
    }
  };

  // Real-time Codeforces Data Synchronization
  const syncCodeforcesData = async (handleToUse, options = { force: true }) => {
    const handle = handleToUse || profile.platformHandles?.codeforces;
    if (!handle) {
      return { success: false, error: "No Codeforces handle configured." };
    }

    setGrowthStats((prev) => ({
      ...prev,
      codeforces: {
        ...(prev.codeforces || initialGrowthStats.codeforces),
        loading: true,
        error: null,
      },
    }));

    const result = await fetchLiveCodeforcesStats(handle, options);

    if (result.success && result.data) {
      const live = result.data;
      setGrowthStats((prev) => {
        const currentCF = prev.codeforces || initialGrowthStats.codeforces;
        const prevSolved = currentCF.solved ?? 0;
        const liveSolved = typeof live.solved === "number" ? live.solved : prevSolved;
        const diffSolved = liveSolved - prevSolved;

        const updatedCF = {
          ...currentCF,
          handle: live.handle || currentCF.handle,
          rating: typeof live.rating === "number" ? live.rating : (currentCF.rating ?? 0),
          maxRating: typeof live.maxRating === "number" ? live.maxRating : (currentCF.maxRating ?? 0),
          rank: live.rank || currentCF.rank,
          maxRank: live.maxRank || currentCF.maxRank,
          solved: liveSolved,
          avatar: live.avatar || currentCF.avatar,
          lastSynced: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          loading: false,
          error: null,
        };

        const currentLogs = prev.recentLogs || [];
        const incomingLogs = (live.recentSubmissions || []).filter((inc) => {
          return !currentLogs.some((exist) => exist.notes === inc.notes && exist.date === inc.date);
        });

        return {
          ...prev,
          totalProblemsSolved: Math.max(0, (prev.totalProblemsSolved || 0) + diffSolved),
          codeforces: updatedCF,
          recentLogs: [...incomingLogs, ...currentLogs].slice(0, 15),
        };
      });
      return { success: true, data: result.data };
    } else {
      setGrowthStats((prev) => ({
        ...prev,
        codeforces: {
          ...(prev.codeforces || initialGrowthStats.codeforces),
          loading: false,
          error: result.error || "Failed to sync Codeforces statistics.",
        },
      }));
      return { success: false, error: result.error };
    }
  };

  const syncAllPlatforms = async (handlesToUse = null) => {
    const handles = handlesToUse || profile.platformHandles || {};
    return Promise.allSettled([
      handles.leetcode ? syncLeetCodeData(handles.leetcode) : Promise.resolve(),
      handles.codeforces ? syncCodeforcesData(handles.codeforces) : Promise.resolve(),
      handles.codechef ? syncCodeChefData(handles.codechef) : Promise.resolve(),
      handles.gfg || handles.geeksforgeeks ? syncGfgData(handles.gfg || handles.geeksforgeeks) : Promise.resolve(),
      handles.github ? syncGitHubData(handles.github) : Promise.resolve(),
    ]);
  };

  // Calendar actions
  const toggleCalendarReminder = (id) => {
    setCalendarEvents((prev) =>
      prev.map((event) =>
        event.id === id ? { ...event, isReminderSet: !event.isReminderSet } : event,
      ),
    );
  };

  const addCalendarEvent = (newEvent) => {
    setCalendarEvents((prev) => [newEvent, ...prev]);
  };

  // Daily Challenge actions
  const completeDailyChallenge = () => {
    if (dailyChallenge?.completed) return;
    setDailyChallenge((prev) => ({ ...prev, completed: true }));
    logCodingActivity({
      platform: dailyChallenge?.platform || "LeetCode",
      problemsSolved: 1,
      difficulty: dailyChallenge?.difficulty || "Medium",
      category: dailyChallenge?.category || "Algorithms & DSA",
      notes: `Solved Daily Challenge: ${dailyChallenge?.title || "LeetCode Problem"}`,
    });
  };

  // Reset to original seed data
  const resetAllData = () => {
    localStorage.removeItem(STORAGE_KEYS.PROFILE);
    localStorage.removeItem(STORAGE_KEYS.OPPORTUNITIES);
    localStorage.removeItem(STORAGE_KEYS.SAVED_IDS);
    localStorage.removeItem(STORAGE_KEYS.APPLICATIONS);
    localStorage.removeItem(STORAGE_KEYS.GROWTH);
    localStorage.removeItem(STORAGE_KEYS.CALENDAR);

    setProfile(initialProfile);
    setSavedOpportunityIds(["stripe-swe-intern", "cred-frontend-intern"]);
    setApplications(initialApplications);
    setGrowthStats(initialGrowthStats);
    setCalendarEvents(initialCalendarEvents);
    setSelectedOpportunityForAnalysis(null);
  };

  return (
    <AppContext.Provider
      value={{
        activePage,
        setActivePage,
        user,
        openAuthPage,
        closeAuthPage,
        login,
        register,
        logout,
        profile,
        updateProfile,
        addSkill,
        removeSkill,
        opportunities,
        savedOpportunityIds,
        toggleSaveOpportunity,
        selectedOpportunityForAnalysis,
        setSelectedOpportunityForAnalysis,
        applications,
        addApplicationFromOpportunity,
        createManualApplication,
        updateApplicationStatus,
        updateApplicationNotes,
        deleteApplication,
        growthStats,
        logCodingActivity,
        setDailyGoal,
        useStreakFreeze,
        rekindleStreak,
        syncCodeChefData,
        syncGfgData,
        syncLeetCodeData,
        syncGitHubData,
        syncCodeforcesData,
        syncAllPlatforms,
        dailyChallenge,
        completeDailyChallenge,
        calendarEvents,
        isContestsLoading,
        isOpportunitiesLoading,
        isApplicationsLoading,
        refreshLiveContests,
        refreshOpportunities,
        refreshApplications,
        toggleCalendarReminder,
        addCalendarEvent,
        resetAllData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
}
