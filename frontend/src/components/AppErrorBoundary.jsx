import { Component } from "react";

export default class AppErrorBoundary extends Component {
  state = { error: null, componentStack: "" };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("[Family Ledger] React render error", error, errorInfo);
    this.setState({ componentStack: errorInfo.componentStack ?? "" });
  }

  render() {
    const { error, componentStack } = this.state;
    if (!error) return this.props.children;

    return (
      <main className="app-error" role="alert">
        <h1>Something went wrong</h1>
        <p>The error was logged to the browser console.</p>
        {import.meta.env.DEV && (
          <details>
            <summary>Technical details</summary>
            <pre>{error.stack ?? error.message}</pre>
            <pre>{componentStack}</pre>
          </details>
        )}
        <button type="button" onClick={() => window.location.reload()}>
          Reload app
        </button>
      </main>
    );
  }
}
