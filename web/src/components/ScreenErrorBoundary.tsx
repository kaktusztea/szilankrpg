import { Component } from 'react';
import type { ReactNode, ErrorInfo } from 'react';

export class ScreenErrorBoundary extends Component<{ children: ReactNode }, { error: string | null }> {
  state = { error: null as string | null };
  static getDerivedStateFromError(error: Error) { return { error: error.message }; }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error('Screen crash:', error, info); }
  render() {
    if (this.state.error) return (
      <div style={{ padding: '20px', color: '#e53935', textAlign: 'center' }}>
        <p><strong>⚠️ Hiba a megjelenítésben</strong></p>
        <p style={{ fontSize: '13px', color: '#aaa' }}>{this.state.error}</p>
        <button style={{ marginTop: '10px', padding: '6px 12px' }} onClick={() => this.setState({ error: null })}>Újrapróbálás</button>
      </div>
    );
    return this.props.children;
  }
}
