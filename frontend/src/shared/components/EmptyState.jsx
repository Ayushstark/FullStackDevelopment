import { FolderOpen, Plus } from "lucide-react";
import "./EmptyState.css";

export function EmptyState({
  icon: Icon = FolderOpen,
  title = "No data found",
  message = "There are no records matching your current criteria.",
  actionLabel = null,
  onAction = null,
  actionIcon: ActionIcon = Plus,
  compact = false,
}) {
  return (
    <div className={`empty-state-wrapper ${compact ? "compact" : ""}`} role="status">
      <div className="empty-state-icon-box" aria-hidden="true">
        <Icon size={22} />
      </div>

      <h4 className="empty-state-title">{title}</h4>
      <p className="empty-state-message">{message}</p>

      {actionLabel && onAction && (
        <button
          type="button"
          className="button button-primary button-sm empty-state-action"
          onClick={onAction}
        >
          {ActionIcon && <ActionIcon size={13} />}
          <span>{actionLabel}</span>
        </button>
      )}
    </div>
  );
}

