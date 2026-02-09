import { Component, ReactNode } from "react";
import { motion } from "framer-motion";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="min-h-screen breathing-bg flex flex-col items-center justify-center px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-sm"
          >
            <div className="text-6xl mb-4">🥀</div>
            <h1 className="font-display text-3xl font-bold text-foreground mb-3">
              Oops, a Misstep
            </h1>
            <p className="text-muted-foreground font-body text-sm mb-6">
              Something went wrong. Don't worry — your data is safe.
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.href = "/discover";
              }}
              className="btn-waltz"
            >
              Back to the Dance Floor
            </button>
            {this.state.error && (
              <p className="mt-4 text-[10px] text-muted-foreground/40 font-body break-all">
                {this.state.error.message}
              </p>
            )}
          </motion.div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
