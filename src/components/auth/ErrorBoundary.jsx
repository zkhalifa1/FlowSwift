import React from 'react';
import { logger } from "@/utils/logger";


class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    logger.error('Error caught by boundary:', error);
    logger.error('Error info:', errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  render() {
    const { hasError, error, errorInfo } = this.state;

    if (hasError) {
      return (
        <div style={{ padding: '20px', backgroundColor: '#fee', border: '1px solid #fcc' }}>
          <h2>Something went wrong in AuthProvider</h2>
          <details style={{ whiteSpace: 'pre-wrap', marginTop: '10px' }}>
            <summary>Click to see error details</summary>
            <p><strong>Error:</strong> {error?.toString()}</p>
            <p><strong>Stack trace:</strong></p>
            <pre>{errorInfo?.componentStack || "No component stack available."}</pre>
          </details>
          <button
            onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
            style={{ marginTop: '10px', padding: '8px 16px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px' }}
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;