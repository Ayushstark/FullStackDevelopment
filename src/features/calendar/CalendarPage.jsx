import {
  Bell,
  Calendar,
  CalendarDays,
  Clock,
  ExternalLink,
  Flame,
  Globe,
  Plus,
  Search,
  Timer,
  Trophy,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useAppContext } from "../../shared/context/AppContext.jsx";

export function CalendarPage() {
  const { calendarEvents, toggleCalendarReminder, addCalendarEvent } = useAppContext();

  const [activeTab, setActiveTab] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [platformFilter, setPlatformFilter] = useState("all");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New event modal local state
  const [title, setTitle] = useState("");
  const [organizer, setOrganizer] = useState("");
  const [eventType, setEventType] = useState("Contest");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [link, setLink] = useState("");
  const [description, setDescription] = useState("");

  const contestsCount = useMemo(
    () => calendarEvents.filter((e) => e.type === "Contest").length,
    [calendarEvents],
  );
  const hackathonsCount = useMemo(
    () => calendarEvents.filter((e) => e.type === "Hackathon").length,
    [calendarEvents],
  );
  const deadlinesCount = useMemo(
    () => calendarEvents.filter((e) => e.type === "Deadline").length,
    [calendarEvents],
  );
  const remindersCount = useMemo(
    () => calendarEvents.filter((e) => e.isReminderSet).length,
    [calendarEvents],
  );

  const filteredEvents = useMemo(() => {
    return calendarEvents.filter((item) => {
      // Type matching based on tab
      if (activeTab === "Contest" && item.type !== "Contest") return false;
      if (activeTab === "Hackathon" && item.type !== "Hackathon") return false;
      if (activeTab === "Deadline" && item.type !== "Deadline") return false;
      if (activeTab === "Reminders" && !item.isReminderSet) return false;

      // Platform / Organizer filter
      if (
        platformFilter !== "all" &&
        item.organizer.toLowerCase() !== platformFilter.toLowerCase()
      ) {
        return false;
      }

      // Search matching
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(query);
        const matchesOrganizer = item.organizer.toLowerCase().includes(query);
        const matchesDesc = item.description?.toLowerCase().includes(query);
        const matchesTags = item.tags?.some((t) => t.toLowerCase().includes(query));
        return matchesTitle || matchesOrganizer || matchesDesc || matchesTags;
      }

      return true;
    });
  }, [calendarEvents, activeTab, platformFilter, searchQuery]);

  const handleAddEvent = (e) => {
    e.preventDefault();
    if (!title.trim() || !date.trim()) return;

    const newEvent = {
      id: `evt-${Date.now()}`,
      title: title.trim(),
      organizer: organizer.trim() || "Independent",
      type: eventType,
      date,
      time: time.trim() || "All Day",
      link: link.trim() || "#",
      status: "Upcoming",
      description: description.trim() || "User-added event or deadline",
      tags: [eventType],
      isReminderSet: true,
    };

    addCalendarEvent(newEvent);
    setIsAddModalOpen(false);
    setTitle("");
    setOrganizer("");
    setDate("");
    setTime("");
    setLink("");
    setDescription("");
  };

  return (
    <main className="page-content calendar-page">
      {/* Page Heading */}
      <div className="page-heading">
        <div>
          <p className="eyebrow">Contests &amp; Hackathons</p>
          <h1>Curated Events &amp; Challenges</h1>
          <p className="muted">
            Discover upcoming coding rounds, competitive arenas, and global hackathons with live reminders.
          </p>
        </div>
        <button
          className="button button-primary"
          onClick={() => setIsAddModalOpen(true)}
          type="button"
        >
          <Plus size={16} /> Add Custom Event
        </button>
      </div>

      {/* Tabs */}
      <div className="tab-bar">
        <button
          className={`tab-btn ${activeTab === "All" ? "active" : ""}`}
          onClick={() => setActiveTab("All")}
          type="button"
        >
          All Events ({calendarEvents.length})
        </button>
        <button
          className={`tab-btn ${activeTab === "Contest" ? "active" : ""}`}
          onClick={() => setActiveTab("Contest")}
          type="button"
        >
          Coding Contests ({contestsCount})
        </button>
        <button
          className={`tab-btn ${activeTab === "Hackathon" ? "active" : ""}`}
          onClick={() => setActiveTab("Hackathon")}
          type="button"
        >
          Hackathons &amp; Builders ({hackathonsCount})
        </button>
        <button
          className={`tab-btn ${activeTab === "Deadline" ? "active" : ""}`}
          onClick={() => setActiveTab("Deadline")}
          type="button"
        >
          Application Deadlines ({deadlinesCount})
        </button>
        <button
          className={`tab-btn ${activeTab === "Reminders" ? "active" : ""}`}
          onClick={() => setActiveTab("Reminders")}
          type="button"
        >
          My Alerts ({remindersCount})
        </button>
      </div>

      {/* Search & Platform Filter Bar */}
      <div
        style={{
          display: "flex",
          gap: 12,
          flexWrap: "wrap",
          alignItems: "center",
          marginBottom: 20,
        }}
      >
        <div
          className="search-bar"
          style={{
            flex: "1 1 280px",
            margin: 0,
            background: "rgba(255, 255, 255, 0.04)",
          }}
        >
          <Search size={18} />
          <input
            placeholder="Search events by name, platform, or topic (e.g. Div. 2, Web3, Algorithms)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              style={{
                background: "transparent",
                border: "none",
                color: "var(--color-text-muted)",
                cursor: "pointer",
                padding: "0 6px",
              }}
            >
              <X size={16} />
            </button>
          )}
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span className="muted" style={{ fontSize: 13 }}>Platform:</span>
          <select
            className="form-select"
            style={{ width: "auto", padding: "8px 12px", fontSize: 13 }}
            value={platformFilter}
            onChange={(e) => setPlatformFilter(e.target.value)}
          >
            <option value="all">All Platforms</option>
            <option value="Codeforces">Codeforces</option>
            <option value="LeetCode">LeetCode</option>
            <option value="CodeChef">CodeChef</option>
            <option value="AtCoder">AtCoder</option>
            <option value="GitHub">GitHub</option>
            <option value="ETHGlobal">ETHGlobal</option>
          </select>
        </div>
      </div>

      {/* Events Grid */}
      {filteredEvents.length === 0 ? (
        <div className="empty-state" style={{ padding: "48px 20px", textAlign: "center" }}>
          <Trophy size={40} color="var(--color-text-muted)" style={{ margin: "0 auto 12px" }} />
          <h3 style={{ margin: "0 0 6px", fontSize: 17, color: "var(--color-text-title)" }}>
            No matching events found
          </h3>
          <p className="muted" style={{ maxWidth: 440, margin: "0 auto 14px", fontSize: 13 }}>
            Try clearing your search query or switching your platform filter to see more events.
          </p>
          <button
            type="button"
            className="button button-secondary button-sm"
            onClick={() => {
              setSearchQuery("");
              setPlatformFilter("all");
              setActiveTab("All");
            }}
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: 16,
          }}
        >
          {filteredEvents.map((evt) => (
            <article
              key={evt.id}
              className="panel"
              style={{
                padding: 20,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                gap: 16,
                transition: "border-color 0.15s ease",
              }}
            >
              <div>
                {/* Header: Platform pill & Type tag */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 10,
                  }}
                >
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: "var(--color-primary-light, #818cf8)",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    {evt.organizer}
                  </span>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    {evt.status === "Live" && (
                      <span
                        style={{
                          background: "var(--color-success-bg)",
                          color: "#34d399",
                          border: "1px solid var(--color-success-border)",
                          fontSize: 10,
                          padding: "2px 6px",
                          borderRadius: 99,
                          fontWeight: 700,
                        }}
                      >
                        ● LIVE NOW
                      </span>
                    )}
                    <span
                      className={`tag ${
                        evt.type === "Contest"
                          ? "tag-research"
                          : evt.type === "Hackathon"
                            ? "tag-hackathon"
                            : ""
                      }`}
                      style={{ fontSize: 11 }}
                    >
                      {evt.type}
                    </span>
                  </div>
                </div>

                <h3
                  style={{
                    fontSize: 16,
                    margin: "0 0 8px 0",
                    color: "var(--color-text-title)",
                    lineHeight: 1.35,
                  }}
                >
                  {evt.title}
                </h3>

                <p
                  className="muted"
                  style={{
                    fontSize: 13,
                    margin: "0 0 14px 0",
                    lineHeight: 1.5,
                  }}
                >
                  {evt.description}
                </p>

                {/* Topic Tags */}
                {evt.tags && evt.tags.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
                    {evt.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        style={{
                          fontSize: 11,
                          background: "rgba(255, 255, 255, 0.05)",
                          border: "1px solid var(--color-border)",
                          padding: "2px 8px",
                          borderRadius: 4,
                          color: "var(--color-text-main)",
                          fontWeight: 500,
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer: Date, Time & Action Link */}
              <div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 5,
                    fontSize: 12,
                    color: "var(--color-text-muted)",
                    paddingTop: 12,
                    borderTop: "1px solid var(--color-border-subtle, rgba(255, 255, 255, 0.06))",
                    marginBottom: 12,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <Calendar size={14} />
                    <span>{evt.date}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <Clock size={14} />
                    <span>{evt.time}</span>
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                  <button
                    type="button"
                    className={`button button-sm ${
                      evt.isReminderSet ? "button-accent" : "button-secondary"
                    }`}
                    onClick={() => toggleCalendarReminder(evt.id)}
                    style={{ fontSize: 12 }}
                  >
                    <Bell size={13} fill={evt.isReminderSet ? "currentColor" : "none"} />
                    {evt.isReminderSet ? "Alert Set" : "Notify Me"}
                  </button>

                  <a
                    href={evt.link}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="button button-primary button-sm"
                    style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12 }}
                  >
                    Register <ExternalLink size={12} />
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Add Custom Event Modal */}
      {isAddModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAddModalOpen(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2 style={{ margin: 0, fontSize: 18, color: "var(--color-primary)" }}>
                  Add Custom Calendar Item
                </h2>
                <p className="muted">Add a contest, college hackathon, or interview deadline.</p>
              </div>
              <button
                className="close-btn"
                onClick={() => setIsAddModalOpen(false)}
                type="button"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddEvent}>
              <div className="modal-body">
                <div className="form-group">
                  <label htmlFor="evtTitle">Event or Deadline Title *</label>
                  <input
                    id="evtTitle"
                    className="form-input"
                    placeholder="e.g. AtCoder Beginner Contest 375"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div className="form-group">
                    <label htmlFor="evtOrg">Organizer / Platform</label>
                    <input
                      id="evtOrg"
                      className="form-input"
                      placeholder="e.g. AtCoder, Major League Hacking"
                      value={organizer}
                      onChange={(e) => setOrganizer(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="evtTypeSelect">Type</label>
                    <select
                      id="evtTypeSelect"
                      className="form-select"
                      value={eventType}
                      onChange={(e) => setEventType(e.target.value)}
                    >
                      <option value="Contest">Contest</option>
                      <option value="Hackathon">Hackathon</option>
                      <option value="Deadline">Application Deadline</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div className="form-group">
                    <label htmlFor="evtDate">Date *</label>
                    <input
                      id="evtDate"
                      type="date"
                      className="form-input"
                      required
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="evtTime">Time / Window</label>
                    <input
                      id="evtTime"
                      className="form-input"
                      placeholder="e.g. 17:30 UTC"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="evtLink">Link / Registration URL</label>
                  <input
                    id="evtLink"
                    type="url"
                    className="form-input"
                    placeholder="https://codeforces.com/contest/..."
                    value={link}
                    onChange={(e) => setLink(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="evtDesc">Short Description</label>
                  <textarea
                    id="evtDesc"
                    className="form-textarea"
                    placeholder="Div. 2 rated round; 2 hours duration."
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={() => setIsAddModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="button button-primary">
                  Save Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
