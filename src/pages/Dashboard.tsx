import React from 'react';
import { Activity, AlertCircle, ArrowRight, Database, PauseCircle, PlugZap, Puzzle, ShieldCheck, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { pluginService, systemService, type Plugin, type RuntimeMetrics, toErrorMessage } from '@/src/services/api';
import { useLocale } from '@/src/i18n/LocaleProvider';

function numberValue(value: unknown) {
  if (typeof value === 'number') {
    return value.toLocaleString();
  }
  return '0';
}

export default function Dashboard() {
  const { t } = useLocale();
  const [health, setHealth] = React.useState<Record<string, unknown> | null>(null);
  const [plugins, setPlugins] = React.useState<Plugin[]>([]);
  const [pluginTotal, setPluginTotal] = React.useState(0);
  const [runtime, setRuntime] = React.useState<RuntimeMetrics | null>(null);
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const refresh = React.useCallback(async () => {
    setLoading(true);
    setError('');
    const errors: string[] = [];

    const [healthResult, pluginsResult, runtimeResult] = await Promise.allSettled([
      systemService.getHealth(),
      pluginService.getPlugins(1, 50),
      pluginService.getRuntimeMetrics(),
    ]);

    if (healthResult.status === 'fulfilled') {
      setHealth(healthResult.value);
    } else {
      errors.push(`health: ${toErrorMessage(healthResult.reason)}`);
    }

    if (pluginsResult.status === 'fulfilled') {
      setPlugins(pluginsResult.value.items);
      setPluginTotal(Number(pluginsResult.value.meta?.total || pluginsResult.value.items.length));
    } else {
      errors.push(`plugins: ${toErrorMessage(pluginsResult.reason)}`);
    }

    if (runtimeResult.status === 'fulfilled') {
      setRuntime(runtimeResult.value);
    } else {
      errors.push(`runtime: ${toErrorMessage(runtimeResult.reason)}`);
    }

    setError(errors.join(' | '));
    setLoading(false);
  }, []);

  React.useEffect(() => {
    void refresh();
  }, [refresh]);

  const healthStatus = String(health?.status || health?.message || (health ? t('system.reachable', '可达') : t('common.unknown', '未知')));
  const coreFeatureMatrix = [
    {
      key: 'health',
      label: t('dashboard.features.health_label', '系统健康'),
      status: t('plugins.status_labels.enabled', '已启用'),
      note: t('dashboard.features.health_note', '健康检查、连通性与指标接口'),
    },
    {
      key: 'auth',
      label: t('dashboard.features.auth_label', '认证与用户'),
      status: t('plugins.status_labels.enabled', '已启用'),
      note: t('dashboard.features.auth_note', '验证码、免密链接、当前用户信息'),
    },
    {
      key: 'plugins',
      label: t('dashboard.features.plugins_label', '插件生命周期'),
      status: t('plugins.status_labels.enabled', '已启用'),
      note: t('dashboard.features.plugins_note', '元数据、版本、上传、安装、加载与调用'),
    },
    {
      key: 'rbac',
      label: t('dashboard.features.rbac_label', 'RBAC 权限'),
      status: t('dashboard.features.read_only', '只读'),
      note: t('dashboard.features.rbac_note', '角色与权限列表查询'),
    },
  ];
  const deferredFeatureMatrix = [
    { key: 'agent', label: 'AI Agent', flag: 'feature_flags.agent', reason: t('dashboard.deferred_features.agent_reason', '模型能力暂时后置，先把基础架构和测试链路打稳。') },
    { key: 'workflow', label: 'Workflow', flag: 'feature_flags.workflow', reason: t('dashboard.deferred_features.workflow_reason', '流程编排暂不进入最小可运行核心。') },
    { key: 'edge', label: 'Edge', flag: 'feature_flags.edge', reason: t('dashboard.deferred_features.edge_reason', 'Edge 相关能力暂不纳入当前默认开放链路。') },
  ];
  const statCards = [
    { label: t('dashboard.stats.plugins_total', '插件总数'), value: pluginTotal.toLocaleString(), icon: Puzzle, hint: 'GET /api/v1/plugins' },
    { label: t('dashboard.stats.loaded_versions', '已加载版本'), value: numberValue(runtime?.loaded_plugins_count), icon: PlugZap, hint: '运行时指标' },
    { label: t('dashboard.stats.total_calls', '总调用次数'), value: numberValue(runtime?.total_call_count), icon: Zap, hint: '调用指标' },
    { label: t('dashboard.stats.active_calls', '活动调用'), value: numberValue(runtime?.active_calls_count), icon: Activity, hint: '运行时' },
  ];

  return (
    <div className="dashboard-console-theme space-y-8 pb-10">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold text-zinc-950">{t('dashboard.title', '核心总览')}</h1>
          <p className="mt-1 font-medium text-zinc-500">{t('dashboard.subtitle', '这里只展示当前后端实际开放、可直接验证的基础能力。')}</p>
        </div>
        <button
          onClick={() => void refresh()}
          disabled={loading}
          className="rounded-lg bg-teal-700 px-4 py-2 font-semibold text-white hover:bg-teal-800 disabled:opacity-60"
        >
          {loading ? t('dashboard.refresh_busy', '刷新中...') : t('dashboard.refresh', '刷新状态')}
        </button>
      </div>

      {error && (
        <div className="flex gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-900">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((stat) => (
          <div key={stat.label} className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
                <stat.icon className="h-5 w-5" />
              </div>
              <span className="text-xs text-zinc-500">{stat.hint}</span>
            </div>
            <p className="text-sm font-semibold text-zinc-500">{stat.label}</p>
            <p className="mt-1 text-3xl font-bold text-zinc-950">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-zinc-950">{t('dashboard.sections.core_title', '最小核心能力')}</h2>
              <p className="mt-1 text-sm text-zinc-500">{t('dashboard.sections.core_subtitle', '只列出当前 UI 已接通或已经可以验证的后端能力。')}</p>
            </div>
            <ShieldCheck className="h-6 w-6 text-teal-700" />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {coreFeatureMatrix.map((feature) => (
              <div key={feature.key} className="rounded-lg border border-zinc-200 p-4">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-bold text-zinc-900">{feature.label}</h3>
                  <span className="rounded border border-teal-200 bg-teal-50 px-2 py-1 text-xs text-teal-800">{feature.status}</span>
                </div>
                <p className="mt-2 text-sm text-zinc-500">{feature.note}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-zinc-950">{t('dashboard.sections.deferred_title', '后续功能')}</h2>
              <p className="mt-1 text-sm text-zinc-500">{t('dashboard.sections.deferred_subtitle', '这些能力暂不进入当前测试主流程。')}</p>
            </div>
            <PauseCircle className="h-6 w-6 text-amber-700" />
          </div>
          <div className="space-y-3">
            {deferredFeatureMatrix.map((feature) => (
              <div key={feature.key} className="rounded-lg border border-amber-100 bg-amber-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-bold text-amber-950">{feature.label}</h3>
                  <code className="text-xs text-amber-800">{feature.flag}</code>
                </div>
                <p className="mt-2 text-sm text-amber-900">{feature.reason}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <Database className="h-5 w-5 text-teal-700" />
            <h2 className="text-xl font-bold text-zinc-950">{t('dashboard.sections.backend_health_title', '后端健康')}</h2>
          </div>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-zinc-500">/health</dt>
              <dd className="font-semibold text-zinc-900">{healthStatus}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-zinc-500">MySQL</dt>
              <dd className="font-semibold text-zinc-900">{t('dashboard.health.mysql', '由后端启动日志与接口返回间接验证')}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-zinc-500">Redis</dt>
              <dd className="font-semibold text-zinc-900">{t('dashboard.health.redis', '不是当前最小核心依赖')}</dd>
            </div>
          </dl>
        </section>

        <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-zinc-950">{t('dashboard.sections.next_steps_title', '下一步可测路径')}</h2>
              <p className="mt-1 text-sm text-zinc-500">{t('dashboard.sections.next_steps_subtitle', '先从插件生命周期开始，不碰 Agent / Workflow / Edge。')}</p>
            </div>
            <Link to="/plugins" className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-3 py-2 font-semibold text-white hover:bg-teal-800">
              {t('dashboard.sections.enter_plugins', '进入插件系统')}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <ol className="grid gap-3 text-sm md:grid-cols-3">
            <li className="rounded-lg border border-zinc-200 p-4">{t('dashboard.steps.step1', '1. 使用开发测试 Token 登录。')}</li>
            <li className="rounded-lg border border-zinc-200 p-4">{t('dashboard.steps.step2', '2. 创建插件与版本，上传 ZIP 包。')}</li>
            <li className="rounded-lg border border-zinc-200 p-4">{t('dashboard.steps.step3', '3. 安装、加载、读取函数列表并调用。')}</li>
          </ol>
          {plugins.length > 0 && (
            <p className="mt-4 text-sm text-zinc-500">
              {plugins.slice(0, 3).map((plugin) => plugin.name).join(', ')}
              {plugins.length > 3 ? '...' : ''}
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
