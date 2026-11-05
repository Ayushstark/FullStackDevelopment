/**
 * Client service for real-time GeeksforGeeks profile data retrieval.
 */

const API_BASE = import.meta.env.VITE_API_URL || "";

/**
 * Fetches real-time GeeksforGeeks stats for a user handle.
 * @param {string} handle - GeeksforGeeks handle (e.g. "alex_gfg")
 * @param {Object} options - Options object
 * @param {boolean} [options.force=false] - Whether to bypass cache on server
 */
export async function fetchLiveGfgStats(handle, options = {}) {
  const { force = false } = options;

  if (!handle || typeof handle !== "string" || !handle.trim()) {
    return {
      success: false,
      error: "Please enter a valid GeeksforGeeks handle.",
    };
  }

  const cleanHandle = handle.trim();
  const url = `${API_BASE}/api/platforms/gfg/${encodeURIComponent(cleanHandle)}?force=${force}`;

  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout ? AbortSignal.timeout(12000) : undefined,
    });
    const data = await response.json();

    if (!response.ok || !data.success) {
      return {
        success: false,
        error: data.error || `Failed to retrieve GeeksforGeeks profile (Status ${response.status}).`,
      };
    }

    return {
      success: true,
      data,
    };
  } catch (err) {
    if (err.name === "TimeoutError" || err.name === "AbortError") {
      return {
        success: false,
        error: "Request timed out while connecting to GeeksforGeeks. Please try again.",
      };
    }

    return {
      success: false,
      error: `Network request failed: ${err.message}. Ensure backend is running.`,
      fallback: true,
    };
  }
}

