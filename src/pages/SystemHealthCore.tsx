import React from 'react';
import { Activity, AlertCircle, RefreshCw, Server } from 'lucide-react';
import { systemService, toErrorMessage } from '@/src/services/api';
import { useLocale } from '@/src/i18n/LocaleProvider';

function formatJson(value: unknown) {
  return JSON.stringify(value, null, 2);
}

export default function SystemHealthCore() {
  const { t } = useLocale();
  const [health, setHealth] = React.useState<Record<string, unknown> | null>(null);
  const [ping, setPing] = React.useState<Record<string, unknown> | null>(null);
  const [metrics, setMetrics] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  const refresh = React.useCallback(async () => {
    setLoading(true);
    setError('');
    const errors: string[] = [];
    const [healthResult, pingResult, metricsResult] = await Promise.allSettled([
      systemService.getHealth(),
      systemService.ping(),
      systemService.getMetricsText(),
    ]);

    if (healthResult.status === 'fulfilled') {
      setHealth(healthResult.value);
    } else {
      errors.push(`/health ${toErrorMessage(healthResult.reason)}`);
    }

    if (pingResult.status === 'fulfilled') {
      setPing(pingResult.value);
    } else {
      errors.push(`/ping ${toErrorMessage(pingResult.reason)}`);
    }

    if (metricsResult.status === 'fulfilled') {
      setMetrics(metricsResult.value);
    } else {
      errors.push(`/metrics ${toErrorMessage(metricsResult.reason)}`);
    }

    setError(errors.join('; '));
    setLoading(false);
  }, []);

  React.useEffect(() => {
    void refresh();
  }, [refresh]);

  const checks = [
    {
      name: t('system.checks.http_health', 'HTTP 健康检查'),
      endpoint: '/health',
      status: health ? t('system.reachable', '可达') : t('system.pending', '未确认'),
      detail: String(health?.status || health?.message || '-'),
    },
    {
      name: t('system.checks.http_ping', 'HTTP 连通性'),
      endpoint: '/ping',
      status: ping ? t('system.reachable', '可达') : t('system.pending', '未确认'),
      detail: String(ping?.message || ping?.status || '-'),
    },
    {
      name: t('system.checks.prometheus_metrics', 'Prometheus 指标'),
      endpoint: '/metrics',
      status: metrics ? t('system.reachable', '可达') : t('system.pending', '未确认'),
      detail: metrics ? `${metrics.length.toLocaleString()} bytes` : '-',
    },
    {
      name: t('system.checks.mysql', 'MySQL'),
      endpoint: t('dashboard.health.mysql', '由后端启动日志与接口返回间接验证'),
      status: t('system.indirect', '间接验证'),
      detail: t('dashboard.health.mysql', '由后端启动日志与接口返回间接验证'),
    },
    {
      name: t('system.checks.redis', 'Redis'),
      endpoint: t('dashboard.health.redis', '不是当前最小核心依赖'),
      status: t('system.not_required', '当前非必需'),
      detail: t('dashboard.health.redis', '不是当前最小核心依赖'),
    },
  ];

  return (
    <div className="system-console-theme space-y-6 pb-10">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <h1 className="text-3xl font-bold text-zinc-950">{t('system.title', '系统健康')}</h1>
          <p className="mt-1 text-zinc-500">
            {t('system.subtitle', '这里只展示真实后端响应，不再伪造数据库、队列或边缘设备状态。')}
          </p>
        </div>
        <button
          onClick={() => void refresh()}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-teal-700 px-4 py-2 font-semibold text-white hover:bg-teal-800 disabled:opacity-60"
        >
          <RefreshCw className="h-4 w-4" />
          {loading ? t('system.refresh_busy', '刷新中...') : t('system.refresh', '刷新')}
        </button>
      </div>

      {error && (
        <div className="flex gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-900">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {checks.map((check) => (
          <div key={check.name} className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <Server className="h-5 w-5 text-teal-700" />
              <span className="rounded border border-zinc-200 bg-zinc-50 px-2 py-1 text-xs text-zinc-600">
                {check.status}
              </span>
            </div>
            <h2 className="mt-4 font-bold text-zinc-950">{check.name}</h2>
            <p className="mt-1 text-sm text-zinc-500">{check.endpoint}</p>
            <p className="mt-3 text-sm text-zinc-700">{check.detail}</p>
          </div>
        ))}
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <Activity className="h-5 w-5 text-teal-700" />
            <h2 className="text-xl font-bold text-zinc-950">
              {t('system.health_response', 'Health / Ping 原始响应')}
            </h2>
          </div>
          <pre className="max-h-96 overflow-auto rounded-lg bg-zinc-950 p-4 text-xs text-zinc-50">
            {formatJson({ health, ping })}
          </pre>
        </section>

        <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <Activity className="h-5 w-5 text-teal-700" />
            <h2 className="text-xl font-bold text-zinc-950">
              {t('system.metrics_excerpt', 'Prometheus 指标片段')}
            </h2>
          </div>
          <pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded-lg bg-zinc-950 p-4 text-xs text-zinc-50">
            {metrics ? metrics.slice(0, 5000) : t('system.metrics_empty', '暂未返回 metrics。')}
          </pre>
        </section>
      </div>
    </div>
  );
}
