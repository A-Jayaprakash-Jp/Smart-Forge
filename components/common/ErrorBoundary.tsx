import React, { Component, ErrorInfo, ReactNode } from "react";
import { ExclamationCircleIcon } from './Icons';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(_: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center bg-disa-light-bg dark:bg-disa-dark-bg text-gray-800 dark:text-white">
            <div className="gradient-bg"></div>
            <ExclamationCircleIcon className="w-24 h-24 text-disa-red" />
            <h1 className="mt-4 text-3xl font-bold">Application Error</h1>
            <p className="mt-2 text-lg text-gray-600 dark:text-gray-300">
                Something went wrong. Please try refreshing the page.
            </p>
            <button
                onClick={() => window.location.reload()}
                className="px-6 py-2 mt-6 font-semibold text-white transition-colors rounded-lg bg-disa-accent-blue hover:bg-blue-500"
            >
                Refresh
            </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
