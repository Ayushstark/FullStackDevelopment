import { Component } from "react";
import { ErrorState } from "./ErrorState.jsx";

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an unhandled error:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <main className="page-content" style={{ padding: 24 }}>
          <ErrorState
            title="Component Error Encountered"
            message="An unexpected error occurred while rendering this page."
            details={this.state.error?.message}
            onRetry={this.handleReset}
            onGoHome={this.props.onGoHome}
            compact={this.props.compact}
          />
        </main>
      );
    }

    return this.props.children;
  }
}

