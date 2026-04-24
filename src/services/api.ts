import axios, { type AxiosError, type AxiosResponse } from 'axios';

export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
export const TOKEN_KEY = 'jwt_token';
export const REFRESH_TOKEN_KEY = 'refresh_token';
export const DEVELOPMENT_ADMIN_TOKEN = 'admin-test-token-do-not-use-in-production';
export const LOCALE_STORAGE_KEY = 'ui_locale';

export interface ApiMeta {
  page?: number;
  page_size?: number;
  total?: number;
  total_pages?: number;
  timestamp?: string;
  language?: string;
  [key: string]: unknown;
}

export interface ApiEnvelope<T> {
  success?: boolean;
  data?: T;
  message?: string;
  error?: string;
  meta?: ApiMeta;
  [key: string]: unknown;
}

export interface ApiErrorPayload {
  code?: string;
  messageKey?: string;
  message?: string;
  details?: Record<string, unknown>;
}

export interface ClientLocaleConfig {
  default_locale: string;
  supported_locales: string[];
  resolved_locale: string;
}

export interface ClientLocaleBundleResponse {
  lang: string;
  bundle: Record<string, unknown>;
}

export interface PageResult<T> {
  items: T[];
  meta?: ApiMeta;
}

export interface Plugin {
  id: number;
  user_id?: number;
  name: string;
  description?: string;
  min_version?: string;
  max_version?: string;
  lifecycle_status?: string;
  status_reason?: string;
  status_updated_at?: string;
  trust_summary?: {
    unscanned?: number;
    pending?: number;
    trusted?: number;
    banned?: number;
    total?: number;
    latest_risk?: string;
  };
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

export interface PluginVersion {
  id: number;
  plugin_id: number;
  version: string;
  public?: boolean;
  language?: string;
  load_mode?: string;
  pack_mode?: string;
  conversion_status?: string;
  source_type?: string;
  trust_state?: string;
  risk_level?: string;
  scan_passed?: boolean;
  need_review?: boolean;
  last_scan_at?: string;
  scan_summary?: string;
  reviewer_id?: number;
  review_comment?: string;
  reviewed_at?: string;
  plugin_lifecycle_status?: string;
  plugin_status_reason?: string;
  is_multi_file?: boolean;
  has_go_mod?: boolean;
  status_snapshot?: VersionStatusSnapshot;
  [key: string]: unknown;
}

export interface VersionLastAction {
  name?: string;
  result?: string;
  error?: string;
  at?: string;
}

export interface VersionStatusSnapshot {
  package_status?: string;
  install_status?: string;
  runtime_status?: string;
  invoke_load_policy?: string;
  last_load_mode_requested?: string;
  last_load_mode_resolved?: string;
  last_load_trigger?: string;
  last_action?: VersionLastAction | null;
}

export interface SourceAuditResponse extends Record<string, unknown> {
  source_origin?: string;
  archive_error?: string;
  reason?: string;
  fallback_reason?: string;
  error?: string;
}

export interface VersionStatusResponse {
  version_id: number;
  status?: string;
  status_snapshot?: VersionStatusSnapshot;
}

export interface VersionActionResponse extends Record<string, unknown> {
  status?: string;
  status_snapshot?: VersionStatusSnapshot;
}

export interface UsageSummary {
  call_count?: number;
  error_count?: number;
  avg_response_ms?: number;
  last_used_at?: string | null;
  user_count?: number;
  call_count_7d?: number;
  [key: string]: unknown;
}

export interface ReviewItem {
  id: number;
  resource_type: string;
  resource_id: number;
  version_id?: number;
  submitter_id: number;
  status: string;
  review_comment?: string;
  reviewer_id?: number;
  reviewed_at?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

export interface RuntimeMetrics {
  loaded_plugins_count?: number;
  total_load_count?: number;
  total_unload_count?: number;
  total_call_count?: number;
  total_call_error_count?: number;
  active_calls_count?: number;
  plugin_metrics?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface FunctionInfo {
  name: string;
  signature?: string;
  parameters?: Record<string, string>;
  return_value_name?: string;
  description?: string;
  [key: string]: unknown;
}

export interface PermissionMatrixHostFunction {
  name: string;
  module: string;
  permission_key: string;
  i18n_key: string;
  description?: string;
  enabled?: boolean;
}

export interface PermissionMatrixGovernedActionDomain {
  action_domain: string;
  top_permission_key?: string;
  grant_status?: string;
  grant_source?: string;
  mirrored_from_legacy?: boolean;
  has_runtime_override?: boolean;
  runtime_enabled?: boolean;
  effective_runtime_enabled?: boolean;
}

export interface PermissionMatrixRow {
  permission_key: string;
  module_key: string;
  i18n_key: string;
  direction?: string;
  risk_level?: string;
  registered: boolean;
  requested: boolean;
  request_source?: string;
  configured_policy_allowed: boolean;
  policy_allowed: boolean;
  effective: boolean;
  decision_reason: string;
  forced_by_sandbox: boolean;
  can_configure?: boolean;
  config_block_reason?: string;
  grant_status?: string;
  grant_source?: string;
  mirrored_from_legacy?: boolean;
  has_runtime_override?: boolean;
  runtime_enabled?: boolean;
  governed_action_domains?: PermissionMatrixGovernedActionDomain[];
  host_functions: PermissionMatrixHostFunction[];
}

export interface PermissionMatrixContext {
  version_id: number;
  trust_state: string;
  plugin_lifecycle_status?: string;
  configured_profile: string;
  profile: string;
  configured_force_sandbox_mode: boolean;
  force_sandbox_mode: boolean;
  enabled: boolean;
  executor_resolved: string;
  source_type?: string;
}

export interface PermissionMatrixSummary {
  requested_count: number;
  configured_policy_allowed_count: number;
  policy_allowed_count: number;
  effective_count: number;
  denied_count: number;
  unknown_count: number;
}

export interface PermissionMatrixGovernanceBridgeSummary {
  enabled: boolean;
  granted_rule_count: number;
  override_count: number;
  mirrored_legacy_count: number;
  active_grant_rule_count: number;
}

export interface PermissionMatrixResponse {
  context: PermissionMatrixContext;
  summary: PermissionMatrixSummary;
  governance_bridge?: PermissionMatrixGovernanceBridgeSummary;
  rows: PermissionMatrixRow[];
  baseline_permissions?: string[];
  requested_permissions: string[];
  requested_permissions_source?: string;
  requested_permissions_hash?: string;
  configured_policy_allowed_permissions: string[];
  policy_allowed_permissions: string[];
  effective_permissions: string[];
}

export interface EffectivePermissionsResponse {
  version_id: number;
  requested_permissions: string[];
  requested_permissions_source?: string;
  requested_permissions_hash?: string;
  baseline_permissions: string[];
  configured_policy_allowed_permissions: string[];
  policy_allowed_permissions: string[];
  effective_permissions: string[];
  force_sandbox_mode: boolean;
  profile: string;
  executor_resolved: string;
  source?: string;
  permission_matrix_summary?: PermissionMatrixSummary;
  permission_matrix_context?: PermissionMatrixContext;
  permission_matrix_governance_bridge?: PermissionMatrixGovernanceBridgeSummary;
}

export interface PolicyActionDomainOverride {
  action_domain: string;
  top_permission_key?: string;
  runtime_enabled?: boolean;
  effective_runtime_enabled?: boolean;
  grant_status?: string;
  grant_source?: string;
  mirrored_from_legacy?: boolean;
  has_runtime_override?: boolean;
}

export interface VersionPolicyResponse {
  version_id: number;
  profile: string;
  allowed_permissions: string[];
  limits?: Record<string, unknown>;
  warm_instances?: number;
  enabled: boolean;
  force_sandbox_mode: boolean;
  description?: string;
  created_at?: string;
  updated_at?: string;
  executor_resolved?: string;
  effective_permissions?: string[];
  policy_allowed_permissions?: string[];
  action_domain_overrides?: PolicyActionDomainOverride[];
  permission_matrix_summary?: PermissionMatrixSummary;
  permission_matrix_context?: PermissionMatrixContext;
  permission_matrix_governance_bridge?: PermissionMatrixGovernanceBridgeSummary;
  requested_permissions?: string[];
  requested_permissions_source?: string;
  requested_permissions_hash?: string;
  baseline_permissions?: string[];
  configured_policy_allowed_permissions?: string[];
  source?: string;
}

export interface UpdateVersionPolicyRequest {
  profile?: string;
  allowed_permissions?: string[];
  action_domain_overrides?: Array<{ action_domain: string; runtime_enabled?: boolean }>;
  limits?: Record<string, unknown>;
  warm_instances?: number;
  enabled?: boolean;
  force_sandbox_mode?: boolean;
  description?: string;
}

export interface PluginRuntimeDefaults {
  id?: number;
  invoke_load_policy_default: string;
  default_load_mode_default: string;
  updated_at?: string;
  updated_by?: number;
  created_at?: string;
}

export interface RuntimePreferenceValueSource {
  invoke_load_policy?: string;
  default_load_mode?: string;
}

export interface VersionRuntimePreferences {
  version_id: number;
  invoke_load_policy?: string;
  default_load_mode?: string;
  value_source: RuntimePreferenceValueSource;
  global_defaults?: PluginRuntimeDefaults;
  effective_invoke_load_policy?: string;
  effective_requested_load_mode?: string;
  effective_resolved_load_mode?: string;
  status_snapshot?: VersionStatusSnapshot;
}

export interface BatchRuntimePreferencesResponse {
  updated_version_ids: number[];
  updated_count: number;
  snapshots: VersionRuntimePreferences[];
}

export interface VersionFunctionsResponse {
  version_id?: number;
  functions?: FunctionInfo[];
  count?: number;
}

export interface AdminTestInvokeRequest {
  parameter_types?: string[];
  args: unknown[];
  timeout_ms?: number;
  force_target?: string;
  force_profile?: string;
  enable_trace?: boolean;
}

export interface InvokeFunctionOptions {
  timeoutMs?: number;
  signal?: AbortSignal;
}

export interface AuthTokenResponse {
  success?: boolean;
  message?: string;
  user_id?: number;
  access_token?: string;
  refresh_token?: string;
  token_type?: string;
  expires_in?: number;
}

export class ApiRequestError extends Error {
  code?: string;
  messageKey?: string;
  details?: Record<string, unknown>;

