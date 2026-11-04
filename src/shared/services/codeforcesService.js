const API_BASE = "/api/platforms/codeforces";

/**
 * Client-side service to communicate with backend Codeforces sync API.
 */
export async function fetchLiveCodeforcesStats(handle, options = {}) {
  if (!handle) {
    return { success: false, error: "Handle is required." };
  }

  const queryParams = options.force ? "?force=true" : "";
  const url = `${API_BASE}/${encodeURIComponent(handle)}${queryParams}`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    const data = await response.json();
    return data;
  } catch (err) {
    return {
      success: false,
      error: err.message || "Failed to reach Codeforces sync service.",
    };
  }
}

