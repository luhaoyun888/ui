import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Activity,
  Bot,
  ChevronDown,
  Cpu,
  GitBranch,
  Globe2,
  LayoutDashboard,
  LogOut,
  Menu,
  Puzzle,
  Server,
  ShieldCheck,
  User,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { cn } from '@/src/lib/utils';
import { API_BASE_URL, authService } from '@/src/services/api';
import { useLocale } from '@/src/i18n/LocaleProvider';

function localeDisplayName(locale: string) {
  if (locale === 'zh-CN') return '简体中文';
  if (locale === 'en-US') return 'English';
  return locale;
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { resolvedLocale, supportedLocales, setLocale, t } = useLocale();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);
  const [isUserMenuOpen, setIsUserMenuOpen] = React.useState(false);
  const [userLabel, setUserLabel] = React.useState(t('layout.user_fallback_title', '已登录 Token'));
  const [userSubLabel, setUserSubLabel] = React.useState(t('layout.user_fallback_subtitle', '无法读取用户资料'));

  const coreNavItems = React.useMemo(
    () => [
      { icon: LayoutDashboard, label: t('layout.nav.dashboard', '核心总览'), path: '/' },
      { icon: Puzzle, label: t('layout.nav.plugins', '插件系统'), path: '/plugins' },
      { icon: ShieldCheck, label: t('layout.nav.rbac', 'RBAC 权限'), path: '/rbac' },
      { icon: Activity, label: t('layout.nav.system', '系统健康'), path: '/system' },
    ],
    [t],
  );

  const deferredNavItems = React.useMemo(
    () => [
      { icon: GitBranch, label: 'Workflow', path: '/workflows' },
      { icon: Bot, label: 'AI Agent', path: '/agent' },
      { icon: Cpu, label: 'Edge', path: '/edge' },
    ],
    [],
  );

  React.useEffect(() => {
    const token = authService.getStoredToken();
    if (!token && location.pathname !== '/login') {
      navigate('/login');
    }
  }, [location.pathname, navigate]);

  React.useEffect(() => {
    if (location.pathname === '/login' || !authService.getStoredToken()) {
      return;
    }

    let mounted = true;
    authService.getMe()
      .then((user) => {
        if (!mounted) {
          return;
        }
        const name = String(user.username || user.user_name || user.email || `User ${user.id || ''}`).trim();
        setUserLabel(name || t('layout.user_fallback_title', '已登录 Token'));
        setUserSubLabel(String(user.user_type || user.role || t('layout.brand.title', 'Foundation Console')));
      })
      .catch(() => {
        if (!mounted) {
          return;
        }
        setUserLabel(t('layout.user_fallback_title', '已登录 Token'));
        setUserSubLabel(t('layout.user_fallback_subtitle', '无法读取用户资料'));
      });

    return () => {
      mounted = false;
    };
  }, [location.pathname, t]);

  const handleLogout = () => {
    authService.logout();
  };

  if (location.pathname === '/login') {
    return <>{children}</>;
  }

  const activeTitle = coreNavItems.find((item) => item.path === location.pathname)?.label
    || deferredNavItems.find((item) => item.path === location.pathname)?.label
    || t('layout.nav.dashboard', '核心总览');

  return (
    <div className="console-shell min-h-screen overflow-hidden bg-[#08111f] text-slate-100">
      <div className="mesh-gradient-1" />
      <div className="mesh-gradient-2" />
      <div className="mesh-gradient-3" />

      <div className="relative z-10 flex min-h-screen gap-4 p-4">
        <motion.aside
          initial={false}
          animate={{ width: isSidebarOpen ? 272 : 92 }}
          className="fixed bottom-4 left-4 top-4 z-40 flex flex-col overflow-hidden rounded-[2rem] border border-slate-200/10 bg-slate-950/55 p-6 shadow-[0_28px_90px_rgba(2,6,23,0.45)] backdrop-blur-2xl"
        >
          <div className="mb-8 flex items-center gap-3 overflow-hidden">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 via-cyan-500 to-sky-400 text-white shadow-[0_18px_36px_rgba(59,130,246,0.28)]">
              <ShieldCheck className="h-5 w-5" />
            </div>
            {isSidebarOpen && (
              <div className="min-w-0">
                <span className="block truncate whitespace-nowrap text-lg font-black tracking-tight text-white">
                  {t('layout.brand.title', 'Foundation Console')}
                </span>
                <p className="mt-0.5 text-xs text-slate-400">
                  {t('layout.brand.subtitle', '最小可运行核心')}
                </p>
              </div>
            )}
          </div>

          <nav className="flex-1 space-y-2">
            {coreNavItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    'group relative flex items-center gap-4 rounded-2xl px-4 py-3 text-sm font-semibold transition-all',
                    isActive
                      ? 'border border-cyan-300/20 bg-cyan-400/12 text-white shadow-[0_12px_30px_rgba(34,211,238,0.08)]'
                      : 'text-slate-400 hover:bg-white/6 hover:text-slate-100',
                  )}
                >
                  <item.icon className={cn('h-5 w-5 shrink-0', isActive ? 'text-cyan-300' : 'text-slate-500 group-hover:text-slate-200')} />
                  {isSidebarOpen && <span className="truncate whitespace-nowrap">{item.label}</span>}
                  {!isSidebarOpen && isActive ? (
                    <div className="absolute left-0 h-6 w-1.5 rounded-r-full bg-cyan-400 shadow-[0_0_16px_rgba(34,211,238,0.55)]" />
                  ) : null}
                </Link>
              );
            })}

            {isSidebarOpen && (
              <div className="px-3 pb-2 pt-6 text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">
                {t('layout.nav.deferred', '后续开放')}
              </div>
            )}

            {deferredNavItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    'group flex items-center gap-4 rounded-2xl px-4 py-3 text-sm font-semibold transition-all',
                    isActive
                      ? 'border border-amber-200/20 bg-amber-400/10 text-amber-100'
                      : 'text-slate-500 hover:bg-white/6 hover:text-amber-100',
                  )}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  {isSidebarOpen ? (
                    <>
                      <span className="whitespace-nowrap">{item.label}</span>
                      <span className="ml-auto rounded-full border border-amber-300/20 bg-amber-400/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-amber-200">
                        {t('layout.deferred_badge', '未开')}
                      </span>
                    </>
                  ) : null}
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto space-y-4">
            <div className={cn('rounded-[1.5rem] border border-cyan-300/16 bg-cyan-400/8 p-4', !isSidebarOpen && 'p-2')}>
              {isSidebarOpen ? (
                <>
                  <p className="mb-1 text-[10px] font-black uppercase tracking-[0.2em] text-cyan-200">Foundation Console</p>
                  <p className="text-xs font-semibold text-slate-100">
                    {t('layout.capability_note', '当前界面只展示已经接通并可验证的基础能力。')}
                  </p>
                </>
              ) : (
                <div className="mx-auto h-2.5 w-2.5 rounded-full bg-cyan-400" />
              )}
            </div>

            <button
              onClick={() => setIsSidebarOpen((current) => !current)}
              className="flex w-full items-center gap-4 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-400 transition-all hover:bg-white/6 hover:text-white"
            >
              {isSidebarOpen ? <X className="h-5 w-5 shrink-0" /> : <Menu className="h-5 w-5 shrink-0" />}
              {isSidebarOpen && <span>{t('layout.collapse_sidebar', '收起侧栏')}</span>}
            </button>

            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-4 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-400 transition-all hover:bg-white/6 hover:text-rose-300"
            >
              <LogOut className="h-5 w-5 shrink-0" />
              {isSidebarOpen && <span>{t('layout.logout', '退出登录')}</span>}
            </button>
          </div>
        </motion.aside>

        <main
          className={cn(
            'flex min-h-screen flex-1 flex-col gap-6 py-4 pr-4 transition-all duration-500',
            isSidebarOpen ? 'ml-[288px]' : 'ml-[108px]',
          )}
        >
          <header className="glass-panel flex h-20 shrink-0 items-center justify-between rounded-[2.25rem] border border-slate-200/10 px-8 shadow-[0_18px_48px_rgba(2,6,23,0.32)]">
            <div className="flex items-center gap-6">
              <button
                onClick={() => setIsSidebarOpen((current) => !current)}
                className="rounded-2xl border border-white/8 bg-white/6 p-2.5 text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
              >
                {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
              <div className="hidden items-center gap-3 text-sm md:flex">
                <span className="font-semibold text-slate-500">Console</span>
                <span className="text-slate-700">/</span>
                <span className="font-black tracking-tight text-white">{activeTitle}</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden items-center gap-3 rounded-2xl border border-white/8 bg-white/5 px-4 py-2 text-sm text-slate-400 xl:flex">
                <Server className="h-4 w-4 text-cyan-300" />
                <span>{t('layout.api_label', 'API')}</span>
                <code className="rounded-lg border border-white/10 bg-black/20 px-2 py-1 text-xs text-slate-200">
                  {API_BASE_URL || '/api -> 127.0.0.1:8080'}
                </code>
              </div>

              <label className="hidden items-center gap-2 rounded-2xl border border-white/8 bg-white/5 px-3 py-2 text-sm text-slate-400 sm:flex">
                <Globe2 className="h-4 w-4 text-cyan-300" />
                <span>{t('layout.language_label', '语言')}</span>
                <select
                  value={resolvedLocale}
                  onChange={(event) => void setLocale(event.target.value)}
                  className="rounded-lg border border-white/10 bg-[#091423] px-3 py-1 text-sm text-white outline-none focus:border-cyan-400"
                >
                  {supportedLocales.map((item) => (
                    <option key={item} value={item}>
                      {localeDisplayName(item)}
                    </option>
                  ))}
                </select>
              </label>

              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen((current) => !current)}
                  className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/5 p-1.5 pl-3 transition-colors hover:bg-white/10"
                >
                  <div className="hidden text-right sm:block">
                    <p className="text-sm font-bold leading-none text-white">{userLabel}</p>
                    <p className="mt-1 text-xs text-slate-500">{userSubLabel}</p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-2xl border border-cyan-400/20 bg-slate-900 text-slate-300">
                    <User className="h-6 w-6" />
                  </div>
                </button>

                <AnimatePresence>
                  {isUserMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 z-50 mt-2 w-64 rounded-[1.5rem] border border-white/10 bg-slate-950/92 py-2 shadow-2xl backdrop-blur-2xl"
                    >
                      <div className="px-4 py-3 text-xs leading-6 text-slate-400">
                        {t('layout.capability_note', '当前界面只展示已经接通并可验证的基础能力。')}
                      </div>
                      <div className="mx-3 my-1 h-px bg-white/8" />
                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-3 px-4 py-3 text-sm font-semibold text-rose-300 transition-colors hover:bg-rose-500/10"
                      >
                        <LogOut className="h-4 w-4" />
                        {t('layout.logout', '退出登录')}
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
              {children}
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
}
