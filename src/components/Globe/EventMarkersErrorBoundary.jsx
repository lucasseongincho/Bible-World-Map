import { Component } from 'react'

export default class EventMarkersErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('[EventMarkers] Caught error in EventMarkersInner:', error)
    console.error('[EventMarkers] Component stack:', info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            position: 'fixed',
            top: 16,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9999,
            background: 'rgba(30,0,0,0.92)',
            border: '1px solid #ef4444',
            borderRadius: 8,
            padding: '10px 18px',
            color: '#fca5a5',
            fontSize: 13,
            maxWidth: 420,
            textAlign: 'center',
          }}
        >
          <strong>Map markers failed to load.</strong>
          <br />
          <span style={{ color: '#f87171', fontSize: 11 }}>
            {this.state.error?.message ?? 'Unknown error'}
          </span>
          <br />
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{
              marginTop: 8,
              padding: '3px 12px',
              background: '#7f1d1d',
              border: '1px solid #ef4444',
              borderRadius: 4,
              color: '#fca5a5',
              cursor: 'pointer',
              fontSize: 12,
            }}
          >
            Retry
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
