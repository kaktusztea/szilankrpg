import { Component } from 'react';
import type { ReactNode, ErrorInfo } from 'react';

export class ScreenErrorBoundary extends Component<{ children: ReactNode }, { error: string | null }> {
  state = { error: null as string | null };
  static getDerivedStateFromError(error: Error) { return { error: error.message }; }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error('Screen crash:', error, info); }
  render() {
    if (this.state.error) return (
      <div className="error-boundary">
        <p><strong>⚠️ Hiba a megjelenítésben</strong></p>
        <p className="error-boundary-msg">{this.state.error}</p>
        <button className="error-boundary-btn" onClick={() => this.setState({ error: null })}>Újrapróbálás</button>
      </div>
    );
    return this.props.children;
  }
}
