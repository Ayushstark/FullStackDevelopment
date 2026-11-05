import {
  Calendar,
  ExternalLink,
  GripVertical,
  MapPin,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useAppContext } from "../../shared/context/AppContext.jsx";
import "./applications-scratch-board.css";

const STATUS_COLUMNS = [
  { key: "Saved", label: "Saved Roles", color: "#64748b", colClass: "col-saved" },
  { key: "Applied", label: "Applied", color: "#0284c7", colClass: "col-applied" },
  { key: "Interviewing", label: "Interviewing", color: "#d97706", colClass: "col-interviewing" },
  { key: "Offer", label: "Offer Received", color: "#10b981", colClass: "col-offer" },
  { key: "Rejected", label: "Archived", color: "#94a3b8", colClass: "col-rejected" },
];

export function ApplicationsPage() {
  const {
    applications,
    updateApplicationStatus,
    updateApplicationNotes,
    deleteApplication,
    createManualApplication,
  } = useAppContext();

  // Drag and Drop state (Scratch-inspired tactile block snapping)
  const [draggedAppId, setDraggedAppId] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Close add modal on Escape key for keyboard/screen reader users
  useEffect(() => {
    if (!isAddModalOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setIsAddModalOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isAddModalOpen]);
  const [editingNotesId, setEditingNotesId] = useState(null);
  const [tempNotes, setTempNotes] = useState("");

  // New application form state
  const [newCompany, setNewCompany] = useState("");
  const [newRole, setNewRole] = useState("");
  const [newLocation, setNewLocation] = useState("Remote");
  const [newStatus, setNewStatus] = useState("Applied");
  const [newDeadline, setNewDeadline] = useState("");
  const [newNotes, setNewNotes] = useState("");

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!newCompany.trim() || !newRole.trim()) return;

    createManualApplication({
      company: newCompany.trim(),
      role: newRole.trim(),
      location: newLocation,
      status: newStatus,
      appliedDate: new Date().toISOString().split("T")[0],
      deadline: newDeadline || "Ongoing",
      notes: newNotes.trim() || "Tracked manually",
    });

    // Reset and close
    setNewCompany("");
    setNewRole("");
    setNewNotes("");
    setNewDeadline("");
    setIsAddModalOpen(false);
  };

  const handleSaveNotes = (id) => {
    updateApplicationNotes(id, tempNotes);
    setEditingNotesId(null);
  };

  // Drag and drop event handlers
  const dragCounterRef = useRef({});
  const draggedAppIdRef = useRef(null);

  const handleDragStart = (e, appId) => {
    e.stopPropagation();
    if (!appId) return;
    draggedAppIdRef.current = String(appId);
    setDraggedAppId(String(appId));
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(appId));
    try {
      e.dataTransfer.setData("application/x-devrhythm-app", String(appId));
    } catch {
      // Ignore
    }
  };

  const handleDragEnd = () => {
    dragCounterRef.current = {};
    draggedAppIdRef.current = null;
    setDraggedAppId(null);
    setDragOverColumn(null);
  };

  const handleDragEnter = (e, columnKey) => {
    e.preventDefault();
    dragCounterRef.current[columnKey] = (dragCounterRef.current[columnKey] || 0) + 1;
    setDragOverColumn(columnKey);
  };

  const handleDragOver = (e, columnKey) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverColumn !== columnKey) {
      setDragOverColumn(columnKey);
    }
  };

  const handleDragLeave = (e, columnKey) => {
    e.preventDefault();
    dragCounterRef.current[columnKey] = Math.max(0, (dragCounterRef.current[columnKey] || 1) - 1);
    if (dragCounterRef.current[columnKey] === 0) {
      setDragOverColumn((current) => (current === columnKey ? null : current));
    }
  };

  const handleDrop = (e, targetStatus) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current = {};
    const appId =
      e.dataTransfer.getData("application/x-devrhythm-app") ||
      e.dataTransfer.getData("text/plain") ||
      draggedAppIdRef.current ||
      draggedAppId;
    if (appId) {
      updateApplicationStatus(appId, targetStatus);
    }
    draggedAppIdRef.current = null;
    setDraggedAppId(null);
    setDragOverColumn(null);
  };

  return (
    <main className="page-content">
      {/* Page Heading */}
      <div className="page-heading applications-heading">
        <div>
          <p className="eyebrow">Your search</p>
          <h1>Applications</h1>
          <p className="muted">
            Organize your internship and job applications across every recruitment stage.
          </p>
        </div>
        <div className="applications-heading-actions">
          <button
            className="button button-primary"
            onClick={() => setIsAddModalOpen(true)}
            type="button"
          >
            <Plus size={16} /> Track New Application
          </button>
        </div>
      </div>

      {/* Scratch-Inspired Kanban Board */}
      <div className="tracker-board applications-board" aria-label="Application stages kanban board">
        {STATUS_COLUMNS.map((column) => {
          const colApps = applications.filter((app) => app.status === column.key);
          const isDragOver = dragOverColumn === column.key;

          return (
            <div
              className={`tracker-column application-column ${column.colClass} ${isDragOver ? "is-drag-over" : ""}`}
              key={column.key}
              onDragEnter={(e) => handleDragEnter(e, column.key)}
              onDragOver={(e) => handleDragOver(e, column.key)}
              onDragLeave={(e) => handleDragLeave(e, column.key)}
              onDrop={(e) => handleDrop(e, column.key)}
              style={{ "--column-accent": column.color }}
            >
              <div className="column-header">
                <span className="column-header-pill">
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      backgroundColor: column.color,
                      boxShadow: `0 0 6px ${column.color}`,
                    }}
                  />
                  {column.label}
                </span>
                <span className="column-badge">{colApps.length}</span>
              </div>

              {/* Slot placeholder during drag over */}
              {isDragOver && draggedAppId && (
                <div className="drag-placeholder-slot">
                  <span>✨ Snap block to {column.label}</span>
                </div>
              )}

              {colApps.length === 0 ? (
                <div
                  className="empty-column-zone"
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = "move";
                    if (dragOverColumn !== column.key) {
                      setDragOverColumn(column.key);
                    }
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleDrop(e, column.key);
                  }}
                >
                  <span>Drop block here</span>
                </div>
              ) : (
                colApps.map((app) => {
                  const appId = String(app.id || app._id || "");
                  const isDraggingThis = Boolean(draggedAppId && String(draggedAppId) === appId);
                  const cardClass =
                    app.status === "Saved"
                      ? "card-saved"
                      : app.status === "Applied"
                      ? "card-applied"
                      : app.status === "Interviewing"
                      ? "card-interviewing"
                      : app.status === "Offer"
                      ? "card-offer"
                      : "card-rejected";

                  return (
                    <article
                      className={`scratch-block-card tracker-card application-card ${cardClass} ${isDraggingThis ? "is-dragging" : ""}`}
                      key={appId}
                      draggable={editingNotesId !== appId}
                      onDragStart={(e) => handleDragStart(e, appId)}
                      onDragEnd={handleDragEnd}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = "move";
                        if (dragOverColumn !== column.key) {
                          setDragOverColumn(column.key);
                        }
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleDrop(e, column.key);
                      }}
                    >
                      <div className="scratch-block-top">
                        <strong className="scratch-role-title">{app.role}</strong>
                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <span className="scratch-grip-handle" title="Drag to reorder/move block">
                            <GripVertical size={13} />
                          </span>
                          <button
                            className="text-button"
                            onClick={() => deleteApplication(appId)}
                            title="Remove application"
                            aria-label={`Delete application for ${app.role} at ${app.company}`}
                            style={{ color: "#94a3b8", padding: 2 }}
                            type="button"
                          >
                            <Trash2 size={13} aria-hidden="true" />
                          </button>
                        </div>
                      </div>

                      <div className="scratch-company-row">
                        <span>{app.company}</span>
                      </div>

                      <div className="scratch-location-tag">
                        <MapPin size={12} /> {app.location}
                      </div>

                      <div className="scratch-badge-deadline">
                        <Calendar size={12} /> Due: {app.deadline}
                      </div>

                      {/* Notes preview or edit */}
                      {editingNotesId === appId ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 4 }}>
                          <textarea
                            className="form-textarea"
                            style={{ minHeight: 60, fontSize: 12 }}
                            value={tempNotes}
                            onChange={(e) => setTempNotes(e.target.value)}
                          />
                          <div style={{ display: "flex", gap: 6 }}>
                            <button
                              className="button button-primary button-sm"
                              onClick={() => handleSaveNotes(appId)}
                              type="button"
                            >
                              Save
                            </button>
                            <button
                              className="button button-secondary button-sm"
                              onClick={() => setEditingNotesId(null)}
                              type="button"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div
                          className="scratch-notes-box"
                          onClick={() => {
                            setEditingNotesId(appId);
                            setTempNotes(app.notes);
                          }}
                          title="Click to edit notes"
                        >
                          {app.notes || "+ Add interview or follow-up notes..."}
                        </div>
                      )}

                      {/* Move stage selector dropdown & link */}
                      <div className="scratch-card-footer">
                        <select
                          className="scratch-stage-select"
                          value={app.status}
                          onChange={(e) =>
                            updateApplicationStatus(appId, e.target.value)
                          }
                          aria-label="Move application stage"
                        >
                          {STATUS_COLUMNS.map((col) => (
                            <option key={col.key} value={col.key}>
                              Move: {col.label}
                            </option>
                          ))}
                        </select>

                        {app.sourceUrl && (
                          <a
                            href={app.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-button"
                            title="Open job source"
                            style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11 }}
                          >
                            <span>Link</span>
                            <ExternalLink size={12} />
                          </a>
                        )}
                      </div>
                    </article>
                  );
                })
              )}
            </div>
          );
        })}
      </div>

      {/* Add Application Modal */}
      {isAddModalOpen && createPortal(
        <div
          className="modal-overlay applications-modal-overlay"
          onClick={() => setIsAddModalOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-app-dialog-title"
        >
          <div className="modal-dialog applications-modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2 id="add-app-dialog-title" style={{ margin: 0, fontSize: 18, color: "var(--color-primary)" }}>
                  Track New Application
                </h2>
                <p className="muted">Add a job, internship, or research opening to your board.</p>
              </div>
              <button
                className="close-btn"
                onClick={() => setIsAddModalOpen(false)}
                type="button"
                aria-label="Close track application dialog"
              >
                <X size={20} aria-hidden="true" />
              </button>
            </div>

            <form className="applications-modal-form" onSubmit={handleAddSubmit}>
              <div className="modal-body applications-modal-body">
                <div className="form-group">
                  <label htmlFor="compName">Company or Institution *</label>
                  <input
                    id="compName"
                    className="form-input"
                    placeholder="e.g. Google, Stripe, IIT Delhi Lab"
                    required
                    value={newCompany}
                    onChange={(e) => setNewCompany(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="roleTitle">Role or Position Title *</label>
                  <input
                    id="roleTitle"
                    className="form-input"
                    placeholder="e.g. Software Engineering Intern, ML Researcher"
                    required
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div className="form-group">
                    <label htmlFor="locInput">Location / Work Type</label>
                    <select
                      id="locInput"
                      className="form-select custom-modal-select"
                      value={newLocation}
                      onChange={(e) => setNewLocation(e.target.value)}
                    >
                      <option value="Remote">Remote</option>
                      <option value="Onsite">Onsite</option>
                      <option value="Hybrid">Hybrid</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="stageSelect">Current Stage</label>
                    <select
                      id="stageSelect"
                      className="form-select custom-modal-select"
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                    >
                      {STATUS_COLUMNS.map((col) => (
                        <option key={col.key} value={col.key}>
                          {col.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="deadlineInput">Deadline or Next Step Date</label>
                  <input
                    id="deadlineInput"
                    className="form-input"
                    placeholder="e.g. Nov 15, 2026"
                    value={newDeadline}
                    onChange={(e) => setNewDeadline(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="notesInput">Initial Notes / Interview Links</label>
                  <textarea
                    id="notesInput"
                    className="form-textarea"
                    placeholder="Referral name, round progress, follow-up date..."
                    value={newNotes}
                    onChange={(e) => setNewNotes(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer applications-modal-footer">
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={() => setIsAddModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="button button-primary">
                  Save Application
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body,
      )}
    </main>
  );
}
