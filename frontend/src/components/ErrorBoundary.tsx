import { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary component that catches JavaScript errors anywhere in the child
 * component tree and displays a fallback UI instead of crashing the whole app.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console in development
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Card>
          <CardContent>
            <div style={{ textAlign: 'center', padding: 'var(--space-6)' }}>
              <h2 style={{ marginBottom: 'var(--space-3)', color: 'var(--danger)' }}>
                Something went wrong
              </h2>
              <p style={{ marginBottom: 'var(--space-4)', color: 'var(--text-secondary)' }}>
                An unexpected error occurred. Please try again.
              </p>
              <Button onClick={this.handleRetry} variant="secondary">
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}
