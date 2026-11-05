/**
 * Client service for real-time live contest data across:
 * - Codeforces (Official REST API)
 * - LeetCode (Public GraphQL Gateway)
 * - CodeChef (Official internal JSON feed)
 * - GeeksforGeeks (Weekly & Job-a-thon events)
 */

const API_BASE = import.meta.env.VITE_API_URL || "";

/**
 * Fetches real live contests from backend
 * @param {Object} options
 * @param {boolean} [options.force=false]
 */
export async function fetchLiveContests(options = {}) {
  const { force = false } = options;
  const url = `${API_BASE}/api/contests?force=${force}`;

  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout ? AbortSignal.timeout(10000) : undefined,
    });
    const data = await res.json();

    if (!res.ok || !data.success || !Array.isArray(data.contests)) {
      return {
        success: false,
        contests: [],
        error: data.error || "Failed to fetch live contest feeds.",
      };
    }

    return {
      success: true,
      contests: data.contests,
      count: data.count,
    };
  } catch (err) {
    return {
      success: false,
      contests: [],
      error: err.message || "Network error fetching contests.",
    };
  }
}

