/**
 * Browser Native Notification and Contest Reminder Service
 * Uses the Web Notifications API to trigger native desktop/OS push alerts
 * before contest start times.
 */

/**
 * Requests permission for browser native notifications.
 * @returns {Promise<boolean>} Whether permission was granted
 */
export async function requestNotificationPermission() {
  if (!("Notification" in window)) {
    console.warn("This browser does not support desktop notifications.");
    return false;
  }

  if (Notification.permission === "granted") {
    return true;
  }

  if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission();
    return permission === "granted";
  }

  return false;
}

/**
 * Parses event date and time strings into a valid Date object.
 * @param {string} dateStr e.g. "2026-11-06"
 * @param {string} timeStr e.g. "08:05 pm IST"
 * @returns {Date|null}
 */
export function parseEventStartTime(dateStr, timeStr) {
  if (!dateStr) return null;

  try {
    // If time contains IST or AM/PM (e.g. "08:05 pm IST (2.5 hrs)" or "20:05 IST")
    if (timeStr && typeof timeStr === "string") {
      const cleanTime = timeStr.replace(/\(.*?\)/g, "").replace(/IST/i, "").trim();
      const combined = `${dateStr} ${cleanTime}`;
      const parsed = new Date(combined);
      if (!isNaN(parsed.getTime())) {
        return parsed;
      }
    }

    // Fallback to start of day
    const fallback = new Date(`${dateStr}T09:00:00`);
    return isNaN(fallback.getTime()) ? null : fallback;
  } catch {
    return null;
  }
}

/**
 * Dispatches a native desktop notification immediately.
 * @param {string} title
 * @param {Object} options
 */
export function showDesktopNotification(title, options = {}) {
  if (!("Notification" in window) || Notification.permission !== "granted") {
    return null;
  }

  const notification = new Notification(title, {
    icon: "/favicon.ico",
    badge: "/favicon.ico",
    ...options,
  });

  if (options.url) {
    notification.onclick = () => {
      window.focus();
      window.open(options.url, "_blank");
    };
  }

  return notification;
}

/**
 * Active in-memory timers for scheduled contest alerts
 */
const activeTimers = new Map();

/**
 * Schedules a native desktop notification 15 minutes before contest start
 * (or sends an immediate confirmation notification when first set).
 * @param {Object} event Contest/event object
 */
export function scheduleContestReminder(event) {
  if (!event || !event.id) return;

  // Clear existing timer if any
  if (activeTimers.has(event.id)) {
    clearTimeout(activeTimers.get(event.id));
    activeTimers.delete(event.id);
  }

  const startTime = parseEventStartTime(event.date, event.time);
  if (!startTime) return;

  const now = Date.now();
  // Alert 15 minutes before start
  const alertTime = startTime.getTime() - 15 * 60 * 1000;
  const delay = alertTime - now;

  // Send an immediate confirmation notification if permission is granted
  showDesktopNotification(`Reminder Set: ${event.title}`, {
    body: `${event.organizer} contest scheduled for ${event.date} at ${event.time}. We will alert you 15 minutes before it starts!`,
    tag: `confirm-${event.id}`,
    url: event.link,
  });

  if (delay > 0) {
    const timerId = setTimeout(() => {
      showDesktopNotification(`Starting Soon: ${event.title}`, {
        body: `The ${event.organizer} challenge begins in 15 minutes (${event.time}). Click to open arena!`,
        tag: `alert-${event.id}`,
        url: event.link,
      });
      activeTimers.delete(event.id);
    }, delay);

    activeTimers.set(event.id, timerId);
  }
}

/**
 * Cancels a scheduled contest reminder.
 * @param {string} eventId
 */
export function cancelContestReminder(eventId) {
  if (activeTimers.has(eventId)) {
    clearTimeout(activeTimers.get(eventId));
    activeTimers.delete(eventId);
  }
}

