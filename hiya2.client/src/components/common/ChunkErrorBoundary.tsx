import React from 'react';

interface ChunkErrorBoundaryState {
  hasError: boolean;
}

interface ChunkErrorBoundaryProps {
  children: React.ReactNode;
}

export class ChunkErrorBoundary extends React.Component<ChunkErrorBoundaryProps, ChunkErrorBoundaryState> {
  constructor(props: ChunkErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ChunkErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    // Detect chunk load failures (stale deploy scenario)
    const isChunkError =
      error.message?.includes('Failed to fetch') ||
      error.message?.includes('dynamically imported') ||
      error.message?.includes('Unable to preload') ||
      error.name === 'ChunkLoadError';
    if (isChunkError) {
      // Will be caught by the render below
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '60vh',
            padding: '2rem',
            textAlign: 'center',
            fontFamily: "'DM Sans', system-ui, sans-serif",
          }}
        >
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#CB992C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '1rem' }}>
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#11223A', marginBottom: '0.5rem' }}>
            Page failed to load
          </h2>
          <p style={{ fontSize: '0.95rem', color: '#555', marginBottom: '1.5rem', maxWidth: '360px' }}>
            A new version of HIYAGHAR may be available. Please reload to get the latest version.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '0.65rem 1.75rem',
              background: '#CB992C',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '0.95rem',
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            Reload page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
