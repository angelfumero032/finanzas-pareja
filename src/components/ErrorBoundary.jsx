import { Component } from 'react'

// Evita la pantalla en blanco si algo revienta: mensaje amable + recargar.
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }
  static getDerivedStateFromError() {
    return { hasError: true }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="splash splash-warn" role="alert">
          <p>Algo ha fallado / Something went wrong</p>
          <button className="btn-primary" onClick={() => window.location.reload()}>
            Recargar / Reload
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
