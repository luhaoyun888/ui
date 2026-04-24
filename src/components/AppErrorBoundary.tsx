// @ts-nocheck
import React from 'react';

interface Props {
  children?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class AppErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#030712] flex items-center justify-center p-6 text-center">
          <div className="glass-card rounded-[3rem] p-12 max-w-2xl border-rose-500/20 relative overflow-hidden">
             <h1 className="text-2xl font-black text-rose-400 mb-4">ERROR_GUARD</h1>
             <p className="text-slate-400 text-sm mb-6">{this.state.error?.message || '渲染错误'}</p>
             <button onClick={() => window.location.reload()} className="px-6 py-3 bg-rose-600 text-white rounded-xl font-bold">Reload</button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
