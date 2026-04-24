import React, { type ErrorInfo, type ReactNode } from 'react';

type AppErrorBoundaryProps = {
  children: ReactNode;
};

type AppErrorBoundaryState = {
  error: Error | null;
};

type AppErrorBoundaryBase = new (props: AppErrorBoundaryProps) => {
  props: AppErrorBoundaryProps;
  state: AppErrorBoundaryState;
  setState(nextState: Partial<AppErrorBoundaryState>): void;
};

const ReactComponent = React.Component as unknown as AppErrorBoundaryBase;

export default class AppErrorBoundary extends ReactComponent {
  state: AppErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('App render failed', error, errorInfo);
  }

  render() {
    if (!this.state.error) {
      return this.props.children;
    }

    return (
      <main className="min-h-screen bg-stone-50 px-6 py-10 text-zinc-900">
        <div className="mx-auto max-w-3xl rounded-2xl border border-amber-200 bg-white p-6 shadow-sm">
          <div className="text-sm font-semibold text-amber-700">页面渲染异常</div>
          <h1 className="mt-2 text-2xl font-bold">已阻止整页白屏</h1>
          <p className="mt-3 text-sm leading-6 text-zinc-600">
            前端遇到了未捕获的渲染错误。当前页面已经进入保护态，请刷新页面继续操作；如果问题重复出现，可以把下面的错误信息用于定位。
          </p>
          <pre className="mt-4 max-h-56 overflow-auto rounded-xl bg-zinc-950 p-4 text-xs text-zinc-100">
            {this.state.error.message || String(this.state.error)}
          </pre>
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-700"
            >
              刷新页面
            </button>
            <button
              type="button"
              onClick={() => this.setState({ error: null })}
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
            >
              尝试恢复
            </button>
          </div>
        </div>
      </main>
    );
  }
}
