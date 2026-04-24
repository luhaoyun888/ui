import { Link } from 'react-router-dom';
import { ArrowLeft, PauseCircle } from 'lucide-react';
import { useLocale } from '@/src/i18n/LocaleProvider';

interface DeferredFeatureProps {
  name: string;
  flag: string;
}

export default function DeferredFeature({ name, flag }: DeferredFeatureProps) {
  const { t } = useLocale();

  return (
    <section className="deferred-console-theme space-y-6 pb-10">
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
            <PauseCircle className="h-5 w-5" />
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-sm font-semibold text-amber-700">{t('deferred.tag', '暂不纳入最小核心')}</p>
              <h1 className="mt-1 text-2xl font-bold text-zinc-950">{name}</h1>
            </div>
            <p className="max-w-3xl text-zinc-700">
              {t('deferred.description_prefix', '当前阶段我们先稳定插件、认证、RBAC 和健康检查，这个能力由后端开关控制：')}{' '}
              <span className="ml-1 rounded border border-amber-200 bg-white px-2 py-1 font-mono text-sm">{flag}</span>{' '}
              {t('deferred.description_suffix', '默认保持关闭，避免界面展示未完成能力。')}
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-lg border border-amber-300 bg-white px-3 py-2 text-amber-800 transition-colors hover:bg-amber-100"
            >
              <ArrowLeft className="h-4 w-4" />
              {t('deferred.back', '返回核心总览')}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
