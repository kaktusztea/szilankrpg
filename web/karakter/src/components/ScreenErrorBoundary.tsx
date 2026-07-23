import { Component } from 'react';
import type { ReactNode, ErrorInfo } from 'react';

export class ScreenErrorBoundary extends Component<{ children: ReactNode }, { error: string | null }> {
  state = { error: null as string | null };
  static getDerivedStateFromError(error: Error) { return { error: error.message }; }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error('Screen crash:', error, info); }
  render() {
    if (this.state.error) return (
      <div style={{ padding: 16, color: '#f44', background: '#2a1a1a', margin: 8, borderRadius: 6, fontSize: 13, whiteSpace: 'pre-wrap' }}>
        <p><strong>⚠️ Screen crash (ErrorBoundary)</strong></p>
        <p>{this.state.error}</p>
        <button style={{ marginTop: 8, padding: '4px 12px', background: '#444', color: '#eee', border: 'none', borderRadius: 4 }}
          onClick={() => this.setState({ error: null })}>Újrapróbálás</button>
      </div>
    );
    return this.props.children;
  }
}
