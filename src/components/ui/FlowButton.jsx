import { ArrowRight } from "lucide-react";
import "./FlowButton.css";

export function FlowButton({
  text = "Modern Button",
  onClick,
  type = "button",
  className = "",
  ...buttonProps
}) {
  return (
    <button
      {...buttonProps}
      className={`flow-button ${className}`.trim()}
      onClick={onClick}
      type={type}
    >
      <ArrowRight className="flow-button-arrow flow-button-arrow-left" aria-hidden="true" />
      <span className="flow-button-label">{text}</span>
      <span className="flow-button-circle" aria-hidden="true" />
      <ArrowRight className="flow-button-arrow flow-button-arrow-right" aria-hidden="true" />
    </button>
  );
}
