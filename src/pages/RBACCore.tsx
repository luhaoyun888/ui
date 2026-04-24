import React from 'react';
import { AlertCircle, RefreshCw, ShieldCheck } from 'lucide-react';
import { rbacService, toErrorMessage } from '@/src/services/api';
import { useLocale } from '@/src/i18n/LocaleProvider';

type Row = Record<string, unknown>;

function FieldList({ item }: { item: Row }) {
  const entries = Object.entries(item).slice(0, 6);
  return (
    <dl className="grid gap-2 text-sm">
      {entries.map(([key, value]) => (
        <div key={key} className="grid grid-cols-[120px_1fr] gap-3">
          <dt className="text-zinc-500">{key}</dt>
          <dd className="break-all text-zinc-900">{String(value ?? '-')}</dd>
        </div>
      ))}
    </dl>
  );
}

function DataPanel({
  title,
  description,
  items,
  emptyLabel,
}: {
  title: string;
  description: string;
  items: Row[];
  emptyLabel: string;
}) {
  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-zinc-950">{title}</h2>
          <p className="mt-1 text-sm text-zinc-500">{description}</p>
        </div>
        <span className="rounded border border-teal-200 bg-teal-50 px-2 py-1 text-xs text-teal-800">
          {items.length}
        </span>
      </div>

      <div className="max-h-[620px] space-y-3 overflow-auto pr-1">
        {items.length === 0 && (
          <p className="rounded-lg border border-dashed border-zinc-200 p-4 text-sm text-zinc-500">{emptyLabel}</p>
        )}
        {items.map((item, index) => (
          <article key={String(item.id || item.name || index)} className="rounded-lg border border-zinc-200 p-4">
            <FieldList item={item} />
          </article>
        ))}
      </div>
    </section>
  );
}

export default function RBACCore() {
  const { t } = useLocale();
  const [roles, setRoles] = React.useState<Row[]>([]);
  const [permissions, setPermissions] = React.useState<Row[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  const refresh = React.useCallback(async () => {
    setLoading(true);
    setError('');
    const errors: string[] = [];
    const [rolesResult, permissionsResult] = await Promise.allSettled([
      rbacService.getRoles(),
      rbacService.getPermissions(),
    ]);

    if (rolesResult.status === 'fulfilled') {
      setRoles(rolesResult.value);
    } else {
      errors.push(`roles: ${toErrorMessage(rolesResult.reason)}`);
    }

    if (permissionsResult.status === 'fulfilled') {
      setPermissions(permissionsResult.value);
    } else {
      errors.push(`permissions: ${toErrorMessage(permissionsResult.reason)}`);
    }

    setError(errors.join('; '));
    setLoading(false);
  }, []);

  React.useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <div className="rbac-console-theme space-y-6 pb-10">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <h1 className="text-3xl font-bold text-zinc-950">{t('rbac.title', 'RBAC 权限')}</h1>
          <p className="mt-1 text-zinc-500">{t('rbac.subtitle', '当前页面先提供只读接入，展示全局角色与权限列表。')}</p>
        </div>
        <button
          onClick={() => void refresh()}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-teal-700 px-4 py-2 font-semibold text-white hover:bg-teal-800 disabled:opacity-60"
        >
          <RefreshCw className="h-4 w-4" />
          {loading ? t('rbac.refresh_busy', '刷新中...') : t('rbac.refresh', '刷新 RBAC')}
        </button>
      </div>

      {error && (
        <div className="flex gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-900">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      <section className="rounded-lg border border-teal-100 bg-teal-50 p-5">
        <div className="flex gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-teal-700" />
          <div>
            <h2 className="font-bold text-teal-950">{t('rbac.boundary_title', '当前边界')}</h2>
            <p className="mt-1 text-sm text-teal-900">
              {t('rbac.boundary_description', '这里先展示角色与权限数据，策略写操作仍待后端完整接通后再开放。')}
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <DataPanel
          title={t('rbac.roles_title', '全局角色')}
          description={t('rbac.roles_description', 'GET /api/v1/roles/global')}
          items={roles}
          emptyLabel={t('rbac.empty', '暂无返回数据。')}
        />
        <DataPanel
          title={t('rbac.permissions_title', '权限列表')}
          description={t('rbac.permissions_description', 'GET /api/v1/permissions')}
          items={permissions}
          emptyLabel={t('rbac.empty', '暂无返回数据。')}
        />
      </div>
    </div>
  );
}
