import React from 'react';
import { AlertTriangle } from 'lucide-react';

// Se um microfrontend remoto não carregar (fora do ar ou erro), só a área dele mostra o aviso;
// o restante do shell continua funcionando.
export default class RemoteBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidUpdate(prevProps) {
    if (prevProps.name !== this.props.name && this.state.error) {
      this.setState({ error: null });
    }
  }

  render() {
    if (this.state.error) {
      return (
        <div className="card" style={{ textAlign: 'center', padding: '40px 24px' }}>
          <AlertTriangle size={32} color="var(--accent-danger)" />
          <h3 style={{ margin: '12px 0 6px' }}>Não foi possível carregar o módulo {this.props.name}</h3>
          <p style={{ color: 'var(--text-muted)' }}>{String(this.state.error.message || this.state.error)}</p>
        </div>
      );
    }
    return this.props.children;
  }
}
