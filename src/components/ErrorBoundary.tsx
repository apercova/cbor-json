import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
}

class ErrorBoundary extends React.Component<React.PropsWithChildren, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <main role="alert" className="app-error-fallback">
          <h1>Something went wrong</h1>
          <p>The converter could not display this page. Refresh to try again.</p>
        </main>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
