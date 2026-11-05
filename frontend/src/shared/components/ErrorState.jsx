import { AlertTriangle, Home, RefreshCw } from "lucide-react";
import "./ErrorState.css";

export function ErrorState({
  title = "Something went wrong",
  message = "We encountered an issue loading this section. Please try again or navigate back home.",
  details = null,
  onRetry = null,
  onGoHome = null,
  compact = false,
}) {
  return (
    <div
      className={`error-state-container ${compact ? "compact" : ""}`}
      role="alert"
      aria-live="assertive"
    >
      <div className="error-icon-badge" aria-hidden="true">
        <AlertTriangle size={24} />
      </div>

      <h3 className="error-title">{title}</h3>
      <p className="error-description">{message}</p>

      {details && (
        <div className="error-details-box" title="Error details">
          {typeof details === "string" ? details : details.message || JSON.stringify(details)}
        </div>
      )}

      <div className="error-actions-group">
        {onRetry && (
          <button
            type="button"
            className="button button-primary button-sm"
            onClick={onRetry}
            style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
          >
            <RefreshCw size={13} /> Try Again
          </button>
        )}

        {onGoHome && (
          <button
            type="button"
            className="button button-secondary button-sm"
            onClick={onGoHome}
            style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
          >
            <Home size={13} /> Back to Overview
          </button>
        )}
      </div>
    </div>
  );
}