  constructor(payload: ApiErrorPayload = {}, fallback?: string) {
    super(formatApiError(payload, fallback));
    this.name = 'ApiRequestError';
    this.code = payload.code;
    this.messageKey = payload.messageKey;
    this.details = payload.details;
  }
}

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : '';
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  const lang = typeof window !== 'undefined' ? localStorage.getItem(LOCALE_STORAGE_KEY) : '';
  if (lang) {
    config.params = { ...(config.params || {}), lang };
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
    }
    return Promise.reject(error);
  },
);

export function unwrap<T>(response: AxiosResponse<ApiEnvelope<T> | T>): T {
  const body = response.data as ApiEnvelope<T>;
  if (body && typeof body === 'object' && 'success' in body) {
    if (body.success === false) {
      throw toApiRequestError(body.error, body.message);
    }
    return body.data as T;
  }
  return response.data as T;
}

export function unwrapPage<T>(response: AxiosResponse<ApiEnvelope<T[]> | T[]>): PageResult<T> {
  const body = response.data as ApiEnvelope<T[]> | T[];
  if (Array.isArray(body)) {
    return { items: body };
  }
  if (body && typeof body === 'object' && 'success' in body) {
    if (body.success === false) {
      throw toApiRequestError(body.error, body.message);
    }
    return {
      items: Array.isArray(body.data) ? body.data : [],
      meta: body.meta,
    };
  }
  return { items: [] };
}

export function toErrorMessage(error: unknown): string {
  if (isRequestCancelled(error)) {
    return toApiRequestError({ code: 'request_cancelled', messageKey: 'errors.request_cancelled' }).message;
  }
  if (error instanceof ApiRequestError) {
    return error.message;
  }
  if (axios.isAxiosError(error)) {
    if (isBackendUnavailableError(error)) {
      return toApiRequestError(toBackendUnavailablePayload(error), error.message).message;
    }
    const data = getApiErrorEnvelope(error);
    return toApiRequestError(data?.error, data?.message || error.message).message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return String(error || defaultRequestErrorMessage());
}

export function toErrorResult(error: unknown): Record<string, unknown> {
  const normalized = isRequestCancelled(error)
    ? toApiRequestError({ code: 'request_cancelled', messageKey: 'errors.request_cancelled' })
    : axios.isAxiosError(error) && isBackendUnavailableError(error)
    ? toApiRequestError(toBackendUnavailablePayload(error), error.message)
    : axios.isAxiosError(error)
    ? (() => {
        const data = getApiErrorEnvelope(error);
        return toApiRequestError(data?.error, data?.message || error.message);
      })()
    : toApiRequestError(error);
  const details = normalized.details && typeof normalized.details === 'object' ? normalized.details : {};
  return {
    ...details,
    error: normalized.message,
    code: normalized.code,
    messageKey: normalized.messageKey,
    details,
  };
}

function formatApiError(error: unknown, fallback?: string): string {
  if (typeof error === 'string' && error.trim()) {
    return error;
  }
  if (error && typeof error === 'object') {
    const item = error as ApiErrorPayload;
    const code = typeof item.code === 'string' ? item.code : '';
    const localized = localizeApiError(item);
    if (localized) {
      return localized;
    }
    const message = typeof item.message === 'string' ? item.message : '';
    return [code, message].filter(Boolean).join(': ') || fallback || defaultRequestErrorMessage();
  }
  return fallback || defaultRequestErrorMessage();
}

function toApiRequestError(error: unknown, fallback?: string) {
  if (error instanceof ApiRequestError) {
    return error;
  }
  if (isRequestCancelled(error)) {
    return new ApiRequestError({ code: 'request_cancelled', messageKey: 'errors.request_cancelled' }, fallback);
  }
  if (typeof error === 'string') {
    return new ApiRequestError({ message: error }, fallback);
  }
  if (error && typeof error === 'object') {
    return new ApiRequestError(error as ApiErrorPayload, fallback);
  }
  return new ApiRequestError({}, fallback);
}

function isRequestCancelled(error: unknown) {
  return axios.isCancel(error) || (axios.isAxiosError(error) && error.code === 'ERR_CANCELED');
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function getApiErrorEnvelope(error: AxiosError): { error?: unknown; message?: string } | undefined {
  const data = error.response?.data;
  if (!isPlainObject(data)) {
    return undefined;
  }
  return data as { error?: unknown; message?: string };
}

function looksLikeApiEnvelope(value: unknown) {
  return isPlainObject(value) && ('success' in value || 'error' in value || 'message' in value || 'data' in value || 'meta' in value);
}

function isBackendUnavailableError(error: AxiosError) {
  if (isRequestCancelled(error)) {
    return false;
  }
  if (!error.response) {
    return error.code === 'ERR_NETWORK' || Boolean(error.request);
  }
  const data = error.response.data;
  const emptyBody = data == null || (typeof data === 'string' && data.trim() === '');
  return error.response.status === 500 && (emptyBody || !looksLikeApiEnvelope(data));
}

function toBackendUnavailablePayload(error: AxiosError): ApiErrorPayload {
  return {
    code: 'backend_unavailable',
    messageKey: 'errors.backend_unavailable',
    details: {
      status: error.response?.status,
      url: error.config?.url,
      proxy_target: API_BASE_URL || 'Vite proxy -> http://127.0.0.1:8080',
    },
  };
}

function defaultRequestErrorMessage() {
  return isChineseLocale() ? '请求失败' : 'Request failed';
}

function getPreferredLocale() {
  if (typeof window === 'undefined') {
    return 'zh-CN';
  }
  return localStorage.getItem(LOCALE_STORAGE_KEY) || navigator.language || 'zh-CN';
}

function isChineseLocale() {
  return getPreferredLocale().toLowerCase().startsWith('zh');
}

function localizeApiError(error: ApiErrorPayload) {
  const code = String(error.code || '').trim().toLowerCase();
  const messageKey = String(error.messageKey || '').trim().toLowerCase();
  const reason = String(error.details?.reason || '').trim().toLowerCase();
  const fallbackReason = String(error.details?.fallback_reason || '').trim().toLowerCase();
  const version = String(error.details?.version || '').trim();
  const pluginId = String(error.details?.plugin_id || '').trim();
  const versionId = String(error.details?.version_id || '').trim();
  const permissionKey = String(error.details?.permission_key || error.details?.permission || '').trim().toLowerCase();
  const hostFunction = String(error.details?.host_function || '').trim().toLowerCase();
  const isZh = isChineseLocale();

  if (code === 'backend_unavailable' || messageKey === 'errors.backend_unavailable') {
    return isZh
      ? '后端服务未连接或 Vite 代理失败，请检查 8080 后端服务是否已启动'
      : 'Backend service is not connected or the Vite proxy failed. Check that the backend is running on port 8080';
  }

  if (code === 'version_not_found' || messageKey === 'errors.version_not_found') {
    return isZh
      ? `版本不存在或已被删除${versionId ? `（version_id=${versionId}）` : ''}`
      : `Version does not exist or has been deleted${versionId ? ` (version_id=${versionId})` : ''}`;
  }

  if (code === 'invalid_param' || messageKey === 'errors.invalid_param') {
    const field = String(error.details?.field || '').trim();
    return isZh ? `参数不合法${field ? `：${field}` : ''}` : `Invalid parameter${field ? `: ${field}` : ''}`;
  }

  if (code === 'invalid_permission_key' || messageKey === 'errors.invalid_permission_key') {
    const invalidPermissions = Array.isArray(error.details?.invalid_permissions)
      ? error.details.invalid_permissions.map((item) => String(item)).filter(Boolean)
      : [];
    if (isZh) {
      return invalidPermissions.length > 0
        ? `权限键未登记，不能保存为放行权限：${invalidPermissions.join('、')}`
        : '权限键未登记，不能保存为放行权限';
    }
    return invalidPermissions.length > 0
      ? `Permission keys are not registered and cannot be allowed: ${invalidPermissions.join(', ')}`
      : 'Permission key is not registered and cannot be allowed';
  }

  if (code === 'invalid_action_domain' || messageKey === 'errors.invalid_action_domain') {
    const invalidActionDomains = Array.isArray(error.details?.invalid_action_domains)
      ? error.details.invalid_action_domains.map((item) => String(item)).filter(Boolean)
      : [];
    if (isZh) {
      return invalidActionDomains.length > 0
        ? `动作域不可配置或未授予：${invalidActionDomains.join('、')}`
        : '动作域不可配置或未授予';
    }
    return invalidActionDomains.length > 0
      ? `Action domains are invalid or not granted: ${invalidActionDomains.join(', ')}`
      : 'Action domain is invalid or not granted';
  }

  if (code === 'invalid_request_body' || code === 'invalid_request' || messageKey === 'errors.invalid_request_body') {
    return isZh ? '请求体格式不正确' : 'Invalid request body';
  }

  if (code === 'request_cancelled' || messageKey === 'errors.request_cancelled') {
    return isZh ? '请求已取消' : 'Request cancelled';
  }

  if (code === 'invoke_timeout' || code === 'plugin_call_timeout' || code === 'timeout' || messageKey === 'errors.invoke_timeout') {
    return isZh ? '插件调用超时' : 'Plugin invocation timed out';
  }

  if (code === 'policy_json_invalid' || messageKey === 'errors.policy_json_invalid') {
    return isZh ? '高级策略 JSON 格式不正确，请修正后再保存' : 'Policy JSON is invalid. Fix it before saving';
  }

  if (code === 'version_already_exists' || messageKey === 'errors.version_already_exists') {
    if (isZh) {
      return pluginId && version
        ? `版本号 ${version} 已存在于插件 #${pluginId}`
        : `版本号 ${version || ''} 已存在`.trim();
    }
    return version
      ? `Version ${version} already exists`
      : 'This version already exists';
  }

  if (code === 'decrypt_failed') {
    const normalizedReason = fallbackReason || reason;
    if (normalizedReason === 'encrypted_archive_missing') {
      return isZh ? '源码读取失败：缺少加密源码归档' : 'Failed to read source: encrypted source archive is missing';
    }
    if (normalizedReason === 'encrypted_archive_unreadable') {
      return isZh ? '源码读取失败：加密源码归档不可读或已损坏' : 'Failed to read source: encrypted source archive is unreadable';
    }
    if (normalizedReason === 'raw_source_missing') {
      return isZh ? '源码读取失败：原始源码缺失' : 'Failed to read source: raw source is missing';
    }
    if (normalizedReason === 'raw_source_unreadable') {
      return isZh ? '源码读取失败：原始源码不可读' : 'Failed to read source: raw source is unreadable';
    }
    if (normalizedReason === 'legacy_record_incomplete') {
      return isZh ? '源码读取失败：旧版本记录不完整，需要重新上传或迁移' : 'Failed to read source: legacy version record is incomplete';
    }
    if (normalizedReason === 'raw_fallback_requires_admin') {
      return isZh ? '源码读取受限：当前只能使用原始源码回退，需要管理员权限' : 'Source access is restricted: raw fallback requires administrator permission';
    }
    return isZh ? '源码读取失败' : 'Failed to read source files';
  }

  if (code === 'add_version_failed') {
    return isZh ? '创建版本失败' : 'Failed to create version';
  }

  if (code === 'permission_denied') {
    const normalizedPermission = permissionKey || hostFunction;
    if (normalizedPermission) {
      const label = localizePermissionKey(normalizedPermission, isZh);
      if (isZh) {
        return `权限被拒绝：${label}。请前往“权限与隔离”检查策略、基础宿主权限和强制沙箱限制`;
      }
      return `Permission denied: ${label}. Review policy, baseline host permissions, and forced sandbox in Permissions`;
    }
    return isZh ? '权限被拒绝' : 'Permission denied';
  }

  return '';
}

function localizePermissionKey(permissionKey: string, isZh: boolean) {
  const labels: Record<string, { zh: string; en: string }> = {
    host_log: { zh: '宿主日志', en: 'Host Logging' },
    host_config_get: { zh: '读取宿主配置', en: 'Read Host Config' },
    host_storage_get: { zh: '读取插件存储', en: 'Read Plugin Storage' },
    host_storage_set: { zh: '写入插件存储', en: 'Write Plugin Storage' },
    host_storage_delete: { zh: '删除插件存储', en: 'Delete Plugin Storage' },
    host_system_action: { zh: '宿主系统动作', en: 'Host System Actions' },
  };
  const item = labels[permissionKey];
  if (item) {
    return isZh ? item.zh : item.en;
  }
  return permissionKey;
}

export const authService = {
  requestLoginCode: async (email: string) =>
    unwrap<void>(
      await api.post('/api/v1/verification-code/request', {
        email,
        code_type: 'login',
        purpose: 'login',
      }),
    ),
  requestMagicLink: async (email: string) =>
    unwrap<{ message?: string }>(await api.post('/api/v1/login', { email, login_method: 'magic_link' })),
  verifyCode: async (email: string, code: string) =>
    unwrap<AuthTokenResponse>(await api.post('/api/v1/verification-code/verify', { email, code })),
  exchangeMagicLinkToken: async (token: string) =>
    unwrap<AuthTokenResponse>(await api.post('/api/v1/auth/exchange-magic-link-token', { token })),
  register: async (data: { username: string; email: string; user_type?: string }) =>
    unwrap<Record<string, unknown>>(await api.post('/api/v1/register', data)),
  getMe: async () => unwrap<Record<string, unknown>>(await api.get('/api/v1/users/me')),
  setTokens: (accessToken: string, refreshToken?: string) => {
    localStorage.setItem(TOKEN_KEY, accessToken);
    if (refreshToken) {
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    }
  },
  getStoredToken: () => localStorage.getItem(TOKEN_KEY) || '',
  useDevelopmentToken: () => {
    localStorage.setItem(TOKEN_KEY, DEVELOPMENT_ADMIN_TOKEN);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  },
  logout: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    window.location.href = '/login';
  },
};

export const pluginService = {
  getPlugins: async (page = 1, pageSize = 50) =>
    unwrapPage<Plugin>(await api.get('/api/v1/plugins', { params: { page, page_size: pageSize } })),
  getPlugin: async (id: number | string) => unwrap<Plugin>(await api.get(`/api/v1/plugins/${id}`)),
  createPlugin: async (data: { name: string; description?: string; min_version?: string; max_version?: string }) =>
    unwrap<{ plugin_id: number }>(await api.post('/api/v1/plugins', data)),
  deletePlugin: async (id: number | string) =>
    unwrap<Record<string, unknown>>(await api.delete(`/api/v1/plugins/${id}`)),
  disablePlugin: async (id: number | string, reason = '') =>
    unwrap<Record<string, unknown>>(await api.post(`/api/v1/plugins/${id}/disable`, {}, { params: { reason } })),
  enablePlugin: async (id: number | string) =>
    unwrap<Record<string, unknown>>(await api.post(`/api/v1/plugins/${id}/enable`, {})),
  softDeletePlugin: async (id: number | string) =>
    unwrap<Record<string, unknown>>(await api.post(`/api/v1/plugins/${id}/delete`, {})),
  getPluginUsage: async (id: number | string) =>
    unwrap<UsageSummary>(await api.get(`/api/v1/plugins/${id}/usage`)),
  getVersions: async (pluginId: number | string) =>
    unwrap<PluginVersion[]>(await api.get(`/api/v1/plugins/${pluginId}/versions`)),
  getVersion: async (versionId: number | string) =>
    unwrap<PluginVersion>(await api.get(`/api/v1/versions/${versionId}`)),
  deleteVersion: async (versionId: number | string) =>
    unwrap<Record<string, unknown>>(await api.delete(`/api/v1/versions/${versionId}`)),
  banVersion: async (versionId: number | string, comment = '') =>
    unwrap<Record<string, unknown>>(await api.post(`/api/v1/versions/${versionId}/ban`, {}, { params: { comment } })),
  unbanVersion: async (versionId: number | string, comment = '') =>
    unwrap<Record<string, unknown>>(await api.post(`/api/v1/versions/${versionId}/unban`, {}, { params: { comment } })),
  getVersionUsage: async (versionId: number | string) =>
    unwrap<UsageSummary>(await api.get(`/api/v1/versions/${versionId}/usage`)),
  createVersion: async (
    pluginId: number | string,
    data: { version: string; source_type?: string; description?: string },
  ) => unwrap<{ version_id: number }>(await api.post(`/api/v1/plugins/${pluginId}/versions`, data)),
  uploadCreateVersion: async (
    pluginId: number | string,
    data: { version: string; source_type?: string; description?: string },
    file: File,
  ) => {
    const formData = new FormData();
    formData.append('version', data.version);
    formData.append('source_type', data.source_type || 'go');
    formData.append('description', data.description || '');
    formData.append('package', file);
    return unwrap<Record<string, unknown>>(
      await api.post(`/api/v1/plugins/${pluginId}/versions/upload-create`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }),
    );
  },
  uploadPackage: async (versionId: number | string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return unwrap<Record<string, unknown>>(
      await api.post(`/api/v1/versions/${versionId}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }),
    );
  },
    installVersion: async (versionId: number | string) =>
      unwrap<VersionActionResponse>(await api.post(`/api/v1/versions/${versionId}/install`, {})),
    uninstallVersion: async (versionId: number | string) =>
      unwrap<VersionActionResponse>(await api.post(`/api/v1/versions/${versionId}/uninstall`, {})),
    loadVersion: async (versionId: number | string, data: { execution_mode?: string } = {}) =>
      unwrap<VersionActionResponse>(await api.post(`/api/v1/versions/${versionId}/load`, data)),
  unloadVersion: async (versionId: number | string) =>
    unwrap<VersionActionResponse>(await api.post(`/api/v1/versions/${versionId}/unload`, {})),
  getStatus: async (versionId: number | string) =>
    unwrap<VersionStatusResponse>(await api.get(`/api/v1/versions/${versionId}/status`)),
  getFunctions: async (versionId: number | string) =>
    unwrap<VersionFunctionsResponse>(await api.get(`/api/v1/versions/${versionId}/functions`)),
  getPermissionMatrix: async (versionId: number | string) =>
    unwrap<PermissionMatrixResponse>(await api.get(`/api/v1/versions/${versionId}/permissions/matrix`)),
  getEffectivePermissions: async (versionId: number | string) =>
    unwrap<EffectivePermissionsResponse>(await api.get(`/api/v1/versions/${versionId}/permissions/effective`)),
  getRequestedPermissions: async (versionId: number | string) =>
    unwrap<Record<string, unknown>>(await api.get(`/api/v1/versions/${versionId}/requested-permissions`)),
  getPolicy: async (versionId: number | string) =>
    unwrap<VersionPolicyResponse>(await api.get(`/api/v1/versions/${versionId}/policy`)),
  updatePolicy: async (versionId: number | string, data: UpdateVersionPolicyRequest | Record<string, unknown>) =>
    unwrap<VersionPolicyResponse>(await api.put(`/api/v1/versions/${versionId}/policy`, data)),
  getVersionRuntimePreferences: async (versionId: number | string) =>
    unwrap<VersionRuntimePreferences>(await api.get(`/api/v1/versions/${versionId}/runtime-preferences`)),
  updateVersionRuntimePreferences: async (
    versionId: number | string,
    data: { invoke_load_policy?: string; default_load_mode?: string },
  ) => unwrap<VersionRuntimePreferences>(await api.put(`/api/v1/versions/${versionId}/runtime-preferences`, data)),
  batchUpdateVersionRuntimePreferences: async (
    data: { version_ids: number[]; invoke_load_policy?: string; default_load_mode?: string },
  ) => unwrap<BatchRuntimePreferencesResponse>(await api.post('/api/v1/versions/runtime-preferences/batch', data)),
  getPluginRuntimeDefaults: async () =>
    unwrap<PluginRuntimeDefaults>(await api.get('/api/v1/plugins/runtime-defaults')),
  updatePluginRuntimeDefaults: async (
    data: { invoke_load_policy_default?: string; default_load_mode_default?: string },
  ) => unwrap<PluginRuntimeDefaults>(await api.put('/api/v1/plugins/runtime-defaults', data)),
  testPermission: async (versionId: number | string, permission: string) =>
      unwrap<Record<string, unknown>>(await api.post(`/api/v1/versions/${versionId}/policy/test`, { permission })),
    getSource: async (versionId: number | string) =>
      unwrap<SourceAuditResponse>(await api.get(`/api/v1/versions/${versionId}/source`)),
  getConversion: async (versionId: number | string) =>
    unwrap<Record<string, unknown>>(await api.get(`/api/v1/versions/${versionId}/conversion`)),
  getPoolMetrics: async (versionId: number | string) =>
    unwrap<Record<string, unknown>>(await api.get(`/api/v1/versions/${versionId}/pool/metrics`)),
  getRuntimeMetrics: async () =>
    unwrap<RuntimeMetrics>(await api.get('/api/v1/plugins/runtime/metrics')),
  getAllPoolMetrics: async () =>
    unwrap<Record<string, unknown>>(await api.get('/api/v1/plugins/runtime/pool-metrics')),
  adminTestInvoke: async (versionId: number | string, func: string, data: AdminTestInvokeRequest) =>
    unwrap<Record<string, unknown>>(
      await api.post(`/api/v1/admin/versions/${versionId}/test-invoke/${encodeURIComponent(func)}`, data),
    ),
  listReviews: async (params: Record<string, unknown> = {}) =>
    unwrap<{ items: ReviewItem[]; total_count?: number; page?: number; page_size?: number }>(
      await api.get('/api/v1/reviews', { params }),
    ),
  approveReview: async (id: number | string, data: { reviewer_id: number; comment?: string }) =>
    unwrap<Record<string, unknown>>(await api.post(`/api/v1/reviews/${id}/approve`, data)),
  rejectReview: async (id: number | string, data: { reviewer_id: number; comment?: string }) =>
    unwrap<Record<string, unknown>>(await api.post(`/api/v1/reviews/${id}/reject`, data)),
  getPendingReviewCount: async () =>
    unwrap<{ count: number }>(await api.get('/api/v1/reviews/pending/count')),
  invokeFunction: async (
    versionId: number | string,
    func: string,
    args: unknown[],
    parameterTypes: string[] = [],
    options: InvokeFunctionOptions = {},
  ) => unwrap<Record<string, unknown>>(await api.post(
    `/api/v1/versions/${versionId}/invoke/${encodeURIComponent(func)}`,
    {
      args,
      parameter_types: parameterTypes,
      ...(options.timeoutMs ? { timeout_ms: options.timeoutMs } : {}),
    },
    { signal: options.signal },
  )),
};

export const localeService = {
  getClientConfig: async () =>
    unwrap<ClientLocaleConfig>(await api.get('/api/v1/i18n/client-config')),
  getClientBundle: async (lang?: string) =>
    unwrap<ClientLocaleBundleResponse>(await api.get('/api/v1/i18n/client-bundle', { params: lang ? { lang } : {} })),
};

export const systemService = {
  getHealth: async () => unwrap<Record<string, unknown>>(await api.get('/health')),
  ping: async () => unwrap<Record<string, unknown>>(await api.get('/ping')),
  getMetricsText: async () => {
    const response = await api.get<string>('/metrics', {
      responseType: 'text',
      transformResponse: [(data) => data],
    });
    return response.data;
  },
};

export const rbacService = {
  getRoles: async () => unwrap<Array<Record<string, unknown>>>(await api.get('/api/v1/roles/global')),
  getPermissions: async () => unwrap<Array<Record<string, unknown>>>(await api.get('/api/v1/permissions')),
};

export const coreFeatureMatrix = [
  { key: 'health', label: '健康检查', status: '已开放', note: '/health、/ping、/metrics' },
  { key: 'auth', label: '认证与用户', status: '已开放', note: '验证码、Magic Link、当前用户' },
  { key: 'plugins', label: '插件生命周期', status: '已开放', note: '元数据、版本、上传、安装、加载、调用' },
  { key: 'rbac', label: 'RBAC 基础', status: '只读接入', note: '角色与权限查询；当前环境若返回 service_unavailable 需补后端服务初始化' },
];

export const deferredFeatureMatrix = [
  { key: 'agent', label: 'AI Agent', flag: 'feature_flags.agent', reason: '模型和 Agent 能力先后退，避免地基过重。' },
  { key: 'workflow', label: 'Workflow/Pipeline', flag: 'feature_flags.workflow', reason: '流程编排不是最小运行核心。' },
  { key: 'edge', label: 'Edge Devices', flag: 'feature_flags.edge', reason: '边缘设备不是当前默认开放能力。' },
  { key: 'admin', label: 'Admin/DevTools/Debug', flag: 'feature_flags.admin/debug_routes/devtools', reason: '仅调试阶段按需打开。' },
];

export default api;
