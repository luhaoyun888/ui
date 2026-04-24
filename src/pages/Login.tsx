import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, KeyRound, Mail, ShieldCheck } from 'lucide-react';
import { authService, DEVELOPMENT_ADMIN_TOKEN, toErrorMessage } from '@/src/services/api';
import { useLocale } from '@/src/i18n/LocaleProvider';

export default function Login() {
  const navigate = useNavigate();
  const { t } = useLocale();
  const [email, setEmail] = React.useState('admin@example.com');
  const [code, setCode] = React.useState('');
  const [manualToken, setManualToken] = React.useState('');
  const [isSending, setIsSending] = React.useState(false);
  const [isVerifying, setIsVerifying] = React.useState(false);
  const [error, setError] = React.useState('');
  const [notice, setNotice] = React.useState('');

  const requestCode = async () => {
    setError('');
    setNotice('');
    setIsSending(true);
    try {
      await authService.requestLoginCode(email);
      setNotice(t('login.request_success', '验证码请求已提交，请检查后端邮件或验证码通道。'));
    } catch (err) {
      setError(toErrorMessage(err));
    } finally {
      setIsSending(false);
    }
  };

  const verifyCode = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setNotice('');
    setIsVerifying(true);
    try {
      const result = await authService.verifyCode(email, code.trim());
      if (!result.access_token) {
        throw new Error(result.message || t('login.missing_access_token', '后端没有返回 access_token。'));
      }
      authService.setTokens(result.access_token, result.refresh_token);
      navigate('/');
    } catch (err) {
      setError(toErrorMessage(err));
    } finally {
      setIsVerifying(false);
    }
  };

  const useManualToken = (token: string) => {
    const value = token.trim();
    if (!value) {
      setError(t('login.missing_token', '请先填写 Token。'));
      return;
    }
    authService.setTokens(value);
    navigate('/');
  };

  return (
    <div className="login-console-theme relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0f172a] p-6">
      <div className="mesh-gradient-1" />
      <div className="mesh-gradient-2" />
      <div className="mesh-gradient-3" />
      <div className="grid w-full max-w-5xl items-stretch gap-8 lg:grid-cols-[1fr_1.2fr]">
        <section className="glass-card flex flex-col justify-between rounded-[2.5rem] p-8 text-white">
          <div>
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-lg border border-white/20 bg-white/10">
              <ShieldCheck className="h-7 w-7" />
            </div>
            <p className="text-sm font-semibold text-teal-100">{t('login.hero_tag', 'Foundation Console')}</p>
            <h1 className="mt-3 text-3xl font-bold">
              {t('login.hero_title', '先接通真实后端，再逐步开放更重的能力。')}
            </h1>
            <p className="mt-4 leading-7 text-teal-50">
              {t('login.hero_description', '当前 UI 已接入真实验证码登录、开发测试 Token、插件生命周期、RBAC 查询和系统健康检查。')}
            </p>
          </div>
          <div className="mt-8 border-t border-white/20 pt-5 text-sm text-teal-50">
            {t('login.dev_token_label', '开发测试 Token')}
            <code className="mt-2 block break-all rounded border border-white/20 bg-white/10 px-3 py-2 text-xs">
              {DEVELOPMENT_ADMIN_TOKEN}
            </code>
          </div>
        </section>

        <section className="glass-card rounded-[2.5rem] p-8 shadow-sm">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-zinc-950">
              {t('login.panel_title', '登录控制台')}
            </h2>
            <p className="mt-2 text-zinc-500">
              {t('login.panel_description', '当前后端默认不走密码登录，请使用验证码或 Token 登录。')}
            </p>
          </div>

          {error && (
            <div className="mb-4 rounded-lg border border-rose-100 bg-rose-50 p-4 text-sm font-medium text-rose-700">
              {error}
            </div>
          )}
          {notice && (
            <div className="mb-4 rounded-lg border border-teal-100 bg-teal-50 p-4 text-sm font-medium text-teal-800">
              {notice}
            </div>
          )}

          <form className="space-y-5" onSubmit={verifyCode}>
            <div className="space-y-2">
              <label className="text-sm font-bold text-zinc-700">{t('login.email_label', '邮箱')}</label>
              <div className="group relative">
                <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400 transition-colors group-focus-within:text-teal-700" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full rounded-lg border border-zinc-200 bg-zinc-50 py-3 pl-12 pr-4 text-zinc-700 outline-none transition-all focus:border-teal-700 focus:ring-4 focus:ring-teal-50"
                  placeholder="name@company.com"
                />
              </div>
            </div>

            <div className="grid items-end gap-3 sm:grid-cols-[1fr_auto]">
              <div className="space-y-2">
                <label className="text-sm font-bold text-zinc-700">{t('login.code_label', '验证码')}</label>
                <input
                  type="text"
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                  className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-zinc-700 outline-none transition-all focus:border-teal-700 focus:ring-4 focus:ring-teal-50"
                  placeholder={t('login.code_placeholder', '输入后端发出的验证码')}
                />
              </div>
              <button
                type="button"
                onClick={requestCode}
                disabled={isSending}
                className="rounded-lg border border-teal-700 px-4 py-3 font-semibold text-teal-800 hover:bg-teal-50 disabled:opacity-60"
              >
                {isSending
                  ? t('login.send_code_busy', '发送中...')
                  : t('login.send_code', '发送验证码')}
              </button>
            </div>

            <button
              type="submit"
              disabled={isVerifying || !code.trim()}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-teal-700 py-3 font-bold text-white transition-all hover:bg-teal-800 focus:ring-4 focus:ring-teal-100 disabled:opacity-60"
            >
              {isVerifying ? (
                t('login.verify_busy', '验证中...')
              ) : (
                <>
                  {t('login.verify', '验证并进入')}
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>
          </form>

          <div className="my-6 h-px bg-zinc-100" />

          <div className="space-y-4">
            <div>
              <label className="text-sm font-bold text-zinc-700">{t('login.manual_token', '手动 Token')}</label>
              <textarea
                value={manualToken}
                onChange={(event) => setManualToken(event.target.value)}
                className="mt-2 min-h-24 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 font-mono text-sm text-zinc-700 outline-none transition-all focus:border-teal-700 focus:ring-4 focus:ring-teal-50"
                placeholder={t('login.manual_token_placeholder', '粘贴 Bearer Token 或开发测试 Token')}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => useManualToken(manualToken)}
                className="flex items-center justify-center gap-2 rounded-lg border border-zinc-300 px-4 py-3 font-semibold text-zinc-800 hover:bg-zinc-50"
              >
                <KeyRound className="h-4 w-4" />
                {t('login.use_manual_token', '使用手动 Token')}
              </button>
              <button
                type="button"
                onClick={() => useManualToken(DEVELOPMENT_ADMIN_TOKEN)}
                className="rounded-lg border border-amber-200 bg-amber-100 px-4 py-3 font-semibold text-amber-900 hover:bg-amber-200"
              >
                {t('login.use_dev_token', '使用开发测试 Token')}
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
