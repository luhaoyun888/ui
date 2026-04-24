import React from 'react';
import {
  Activity,
  ChevronDown,
  ChevronUp,
  FileArchive,
  FileCode2,
  Gauge,
  PackagePlus,
  Play,
  RefreshCw,
  ShieldCheck,
  Trash2,
  Upload,
} from 'lucide-react';
import {
  authService,
  pluginService,
  toErrorMessage,
  toErrorResult,
  type EffectivePermissionsResponse,
  type FunctionInfo,
  type PolicyActionDomainOverride,
  type PermissionMatrixResponse,
  type PluginRuntimeDefaults,
  type Plugin,
  type PluginVersion,
  type ReviewItem,
  type SourceAuditResponse,
  type UsageSummary,
  type VersionPolicyResponse,
  type VersionRuntimePreferences,
  type VersionActionResponse,
  type VersionLastAction,
  type VersionStatusResponse,
  type VersionStatusSnapshot,
} from '@/src/services/api';
import { useLocale } from '@/src/i18n/LocaleProvider';

type TabKey = 'status' | 'invoke' | 'permissions' | 'audit' | 'governance';
type ParamSpec = { name: string; type: string; example: unknown; note: string };
type PermissionFilterKey = 'all' | 'requested' | 'effective' | 'blocked_policy' | 'blocked_sandbox' | 'unknown';
type VersionDraft = { version: string; source_type: string; description: string };
type RuntimePreferenceDraft = { invoke_load_policy: string; default_load_mode: string };
type InvokePermissionHint = { permissionKey: string; hostFunction: string; message: string };
type VersionActionGuard = { ok: boolean; versionId: number; error: string };
type PermissionMatrixRow = PermissionMatrixResponse['rows'][number];
type PermissionMatrixHostFunction = PermissionMatrixRow['host_functions'][number];
type PermissionMatrixGovernedActionDomain = NonNullable<PermissionMatrixRow['governed_action_domains']>[number];
type ActionDomainRuntimeMode = 'inherit' | 'enabled' | 'disabled';
type ActionDomainOverrideDraft = {
  action_domain: string;
  runtime_enabled?: boolean;
  top_permission_key?: string;
  grant_status?: string;
  grant_source?: string;
  mirrored_from_legacy?: boolean;
  has_runtime_override?: boolean;
  effective_runtime_enabled?: boolean;
};
type PermissionWorkspaceMode = 'capabilities' | 'constraints' | 'risks' | 'diagnostics';
type PermissionCapabilityView = 'groups' | 'functions';
type PermissionDiagnosticsPanel = 'probe' | 'host' | 'raw';
type GovernedActionDomainViewItem = {
  action_domain: string;
  permission_key: string;
  grant_status?: string;
  grant_source?: string;
  mirrored_from_legacy?: boolean;
  has_runtime_override?: boolean;
  persisted_mode: ActionDomainRuntimeMode;
  draft_mode: ActionDomainRuntimeMode;
  persisted_effective_enabled: boolean;
  draft_effective_enabled: boolean;
  draft_allowed: boolean;
  dirty: boolean;
};
type PermissionConstraintViewItem = {
  key: string;
  title: string;
  count: number;
  tone: string;
  detail: string;
  entries: string[];
};
type AsyncPanelState = {
  loadingAction: string;
  error: string;
  lastAction: string;
  lastMessage: string;
  lastSuccess: boolean | null;
  lastAt: string;
};

type PluginLocaleLookup = (key: string, zhFallback: string) => string;

const sourceTypes = ['go', 'python', 'wasm', 'rust'];
const executionModes = [
  { value: 'wasm', label: 'WASM 隔离' },
  { value: 'native', label: '原生执行' },
  { value: 'persistent', label: '进程池' },
];
const runtimePreferenceDraftDefault: RuntimePreferenceDraft = { invoke_load_policy: '', default_load_mode: '' };
const VERSION_DRAFT_STORAGE_PREFIX = 'plugins_core_version_draft';
const DEFAULT_VERSION_DRAFT: VersionDraft = { version: '0.1.0', source_type: 'go', description: '' };
let pluginLocaleLookup: PluginLocaleLookup | null = null;

function setPluginLocaleLookup(lookup: PluginLocaleLookup | null) {
  pluginLocaleLookup = lookup;
}

function localizePluginText(key: string, zhFallback: string) {
  return pluginLocaleLookup ? pluginLocaleLookup(key, zhFallback) : zhFallback;
}

function createAsyncPanelState(): AsyncPanelState {
  return {
    loadingAction: '',
    error: '',
    lastAction: '',
    lastMessage: '',
    lastSuccess: null,
    lastAt: '',
  };
}

function formatJson(value: unknown) {
  return JSON.stringify(value ?? {}, null, 2);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function toStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map((item) => String(item)) : [];
}

function normalizePermissionMatrixHostFunctions(value: unknown): PermissionMatrixHostFunction[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter(isRecord).map((item) => ({
    ...(item as unknown as PermissionMatrixHostFunction),
    name: String(item.name || ''),
    module: String(item.module || ''),
    permission_key: String(item.permission_key || ''),
    i18n_key: String(item.i18n_key || ''),
    description: typeof item.description === 'string' ? item.description : '',
    enabled: typeof item.enabled === 'boolean' ? item.enabled : undefined,
  }));
}

function getPermissionRowHostFunctions(row: PermissionMatrixRow): PermissionMatrixHostFunction[] {
  const record = row as unknown as Record<string, unknown>;
  return normalizePermissionMatrixHostFunctions(record.host_functions);
}

function normalizePermissionMatrixGovernedActionDomains(value: unknown): PermissionMatrixGovernedActionDomain[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter(isRecord).map((item) => ({
    ...(item as unknown as PermissionMatrixGovernedActionDomain),
    action_domain: String(item.action_domain || ''),
    top_permission_key: typeof item.top_permission_key === 'string' ? item.top_permission_key : '',
    grant_status: typeof item.grant_status === 'string' ? item.grant_status : '',
    grant_source: typeof item.grant_source === 'string' ? item.grant_source : '',
    mirrored_from_legacy: typeof item.mirrored_from_legacy === 'boolean' ? item.mirrored_from_legacy : false,
    has_runtime_override: typeof item.has_runtime_override === 'boolean' ? item.has_runtime_override : false,
    runtime_enabled: typeof item.runtime_enabled === 'boolean' ? item.runtime_enabled : undefined,
    effective_runtime_enabled: typeof item.effective_runtime_enabled === 'boolean' ? item.effective_runtime_enabled : undefined,
  }));
}

function getPermissionRowGovernedActionDomains(row: PermissionMatrixRow): PermissionMatrixGovernedActionDomain[] {
  const record = row as unknown as Record<string, unknown>;
  return normalizePermissionMatrixGovernedActionDomains(record.governed_action_domains);
}

function isActiveGovernedActionDomain(actionDomain?: PermissionMatrixGovernedActionDomain | null) {
  return String(actionDomain?.grant_status || '').toLowerCase() === 'active';
}

function resolveGovernedActionDomainRuntimeEnabled(actionDomain?: PermissionMatrixGovernedActionDomain | null) {
  if (typeof actionDomain?.effective_runtime_enabled === 'boolean') {
    return actionDomain.effective_runtime_enabled;
  }
  if (typeof actionDomain?.runtime_enabled === 'boolean') {
    return actionDomain.runtime_enabled;
  }
  return isActiveGovernedActionDomain(actionDomain);
}

function resolveActionDomainRuntimeMode(value?: boolean): ActionDomainRuntimeMode {
  if (typeof value !== 'boolean') {
    return 'inherit';
  }
  return value ? 'enabled' : 'disabled';
}

function resolvePersistedActionDomainRuntimeMode(actionDomain?: PermissionMatrixGovernedActionDomain | PolicyActionDomainOverride | null): ActionDomainRuntimeMode {
  const hasRuntimeOverride = Boolean(actionDomain?.has_runtime_override);
  if (!hasRuntimeOverride) {
    return 'inherit';
  }
  return resolveActionDomainRuntimeMode(actionDomain?.runtime_enabled);
}

function actionDomainRuntimeModeLabel(mode: ActionDomainRuntimeMode, resolvedLocale = 'zh-CN') {
  if (mode === 'enabled') return localizePluginText('plugins.permissions_ui.runtime_mode.enabled', '强制允许');
  if (mode === 'disabled') return localizePluginText('plugins.permissions_ui.runtime_mode.disabled', '强制关闭');
  return localizePluginText('plugins.permissions_ui.runtime_mode.inherit', '跟随默认');
}

function sortActionDomainOverrideDrafts(items: ActionDomainOverrideDraft[]) {
  return [...items].sort((a, b) => {
    const permissionCompare = String(a.top_permission_key || '').localeCompare(String(b.top_permission_key || ''));
    if (permissionCompare !== 0) {
      return permissionCompare;
    }
    return a.action_domain.localeCompare(b.action_domain);
  });
}

function serializeActionDomainOverrideDrafts(items: ActionDomainOverrideDraft[]) {
  return sortActionDomainOverrideDrafts(items).map((item) => ({
    action_domain: item.action_domain,
    ...(typeof item.runtime_enabled === 'boolean' ? { runtime_enabled: item.runtime_enabled } : {}),
  }));
}

function normalizeActionDomainOverrideDrafts(value: unknown): ActionDomainOverrideDraft[] {
  if (!Array.isArray(value)) {
    return [];
  }
  const byActionDomain = new Map<string, ActionDomainOverrideDraft>();
  value.filter(isRecord).forEach((item) => {
    const actionDomain = String(item.action_domain || '').trim().toLowerCase();
    if (!actionDomain) {
      return;
    }
    const runtimeEnabled = typeof item.runtime_enabled === 'boolean' ? item.runtime_enabled : undefined;
    byActionDomain.set(actionDomain, {
      action_domain: actionDomain,
      runtime_enabled: runtimeEnabled,
      top_permission_key: typeof item.top_permission_key === 'string' ? item.top_permission_key : '',
      grant_status: typeof item.grant_status === 'string' ? item.grant_status : '',
      grant_source: typeof item.grant_source === 'string' ? item.grant_source : '',
      mirrored_from_legacy: typeof item.mirrored_from_legacy === 'boolean' ? item.mirrored_from_legacy : false,
      has_runtime_override: typeof item.has_runtime_override === 'boolean' ? item.has_runtime_override : typeof runtimeEnabled === 'boolean',
      effective_runtime_enabled: typeof item.effective_runtime_enabled === 'boolean' ? item.effective_runtime_enabled : undefined,
    });
  });
  return sortActionDomainOverrideDrafts(Array.from(byActionDomain.values()));
}

function buildActionDomainOverrideDraftsFromMatrix(matrix?: PermissionMatrixResponse | null) {
  if (!matrix?.rows?.length) {
    return [];
  }
  const byActionDomain = new Map<string, ActionDomainOverrideDraft>();
  matrix.rows.forEach((row) => {
    getPermissionRowGovernedActionDomains(row).forEach((actionDomain) => {
      const key = String(actionDomain.action_domain || '').trim().toLowerCase();
      if (!key) {
        return;
      }
      if (!isActiveGovernedActionDomain(actionDomain)) {
        return;
      }
      byActionDomain.set(key, {
        action_domain: key,
        runtime_enabled: typeof actionDomain.runtime_enabled === 'boolean' ? actionDomain.runtime_enabled : undefined,
        top_permission_key: row.permission_key,
        grant_status: actionDomain.grant_status,
        grant_source: actionDomain.grant_source,
        mirrored_from_legacy: actionDomain.mirrored_from_legacy,
        has_runtime_override: actionDomain.has_runtime_override,
        effective_runtime_enabled: resolveGovernedActionDomainRuntimeEnabled(actionDomain),
      });
    });
  });
  return sortActionDomainOverrideDrafts(Array.from(byActionDomain.values()));
}

function normalizePermissionMatrixResponse(matrix: PermissionMatrixResponse): PermissionMatrixResponse {
  const record = matrix as unknown as Record<string, unknown>;
  const rows = Array.isArray(record.rows) ? record.rows : [];
  return {
    ...matrix,
    governance_bridge: isRecord(record.governance_bridge)
      ? {
        enabled: Boolean(record.governance_bridge.enabled),
        granted_rule_count: metric(record.governance_bridge.granted_rule_count),
        override_count: metric(record.governance_bridge.override_count),
        mirrored_legacy_count: metric(record.governance_bridge.mirrored_legacy_count),
        active_grant_rule_count: metric(record.governance_bridge.active_grant_rule_count),
      }
      : undefined,
    rows: rows.map((rawRow) => {
      const row = isRecord(rawRow) ? rawRow : {};
      return {
        ...(row as unknown as PermissionMatrixRow),
        direction: typeof row.direction === 'string' ? row.direction : '',
        risk_level: typeof row.risk_level === 'string' ? row.risk_level : '',
        can_configure: typeof row.can_configure === 'boolean' ? row.can_configure : row.registered !== false,
        config_block_reason: typeof row.config_block_reason === 'string' ? row.config_block_reason : '',
        grant_status: typeof row.grant_status === 'string' ? row.grant_status : '',
        grant_source: typeof row.grant_source === 'string' ? row.grant_source : '',
        mirrored_from_legacy: typeof row.mirrored_from_legacy === 'boolean' ? row.mirrored_from_legacy : false,
        has_runtime_override: typeof row.has_runtime_override === 'boolean' ? row.has_runtime_override : false,
        runtime_enabled: typeof row.runtime_enabled === 'boolean' ? row.runtime_enabled : undefined,
        governed_action_domains: normalizePermissionMatrixGovernedActionDomains(row.governed_action_domains),
        host_functions: normalizePermissionMatrixHostFunctions(row.host_functions),
      };
    }),
    baseline_permissions: toStringArray(record.baseline_permissions),
    requested_permissions: toStringArray(record.requested_permissions),
    configured_policy_allowed_permissions: toStringArray(record.configured_policy_allowed_permissions),
    policy_allowed_permissions: toStringArray(record.policy_allowed_permissions),
    effective_permissions: toStringArray(record.effective_permissions),
  };
}

function extractResultError(value: unknown) {
  return isRecord(value) && typeof value.error === 'string' ? value.error : '';
}

function isHttpStatusError(error: unknown, status: number) {
  if (isRecord(error) && isRecord(error.response) && Number(error.response.status) === status) {
    return true;
  }
  return toErrorMessage(error).includes(`status code ${status}`);
}

function metric(value: unknown) {
  const num = Number(value || 0);
  return Number.isFinite(num) ? num : 0;
}

function formatTime(value: unknown) {
  if (!value) return '-';
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? String(value) : `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()} ${date.toLocaleTimeString()}`;
}

function sanitizeI18nSegment(value: string) {
  return (
    String(value || '')
      .trim()
      .toLowerCase()
      .replace(/[:.\-\/\s]+/g, '_') || 'unknown'
  );
}

type ActionDomainGuide = {
  label: string;
  purpose: string;
  capability: string;
  risk: string;
};

const ACTION_DOMAIN_GUIDES: Record<string, ActionDomainGuide> = {
  write_log: {
    label: '写日志',
    purpose: '让插件把运行过程、提示信息和结果摘要写到宿主日志。',
    capability: '开启后，插件可以主动记录执行过程，方便排查问题。',
    risk: '风险较低，但如果插件写入了敏感内容，日志里也可能出现这些信息。',
  },
  read_public_config: {
    label: '读取公开配置',
    purpose: '读取公开或低风险的系统配置。',
    capability: '开启后，插件可以读取基础配置项和公开参数。',
    risk: '风险较低，但仍可能暴露部分运行参数。',
  },
  read_plugin_scoped_config: {
    label: '读取插件配置',
    purpose: '读取当前插件自己的配置项。',
    capability: '开启后，插件可以读取自己命名空间下的配置。',
    risk: '风险较低，主要影响当前插件自己的行为。',
  },
  read_sensitive_config: {
    label: '读取敏感配置',
    purpose: '读取较敏感的系统或组织配置。',
    capability: '开启后，插件可以接触更敏感的运行参数。',
    risk: '风险中高，可能暴露内部环境信息或治理参数。',
  },
  get: {
    label: '读取插件存储',
    purpose: '读取插件自己的本地存储数据。',
    capability: '开启后，插件可以读取之前保存的状态和缓存。',
    risk: '风险较低，主要影响插件自己的数据区。',
  },
  list: {
    label: '列出插件存储',
    purpose: '查看插件自己的存储列表。',
    capability: '开启后，插件可以看到自己已保存的数据项。',
    risk: '风险较低，但会暴露插件自己的数据目录结构。',
  },
  set: {
    label: '写入插件存储',
    purpose: '写入或更新插件自己的存储数据。',
    capability: '开启后，插件可以保存状态、缓存和运行结果。',
    risk: '风险较低，但可能覆盖旧状态数据。',
  },
  delete: {
    label: '删除插件存储',
    purpose: '删除插件自己的已保存数据。',
    capability: '开启后，插件可以清理或重置自己的状态。',
    risk: '风险中等，可能导致插件历史数据丢失。',
  },
  public_request: {
    label: '访问外部接口',
    purpose: '访问公网 API、Webhook 或第三方服务。',
    capability: '开启后，插件可以向外部服务发请求。',
    risk: '风险中等，可能把数据发到外部系统。',
  },
  private_network_request: {
    label: '访问内网服务',
    purpose: '访问局域网或内网里的服务接口。',
    capability: '开启后，插件可以请求内部服务目标。',
    risk: '风险较高，可能接触内网服务、内网数据或管理接口。',
  },
  in_app_notify: {
    label: '站内通知',
    purpose: '给当前系统内用户或界面发送通知。',
    capability: '开启后，插件可以推送应用内提醒。',
    risk: '风险较低，但可能造成通知骚扰。',
  },
  channel_notify: {
    label: '外部通知',
    purpose: '向外部通知渠道发送消息。',
    capability: '开启后，插件可以把结果发到外部通知渠道。',
    risk: '风险中等，可能把信息带出系统。',
  },
  emit_self_namespace: {
    label: '发送本插件事件',
    purpose: '向当前插件自己的事件空间发送事件。',
    capability: '开启后，插件可以触发自己的内部事件流。',
    risk: '风险较低，影响范围通常只在当前插件。',
  },
  emit_shared_namespace: {
    label: '发送共享事件',
    purpose: '向多个插件共享的事件空间发送事件。',
    capability: '开启后，插件可以影响共享工作流或跨插件联动。',
    risk: '风险中等，可能影响其他插件或流程。',
  },
  emit_system_namespace: {
    label: '发送系统事件',
    purpose: '向系统级事件空间发送事件。',
    capability: '开启后，插件可以触发系统级联动。',
    risk: '风险较高，可能影响更大范围的系统行为。',
  },
  read_file: {
    label: '读取文件',
    purpose: '读取宿主机上的文件内容。',
    capability: '开启后，插件可以读取允许范围内的文件。',
    risk: '风险中高，可能接触宿主机上的业务文件或系统文件。',
  },
  list_directory: {
    label: '查看目录',
    purpose: '查看宿主机目录结构和文件列表。',
    capability: '开启后，插件可以列出允许目录里的文件。',
    risk: '风险中等，可能暴露目录结构和文件分布。',
  },
  stat_path: {
    label: '查看文件属性',
    purpose: '查看文件或目录的元信息。',
    capability: '开启后，插件可以知道目标是否存在、大小和属性。',
    risk: '风险较低，但会暴露文件存在性和结构信息。',
  },
  create_file: {
    label: '创建文件',
    purpose: '在宿主机允许目录中创建文件。',
    capability: '开启后，插件可以新增文件。',
    risk: '风险中高，会改变宿主机文件状态。',
  },
  append_file: {
    label: '追加文件',
    purpose: '向已有文件追加内容。',
    capability: '开启后，插件可以把结果追加写入文件。',
    risk: '风险中高，会改变现有文件内容。',
  },
  overwrite_file: {
    label: '覆盖文件',
    purpose: '用新内容覆盖已有文件。',
    capability: '开启后，插件可以替换旧文件内容。',
    risk: '风险高，可能直接破坏原有文件内容。',
  },
  delete_path: {
    label: '删除文件或目录',
    purpose: '删除宿主机上的文件或目录。',
    capability: '开启后，插件可以清理文件或目录。',
    risk: '风险高，可能造成数据永久丢失。',
  },
  resolve_reference: {
    label: '使用密钥引用',
    purpose: '以引用方式使用敏感凭据，而不是直接看到明文。',
    capability: '开启后，插件可以在受控场景下使用凭据引用。',
    risk: '风险中高，虽然通常不直接给明文，但仍会接触敏感能力。',
  },
  read_masked: {
    label: '读取脱敏密钥',
    purpose: '读取被脱敏处理后的密钥内容。',
    capability: '开启后，插件可以看到部分敏感凭据摘要。',
    risk: '风险较高，仍可能泄露敏感凭据线索。',
  },
  read_raw: {
    label: '读取明文密钥',
    purpose: '直接读取敏感凭据的明文。',
    capability: '开启后，插件可以直接拿到真实密钥值。',
    risk: '风险最高，可能导致凭据泄露或越权访问。',
  },
  network_scan: {
    label: '扫描设备',
    purpose: '主动扫描网段或设备目标，发现可达设备。',
    capability: '开启后，插件可以对局域网或设备目标做扫描探测。',
    risk: '风险高，可能触发局域网探测和更敏感的设备操作。',
  },
  wol_wake: {
    label: '唤醒设备',
    purpose: '向设备发送唤醒指令。',
    capability: '开启后，插件可以远程唤醒指定设备。',
    risk: '风险较高，会直接改变设备运行状态。',
  },
  device_probe: {
    label: '探测设备状态',
    purpose: '查看设备在线状态和基础可达性。',
    capability: '开启后，插件可以检测设备是否在线、是否可访问。',
    risk: '风险中高，可能暴露设备状态与网络拓扑。',
  },
  edge_job_dispatch: {
    label: '派发边缘任务',
    purpose: '把任务派发到边缘执行节点。',
    capability: '开启后，插件可以触发边缘设备上的执行任务。',
    risk: '风险较高，会把动作分发到边缘环境执行。',
  },
};

const ACTION_DOMAIN_GUIDES_EN: Record<string, ActionDomainGuide> = {
  write_log: {
    label: 'Write logs',
    purpose: 'Allow the plugin to write execution progress, hints, and result summaries into host logs.',
    capability: 'When enabled, the plugin can actively record what it is doing to help troubleshooting.',
    risk: 'Low risk, but sensitive content may still appear in logs if the plugin writes it.',
  },
  read_public_config: {
    label: 'Read public config',
    purpose: 'Read public or low-risk system configuration.',
    capability: 'When enabled, the plugin can read basic config items and public parameters.',
    risk: 'Low risk, but some runtime parameters may still be exposed.',
  },
  read_plugin_scoped_config: {
    label: 'Read plugin config',
    purpose: 'Read configuration that belongs to the current plugin.',
    capability: 'When enabled, the plugin can read config in its own namespace.',
    risk: 'Low risk and usually only affects the current plugin.',
  },
  read_sensitive_config: {
    label: 'Read protected config',
    purpose: 'Read more sensitive system or organization configuration.',
    capability: 'When enabled, the plugin can access more sensitive runtime parameters.',
    risk: 'Medium to high risk because internal environment or governance parameters may be exposed.',
  },
  get: {
    label: 'Read plugin storage',
    purpose: 'Read the plugin’s own local storage data.',
    capability: 'When enabled, the plugin can read previously saved state and cache.',
    risk: 'Low risk and mainly affects the plugin’s own data area.',
  },
  list: {
    label: 'List plugin storage',
    purpose: 'View the list of items in plugin storage.',
    capability: 'When enabled, the plugin can see its saved data entries.',
    risk: 'Low risk, but it still exposes the structure of the plugin data area.',
  },
  set: {
    label: 'Write plugin storage',
    purpose: 'Write or update the plugin’s own storage data.',
    capability: 'When enabled, the plugin can save state, cache, and execution results.',
    risk: 'Low risk, but old state data may be overwritten.',
  },
  delete: {
    label: 'Delete plugin storage',
    purpose: 'Delete the plugin’s saved data.',
    capability: 'When enabled, the plugin can clear or reset its own state.',
    risk: 'Medium risk because historical data may be lost.',
  },
  public_request: {
    label: 'Access external APIs',
    purpose: 'Access public APIs, webhooks, or third-party services.',
    capability: 'When enabled, the plugin can send requests to external services.',
    risk: 'Medium risk because data may leave the system.',
  },
  private_network_request: {
    label: 'Access internal services',
    purpose: 'Access service endpoints inside a LAN or private network.',
    capability: 'When enabled, the plugin can call internal service targets.',
    risk: 'High risk because internal services, internal data, or admin endpoints may be reached.',
  },
  in_app_notify: {
    label: 'In-app notifications',
    purpose: 'Send notifications to users or UI inside the current system.',
    capability: 'When enabled, the plugin can push in-app reminders.',
    risk: 'Low risk, but it may create notification noise.',
  },
  channel_notify: {
    label: 'External notifications',
    purpose: 'Send messages to external notification channels.',
    capability: 'When enabled, the plugin can send results to external channels.',
    risk: 'Medium risk because information may be sent outside the system.',
  },
  emit_self_namespace: {
    label: 'Emit self events',
    purpose: 'Send events to the current plugin’s own event namespace.',
    capability: 'When enabled, the plugin can trigger its internal event flow.',
    risk: 'Low risk because the impact usually stays inside the current plugin.',
  },
  emit_shared_namespace: {
    label: 'Emit shared events',
    purpose: 'Send events to a shared namespace used by multiple plugins.',
    capability: 'When enabled, the plugin can affect shared workflows or cross-plugin integrations.',
    risk: 'Medium risk because other plugins or flows may be affected.',
  },
  emit_system_namespace: {
    label: 'Emit system events',
    purpose: 'Send events to system-level namespaces.',
    capability: 'When enabled, the plugin can trigger system-level integrations.',
    risk: 'High risk because wider system behavior may be affected.',
  },
  read_file: {
    label: 'Read files',
    purpose: 'Read file content from the host machine.',
    capability: 'When enabled, the plugin can read files within the allowed scope.',
    risk: 'Medium to high risk because business files or system files may be exposed.',
  },
  list_directory: {
    label: 'Browse directories',
    purpose: 'View directory structure and file lists on the host.',
    capability: 'When enabled, the plugin can list files in allowed directories.',
    risk: 'Medium risk because directory structure and file layout may be exposed.',
  },
  stat_path: {
    label: 'Inspect file metadata',
    purpose: 'Read metadata about files or directories.',
    capability: 'When enabled, the plugin can learn whether a target exists and read its size and attributes.',
    risk: 'Low risk, but file existence and structure information may still be exposed.',
  },
  create_file: {
    label: 'Create files',
    purpose: 'Create files in allowed host directories.',
    capability: 'When enabled, the plugin can create new files.',
    risk: 'Medium to high risk because host file state will change.',
  },
  append_file: {
    label: 'Append files',
    purpose: 'Append content to an existing file.',
    capability: 'When enabled, the plugin can append results into a file.',
    risk: 'Medium to high risk because existing file content changes.',
  },
  overwrite_file: {
    label: 'Overwrite files',
    purpose: 'Replace existing file content with new content.',
    capability: 'When enabled, the plugin can replace old file content.',
    risk: 'High risk because original content may be damaged directly.',
  },
  delete_path: {
    label: 'Delete files or folders',
    purpose: 'Delete files or directories on the host machine.',
    capability: 'When enabled, the plugin can remove files or directories.',
    risk: 'High risk because data may be permanently lost.',
  },
  resolve_reference: {
    label: 'Use secret references',
    purpose: 'Use sensitive credentials by reference instead of reading raw values.',
    capability: 'When enabled, the plugin can use secret references in controlled scenarios.',
    risk: 'Medium to high risk because the plugin still gains access to sensitive capabilities.',
  },
  read_masked: {
    label: 'Read masked secrets',
    purpose: 'Read masked versions of secret values.',
    capability: 'When enabled, the plugin can see partial secret summaries.',
    risk: 'High risk because sensitive credential clues may still leak.',
  },
  read_raw: {
    label: 'Read raw secrets',
    purpose: 'Read raw plaintext values of sensitive credentials.',
    capability: 'When enabled, the plugin can directly obtain the real secret value.',
    risk: 'Highest risk because credentials may leak or lead to privilege escalation.',
  },
  network_scan: {
    label: 'Scan devices',
    purpose: 'Actively scan network ranges or device targets to discover reachable devices.',
    capability: 'When enabled, the plugin can probe LAN or device targets.',
    risk: 'High risk because it may trigger LAN scanning and more sensitive device actions.',
  },
  wol_wake: {
    label: 'Wake devices',
    purpose: 'Send wake-up commands to devices.',
    capability: 'When enabled, the plugin can wake designated devices remotely.',
    risk: 'High risk because device runtime state changes directly.',
  },
  device_probe: {
    label: 'Probe device status',
    purpose: 'Check device online state and basic reachability.',
    capability: 'When enabled, the plugin can test whether devices are online and reachable.',
    risk: 'Medium to high risk because device state and network topology may be exposed.',
  },
  edge_job_dispatch: {
    label: 'Dispatch edge jobs',
    purpose: 'Dispatch tasks to edge execution nodes.',
    capability: 'When enabled, the plugin can trigger tasks on edge devices.',
    risk: 'High risk because actions are distributed into edge environments.',
  },
};

function getActionDomainGuide(
  actionDomain: string,
  permissionLabel: string,
  fallbackDescription = '',
  resolvedLocale = 'zh-CN',
  translate?: (key: string, zhFallback: string, enFallback: string) => string,
): ActionDomainGuide {
  const normalized = sanitizeI18nSegment(actionDomain);
  const zhGuide = ACTION_DOMAIN_GUIDES[normalized];
  const enGuide = ACTION_DOMAIN_GUIDES_EN[normalized];
  if (translate) {
    return {
      label: translate(
        `plugins.permissions_ui.action_guides.${normalized}.label`,
        zhGuide?.label || actionDomain,
        enGuide?.label || actionDomain,
      ),
      purpose: translate(
        `plugins.permissions_ui.action_guides.${normalized}.purpose`,
        zhGuide?.purpose || fallbackDescription || `这是 ${permissionLabel} 下面的一个具体功能。`,
        enGuide?.purpose || fallbackDescription || `This is a concrete capability under ${permissionLabel}.`,
      ),
      capability: translate(
        `plugins.permissions_ui.action_guides.${normalized}.capability`,
        zhGuide?.capability || '开启后，插件可以使用这个具体功能。',
        enGuide?.capability || 'When enabled, the plugin can use this concrete capability.',
      ),
      risk: translate(
        `plugins.permissions_ui.action_guides.${normalized}.risk`,
        zhGuide?.risk || '请结合右侧的风险级别和生效约束一起判断是否应该放开。',
        enGuide?.risk || 'Review the risk level and effective constraints on the right before allowing it.',
      ),
    };
  }
  return {
    label: localizePluginText(`plugins.permissions_ui.action_guides.${normalized}.label`, zhGuide?.label || actionDomain),
    purpose: localizePluginText(
      `plugins.permissions_ui.action_guides.${normalized}.purpose`,
      zhGuide?.purpose || fallbackDescription || `这是 ${permissionLabel} 下面的一个具体功能。`,
    ),
    capability: localizePluginText(
      `plugins.permissions_ui.action_guides.${normalized}.capability`,
      zhGuide?.capability || '开启后，插件可以使用这个具体功能。',
    ),
    risk: localizePluginText(
      `plugins.permissions_ui.action_guides.${normalized}.risk`,
      zhGuide?.risk || '请结合右侧的风险级别和生效约束一起判断是否应该放开。',
    ),
  };
}

function draftStorageKey(pluginId: number) {
  return `${VERSION_DRAFT_STORAGE_PREFIX}:${pluginId}`;
}

function readDraftFromStorage(pluginId: number | null): VersionDraft {
  if (!pluginId || typeof window === 'undefined') {
    return { ...DEFAULT_VERSION_DRAFT };
  }
  try {
    const raw = localStorage.getItem(draftStorageKey(pluginId));
    if (!raw) {
      return { ...DEFAULT_VERSION_DRAFT };
    }
    const parsed = JSON.parse(raw) as Partial<VersionDraft>;
    return {
      version: String(parsed.version || DEFAULT_VERSION_DRAFT.version),
      source_type: String(parsed.source_type || DEFAULT_VERSION_DRAFT.source_type),
      description: String(parsed.description || ''),
    };
  } catch {
    return { ...DEFAULT_VERSION_DRAFT };
  }
}

function persistDraftToStorage(pluginId: number | null, draft: VersionDraft) {
  if (!pluginId || typeof window === 'undefined') {
    return;
  }
  localStorage.setItem(draftStorageKey(pluginId), JSON.stringify(draft));
}

function clearDraftFromStorage(pluginId: number | null) {
  if (!pluginId || typeof window === 'undefined') {
    return;
  }
  localStorage.removeItem(draftStorageKey(pluginId));
}

function sortPlugins(list: Plugin[]) {
  return [...list].sort((a, b) => Number(b.id) - Number(a.id));
}

function sortVersions(list: PluginVersion[]) {
  return [...list].sort((a, b) => Number(b.id) - Number(a.id));
}

function statusLabel(status?: string) {
  const labels: Record<string, string> = {
    install: localizePluginText('plugins.status_labels.install', '准备版本'),
    uninstall: localizePluginText('plugins.status_labels.uninstall', '清理产物'),
    load: localizePluginText('plugins.status_labels.load', '进入运行态'),
    unload: localizePluginText('plugins.status_labels.unload', '退出运行态'),
    status: localizePluginText('plugins.status_labels.status', '同步状态'),
    not_started: localizePluginText('plugins.status_labels.not_started', '未上传'),
    success: localizePluginText('plugins.status_labels.success', '转换成功'),
    uploaded_wait_install: localizePluginText('plugins.status_labels.uploaded_wait_install', 'ZIP 已上传'),
    uploaded: localizePluginText('plugins.status_labels.uploaded', 'ZIP 已上传'),
    converting: localizePluginText('plugins.status_labels.converting', '转换中'),
    not_installed: localizePluginText('plugins.status_labels.not_installed', '未准备'),
    installing: localizePluginText('plugins.status_labels.installing', '准备中'),
    installed: localizePluginText('plugins.status_labels.installed', '准备完成'),
    install_failed: localizePluginText('plugins.status_labels.install_failed', '准备失败'),
    unknown: localizePluginText('plugins.status_labels.unknown', '未知'),
    loaded: localizePluginText('plugins.status_labels.loaded', '已进入运行态'),
    unloaded: localizePluginText('plugins.status_labels.unloaded', '未进入运行态'),
    loading: localizePluginText('plugins.status_labels.loading', '进入中'),
    unloading: localizePluginText('plugins.status_labels.unloading', '退出中'),
    load_failed: localizePluginText('plugins.status_labels.load_failed', '进入失败'),
    unload_failed: localizePluginText('plugins.status_labels.unload_failed', '退出失败'),
    active: localizePluginText('plugins.status_labels.active', '运行中'),
    enabled: localizePluginText('plugins.status_labels.enabled', '已启用'),
    disabled: localizePluginText('plugins.status_labels.disabled', '已禁用'),
    banned: localizePluginText('plugins.status_labels.banned', '已封禁'),
    failed: localizePluginText('plugins.status_labels.failed', '失败'),
    error: localizePluginText('plugins.status_labels.error', '错误'),
    pending: localizePluginText('plugins.status_labels.pending', '等待中'),
  };
  return labels[String(status || '').toLowerCase()] || String(status || localizePluginText('plugins.status_labels.unknown', '未知'));
}

function statusTone(status?: string) {
  const value = String(status || '').toLowerCase();
  if (['success', 'loaded', 'active', 'enabled', 'installed', 'auto'].includes(value)) return 'border-emerald-200 bg-emerald-50 text-emerald-800';
  if (['pending', 'converting', 'loading', 'unloading', 'installing', 'uploaded_wait_install', 'manual', 'warmup'].includes(value)) return 'border-amber-200 bg-amber-50 text-amber-900';
  if (['failed', 'error', 'banned', 'disabled', 'install_failed', 'load_failed', 'unload_failed'].includes(value)) return 'border-rose-200 bg-rose-50 text-rose-800';
  return 'border-zinc-200 bg-zinc-50 text-zinc-700';
}

function trustLabel(value?: string) {
  const labels: Record<string, string> = {
    unscanned: localizePluginText('plugins.trust_labels.unscanned', '未扫描'),
    scanned_pending_review: localizePluginText('plugins.trust_labels.scanned_pending_review', '待复核'),
    trusted: localizePluginText('plugins.trust_labels.trusted', '可信已放行'),
    banned: localizePluginText('plugins.trust_labels.banned', '已封禁'),
  };
  return labels[String(value || '').toLowerCase()] || String(value || localizePluginText('plugins.trust_labels.unscanned', '未扫描'));
}

function lifeLabel(value?: string) {
  const labels: Record<string, string> = {
    active: localizePluginText('plugins.lifecycle_labels.active', '启用中'),
    disabled: localizePluginText('plugins.lifecycle_labels.disabled', '已禁用'),
    deleted: localizePluginText('plugins.lifecycle_labels.deleted', '已软删除'),
  };
  return labels[String(value || '').toLowerCase()] || String(value || localizePluginText('plugins.status_labels.unknown', '未知'));
}

function modeLabel(value?: string) {
  const labels: Record<string, string> = {
    go: localizePluginText('plugins.profile_labels.go', 'Go'),
    python: localizePluginText('plugins.profile_labels.python', 'Python'),
    wasm: localizePluginText('plugins.profile_labels.wasm', 'WASM 隔离'),
    native: localizePluginText('plugins.profile_labels.native', '原生执行'),
    persistent: localizePluginText('plugins.profile_labels.persistent', '进程池'),
    runtime: localizePluginText('plugins.profile_labels.runtime', '运行时挂载'),
    packed: localizePluginText('plugins.profile_labels.packed', '打包挂载'),
  };
  return labels[String(value || '').toLowerCase()] || String(value || '-');
}

function profileLabel(value?: string) {
  const labels: Record<string, string> = {
    sandbox: localizePluginText('plugins.profile_labels.sandbox', '沙箱'),
    trusted_t1: localizePluginText('plugins.profile_labels.trusted_t1', '可信 T1'),
    wasm: localizePluginText('plugins.profile_labels.wasm', 'WASM'),
    native: localizePluginText('plugins.profile_labels.native', '原生'),
    persistent: localizePluginText('plugins.profile_labels.persistent', '常驻进程'),
  };
  return labels[String(value || '').toLowerCase()] || String(value || localizePluginText('plugins.status_labels.unknown', '未知'));
}

function loadPolicyLabel(value?: string) {
  const labels: Record<string, string> = {
    explicit: localizePluginText('plugins.load_policy_labels.explicit', '显式加载'),
    auto: localizePluginText('plugins.load_policy_labels.auto', '自动补加载'),
  };
  return labels[String(value || '').toLowerCase()] || String(value || localizePluginText('plugins.status_labels.unknown', '未知'));
}

function loadTriggerLabel(value?: string) {
  const labels: Record<string, string> = {
    manual: localizePluginText('plugins.load_trigger_labels.manual', '手动进入'),
    invoke_auto: localizePluginText('plugins.load_trigger_labels.invoke_auto', '调用补加载'),
    warmup: localizePluginText('plugins.load_trigger_labels.warmup', '预热进入'),
  };
  return labels[String(value || '').toLowerCase()] || String(value || '-');
}

function buildStatusSnapshot(version?: PluginVersion | null, runtimeFallback?: string): VersionStatusSnapshot {
  const snapshot = version?.status_snapshot || {};
  const packageStatus = snapshot.package_status || version?.conversion_status || 'not_started';
  const runtimeStatus = snapshot.runtime_status || runtimeFallback || 'unknown';
  const installStatus = runtimeStatus === 'loaded'
    ? 'installed'
    : (snapshot.install_status || 'not_installed');
  return {
    ...snapshot,
    package_status: packageStatus,
    install_status: installStatus,
    runtime_status: runtimeStatus,
  };
}

function mergeStatusSnapshot(version: PluginVersion, snapshot?: VersionStatusSnapshot | null): PluginVersion {
  if (!snapshot) return version;
  return {
    ...version,
    conversion_status: snapshot.package_status || version.conversion_status,
    load_mode: snapshot.last_load_mode_requested || version.load_mode,
    status_snapshot: {
      ...(version.status_snapshot || {}),
      ...snapshot,
      last_action: snapshot.last_action ?? version.status_snapshot?.last_action ?? null,
    },
  };
}

function composeCurrentVersion(selectedVersion?: PluginVersion | null, detailVersion?: PluginVersion | null): PluginVersion | null {
  if (!selectedVersion && !detailVersion) return null;
  if (!selectedVersion) return detailVersion || null;
  if (!detailVersion || detailVersion.id !== selectedVersion.id) {
    return selectedVersion;
  }
  return {
    ...selectedVersion,
    ...detailVersion,
    status_snapshot: {
      ...(selectedVersion.status_snapshot || {}),
      ...(detailVersion.status_snapshot || {}),
    },
  };
}

function buildActionSnapshotPatch(
  version: PluginVersion | null | undefined,
  action: 'install' | 'uninstall' | 'load' | 'unload' | 'status',
  result: VersionActionResponse | VersionStatusResponse,
  executionMode: string,
): VersionStatusSnapshot | null {
  const resultRecord = isRecord(result) ? result : {};
  const base = buildStatusSnapshot(version, typeof result?.status === 'string' ? result.status : undefined);
  const snapshot: VersionStatusSnapshot = {
    ...base,
    ...(result?.status_snapshot || {}),
  };
  const normalizedStatus = String(result?.status || '').trim().toLowerCase();
  const requestedLoadMode = typeof resultRecord.requested_load_mode === 'string'
    ? resultRecord.requested_load_mode
    : (typeof resultRecord.execution_mode === 'string' ? resultRecord.execution_mode : executionMode);
  const resolvedLoadMode = typeof resultRecord.resolved_load_mode === 'string'
    ? resultRecord.resolved_load_mode
    : (typeof resultRecord.execution_mode_final === 'string' ? resultRecord.execution_mode_final : snapshot.last_load_mode_resolved);
  const lastLoadTrigger = typeof resultRecord.last_load_trigger === 'string' ? resultRecord.last_load_trigger : snapshot.last_load_trigger;

  if (action === 'install' && normalizedStatus === 'installed') {
    snapshot.install_status = 'installed';
  }
  if (action === 'uninstall' && normalizedStatus === 'uninstalled') {
    snapshot.install_status = 'not_installed';
    snapshot.runtime_status = snapshot.runtime_status || 'unloaded';
  }
  if (action === 'load' && normalizedStatus === 'loaded') {
    snapshot.install_status = 'installed';
    snapshot.runtime_status = 'loaded';
    snapshot.last_load_mode_requested = requestedLoadMode;
    snapshot.last_load_mode_resolved = resolvedLoadMode || requestedLoadMode;
    snapshot.last_load_trigger = lastLoadTrigger || 'manual';
  }
  if (action === 'unload' && normalizedStatus === 'unloaded') {
    snapshot.runtime_status = 'unloaded';
  }
  if (action === 'status' && normalizedStatus) {
    snapshot.runtime_status = normalizedStatus;
    if (normalizedStatus === 'loaded' && snapshot.install_status !== 'installed') {
      snapshot.install_status = 'installed';
    }
  }
  if (!snapshot.last_action) {
    snapshot.last_action = {
      name: action,
      result: 'success',
      error: '',
      at: new Date().toISOString(),
    };
  }

  return snapshot;
}

function failedLastAction(snapshot?: VersionStatusSnapshot | null): VersionLastAction | null {
  if (snapshot?.last_action?.result === 'failed') {
    return snapshot.last_action;
  }
  return null;
}

function parseSignatureParams(fn?: FunctionInfo) {
  if (!fn?.signature) return Object.entries(fn?.parameters || {}).map(([name, type]) => ({ name, type }));
  const match = fn.signature.match(/\((.*)\)/);
  if (!match?.[1]?.trim()) return [];
  return match[1].split(',').map((item) => item.trim()).filter(Boolean).map((item) => {
    const parts = item.split(/\s+/);
    return { name: parts[0] || '', type: parts.slice(1).join(' ') || fn.parameters?.[parts[0]] || 'any' };
  });
}

function exampleForParam(name: string, type: string) {
  const lowerName = name.toLowerCase();
  const lowerType = type.toLowerCase();
  if (lowerName.includes('mac')) return 'AA:BB:CC:DD:EE:FF';
  if (lowerName === 'port') return 9;
  if (lowerName === 'confirm') return false;
  if (lowerName === 'limit') return 20;
  if (lowerName === 'offset') return 0;
  if (lowerType.includes('bool')) return false;
  if (lowerType.includes('int') || lowerType.includes('float') || lowerType.includes('number')) return 0;
  if (lowerType.includes('list') || lowerType.includes('array') || lowerType.includes('slice')) return [];
  if (lowerType.includes('map') || lowerType.includes('object')) return {};
  return '';
}

function buildParamSpecs(fn?: FunctionInfo): ParamSpec[] {
  return parseSignatureParams(fn).map((param) => ({
    ...param,
    example: exampleForParam(param.name, param.type),
    note: localizePluginText('plugins.ui_runtime.param_type_note', '类型：{{type}}').replace('{{type}}', param.type),
  }));
}

function parseArrayJson(value: string, label: string) {
  const parsed = value.trim() ? JSON.parse(value) : [];
  if (!Array.isArray(parsed)) throw new Error(localizePluginText('plugins.ui_runtime.array_json_required', '{{label}} 必须是 JSON 数组').replace('{{label}}', label));
  return parsed;
}

function parseObjectJson(value: string, label: string) {
  const parsed = value.trim() ? JSON.parse(value) : {};
  if (!isRecord(parsed)) throw new Error(localizePluginText('plugins.ui_runtime.object_json_required', '{{label}} 必须是 JSON 对象').replace('{{label}}', label));
  return parsed;
}

function parseParamValue(input: string, type: string) {
  const lowerType = type.toLowerCase();
  const trimmed = input.trim();
  if (lowerType.includes('bool')) {
    if (trimmed !== 'true' && trimmed !== 'false') throw new Error(localizePluginText('plugins.ui_runtime.bool_only', '布尔参数只接受 true 或 false'));
    return trimmed === 'true';
  }
  if (lowerType.includes('int') || lowerType.includes('float') || lowerType.includes('number')) {
    const value = trimmed ? Number(trimmed) : 0;
    if (!Number.isFinite(value)) throw new Error(localizePluginText('plugins.ui_runtime.number_finite', '数字参数必须是有限数字'));
    return value;
  }
  if (lowerType.includes('list') || lowerType.includes('array') || lowerType.includes('slice')) return input.trim() ? JSON.parse(input) : [];
  if (lowerType.includes('map') || lowerType.includes('object')) return input.trim() ? JSON.parse(input) : {};
  if (input.trim() === 'null') return null;
  return input;
}

function classifyParamType(type: string) {
  const lowerType = type.toLowerCase();
  if (lowerType.includes('bool')) return 'bool';
  if (lowerType.includes('int') || lowerType.includes('float') || lowerType.includes('number')) return 'number';
  if (lowerType.includes('list') || lowerType.includes('array') || lowerType.includes('slice')) return 'array';
  if (lowerType.includes('map') || lowerType.includes('object')) return 'object';
  if (lowerType.includes('string')) return 'string';
  return 'unknown';
}

function validateInvokeArgs(args: unknown[], parameterTypes: string[], specs: ParamSpec[]) {
  const expectedCount = specs.length || parameterTypes.length;
  if (expectedCount > 0 && args.length !== expectedCount) {
    return localizePluginText('plugins.ui_runtime.arg_count_mismatch', '参数数量不匹配：函数需要 {{expected}} 个，当前提供 {{actual}} 个')
      .replace('{{expected}}', String(expectedCount))
      .replace('{{actual}}', String(args.length));
  }
  for (let index = 0; index < args.length; index += 1) {
    const value = args[index];
    const paramName = specs[index]?.name || `#${index + 1}`;
    const type = parameterTypes[index] || specs[index]?.type || 'any';
    const category = classifyParamType(type);
    if (category === 'string' && typeof value !== 'string') {
      return localizePluginText('plugins.ui_runtime.arg_string_required', '参数 {{name}} 必须是字符串文本').replace('{{name}}', paramName);
    }
    if (category === 'number' && (typeof value !== 'number' || !Number.isFinite(value))) {
      return localizePluginText('plugins.ui_runtime.arg_number_required', '参数 {{name}} 必须是有限数字').replace('{{name}}', paramName);
    }
    if (category === 'bool' && typeof value !== 'boolean') {
      return localizePluginText('plugins.ui_runtime.arg_bool_required', '参数 {{name}} 必须是 true 或 false').replace('{{name}}', paramName);
    }
    if (category === 'array' && !Array.isArray(value)) {
      return localizePluginText('plugins.ui_runtime.arg_array_required', '参数 {{name}} 必须是数组 JSON').replace('{{name}}', paramName);
    }
    if (category === 'object' && !isRecord(value)) {
      return localizePluginText('plugins.ui_runtime.arg_object_required', '参数 {{name}} 必须是对象 JSON').replace('{{name}}', paramName);
    }
  }
  return '';
}

function normalizeRuntimeLoadMode(value?: string) {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized === 'pool') return 'persistent';
  if (['wasm', 'native', 'persistent'].includes(normalized)) return normalized;
  return '';
}

function normalizeInvokeLoadPolicy(value?: string) {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized === 'auto' || normalized === 'explicit') return normalized;
  return '';
}

function extractInvokePermissionHint(value: unknown): InvokePermissionHint | null {
  if (!value) return null;
  if (isRecord(value)) {
    const permissionKey = String(value.permission_key || value.permission || '').trim().toLowerCase();
    const hostFunction = String(value.host_function || '').trim().toLowerCase();
    const directError = typeof value.error === 'string' ? value.error : '';
    const directMessage = typeof value.message === 'string' ? value.message : '';
    if (permissionKey || hostFunction) {
      return {
        permissionKey: permissionKey || hostFunction,
        hostFunction: hostFunction || permissionKey,
        message: directError || directMessage || 'permission denied',
      };
    }
    if (typeof value.result === 'string' && value.result.trim()) {
      try {
        return extractInvokePermissionHint(JSON.parse(value.result));
      } catch {
        const match = value.result.match(/permission denied:\s*([a-z0-9_]+)/i);
        if (match) {
          const key = String(match[1] || '').toLowerCase();
          return { permissionKey: key, hostFunction: key, message: value.result };
        }
      }
    }
    if (directError) {
      const match = directError.match(/permission denied:\s*([a-z0-9_]+)/i);
      if (match) {
        const key = String(match[1] || '').toLowerCase();
        return { permissionKey: key, hostFunction: key, message: directError };
      }
    }
  }
  if (typeof value === 'string') {
    const match = value.match(/permission denied:\s*([a-z0-9_]+)/i);
    if (match) {
      const key = String(match[1] || '').toLowerCase();
      return { permissionKey: key, hostFunction: key, message: value };
    }
  }
  return null;
}

function JsonBlock({
  value,
  empty = localizePluginText('plugins.ui_runtime.no_data', '暂无数据'),
  maxChars = 0,
  expanded = false,
  onToggleExpanded,
}: {
  value: unknown;
  empty?: string;
  maxChars?: number;
  expanded?: boolean;
  onToggleExpanded?: () => void;
}) {
  const raw = formatJson(value ?? { message: empty });
  const isTruncated = maxChars > 0 && raw.length > maxChars && !expanded;
  const display = isTruncated
    ? `${raw.slice(0, maxChars)}\n${localizePluginText('plugins.ui_runtime.truncated_suffix', '... 已截断 {{count}} 个字符').replace('{{count}}', String(raw.length - maxChars))}`
    : raw;
  return (
    <div className="space-y-2">
      <pre className="max-h-96 overflow-auto rounded-lg bg-zinc-950 p-4 text-xs text-zinc-50">{display}</pre>
      {maxChars > 0 && raw.length > maxChars && onToggleExpanded && (
        <button type="button" onClick={onToggleExpanded} className="text-xs font-semibold text-teal-700">
          {expanded
            ? localizePluginText('plugins.ui_runtime.collapse_result', '收起结果')
            : localizePluginText('plugins.ui_runtime.expand_full_result', '已截断，展开完整结果')}
        </button>
      )}
    </div>
  );
}

function PanelFeedback({
  state,
  loadingLabel = localizePluginText('plugins.ui_runtime.processing', '正在处理'),
}: {
  state: AsyncPanelState;
  loadingLabel?: string;
}) {
  if (!state.loadingAction && !state.error && !state.lastAction) return null;

  const hasOutcome = Boolean(state.error || state.lastAction);
  const failed = state.lastSuccess === false || Boolean(state.error);
  const outcomeTitle = state.lastAction
    ? `${localizePluginText('plugins.ui_runtime.recent_action', '最近动作')}：${state.lastAction}`
    : localizePluginText('plugins.ui_runtime.recent_error', '最近错误');
  const outcomeMessage = state.error || state.lastMessage;
  const outcomeTone = failed
    ? 'border-rose-200 bg-rose-50 text-rose-700'
    : 'border-emerald-200 bg-emerald-50 text-emerald-700';

  return (
    <div className="mb-4 space-y-3">
      {state.loadingAction && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <RefreshCw className="mt-0.5 h-4 w-4 shrink-0 animate-spin" />
          <div>
            <div className="font-semibold">{loadingLabel}</div>
            <div className="mt-1">{state.loadingAction}</div>
          </div>
        </div>
      )}
      {hasOutcome && (
        <div className={`rounded-xl border p-4 text-sm ${outcomeTone}`}>
          <div className="font-semibold">{outcomeTitle}</div>
          <div className="mt-1">{outcomeMessage}</div>
          {state.lastAt && <div className="mt-1 text-xs opacity-80">{localizePluginText('plugins.ui_runtime.time_label', '时间')}：{formatTime(state.lastAt)}</div>}
        </div>
      )}
    </div>
  );
}

export default function PluginsCore() {
  const { resolvedLocale, t } = useLocale();
  const isZh = resolvedLocale.startsWith('zh');
  const tx = React.useCallback((
    key: string,
    zhFallback: string,
    _enFallback: string,
    params?: Record<string, string | number | boolean | null | undefined>,
  ) => t(key, zhFallback, params), [t]);
  const pluginTextLookup = React.useCallback((key: string, zhFallback: string) => t(key, zhFallback), [t]);
  setPluginLocaleLookup(pluginTextLookup);
  React.useEffect(() => () => setPluginLocaleLookup(null), [pluginTextLookup]);
  const localizedExecutionModes = React.useMemo(() => (
    executionModes.map((item) => ({ ...item, label: modeLabel(item.value) }))
  ), [t, resolvedLocale]);
  const permissionUi = React.useMemo(() => (
    {
      workspaceModes: {
        capabilities: {
          label: tx('plugins.permissions_ui.workspace_modes.capabilities.label', '功能放行', 'Allow Features'),
          description: tx('plugins.permissions_ui.workspace_modes.capabilities.description', '按“功能组 -> 具体功能”两级设置，真正决定插件能做什么', 'Control what the plugin can do through “group -> concrete capability”.'),
        },
        constraints: {
          label: tx('plugins.permissions_ui.workspace_modes.constraints.label', '生效条件', 'Effective Conditions'),
          description: tx('plugins.permissions_ui.workspace_modes.constraints.description', '查看为什么已经配置了却还不能真正生效', 'Explain why something is configured but still not effective.'),
        },
        risks: {
          label: tx('plugins.permissions_ui.workspace_modes.risks.label', '风险说明', 'Risk Guide'),
          description: tx('plugins.permissions_ui.workspace_modes.risks.description', '逐项查看每个功能的作用、风险和生效前提', 'Review purpose, risk, and prerequisites for each capability.'),
        },
        diagnostics: {
          label: tx('plugins.permissions_ui.workspace_modes.diagnostics.label', '高级排查', 'Advanced Diagnostics'),
          description: tx('plugins.permissions_ui.workspace_modes.diagnostics.description', '探针、宿主映射和原始 JSON，适合研发或排障时查看', 'Probe, host mapping, and raw JSON for debugging.'),
        },
      },
      steps: {
        selectCategory: tx('plugins.permissions_ui.steps.select_category', '第 1 步：选择子分类', 'Step 1: Choose a sub-category'),
        selectFunction: tx('plugins.permissions_ui.steps.select_function', '第 2 步：选择要处理的具体功能', 'Step 2: Choose a concrete capability'),
        selectGroup: tx('plugins.permissions_ui.steps.select_group', '第 2 步：选择要处理的功能组', 'Step 2: Choose a feature group'),
        selectConstraint: tx('plugins.permissions_ui.steps.select_constraint', '第 2 步：选择要查看的生效条件', 'Step 2: Choose an effective condition'),
        selectRisk: tx('plugins.permissions_ui.steps.select_risk', '第 2 步：选择要了解风险的具体功能', 'Step 2: Choose a capability to review'),
        selectPanel: tx('plugins.permissions_ui.steps.select_panel', '第 2 步：选择排查面板', 'Step 2: Choose a diagnostics panel'),
        editCurrent: tx('plugins.permissions_ui.steps.edit_current', '第 3 步：设置当前对象', 'Step 3: Configure the current item'),
        viewCurrent: tx('plugins.permissions_ui.steps.view_current', '第 3 步：查看当前说明', 'Step 3: Review the current item'),
        saveHint: tx('plugins.permissions_ui.steps.save_hint', '改完后点击顶部“保存更改”', 'Click “Save Changes” at the top after editing'),
      },
      hints: {
        capabilitiesFunctions: tx('plugins.permissions_ui.hints.capabilities_functions', '当前右侧可直接设置这个具体功能是跟随默认、强制允许还是强制关闭。', 'You can directly set this capability to follow default, force allow, or force disable on the right.'),
        capabilitiesGroups: tx('plugins.permissions_ui.hints.capabilities_groups', '当前右侧可直接放行或关闭这个功能组。', 'You can directly allow or close this feature group on the right.'),
        constraints: tx('plugins.permissions_ui.hints.constraints', '当前右侧只解释为什么还不能用，不提供修改。', 'This area only explains why something is not working yet and does not provide editing.'),
        risks: tx('plugins.permissions_ui.hints.risks', '当前右侧专门解释这个功能是做什么的、风险是什么，以及还差什么条件。', 'This area explains what the capability does, what the risk is, and what conditions are still missing.'),
        diagnostics: tx('plugins.permissions_ui.hints.diagnostics', '当前右侧只做高级排查和原始数据查看。', 'This area is only for advanced diagnostics and raw data.'),
        selectFunctions: tx('plugins.permissions_ui.hints.select_functions', '左侧只保留具体功能列表，方便直接选择对象后在右侧设置。', 'The left list only keeps concrete capabilities so you can choose one and edit it on the right.'),
        selectGroups: tx('plugins.permissions_ui.hints.select_groups', '左侧只保留功能组列表，方便批量决定上层放行。', 'The left list only keeps feature groups for higher-level allowance control.'),
        selectConstraints: tx('plugins.permissions_ui.hints.select_constraints', '左侧只保留命中的阻断分类，右侧专门解释原因。', 'The left list only keeps matched blocking categories and the right explains them.'),
        selectRisks: tx('plugins.permissions_ui.hints.select_risks', '左侧只保留具体功能，右侧集中解释用途、风险和前提。', 'The left list only keeps concrete capabilities and the right explains purpose, risk, and prerequisites.'),
        selectPanels: tx('plugins.permissions_ui.hints.select_panels', '左侧只保留诊断面板，右侧集中查看底层结果。', 'The left list only keeps diagnostics panels and the right shows low-level details.'),
        topTip: tx('plugins.permissions_ui.hints.top_tip', '想让功能能用：先在“功能放行”里选功能组，再选具体功能；还不能用时，去看“生效条件”，想了解风险时看“风险说明”。', 'To make a capability work: first allow the feature group under “Allow Features”, then allow the concrete capability. If it still does not work, check “Effective Conditions”.'),
      },
      badges: {
        editable: tx('plugins.permissions_ui.badges.editable', '此子分类可直接设置', 'Editable sub-category'),
        readonly: tx('plugins.permissions_ui.badges.readonly', '此子分类仅查看', 'Read-only sub-category'),
        currentWorkspace: tx('plugins.permissions_ui.badges.current_workspace', '当前工作区', 'Current workspace'),
        executionAllowed: tx('plugins.permissions_ui.badges.execution_allowed', '允许后续执行', 'Future execution allowed'),
        executionDisabled: tx('plugins.permissions_ui.badges.execution_disabled', '已禁止后续执行', 'Future execution disabled'),
        currentVersion: tx('plugins.permissions_ui.badges.current_version', '当前版本', 'Current version'),
        requested: tx('plugins.permissions_ui.badges.requested', '已请求', 'Requested'),
        effective: tx('plugins.permissions_ui.badges.effective', '已生效', 'Effective'),
        unknown: tx('plugins.permissions_ui.badges.unknown', '未登记', 'Unknown'),
      },
      capabilityView: {
        groups: tx('plugins.permissions_ui.capability_view.groups', '功能组', 'Feature Groups'),
        functions: tx('plugins.permissions_ui.capability_view.functions', '具体功能', 'Concrete Capabilities'),
      },
      sections: {
        whatItDoes: tx('plugins.permissions_ui.sections.what_it_does', '这个功能是做什么的', 'What this capability does'),
        whatOpenDoes: tx('plugins.permissions_ui.sections.what_open_does', '放开后能做什么', 'What enabling it allows'),
        riskNotice: tx('plugins.permissions_ui.sections.risk_notice', '风险提醒', 'Risk notice'),
        nextStep: tx('plugins.permissions_ui.sections.next_step', '推荐下一步', 'Recommended next step'),
        settingOptions: tx('plugins.permissions_ui.sections.setting_options', '设置选项', 'Settings'),
        resultSummary: tx('plugins.permissions_ui.sections.result_summary', '结果说明', 'Result summary'),
        currentSaved: tx('plugins.permissions_ui.sections.current_saved', '当前保存', 'Current saved'),
        currentDraft: tx('plugins.permissions_ui.sections.current_draft', '当前草稿', 'Current draft'),
        effectiveAfterSave: tx('plugins.permissions_ui.sections.effective_after_save', '保存后生效', 'Effective after save'),
        grantStatus: tx('plugins.permissions_ui.sections.grant_status', '授予状态', 'Grant status'),
        includedFunctions: tx('plugins.permissions_ui.sections.included_functions', '包含的具体功能', 'Included capabilities'),
        hostMapping: tx('plugins.permissions_ui.sections.host_mapping', '宿主映射与说明', 'Host mapping and notes'),
        currentPrerequisites: tx('plugins.permissions_ui.sections.current_prerequisites', '当前前提', 'Current prerequisites'),
        missingPrerequisites: tx('plugins.permissions_ui.sections.missing_prerequisites', '还差什么条件', 'What is still missing'),
      },
      words: {
        runAllowed: tx('plugins.permissions_ui.words.run_allowed', '运行允许', 'Runtime allowed'),
        runDisabled: tx('plugins.permissions_ui.words.run_disabled', '运行关闭', 'Runtime disabled'),
        waitingSave: tx('plugins.permissions_ui.words.waiting_save', '待保存', 'Pending save'),
        sameAsSaved: tx('plugins.permissions_ui.words.same_as_saved', '与当前保存一致', 'Same as saved'),
        allowed: tx('plugins.permissions_ui.words.allowed', '允许', 'Allowed'),
        disallowed: tx('plugins.permissions_ui.words.disallowed', '不允许', 'Not allowed'),
        yes: tx('plugins.permissions_ui.words.yes', '是', 'Yes'),
        no: tx('plugins.permissions_ui.words.no', '否', 'No'),
        savedAllow: tx('plugins.permissions_ui.words.saved_allow', '已放行', 'Allowed'),
        savedDeny: tx('plugins.permissions_ui.words.saved_deny', '已拒绝', 'Denied'),
        draftAllow: tx('plugins.permissions_ui.words.draft_allow', '准备放行', 'Will allow'),
        draftDeny: tx('plugins.permissions_ui.words.draft_deny', '准备拒绝', 'Will deny'),
      },
    }
  ), [tx]);
  const [plugins, setPlugins] = React.useState<Plugin[]>([]);
  const [pluginTotal, setPluginTotal] = React.useState(0);
  const [selectedPluginId, setSelectedPluginId] = React.useState<number | null>(null);
  const [versions, setVersions] = React.useState<PluginVersion[]>([]);
  const [selectedVersionId, setSelectedVersionId] = React.useState<number | null>(null);
  const [statusByVersion, setStatusByVersion] = React.useState<Record<number, string>>({});
  const [functions, setFunctions] = React.useState<FunctionInfo[]>([]);
  const [functionsLoadedOnce, setFunctionsLoadedOnce] = React.useState(false);
  const [functionName, setFunctionName] = React.useState('');
  const [parameterTypesJson, setParameterTypesJson] = React.useState('[]');
  const [argsJson, setArgsJson] = React.useState('[]');
  const [paramInputValues, setParamInputValues] = React.useState<string[]>([]);
  const [details, setDetails] = React.useState<unknown>(null);
  const [invokeResult, setInvokeResult] = React.useState<unknown>(null);
  const [actionLog, setActionLog] = React.useState<string[]>([]);
  const [sidebarState, setSidebarState] = React.useState<AsyncPanelState>(() => createAsyncPanelState());
  const [contextState, setContextState] = React.useState<AsyncPanelState>(() => createAsyncPanelState());
  const [snapshotState, setSnapshotState] = React.useState<AsyncPanelState>(() => createAsyncPanelState());
  const [versionActionState, setVersionActionState] = React.useState<AsyncPanelState>(() => createAsyncPanelState());
  const [invokeState, setInvokeState] = React.useState<AsyncPanelState>(() => createAsyncPanelState());
  const [permissionsState, setPermissionsState] = React.useState<AsyncPanelState>(() => createAsyncPanelState());
  const [runtimePreferencesState, setRuntimePreferencesState] = React.useState<AsyncPanelState>(() => createAsyncPanelState());
  const [auditState, setAuditState] = React.useState<AsyncPanelState>(() => createAsyncPanelState());
  const [governanceState, setGovernanceState] = React.useState<AsyncPanelState>(() => createAsyncPanelState());
  const [search, setSearch] = React.useState('');
  const [showCreatePlugin, setShowCreatePlugin] = React.useState(false);
  const [newPlugin, setNewPlugin] = React.useState({ name: '', description: '' });
  const [newVersion, setNewVersion] = React.useState<VersionDraft>({ ...DEFAULT_VERSION_DRAFT });
  const [packageFile, setPackageFile] = React.useState<File | null>(null);
  const [executionMode, setExecutionMode] = React.useState('wasm');
  const [activeTab, setActiveTab] = React.useState<TabKey>('status');
  const [isMetricsOpen, setIsMetricsOpen] = React.useState(false);
  const [versionDetails, setVersionDetails] = React.useState<PluginVersion | null>(null);
  const [conversionInfo, setConversionInfo] = React.useState<unknown>(null);
  const [sourceAudit, setSourceAudit] = React.useState<SourceAuditResponse | null>(null);
  const [runtimePreferences, setRuntimePreferences] = React.useState<VersionRuntimePreferences | null>(null);
  const [runtimeDefaults, setRuntimeDefaults] = React.useState<PluginRuntimeDefaults | null>(null);
  const [runtimePreferenceDraft, setRuntimePreferenceDraft] = React.useState<RuntimePreferenceDraft>({ ...runtimePreferenceDraftDefault });
  const [permissionMatrix, setPermissionMatrix] = React.useState<PermissionMatrixResponse | null>(null);
  const [requestedPermissions, setRequestedPermissions] = React.useState<unknown>(null);
  const [effectivePermissions, setEffectivePermissions] = React.useState<EffectivePermissionsResponse | null>(null);
  const [policy, setPolicy] = React.useState<VersionPolicyResponse | null>(null);
  const [policyJson, setPolicyJson] = React.useState('{}');
  const [permissionFilter, setPermissionFilter] = React.useState<PermissionFilterKey>('all');
  const [permissionWorkspaceMode, setPermissionWorkspaceMode] = React.useState<PermissionWorkspaceMode>('capabilities');
  const [permissionCapabilityView, setPermissionCapabilityView] = React.useState<PermissionCapabilityView>('functions');
  const [policyDraftPermissions, setPolicyDraftPermissions] = React.useState<string[]>([]);
  const [actionDomainOverrideDrafts, setActionDomainOverrideDrafts] = React.useState<ActionDomainOverrideDraft[]>([]);
  const [policyDraftDirty, setPolicyDraftDirty] = React.useState(false);
  const [isAdvancedPolicyOpen, setIsAdvancedPolicyOpen] = React.useState(false);
  const [expandedPermissionKeys, setExpandedPermissionKeys] = React.useState<string[]>([]);
  const [selectedPermissionKey, setSelectedPermissionKey] = React.useState('');
  const [selectedActionDomainKey, setSelectedActionDomainKey] = React.useState('');
  const [selectedConstraintKey, setSelectedConstraintKey] = React.useState('parent_permission_off');
  const [selectedDiagnosticsPanel, setSelectedDiagnosticsPanel] = React.useState<PermissionDiagnosticsPanel>('probe');
  const [permissionProbe, setPermissionProbe] = React.useState('');
  const [permissionProbeResult, setPermissionProbeResult] = React.useState<unknown>(null);
  const [runtimeMetrics, setRuntimeMetrics] = React.useState<Record<string, unknown> | null>(null);
  const [poolMetrics, setPoolMetrics] = React.useState<unknown>(null);
  const [diagnosticResult, setDiagnosticResult] = React.useState<unknown>(null);
  const [pluginUsage, setPluginUsage] = React.useState<UsageSummary | null>(null);
  const [versionUsage, setVersionUsage] = React.useState<UsageSummary | null>(null);
  const [reviews, setReviews] = React.useState<ReviewItem[]>([]);
  const [pendingReviewCount, setPendingReviewCount] = React.useState(0);
  const [governanceConfirm, setGovernanceConfirm] = React.useState('');
  const [isBatchMode, setIsBatchMode] = React.useState(false);
  const [batchSelectedPluginIds, setBatchSelectedPluginIds] = React.useState<number[]>([]);
  const [invokePermissionHint, setInvokePermissionHint] = React.useState<InvokePermissionHint | null>(null);
  const [runtimePreferencesEndpointMissing, setRuntimePreferencesEndpointMissing] = React.useState(false);
  const [isStatusDetailsOpen, setIsStatusDetailsOpen] = React.useState(false);
  const [currentUserId, setCurrentUserId] = React.useState(0);
  const [permissionsLoadedKey, setPermissionsLoadedKey] = React.useState('');
  const [invokeInputError, setInvokeInputError] = React.useState('');
  const [invokeTimeoutMs, setInvokeTimeoutMs] = React.useState('30000');
  const [invokeResultExpanded, setInvokeResultExpanded] = React.useState(false);
  const [policyJsonError, setPolicyJsonError] = React.useState('');
  const [permissionsSnapshotStale, setPermissionsSnapshotStale] = React.useState(false);
  const [testInvokeConfig, setTestInvokeConfig] = React.useState({ timeout_ms: '5000', force_target: 'wasm', force_profile: 'sandbox', enable_trace: true });
  const bodyScrollRef = React.useRef<HTMLDivElement | null>(null);
  const pluginsRequestRef = React.useRef(0);
  const versionsRequestRef = React.useRef(0);
  const usageRequestRef = React.useRef(0);
  const reviewsRequestRef = React.useRef(0);
  const snapshotRequestRef = React.useRef(0);
  const functionsRequestRef = React.useRef(0);
  const permissionsRequestRef = React.useRef(0);
  const auditRequestRef = React.useRef(0);
  const diagnosticsRequestRef = React.useRef(0);
  const invokeRequestRef = React.useRef(0);
  const invokeAbortRef = React.useRef<AbortController | null>(null);
  const runtimePreferencesRequestRef = React.useRef(0);
  const permissionsInFlightKeyRef = React.useRef('');
  const draftPluginIdRef = React.useRef<number | null>(null);

  const pluginTabs = React.useMemo<Array<{ key: TabKey; label: string }>>(() => ([
    { key: 'status', label: t('plugins.tabs.status', '状态总览') },
    { key: 'invoke', label: t('plugins.tabs.invoke', '插件调用') },
    { key: 'permissions', label: t('plugins.tabs.permissions', '权限与隔离') },
    { key: 'audit', label: t('plugins.tabs.audit', '安全审计') },
    { key: 'governance', label: t('plugins.tabs.governance', '治理管理') },
  ]), [t]);

  const selectedPlugin = plugins.find((item) => item.id === selectedPluginId) || null;
  const selectedVersion = versions.find((item) => item.id === selectedVersionId) || null;
  const selectedVersionIssue = !selectedVersionId
    ? t('plugins.ui_runtime.select_version_first', '请先选择版本')
    : (!selectedVersion ? t('plugins.ui_runtime.version_missing_sync', '当前版本 #{{versionId}} 已不在版本列表，请同步版本列表', { versionId: selectedVersionId }) : '');
  const currentVersion = React.useMemo(
    () => composeCurrentVersion(selectedVersion, versionDetails),
    [selectedVersion, versionDetails],
  );
  const currentStatusSnapshot = buildStatusSnapshot(currentVersion, selectedVersionId ? statusByVersion[selectedVersionId] : undefined);
  const currentFailedAction = failedLastAction(currentStatusSnapshot);
  const selectedFunction = functions.find((item) => item.name === functionName) || null;
  const paramSpecs = buildParamSpecs(selectedFunction || undefined);
  const runtimeRecord = isRecord(runtimeMetrics) ? runtimeMetrics : {};
  const pluginMetrics = isRecord(runtimeRecord.plugin_metrics) ? runtimeRecord.plugin_metrics : {};
  const versionMetrics: Record<string, unknown> =
    selectedVersionId && isRecord(pluginMetrics[String(selectedVersionId)])
      ? (pluginMetrics[String(selectedVersionId)] as Record<string, unknown>)
      : {};
  const currentPolicy = isRecord(policy) ? policy : {};
  const effectiveRecord = isRecord(effectivePermissions) ? effectivePermissions : {};
  const currentTrustState = currentVersion?.trust_state || 'unscanned';
  const currentLifecycle = currentVersion?.plugin_lifecycle_status || selectedPlugin?.lifecycle_status || 'active';
  const currentProfile = typeof currentPolicy.profile === 'string' ? currentPolicy.profile : (currentTrustState === 'trusted' ? 'trusted_t1' : 'sandbox');
  const forceSandbox = Boolean(currentPolicy.force_sandbox_mode ?? effectiveRecord.force_sandbox_mode ?? (currentTrustState !== 'trusted'));
  const currentInvokeLoadPolicy = runtimePreferences?.effective_invoke_load_policy
    || currentStatusSnapshot.invoke_load_policy
    || 'explicit';
  const currentRequestedLoadMode = normalizeRuntimeLoadMode(
    currentStatusSnapshot.last_load_mode_requested
      || runtimePreferences?.effective_requested_load_mode
      || currentVersion?.load_mode
      || executionMode
      || 'wasm',
  ) || 'wasm';
  const currentResolvedLoadMode = normalizeRuntimeLoadMode(
    currentStatusSnapshot.last_load_mode_resolved
      || runtimePreferences?.effective_resolved_load_mode
      || currentRequestedLoadMode,
  ) || currentRequestedLoadMode;
  const currentLoadTrigger = currentStatusSnapshot.last_load_trigger || '';
  const isInstalled = currentStatusSnapshot.install_status === 'installed';
  const isLoaded = currentStatusSnapshot.runtime_status === 'loaded';
  const runtimeDeleteBlocked = ['loaded', 'loading', 'unloading'].includes(String(currentStatusSnapshot.runtime_status || '').toLowerCase());
  const versionActionBusyGlobal = Boolean(versionActionState.loadingAction || snapshotState.loadingAction);
  const canInstall = Boolean(selectedVersionId) && !versionActionBusyGlobal;
  const canUninstall = Boolean(selectedVersionId) && isInstalled && !isLoaded && !versionActionBusyGlobal;
  const canLoad = Boolean(selectedVersionId) && isInstalled && !isLoaded && !versionActionBusyGlobal;
  const canUnload = Boolean(selectedVersionId) && isLoaded && !versionActionBusyGlobal;
  const canSyncStatus = Boolean(selectedVersionId) && !versionActionBusyGlobal;
  const invokeRequiresManualLoad = currentInvokeLoadPolicy === 'explicit' && !isLoaded;
  const invokeWillAutoLoad = currentInvokeLoadPolicy === 'auto' && !isLoaded && isInstalled;
  const invokeBlockedByInstall = !isInstalled;
  const currentInvokeRequest = {
    version_id: selectedVersionId,
    function: functionName,
    parameter_types: safeJson(parameterTypesJson, []),
    args: safeJson(argsJson, []),
    timeout_ms: Number(invokeTimeoutMs || 30000),
  };
  const latestReview = reviews.find((item) => Number(item.version_id || item.resource_id) === Number(selectedVersionId)) || null;
  const translateStatus = React.useCallback((value?: string) => {
    const normalized = String(value || 'unknown').toLowerCase();
    return t(`plugins.status_labels.${normalized}`, statusLabel(value));
  }, [t]);
  const translateTrust = React.useCallback((value?: string) => {
    const normalized = String(value || 'unscanned').toLowerCase();
    return t(`plugins.trust_labels.${normalized}`, trustLabel(value));
  }, [t]);
  const translateLifecycle = React.useCallback((value?: string) => {
    const normalized = String(value || 'unknown').toLowerCase();
    return t(`plugins.lifecycle_labels.${normalized}`, lifeLabel(value));
  }, [t]);
  const translateProfile = React.useCallback((value?: string) => {
    const normalized = String(value || 'unknown').toLowerCase();
    return t(`plugins.profile_labels.${normalized}`, profileLabel(value));
  }, [t]);
  const mergeVersionSnapshot = React.useCallback((versionId: number, snapshot?: VersionStatusSnapshot | null) => {
    if (!snapshot) return;
    setVersions((items) => items.map((item) => (item.id === versionId ? mergeStatusSnapshot(item, snapshot) : item)));
    setVersionDetails((current) => (current && current.id === versionId ? mergeStatusSnapshot(current, snapshot) : current));
  }, []);
  const mergeVersionRecord = React.useCallback((version: PluginVersion) => {
    setVersions((items) => {
      const exists = items.some((item) => item.id === version.id);
      const next = exists
        ? items.map((item) => (item.id === version.id ? { ...item, ...version } : item))
        : [...items, version];
      return sortVersions(next);
    });
    setVersionDetails((current) => (current && current.id === version.id ? { ...current, ...version } : current));
  }, []);
  const translatePermissionKey = React.useCallback((value?: string) => {
    const normalized = sanitizeI18nSegment(String(value || 'unknown'));
    return t(`permissions.keys.${normalized}.label`, String(value || t('common.unknown', '未知')));
  }, [t]);
  const translatePermissionDescription = React.useCallback((value?: string) => {
    const normalized = sanitizeI18nSegment(String(value || 'unknown'));
    return t(`permissions.keys.${normalized}.description`, '');
  }, [t]);
  const translateModule = React.useCallback((moduleKey?: string) => {
    const fallback = String(moduleKey || 'unknown').split('.').pop() || t('common.unknown', '未知');
    return moduleKey ? t(moduleKey, fallback) : t('permissions.modules.unknown', '未知模块');
  }, [t]);
  const translateDecisionReason = React.useCallback((reason?: string) => {
    const normalized = String(reason || 'unknown_permission').toLowerCase();
    const fallbackMap: Record<string, [string, string]> = {
      allowed: ['已生效', 'Allowed'],
      baseline_default: ['基础宿主权限默认放行', 'Allowed by baseline host permission'],
      not_requested: ['插件没有请求这个权限', 'The plugin did not request this permission'],
      blocked_by_policy: ['被策略拒绝', 'Blocked by policy'],
      blocked_by_forced_sandbox: ['被强制沙箱压制', 'Suppressed by forced sandbox'],
      blocked_by_force_sandbox: ['被强制沙箱压制', 'Suppressed by forced sandbox'],
      unknown_permission: ['未登记权限', 'Unknown permission'],
    };
    const fallback = fallbackMap[normalized];
    return tx(`plugins.permissions_ui.decision_reason.${normalized}`, fallback?.[0] || normalized, fallback?.[1] || normalized);
  }, [tx]);
  const translateRequestSource = React.useCallback((source?: string) => {
    const normalized = String(source || 'none').toLowerCase();
    const fallbackMap: Record<string, [string, string]> = {
      manifest: ['Manifest 声明', 'Manifest'],
      metadata: ['元数据声明', 'Metadata'],
      baseline: ['基础宿主权限', 'Baseline'],
      none: ['未请求', 'Not requested'],
      unknown: ['未知来源', 'Unknown source'],
    };
    const fallback = fallbackMap[normalized];
    return tx(`plugins.permissions_ui.request_source.${normalized}`, fallback?.[0] || normalized, fallback?.[1] || normalized);
  }, [tx]);
  const translatePermissionDirection = React.useCallback((direction?: string) => {
    const normalized = String(direction || 'active_host_call').toLowerCase();
    const fallbackMap: Record<string, [string, string]> = {
      active_host_call: ['主动宿主调用', 'Active host call'],
      host_injection: ['宿主被动提供/注入', 'Host-provided injection'],
      system_governance: ['系统治理能力', 'System governance capability'],
      no_permission: ['无权限宿主能力', 'No-permission host capability'],
    };
    const fallback = fallbackMap[normalized];
    return tx(`plugins.permissions_ui.direction.${normalized}`, fallback?.[0] || normalized, fallback?.[1] || normalized);
  }, [tx]);
  const translatePermissionRisk = React.useCallback((risk?: string) => {
    const normalized = String(risk || 'unknown').toLowerCase();
    const fallbackMap: Record<string, [string, string]> = {
      low: ['低风险', 'Low risk'],
      medium: ['中风险', 'Medium risk'],
      high: ['高风险', 'High risk'],
      unknown: ['未知风险', 'Unknown risk'],
    };
    const fallback = fallbackMap[normalized];
    return tx(`plugins.permissions_ui.risk.${normalized}`, fallback?.[0] || normalized, fallback?.[1] || normalized);
  }, [tx]);
  const translateConfigBlockReason = React.useCallback((reason?: string) => {
    const normalized = String(reason || '').toLowerCase();
    const fallbackMap: Record<string, [string, string]> = {
      unknown_permission: [
        '未登记权限，不能直接放行；请先登记权限键，或把插件声明改成已登记权限（例如 system_action）。',
        'This permission is not registered and cannot be allowed directly. Register the key or change the plugin declaration to a registered permission such as system_action.',
      ],
    };
    const fallback = fallbackMap[normalized];
    return tx(`plugins.permissions_ui.config_block_reason.${normalized}`, fallback?.[0] || normalized, fallback?.[1] || normalized);
  }, [tx]);
  const translateGrantStatus = React.useCallback((status?: string) => {
    const normalized = String(status || '').toLowerCase();
    const fallbackMap: Record<string, [string, string]> = {
      active: ['已授予', 'Granted'],
      revoked: ['已撤销', 'Revoked'],
      superseded: ['已替换', 'Superseded'],
      expired: ['已过期', 'Expired'],
    };
    const fallback = fallbackMap[normalized];
    return tx(`plugins.permissions_ui.grant_status.${normalized}`, fallback?.[0] || normalized, fallback?.[1] || normalized);
  }, [tx]);
  const translateGrantSource = React.useCallback((source?: string) => {
    const normalized = String(source || '').toLowerCase();
    const fallbackMap: Record<string, [string, string]> = {
      legacy_policy_bridge: ['旧策略桥接', 'Legacy policy bridge'],
      manual_review: ['人工审核', 'Manual review'],
      auto_review: ['自动审核', 'Auto review'],
      dual_review: ['双人审核', 'Dual review'],
      platform_signed: ['平台签发', 'Platform signed'],
    };
    const fallback = fallbackMap[normalized];
    return tx(`plugins.permissions_ui.grant_source.${normalized}`, fallback?.[0] || normalized, fallback?.[1] || normalized);
  }, [tx]);
  const translateRuntimeOverrideState = React.useCallback((value: boolean | undefined, hasOverride?: boolean) => {
    if (!hasOverride) {
      return tx('plugins.permissions_ui.runtime_override.follow_default', '跟随默认设置（当前没有单独指定）', 'Follow default setting (no explicit runtime override)');
    }
    if (typeof value === 'boolean') {
      return value
        ? tx('plugins.permissions_ui.runtime_override.enabled', '当前已单独设为强制允许', 'Runtime override: enabled')
        : tx('plugins.permissions_ui.runtime_override.disabled', '当前已单独设为强制关闭', 'Runtime override: disabled');
    }
    return tx('plugins.permissions_ui.runtime_override.mixed', '动作域运行覆盖：混合状态', 'Runtime override: mixed');
  }, [tx]);
  const translateValueSource = React.useCallback((source?: string) => {
    const normalized = String(source || 'system').toLowerCase();
    const fallbackMap: Record<string, [string, string]> = {
      version: ['版本显式值', 'Version override'],
      global: ['全局默认', 'Global default'],
      system: ['系统缺省', 'System default'],
    };
    const fallback = fallbackMap[normalized];
    return tx(`plugins.permissions_ui.value_source.${normalized}`, fallback?.[0] || normalized, fallback?.[1] || normalized);
  }, [tx]);
  const translateHostFunctionLabel = React.useCallback((i18nKey?: string, fallback?: string) => {
    return i18nKey ? t(`${i18nKey}.label`, fallback || i18nKey) : String(fallback || '');
  }, [t]);
  const translateHostFunctionDescription = React.useCallback((i18nKey?: string, fallback?: string) => {
    return i18nKey ? t(`${i18nKey}.description`, fallback || '') : String(fallback || '');
  }, [t]);
  const translateActionDomainRuntimeMode = React.useCallback((mode: ActionDomainRuntimeMode) => {
    if (mode === 'enabled') {
      return tx('plugins.permissions_ui.runtime_mode.enabled', '强制允许', 'Force allow');
    }
    if (mode === 'disabled') {
      return tx('plugins.permissions_ui.runtime_mode.disabled', '强制关闭', 'Force disable');
    }
    return tx('plugins.permissions_ui.runtime_mode.inherit', '跟随默认', 'Follow default');
  }, [tx]);
  const permissionRows = permissionMatrix?.rows || [];
  const baselinePermissions = permissionMatrix?.baseline_permissions || [];
  const uniqueHostFunctionCount = React.useMemo(() => {
    return new Set(
      permissionRows.flatMap((row) => getPermissionRowHostFunctions(row).map((hostFn) => `${hostFn.module}:${hostFn.name}`)),
    ).size;
  }, [permissionRows]);
  const probeOptions = React.useMemo(() => {
    const keys = permissionRows
      .map((row) => row.permission_key)
      .filter(Boolean);
    return Array.from(new Set(keys));
  }, [permissionRows]);
  const filteredPermissionRows = React.useMemo(() => {
    return permissionRows.filter((row) => {
      if (permissionFilter === 'requested') return row.requested;
      if (permissionFilter === 'effective') return row.effective;
      if (permissionFilter === 'blocked_policy') return row.requested && !row.effective && row.decision_reason === 'blocked_by_policy';
      if (permissionFilter === 'blocked_sandbox') {
        return row.forced_by_sandbox || row.decision_reason === 'blocked_by_forced_sandbox' || row.decision_reason === 'blocked_by_force_sandbox';
      }
      if (permissionFilter === 'unknown') return !row.registered || row.decision_reason === 'unknown_permission';
      return true;
    });
  }, [permissionFilter, permissionRows]);
  const governedActionDomainItems = React.useMemo<GovernedActionDomainViewItem[]>(() => {
    const items: GovernedActionDomainViewItem[] = [];
    permissionRows.forEach((row) => {
      const draftAllowed = policyDraftPermissions.includes(row.permission_key);
      getPermissionRowGovernedActionDomains(row).forEach((actionDomain) => {
        const key = String(actionDomain.action_domain || '').trim().toLowerCase();
        if (!key) {
          return;
        }
        const draftItem = actionDomainOverrideDrafts.find((item) => item.action_domain === key);
        const persistedMode = resolvePersistedActionDomainRuntimeMode(actionDomain);
        const draftMode = draftItem ? resolveActionDomainRuntimeMode(draftItem.runtime_enabled) : persistedMode;
        const persistedEffectiveEnabled = resolveGovernedActionDomainRuntimeEnabled(actionDomain);
        const draftEffectiveEnabled = !draftAllowed
          ? false
          : draftMode === 'inherit'
            ? persistedEffectiveEnabled
            : draftMode === 'enabled';
        items.push({
          action_domain: key,
          permission_key: row.permission_key,
          grant_status: actionDomain.grant_status,
          grant_source: actionDomain.grant_source,
          mirrored_from_legacy: actionDomain.mirrored_from_legacy,
          has_runtime_override: actionDomain.has_runtime_override,
          persisted_mode: persistedMode,
          draft_mode: draftMode,
          persisted_effective_enabled: persistedEffectiveEnabled,
          draft_effective_enabled: draftEffectiveEnabled,
          draft_allowed: draftAllowed,
          dirty: draftMode !== persistedMode,
        });
      });
    });
    return items.sort((a, b) => {
      const permissionCompare = a.permission_key.localeCompare(b.permission_key);
      if (permissionCompare !== 0) {
        return permissionCompare;
      }
      return a.action_domain.localeCompare(b.action_domain);
    });
  }, [actionDomainOverrideDrafts, permissionRows, policyDraftPermissions]);
  const governedActionDomainSummary = React.useMemo(() => {
    return {
      total: governedActionDomainItems.length,
      active: governedActionDomainItems.filter((item) => String(item.grant_status || '').toLowerCase() === 'active').length,
      explicitOverrides: governedActionDomainItems.filter((item) => item.has_runtime_override).length,
      inherited: governedActionDomainItems.filter((item) => item.draft_mode === 'inherit').length,
      dirty: governedActionDomainItems.filter((item) => item.dirty).length,
      effectiveEnabled: governedActionDomainItems.filter((item) => item.draft_effective_enabled).length,
    };
  }, [governedActionDomainItems]);
  const permissionConstraintItems = React.useMemo<PermissionConstraintViewItem[]>(() => {
    const forcedSandboxBlocked = permissionRows.filter((row) => row.forced_by_sandbox || row.decision_reason === 'blocked_by_force_sandbox' || row.decision_reason === 'blocked_by_forced_sandbox');
    const policyBlocked = permissionRows.filter((row) => row.requested && !row.effective && row.decision_reason === 'blocked_by_policy');
    const unregistered = permissionRows.filter((row) => !row.registered || row.decision_reason === 'unknown_permission');
    const parentPermissionOff = governedActionDomainItems.filter((item) => !item.draft_allowed);
    const inactiveGrants = governedActionDomainItems.filter((item) => String(item.grant_status || '').toLowerCase() !== 'active');
    const runtimeClosed = governedActionDomainItems.filter((item) => item.draft_allowed && !item.draft_effective_enabled);
    return [
      {
        key: 'parent_permission_off',
        title: t('plugins.permissions_ui.constraint.parent_permission_off.title', '功能组未放行'),
        count: parentPermissionOff.length,
        tone: 'border-amber-200 bg-amber-50 text-amber-900',
        detail: parentPermissionOff.length > 0
          ? parentPermissionOff.slice(0, 3).map((item) => item.action_domain).join('、')
          : t('plugins.permissions_ui.constraint.parent_permission_off.empty', '当前所有具体功能都已获得所属功能组放行。'),
        entries: parentPermissionOff.map((item) => `${item.action_domain} · ${translatePermissionKey(item.permission_key)}`),
      },
      {
        key: 'forced_sandbox',
        title: t('plugins.permissions_ui.constraint.forced_sandbox.title', '强制沙箱压制'),
        count: forcedSandboxBlocked.length,
        tone: 'border-amber-200 bg-amber-50 text-amber-900',
        detail: forcedSandboxBlocked.length > 0
          ? forcedSandboxBlocked.slice(0, 3).map((item) => translatePermissionKey(item.permission_key)).join('、')
          : t('plugins.permissions_ui.constraint.forced_sandbox.empty', '当前没有权限被强制沙箱压制。'),
        entries: forcedSandboxBlocked.map((item) => `${translatePermissionKey(item.permission_key)} · ${translateDecisionReason(item.decision_reason)}`),
      },
      {
        key: 'blocked_policy',
        title: t('plugins.permissions_ui.constraint.blocked_policy.title', '策略拒绝'),
        count: policyBlocked.length,
        tone: 'border-zinc-200 bg-zinc-50 text-zinc-700',
        detail: policyBlocked.length > 0
          ? policyBlocked.slice(0, 3).map((item) => translatePermissionKey(item.permission_key)).join('、')
          : t('plugins.permissions_ui.constraint.blocked_policy.empty', '当前没有权限因为策略拒绝而失效。'),
        entries: policyBlocked.map((item) => `${translatePermissionKey(item.permission_key)} · ${translateDecisionReason(item.decision_reason)}`),
      },
      {
        key: 'inactive_grants',
        title: t('plugins.permissions_ui.constraint.inactive_grants.title', '具体功能未授予'),
        count: inactiveGrants.length,
        tone: 'border-zinc-200 bg-zinc-50 text-zinc-700',
        detail: inactiveGrants.length > 0
          ? inactiveGrants.slice(0, 3).map((item) => item.action_domain).join('、')
          : t('plugins.permissions_ui.constraint.inactive_grants.empty', '当前具体功能都处于活动授予状态。'),
        entries: inactiveGrants.map((item) => `${item.action_domain} · ${translateGrantStatus(item.grant_status)}`),
      },
      {
        key: 'runtime_closed',
        title: t('plugins.permissions_ui.constraint.runtime_closed.title', '具体功能被关闭'),
        count: runtimeClosed.length,
        tone: 'border-zinc-200 bg-zinc-50 text-zinc-700',
        detail: runtimeClosed.length > 0
          ? runtimeClosed.slice(0, 3).map((item) => item.action_domain).join('、')
          : t('plugins.permissions_ui.constraint.runtime_closed.empty', '当前草稿中没有被关闭的活动具体功能。'),
        entries: runtimeClosed.map((item) => `${item.action_domain} · ${actionDomainRuntimeModeLabel(item.draft_mode)}`),
      },
      {
        key: 'unknown',
        title: t('plugins.permissions_ui.constraint.unknown.title', '未登记权限'),
        count: unregistered.length,
        tone: 'border-rose-200 bg-rose-50 text-rose-800',
        detail: unregistered.length > 0
          ? unregistered.slice(0, 3).map((item) => item.permission_key).join('、')
          : t('plugins.permissions_ui.constraint.unknown.empty', '当前没有未登记权限。'),
        entries: unregistered.map((item) => item.permission_key),
      },
    ];
  }, [actionDomainRuntimeModeLabel, governedActionDomainItems, permissionRows, t, translateDecisionReason, translateGrantStatus, translatePermissionKey]);
  const filteredPlugins = plugins.filter((item) => {
    const query = search.trim().toLowerCase();
    return !query || `${item.name} ${item.description || ''}`.toLowerCase().includes(query);
  });

  function safeJson(value: string, fallback: unknown) { try { return JSON.parse(value); } catch { return fallback; } }
  function addLog(message: string) { setActionLog((items) => [`${new Date().toLocaleTimeString()} ${message}`, ...items].slice(0, 10)); }
  function beginPanelAction(
    setState: React.Dispatch<React.SetStateAction<AsyncPanelState>>,
    label: string,
  ) {
    setState((current) => ({
      ...current,
      loadingAction: label,
      error: '',
    }));
  }
  function finishPanelAction(
    setState: React.Dispatch<React.SetStateAction<AsyncPanelState>>,
    label: string,
    success: boolean,
    message: string,
  ) {
    setState({
      loadingAction: '',
      error: success ? '' : message,
      lastAction: label,
      lastMessage: message,
      lastSuccess: success,
      lastAt: new Date().toISOString(),
    });
  }
  function resetFunctionState() {
    setFunctions([]);
    setFunctionsLoadedOnce(false);
    setFunctionName('');
    setParamInputValues([]);
    setParameterTypesJson('[]');
    setArgsJson('[]');
    setInvokeResult(null);
    setInvokeResultExpanded(false);
    setInvokeInputError('');
    setInvokeState(createAsyncPanelState());
    invokeAbortRef.current?.abort();
    invokeAbortRef.current = null;
  }
  function resetPermissionState() {
    setPermissionMatrix(null);
    setRequestedPermissions(null);
    setEffectivePermissions(null);
    setPolicy(null);
    setPolicyJson('{}');
    setPolicyJsonError('');
    setPolicyDraftPermissions([]);
    setActionDomainOverrideDrafts([]);
    setPolicyDraftDirty(false);
    setPermissionFilter('all');
    setPermissionWorkspaceMode('capabilities');
    setPermissionCapabilityView('functions');
    setExpandedPermissionKeys([]);
    setSelectedPermissionKey('');
    setSelectedActionDomainKey('');
    setSelectedConstraintKey('parent_permission_off');
    setSelectedDiagnosticsPanel('probe');
    setPermissionProbe('');
    setPermissionProbeResult(null);
    setIsAdvancedPolicyOpen(false);
    setPermissionsLoadedKey('');
    setPermissionsSnapshotStale(false);
    permissionsInFlightKeyRef.current = '';
    setPermissionsState(createAsyncPanelState());
  }
  function resetRuntimePreferencesState() {
    setRuntimePreferences(null);
    setRuntimeDefaults(null);
    setRuntimePreferenceDraft({ ...runtimePreferenceDraftDefault });
    setRuntimePreferencesState(createAsyncPanelState());
  }
  function requireVersion() {
    if (!selectedVersionId) throw new Error(t('plugins.ui_runtime.select_version_first', '请先选择版本'));
    return selectedVersionId;
  }
  function getSelectedVersionForAction(): VersionActionGuard {
    if (!selectedVersionId) {
      return { ok: false, versionId: 0, error: t('plugins.ui_runtime.select_version_first', '请先选择版本') };
    }
    if (!versions.some((item) => item.id === selectedVersionId)) {
      return {
        ok: false,
        versionId: selectedVersionId,
        error: t('plugins.ui_runtime.version_missing_sync', '当前版本 #{{versionId}} 已不在版本列表，请同步版本列表', { versionId: selectedVersionId }),
      };
    }
    return { ok: true, versionId: selectedVersionId, error: '' };
  }
  function isPermissionMatrix(value: unknown): value is PermissionMatrixResponse {
    if (!isRecord(value)) {
      return false;
    }
    const candidate = value as Record<string, unknown>;
    return Array.isArray(candidate.rows) && isRecord(candidate.context);
  }
  function resolvePolicyDraftActionDomainOverrides(nextPolicy: unknown, matrix?: PermissionMatrixResponse | null) {
    const record = isRecord(nextPolicy) ? nextPolicy : {};
    const fromMatrix = buildActionDomainOverrideDraftsFromMatrix(matrix);
    if (fromMatrix.length > 0) {
      return fromMatrix;
    }
    return normalizeActionDomainOverrideDrafts(record.action_domain_overrides);
  }
  function buildPolicyDraftDocument(basePolicy: Record<string, unknown>, nextAllowed: string[], nextActionDomainOverrides: ActionDomainOverrideDraft[]) {
    return {
      ...basePolicy,
      allowed_permissions: [...nextAllowed],
      action_domain_overrides: serializeActionDomainOverrideDrafts(nextActionDomainOverrides),
    };
  }
  function updatePolicyJsonDraft(nextAllowed = policyDraftPermissions, nextActionDomainOverrides = actionDomainOverrideDrafts) {
    try {
      const nextPolicy = parseObjectJson(policyJson, t('plugins.permissions.policy_raw', '策略 JSON'));
      setPolicyJson(formatJson(buildPolicyDraftDocument(nextPolicy, nextAllowed, nextActionDomainOverrides)));
    } catch {
      // Keep manual JSON edits untouched until the admin resolves formatting.
    }
  }
  function syncPolicyDraft(nextPolicy: unknown, matrix?: PermissionMatrixResponse | null) {
    const record = isRecord(nextPolicy) ? nextPolicy : {};
    const nextAllowed = matrix?.configured_policy_allowed_permissions
      || (Array.isArray(record.allowed_permissions) ? record.allowed_permissions.map((item) => String(item)) : []);
    const nextActionDomainOverrides = resolvePolicyDraftActionDomainOverrides(nextPolicy, matrix);
    setPolicyDraftPermissions(nextAllowed);
    setActionDomainOverrideDrafts(nextActionDomainOverrides);
    setPolicyDraftDirty(false);
    setPolicyJson(formatJson(buildPolicyDraftDocument(record, nextAllowed, nextActionDomainOverrides)));
    setPolicyJsonError('');
    if (!permissionProbe && nextAllowed[0]) {
      setPermissionProbe(nextAllowed[0]);
    }
  }
  function toggleExpandedPermission(permissionKey: string) {
    setExpandedPermissionKeys((current) => (
      current.includes(permissionKey)
        ? current.filter((item) => item !== permissionKey)
        : [...current, permissionKey]
    ));
  }
  function openPermissionGovernance(permissionKey: string) {
    setPermissionWorkspaceMode('capabilities');
    setPermissionCapabilityView('groups');
    setSelectedPermissionKey(permissionKey);
    setPermissionFilter('all');
    setExpandedPermissionKeys((current) => (
      current.includes(permissionKey) ? current : [...current, permissionKey]
    ));
  }
  function openActionDomainGovernance(permissionKey: string, actionDomain: string) {
    setPermissionWorkspaceMode('capabilities');
    setPermissionCapabilityView('functions');
    setSelectedPermissionKey(permissionKey);
    setSelectedActionDomainKey(actionDomain);
    setExpandedPermissionKeys((current) => (
      current.includes(permissionKey) ? current : [...current, permissionKey]
    ));
  }
  function togglePolicyDraftPermission(permissionKey: string, enabled: boolean, _governedActionDomains: PermissionMatrixGovernedActionDomain[] = []) {
    const normalized = String(permissionKey || '').trim();
    const nextAllowed = enabled
      ? Array.from(new Set([...policyDraftPermissions, normalized]))
      : policyDraftPermissions.filter((item) => item !== normalized);
    const sortedAllowed = nextAllowed.sort((a, b) => a.localeCompare(b));
    setPolicyDraftPermissions(sortedAllowed);
    updatePolicyJsonDraft(sortedAllowed, actionDomainOverrideDrafts);
    setPolicyDraftDirty(true);
  }
  function toggleActionDomainRuntimeOverride(
    permissionKey: string,
    actionDomain: PermissionMatrixGovernedActionDomain,
    nextMode: ActionDomainRuntimeMode,
  ) {
    const key = String(actionDomain.action_domain || '').trim().toLowerCase();
    if (!key) {
      return;
    }
    const nextRuntimeEnabled = nextMode === 'inherit' ? undefined : nextMode === 'enabled';
    const nextActionDomainOverrides = sortActionDomainOverrideDrafts([
      ...actionDomainOverrideDrafts.filter((item) => item.action_domain !== key),
      {
        action_domain: key,
        runtime_enabled: nextRuntimeEnabled,
        top_permission_key: permissionKey,
        grant_status: actionDomain.grant_status,
        grant_source: actionDomain.grant_source,
        mirrored_from_legacy: actionDomain.mirrored_from_legacy,
        has_runtime_override: typeof nextRuntimeEnabled === 'boolean',
        effective_runtime_enabled: nextMode === 'inherit' ? resolveGovernedActionDomainRuntimeEnabled(actionDomain) : nextRuntimeEnabled,
      },
    ]);
    setActionDomainOverrideDrafts(nextActionDomainOverrides);
    updatePolicyJsonDraft(policyDraftPermissions, nextActionDomainOverrides);
    setPolicyDraftDirty(true);
  }
  function getCurrentConfiguredPolicyPermissions() {
    const record = isRecord(policy) ? policy : {};
    const source: string[] = permissionMatrix?.configured_policy_allowed_permissions
      ?? (Array.isArray(record.allowed_permissions) ? record.allowed_permissions.map((item) => String(item)) : []);
    return Array.from(new Set(source.map((item) => String(item).trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b));
  }
  function getCurrentConfiguredActionDomainOverrides() {
    return resolvePolicyDraftActionDomainOverrides(policy, permissionMatrix);
  }
  function revertPolicyDraft() {
    const currentAllowed = getCurrentConfiguredPolicyPermissions();
    const currentActionDomainOverrides = getCurrentConfiguredActionDomainOverrides();
    const nextPolicy = {
      ...(isRecord(policy) ? policy : {}),
      allowed_permissions: currentAllowed,
      action_domain_overrides: serializeActionDomainOverrideDrafts(currentActionDomainOverrides),
    };
    setPolicyDraftPermissions(currentAllowed);
    setActionDomainOverrideDrafts(currentActionDomainOverrides);
    setPolicyJson(formatJson(nextPolicy));
    setPolicyJsonError('');
    setPolicyDraftDirty(false);
    finishPanelAction(
      setPermissionsState,
      t('plugins.permissions.revert_changes', '撤销更改'),
      true,
      t('plugins.ui_runtime.reverted_permission_changes', '已撤销未保存的权限与动作域更改。'),
    );
  }
  function buildPolicyPayload(extra?: Record<string, unknown>) {
    const payload = parseObjectJson(policyJson, t('plugins.permissions.policy_raw', '策略 JSON'));
    payload.allowed_permissions = [...policyDraftPermissions];
    payload.action_domain_overrides = serializeActionDomainOverrideDrafts(actionDomainOverrideDrafts);
    return { ...payload, ...(extra || {}) };
  }
  function buildQuickPolicyPayload(extra?: Record<string, unknown>) {
    const record = isRecord(policy) ? policy : {};
    return {
      profile: typeof record.profile === 'string' ? record.profile : currentProfile,
      allowed_permissions: [...policyDraftPermissions],
      action_domain_overrides: serializeActionDomainOverrideDrafts(actionDomainOverrideDrafts),
      ...(isRecord(record.limits) ? { limits: record.limits } : {}),
      ...(typeof record.warm_instances === 'number' ? { warm_instances: record.warm_instances } : {}),
      enabled: typeof record.enabled === 'boolean' ? record.enabled : true,
      force_sandbox_mode: typeof record.force_sandbox_mode === 'boolean' ? record.force_sandbox_mode : forceSandbox,
      ...(typeof record.description === 'string' ? { description: record.description } : {}),
      ...(extra || {}),
    };
  }
  function resetVersionDraft(pluginId = selectedPluginId) {
    clearDraftFromStorage(pluginId);
    setNewVersion({ ...DEFAULT_VERSION_DRAFT });
    setPackageFile(null);
  }
  function sourceReasonLabel(reason?: string) {
    const normalized = String(reason || '').trim().toLowerCase();
    const labels: Record<string, string> = {
      encrypted_archive_missing: t('plugins.audit.source_reason.encrypted_archive_missing', '加密源码归档缺失'),
      encrypted_archive_unreadable: t('plugins.audit.source_reason.encrypted_archive_unreadable', '加密源码归档不可读或已损坏'),
      raw_source_missing: t('plugins.audit.source_reason.raw_source_missing', '原始源码缺失'),
      raw_source_unreadable: t('plugins.audit.source_reason.raw_source_unreadable', '原始源码不可读'),
      raw_fallback_requires_admin: t('plugins.audit.source_reason.raw_fallback_requires_admin', '仅能使用原始回退，需管理员权限'),
      legacy_record_incomplete: t('plugins.audit.source_reason.legacy_record_incomplete', '旧记录不完整'),
    };
    return labels[normalized] || normalized || t('common.unknown', '未知原因');
  }
  function applyPolicyResponse(nextPolicy: VersionPolicyResponse) {
    setPolicy(nextPolicy);
    const record = nextPolicy as VersionPolicyResponse & Record<string, unknown>;
    const nextConfiguredAllowed = Array.isArray(record.allowed_permissions)
      ? record.allowed_permissions.map((item) => String(item))
      : (Array.isArray(record.configured_policy_allowed_permissions) ? record.configured_policy_allowed_permissions.map((item) => String(item)) : []);
    const nextPolicyAllowed = Array.isArray(record.policy_allowed_permissions)
      ? record.policy_allowed_permissions.map((item) => String(item))
      : nextConfiguredAllowed;
    const nextEffective = Array.isArray(record.effective_permissions)
      ? record.effective_permissions.map((item) => String(item))
      : [];
    const nextContext = isRecord(record.permission_matrix_context)
      ? (record.permission_matrix_context as unknown as PermissionMatrixResponse['context'])
      : null;
    const nextSummary = isRecord(record.permission_matrix_summary)
      ? (record.permission_matrix_summary as unknown as PermissionMatrixResponse['summary'])
      : null;
    const nextGovernanceBridge = isRecord(record.permission_matrix_governance_bridge)
      ? (record.permission_matrix_governance_bridge as unknown as PermissionMatrixResponse['governance_bridge'])
      : null;
    const nextActionDomainOverrides = resolvePolicyDraftActionDomainOverrides(nextPolicy);

    if (nextConfiguredAllowed.length > 0 || Array.isArray(record.allowed_permissions) || Array.isArray(record.configured_policy_allowed_permissions) || Array.isArray(record.policy_allowed_permissions)) {
      setPolicyDraftPermissions(nextConfiguredAllowed);
    }
    if (nextActionDomainOverrides.length > 0 || Array.isArray(record.action_domain_overrides)) {
      setActionDomainOverrideDrafts(nextActionDomainOverrides);
    }
    setPolicyDraftDirty(false);
    setPolicyJson(formatJson(buildPolicyDraftDocument(record, nextConfiguredAllowed, nextActionDomainOverrides)));

    if (nextEffective.length > 0 || Array.isArray(record.effective_permissions)) {
      setEffectivePermissions({
        ...(effectivePermissions || {}),
        version_id: typeof record.version_id === 'number' ? record.version_id : (effectivePermissions?.version_id || 0),
        requested_permissions: Array.isArray(record.requested_permissions)
          ? record.requested_permissions.map((item) => String(item))
          : (effectivePermissions?.requested_permissions || []),
        requested_permissions_source: typeof record.requested_permissions_source === 'string'
          ? record.requested_permissions_source
          : (effectivePermissions?.requested_permissions_source || (typeof record.source === 'string' ? record.source : undefined)),
        requested_permissions_hash: typeof record.requested_permissions_hash === 'string'
          ? record.requested_permissions_hash
          : effectivePermissions?.requested_permissions_hash,
        baseline_permissions: Array.isArray(record.baseline_permissions)
          ? record.baseline_permissions.map((item) => String(item))
          : (effectivePermissions?.baseline_permissions || []),
        configured_policy_allowed_permissions: nextConfiguredAllowed,
        policy_allowed_permissions: nextPolicyAllowed,
        effective_permissions: nextEffective,
        force_sandbox_mode: Boolean(record.force_sandbox_mode ?? effectivePermissions?.force_sandbox_mode),
        profile: typeof record.profile === 'string' ? record.profile : (effectivePermissions?.profile || ''),
        executor_resolved: typeof record.executor_resolved === 'string' ? record.executor_resolved : (effectivePermissions?.executor_resolved || ''),
        source: typeof record.source === 'string' ? record.source : effectivePermissions?.source,
        permission_matrix_summary: nextSummary || effectivePermissions?.permission_matrix_summary,
        permission_matrix_context: nextContext || effectivePermissions?.permission_matrix_context,
        permission_matrix_governance_bridge: nextGovernanceBridge || effectivePermissions?.permission_matrix_governance_bridge,
      });
    }

    setPermissionMatrix((current) => {
      if (!current && !nextContext) {
        return current;
      }
      const currentContext = current?.context;
      const mergedContext = nextContext || (currentContext ? {
        ...currentContext,
        enabled: typeof record.enabled === 'boolean' ? record.enabled : currentContext.enabled,
        configured_profile: typeof record.profile === 'string' ? record.profile : currentContext.configured_profile,
        profile: typeof record.profile === 'string' ? record.profile : currentContext.profile,
        configured_force_sandbox_mode: typeof record.force_sandbox_mode === 'boolean' ? record.force_sandbox_mode : currentContext.configured_force_sandbox_mode,
        force_sandbox_mode: typeof record.force_sandbox_mode === 'boolean' ? record.force_sandbox_mode : currentContext.force_sandbox_mode,
        executor_resolved: typeof record.executor_resolved === 'string' ? record.executor_resolved : currentContext.executor_resolved,
      } : null);
      if (!mergedContext) {
        return current;
      }
      return normalizePermissionMatrixResponse({
        context: mergedContext,
        summary: nextSummary || current?.summary || {
          requested_count: 0,
          configured_policy_allowed_count: nextConfiguredAllowed.length,
          policy_allowed_count: nextPolicyAllowed.length,
          effective_count: nextEffective.length,
          denied_count: 0,
          unknown_count: 0,
        },
        governance_bridge: nextGovernanceBridge || current?.governance_bridge,
        rows: current?.rows || [],
        requested_permissions: current?.requested_permissions || [],
        requested_permissions_source: current?.requested_permissions_source,
        requested_permissions_hash: current?.requested_permissions_hash,
        configured_policy_allowed_permissions: nextConfiguredAllowed,
        policy_allowed_permissions: nextPolicyAllowed,
        effective_permissions: nextEffective.length > 0 ? nextEffective : (current?.effective_permissions || []),
      });
    });
  }
  function applyRuntimePreferencesResponse(nextPreferences: VersionRuntimePreferences | null) {
    if (!nextPreferences) {
      return;
    }
    setRuntimePreferences(nextPreferences);
    if (nextPreferences.global_defaults) {
      setRuntimeDefaults(nextPreferences.global_defaults);
    }
    setRuntimePreferenceDraft({
      invoke_load_policy: normalizeInvokeLoadPolicy(nextPreferences.invoke_load_policy) || '',
      default_load_mode: normalizeRuntimeLoadMode(nextPreferences.default_load_mode) || '',
    });

    const snapshotPatch: VersionStatusSnapshot = {
      ...(nextPreferences.status_snapshot || {}),
      invoke_load_policy: nextPreferences.effective_invoke_load_policy
        || nextPreferences.status_snapshot?.invoke_load_policy,
      last_load_mode_requested: normalizeRuntimeLoadMode(nextPreferences.effective_requested_load_mode)
        || nextPreferences.status_snapshot?.last_load_mode_requested,
      last_load_mode_resolved: normalizeRuntimeLoadMode(nextPreferences.effective_resolved_load_mode)
        || nextPreferences.status_snapshot?.last_load_mode_resolved,
    };
    mergeVersionSnapshot(nextPreferences.version_id, snapshotPatch);

    setVersions((items) => items.map((item) => {
      if (item.id !== nextPreferences.version_id) {
        return item;
      }
      return {
        ...item,
        load_mode: nextPreferences.default_load_mode ?? item.load_mode,
        status_snapshot: {
          ...(item.status_snapshot || {}),
          ...snapshotPatch,
        },
      };
    }));
    setVersionDetails((current) => {
      if (!current || current.id !== nextPreferences.version_id) {
        return current;
      }
      return {
        ...current,
        load_mode: nextPreferences.default_load_mode ?? current.load_mode,
        status_snapshot: {
          ...(current.status_snapshot || {}),
          ...snapshotPatch,
        },
      };
    });
  }
  function toggleBatchPlugin(pluginId: number, checked: boolean) {
    setBatchSelectedPluginIds((current) => (
      checked
        ? Array.from(new Set([...current, pluginId]))
        : current.filter((item) => item !== pluginId)
    ));
  }

  const loadCurrentUser = React.useCallback(async () => { try { const me = await authService.getMe(); setCurrentUserId(Number(me.id || me.user_id || 0)); } catch { setCurrentUserId(0); } }, []);
  const refreshRuntimeMetrics = React.useCallback(async () => { try { const data = await pluginService.getRuntimeMetrics(); setRuntimeMetrics(data as Record<string, unknown>); } catch (err) { setRuntimeMetrics({ error: toErrorMessage(err) }); } }, []);
  const loadUsage = React.useCallback(async (pluginId?: number | null, versionId?: number | null) => {
    const requestId = ++usageRequestRef.current;
    const nextPluginUsage = pluginId
      ? await pluginService.getPluginUsage(pluginId).catch((err) => ({ error: toErrorMessage(err) }))
      : null;
    const nextVersionUsage = versionId
      ? await pluginService.getVersionUsage(versionId).catch((err) => ({ error: toErrorMessage(err) }))
      : null;
    if (requestId !== usageRequestRef.current) return;
    setPluginUsage(nextPluginUsage as UsageSummary | null);
    setVersionUsage(nextVersionUsage as UsageSummary | null);
  }, []);
  const loadReviews = React.useCallback(async (versionId?: number | null) => {
    const requestId = ++reviewsRequestRef.current;
    try {
      const [reviewResp, pendingResp] = await Promise.all([pluginService.listReviews({ resource_type: 'plugin_version', page: 1, page_size: 20 }), pluginService.getPendingReviewCount()]);
      if (requestId !== reviewsRequestRef.current) return;
      setPendingReviewCount(Number(pendingResp.count || 0));
      setReviews(versionId ? reviewResp.items.filter((item) => Number(item.version_id || item.resource_id) === Number(versionId)) : reviewResp.items);
    } catch (err) {
      if (requestId !== reviewsRequestRef.current) return;
      setPendingReviewCount(0);
      setReviews(versionId ? [{ id: -1, resource_type: 'plugin_version', resource_id: Number(versionId), submitter_id: 0, status: 'load_failed', error: toErrorMessage(err) } as ReviewItem] : []);
    }
  }, []);
  const loadPlugins = React.useCallback(async (options?: { silent?: boolean; source?: 'auto' | 'manual' }) => {
    const requestId = ++pluginsRequestRef.current;
    const label = options?.source === 'auto'
      ? t('plugins.runtime.auto_refresh_plugin_list', '自动刷新插件列表')
      : t('plugins.runtime.refresh_plugin_list', '刷新插件列表');
    if (!options?.silent) {
      beginPanelAction(setSidebarState, label);
    }
    let result: Awaited<ReturnType<typeof pluginService.getPlugins>>;
    try {
      result = await pluginService.getPlugins(1, 100);
    } catch (err) {
      if (!options?.silent) {
        const message = `${label}${t('plugins.runtime.action_failed_suffix', '失败')}：${toErrorMessage(err)}`;
        finishPanelAction(setSidebarState, label, false, message);
        addLog(message);
      }
      return null;
    }
    if (requestId !== pluginsRequestRef.current) return;
    const list = sortPlugins(result.items);
    setPlugins(list);
    setPluginTotal(Number(result.meta?.total || list.length));
    setSelectedPluginId((current) => (current && list.some((item) => item.id === current) ? current : list[0]?.id ?? null));
    void refreshRuntimeMetrics();
    if (!options?.silent) {
      if (options?.source === 'auto') {
        setSidebarState((current) => ({ ...current, loadingAction: '', error: '' }));
      } else {
        finishPanelAction(setSidebarState, label, true, t('plugins.runtime.plugin_list_refreshed', '已刷新 {{count}} 个插件', { count: list.length }));
        addLog(`${label} ${t('plugins.runtime.action_success_short', '成功')}`);
      }
    }
    return result;
  }, [refreshRuntimeMetrics]);
  const loadVersions = React.useCallback(async (
    pluginId: number,
    options?: { silent?: boolean; preserveVersionActionState?: boolean; source?: 'auto' | 'manual' },
  ) => {
    const requestId = ++versionsRequestRef.current;
    const label = options?.source === 'auto'
      ? t('plugins.runtime.sync_plugin_versions', '同步插件版本')
      : t('plugins.runtime.read_version_list', '读取版本列表');
    if (!options?.silent) {
      beginPanelAction(setContextState, label);
    }
    let result: Awaited<ReturnType<typeof pluginService.getVersions>>;
    try {
      result = await pluginService.getVersions(pluginId);
    } catch (err) {
      if (!options?.silent) {
        const message = `${label}${t('plugins.runtime.action_failed_suffix', '失败')}：${toErrorMessage(err)}`;
        finishPanelAction(setContextState, label, false, message);
        addLog(message);
        setVersions([]);
        setStatusByVersion({});
        setSelectedVersionId(null);
      }
      return null;
    }
    if (requestId !== versionsRequestRef.current) return;
    const list = sortVersions(result);
    setVersions(list);
    setStatusByVersion(Object.fromEntries(list.map((item) => [item.id, buildStatusSnapshot(item).runtime_status || 'unknown'])));
    setSelectedVersionId((current) => (current && list.some((item) => item.id === current) ? current : list[0]?.id ?? null));
    resetFunctionState();
    setVersionDetails(null); setConversionInfo(null); setSourceAudit(null); setPoolMetrics(null); setDiagnosticResult(null);
    setAuditState(createAsyncPanelState());
    setSnapshotState(createAsyncPanelState());
    if (!options?.preserveVersionActionState) {
      setVersionActionState(createAsyncPanelState());
    }
    resetPermissionState();
    resetRuntimePreferencesState();
    if (!options?.silent) {
      if (options?.source === 'auto') {
        setContextState((current) => ({ ...current, loadingAction: '', error: '' }));
      } else {
        finishPanelAction(setContextState, label, true, t('plugins.runtime.version_list_loaded', '已读取插件 #{{pluginId}} 的 {{count}} 个版本', { pluginId, count: list.length }));
        addLog(`${label} ${t('plugins.runtime.action_success_short', '成功')}`);
      }
    }
    return result;
  }, []);
  const refreshSnapshot = React.useCallback(async (
    versionId = selectedVersionId,
    options?: { silent?: boolean; label?: string },
  ) => {
    if (!versionId) {
      setVersionDetails(null);
      setConversionInfo(null);
      setReviews([]);
      resetFunctionState();
      setSnapshotState(createAsyncPanelState());
      return null;
    }

    const requestId = ++snapshotRequestRef.current;
    const label = options?.label || t('plugins.runtime.refresh_version_snapshot', '刷新版本快照');
    if (!options?.silent) {
      beginPanelAction(setSnapshotState, label);
    }

    try {
      const version = await pluginService.getVersion(versionId);
      if (requestId !== snapshotRequestRef.current) return null;
      setVersionDetails(version);
      mergeVersionRecord(version);
      void loadUsage(version.plugin_id, versionId);
      void loadReviews(versionId);

      let statusResult: VersionStatusResponse = { version_id: versionId, status: 'unknown' };
      try {
        statusResult = await pluginService.getStatus(versionId);
        if (requestId !== snapshotRequestRef.current) return null;
        if (statusResult.status_snapshot) {
          mergeVersionSnapshot(versionId, statusResult.status_snapshot);
        }
        setStatusByVersion((items) => ({ ...items, [versionId]: statusResult.status || 'unknown' }));
      } catch {
        if (requestId !== snapshotRequestRef.current) return null;
        setStatusByVersion((items) => ({ ...items, [versionId]: items[versionId] || 'unknown' }));
      }

      void refreshRuntimeMetrics();

      let conversion: unknown = null;
      try {
        conversion = await pluginService.getConversion(versionId);
      } catch (err) {
        conversion = { error: toErrorMessage(err) };
      }
      if (requestId !== snapshotRequestRef.current) return null;
      setConversionInfo(conversion);

      const result = { version, status: statusResult, conversion };
      setDetails(result);
      if (!options?.silent) {
        const message = t('plugins.runtime.version_snapshot_synced', '已同步版本 #{{versionId}} 的快照', { versionId });
        finishPanelAction(setSnapshotState, label, true, message);
        addLog(`${label} ${t('plugins.runtime.action_success_short', '成功')}`);
      }
      return result;
    } catch (err) {
      if (requestId !== snapshotRequestRef.current) return null;
      const message = `${label}${t('plugins.runtime.action_failed_suffix', '失败')}：${toErrorMessage(err)}`;
      if (!options?.silent) {
        finishPanelAction(setSnapshotState, label, false, message);
        addLog(message);
      }
      return null;
    }
  }, [loadReviews, loadUsage, mergeVersionRecord, mergeVersionSnapshot, refreshRuntimeMetrics, selectedVersionId]);
  const loadPermissions = React.useCallback(async (options?: { force?: boolean; source?: 'auto' | 'manual' }) => {
    const guard = getSelectedVersionForAction();
    if (!guard.ok) {
      const label = options?.source === 'auto' ? t('plugins.runtime.auto_load_permission_snapshot', '自动加载权限快照') : t('plugins.runtime.read_permission_snapshot', '读取权限快照');
      finishPanelAction(setPermissionsState, label, false, `${label}${t('plugins.runtime.action_failed_suffix', '失败')}：${guard.error}`);
      return null;
    }
    const versionId = guard.versionId;
    const requestKey = `${versionId}:${resolvedLocale}`;
    const source = options?.source || 'manual';
    const force = Boolean(options?.force);

    if (!force && permissionsLoadedKey === requestKey && permissionMatrix && !permissionsState.error) {
      return permissionMatrix;
    }
    if (!force && permissionsInFlightKeyRef.current === requestKey) {
      return null;
    }

    permissionsInFlightKeyRef.current = requestKey;
    const requestId = ++permissionsRequestRef.current;
    const label = source === 'manual' ? t('plugins.runtime.read_permission_snapshot', '读取权限快照') : t('plugins.runtime.auto_load_permission_snapshot', '自动加载权限快照');
    beginPanelAction(setPermissionsState, label);

    try {
      const [matrixResult, requested, effective, nextPolicy] = await Promise.all([
        pluginService.getPermissionMatrix(versionId).catch((err) => ({ endpoint: 'matrix', request_version_id: versionId, ...toErrorResult(err) })),
        pluginService.getRequestedPermissions(versionId).catch((err) => ({ endpoint: 'requested', request_version_id: versionId, ...toErrorResult(err) })),
        pluginService.getEffectivePermissions(versionId).catch((err) => ({ endpoint: 'effective', request_version_id: versionId, ...toErrorResult(err) })),
        pluginService.getPolicy(versionId).catch((err) => ({ endpoint: 'policy', request_version_id: versionId, ...toErrorResult(err) })),
      ]);

      if (requestId !== permissionsRequestRef.current) return null;

      const nextMatrix = isPermissionMatrix(matrixResult) ? normalizePermissionMatrixResponse(matrixResult) : null;
      const endpointResults = [
        { name: 'matrix', value: matrixResult },
        { name: 'requested', value: requested },
        { name: 'effective', value: effective },
        { name: 'policy', value: nextPolicy },
      ];
      const resultErrors = endpointResults
        .map((item) => {
          const message = extractResultError(item.value);
          return message ? `${item.name}：version_id=${versionId}，${message}` : '';
        })
        .filter(Boolean);
      const allFailed = resultErrors.length === 4;
      setPermissionsSnapshotStale(Boolean(!nextMatrix && permissionMatrix && resultErrors.length > 0));
      const nextEffective = extractResultError(effective) ? null : effective;
      if (nextMatrix) {
        setPermissionMatrix(nextMatrix);
      }
      setRequestedPermissions(requested);
      setEffectivePermissions(nextEffective);
      if (!extractResultError(nextPolicy)) {
        setPolicy(nextPolicy as VersionPolicyResponse);
        syncPolicyDraft(nextPolicy, nextMatrix || permissionMatrix);
      }
      if (!allFailed) {
        setPermissionsLoadedKey(requestKey);
      }

      if (nextMatrix?.rows?.length) {
        setPermissionProbe((current) => current || nextMatrix.rows[0]?.permission_key || '');
      }

      const result = { matrix: matrixResult, requested, effective, policy: nextPolicy };
      setDetails(result);
      if (source === 'manual') {
        const message = allFailed
          ? t('plugins.runtime.read_permission_snapshot_failed', '读取权限快照失败：{{reason}}', { reason: resultErrors[0] || t('plugins.runtime.all_permission_endpoints_failed', '所有权限接口均失败') })
          : (resultErrors.length > 0
            ? t('plugins.runtime.permission_snapshot_partial', '权限快照已部分刷新：{{reason}}', { reason: resultErrors.join('；') })
            : t('plugins.runtime.permission_snapshot_loaded', '已刷新版本 #{{versionId}} 的权限快照', { versionId }));
        finishPanelAction(setPermissionsState, label, !allFailed, message);
        addLog(allFailed ? message : `${label} ${t('plugins.runtime.action_success_short', '成功')}`);
      } else {
        setPermissionsState((current) => ({
          ...current,
          loadingAction: '',
          error: allFailed ? t('plugins.runtime.auto_permission_snapshot_failed', '自动加载权限快照失败：{{reason}}', { reason: resultErrors[0] || t('plugins.runtime.all_permission_endpoints_failed', '所有权限接口均失败') }) : '',
        }));
      }
      return result;
    } catch (err) {
      if (requestId !== permissionsRequestRef.current) return null;
      const message = `${label}${t('plugins.runtime.action_failed_suffix', '失败')}：${toErrorMessage(err)}`;
      finishPanelAction(setPermissionsState, label, false, message);
      addLog(message);
      return null;
    } finally {
      if (requestId === permissionsRequestRef.current) {
        permissionsInFlightKeyRef.current = '';
      }
    }
  }, [permissionMatrix, permissionsLoadedKey, permissionsState.error, resolvedLocale, selectedVersionId, versions]);
  const loadRuntimePreferences = React.useCallback(async (
    versionId = selectedVersionId,
    options?: { silent?: boolean; source?: 'auto' | 'manual' },
  ) => {
    if (!versionId) {
      resetRuntimePreferencesState();
      return null;
    }
    const source = options?.source || 'auto';
    if (runtimePreferencesEndpointMissing && source !== 'manual') {
      return null;
    }

    const requestId = ++runtimePreferencesRequestRef.current;
    const label = source === 'manual' ? t('plugins.runtime.read_runtime_preferences', '读取运行偏好') : t('plugins.runtime.auto_sync_runtime_preferences', '自动同步运行偏好');
    if (!options?.silent) {
      beginPanelAction(setRuntimePreferencesState, label);
    }

    try {
      const preferences = await pluginService.getVersionRuntimePreferences(versionId);
      if (requestId !== runtimePreferencesRequestRef.current) {
        return null;
      }
      setRuntimePreferencesEndpointMissing(false);
      applyRuntimePreferencesResponse(preferences);
      setDetails(preferences);
      if (!options?.silent) {
        finishPanelAction(setRuntimePreferencesState, label, true, t('plugins.runtime.runtime_preferences_loaded', '已读取版本 #{{versionId}} 的运行偏好', { versionId }));
        addLog(`${label} ${t('plugins.runtime.action_success_short', '成功')}`);
      } else {
        setRuntimePreferencesState((current) => ({ ...current, loadingAction: '', error: '' }));
      }
      return preferences;
    } catch (err) {
      if (requestId !== runtimePreferencesRequestRef.current) {
        return null;
      }
      if (isHttpStatusError(err, 404)) {
        const message = t('plugins.runtime.runtime_preferences_unavailable', '运行偏好接口暂不可用：当前后端服务未升级或未重启，请重建并重启 server.exe 后再同步。');
        setRuntimePreferencesEndpointMissing(true);
        if (!options?.silent) {
          finishPanelAction(setRuntimePreferencesState, label, false, message);
          addLog(message);
        } else {
          setRuntimePreferencesState((current) => ({ ...current, loadingAction: '', error: message }));
        }
        return null;
      }
      const message = `${label}${t('plugins.runtime.action_failed_suffix', '失败')}：${toErrorMessage(err)}`;
      if (!options?.silent) {
        finishPanelAction(setRuntimePreferencesState, label, false, message);
        addLog(message);
      } else {
        setRuntimePreferencesState((current) => ({ ...current, loadingAction: '', error: message }));
      }
      return null;
    }
  }, [runtimePreferencesEndpointMissing, selectedVersionId]);

  React.useEffect(() => { void loadPlugins({ source: 'auto' }); void loadCurrentUser(); }, [loadCurrentUser, loadPlugins]);
  React.useEffect(() => {
    if (selectedPluginId) {
      void loadVersions(selectedPluginId, { source: 'auto' });
    } else {
      setVersions([]);
      setStatusByVersion({});
      setSelectedVersionId(null);
      setContextState(createAsyncPanelState());
    }
  }, [loadVersions, selectedPluginId]);
  React.useEffect(() => {
    permissionsRequestRef.current += 1;
    auditRequestRef.current += 1;
    diagnosticsRequestRef.current += 1;
    invokeRequestRef.current += 1;
    invokeAbortRef.current?.abort();
    invokeAbortRef.current = null;
    resetFunctionState();
    resetPermissionState();
    setVersionDetails((current) => (current && current.id === selectedVersionId ? current : null));
    setConversionInfo(null);
    setSourceAudit(null);
    setPoolMetrics(null);
    setDiagnosticResult(null);
    setInvokePermissionHint(null);
    setInvokeResultExpanded(false);
    setAuditState(createAsyncPanelState());
  }, [selectedVersionId]);
  React.useEffect(() => {
    draftPluginIdRef.current = selectedPluginId;
    if (!selectedPluginId) {
      setNewVersion({ ...DEFAULT_VERSION_DRAFT });
      setPackageFile(null);
      return;
    }
    setNewVersion(readDraftFromStorage(selectedPluginId));
    setPackageFile(null);
  }, [selectedPluginId]);
  React.useEffect(() => {
    if (!selectedPluginId || draftPluginIdRef.current !== selectedPluginId) {
      return;
    }
    persistDraftToStorage(selectedPluginId, newVersion);
  }, [newVersion, selectedPluginId]);
  React.useEffect(() => { if (selectedVersionId) void refreshSnapshot(selectedVersionId, { silent: true, label: '自动同步版本快照' }); }, [refreshSnapshot, selectedVersionId]);
  React.useEffect(() => {
    if (selectedVersionId) {
      void loadRuntimePreferences(selectedVersionId, { silent: true, source: 'auto' });
    } else {
      resetRuntimePreferencesState();
    }
  }, [loadRuntimePreferences, selectedVersionId]);
  React.useEffect(() => {
    if (!selectedVersionId) {
      setExecutionMode('wasm');
      return;
    }
    setExecutionMode(currentStatusSnapshot.last_load_mode_requested || runtimePreferences?.effective_requested_load_mode || currentVersion?.load_mode || 'wasm');
  }, [currentStatusSnapshot.last_load_mode_requested, currentVersion?.load_mode, runtimePreferences?.effective_requested_load_mode, selectedVersionId]);
  React.useEffect(() => { void loadUsage(selectedPluginId, selectedVersionId); void loadReviews(selectedVersionId); }, [loadReviews, loadUsage, selectedPluginId, selectedVersionId]);
  React.useEffect(() => { bodyScrollRef.current?.scrollTo({ top: 0, behavior: 'auto' }); }, [activeTab, selectedPluginId, selectedVersionId]);
  React.useEffect(() => {
    if (!isBatchMode) {
      setBatchSelectedPluginIds([]);
    }
  }, [isBatchMode]);
  React.useEffect(() => {
    setBatchSelectedPluginIds((current) => current.filter((pluginId) => plugins.some((item) => item.id === pluginId)));
  }, [plugins]);
  React.useEffect(() => {
    setExpandedPermissionKeys([]);
    setPermissionProbeResult(null);
    setPolicyDraftDirty(false);
    if (activeTab === 'permissions' && selectedVersionId) {
      void loadPermissions({ force: false, source: 'auto' });
    }
  }, [activeTab, loadPermissions, resolvedLocale, selectedVersionId]);

  async function createPlugin() {
    if (!newPlugin.name.trim()) {
      finishPanelAction(setSidebarState, t('plugins.runtime.create_plugin', '创建插件'), false, t('plugins.runtime.create_plugin_name_required', '创建插件失败：请先填写插件名称'));
      return;
    }
    beginPanelAction(setSidebarState, t('plugins.runtime.create_plugin', '创建插件'));
    const result = await pluginService.createPlugin({
      name: newPlugin.name.trim(),
      description: newPlugin.description.trim(),
    }).catch((err) => {
      const message = `${t('plugins.runtime.create_plugin', '创建插件')}${t('plugins.runtime.action_failed_suffix', '失败')}：${toErrorMessage(err)}`;
      finishPanelAction(setSidebarState, t('plugins.runtime.create_plugin', '创建插件'), false, message);
      addLog(message);
      return null;
    });
    if (!result) return;
    setDetails(result);
    setShowCreatePlugin(false);
    setNewPlugin({ name: '', description: '' });
    const refreshed = await loadPlugins({ silent: true });
    if (!refreshed) {
      const message = t('plugins.runtime.create_plugin_refresh_failed', '创建插件后刷新列表失败：插件列表刷新未完成');
      finishPanelAction(setSidebarState, t('plugins.runtime.create_plugin', '创建插件'), false, message);
      addLog(message);
      return;
    }
    if (typeof result.plugin_id === 'number') {
      setSelectedPluginId(result.plugin_id);
    }
    finishPanelAction(setSidebarState, t('plugins.runtime.create_plugin', '创建插件'), true, t('plugins.runtime.plugin_created', '已创建插件 {{name}}', { name: newPlugin.name.trim() }));
    addLog(`${t('plugins.runtime.create_plugin', '创建插件')} ${t('plugins.runtime.action_success_short', '成功')}`);
  }

  async function saveVersionDraftLocally() {
    if (!selectedPluginId) {
      finishPanelAction(setVersionActionState, t('plugins.runtime.save_version_draft', '保存版本草稿'), false, t('plugins.runtime.save_draft_plugin_required', '保存草稿失败：请先选择插件'));
      return;
    }
    if (!newVersion.version.trim()) {
      finishPanelAction(setVersionActionState, t('plugins.runtime.save_version_draft', '保存版本草稿'), false, t('plugins.runtime.save_draft_version_required', '保存草稿失败：请先填写版本号'));
      return;
    }
    persistDraftToStorage(selectedPluginId, newVersion);
    finishPanelAction(setVersionActionState, t('plugins.runtime.save_version_draft', '保存版本草稿'), true, t('plugins.runtime.version_draft_saved', '版本草稿 {{version}} 已保存在当前浏览器', { version: newVersion.version.trim() }));
    addLog(`${t('plugins.runtime.save_version_draft', '保存版本草稿')} ${t('plugins.runtime.action_success_short', '成功')}`);
  }

  async function uploadDraftVersion() {
    if (!selectedPluginId) {
      finishPanelAction(setVersionActionState, t('plugins.runtime.upload_create_version', '上传 ZIP 并创建版本'), false, t('plugins.runtime.upload_plugin_required', '上传失败：请先选择插件'));
      return;
    }
    if (!newVersion.version.trim()) {
      finishPanelAction(setVersionActionState, t('plugins.runtime.upload_create_version', '上传 ZIP 并创建版本'), false, t('plugins.runtime.upload_version_required', '上传失败：请先填写版本号'));
      return;
    }
    if (!packageFile) {
      finishPanelAction(setVersionActionState, t('plugins.runtime.upload_create_version', '上传 ZIP 并创建版本'), false, t('plugins.runtime.upload_package_required', '上传失败：请先选择 ZIP 包'));
      return;
    }
    beginPanelAction(setVersionActionState, t('plugins.runtime.upload_create_version', '上传 ZIP 并创建版本'));
    const result = await pluginService.uploadCreateVersion(
      selectedPluginId,
      {
        version: newVersion.version.trim(),
        source_type: newVersion.source_type,
        description: newVersion.description.trim(),
      },
      packageFile,
    ).catch((err) => {
      const message = `${t('plugins.runtime.upload_create_version', '上传 ZIP 并创建版本')}${t('plugins.runtime.action_failed_suffix', '失败')}：${toErrorMessage(err)}`;
      finishPanelAction(setVersionActionState, t('plugins.runtime.upload_create_version', '上传 ZIP 并创建版本'), false, message);
      addLog(message);
      return null;
    });
    if (!result) return;

    const versionId = Number(result.version_id || 0);
    setDetails(result);
    clearDraftFromStorage(selectedPluginId);
    setNewVersion({ ...DEFAULT_VERSION_DRAFT });
    setPackageFile(null);

    const refreshed = await loadVersions(selectedPluginId, { silent: true, preserveVersionActionState: true });
    if (versionId > 0) {
      setSelectedVersionId(versionId);
      await refreshSnapshot(versionId, { silent: true, label: t('plugins.runtime.sync_snapshot_after_upload', '上传创建后同步快照') });
    } else if (refreshed) {
      const latestVersion = sortVersions(refreshed)[0];
      if (latestVersion?.id) {
        setSelectedVersionId(latestVersion.id);
      }
    }
    finishPanelAction(setVersionActionState, t('plugins.runtime.upload_create_version', '上传 ZIP 并创建版本'), true, t('plugins.runtime.version_uploaded_created', '已创建版本 {{version}} 并完成 ZIP 上传', { version: newVersion.version.trim() }));
    addLog(`${t('plugins.runtime.upload_create_version', '上传 ZIP 并创建版本')} ${t('plugins.runtime.action_success_short', '成功')}`);
  }

  async function runVersionAction(action: 'install' | 'uninstall' | 'load' | 'unload' | 'status') {
    const versionId = requireVersion();
    const labelMap = {
      install: t('plugins.status_labels.install', '准备版本'),
      uninstall: t('plugins.status_labels.uninstall', '清理产物'),
      load: t('plugins.status_labels.load', '进入运行态'),
      unload: t('plugins.status_labels.unload', '退出运行态'),
      status: t('plugins.status_labels.status', '同步状态'),
    } as const;
    const label = labelMap[action];
    beginPanelAction(setVersionActionState, label);

    try {
      let result: VersionActionResponse | VersionStatusResponse;
      if (action === 'install') {
        result = await pluginService.installVersion(versionId);
      } else if (action === 'uninstall') {
        result = await pluginService.uninstallVersion(versionId);
      } else if (action === 'load') {
        result = await pluginService.loadVersion(versionId, { execution_mode: executionMode });
      } else if (action === 'unload') {
        result = await pluginService.unloadVersion(versionId);
      } else {
        result = await pluginService.getStatus(versionId);
      }

      const nextSnapshot = buildActionSnapshotPatch(
        composeCurrentVersion(selectedVersion, versionDetails),
        action,
        result,
        executionMode,
      );
      if (nextSnapshot) {
        mergeVersionSnapshot(versionId, nextSnapshot);
        if (nextSnapshot.runtime_status) {
          setStatusByVersion((items) => ({ ...items, [versionId]: String(nextSnapshot.runtime_status || 'unknown') }));
        }
      } else if (result?.status) {
        setStatusByVersion((items) => ({ ...items, [versionId]: String(result.status || 'unknown') }));
      }
      setDetails(result);

      const statusMessage = action === 'status' && result?.status
        ? t('plugins.runtime.current_version_status', '当前版本状态：{{status}}', { status: translateStatus(String(result.status)) })
        : t('plugins.runtime.version_action_completed', '已完成版本 #{{versionId}} 的{{label}}', { versionId, label });
      finishPanelAction(setVersionActionState, label, true, statusMessage);
      addLog(`${label} ${t('plugins.runtime.action_success_short', '成功')}`);
      void refreshSnapshot(versionId, { silent: true, label: t('plugins.runtime.sync_snapshot_after_action', '{{label}}后同步快照', { label }) });
    } catch (err) {
      const message = `${label}${t('plugins.runtime.action_failed_suffix', '失败')}：${toErrorMessage(err)}`;
      finishPanelAction(setVersionActionState, label, false, message);
      addLog(message);
      void refreshSnapshot(versionId, { silent: true, label: t('plugins.runtime.sync_snapshot_after_action_failed', '{{label}}失败后同步快照', { label }) });
    }
  }

  function applyFunctionExample(fn: FunctionInfo) {
    const specs = buildParamSpecs(fn);
    const nextTypes = specs.map((item) => item.type);
    const nextArgs = specs.map((item) => item.example);
    const nextInputs = specs.map((item) => {
      if (typeof item.example === 'string') return item.example;
      return JSON.stringify(item.example);
    });
    setFunctionName(fn.name);
    setParamInputValues(nextInputs);
    setParameterTypesJson(formatJson(nextTypes));
    setArgsJson(formatJson(nextArgs));
    setInvokeInputError('');
  }

  async function loadFunctions() {
    const guard = getSelectedVersionForAction();
    if (!guard.ok) {
      finishPanelAction(setInvokeState, t('plugins.invoke.read_functions', '读取函数列表'), false, `${t('plugins.invoke.read_functions_failed', '读取函数列表失败')}：${guard.error}`);
      return;
    }
    const versionId = guard.versionId;
    const requestId = ++functionsRequestRef.current;
    beginPanelAction(setInvokeState, t('plugins.invoke.read_functions', '读取函数列表'));
    const result = await pluginService.getFunctions(versionId).catch((err) => {
      const message = `${t('plugins.invoke.read_functions_failed', '读取函数列表失败')}：${toErrorMessage(err)}`;
      finishPanelAction(setInvokeState, t('plugins.invoke.read_functions', '读取函数列表'), false, message);
      addLog(message);
      return null;
    });
    if (!result) return;
    if (requestId !== functionsRequestRef.current) return;
    const list = [...(result.functions || [])].sort((a, b) => {
      const aOrder = Number((a as Record<string, unknown>).order ?? (a as Record<string, unknown>).index ?? (a as Record<string, unknown>).position);
      const bOrder = Number((b as Record<string, unknown>).order ?? (b as Record<string, unknown>).index ?? (b as Record<string, unknown>).position);
      const aHasOrder = Number.isFinite(aOrder);
      const bHasOrder = Number.isFinite(bOrder);
      if (aHasOrder && bHasOrder) return aOrder - bOrder;
      if (aHasOrder) return -1;
      if (bHasOrder) return 1;
      return a.name.localeCompare(b.name, 'zh-CN');
    });
    setFunctions(list);
    setFunctionsLoadedOnce(true);
    if (list[0]) {
      applyFunctionExample(list[0]);
    } else {
      setFunctionName('');
      setParamInputValues([]);
      setParameterTypesJson('[]');
      setArgsJson('[]');
    }
    setDetails(result);
    setInvokeInputError('');
    finishPanelAction(
      setInvokeState,
      t('plugins.invoke.read_functions', '读取函数列表'),
      true,
      list.length > 0
        ? t('plugins.invoke.functions_loaded', '已读取 {{count}} 个函数', { count: list.length })
        : t('plugins.invoke.no_exported_functions', '当前版本未导出函数'),
    );
    addLog(`${t('plugins.invoke.read_functions', '读取函数列表')} ${t('plugins.runtime.action_success_short', '成功')}`);
  }

  function updateParamInput(index: number, value: string) {
    const nextInputs = [...paramInputValues];
    nextInputs[index] = value;
    setParamInputValues(nextInputs);
    if (!selectedFunction) return;
    const specs = buildParamSpecs(selectedFunction);
    const nextTypes = specs.map((item) => item.type);
    setParameterTypesJson(formatJson(nextTypes));
    try {
      const nextArgs = specs.map((item, itemIndex) => parseParamValue(nextInputs[itemIndex] ?? '', item.type));
      setArgsJson(formatJson(nextArgs));
      setInvokeInputError('');
    } catch (err) {
      setInvokeInputError(`${t('plugins.invoke.param_example_parse_failed', '参数示例解析失败')}：${toErrorMessage(err)}`);
    }
  }

  async function invokeFunction() {
    const guard = getSelectedVersionForAction();
    if (!guard.ok) {
      finishPanelAction(setInvokeState, t('plugins.invoke.call_function', '调用函数'), false, `${t('plugins.invoke.call_failed', '调用失败')}：${guard.error}`);
      return;
    }
    const versionId = guard.versionId;
    if (!functionName) {
      finishPanelAction(setInvokeState, t('plugins.invoke.call_function', '调用函数'), false, t('plugins.invoke.function_required', '调用失败：请先选择函数'));
      return;
    }
    if (invokeBlockedByInstall) {
      finishPanelAction(setInvokeState, t('plugins.invoke.call_function', '调用函数'), false, t('plugins.invoke.version_not_prepared', '调用失败：当前版本尚未完成准备，请先回到状态总览执行“准备版本”'));
      return;
    }
    if (invokeRequiresManualLoad) {
      finishPanelAction(setInvokeState, t('plugins.invoke.call_function', '调用函数'), false, t('plugins.invoke.manual_load_required', '调用失败：当前版本使用显式加载策略，请先在状态总览中手动进入运行态'));
      return;
    }
    let parameterTypes: string[];
    let args: unknown[];
    try {
      parameterTypes = parseArrayJson(parameterTypesJson, t('plugins.invoke.parameter_types', '参数类型')).map((item) => String(item));
      args = parseArrayJson(argsJson, t('plugins.invoke.parameter_list', '参数列表'));
      const validationError = validateInvokeArgs(args, parameterTypes, paramSpecs);
      if (validationError) {
        throw new Error(validationError);
      }
      setInvokeInputError('');
    } catch (err) {
      const message = `${t('plugins.invoke.call_failed', '调用失败')}：${toErrorMessage(err)}`;
      setInvokeInputError(message);
      finishPanelAction(setInvokeState, t('plugins.invoke.call_function', '调用函数'), false, message);
      return;
    }
    const timeoutMs = Math.max(1000, Math.min(300000, Number(invokeTimeoutMs || 30000) || 30000));
    invokeAbortRef.current?.abort();
    const controller = new AbortController();
    invokeAbortRef.current = controller;
    const requestId = ++invokeRequestRef.current;
    setInvokeResultExpanded(false);
    beginPanelAction(setInvokeState, t('plugins.invoke.call_function', '调用函数'));
    const result = await pluginService.invokeFunction(versionId, functionName, args, parameterTypes, {
      timeoutMs,
      signal: controller.signal,
    }).catch((err) => {
      if (requestId !== invokeRequestRef.current) return null;
      const permissionHint = extractInvokePermissionHint(toErrorResult(err));
      setInvokePermissionHint(permissionHint);
      const message = `${t('plugins.invoke.call_function_failed', '调用函数失败')}：${toErrorMessage(err)}`;
      finishPanelAction(setInvokeState, t('plugins.invoke.call_function', '调用函数'), false, message);
      addLog(message);
      return null;
    });
    if (requestId !== invokeRequestRef.current) return;
    if (invokeAbortRef.current === controller) {
      invokeAbortRef.current = null;
    }
    if (!result) return;
    setInvokeResult(result);
    setDetails(result);
    const permissionHint = extractInvokePermissionHint(result);
    setInvokePermissionHint(permissionHint);
    if (permissionHint) {
      const message = t('plugins.invoke.permission_denied_result', '调用返回权限拒绝：{{permission}} 未放行，请前往“权限与隔离”检查策略与基础宿主权限', { permission: translatePermissionKey(permissionHint.permissionKey) });
      finishPanelAction(setInvokeState, t('plugins.invoke.call_function', '调用函数'), false, message);
      addLog(message);
      void loadPermissions({ force: true, source: 'auto' });
      return;
    }
    void loadUsage(selectedPluginId, versionId);
    void refreshRuntimeMetrics();
    void refreshSnapshot(versionId, { silent: true, label: t('plugins.invoke.sync_snapshot_after_call', '调用后同步快照') });
    finishPanelAction(setInvokeState, t('plugins.invoke.call_function', '调用函数'), true, t('plugins.invoke.function_call_completed', '已完成函数 {{name}} 的调用', { name: functionName }));
    addLog(`${t('plugins.invoke.call_function', '调用函数')} ${t('plugins.runtime.action_success_short', '成功')}`);
  }

  function cancelInvokeFunction() {
    if (!invokeAbortRef.current) {
      return;
    }
    invokeRequestRef.current += 1;
    invokeAbortRef.current.abort();
    invokeAbortRef.current = null;
    finishPanelAction(setInvokeState, t('plugins.invoke.call_function', '调用函数'), false, t('plugins.invoke.call_cancelled', '调用已取消'));
    addLog(`${t('plugins.invoke.call_function', '调用函数')} ${t('plugins.invoke.cancelled_short', '已取消')}`);
  }

  async function saveRuntimePreferences() {
    const versionId = requireVersion();
    beginPanelAction(setRuntimePreferencesState, t('plugins.runtime.save_runtime_preferences', '保存运行偏好'));
    const result = await pluginService.updateVersionRuntimePreferences(versionId, {
      invoke_load_policy: runtimePreferenceDraft.invoke_load_policy,
      default_load_mode: runtimePreferenceDraft.default_load_mode,
    }).catch((err) => {
      const message = `${t('plugins.runtime.save_runtime_preferences_failed', '保存运行偏好失败')}：${toErrorMessage(err)}`;
      finishPanelAction(setRuntimePreferencesState, t('plugins.runtime.save_runtime_preferences', '保存运行偏好'), false, message);
      addLog(message);
      return null;
    });
    if (!result) return;
    applyRuntimePreferencesResponse(result);
    setDetails(result);
    finishPanelAction(setRuntimePreferencesState, t('plugins.runtime.save_runtime_preferences', '保存运行偏好'), true, t('plugins.runtime.runtime_preferences_saved', '已保存版本 #{{versionId}} 的运行偏好', { versionId }));
    addLog(`${t('plugins.runtime.save_runtime_preferences', '保存运行偏好')} ${t('plugins.runtime.action_success_short', '成功')}`);
  }

  async function applyRuntimeDefaults() {
    beginPanelAction(setRuntimePreferencesState, t('plugins.runtime.update_runtime_defaults', '更新全局默认'));
    const invokeLoadPolicyDefault = normalizeInvokeLoadPolicy(runtimePreferenceDraft.invoke_load_policy)
      || normalizeInvokeLoadPolicy(runtimePreferences?.effective_invoke_load_policy)
      || 'explicit';
    const defaultLoadModeDefault = normalizeRuntimeLoadMode(runtimePreferenceDraft.default_load_mode)
      || normalizeRuntimeLoadMode(runtimePreferences?.effective_requested_load_mode)
      || 'wasm';
    const result = await pluginService.updatePluginRuntimeDefaults({
      invoke_load_policy_default: invokeLoadPolicyDefault,
      default_load_mode_default: defaultLoadModeDefault,
    }).catch((err) => {
      const message = `${t('plugins.runtime.update_runtime_defaults_failed', '更新全局默认失败')}：${toErrorMessage(err)}`;
      finishPanelAction(setRuntimePreferencesState, t('plugins.runtime.update_runtime_defaults', '更新全局默认'), false, message);
      addLog(message);
      return null;
    });
    if (!result) return;
    setRuntimeDefaults(result);
    if (selectedVersionId) {
      await loadRuntimePreferences(selectedVersionId, { silent: true, source: 'auto' });
    }
    setDetails(result);
    finishPanelAction(setRuntimePreferencesState, t('plugins.runtime.update_runtime_defaults', '更新全局默认'), true, t('plugins.runtime.runtime_defaults_updated', '已更新运行偏好的全局默认值'));
    addLog(`${t('plugins.runtime.update_runtime_defaults', '更新全局默认')} ${t('plugins.runtime.action_success_short', '成功')}`);
  }

  async function applyBatchRuntimePreferences() {
    if (batchSelectedPluginIds.length === 0) {
      finishPanelAction(setRuntimePreferencesState, t('plugins.runtime.batch_update_runtime_preferences', '批量更新运行偏好'), false, t('plugins.runtime.batch_update_plugin_required', '批量更新失败：请先在左侧插件列表勾选插件'));
      return;
    }
    beginPanelAction(setRuntimePreferencesState, t('plugins.runtime.batch_update_runtime_preferences', '批量更新运行偏好'));
    try {
      const versionLists = await Promise.all(
        batchSelectedPluginIds.map((pluginId) => pluginService.getVersions(pluginId)),
      );
      const versionIds: number[] = Array.from(new Set<number>(
        versionLists
          .flatMap((items) => items.map((item) => Number(item.id)))
          .filter((item): item is number => Number.isFinite(item) && item > 0),
      ));
      if (versionIds.length === 0) {
        finishPanelAction(setRuntimePreferencesState, t('plugins.runtime.batch_update_runtime_preferences', '批量更新运行偏好'), false, t('plugins.runtime.batch_update_no_versions', '批量更新失败：勾选插件下没有可更新的版本'));
        return;
      }
      const result = await pluginService.batchUpdateVersionRuntimePreferences({
        version_ids: versionIds,
        invoke_load_policy: runtimePreferenceDraft.invoke_load_policy,
        default_load_mode: runtimePreferenceDraft.default_load_mode,
      });
      const currentSnapshot = result.snapshots.find((item) => Number(item.version_id) === Number(selectedVersionId)) || null;
      if (currentSnapshot) {
        applyRuntimePreferencesResponse(currentSnapshot);
      }
      if (selectedPluginId && batchSelectedPluginIds.includes(selectedPluginId)) {
        void loadVersions(selectedPluginId, { silent: true, preserveVersionActionState: true, source: 'auto' });
      }
      setDetails(result);
      finishPanelAction(setRuntimePreferencesState, t('plugins.runtime.batch_update_runtime_preferences', '批量更新运行偏好'), true, t('plugins.runtime.batch_runtime_preferences_updated', '已更新 {{count}} 个版本的运行偏好', { count: result.updated_count }));
      addLog(`${t('plugins.runtime.batch_update_runtime_preferences', '批量更新运行偏好')} ${t('plugins.runtime.action_success_short', '成功')}`);
    } catch (err) {
      const message = `${t('plugins.runtime.batch_update_runtime_preferences_failed', '批量更新运行偏好失败')}：${toErrorMessage(err)}`;
      finishPanelAction(setRuntimePreferencesState, t('plugins.runtime.batch_update_runtime_preferences', '批量更新运行偏好'), false, message);
      addLog(message);
    }
  }

  async function savePolicy(options?: { advanced?: boolean }) {
    const guard = getSelectedVersionForAction();
    if (!guard.ok) {
      finishPanelAction(setPermissionsState, t('plugins.permissions.save_matrix', '保存权限策略'), false, `${t('plugins.permissions.save_policy_failed', '保存策略失败')}：${guard.error}`);
      return;
    }
    const versionId = guard.versionId;
    let payload: Record<string, unknown>;
    try {
      payload = options?.advanced ? buildPolicyPayload() : buildQuickPolicyPayload();
      setPolicyJsonError('');
    } catch (err) {
      const message = `${t('plugins.permissions.save_policy_failed', '保存策略失败')}：${toErrorMessage(err)}`;
      setPolicyJsonError(message);
      finishPanelAction(setPermissionsState, t('plugins.permissions.save_matrix', '保存权限策略'), false, message);
      return;
    }
    beginPanelAction(setPermissionsState, t('plugins.permissions.save_matrix', '保存权限策略'));
    const result = await pluginService.updatePolicy(versionId, payload).catch((err) => {
      const message = `${t('plugins.permissions.save_policy_failed', '保存策略失败')}：${toErrorMessage(err)}`;
      finishPanelAction(setPermissionsState, t('plugins.permissions.save_matrix', '保存权限策略'), false, message);
      addLog(message);
      return null;
    });
    if (!result) return;
    applyPolicyResponse(result);
    setDetails(result);
    void loadPermissions({ force: true, source: 'auto' });
    finishPanelAction(setPermissionsState, t('plugins.permissions.save_matrix', '保存权限策略'), true, t('plugins.permissions.policy_saved', '已保存版本 #{{versionId}} 的权限策略', { versionId }));
    addLog(`${t('plugins.permissions.save_matrix', '保存权限策略')} ${t('plugins.runtime.action_success_short', '成功')}`);
  }

  async function testPermission(targetPermission?: string) {
    const guard = getSelectedVersionForAction();
    if (!guard.ok) {
      finishPanelAction(setPermissionsState, t('plugins.permissions.quick_probe_title', '权限探针'), false, `${t('plugins.permissions.probe_failed', '权限探针测试失败')}：${guard.error}`);
      return;
    }
    const versionId = guard.versionId;
    const nextPermission = String(targetPermission || permissionProbe || '').trim();
    if (!nextPermission) {
      finishPanelAction(setPermissionsState, t('plugins.permissions.quick_probe_title', '权限探针'), false, t('plugins.permissions.probe_permission_required', '权限探针测试失败：请先选择权限键'));
      return;
    }
    setPermissionProbe(nextPermission);
    beginPanelAction(setPermissionsState, t('plugins.permissions.quick_probe_title', '权限探针'));
    const result = await pluginService.testPermission(versionId, nextPermission).catch((err) => {
      const message = `${t('plugins.permissions.probe_failed', '权限探针测试失败')}：${toErrorMessage(err)}`;
      finishPanelAction(setPermissionsState, t('plugins.permissions.quick_probe_title', '权限探针'), false, message);
      addLog(message);
      return null;
    });
    if (!result) return;
    setPermissionProbeResult(result);
    setDetails(result);
    finishPanelAction(setPermissionsState, t('plugins.permissions.quick_probe_title', '权限探针'), true, t('plugins.permissions.probe_returned', '权限 {{permission}} 已返回探针结果', { permission: nextPermission }));
    addLog(`${t('plugins.permissions.quick_probe_title', '权限探针')} ${t('plugins.runtime.action_success_short', '成功')}`);
  }
  async function loadSourceAndArtifact() {
    const actionLabel = t('plugins.audit_page.load_source_and_artifact', '读取源码与产物');
    const guard = getSelectedVersionForAction();
    if (!guard.ok) {
      finishPanelAction(setAuditState, actionLabel, false, `${t('plugins.audit_page.load_source_and_artifact_failed', '读取源码与产物失败')}：${guard.error}`);
      return;
    }
    const versionId = guard.versionId;
    const requestId = ++auditRequestRef.current;
    beginPanelAction(setAuditState, actionLabel);
    const [source, conversion] = await Promise.all([
      pluginService.getSource(versionId).catch((err) => ({ endpoint: 'source', request_version_id: versionId, ...toErrorResult(err) })),
      pluginService.getConversion(versionId).catch((err) => ({ endpoint: 'conversion', request_version_id: versionId, ...toErrorResult(err) })),
    ]);
    if (requestId !== auditRequestRef.current) return;
    const result = { source, conversion };
    setSourceAudit(source);
    setConversionInfo(conversion);
    setDetails(result);

    const sourceError = extractResultError(source);
    const conversionError = extractResultError(conversion);
    if (
      sourceError
      && conversionError
      && isRecord(source)
      && isRecord(conversion)
      && String((source as Record<string, unknown>).code || '') === 'version_not_found'
      && String((conversion as Record<string, unknown>).code || '') === 'version_not_found'
    ) {
      const message = t('plugins.audit_page.version_not_found_sync', '当前选择的版本记录不存在或已过期（version_id={{versionId}}），请同步版本列表', { versionId });
      finishPanelAction(setAuditState, actionLabel, false, message);
      addLog(message);
      return;
    }
    if (sourceError && conversionError) {
      const message = `${t('plugins.audit_page.load_source_and_artifact_failed', '读取源码与产物失败')}：${sourceError}`;
      finishPanelAction(setAuditState, actionLabel, false, message);
      addLog(message);
      return;
    }
    if (sourceError && !conversionError) {
      const message = t('plugins.audit_page.conversion_ok_source_limited', '已读取产物摘要，源码受限或缺失：{{error}}', { error: sourceError });
      finishPanelAction(setAuditState, actionLabel, true, message);
      addLog(message);
      return;
    }
    if (!sourceError && conversionError) {
      const message = t('plugins.audit_page.source_ok_conversion_failed', '已读取源码，产物摘要读取失败：{{error}}', { error: conversionError });
      finishPanelAction(setAuditState, actionLabel, true, message);
      addLog(message);
      return;
    }

    finishPanelAction(setAuditState, actionLabel, true, t('plugins.audit_page.load_source_and_artifact_done', '已读取版本 #{{versionId}} 的源码与产物摘要', { versionId }));
    addLog(`${actionLabel} ${t('plugins.runtime.action_success_short', '成功')}`);
  }

  async function loadDiagnostics() {
    const actionLabel = t('plugins.audit_page.load_diagnostics', '读取诊断信息');
    const guard = getSelectedVersionForAction();
    if (!guard.ok) {
      finishPanelAction(setAuditState, actionLabel, false, `${t('plugins.audit_page.load_diagnostics_failed', '读取诊断信息失败')}：${guard.error}`);
      return;
    }
    const versionId = guard.versionId;
    const requestId = ++diagnosticsRequestRef.current;
    beginPanelAction(setAuditState, actionLabel);
    const [status, runtime, allPools, versionUsageData, pluginUsageData] = await Promise.all([
      pluginService.getStatus(versionId).catch((err) => ({ endpoint: 'status', request_version_id: versionId, ...toErrorResult(err) })),
      pluginService.getRuntimeMetrics().catch((err) => ({ endpoint: 'runtime_metrics', request_version_id: versionId, ...toErrorResult(err) })),
      pluginService.getAllPoolMetrics().catch((err) => ({ endpoint: 'all_pools', request_version_id: versionId, ...toErrorResult(err) })),
      pluginService.getVersionUsage(versionId).catch((err) => ({ endpoint: 'version_usage', request_version_id: versionId, ...toErrorResult(err) })),
      selectedPluginId ? pluginService.getPluginUsage(selectedPluginId).catch((err) => ({ endpoint: 'plugin_usage', request_version_id: versionId, ...toErrorResult(err) })) : Promise.resolve({}),
    ]);
    if (requestId !== diagnosticsRequestRef.current) return;
    const result = { status, runtime, all_pools: allPools, version_usage: versionUsageData, plugin_usage: pluginUsageData };
    setDiagnosticResult(result);
    setPoolMetrics(allPools);
    setRuntimeMetrics(runtime as Record<string, unknown>);
    setDetails(result);

    const errors = [
      extractResultError(status),
      extractResultError(runtime),
      extractResultError(allPools),
      extractResultError(versionUsageData),
      extractResultError(pluginUsageData),
    ].filter(Boolean);
    if (errors.length > 0) {
      const message = `${t('plugins.audit_page.load_diagnostics_failed', '读取诊断信息失败')}：${errors[0]}`;
      finishPanelAction(setAuditState, actionLabel, false, message);
      addLog(message);
      return;
    }

    finishPanelAction(setAuditState, actionLabel, true, t('plugins.audit_page.load_diagnostics_done', '已读取版本 #{{versionId}} 的运行池与诊断信息', { versionId }));
    addLog(`${actionLabel} ${t('plugins.runtime.action_success_short', '成功')}`);
  }

  async function runAdminSandboxTest() {
    const actionLabel = t('plugins.audit_page.admin_sandbox_test', '管理员沙箱测试');
    const versionId = requireVersion();
    const targetFunction = functionName || functions[0]?.name;
    if (!targetFunction) {
      finishPanelAction(setAuditState, actionLabel, false, t('plugins.audit_page.admin_sandbox_test_functions_first', '管理员测试失败：请先在插件调用页读取函数列表'));
      return;
    }
    const parameterTypes = parseArrayJson(parameterTypesJson, t('plugins.invoke.parameter_types', '参数类型')).map((item) => String(item));
    const args = parseArrayJson(argsJson, t('plugins.invoke.parameter_list', '参数列表'));
    beginPanelAction(setAuditState, actionLabel);
    const result = await pluginService.adminTestInvoke(versionId, targetFunction, {
      parameter_types: parameterTypes,
      args,
      timeout_ms: Number(testInvokeConfig.timeout_ms || 5000),
      force_target: testInvokeConfig.force_target,
      force_profile: testInvokeConfig.force_profile,
      enable_trace: Boolean(testInvokeConfig.enable_trace),
    }).catch((err) => {
      const message = `${t('plugins.audit_page.admin_sandbox_test_failed', '管理员沙箱测试失败')}：${toErrorMessage(err)}`;
      finishPanelAction(setAuditState, actionLabel, false, message);
      addLog(message);
      return null;
    });
    if (!result) return;
    setDiagnosticResult(result);
    setDetails(result);
    finishPanelAction(setAuditState, actionLabel, true, t('plugins.audit_page.admin_sandbox_test_done', '已执行函数 {{name}} 的管理员沙箱测试', { name: targetFunction }));
    addLog(`${actionLabel} ${t('plugins.runtime.action_success_short', '成功')}`);
  }

  async function setPolicyEnabled(enabled: boolean) {
    const guard = getSelectedVersionForAction();
    const label = enabled ? t('plugins.permissions_page.resume_execution', '恢复执行') : t('plugins.permissions_page.disable_execution', '禁用执行');
    if (!guard.ok) {
      finishPanelAction(setPermissionsState, label, false, `${label}失败：${guard.error}`);
      return;
    }
    const versionId = guard.versionId;
    const payload = buildQuickPolicyPayload({
      enabled,
      force_sandbox_mode: enabled ? Boolean(currentPolicy.force_sandbox_mode ?? forceSandbox) : true,
      profile: (!enabled || Boolean(currentPolicy.force_sandbox_mode ?? forceSandbox) || currentTrustState !== 'trusted')
        ? 'sandbox'
        : (currentPolicy.profile || currentProfile),
    });
    beginPanelAction(setPermissionsState, label);
    const result = await pluginService.updatePolicy(versionId, payload).catch((err) => {
      const message = `${label}失败：${toErrorMessage(err)}`;
      finishPanelAction(setPermissionsState, label, false, message);
      addLog(message);
      return null;
    });
    if (!result) return;
    applyPolicyResponse(result);
    setDetails(result);
    void loadPermissions({ force: true, source: 'auto' });
    const successMessage = !enabled && isLoaded
      ? t('plugins.permissions_page.disable_execution_loaded_notice', '已禁止后续执行，但当前实例仍需手动退出运行态')
      : t('plugins.permissions_page.execution_switch_updated', '已更新版本 #{{versionId}} 的执行开关', { versionId });
    finishPanelAction(setPermissionsState, label, true, successMessage);
    addLog(`${label} 成功`);
  }

  async function disableSelectedPlugin() {
    const actionLabel = t('plugins.governance_page.disable_plugin', '禁用插件');
    if (!selectedPluginId) {
      finishPanelAction(setGovernanceState, actionLabel, false, t('plugins.governance_page.disable_plugin_select_first', '禁用插件失败：请先选择插件'));
      return;
    }
    beginPanelAction(setGovernanceState, actionLabel);
    const result = await pluginService.disablePlugin(selectedPluginId, governanceConfirm.trim()).catch((err) => {
      const message = `${t('plugins.governance_page.disable_plugin_failed', '禁用插件失败')}：${toErrorMessage(err)}`;
      finishPanelAction(setGovernanceState, actionLabel, false, message);
      addLog(message);
      return null;
    });
    if (!result) return;
    setDetails(result);
    await loadPlugins({ silent: true });
    if (selectedVersionId) {
      await refreshSnapshot(selectedVersionId, { silent: true, label: t('plugins.governance_page.disable_plugin_sync', '禁用插件后同步快照') });
    }
    finishPanelAction(setGovernanceState, actionLabel, true, t('plugins.governance_page.disable_plugin_done', '已禁用插件 #{{pluginId}}', { pluginId: selectedPluginId }));
    addLog(`${actionLabel} ${t('plugins.runtime.action_success_short', '成功')}`);
  }

  async function enableSelectedPlugin() {
    const actionLabel = t('plugins.governance_page.enable_plugin', '启用插件');
    if (!selectedPluginId) {
      finishPanelAction(setGovernanceState, actionLabel, false, t('plugins.governance_page.enable_plugin_select_first', '启用插件失败：请先选择插件'));
      return;
    }
    beginPanelAction(setGovernanceState, actionLabel);
    const result = await pluginService.enablePlugin(selectedPluginId).catch((err) => {
      const message = `${t('plugins.governance_page.enable_plugin_failed', '启用插件失败')}：${toErrorMessage(err)}`;
      finishPanelAction(setGovernanceState, actionLabel, false, message);
      addLog(message);
      return null;
    });
    if (!result) return;
    setDetails(result);
    await loadPlugins({ silent: true });
    if (selectedVersionId) {
      await refreshSnapshot(selectedVersionId, { silent: true, label: t('plugins.governance_page.enable_plugin_sync', '启用插件后同步快照') });
    }
    finishPanelAction(setGovernanceState, actionLabel, true, t('plugins.governance_page.enable_plugin_done', '已启用插件 #{{pluginId}}', { pluginId: selectedPluginId }));
    addLog(`${actionLabel} ${t('plugins.runtime.action_success_short', '成功')}`);
  }

  async function banSelectedVersion() {
    const actionLabel = t('plugins.governance_page.ban_version', '封禁版本');
    const versionId = requireVersion();
    beginPanelAction(setGovernanceState, actionLabel);
    const result = await pluginService.banVersion(versionId, governanceConfirm.trim()).catch((err) => {
      const message = `${t('plugins.governance_page.ban_version_failed', '封禁版本失败')}：${toErrorMessage(err)}`;
      finishPanelAction(setGovernanceState, actionLabel, false, message);
      addLog(message);
      return null;
    });
    if (!result) return;
    setDetails(result);
    await refreshSnapshot(versionId, { silent: true, label: t('plugins.governance_page.ban_version_sync', '封禁版本后同步快照') });
    finishPanelAction(setGovernanceState, actionLabel, true, t('plugins.governance_page.ban_version_done', '已封禁版本 #{{versionId}}', { versionId }));
    addLog(`${actionLabel} ${t('plugins.runtime.action_success_short', '成功')}`);
  }

  async function unbanSelectedVersion() {
    const actionLabel = t('plugins.governance_page.unban_version', '解封版本');
    const versionId = requireVersion();
    beginPanelAction(setGovernanceState, actionLabel);
    const result = await pluginService.unbanVersion(versionId, governanceConfirm.trim()).catch((err) => {
      const message = `${t('plugins.governance_page.unban_version_failed', '解封版本失败')}：${toErrorMessage(err)}`;
      finishPanelAction(setGovernanceState, actionLabel, false, message);
      addLog(message);
      return null;
    });
    if (!result) return;
    setDetails(result);
    await refreshSnapshot(versionId, { silent: true, label: t('plugins.governance_page.unban_version_sync', '解封版本后同步快照') });
    finishPanelAction(setGovernanceState, actionLabel, true, t('plugins.governance_page.unban_version_done', '已解封版本 #{{versionId}}', { versionId }));
    addLog(`${actionLabel} ${t('plugins.runtime.action_success_short', '成功')}`);
  }

  async function approveLatestReview() {
    const actionLabel = t('plugins.audit_page.approve_review', '审核通过');
    if (!latestReview) {
      finishPanelAction(setAuditState, actionLabel, false, t('plugins.audit_page.approve_review_missing', '审核通过失败：当前版本没有待处理审核记录'));
      return;
    }
    beginPanelAction(setAuditState, actionLabel);
    const result = await pluginService.approveReview(latestReview.id, {
      reviewer_id: currentUserId || 1,
      comment: governanceConfirm.trim() || t('plugins.audit_page.approve_review', '审核通过'),
    }).catch((err) => {
      const message = `${t('plugins.audit_page.approve_review_failed', '审核通过失败')}：${toErrorMessage(err)}`;
      finishPanelAction(setAuditState, actionLabel, false, message);
      addLog(message);
      return null;
    });
    if (!result) return;
    setDetails(result);
    if (selectedVersionId) {
      await refreshSnapshot(selectedVersionId, { silent: true, label: t('plugins.audit_page.approve_review_sync', '审核通过后同步快照') });
    }
    finishPanelAction(setAuditState, actionLabel, true, t('plugins.audit_page.approve_review_done', '已提交版本 #{{versionId}} 的审核通过结果', { versionId: selectedVersionId }));
    addLog(`${actionLabel} ${t('plugins.runtime.action_success_short', '成功')}`);
  }

  async function rejectLatestReview() {
    const actionLabel = t('plugins.audit_page.reject_review', '审核拒绝');
    if (!latestReview) {
      finishPanelAction(setAuditState, actionLabel, false, t('plugins.audit_page.reject_review_missing', '审核拒绝失败：当前版本没有待处理审核记录'));
      return;
    }
    beginPanelAction(setAuditState, actionLabel);
    const result = await pluginService.rejectReview(latestReview.id, {
      reviewer_id: currentUserId || 1,
      comment: governanceConfirm.trim() || t('plugins.audit_page.reject_review', '审核拒绝'),
    }).catch((err) => {
      const message = `${t('plugins.audit_page.reject_review_failed', '审核拒绝失败')}：${toErrorMessage(err)}`;
      finishPanelAction(setAuditState, actionLabel, false, message);
      addLog(message);
      return null;
    });
    if (!result) return;
    setDetails(result);
    if (selectedVersionId) {
      await refreshSnapshot(selectedVersionId, { silent: true, label: t('plugins.audit_page.reject_review_sync', '审核拒绝后同步快照') });
    }
    finishPanelAction(setAuditState, actionLabel, true, t('plugins.audit_page.reject_review_done', '已提交版本 #{{versionId}} 的审核拒绝结果', { versionId: selectedVersionId }));
    addLog(`${actionLabel} ${t('plugins.runtime.action_success_short', '成功')}`);
  }

  async function deleteSelectedVersion() {
    const actionLabel = t('plugins.governance_page.delete_version', '删除版本');
    const versionId = requireVersion();
    if (runtimeDeleteBlocked) {
      finishPanelAction(setGovernanceState, actionLabel, false, t('plugins.governance_page.delete_version_runtime_blocked', '删除版本失败：当前版本仍处于运行态，请先执行“退出运行态”'));
      return;
    }
    if (governanceConfirm.trim() !== String(versionId)) {
      finishPanelAction(setGovernanceState, actionLabel, false, t('plugins.governance_page.delete_version_confirm_id', '删除版本失败：请输入版本 ID {{versionId}} 进行确认', { versionId }));
      return;
    }
    if (!window.confirm(t('plugins.governance_page.delete_version_confirm_dialog', '确认删除版本 #{{versionId}} 吗？该操作会移除当前版本记录。', { versionId }))) return;
    beginPanelAction(setGovernanceState, actionLabel);
    const result = await pluginService.deleteVersion(versionId).catch((err) => {
      const message = `${t('plugins.governance_page.delete_version_failed', '删除版本失败')}：${toErrorMessage(err)}`;
      finishPanelAction(setGovernanceState, actionLabel, false, message);
      addLog(message);
      return null;
    });
    if (!result) return;
    setDetails(result);
    const currentIndex = versions.findIndex((item) => item.id === versionId);
    const nextSelection = versions[currentIndex + 1]?.id || versions[currentIndex - 1]?.id || null;
    setVersions((items) => items.filter((item) => item.id !== versionId));
    setStatusByVersion((items) => {
      const next = { ...items };
      delete next[versionId];
      return next;
    });
    setSelectedVersionId(nextSelection);
    if (!nextSelection) {
      setVersionDetails(null);
      setConversionInfo(null);
      setSourceAudit(null);
      setPoolMetrics(null);
      setDiagnosticResult(null);
      resetFunctionState();
      resetPermissionState();
    }
    setGovernanceConfirm('');
    finishPanelAction(setGovernanceState, actionLabel, true, t('plugins.governance_page.delete_version_done', '已删除版本 #{{versionId}}', { versionId }));
    addLog(`${actionLabel} ${t('plugins.runtime.action_success_short', '成功')}`);
    if (selectedPluginId) {
      void loadVersions(selectedPluginId, { silent: true });
    }
  }

  async function deleteSelectedPlugin() {
    const actionLabel = t('plugins.governance_page.soft_delete_plugin', '软删除插件');
    if (!selectedPluginId || !selectedPlugin) {
      finishPanelAction(setGovernanceState, actionLabel, false, t('plugins.governance_page.soft_delete_plugin_select_first', '删除插件失败：请先选择插件'));
      return;
    }
    if (governanceConfirm.trim() !== selectedPlugin.name) {
      finishPanelAction(setGovernanceState, actionLabel, false, t('plugins.governance_page.soft_delete_plugin_confirm_name', '删除插件失败：请输入插件名称 {{name}} 进行确认', { name: selectedPlugin.name }));
      return;
    }
    if (!window.confirm(t('plugins.governance_page.soft_delete_plugin_confirm_dialog', '确认软删除插件 {{name}} 吗？', { name: selectedPlugin.name }))) return;
    beginPanelAction(setGovernanceState, actionLabel);
    const result = await pluginService.softDeletePlugin(selectedPluginId).catch((err) => {
      const message = `${t('plugins.governance_page.soft_delete_plugin_failed', '软删除插件失败')}：${toErrorMessage(err)}`;
      finishPanelAction(setGovernanceState, actionLabel, false, message);
      addLog(message);
      return null;
    });
    if (!result) return;
    setDetails(result);
    await loadPlugins({ silent: true });
    setGovernanceConfirm('');
    finishPanelAction(setGovernanceState, actionLabel, true, t('plugins.governance_page.soft_delete_plugin_done', '已软删除插件 {{name}}', { name: selectedPlugin.name }));
    addLog(`${actionLabel} ${t('plugins.runtime.action_success_short', '成功')}`);
  }

  function renderStatusTab() {
    const versionActionBusy = Boolean(versionActionState.loadingAction || snapshotState.loadingAction);
    const runtimePreferencesBusy = Boolean(runtimePreferencesState.loadingAction);
    const invokePolicyValueSource = runtimePreferences?.value_source?.invoke_load_policy || 'system';
    const defaultLoadModeValueSource = runtimePreferences?.value_source?.default_load_mode || 'system';
    const currentGlobalDefaults = runtimePreferences?.global_defaults || runtimeDefaults;
    const selectedPluginBatchChecked = selectedPluginId ? batchSelectedPluginIds.includes(selectedPluginId) : false;

    return (
      <div className="space-y-6">
        <section className="rounded-xl border border-zinc-200 bg-white p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-zinc-900">{t('plugins.status_page.title', '版本与生命周期')}</h2>
              <p className="mt-1 text-sm text-zinc-500">{t('plugins.status_page.description', '本地草稿、上传创建、准备版本、进入运行态、退出运行态和状态同步都在这里处理。')}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={(event) => {
                  event.preventDefault();
                  setActiveTab('invoke');
                }}
                className="rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
              >
                {t('plugins.status_page.go_invoke', '进入插件调用')}
              </button>
              <button
                type="button"
                onClick={(event) => {
                  event.preventDefault();
                  setActiveTab('governance');
                }}
                className="rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
              >
                {t('plugins.status_page.go_governance', '进入治理管理')}
              </button>
            </div>
          </div>

          <PanelFeedback state={versionActionState} loadingLabel={t('plugins.status_page.loading_version_action', '正在执行版本动作')} />
          <PanelFeedback state={runtimePreferencesState} loadingLabel={t('plugins.status_page.loading_runtime_preferences', '正在处理运行偏好')} />

          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-lg bg-zinc-50 p-3">
              <div className="text-xs text-zinc-500">{t('plugins.status_page.plugin_id', '插件 ID')}</div>
              <div className="mt-1 text-base font-semibold text-zinc-900">#{selectedPluginId ?? '-'}</div>
            </div>
            <div className="rounded-lg bg-zinc-50 p-3">
              <div className="text-xs text-zinc-500">{t('plugins.status_page.version_id', '版本 ID')}</div>
              <div className="mt-1 text-base font-semibold text-zinc-900">#{selectedVersionId ?? '-'}</div>
            </div>
            <div className="rounded-lg bg-zinc-50 p-3">
              <div className="text-xs text-zinc-500">{t('plugins.status_page.version_call_count', '版本调用数')}</div>
              <div className="mt-1 text-base font-semibold text-zinc-900">{metric(versionUsage?.call_count)}</div>
            </div>
            <div className="rounded-lg bg-zinc-50 p-3">
              <div className="text-xs text-zinc-500">{t('plugins.status_page.version_error_count', '版本失败数')}</div>
              <div className="mt-1 text-base font-semibold text-zinc-900">{metric(versionUsage?.error_count)}</div>
            </div>
          </div>

          <div className="mt-5 grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-4">
              <div className="rounded-lg border border-zinc-200 p-4">
                <div className="mb-3">
                  <div className="text-sm font-semibold text-zinc-800">{t('plugins.status_page.new_version_draft', '新版本本地草稿')}</div>
                  <div className="mt-1 text-xs text-zinc-500">{t('plugins.status_page.new_version_draft_desc', '草稿按插件保存在当前浏览器；只有上传 ZIP 时才会真正创建版本记录。')}</div>
                </div>
                <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
                  <input
                    value={newVersion.version}
                    onChange={(event) => setNewVersion((current) => ({ ...current, version: event.target.value }))}
                    placeholder={t('plugins.status_page.version_placeholder', '版本号，例如 0.2.0')}
                    className="h-11 rounded-lg border border-zinc-200 px-3 text-sm outline-none focus:border-teal-500"
                  />
                  <select
                    value={newVersion.source_type}
                    onChange={(event) => setNewVersion((current) => ({ ...current, source_type: event.target.value }))}
                    className="h-11 rounded-lg border border-zinc-200 px-3 text-sm outline-none focus:border-teal-500"
                  >
                    {sourceTypes.map((item) => (
                      <option key={item} value={item}>
                        {modeLabel(item)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mt-3 flex gap-3">
                  <input
                    value={newVersion.description}
                    onChange={(event) => setNewVersion((current) => ({ ...current, description: event.target.value }))}
                    placeholder={t('plugins.status_page.version_description_placeholder', '版本描述')}
                    className="h-11 flex-1 rounded-lg border border-zinc-200 px-3 text-sm outline-none focus:border-teal-500"
                  />
                  <button
                    type="button"
                    onClick={() => void saveVersionDraftLocally()}
                    disabled={!selectedPluginId || versionActionBusy}
                    className="inline-flex h-11 items-center gap-2 rounded-lg border border-zinc-200 px-4 text-sm font-semibold text-zinc-700 disabled:cursor-not-allowed disabled:text-zinc-400"
                  >
                    <PackagePlus className="h-4 w-4" />
                    {t('plugins.status_page.save_draft', '保存草稿')}
                  </button>
                  <button
                    type="button"
                    onClick={() => resetVersionDraft()}
                    disabled={!selectedPluginId || versionActionBusy}
                    className="inline-flex h-11 items-center gap-2 rounded-lg bg-teal-700 px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-zinc-300"
                  >
                    {t('plugins.status_page.clear_draft', '清空草稿')}
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                {versions.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 p-6 text-sm text-zinc-500">{t('plugins.status_page.no_versions', '当前插件还没有版本。')}</div>
                ) : (
                  versions.map((version) => {
                    const isActive = version.id === selectedVersionId;
                    const snapshot = buildStatusSnapshot(version, statusByVersion[version.id]);
                    const lastFailedAction = failedLastAction(snapshot);
                    return (
                      <button
                        key={version.id}
                        type="button"
                        onClick={() => setSelectedVersionId(version.id)}
                        className={`w-full rounded-xl border p-4 text-left transition ${isActive ? 'border-teal-500 bg-teal-50' : 'border-zinc-200 bg-white hover:border-teal-300 hover:bg-zinc-50'}`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="text-lg font-semibold text-zinc-900">{version.version}</div>
                            <div className="mt-1 text-sm text-zinc-500">{modeLabel(version.source_type || version.language)}</div>
                          </div>
                          <div className="text-sm text-zinc-500">{t('plugins.status_page.version_id_short', '版本')} #{version.id}</div>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2 text-xs">
                          <span className={`rounded-full border px-2 py-1 ${statusTone(snapshot.package_status)}`}>{t('plugins.status_page.package_status', '包状态')}：{translateStatus(snapshot.package_status)}</span>
                          <span className={`rounded-full border px-2 py-1 ${statusTone(snapshot.install_status)}`}>{t('plugins.status_page.install_status', '准备状态')}：{translateStatus(snapshot.install_status)}</span>
                          <span className={`rounded-full border px-2 py-1 ${statusTone(snapshot.runtime_status)}`}>{t('plugins.status_page.runtime_status', '运行状态')}：{translateStatus(snapshot.runtime_status)}</span>
                          <span className={`rounded-full border px-2 py-1 ${statusTone(snapshot.invoke_load_policy)}`}>{t('plugins.status_page.invoke_policy', '调用策略')}：{loadPolicyLabel(snapshot.invoke_load_policy)}</span>
                          <span className="rounded-full border border-zinc-200 bg-white px-2 py-1 text-zinc-600">{t('plugins.status_page.load_mode_summary', '进入方式：请求 {{requested}} / 实际 {{resolved}}', { requested: modeLabel(snapshot.last_load_mode_requested || version.load_mode || 'wasm'), resolved: modeLabel(snapshot.last_load_mode_resolved || snapshot.last_load_mode_requested || version.load_mode || 'wasm') })}</span>
                          <span className={`rounded-full border px-2 py-1 ${statusTone(version.trust_state)}`}>{trustLabel(version.trust_state)}</span>
                          <span className={`rounded-full border px-2 py-1 ${statusTone(version.risk_level)}`}>{t('plugins.status_page.risk', '风险')}：{statusLabel(version.risk_level || 'pending')}</span>
                        </div>
                        {snapshot.last_load_trigger && (
                          <div className="mt-2 text-xs text-zinc-500">{t('plugins.status_page.last_load_trigger', '最近进入运行态')}：{loadTriggerLabel(snapshot.last_load_trigger)}</div>
                        )}
                        {lastFailedAction && (
                          <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                            {t('plugins.status_page.last_action', '最近动作')}：{lastFailedAction.name ? translateStatus(lastFailedAction.name) : t('plugins.status_labels.failed', '失败')} · {lastFailedAction.error || translateStatus(lastFailedAction.result)}
                            {lastFailedAction.at ? <div className="mt-1">{t('plugins.ui_runtime.time_label', '时间')}：{formatTime(lastFailedAction.at)}</div> : null}
                          </div>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-lg border border-zinc-200 p-4">
                <div className="mb-2 block text-sm font-medium text-zinc-700">{t('plugins.status.upload_prepare_chain_title', '上传创建与准备链')}</div>
                <div className="mb-3 text-xs text-zinc-500">{t('plugins.status.upload_prepare_chain_desc', '上传 ZIP 会按草稿原子创建新版本；准备版本只负责产物准备，不代表实例已进入运行态。')}</div>
                <div className="flex flex-col gap-3">
                  <input
                    type="file"
                    accept=".zip"
                    onChange={(event) => setPackageFile(event.target.files?.[0] || null)}
                    className="block w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-600 file:mr-3 file:rounded-md file:border-0 file:bg-zinc-100 file:px-3 file:py-2 file:text-sm"
                  />
                  {packageFile && (
                    <div className="rounded-lg bg-zinc-50 px-3 py-2 text-xs text-zinc-600">
                      {t('plugins.status.package_selected', '已选择')}：{packageFile.name} · {Math.max(1, Math.round(packageFile.size / 1024))} KB
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => void uploadDraftVersion()}
                    disabled={!selectedPluginId || !packageFile || versionActionBusy}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-teal-700 px-4 text-sm font-semibold text-teal-700 disabled:cursor-not-allowed disabled:border-zinc-200 disabled:text-zinc-400"
                    >
                      <Upload className="h-4 w-4" />
                      {versionActionState.loadingAction === t('plugins.runtime.upload_create_version', '上传 ZIP 并创建版本') ? t('plugins.status.upload_creating', '上传创建中...') : t('plugins.runtime.upload_create_version', '上传 ZIP 并创建版本')}
                    </button>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <button type="button" onClick={() => void runVersionAction('install')} disabled={!canInstall} className="rounded-lg bg-zinc-950 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-zinc-300">
                        {versionActionState.loadingAction === t('plugins.status_labels.install', '准备版本') ? t('plugins.status.preparing', '准备中...') : t('plugins.status_labels.install', '准备版本')}
                      </button>
                      <button type="button" onClick={() => void runVersionAction('uninstall')} disabled={!canUninstall} className="rounded-lg border border-zinc-200 px-4 py-3 text-sm font-semibold text-zinc-700 disabled:cursor-not-allowed disabled:text-zinc-400">
                        {versionActionState.loadingAction === t('plugins.status_labels.uninstall', '清理产物') ? t('plugins.status.cleaning', '清理中...') : t('plugins.status_labels.uninstall', '清理产物')}
                      </button>
                    </div>
                </div>
              </div>

              <div className="rounded-lg border border-zinc-200 p-4">
                <label className="mb-2 block text-sm font-medium text-zinc-700">{t('plugins.status.runtime_chain_title', '运行链')}</label>
                <div className="mb-3 text-xs text-zinc-500">
                  {t('plugins.status.current_invoke_policy', '当前调用策略')}：{loadPolicyLabel(currentInvokeLoadPolicy)}。{t('plugins.status.current_load_mode', '当前进入方式')}：{t('plugins.status.request_mode', '请求')} {modeLabel(currentRequestedLoadMode)} / {t('plugins.status.resolved_mode', '实际')} {modeLabel(currentResolvedLoadMode)}。
                  {currentLoadTrigger ? ` 最近触发：${loadTriggerLabel(currentLoadTrigger)}。` : ''}
                </div>
                <select
                  value={executionMode}
                  onChange={(event) => setExecutionMode(event.target.value)}
                  className="h-11 w-full rounded-lg border border-zinc-200 px-3 text-sm outline-none focus:border-teal-500"
                >
                  {localizedExecutionModes.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                  </select>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <button type="button" onClick={() => void runVersionAction('load')} disabled={!canLoad} className="rounded-lg bg-teal-700 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-zinc-300">
                    {versionActionState.loadingAction === t('plugins.status_labels.load', '进入运行态') ? t('plugins.status.entering_runtime', '进入中...') : t('plugins.status_labels.load', '进入运行态')}
                  </button>
                  <button type="button" onClick={() => void runVersionAction('unload')} disabled={!canUnload} className="rounded-lg border border-zinc-200 px-4 py-3 text-sm font-semibold text-zinc-700 disabled:cursor-not-allowed disabled:text-zinc-400">
                    {versionActionState.loadingAction === t('plugins.status_labels.unload', '退出运行态') ? t('plugins.status.exiting_runtime', '退出中...') : t('plugins.status_labels.unload', '退出运行态')}
                  </button>
                  <button type="button" onClick={() => void runVersionAction('status')} disabled={!canSyncStatus} className="rounded-lg border border-zinc-200 px-4 py-3 text-sm font-semibold text-zinc-700 disabled:cursor-not-allowed disabled:text-zinc-400">
                    {versionActionState.loadingAction === t('plugins.status_labels.status', '同步状态') ? t('plugins.status.syncing', '同步中...') : t('plugins.status_labels.status', '同步状态')}
                  </button>
                  <div className="rounded-lg bg-zinc-50 px-3 py-3 text-xs text-zinc-600">
                    {isLoaded
                      ? t('plugins.status.runtime_loaded_note', '当前实例已驻留在运行时，可以执行“退出运行态”。')
                      : (isInstalled ? t('plugins.status.prepared_not_loaded_note', '当前仅完成准备，还未进入运行态；可以手动进入，也可以按调用策略决定是否自动补加载。') : t('plugins.status.not_prepared_note', '当前尚未完成准备，运行链按钮会保持禁用。'))}
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-zinc-200 p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="text-sm font-semibold text-zinc-800">{t('plugins.runtime_preferences.title', '运行偏好')}</div>
                    <div className="mt-1 text-xs text-zinc-500">
                      {t('plugins.runtime_preferences.description', '单版本显式值优先，其次是全局默认，最后回退到系统缺省 explicit + wasm。')}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => void loadRuntimePreferences(selectedVersionId, { source: 'manual' })}
                      disabled={!selectedVersionId || runtimePreferencesBusy}
                      className="rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 disabled:cursor-not-allowed disabled:text-zinc-400"
                    >
                      {runtimePreferencesState.loadingAction === t('plugins.runtime.read_runtime_preferences', '读取运行偏好') ? t('plugins.runtime_preferences.loading', '读取中...') : t('plugins.runtime.read_runtime_preferences', '读取运行偏好')}
                    </button>
                    <button
                      type="button"
                      onClick={() => void applyBatchRuntimePreferences()}
                      disabled={!isBatchMode || batchSelectedPluginIds.length === 0 || runtimePreferencesBusy}
                      className="rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 disabled:cursor-not-allowed disabled:text-zinc-400"
                    >
                      {t('plugins.runtime_preferences.batch_apply', '批量应用到勾选插件')}
                    </button>
                    <button
                      type="button"
                      onClick={() => void applyRuntimeDefaults()}
                      disabled={runtimePreferencesBusy}
                      className="rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 disabled:cursor-not-allowed disabled:text-zinc-400"
                    >
                      {t('plugins.runtime_preferences.apply_global', '应用为全局默认')}
                    </button>
                    <button
                      type="button"
                      onClick={() => void saveRuntimePreferences()}
                      disabled={!selectedVersionId || runtimePreferencesBusy}
                      className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-zinc-300"
                    >
                      {t('plugins.runtime_preferences.save_current', '保存当前版本偏好')}
                    </button>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <label className="space-y-2">
                    <span className="block text-sm font-medium text-zinc-700">{t('plugins.runtime_preferences.invoke_policy', '调用策略')}</span>
                    <select
                      value={runtimePreferenceDraft.invoke_load_policy}
                      onChange={(event) => setRuntimePreferenceDraft((current) => ({ ...current, invoke_load_policy: event.target.value }))}
                      className="h-11 w-full rounded-lg border border-zinc-200 px-3 text-sm outline-none focus:border-teal-500"
                    >
                      <option value="">{t('plugins.runtime_preferences.inherit_default', '继承全局 / 系统默认')}</option>
                      <option value="explicit">{loadPolicyLabel('explicit')}</option>
                      <option value="auto">{loadPolicyLabel('auto')}</option>
                    </select>
                  </label>
                  <label className="space-y-2">
                    <span className="block text-sm font-medium text-zinc-700">{t('plugins.runtime_preferences.default_load_mode', '默认加载方式')}</span>
                    <select
                      value={runtimePreferenceDraft.default_load_mode}
                      onChange={(event) => setRuntimePreferenceDraft((current) => ({ ...current, default_load_mode: event.target.value }))}
                      className="h-11 w-full rounded-lg border border-zinc-200 px-3 text-sm outline-none focus:border-teal-500"
                    >
                      <option value="">{t('plugins.runtime_preferences.inherit_default', '继承全局 / 系统默认')}</option>
                      {localizedExecutionModes.map((item) => (
                        <option key={item.value} value={item.value}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="mt-4 grid gap-3 xl:grid-cols-3">
                  <div className="rounded-lg bg-zinc-50 p-3">
                    <div className="text-xs text-zinc-500">{t('plugins.runtime_preferences.current_version_value', '当前版本显式值')}</div>
                    <div className="mt-1 text-sm font-semibold text-zinc-900">
                      {t('plugins.runtime_preferences.invoke_policy', '调用策略')}：{runtimePreferences?.invoke_load_policy ? loadPolicyLabel(runtimePreferences.invoke_load_policy) : t('plugins.runtime_preferences.inherit', '继承')}
                    </div>
                    <div className="mt-1 text-sm text-zinc-700">
                      {t('plugins.runtime_preferences.default_load_mode', '默认加载方式')}：{runtimePreferences?.default_load_mode ? modeLabel(runtimePreferences.default_load_mode) : t('plugins.runtime_preferences.inherit', '继承')}
                    </div>
                    <div className="mt-2 text-xs text-zinc-500">
                      {t('plugins.runtime_preferences.value_source', '来源')}：{t('plugins.runtime_preferences.policy_source', '策略')} {translateValueSource(invokePolicyValueSource)} / {t('plugins.runtime_preferences.mode_source', '模式')} {translateValueSource(defaultLoadModeValueSource)}
                    </div>
                  </div>
                  <div className="rounded-lg bg-zinc-50 p-3">
                    <div className="text-xs text-zinc-500">{t('plugins.runtime_preferences.global_default', '全局默认')}</div>
                    <div className="mt-1 text-sm font-semibold text-zinc-900">
                      {t('plugins.runtime_preferences.invoke_policy', '调用策略')}：{loadPolicyLabel(currentGlobalDefaults?.invoke_load_policy_default || 'explicit')}
                    </div>
                    <div className="mt-1 text-sm text-zinc-700">
                      {t('plugins.runtime_preferences.default_load_mode', '默认加载方式')}：{modeLabel(currentGlobalDefaults?.default_load_mode_default || 'wasm')}
                    </div>
                    <div className="mt-2 text-xs text-zinc-500">
                      {t('plugins.status_page.batch_selected_plugins', '勾选插件：{{count}} 个', { count: batchSelectedPluginIds.length })}
                      {selectedPluginId ? ` / ${t('plugins.status_page.current_plugin_batch_selected', '当前插件已勾选：{{value}}', { value: selectedPluginBatchChecked ? t('common.yes', '是') : t('common.no', '否') })}` : ''}
                    </div>
                  </div>
                  <div className="rounded-lg bg-zinc-50 p-3">
                    <div className="text-xs text-zinc-500">{t('plugins.status_page.current_effective_value', '当前生效值')}</div>
                    <div className="mt-1 text-sm font-semibold text-zinc-900">
                      {t('plugins.runtime_preferences.invoke_policy', '调用策略')}：{loadPolicyLabel(runtimePreferences?.effective_invoke_load_policy || currentInvokeLoadPolicy)}
                    </div>
                    <div className="mt-1 text-sm text-zinc-700">
                      {t('plugins.status_page.requested_load_mode', '请求加载方式')}：{modeLabel(runtimePreferences?.effective_requested_load_mode || currentRequestedLoadMode)}
                    </div>
                    <div className="mt-1 text-sm text-zinc-700">
                      {t('plugins.status_page.resolved_load_mode', '实际加载方式')}：{modeLabel(runtimePreferences?.effective_resolved_load_mode || currentResolvedLoadMode)}
                    </div>
                  </div>
                </div>

                <div className="mt-4 rounded-lg border border-dashed border-zinc-300 bg-zinc-50 px-4 py-3 text-xs text-zinc-600">
                  {t('plugins.status_page.batch_mode_hint', '左侧开启“批量模式”后，可勾选多个插件；批量保存时会自动展开为这些插件下的全部版本进行更新。')}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-zinc-200 bg-white p-5">
          <button
            type="button"
            onClick={() => setIsMetricsOpen((current) => !current)}
            className="flex w-full items-center justify-between"
          >
            <div className="text-left">
              <h3 className="text-lg font-semibold text-zinc-900">{t('plugins.status_page.metrics_title', '统计与运行')}</h3>
              <p className="mt-1 text-sm text-zinc-500">{t('plugins.status_page.metrics_desc', '默认收起，不抢首屏空间；展开后可以看累计使用统计和当前实例运行指标。')}</p>
            </div>
            {isMetricsOpen ? <ChevronUp className="h-5 w-5 text-zinc-500" /> : <ChevronDown className="h-5 w-5 text-zinc-500" />}
          </button>

          {isMetricsOpen ? (
            <div className="mt-5 grid gap-5 xl:grid-cols-2">
              <div className="rounded-lg border border-zinc-200 p-4">
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-zinc-800">
                  <FileArchive className="h-4 w-4 text-teal-700" />
                  {t('plugins.status_page.usage_metrics', '累计使用统计')}
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg bg-zinc-50 p-3"><div className="text-xs text-zinc-500">{t('plugins.status_page.metric_version_calls', '版本调用次数')}</div><div className="mt-1 text-xl font-semibold">{metric(versionUsage?.call_count)}</div></div>
                  <div className="rounded-lg bg-zinc-50 p-3"><div className="text-xs text-zinc-500">{t('plugins.status_page.metric_version_errors', '版本错误次数')}</div><div className="mt-1 text-xl font-semibold">{metric(versionUsage?.error_count)}</div></div>
                  <div className="rounded-lg bg-zinc-50 p-3"><div className="text-xs text-zinc-500">{t('plugins.status_page.metric_avg_response', '平均耗时')}</div><div className="mt-1 text-xl font-semibold">{metric(versionUsage?.avg_response_ms)} ms</div></div>
                  <div className="rounded-lg bg-zinc-50 p-3"><div className="text-xs text-zinc-500">{t('plugins.status_page.metric_calls_7d', '7 天调用')}</div><div className="mt-1 text-xl font-semibold">{metric(versionUsage?.call_count_7d)}</div></div>
                  <div className="rounded-lg bg-zinc-50 p-3"><div className="text-xs text-zinc-500">{t('plugins.status_page.metric_last_used', '最近使用')}</div><div className="mt-1 text-sm font-medium">{formatTime(versionUsage?.last_used_at)}</div></div>
                  <div className="rounded-lg bg-zinc-50 p-3"><div className="text-xs text-zinc-500">{t('plugins.status_page.metric_user_count', '涉及用户数')}</div><div className="mt-1 text-xl font-semibold">{metric(versionUsage?.user_count)}</div></div>
                </div>
              </div>

              <div className="rounded-lg border border-zinc-200 p-4">
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-zinc-800">
                  <Gauge className="h-4 w-4 text-teal-700" />
                  {t('plugins.status_page.runtime_metrics', '运行时指标')}
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg bg-zinc-50 p-3"><div className="text-xs text-zinc-500">{t('plugins.status_page.metric_runtime_calls', '运行态调用')}</div><div className="mt-1 text-xl font-semibold">{metric(versionMetrics.call_count ?? runtimeRecord.total_call_count)}</div></div>
                  <div className="rounded-lg bg-zinc-50 p-3"><div className="text-xs text-zinc-500">{t('plugins.status_page.metric_runtime_errors', '运行态错误')}</div><div className="mt-1 text-xl font-semibold">{metric(versionMetrics.call_error_count ?? runtimeRecord.total_call_error_count)}</div></div>
                  <div className="rounded-lg bg-zinc-50 p-3"><div className="text-xs text-zinc-500">{t('plugins.status_page.metric_load_count', '加载次数')}</div><div className="mt-1 text-xl font-semibold">{metric(versionMetrics.load_count)}</div></div>
                  <div className="rounded-lg bg-zinc-50 p-3"><div className="text-xs text-zinc-500">{t('plugins.status_page.metric_unload_count', '卸载次数')}</div><div className="mt-1 text-xl font-semibold">{metric(versionMetrics.unload_count)}</div></div>
                  <div className="rounded-lg bg-zinc-50 p-3"><div className="text-xs text-zinc-500">{t('plugins.status_page.metric_last_call', '最近调用')}</div><div className="mt-1 text-sm font-medium">{formatTime(versionMetrics.last_call_at)}</div></div>
                  <div className="rounded-lg bg-zinc-50 p-3"><div className="text-xs text-zinc-500">{t('plugins.status_page.metric_plugin_calls', '插件级累计调用')}</div><div className="mt-1 text-xl font-semibold">{metric(pluginUsage?.call_count)}</div></div>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-4 rounded-lg bg-zinc-50 px-4 py-3 text-sm text-zinc-600">
              {t('plugins.status_page.metrics_collapsed_summary', '已收起。当前摘要：调用 {{calls}} 次，错误 {{errors}} 次，最近运行 {{lastRun}}。', { calls: metric(versionUsage?.call_count), errors: metric(versionUsage?.error_count), lastRun: formatTime(versionMetrics.last_call_at || versionUsage?.last_used_at) })}
            </div>
          )}
        </section>

        <div className="grid gap-5 xl:grid-cols-2">
          <section className="rounded-xl border border-zinc-200 bg-white p-5">
            <h3 className="text-lg font-semibold text-zinc-900">{t('plugins.status_page.recent_actions', '最近操作')}</h3>
            {actionLog.length === 0 ? (
              <div className="mt-4 rounded-lg bg-zinc-50 p-4 text-sm text-zinc-500">{t('plugins.status_page.no_action_log', '还没有操作记录。')}</div>
            ) : (
              <div className="mt-4 space-y-2">
                {actionLog.map((item) => (
                  <div key={item} className="rounded-lg bg-zinc-50 px-3 py-2 text-sm text-zinc-700">{item}</div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-xl border border-zinc-200 bg-white p-5">
            <h3 className="text-lg font-semibold text-zinc-900">{t('plugins.status_page.recent_result', '最近结果')}</h3>
            <div className="mt-4">
              <JsonBlock value={details} empty={t('plugins.status_page.no_recent_result', '暂无最近操作结果')} />
            </div>
          </section>
        </div>
      </div>
    );
  }

  function renderInvokeTab() {
    const invokeBusy = Boolean(invokeState.loadingAction);
    const invokeActionDisabled = Boolean(selectedVersionIssue) || !functionName || invokeBusy || invokeBlockedByInstall || invokeRequiresManualLoad;

    return (
      <div className="space-y-6">
        <section className="rounded-xl border border-zinc-200 bg-white p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-zinc-900">{t('plugins.invoke_page.title', '函数调用')}</h2>
              <p className="mt-1 text-sm text-zinc-500">{t('plugins.invoke_page.description', '函数列表只在这里读取。选择函数后会自动填充参数示例、参数类型和请求体。')}</p>
            </div>
            <button
              type="button"
              onClick={() => void loadFunctions()}
              disabled={Boolean(selectedVersionIssue) || invokeBusy}
              className="inline-flex h-11 items-center gap-2 rounded-lg border border-teal-700 px-4 text-sm font-semibold text-teal-700 disabled:cursor-not-allowed disabled:border-zinc-200 disabled:text-zinc-400"
            >
              <RefreshCw className={`h-4 w-4 ${invokeState.loadingAction === t('plugins.invoke.read_functions', '读取函数列表') ? 'animate-spin' : ''}`} />
              {invokeState.loadingAction === t('plugins.invoke.read_functions', '读取函数列表')
                ? t('plugins.invoke_page.loading_functions', '读取中...')
                : (functions.length > 0 ? t('plugins.invoke_page.refresh_functions', '刷新函数列表') : t('plugins.invoke.read_functions', '读取函数列表'))}
            </button>
          </div>

          <PanelFeedback state={invokeState} loadingLabel={t('plugins.invoke_page.loading', '正在处理插件调用')} />

          <div className="mt-4 space-y-2">
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-700">
              {t('plugins.invoke_page.current_invoke_policy', '当前调用加载策略')}：<span className="font-medium">{loadPolicyLabel(currentInvokeLoadPolicy)}</span>
              {' '}| {t('plugins.invoke_page.install_status', '准备状态')}：<span className="font-medium">{translateStatus(currentStatusSnapshot.install_status)}</span>
              {' '}| {t('plugins.invoke_page.runtime_status', '运行状态')}：<span className="font-medium">{translateStatus(currentStatusSnapshot.runtime_status)}</span>
            </div>
            {invokeBlockedByInstall && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                {t('plugins.invoke.version_not_prepared', '当前版本尚未完成准备，调用前需要先回到“状态总览”执行“准备版本”。')}
              </div>
            )}
            {invokeRequiresManualLoad && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                {t('plugins.invoke.manual_load_required', '当前版本使用显式加载策略，调用前请先回到“状态总览”手动进入运行态。')}
              </div>
            )}
            {invokeWillAutoLoad && (
              <div className="rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">
                {t('plugins.invoke_page.auto_load_notice', '当前版本允许自动补加载。本次调用前如果运行时尚未加载，系统会先尝试补加载再执行函数。')}
              </div>
            )}
            {invokePermissionHint && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                {t('plugins.invoke_page.permission_hint_prefix', '当前调用命中了宿主权限限制')}：{translatePermissionKey(invokePermissionHint.permissionKey)}
                {invokePermissionHint.hostFunction ? `（${invokePermissionHint.hostFunction}）` : ''}
                。{t('plugins.invoke_page.permission_hint_suffix', '请前往“权限与隔离”查看该权限是否来自基础宿主权限、是否被策略关闭，或是否被强制沙箱压制。')}
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('permissions');
                    setPermissionFilter('all');
                    setPermissionProbe(invokePermissionHint.permissionKey);
                    setExpandedPermissionKeys((current) => (
                      current.includes(invokePermissionHint.permissionKey)
                        ? current
                        : [invokePermissionHint.permissionKey, ...current]
                    ));
                    void loadPermissions({ force: true, source: 'manual' });
                  }}
                  className="ml-3 rounded-lg border border-amber-300 bg-white px-3 py-1 text-xs font-semibold text-amber-900"
                >
                  {t('plugins.invoke_page.go_permissions', '前往权限与隔离')}
                </button>
              </div>
            )}
          </div>

          {invokeInputError && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
              {invokeInputError}
            </div>
          )}

          {!selectedVersionId ? (
            <div className="mt-5 rounded-lg border border-dashed border-zinc-300 bg-zinc-50 p-6 text-sm text-zinc-500">{t('plugins.invoke_page.select_version_first', '请先到“状态总览”选择一个版本，再读取函数列表。')}</div>
          ) : !functionsLoadedOnce ? (
            <div className="mt-5 rounded-lg border border-dashed border-zinc-300 bg-zinc-50 p-6 text-sm text-zinc-500">{t('plugins.invoke_page.load_functions_first', '当前版本尚未读取函数列表，点击右上角按钮继续。')}</div>
          ) : functions.length === 0 ? (
            <div className="mt-5 rounded-lg border border-dashed border-zinc-300 bg-zinc-50 p-6 text-sm text-zinc-500">{t('plugins.invoke.no_exported_functions', '当前版本未导出函数，调用入口已自动禁用。')}</div>
          ) : (
            <div className="mt-5 grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
              <div className="overflow-hidden rounded-lg border border-zinc-200">
                <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50 px-4 py-3">
                  <div>
                    <div className="text-sm font-semibold text-zinc-800">{t('plugins.invoke_page.function_table', '函数表')}</div>
                    <div className="text-xs text-zinc-500">{t('plugins.invoke_page.function_table_desc', '优先按声明顺序；缺少顺序元数据时按函数名排序。')}</div>
                  </div>
                  <div className="text-sm text-zinc-500">{t('plugins.invoke_page.function_count', '{{count}} 个函数', { count: functions.length })}</div>
                </div>
                <div className="max-h-[28rem] overflow-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead className="sticky top-0 bg-white">
                      <tr className="border-b border-zinc-200 text-zinc-500">
                        <th className="px-4 py-3 font-medium">{t('plugins.invoke_page.column_name', '函数名')}</th>
                        <th className="px-4 py-3 font-medium">{t('plugins.invoke_page.column_params', '参数')}</th>
                        <th className="px-4 py-3 font-medium">{t('plugins.invoke_page.column_return', '返回值')}</th>
                        <th className="px-4 py-3 font-medium">{t('plugins.invoke_page.column_action', '操作')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {functions.map((item) => {
                        const specs = buildParamSpecs(item);
                        const isCurrent = item.name === functionName;
                        return (
                          <tr key={item.name} className={isCurrent ? 'bg-teal-50' : 'border-t border-zinc-100'}>
                            <td className="px-4 py-3 align-top">
                              <div className="font-semibold text-zinc-900">{item.name}</div>
                              <div className="mt-1 text-xs text-zinc-500">{item.description || item.signature || t('plugins.invoke_page.no_comment', '暂无注释')}</div>
                            </td>
                            <td className="px-4 py-3 align-top text-zinc-600">{specs.length}</td>
                            <td className="px-4 py-3 align-top text-zinc-600">{item.return_value_name || '-'}</td>
                            <td className="px-4 py-3 align-top">
                              <button
                                type="button"
                                onClick={() => applyFunctionExample(item)}
                                className={`rounded-lg px-3 py-2 text-sm font-medium ${isCurrent ? 'bg-teal-700 text-white' : 'border border-zinc-200 text-zinc-700 hover:bg-zinc-50'}`}
                              >
                                {t('plugins.invoke_page.select_function', '选择')}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-lg border border-zinc-200 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-zinc-800">{t('plugins.invoke_page.current_function', '当前函数')}</div>
                      <div className="mt-1 text-lg font-semibold text-zinc-900">{functionName || t('plugins.invoke_page.select_function_placeholder', '请选择函数')}</div>
                      <div className="mt-1 text-sm text-zinc-500">{selectedFunction?.description || selectedFunction?.signature || t('plugins.invoke_page.function_hint', '选择函数后会出现参数说明。')}</div>
                    </div>
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <label className="flex items-center gap-2 text-xs text-zinc-600">
                        {t('plugins.invoke_page.timeout', '超时')}
                        <input
                          value={invokeTimeoutMs}
                          onChange={(event) => setInvokeTimeoutMs(event.target.value.replace(/[^\d]/g, ''))}
                          className="h-10 w-24 rounded-lg border border-zinc-200 px-3 text-sm outline-none focus:border-teal-500"
                        />
                        ms
                      </label>
                      <button
                        type="button"
                        onClick={() => void invokeFunction()}
                        disabled={invokeActionDisabled}
                        className="inline-flex h-11 items-center gap-2 rounded-lg bg-teal-700 px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-zinc-300"
                      >
                        <Play className="h-4 w-4" />
                        {invokeState.loadingAction === t('plugins.invoke.call_function', '调用函数') ? t('plugins.invoke_page.calling', '调用中...') : t('plugins.invoke_page.call', '调用')}
                      </button>
                      <button
                        type="button"
                        onClick={cancelInvokeFunction}
                        disabled={invokeState.loadingAction !== t('plugins.invoke.call_function', '调用函数')}
                        className="inline-flex h-11 items-center rounded-lg border border-rose-200 px-4 text-sm font-semibold text-rose-700 disabled:cursor-not-allowed disabled:border-zinc-200 disabled:text-zinc-400"
                      >
                        {t('plugins.invoke_page.cancel', '停止调用')}
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 space-y-3">
                    {paramSpecs.length === 0 ? (
                      <div className="rounded-lg bg-zinc-50 p-4 text-sm text-zinc-500">{t('plugins.invoke_page.no_params', '当前函数没有参数，点击调用即可发送空数组。')}</div>
                    ) : (
                      paramSpecs.map((item, index) => (
                        <div key={`${item.name}-${index}`} className="rounded-lg border border-zinc-200 p-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-medium text-zinc-900">{item.name}</span>
                            <span className="rounded-full bg-zinc-100 px-2 py-1 text-xs text-zinc-600">{item.type}</span>
                          </div>
                          <div className="mt-1 text-xs text-zinc-500">{item.note}</div>
                          <input
                            value={paramInputValues[index] ?? ''}
                            onChange={(event) => updateParamInput(index, event.target.value)}
                            placeholder={`示例：${typeof item.example === 'string' ? item.example : JSON.stringify(item.example)}`}
                            className="mt-3 h-11 w-full rounded-lg border border-zinc-200 px-3 text-sm outline-none focus:border-teal-500"
                          />
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="grid gap-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-zinc-700">{t('plugins.invoke.parameter_types', '参数类型 JSON')}</label>
                    <textarea
                      value={parameterTypesJson}
                      onChange={(event) => {
                        setParameterTypesJson(event.target.value);
                        setInvokeInputError('');
                      }}
                      rows={5}
                      className="w-full rounded-lg border border-zinc-200 px-3 py-2 font-mono text-xs outline-none focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-zinc-700">{t('plugins.invoke.parameter_list', '参数数组 JSON')}</label>
                    <textarea
                      value={argsJson}
                      onChange={(event) => {
                        setArgsJson(event.target.value);
                        setInvokeInputError('');
                      }}
                      rows={7}
                      className="w-full rounded-lg border border-zinc-200 px-3 py-2 font-mono text-xs outline-none focus:border-teal-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        <div className="grid gap-5 xl:grid-cols-2">
          <section className="rounded-xl border border-zinc-200 bg-white p-5">
            <h3 className="text-lg font-semibold text-zinc-900">{t('plugins.invoke_page.request_preview', '即将发送的请求体')}</h3>
            <div className="mt-4">
              <JsonBlock value={currentInvokeRequest} empty={t('plugins.invoke_page.request_preview_empty', '暂无请求体')} />
            </div>
          </section>

          <section className="rounded-xl border border-zinc-200 bg-white p-5">
            <h3 className="text-lg font-semibold text-zinc-900">{t('plugins.invoke_page.response_data', '返回数据')}</h3>
            <div className="mt-4">
              <JsonBlock
                value={invokeResult}
                empty={t('plugins.invoke_page.response_data_empty', '暂无调用结果')}
                maxChars={12000}
                expanded={invokeResultExpanded}
                onToggleExpanded={() => setInvokeResultExpanded((current) => !current)}
              />
            </div>
          </section>
        </div>
      </div>
    );
  }

  function renderPermissionsTab() {
    const matrixContext = permissionMatrix?.context;
    const matrixSummary = permissionMatrix?.summary;
    const governanceBridgeSummary = permissionMatrix?.governance_bridge;
    const executionEnabled = Boolean(matrixContext?.enabled ?? currentPolicy.enabled ?? true);
    const configuredProfile = String(matrixContext?.configured_profile || currentPolicy.profile || currentProfile);
    const resolvedExecutor = String(matrixContext?.executor_resolved || currentProfile || 'sandbox');
    const permissionsBusy = Boolean(permissionsState.loadingAction);
    const permissionActionDisabledReason = selectedVersionIssue || (permissionsBusy ? t('plugins.permissions_ui.messages.busy_with_action', '正在{{action}}', { action: permissionsState.loadingAction }) : '');
    const permissionsActionDisabled = Boolean(permissionActionDisabledReason);
    const filterOptions: Array<{ key: PermissionFilterKey; label: string }> = [
      { key: 'all', label: t('permissions.filters.all', '全部') },
      { key: 'requested', label: t('permissions.filters.requested', '已请求') },
      { key: 'effective', label: t('permissions.filters.effective', '已生效') },
      { key: 'blocked_policy', label: t('permissions.filters.blocked_policy', '被策略拒绝') },
      { key: 'blocked_sandbox', label: t('permissions.filters.blocked_sandbox', '被强制沙箱压制') },
      { key: 'unknown', label: t('permissions.filters.unknown', '未登记权限') },
    ];
    const workspaceModes: Array<{ key: PermissionWorkspaceMode; label: string; count: number; description: string }> = [
      { key: 'capabilities', label: permissionUi.workspaceModes.capabilities.label, count: governedActionDomainSummary.total, description: permissionUi.workspaceModes.capabilities.description },
      { key: 'constraints', label: permissionUi.workspaceModes.constraints.label, count: permissionConstraintItems.filter((item) => item.count > 0).length, description: permissionUi.workspaceModes.constraints.description },
      { key: 'risks', label: permissionUi.workspaceModes.risks.label, count: governedActionDomainSummary.total, description: permissionUi.workspaceModes.risks.description },
      { key: 'diagnostics', label: permissionUi.workspaceModes.diagnostics.label, count: 3, description: permissionUi.workspaceModes.diagnostics.description },
    ];
    const selectedPermissionRow = permissionRows.find((row) => row.permission_key === selectedPermissionKey) || filteredPermissionRows[0] || permissionRows[0] || null;
    const selectedPermissionGovernedActionDomains = selectedPermissionRow ? getPermissionRowGovernedActionDomains(selectedPermissionRow) : [];
    const selectedPermissionHostFunctions = selectedPermissionRow ? getPermissionRowHostFunctions(selectedPermissionRow) : [];
    const selectedActionDomainItem = governedActionDomainItems.find((item) => item.action_domain === selectedActionDomainKey)
      || governedActionDomainItems[0]
      || null;
    const selectedActionDomainRow = selectedActionDomainItem
      ? permissionRows.find((row) => row.permission_key === selectedActionDomainItem.permission_key) || null
      : null;
    const selectedGovernedActionDomain = selectedActionDomainItem && selectedActionDomainRow
      ? getPermissionRowGovernedActionDomains(selectedActionDomainRow).find((item) => item.action_domain === selectedActionDomainItem.action_domain) || null
      : null;
    const selectedConstraintItem = permissionConstraintItems.find((item) => item.key === selectedConstraintKey)
      || permissionConstraintItems[0]
      || null;
    const diagnosticsItems: Array<{ key: PermissionDiagnosticsPanel; label: string; description: string }> = [
      {
        key: 'probe',
        label: tx('plugins.permissions_ui.diagnostics.probe.label', '权限探针', 'Permission Probe'),
        description: tx('plugins.permissions_ui.diagnostics.probe.description', '直接测试最终有效权限', 'Directly test final effective permissions'),
      },
      {
        key: 'host',
        label: tx('plugins.permissions_ui.diagnostics.host.label', '宿主映射', 'Host Mapping'),
        description: tx('plugins.permissions_ui.diagnostics.host.description', '查看宿主函数与基础宿主权限', 'Review host functions and baseline host permissions'),
      },
      {
        key: 'raw',
        label: tx('plugins.permissions_ui.diagnostics.raw.label', '原始 JSON', 'Raw JSON'),
        description: tx('plugins.permissions_ui.diagnostics.raw.description', '查看 requested/effective/policy 原始结构', 'Inspect requested / effective / policy raw payloads'),
      },
    ];
    const selectedWorkspaceModeMeta = workspaceModes.find((mode) => mode.key === permissionWorkspaceMode) || workspaceModes[0];
    const selectedPermissionDraftAllowed = selectedPermissionRow ? policyDraftPermissions.includes(selectedPermissionRow.permission_key) : false;
    const selectedPermissionCanConfigure = selectedPermissionRow
      ? (selectedPermissionRow.can_configure !== false || selectedPermissionDraftAllowed)
      : false;
    const selectedActionDomainGuide = selectedActionDomainItem
      ? getActionDomainGuide(
          selectedActionDomainItem.action_domain,
          translatePermissionKey(selectedActionDomainItem.permission_key),
          selectedActionDomainRow ? translatePermissionDescription(selectedActionDomainRow.permission_key) : '',
          resolvedLocale,
          tx,
        )
      : null;
    const selectedWorkspaceEditable = permissionWorkspaceMode === 'capabilities';
    const selectedWorkspaceTargetLabel = permissionWorkspaceMode === 'capabilities'
      ? (
          permissionCapabilityView === 'functions'
            ? (selectedActionDomainGuide?.label || selectedActionDomainItem?.action_domain || permissionUi.capabilityView.functions)
            : (selectedPermissionRow ? translatePermissionKey(selectedPermissionRow.permission_key) : permissionUi.capabilityView.groups)
        )
      : permissionWorkspaceMode === 'constraints'
        ? (selectedConstraintItem?.title || permissionUi.workspaceModes.constraints.label)
        : permissionWorkspaceMode === 'risks'
          ? (selectedActionDomainGuide?.label || selectedActionDomainItem?.action_domain || permissionUi.capabilityView.functions)
          : diagnosticsItems.find((item) => item.key === selectedDiagnosticsPanel)?.label || permissionUi.workspaceModes.diagnostics.label;
    const selectedWorkspaceTargetHint = permissionWorkspaceMode === 'capabilities'
      ? (
          permissionCapabilityView === 'functions'
            ? permissionUi.hints.capabilitiesFunctions
            : permissionUi.hints.capabilitiesGroups
        )
      : permissionWorkspaceMode === 'constraints'
        ? permissionUi.hints.constraints
        : permissionWorkspaceMode === 'risks'
          ? permissionUi.hints.risks
          : permissionUi.hints.diagnostics;
    const objectSelectionTitle = permissionWorkspaceMode === 'capabilities'
      ? (
          permissionCapabilityView === 'functions'
            ? permissionUi.steps.selectFunction
            : permissionUi.steps.selectGroup
        )
      : permissionWorkspaceMode === 'constraints'
        ? permissionUi.steps.selectConstraint
        : permissionWorkspaceMode === 'risks'
          ? permissionUi.steps.selectRisk
          : permissionUi.steps.selectPanel;
    const objectSelectionHint = permissionWorkspaceMode === 'capabilities'
      ? (
          permissionCapabilityView === 'functions'
            ? permissionUi.hints.selectFunctions
            : permissionUi.hints.selectGroups
        )
      : permissionWorkspaceMode === 'constraints'
        ? permissionUi.hints.selectConstraints
        : permissionWorkspaceMode === 'risks'
          ? permissionUi.hints.selectRisks
          : permissionUi.hints.selectPanels;
    const objectSelectionCount = permissionWorkspaceMode === 'capabilities'
      ? (
          permissionCapabilityView === 'functions'
            ? governedActionDomainItems.length
            : permissionRows.length
        )
      : permissionWorkspaceMode === 'constraints'
        ? permissionConstraintItems.length
        : permissionWorkspaceMode === 'risks'
          ? governedActionDomainItems.length
          : diagnosticsItems.length;
    const showSelectionSidebar = objectSelectionCount > 0;

    return (
      <div className="space-y-3">
        <section className="rounded-xl border border-zinc-200 bg-white p-4">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div>
                <h2 className="text-lg font-semibold text-zinc-900">{t('plugins.permissions.title', '权限设置')}</h2>
                <p className="mt-1 text-sm text-zinc-500">
                  {t(
                    'plugins.permissions.description',
                    '权限页按“功能放行、生效条件、风险说明、高级排查”四类整理；默认先处理功能放行。',
                  )}
                </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {policyDraftDirty && (
                <span className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-900">
                  {t('plugins.permissions.unsaved', '未保存：本次更改会更新当前版本的 allowed_permissions 与 action_domain_overrides')}
                </span>
              )}
              <button type="button" onClick={() => void loadPermissions({ force: true, source: 'manual' })} disabled={permissionsActionDisabled} className="rounded-lg border border-teal-700 px-4 py-2 text-sm font-semibold text-teal-700 disabled:cursor-not-allowed disabled:border-zinc-200 disabled:text-zinc-400">
                {permissionsState.loadingAction === t('plugins.runtime.read_permission_snapshot', '读取权限快照')
                  ? t('common.loading', '加载中...')
                  : t('plugins.permissions.read_snapshot', '读取快照')}
              </button>
              <button type="button" onClick={() => void savePolicy()} disabled={permissionsActionDisabled || !policyDraftDirty} className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-zinc-300">
                {t('plugins.permissions.save_changes', '保存更改')}
              </button>
              <button type="button" onClick={revertPolicyDraft} disabled={permissionsBusy || !policyDraftDirty} className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-700 disabled:cursor-not-allowed disabled:text-zinc-400">
                {t('plugins.permissions.revert_changes', '撤销更改')}
              </button>
              <button type="button" onClick={() => void setPolicyEnabled(false)} disabled={permissionsActionDisabled} className="rounded-lg border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-700 disabled:cursor-not-allowed disabled:border-zinc-200 disabled:text-zinc-400">
                {t('plugins.permissions.disable_execution', '禁用执行')}
              </button>
              <button type="button" onClick={() => void setPolicyEnabled(true)} disabled={permissionsActionDisabled} className="rounded-lg border border-emerald-200 px-4 py-2 text-sm font-semibold text-emerald-700 disabled:cursor-not-allowed disabled:border-zinc-200 disabled:text-zinc-400">
                {t('plugins.permissions.enable_execution', '恢复执行')}
              </button>
            </div>
          </div>

          <PanelFeedback state={permissionsState} loadingLabel={t('plugins.permissions.title', '权限与隔离')} />
          <div className="mt-3 flex flex-wrap gap-2 text-sm">
            <span className={`rounded-full border px-3 py-1 ${executionEnabled ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-900'}`}>
              {executionEnabled ? permissionUi.badges.executionAllowed : permissionUi.badges.executionDisabled}
            </span>
            <span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-zinc-600">
              {permissionUi.badges.currentVersion}：{selectedVersionId ? `#${selectedVersionId}` : t('plugins.context.select_version', '请选择版本')}
            </span>
            <span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-zinc-600">
              {permissionUi.badges.requested} {metric(matrixSummary?.requested_count)}
            </span>
            <span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-zinc-600">
              {permissionUi.badges.effective} {metric(matrixSummary?.effective_count)}
            </span>
            <span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-zinc-600">
              {permissionUi.badges.unknown} {metric(matrixSummary?.unknown_count)}
            </span>
          </div>
          <div className="mt-3 rounded-lg border border-teal-100 bg-teal-50 px-4 py-3 text-sm text-teal-900">
              {permissionUi.hints.topTip}
            </div>
          {permissionActionDisabledReason && (
            <div className="mt-3 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-600">
              {tx('plugins.permissions_ui.messages.snapshot_disabled', '权限快照当前不可操作：{{reason}}', 'The permission snapshot is not actionable right now: {{reason}}', { reason: permissionActionDisabledReason })}
            </div>
          )}
          {permissionsSnapshotStale && (
            <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              {tx('plugins.permissions_ui.messages.snapshot_stale', '当前显示的是上次成功的权限矩阵；本次快照有接口失败，请查看最近错误中的 matrix / requested / effective / policy 明细。', 'You are viewing the last successful permission matrix. Some snapshot APIs failed this time, so check the latest matrix / requested / effective / policy errors for details.')}
            </div>
          )}
          {!executionEnabled && isLoaded && (
            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              {tx('plugins.permissions_ui.messages.execution_disabled_runtime_loaded', '已禁止后续加载与调用，但当前实例仍驻留在运行时；请到“状态总览”手动执行“退出运行态”。', 'Future loads and invocations are blocked, but the current instance is still resident in runtime. Go to “Status Overview” and manually exit runtime.')}
            </div>
          )}
          {baselinePermissions.length > 0 && (
            <div className="mt-4 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-700">
              {tx('plugins.permissions_ui.messages.baseline_permissions', '基础宿主权限默认纳入有效权限计算：{{items}}', 'Baseline host permissions are included in effective permission calculation by default: {{items}}', {
                items: baselinePermissions.map((item) => translatePermissionKey(item)).join(isZh ? '、' : ', '),
              })}
            </div>
          )}
        </section>

        <section className="overflow-hidden rounded-xl border border-zinc-200 bg-white min-h-[calc(100vh-18rem)]">
          <div className="border-b border-zinc-200 bg-zinc-50 p-4">
            <div className="flex flex-col gap-3">
              <div className="text-sm font-semibold text-zinc-900">{permissionUi.steps.selectCategory}</div>
              <div className="flex flex-wrap gap-2">
                {workspaceModes.map((mode) => (
                  <button
                    key={mode.key}
                    type="button"
                    onClick={() => setPermissionWorkspaceMode(mode.key)}
                    className={`rounded-lg border px-4 py-2 text-sm font-medium ${
                      permissionWorkspaceMode === mode.key
                        ? 'border-teal-700 bg-teal-700 text-white'
                        : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-100'
                    }`}
                  >
                    <span>{mode.label}</span>
                    <span className={`ml-2 rounded-full px-2 py-0.5 text-xs ${
                      permissionWorkspaceMode === mode.key
                        ? 'bg-white/15 text-white'
                        : 'bg-zinc-100 text-zinc-600'
                    }`}>
                      {mode.count}
                    </span>
                  </button>
                ))}
              </div>
              <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                <div className="min-w-0">
                  <div className="text-sm text-zinc-600">{selectedWorkspaceModeMeta.description}</div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {permissionWorkspaceMode === 'capabilities' && (
                    <div className="grid grid-cols-2 gap-2 rounded-lg border border-zinc-200 bg-white p-1">
                      <button
                        type="button"
                        onClick={() => setPermissionCapabilityView('groups')}
                        className={`rounded-lg px-3 py-2 text-sm font-medium ${permissionCapabilityView === 'groups' ? 'bg-teal-700 text-white' : 'text-zinc-700 hover:bg-zinc-100'}`}
                      >
                        {permissionUi.capabilityView.groups}
                      </button>
                      <button
                        type="button"
                        onClick={() => setPermissionCapabilityView('functions')}
                        className={`rounded-lg px-3 py-2 text-sm font-medium ${permissionCapabilityView === 'functions' ? 'bg-teal-700 text-white' : 'text-zinc-700 hover:bg-zinc-100'}`}
                      >
                        {permissionUi.capabilityView.functions}
                      </button>
                    </div>
                  )}
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${selectedWorkspaceEditable ? 'bg-emerald-100 text-emerald-700' : 'bg-zinc-100 text-zinc-600'}`}>
                    {selectedWorkspaceEditable ? permissionUi.badges.editable : permissionUi.badges.readonly}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className={`grid h-full min-h-[calc(100vh-22rem)] ${showSelectionSidebar ? 'lg:grid-cols-[280px_minmax(0,1fr)]' : 'grid-cols-1'}`}>
            {showSelectionSidebar && (
            <aside className="min-h-0 border-b border-zinc-200 bg-zinc-50 lg:border-b-0 lg:border-r">
              <div className="border-b border-zinc-200 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-zinc-900">{objectSelectionTitle}</div>
                    <div className="mt-1 text-xs text-zinc-500">{objectSelectionHint}</div>
                  </div>
                  <span className="rounded-full border border-zinc-200 bg-white px-2.5 py-1 text-xs font-medium text-zinc-600">
                    {objectSelectionCount}
                  </span>
                </div>
              </div>

              <div className="min-h-0 overflow-auto p-3 lg:h-[calc(100vh-24rem)]">
                {permissionWorkspaceMode === 'capabilities' && permissionCapabilityView === 'functions' && (
                  <div className="space-y-2">
                    {governedActionDomainItems.map((item) => {
                      const selected = selectedActionDomainItem?.action_domain === item.action_domain;
                      const guide = getActionDomainGuide(item.action_domain, translatePermissionKey(item.permission_key), translatePermissionDescription(item.permission_key), resolvedLocale, tx);
                      return (
                        <button
                          key={`${item.permission_key}-${item.action_domain}`}
                          type="button"
                          onClick={() => {
                            setSelectedActionDomainKey(item.action_domain);
                            setSelectedPermissionKey(item.permission_key);
                          }}
                          className={`w-full rounded-lg border px-3 py-3 text-left ${
                            selected ? 'border-teal-700 bg-teal-50 text-teal-900' : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-100'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="font-medium">{guide.label}</div>
                              <div className="mt-1 text-xs text-zinc-500">{item.action_domain}</div>
                              <div className="mt-1 text-xs text-zinc-500">{tx('plugins.permissions_ui.labels.feature_group_with_value', '所属功能组：{{value}}', 'Feature group: {{value}}', { value: translatePermissionKey(item.permission_key) })}</div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <span className="rounded-full bg-zinc-100 px-2 py-1 text-xs text-zinc-600">{permissionUi.capabilityView.functions}</span>
                              {item.dirty && <span className="rounded-full bg-amber-100 px-2 py-1 text-xs text-amber-800">{permissionUi.words.waitingSave}</span>}
                            </div>
                          </div>
                          <div className="mt-2 flex flex-wrap gap-2 text-xs">
                            <span className={`rounded-full px-2 py-1 ${item.draft_effective_enabled ? 'bg-emerald-100 text-emerald-800' : 'bg-zinc-100 text-zinc-600'}`}>
                              {item.draft_effective_enabled ? permissionUi.words.runAllowed : permissionUi.words.runDisabled}
                            </span>
                            <span className="rounded-full bg-zinc-100 px-2 py-1 text-zinc-600">{translateActionDomainRuntimeMode(item.draft_mode)}</span>
                          </div>
                          <div className="mt-2 text-xs text-zinc-500">{guide.purpose}</div>
                        </button>
                      );
                    })}
                    {governedActionDomainItems.length === 0 && (
                      <div className="rounded-lg border border-dashed border-zinc-300 bg-white p-4 text-sm text-zinc-500">
                        {tx('plugins.permissions_ui.empty.governed_action_domains', '暂无具体功能治理对象。', 'No concrete capability governance items are available right now.')}
                      </div>
                    )}
                  </div>
                )}

                {permissionWorkspaceMode === 'capabilities' && permissionCapabilityView === 'groups' && (
                  <div className="space-y-2">
                    {permissionRows.map((row) => {
                      const selected = selectedPermissionRow?.permission_key === row.permission_key;
                      const actionCount = getPermissionRowGovernedActionDomains(row).length;
                      return (
                        <button
                          key={row.permission_key}
                          type="button"
                          onClick={() => setSelectedPermissionKey(row.permission_key)}
                          className={`w-full rounded-lg border px-3 py-3 text-left ${
                            selected ? 'border-teal-700 bg-teal-50 text-teal-900' : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-100'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="font-medium">{translatePermissionKey(row.permission_key)}</div>
                              <div className="mt-1 text-xs text-zinc-500">{row.permission_key}</div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <span className="rounded-full bg-zinc-100 px-2 py-1 text-xs text-zinc-600">{tx('plugins.permissions_ui.labels.capability_count', '{{count}} 个功能', '{{count}} capabilities', { count: actionCount })}</span>
                              <span className="rounded-full bg-emerald-100 px-2 py-1 text-[11px] text-emerald-700">{tx('plugins.permissions_ui.labels.editable_short', '可设置', 'Editable')}</span>
                            </div>
                          </div>
                          <div className="mt-2 flex flex-wrap gap-2 text-xs">
                            <span className={`rounded-full px-2 py-1 ${row.effective ? 'bg-emerald-100 text-emerald-800' : 'bg-zinc-100 text-zinc-600'}`}>
                              {row.effective
                                ? tx('plugins.permissions_ui.labels.effective_yes', '已生效', 'Effective')
                                : tx('plugins.permissions_ui.labels.effective_no', '未生效', 'Not effective')}
                            </span>
                            <span className={`rounded-full px-2 py-1 ${policyDraftPermissions.includes(row.permission_key) ? 'bg-teal-100 text-teal-800' : 'bg-zinc-100 text-zinc-600'}`}>
                              {policyDraftPermissions.includes(row.permission_key)
                                ? tx('plugins.permissions_ui.labels.pending_allow', '待保存：准备放开', 'Pending save: will allow')
                                : tx('plugins.permissions_ui.labels.pending_close', '待保存：准备关闭', 'Pending save: will close')}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                {permissionWorkspaceMode === 'constraints' && (
                  <div className="space-y-2">
                    {permissionConstraintItems.map((item) => {
                      const selected = selectedConstraintItem?.key === item.key;
                      return (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => setSelectedConstraintKey(item.key)}
                          className={`w-full rounded-lg border px-3 py-3 text-left ${
                            selected ? 'border-teal-700 bg-teal-50 text-teal-900' : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-100'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="font-medium">{item.title}</div>
                            <span className="rounded-full bg-zinc-100 px-2 py-1 text-xs text-zinc-600">{item.count}</span>
                          </div>
                          <div className="mt-1 text-xs text-zinc-500">{item.detail}</div>
                        </button>
                      );
                    })}
                  </div>
                )}

                {permissionWorkspaceMode === 'risks' && (
                  <div className="space-y-2">
                    {governedActionDomainItems.map((item) => {
                      const selected = selectedActionDomainItem?.action_domain === item.action_domain;
                      const guide = getActionDomainGuide(item.action_domain, translatePermissionKey(item.permission_key), translatePermissionDescription(item.permission_key), resolvedLocale, tx);
                      return (
                        <button
                          key={`risk-${item.permission_key}-${item.action_domain}`}
                          type="button"
                          onClick={() => {
                            setSelectedActionDomainKey(item.action_domain);
                            setSelectedPermissionKey(item.permission_key);
                          }}
                          className={`w-full rounded-lg border px-3 py-3 text-left ${
                            selected ? 'border-teal-700 bg-teal-50 text-teal-900' : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-100'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="font-medium">{guide.label}</div>
                              <div className="mt-1 text-xs text-zinc-500">{translatePermissionKey(item.permission_key)}</div>
                            </div>
                            <span className="rounded-full bg-zinc-100 px-2 py-1 text-xs text-zinc-600">{permissionUi.workspaceModes.risks.label}</span>
                          </div>
                          <div className="mt-2 text-xs text-zinc-500">{guide.risk}</div>
                        </button>
                      );
                    })}
                  </div>
                )}

                {permissionWorkspaceMode === 'diagnostics' && (
                  <div className="space-y-2">
                    {diagnosticsItems.map((item) => {
                      const selected = selectedDiagnosticsPanel === item.key;
                      return (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => setSelectedDiagnosticsPanel(item.key)}
                          className={`w-full rounded-lg border px-3 py-3 text-left ${
                            selected ? 'border-teal-700 bg-teal-50 text-teal-900' : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-100'
                          }`}
                        >
                          <div className="font-medium">{item.label}</div>
                          <div className="mt-1 text-xs text-zinc-500">{item.description}</div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </aside>
            )}

            <div className="min-w-0 min-h-0 overflow-auto p-5 lg:h-[calc(100vh-24rem)]">
              <div className="mb-5 rounded-xl border border-teal-100 bg-teal-50 p-4">
                <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0">
                    <div className="text-xs font-semibold uppercase tracking-wide text-teal-700">{selectedWorkspaceEditable ? permissionUi.steps.editCurrent : permissionUi.steps.viewCurrent}</div>
                    <div className="mt-1 text-base font-semibold text-zinc-900">{selectedWorkspaceTargetLabel}</div>
                    <div className="mt-1 text-sm text-zinc-600">
                      {permissionUi.badges.currentWorkspace}：{selectedWorkspaceModeMeta.label}。{selectedWorkspaceTargetHint}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className={`rounded-full px-3 py-1 text-xs font-medium ${selectedWorkspaceEditable ? 'bg-emerald-100 text-emerald-700' : 'bg-zinc-100 text-zinc-600'}`}>
                      {selectedWorkspaceEditable ? permissionUi.badges.editable : permissionUi.badges.readonly}
                    </span>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-zinc-600">
                      {permissionUi.steps.saveHint}
                    </span>
                  </div>
                </div>
              </div>

              {permissionWorkspaceMode === 'capabilities' && permissionCapabilityView === 'functions' && (
                selectedActionDomainItem && selectedGovernedActionDomain && selectedActionDomainRow ? (
                  <div className="space-y-5">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-zinc-900">{selectedActionDomainGuide?.label || selectedActionDomainItem.action_domain}</h3>
                        <p className="mt-1 text-sm text-zinc-500">
                          {tx(
                            'plugins.permissions_ui.messages.action_header_scope',
                            '所属功能组：{{group}}；这里管的是这个具体功能，不是整个功能组。',
                            'Feature group: {{group}}. This area controls this concrete capability, not the whole group.',
                            { group: translatePermissionKey(selectedActionDomainItem.permission_key) },
                          )}
                        </p>
                        <div className="mt-2 text-xs text-zinc-500">{selectedActionDomainItem.action_domain}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => openPermissionGovernance(selectedActionDomainItem.permission_key)}
                        className="rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                      >
                        {tx('plugins.permissions_ui.actions.open_feature_group_settings', '去设置功能组', 'Open feature group settings')}
                      </button>
                    </div>

                    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
                      <div className="rounded-xl border border-zinc-200 bg-white p-4">
                        <div className="text-sm font-semibold text-zinc-900">{permissionUi.sections.whatItDoes}</div>
                        <div className="mt-4 grid gap-3 md:grid-cols-3">
                          <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
                            <div className="text-xs text-zinc-500">{tx('plugins.permissions_ui.labels.purpose', '作用', 'Purpose')}</div>
                            <div className="mt-2 text-sm text-zinc-700">{selectedActionDomainGuide?.purpose}</div>
                          </div>
                          <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
                            <div className="text-xs text-zinc-500">{permissionUi.sections.whatOpenDoes}</div>
                            <div className="mt-2 text-sm text-zinc-700">{selectedActionDomainGuide?.capability}</div>
                          </div>
                          <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
                            <div className="text-xs text-zinc-500">{permissionUi.sections.riskNotice}</div>
                            <div className="mt-2 text-sm text-zinc-700">{selectedActionDomainGuide?.risk}</div>
                          </div>
                        </div>
                      </div>
                      <div className="rounded-xl border border-zinc-200 bg-white p-4">
                        <div className="text-sm font-semibold text-zinc-900">{permissionUi.sections.nextStep}</div>
                        <div className="mt-4 space-y-3 text-sm text-zinc-700">
                          {!selectedActionDomainItem.draft_allowed ? (
                            <>
                              <div>{tx('plugins.permissions_ui.messages.feature_group_first_explanation', '先放行所属功能组，否则这个功能即使单独设为强制允许也不会真正生效。', 'Allow the feature group first. Otherwise this capability will still not become effective even if you force allow it here.')}</div>
                              <button
                                type="button"
                                onClick={() => openPermissionGovernance(selectedActionDomainItem.permission_key)}
                                className="rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                              >
                                {tx('plugins.permissions_ui.actions.allow_feature_group_first', '先去放行功能组', 'Allow the feature group first')}
                              </button>
                            </>
                          ) : !isActiveGovernedActionDomain(selectedGovernedActionDomain) ? (
                            <div>{tx('plugins.permissions_ui.messages.action_not_granted_readonly', '当前这个功能还没有处于“已授予”状态，所以这里暂时只能查看，不能直接修改。', 'This capability is not currently in a granted state, so it can be reviewed here but not edited directly.')}</div>
                          ) : (
                            <div>{tx('plugins.permissions_ui.messages.action_ready_to_edit', '这个功能已经具备修改前提，你现在可以在下面“设置选项”里直接点按钮修改。', 'This capability already meets the edit prerequisites. You can change it directly in the settings section below.')}</div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                      <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
                        <div className="text-xs text-zinc-500">{permissionUi.sections.grantStatus}</div>
                        <div className="mt-1 text-base font-semibold text-zinc-900">{translateGrantStatus(selectedActionDomainItem.grant_status)}</div>
                        <div className="mt-1 text-xs text-zinc-500">{translateGrantSource(selectedActionDomainItem.grant_source)}</div>
                      </div>
                      <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
                        <div className="text-xs text-zinc-500">{permissionUi.sections.currentSaved}</div>
                        <div className="mt-1 text-base font-semibold text-zinc-900">{translateActionDomainRuntimeMode(selectedActionDomainItem.persisted_mode)}</div>
                        <div className="mt-1 text-xs text-zinc-500">{selectedActionDomainItem.persisted_effective_enabled ? permissionUi.words.runAllowed : permissionUi.words.runDisabled}</div>
                      </div>
                      <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
                        <div className="text-xs text-zinc-500">{permissionUi.sections.currentDraft}</div>
                        <div className="mt-1 text-base font-semibold text-zinc-900">{translateActionDomainRuntimeMode(selectedActionDomainItem.draft_mode)}</div>
                        <div className="mt-1 text-xs text-zinc-500">{selectedActionDomainItem.dirty ? permissionUi.words.waitingSave : permissionUi.words.sameAsSaved}</div>
                      </div>
                      <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
                        <div className="text-xs text-zinc-500">{permissionUi.sections.effectiveAfterSave}</div>
                        <div className="mt-1 text-base font-semibold text-zinc-900">{selectedActionDomainItem.draft_effective_enabled ? permissionUi.words.runAllowed : permissionUi.words.runDisabled}</div>
                        <div className="mt-1 text-xs text-zinc-500">
                          {selectedActionDomainItem.draft_allowed
                            ? tx('plugins.permissions_ui.messages.feature_group_allowed', '所属功能组已放行', 'Feature group allowed')
                            : tx('plugins.permissions_ui.messages.feature_group_not_allowed', '所属功能组未放行', 'Feature group not allowed')}
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
                      <div className="rounded-xl border border-zinc-200 bg-white p-4">
                        <div className="text-sm font-semibold text-zinc-900">{permissionUi.sections.settingOptions}</div>
                        <div className="mt-1 text-sm text-zinc-500">{tx('plugins.permissions_ui.messages.action_settings_scope', '这里直接修改当前具体功能，不会改动整个功能组。', 'These settings only change the current concrete capability, not the whole feature group.')}</div>
                        <div className="mt-4 flex flex-wrap gap-2">
                          {([
                            { mode: 'inherit', label: translateActionDomainRuntimeMode('inherit') },
                            { mode: 'enabled', label: translateActionDomainRuntimeMode('enabled') },
                            { mode: 'disabled', label: translateActionDomainRuntimeMode('disabled') },
                          ] as Array<{ mode: ActionDomainRuntimeMode; label: string }>).map((option) => (
                            <button
                              key={`${selectedActionDomainItem.action_domain}-${option.mode}`}
                              type="button"
                              disabled={permissionsBusy || !selectedActionDomainItem.draft_allowed || !isActiveGovernedActionDomain(selectedGovernedActionDomain)}
                              onClick={() => toggleActionDomainRuntimeOverride(selectedActionDomainItem.permission_key, selectedGovernedActionDomain, option.mode)}
                              className={`rounded-lg border px-4 py-2 text-sm font-medium ${
                                selectedActionDomainItem.draft_mode === option.mode
                                  ? 'border-teal-700 bg-teal-700 text-white'
                                  : 'border-zinc-200 bg-white text-zinc-700'
                              } disabled:cursor-not-allowed disabled:border-zinc-200 disabled:bg-zinc-100 disabled:text-zinc-400`}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                        <div className="mt-4 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-600">
                          {tx('plugins.permissions_ui.messages.runtime_mode_help', '跟随默认：使用系统当前默认值；强制允许：无论默认是什么都单独打开；强制关闭：无论默认是什么都单独关掉。', 'Follow default: use the current system default. Force allow: open this capability explicitly. Force disable: close this capability explicitly regardless of the default.')}
                        </div>
                      </div>
                      <div className="rounded-xl border border-zinc-200 bg-white p-4">
                        <div className="text-sm font-semibold text-zinc-900">{permissionUi.sections.resultSummary}</div>
                        <div className="mt-4 space-y-2 text-sm text-zinc-600">
                          <div>{translateRuntimeOverrideState(selectedGovernedActionDomain.runtime_enabled, selectedGovernedActionDomain.has_runtime_override)}</div>
                          {selectedActionDomainItem.mirrored_from_legacy && <div className="text-amber-700">{tx('plugins.permissions_ui.messages.legacy_bridge_action', '当前动作域仍来自旧策略桥接。', 'This action domain still comes from the legacy policy bridge.')}</div>}
                          {!selectedActionDomainItem.draft_allowed && <div className="text-amber-700">{tx('plugins.permissions_ui.messages.feature_group_blocks_action', '所属功能组当前未放行，这个具体功能即使设为强制允许也不会真正生效。', 'The feature group is not currently allowed, so this capability will still not become effective even if you force allow it.')}</div>}
                          {!isActiveGovernedActionDomain(selectedGovernedActionDomain) && <div className="text-zinc-500">{tx('plugins.permissions_ui.messages.action_readonly_not_granted', '当前具体功能授予状态不是“已授予”，这里只展示状态，不允许修改。', 'This capability is not in a granted state. Its status is shown here, but editing is disabled.')}</div>}
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
                      <div className="rounded-xl border border-zinc-200 bg-white p-4">
                        <div className="text-sm font-semibold text-zinc-900">{tx('plugins.permissions_ui.sections.mapped_host_functions', '关联宿主函数', 'Mapped host functions')}</div>
                        {getPermissionRowHostFunctions(selectedActionDomainRow).length === 0 ? (
                          <div className="mt-3 rounded-lg border border-dashed border-zinc-300 bg-zinc-50 p-4 text-sm text-zinc-500">{tx('plugins.permissions_ui.empty.action_host_functions', '当前具体功能所属功能组没有关联宿主函数。', 'No host functions are mapped through this capability’s feature group.')}</div>
                        ) : (
                          <div className="mt-4 grid gap-3 xl:grid-cols-2">
                            {getPermissionRowHostFunctions(selectedActionDomainRow).map((hostFunction) => (
                              <div key={`${selectedActionDomainItem.action_domain}-${hostFunction.name}`} className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
                                <div className="font-semibold text-zinc-900">{translateHostFunctionLabel(hostFunction.i18n_key, hostFunction.name)}</div>
                                <div className="mt-1 text-xs text-zinc-500">{hostFunction.name}</div>
                                <div className="mt-2 text-sm text-zinc-600">{translateHostFunctionDescription(hostFunction.i18n_key, hostFunction.description || '') || hostFunction.description || '-'}</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="rounded-xl border border-zinc-200 bg-white p-4">
                        <div className="text-sm font-semibold text-zinc-900">{tx('plugins.permissions_ui.sections.details', '详情', 'Details')}</div>
                        <div className="mt-4 space-y-2 text-sm text-zinc-600">
                          <div>{tx('plugins.permissions_ui.labels.feature_group', '所属功能组', 'Feature group')}：{translatePermissionKey(selectedActionDomainItem.permission_key)}</div>
                          <div>{tx('plugins.permissions_ui.labels.request_source', '请求来源', 'Request source')}：{translateRequestSource(selectedActionDomainRow.request_source)}</div>
                          <div>{tx('plugins.permissions_ui.labels.direction', '触发方向', 'Direction')}：{translatePermissionDirection(selectedActionDomainRow.direction)}</div>
                          <div>{tx('plugins.permissions_ui.labels.risk_level', '风险级别', 'Risk level')}：{translatePermissionRisk(selectedActionDomainRow.risk_level)}</div>
                          <div>{tx('plugins.permissions_ui.labels.final_decision', '最终决策', 'Final decision')}：{translateDecisionReason(selectedActionDomainRow.decision_reason)}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 p-8 text-sm text-zinc-500">{tx('plugins.permissions_ui.empty.select_action_domain', '请选择左侧具体功能。', 'Choose a concrete capability from the left list.')}</div>
                )
              )}

              {permissionWorkspaceMode === 'capabilities' && permissionCapabilityView === 'groups' && (
                selectedPermissionRow ? (
                  <div className="space-y-5">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-zinc-900">{translatePermissionKey(selectedPermissionRow.permission_key)}</h3>
                        <p className="mt-1 text-sm text-zinc-500">{tx('plugins.permissions_ui.messages.group_controls_group_only', '这里管的是功能组开关。先放行这个功能组，下面的具体功能才可能真正生效。', 'This area controls the feature group switch. Concrete capabilities under it can only become effective after the group is allowed.')}</p>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-xs font-medium ${selectedPermissionCanConfigure ? 'bg-emerald-100 text-emerald-700' : 'bg-zinc-100 text-zinc-500'}`}>
                        {selectedPermissionCanConfigure
                          ? tx('plugins.permissions_ui.labels.editable_now', '可直接设置', 'Editable now')
                          : tx('plugins.permissions_ui.labels.readonly_now', '当前仅能查看', 'Read only now')}
                      </span>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                      <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
                        <div className="text-xs text-zinc-500">{tx('plugins.permissions_ui.labels.source', '来源', 'Source')}</div>
                        <div className="mt-1 text-base font-semibold text-zinc-900">{translateRequestSource(selectedPermissionRow.request_source)}</div>
                      </div>
                      <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
                        <div className="text-xs text-zinc-500">{tx('plugins.permissions_ui.labels.direction', '触发方向', 'Direction')}</div>
                        <div className="mt-1 text-base font-semibold text-zinc-900">{translatePermissionDirection(selectedPermissionRow.direction)}</div>
                      </div>
                      <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
                        <div className="text-xs text-zinc-500">{tx('plugins.permissions_ui.labels.current_runtime_profile', '当前运行档位', 'Current runtime profile')}</div>
                        <div className="mt-1 text-base font-semibold text-zinc-900">{selectedPermissionRow.policy_allowed ? permissionUi.words.allowed : permissionUi.words.disallowed}</div>
                      </div>
                      <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
                        <div className="text-xs text-zinc-500">{tx('plugins.permissions_ui.labels.final_effective', '最终有效', 'Final effective')}</div>
                        <div className="mt-1 text-base font-semibold text-zinc-900">{selectedPermissionRow.effective ? permissionUi.words.yes : permissionUi.words.no}</div>
                      </div>
                    </div>

                    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
                      <div className="rounded-xl border border-zinc-200 bg-white p-4">
                        <div className="text-sm font-semibold text-zinc-900">{permissionUi.sections.settingOptions}</div>
                          <div className="mt-1 text-sm text-zinc-500">{tx('plugins.permissions_ui.messages.group_settings_scope', '这里改的是功能组开关，不是具体功能本身。', 'This changes the feature group switch, not the concrete capability itself.')}</div>
                        <div className="mt-4 flex flex-wrap gap-2">
                          <button
                            type="button"
                            disabled={!selectedPermissionCanConfigure || permissionsBusy}
                            onClick={() => togglePolicyDraftPermission(selectedPermissionRow.permission_key, true, selectedPermissionGovernedActionDomains)}
                            className={`rounded-lg border px-4 py-2 text-sm font-medium ${
                              selectedPermissionDraftAllowed
                                ? 'border-teal-700 bg-teal-700 text-white'
                                : 'border-zinc-200 bg-white text-zinc-700'
                            } disabled:cursor-not-allowed disabled:border-zinc-200 disabled:bg-zinc-100 disabled:text-zinc-400`}
                          >
                            {tx('plugins.permissions_ui.actions.allow_feature_group', '放行这个功能组', 'Allow this feature group')}
                          </button>
                          <button
                            type="button"
                            disabled={!selectedPermissionCanConfigure || permissionsBusy}
                            onClick={() => togglePolicyDraftPermission(selectedPermissionRow.permission_key, false, selectedPermissionGovernedActionDomains)}
                            className={`rounded-lg border px-4 py-2 text-sm font-medium ${
                              !selectedPermissionDraftAllowed
                                ? 'border-rose-300 bg-rose-50 text-rose-700'
                                : 'border-zinc-200 bg-white text-zinc-700'
                            } disabled:cursor-not-allowed disabled:border-zinc-200 disabled:bg-zinc-100 disabled:text-zinc-400`}
                          >
                            {tx('plugins.permissions_ui.actions.close_feature_group', '关闭这个功能组', 'Close this feature group')}
                          </button>
                        </div>
                        <div className="mt-4 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-600">
                          {tx('plugins.permissions_ui.messages.group_only_controls_group', '这里只决定功能组是否放行；如果你要精确控制某个功能，请在下方列表里点具体功能继续设置。', 'This only controls whether the feature group is allowed. To control a specific capability, choose it from the list below.')}
                        </div>
                        {!selectedPermissionCanConfigure && (
                          <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                            {tx('plugins.permissions_ui.messages.group_not_reallowable', '当前功能组不能直接重新放行，通常是因为它未登记或只剩历史桥接项；你仍然可以先查看原因，再决定是否关闭历史草稿。', 'This feature group cannot be re-allowed directly, usually because it is unregistered or only contains legacy bridge items. Review the reason first, then decide whether to close the old draft.')}
                          </div>
                        )}
                      </div>
                      <div className="rounded-xl border border-zinc-200 bg-white p-4">
                        <div className="text-sm font-semibold text-zinc-900">{permissionUi.sections.resultSummary}</div>
                        <div className="mt-4 space-y-2 text-sm text-zinc-600">
                          <div>{permissionUi.sections.currentSaved}：{selectedPermissionRow.configured_policy_allowed ? permissionUi.words.savedAllow : permissionUi.words.savedDeny}</div>
                          <div>{permissionUi.sections.currentDraft}：{selectedPermissionDraftAllowed ? permissionUi.words.draftAllow : permissionUi.words.draftDeny}</div>
                          <div>{tx('plugins.permissions_ui.labels.current_runtime_profile', '当前运行档位', 'Current runtime profile')}：{selectedPermissionRow.policy_allowed ? permissionUi.words.allowed : permissionUi.words.disallowed}</div>
                          <div>{tx('plugins.permissions_ui.labels.final_effective', '最终有效', 'Final effective')}：{selectedPermissionRow.effective ? permissionUi.words.yes : permissionUi.words.no}</div>
                          {selectedPermissionRow.request_source === 'baseline' && <div className="text-sky-700">{tx('plugins.permissions_ui.messages.baseline_permission_closable', '这是基础宿主权限，默认会参与计算，但仍可以关闭。', 'This is a baseline host permission. It participates in calculation by default, but can still be disabled.')}</div>}
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
                      <div className="rounded-xl border border-zinc-200 bg-white p-4">
                        <div className="text-sm font-semibold text-zinc-900">{permissionUi.sections.includedFunctions}</div>
                        {selectedPermissionGovernedActionDomains.length === 0 ? (
                          <div className="mt-3 rounded-lg border border-dashed border-zinc-300 bg-zinc-50 p-4 text-sm text-zinc-500">{tx('plugins.permissions_ui.empty.group_capabilities', '当前功能组没有挂接具体功能。', 'No concrete capabilities are attached to this feature group.')}</div>
                        ) : (
                          <div className="mt-4 space-y-3">
                            {selectedPermissionGovernedActionDomains.map((actionDomain) => {
                              const draftItem = actionDomainOverrideDrafts.find((item) => item.action_domain === actionDomain.action_domain);
                              const persistedMode = resolvePersistedActionDomainRuntimeMode(actionDomain);
                              const draftMode = draftItem ? resolveActionDomainRuntimeMode(draftItem.runtime_enabled) : persistedMode;
                              const draftRuntimeEnabled = !policyDraftPermissions.includes(selectedPermissionRow.permission_key)
                                ? false
                                : draftMode === 'inherit'
                                  ? resolveGovernedActionDomainRuntimeEnabled(actionDomain)
                                  : draftMode === 'enabled';
                              return (
                                <button
                                  key={`${selectedPermissionRow.permission_key}-${actionDomain.action_domain}`}
                                  type="button"
                                  onClick={() => openActionDomainGovernance(selectedPermissionRow.permission_key, actionDomain.action_domain)}
                                  className="flex w-full items-start justify-between rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-left hover:bg-zinc-100"
                                >
                                  <div>
                                    <div className="font-medium text-zinc-900">{actionDomain.action_domain}</div>
                                    <div className="mt-1 text-xs text-zinc-500">{translateGrantStatus(actionDomain.grant_status)} / {translateGrantSource(actionDomain.grant_source)}</div>
                                  </div>
                                  <div className="flex flex-col items-end gap-2 text-xs">
                                    <span className="rounded-full bg-zinc-100 px-2 py-1 text-zinc-600">{translateActionDomainRuntimeMode(draftMode)}</span>
                                    <span className={`rounded-full px-2 py-1 ${draftRuntimeEnabled ? 'bg-emerald-100 text-emerald-800' : 'bg-zinc-100 text-zinc-600'}`}>
                                      {draftRuntimeEnabled ? permissionUi.words.runAllowed : permissionUi.words.runDisabled}
                                    </span>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      <div className="rounded-xl border border-zinc-200 bg-white p-4">
                        <div className="text-sm font-semibold text-zinc-900">{permissionUi.sections.hostMapping}</div>
                        <div className="mt-4 space-y-3 text-sm text-zinc-600">
                          <div>{translateDecisionReason(selectedPermissionRow.decision_reason)}</div>
                          {selectedPermissionRow.request_source === 'baseline' && <div className="text-sky-700">{tx('plugins.permissions_ui.messages.baseline_permission_included', '基础宿主权限默认参与计算，但仍可关闭。', 'Baseline host permissions are included by default, but can still be disabled.')}</div>}
                          {selectedPermissionRow.mirrored_from_legacy && <div className="text-amber-700">{tx('plugins.permissions_ui.messages.group_has_legacy_bridge', '当前功能组下有具体功能来自旧策略桥接。', 'Some concrete capabilities in this group still come from the legacy bridge.')}</div>}
                        </div>
                        <div className="mt-4 space-y-2">
                          {selectedPermissionHostFunctions.length > 0 ? selectedPermissionHostFunctions.map((hostFunction) => (
                            <div key={`${selectedPermissionRow.permission_key}-${hostFunction.name}`} className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
                              <div className="font-medium text-zinc-900">{translateHostFunctionLabel(hostFunction.i18n_key, hostFunction.name)}</div>
                              <div className="mt-1 text-xs text-zinc-500">{hostFunction.name}</div>
                            </div>
                          )) : (
                            <div className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 p-4 text-sm text-zinc-500">{tx('plugins.permissions_ui.empty.group_host_functions', '当前功能组没有关联宿主函数。', 'No host functions are mapped to this feature group.')}</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 p-8 text-sm text-zinc-500">{tx('plugins.permissions_ui.empty.select_group', '请选择左侧功能组。', 'Choose a feature group from the left list.')}</div>
                )
              )}

              {permissionWorkspaceMode === 'constraints' && (
                selectedConstraintItem ? (
                  <div className="space-y-5">
                    <div>
                      <h3 className="text-lg font-semibold text-zinc-900">{selectedConstraintItem.title}</h3>
                      <p className="mt-1 text-sm text-zinc-500">{tx('plugins.permissions_ui.messages.constraints_intro', '这里专门解释导致“已配置但未生效”的限制来源，并列出命中的对象。', 'This area explains why something is configured but still not effective, and lists the matched items.')}</p>
                    </div>
                    <div className={`rounded-xl border p-4 ${selectedConstraintItem.tone}`}>
                      <div className="flex items-center justify-between gap-3">
                        <div className="font-semibold">{selectedConstraintItem.title}</div>
                        <span className="rounded-full border border-current/20 px-2 py-1 text-xs">{selectedConstraintItem.count} 项</span>
                      </div>
                      <div className="mt-2 text-sm">{selectedConstraintItem.detail}</div>
                    </div>
                    <div className="rounded-xl border border-zinc-200 bg-white p-4">
                      <div className="text-sm font-semibold text-zinc-900">{tx('plugins.permissions_ui.labels.matched_items', '命中列表', 'Matched items')}</div>
                      {selectedConstraintItem.entries.length === 0 ? (
                        <div className="mt-3 rounded-lg border border-dashed border-zinc-300 bg-zinc-50 p-4 text-sm text-zinc-500">{tx('plugins.permissions_ui.empty.no_constraint_entries', '当前没有命中项。', 'No matched items right now.')}</div>
                      ) : (
                        <div className="mt-4 space-y-2">
                          {selectedConstraintItem.entries.map((entry) => (
                            <div key={`${selectedConstraintItem.key}-${entry}`} className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-700">
                              {entry}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 p-8 text-sm text-zinc-500">{tx('plugins.permissions_ui.empty.select_constraint', '请选择左侧约束分类。', 'Choose a blocking condition from the left list.')}</div>
                )
              )}

              {permissionWorkspaceMode === 'risks' && (
                selectedActionDomainItem && selectedActionDomainGuide && selectedActionDomainRow ? (
                  <div className="space-y-5">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-zinc-900">{selectedActionDomainGuide.label}</h3>
                        <p className="mt-1 text-sm text-zinc-500">
                          {tx('plugins.permissions_ui.messages.risks_intro', '这里不直接改权限，专门帮助管理员判断“这个功能是做什么的、风险多大、现在还差什么前提”。', 'This area does not change permissions directly. It helps admins understand what the capability does, how risky it is, and what prerequisites are still missing.')}
                        </p>
                        <div className="mt-2 text-xs text-zinc-500">
                          {tx('plugins.permissions_ui.labels.feature_group', '功能组', 'Feature group')}：{translatePermissionKey(selectedActionDomainItem.permission_key)} · {tx('plugins.permissions_ui.labels.capability_key', '功能键', 'Capability key')}：{selectedActionDomainItem.action_domain}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => openPermissionGovernance(selectedActionDomainItem.permission_key)}
                          className="rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                        >
                          {tx('plugins.permissions_ui.actions.open_feature_group_settings', '去看功能组设置', 'Open feature group settings')}
                        </button>
                        <button
                          type="button"
                          onClick={() => openActionDomainGovernance(selectedActionDomainItem.permission_key, selectedActionDomainItem.action_domain)}
                          className="rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                        >
                          {tx('plugins.permissions_ui.actions.open_capability_settings', '去设置具体功能', 'Open capability settings')}
                        </button>
                      </div>
                    </div>

                    <div className="grid gap-4 xl:grid-cols-3">
                      <div className="rounded-xl border border-zinc-200 bg-white p-4">
                        <div className="text-sm font-semibold text-zinc-900">{permissionUi.sections.whatItDoes}</div>
                        <div className="mt-3 text-sm text-zinc-700">{selectedActionDomainGuide.purpose}</div>
                      </div>
                      <div className="rounded-xl border border-zinc-200 bg-white p-4">
                        <div className="text-sm font-semibold text-zinc-900">{permissionUi.sections.whatOpenDoes}</div>
                        <div className="mt-3 text-sm text-zinc-700">{selectedActionDomainGuide.capability}</div>
                      </div>
                      <div className="rounded-xl border border-zinc-200 bg-white p-4">
                        <div className="text-sm font-semibold text-zinc-900">{permissionUi.sections.riskNotice}</div>
                        <div className="mt-3 text-sm text-zinc-700">{selectedActionDomainGuide.risk}</div>
                      </div>
                    </div>

                    <div className="grid gap-4 xl:grid-cols-2">
                      <div className="rounded-xl border border-zinc-200 bg-white p-4">
                        <div className="text-sm font-semibold text-zinc-900">{permissionUi.sections.currentPrerequisites}</div>
                        <div className="mt-4 space-y-2 text-sm text-zinc-700">
                          <div>{tx('plugins.permissions_ui.labels.feature_group_draft', '功能组当前草稿', 'Feature group draft')}：{selectedActionDomainItem.draft_allowed ? permissionUi.words.savedAllow : tx('plugins.permissions_ui.words.not_allowed', '未放行', 'Not allowed')}</div>
                          <div>{tx('plugins.permissions_ui.labels.capability_grant_status', '具体功能授予状态', 'Capability grant status')}：{translateGrantStatus(selectedActionDomainItem.grant_status)}</div>
                          <div>{permissionUi.sections.currentSaved}：{translateActionDomainRuntimeMode(selectedActionDomainItem.persisted_mode)}</div>
                          <div>{permissionUi.sections.effectiveAfterSave}：{selectedActionDomainItem.draft_effective_enabled ? permissionUi.words.runAllowed : permissionUi.words.runDisabled}</div>
                          <div>{tx('plugins.permissions_ui.labels.final_decision', '最终决策', 'Final decision')}：{translateDecisionReason(selectedActionDomainRow.decision_reason)}</div>
                        </div>
                      </div>
                      <div className="rounded-xl border border-zinc-200 bg-white p-4">
                        <div className="text-sm font-semibold text-zinc-900">{permissionUi.sections.missingPrerequisites}</div>
                        <div className="mt-4 space-y-2 text-sm text-zinc-700">
                          {!selectedActionDomainItem.draft_allowed && <div className="text-amber-700">{tx('plugins.permissions_ui.messages.missing_feature_group_allow', '还差 1 步：先放行所属功能组，否则具体功能不会真正生效。', 'One more step: allow the feature group first, otherwise the capability will not become effective.')}</div>}
                          {!isActiveGovernedActionDomain(selectedGovernedActionDomain) && <div className="text-zinc-700">{tx('plugins.permissions_ui.messages.missing_grant_review', '还差 1 步：当前具体功能未处于“已授予”状态，需要先完成授予或审核。', 'One more step: this capability is not currently granted and still needs a grant or review.')}</div>}
                          {(selectedActionDomainRow.forced_by_sandbox || selectedActionDomainRow.decision_reason === 'blocked_by_force_sandbox') && <div className="text-amber-700">{tx('plugins.permissions_ui.messages.missing_sandbox_release', '还差 1 步：当前被强制沙箱压制，放开设置后也不会真正生效。', 'One more step: it is currently suppressed by forced sandbox, so it still will not become effective after allowing it.')}</div>}
                          {selectedActionDomainItem.draft_allowed && isActiveGovernedActionDomain(selectedGovernedActionDomain) && !(selectedActionDomainRow.forced_by_sandbox || selectedActionDomainRow.decision_reason === 'blocked_by_force_sandbox') && (
                            <div className="text-emerald-700">{tx('plugins.permissions_ui.messages.prerequisites_ready', '当前前提已基本满足，可以直接去“功能放行”里设置这个具体功能。', 'The prerequisites are mostly satisfied. You can go back to “Allow Features” and configure this capability directly.')}</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 p-8 text-sm text-zinc-500">{tx('plugins.permissions_ui.empty.select_risk_action', '请选择左侧具体功能查看用途与风险。', 'Choose a concrete capability from the left list to review purpose and risk.')}</div>
                )
              )}

              {permissionWorkspaceMode === 'diagnostics' && (
                <div className="space-y-5">
                  {selectedDiagnosticsPanel === 'probe' && (
                    <div className="rounded-xl border border-zinc-200 bg-white p-5">
                      <h3 className="text-lg font-semibold text-zinc-900">{t('plugins.permissions.quick_probe_title', '权限探针')}</h3>
                      <p className="mt-1 text-sm text-zinc-500">
                        {t(
                          'plugins.permissions.quick_probe_description',
                          '测试运行时最终有效权限，而不是只检查策略 allowed_permissions 是否包含该权限。',
                        )}
                      </p>
                      <div className="mt-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_180px]">
                        <select value={permissionProbe} onChange={(event) => setPermissionProbe(event.target.value)} className="h-11 rounded-lg border border-zinc-200 px-3 text-sm outline-none focus:border-teal-500">
                          <option value="">{t('common.select', '请选择')}</option>
                          {probeOptions.map((item) => (
                            <option key={item} value={item}>{translatePermissionKey(item)}</option>
                          ))}
                        </select>
                        <button type="button" onClick={() => void testPermission()} disabled={permissionsActionDisabled || !permissionProbe} className="rounded-lg bg-zinc-950 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-zinc-300">
                          {t('plugins.permissions.probe_button', '测试权限')}
                        </button>
                      </div>
                      <div className="mt-4">
                        <JsonBlock value={permissionProbeResult} empty={t('plugins.permissions.probe_empty', '暂无权限探针结果。')} />
                      </div>
                    </div>
                  )}

                  {selectedDiagnosticsPanel === 'host' && (
                    <div className="rounded-xl border border-zinc-200 bg-white p-5">
                      <h3 className="text-lg font-semibold text-zinc-900">{tx('plugins.permissions_ui.diagnostics.host.label', '宿主映射', 'Host Mapping')}</h3>
                      <div className="mt-4 grid gap-3 md:grid-cols-2">
                        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
                          <div className="text-xs text-zinc-500">{tx('plugins.permissions_ui.labels.host_function_count', '宿主函数总数', 'Host function count')}</div>
                          <div className="mt-1 text-xl font-semibold text-zinc-900">{uniqueHostFunctionCount}</div>
                        </div>
                        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
                          <div className="text-xs text-zinc-500">{tx('plugins.permissions_ui.labels.baseline_host_permissions', '基础宿主权限', 'Baseline host permissions')}</div>
                          <div className="mt-1 text-sm font-medium text-zinc-900">
                            {baselinePermissions.length > 0
                              ? baselinePermissions.map((item) => translatePermissionKey(item)).join(isZh ? '、' : ', ')
                              : tx('plugins.permissions_ui.empty.none', '暂无', 'None')}
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 grid gap-3 xl:grid-cols-2">
                        {permissionRows.flatMap((row) => getPermissionRowHostFunctions(row).map((hostFunction) => (
                          <div key={`${row.permission_key}-${hostFunction.name}`} className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="font-semibold text-zinc-900">{translateHostFunctionLabel(hostFunction.i18n_key, hostFunction.name)}</div>
                                <div className="mt-1 text-xs text-zinc-500">{row.permission_key}</div>
                              </div>
                              <span className="rounded-full bg-white px-2 py-1 text-xs text-zinc-600">{translateModule(`permissions.modules.${sanitizeI18nSegment(hostFunction.module)}`)}</span>
                            </div>
                            <div className="mt-2 text-sm text-zinc-600">{translateHostFunctionDescription(hostFunction.i18n_key, hostFunction.description || '') || hostFunction.description || '-'}</div>
                          </div>
                        )))}
                      </div>
                    </div>
                  )}

                  {selectedDiagnosticsPanel === 'raw' && (
                    <div className="grid gap-5 xl:grid-cols-3">
                      <div className="rounded-xl border border-zinc-200 bg-white p-5">
                        <div className="mb-2 text-sm font-semibold text-zinc-800">{t('plugins.permissions.requested_raw', '请求权限 JSON')}</div>
                        <JsonBlock value={requestedPermissions} empty="尚未读取请求权限" />
                      </div>
                      <div className="rounded-xl border border-zinc-200 bg-white p-5">
                        <div className="mb-2 text-sm font-semibold text-zinc-800">{t('plugins.permissions.effective_raw', '有效权限 JSON')}</div>
                        <JsonBlock value={effectivePermissions} empty="尚未读取有效权限" />
                      </div>
                      <div className="rounded-xl border border-zinc-200 bg-white p-5">
                        <div className="mb-2 text-sm font-semibold text-zinc-800">{t('plugins.permissions.policy_raw', '策略 JSON')}</div>
                        <textarea
                          value={policyJson}
                          onChange={(event) => {
                            const nextValue = event.target.value;
                            setPolicyJson(nextValue);
                            setPolicyDraftDirty(true);
                            try {
                              const nextPolicy = parseObjectJson(nextValue, '策略 JSON');
                              setPolicyJsonError('');
                              if (Array.isArray(nextPolicy.allowed_permissions)) {
                                setPolicyDraftPermissions(nextPolicy.allowed_permissions.map((item) => String(item)).sort((a, b) => a.localeCompare(b)));
                              }
                              if (Array.isArray(nextPolicy.action_domain_overrides)) {
                                setActionDomainOverrideDrafts(normalizeActionDomainOverrideDrafts(nextPolicy.action_domain_overrides));
                              }
                            } catch (err) {
                              setPolicyJsonError(`高级策略 JSON 格式不正确：${toErrorMessage(err)}`);
                            }
                          }}
                          rows={18}
                          className="w-full rounded-lg border border-zinc-200 px-3 py-2 font-mono text-xs outline-none focus:border-teal-500"
                        />
                        {policyJsonError && (
                          <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                            {policyJsonError}
                          </div>
                        )}
                        <button type="button" onClick={() => void savePolicy({ advanced: true })} disabled={permissionsActionDisabled} className="mt-3 rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-zinc-300">
                          {t('plugins.permissions.save_advanced', '保存高级策略')}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>

        <div className="hidden">

        <section className="rounded-xl border border-zinc-200 bg-white p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-zinc-900">{t('plugins.permissions_page.governed_actions_title', '动作域治理总览')}</h3>
              <p className="mt-1 text-sm text-zinc-500">
                {t('plugins.permissions_page.governed_actions_desc', '这里直接展示当前版本的动作域授予、显式覆盖、继承状态和保存前草稿，不再必须先展开权限行才能看见治理差异。')}
              </p>
            </div>
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-600">
              {t('plugins.permissions_page.governed_actions_dirty', '当前草稿未保存动作域：{{count}} 个', { count: governedActionDomainSummary.dirty })}
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-6">
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
              <div className="text-xs text-zinc-500">{t('plugins.permissions_page.metric_governed_actions_total', '动作域总数')}</div>
              <div className="mt-1 text-xl font-semibold text-zinc-900">{governedActionDomainSummary.total}</div>
            </div>
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
              <div className="text-xs text-zinc-500">{t('plugins.permissions_page.metric_active_grants', '活动授予')}</div>
              <div className="mt-1 text-xl font-semibold text-zinc-900">{governedActionDomainSummary.active}</div>
            </div>
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
              <div className="text-xs text-zinc-500">{t('plugins.permissions_page.metric_explicit_overrides', '显式覆盖')}</div>
              <div className="mt-1 text-xl font-semibold text-zinc-900">{governedActionDomainSummary.explicitOverrides}</div>
            </div>
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
              <div className="text-xs text-zinc-500">{t('plugins.permissions_page.metric_inherited_grants', '继承授予')}</div>
              <div className="mt-1 text-xl font-semibold text-zinc-900">{governedActionDomainSummary.inherited}</div>
            </div>
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
              <div className="text-xs text-zinc-500">{t('plugins.permissions_page.metric_effective_in_draft', '当前草稿生效')}</div>
              <div className="mt-1 text-xl font-semibold text-zinc-900">{governedActionDomainSummary.effectiveEnabled}</div>
            </div>
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
              <div className="text-xs text-zinc-500">{t('plugins.permissions_page.metric_pending_changes', '待保存变更')}</div>
              <div className="mt-1 text-xl font-semibold text-zinc-900">{governedActionDomainSummary.dirty}</div>
            </div>
          </div>

          {governedActionDomainItems.length === 0 ? (
            <div className="mt-5 rounded-lg border border-dashed border-zinc-300 bg-zinc-50 p-6 text-sm text-zinc-500">
              {t('plugins.permissions_page.governed_actions_empty', '当前版本还没有动作域治理数据，先读取权限快照或等待授予规则回填。')}
            </div>
          ) : (
            <div className="mt-5 overflow-hidden rounded-xl border border-zinc-200">
              <div className="overflow-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-zinc-50 text-zinc-500">
                    <tr className="border-b border-zinc-200">
                      <th className="px-4 py-3 font-medium">{t('plugins.permissions_page.column_action_domain', '动作域')}</th>
                      <th className="px-4 py-3 font-medium">{t('plugins.permissions_page.column_parent_permission', '上层权限')}</th>
                      <th className="px-4 py-3 font-medium">{t('plugins.permissions_page.column_grant_status', '授予状态')}</th>
                      <th className="px-4 py-3 font-medium">{t('plugins.permissions_page.column_current_saved', '当前保存')}</th>
                      <th className="px-4 py-3 font-medium">{t('plugins.permissions_page.column_current_draft', '当前草稿')}</th>
                      <th className="px-4 py-3 font-medium">{t('plugins.permissions_page.column_effect_after_save', '保存后生效')}</th>
                      <th className="px-4 py-3 font-medium">{t('plugins.permissions_page.column_action', '操作')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {governedActionDomainItems.map((item) => (
                      <tr key={`${item.permission_key}-${item.action_domain}`} className="border-t border-zinc-100 align-top">
                        <td className="px-4 py-3">
                          <div className="font-semibold text-zinc-900">{item.action_domain}</div>
                          {item.mirrored_from_legacy && (
                            <div className="mt-1 text-xs text-amber-700">{t('plugins.permissions_page.legacy_bridge', '旧策略桥接')}</div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-zinc-900">{translatePermissionKey(item.permission_key)}</div>
                          <div className="mt-1 text-xs text-zinc-500">{item.permission_key}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-zinc-800">{translateGrantStatus(item.grant_status)}</div>
                          <div className="mt-1 text-xs text-zinc-500">{translateGrantSource(item.grant_source)}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-zinc-800">{actionDomainRuntimeModeLabel(item.persisted_mode)}</div>
                          <div className="mt-1 text-xs text-zinc-500">{item.persisted_effective_enabled ? t('plugins.permissions_page.current_allowed', '当前允许') : t('plugins.permissions_page.current_disabled', '当前关闭')}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className={`${item.dirty ? 'font-semibold text-amber-800' : 'text-zinc-800'}`}>
                            {actionDomainRuntimeModeLabel(item.draft_mode)}
                          </div>
                          <div className="mt-1 text-xs text-zinc-500">
                            {item.draft_allowed ? t('plugins.permissions_page.parent_permission_allowed', '上层权限已放行') : t('plugins.permissions_page.parent_permission_blocked', '上层权限未放行')}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full border px-2 py-1 text-xs ${item.draft_effective_enabled ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-zinc-200 bg-zinc-50 text-zinc-600'}`}>
                            {item.draft_effective_enabled ? t('plugins.permissions_page.runtime_allowed', '运行允许') : t('plugins.permissions_page.runtime_disabled', '运行关闭')}
                          </span>
                          {item.dirty && (
                            <div className="mt-1 text-xs text-amber-700">{t('plugins.permissions_page.pending_save', '待保存')}</div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => openPermissionGovernance(item.permission_key)}
                          className="rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                        >
                          {t('plugins.permissions_page.expand_permission', '展开对应权限')}
                        </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>

        <section className="rounded-xl border border-zinc-200 bg-white p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-zinc-900">{t('plugins.permissions_page.constraints_title', '生效约束')}</h3>
              <p className="mt-1 text-sm text-zinc-500">
                {t('plugins.permissions_page.constraints_desc', '把“为什么看起来已经放行却仍然不能用”单独抽出来，按约束来源分组显示。')}
              </p>
            </div>
          </div>
          <div className="mt-5 grid gap-3 xl:grid-cols-2">
            {permissionConstraintItems.map((item) => (
              <div key={item.key} className={`rounded-lg border px-4 py-4 ${item.tone}`}>
                <div className="flex items-center justify-between gap-3">
                  <div className="font-semibold">{item.title}</div>
                  <span className="rounded-full border border-current/20 px-2 py-1 text-xs">{t('plugins.permissions_page.constraint_count', '{{count}} 项', { count: item.count })}</span>
                </div>
                <div className="mt-2 text-sm">{item.detail}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-zinc-200 bg-white p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-zinc-900">{t('plugins.permissions_page.permission_groups_title', '顶层权限族与批量放行')}</h3>
              <p className="mt-1 text-sm text-zinc-500">
                {t('plugins.permissions_page.permission_groups_desc', '顶层权限键现在主要承担分组、批量放行和兼容旧策略的职责；真正的细粒度运行控制已经移动到上面的动作域治理区。')}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {filterOptions.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setPermissionFilter(item.key)}
                  className={`rounded-lg px-3 py-2 text-sm font-medium ${permissionFilter === item.key ? 'bg-teal-700 text-white' : 'border border-zinc-200 text-zinc-700 hover:bg-zinc-50'}`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {filteredPermissionRows.length === 0 ? (
            <div className="mt-5 rounded-lg border border-dashed border-zinc-300 bg-zinc-50 p-6 text-sm text-zinc-500">
              {t('plugins.permissions.matrix_empty', '当前还没有权限矩阵，请先读取权限快照。')}
            </div>
          ) : (
            <div className="mt-5 space-y-4">
              {governanceBridgeSummary?.enabled && (
                <div className="grid gap-3 md:grid-cols-4">
                  <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
                    <div className="text-xs text-zinc-500">{t('plugins.permissions_page.bridge_grant_rules', '动作域授予规则')}</div>
                    <div className="mt-1 text-xl font-semibold text-zinc-900">{metric(governanceBridgeSummary.granted_rule_count)}</div>
                  </div>
                  <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
                    <div className="text-xs text-zinc-500">{t('plugins.permissions_page.bridge_active_grants', '活动授予')}</div>
                    <div className="mt-1 text-xl font-semibold text-zinc-900">{metric(governanceBridgeSummary.active_grant_rule_count)}</div>
                  </div>
                  <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
                    <div className="text-xs text-zinc-500">{t('plugins.permissions_page.bridge_runtime_overrides', '运行覆盖')}</div>
                    <div className="mt-1 text-xl font-semibold text-zinc-900">{metric(governanceBridgeSummary.override_count)}</div>
                  </div>
                  <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
                    <div className="text-xs text-zinc-500">{t('plugins.permissions_page.bridge_legacy_count', '旧策略桥接')}</div>
                    <div className="mt-1 text-xl font-semibold text-zinc-900">{metric(governanceBridgeSummary.mirrored_legacy_count)}</div>
                  </div>
                </div>
              )}
              <div className="overflow-hidden rounded-xl border border-zinc-200">
                <div className="overflow-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="sticky top-0 bg-zinc-50 text-zinc-500">
                    <tr className="border-b border-zinc-200">
                      <th className="px-4 py-3 font-medium">{t('permissions.columns.permission', '权限键')}</th>
                      <th className="px-4 py-3 font-medium">{t('plugins.permissions_page.column_source_request', '来源 / 声明')}</th>
                      <th className="px-4 py-3 font-medium">{t('plugins.permissions_page.column_direction', '触发方向')}</th>
                      <th className="px-4 py-3 font-medium">{t('plugins.permissions_page.column_policy_switch', '放行开关')}</th>
                      <th className="px-4 py-3 font-medium">{t('plugins.permissions_page.column_runtime_profile', '当前运行档位')}</th>
                      <th className="px-4 py-3 font-medium">{t('permissions.columns.effective', '最终有效')}</th>
                      <th className="px-4 py-3 font-medium">{t('plugins.permissions_page.column_host_capability', '宿主能力')}</th>
                      <th className="px-4 py-3 font-medium">{t('permissions.columns.actions', '操作')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPermissionRows.map((row) => {
                      const expanded = expandedPermissionKeys.includes(row.permission_key);
                      const draftAllowed = policyDraftPermissions.includes(row.permission_key);
                      const rowDescription = translatePermissionDescription(row.permission_key);
                      const rowHostFunctions = getPermissionRowHostFunctions(row);
                      const governedActionDomains = getPermissionRowGovernedActionDomains(row);
                      const canConfigure = row.can_configure !== false;
                      const canTogglePolicy = canConfigure || draftAllowed;
                      const configBlockLabel = translateConfigBlockReason(row.config_block_reason);
                      const draftChanged = row.configured_policy_allowed !== draftAllowed;
                      const allowedButSuppressed = draftAllowed && !row.effective && (row.forced_by_sandbox || row.decision_reason === 'blocked_by_force_sandbox');
                      const configuredButProfileBlocked = row.configured_policy_allowed && !row.policy_allowed;
                      const registeredLabel = row.registered
                        ? t('plugins.permissions.registered', '已登记')
                        : t('plugins.permissions.unregistered', '未登记');

                      return (
                        <React.Fragment key={row.permission_key}>
                          <tr className="border-t border-zinc-100 align-top">
                            <td className="px-4 py-3">
                              <div className="font-semibold text-zinc-900">{translatePermissionKey(row.permission_key)}</div>
                              <div className="mt-1 text-xs text-zinc-500">{row.permission_key}</div>
                              {rowDescription && <div className="mt-2 text-xs text-zinc-500">{rowDescription}</div>}
                              <div className="mt-2 flex flex-wrap gap-2">
                                <span className={`inline-flex rounded-full border px-2 py-1 text-xs ${row.registered ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-amber-200 bg-amber-50 text-amber-800'}`}>
                                  {registeredLabel}
                                </span>
                                <span className={`inline-flex rounded-full border px-2 py-1 text-xs ${row.risk_level === 'high' ? 'border-rose-200 bg-rose-50 text-rose-700' : row.risk_level === 'medium' ? 'border-amber-200 bg-amber-50 text-amber-800' : 'border-zinc-200 bg-white text-zinc-600'}`}>
                                  {translatePermissionRisk(row.risk_level)}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex flex-col gap-2">
                                <span className={`w-fit rounded-full border px-2 py-1 text-xs ${row.request_source === 'baseline' ? 'border-sky-200 bg-sky-50 text-sky-800' : 'border-zinc-200 bg-zinc-50 text-zinc-600'}`}>
                                {translateRequestSource(row.request_source)}
                                </span>
                                <span className={`w-fit rounded-full border px-2 py-1 text-xs ${row.requested ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-zinc-200 bg-zinc-50 text-zinc-500'}`}>
                                  {t('plugins.permissions_page.plugin_requested', '插件声明请求')}：{row.requested ? t('common.yes', '是') : t('common.no', '否')}
                                </span>
                                {row.grant_status && (
                                  <span className={`w-fit rounded-full border px-2 py-1 text-xs ${row.grant_status === 'active' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-zinc-200 bg-zinc-50 text-zinc-600'}`}>
                                    {translateGrantStatus(row.grant_status)}
                                  </span>
                                )}
                                {row.grant_source && (
                                  <span className="text-xs text-zinc-500">
                                    {t('plugins.permissions_page.grant_source', '授予来源')}：{translateGrantSource(row.grant_source)}
                                  </span>
                                )}
                                {row.request_source === 'baseline' && (
                                  <span className="text-xs text-sky-700">{t('plugins.permissions_page.baseline_note', '基础宿主权限默认参与计算，但仍可关闭。')}</span>
                                )}
                                {row.mirrored_from_legacy && (
                                  <span className="text-xs text-amber-700">{t('plugins.permissions_page.legacy_bridge_note', '当前动作域信息来自旧权限策略桥接，后续会逐步改为真实动作域治理。')}</span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="font-medium text-zinc-800">{translatePermissionDirection(row.direction)}</div>
                              <div className="mt-1 text-xs text-zinc-500">{translateModule(row.module_key)}</div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex flex-col gap-2">
                                <label className={`inline-flex items-center gap-2 text-sm ${canTogglePolicy ? 'text-zinc-700' : 'text-zinc-400'}`}>
                                  <input
                                    type="checkbox"
                                    checked={draftAllowed}
                                    disabled={!canTogglePolicy || permissionsBusy}
                                    onChange={(event) => togglePolicyDraftPermission(row.permission_key, event.target.checked, governedActionDomains)}
                                  />
                                  <span>{draftAllowed ? t('plugins.permissions_page.allow', '放行') : t('plugins.permissions_page.deny', '拒绝')}</span>
                                </label>
                                {!canConfigure && configBlockLabel && (
                                  <span className="text-xs text-amber-700">
                                    {draftAllowed ? t('plugins.permissions_page.legacy_policy_can_disable_only', '这是历史策略项，可以关闭；关闭后不能重新放行，除非先登记权限键。') : configBlockLabel}
                                  </span>
                                )}
                                {draftChanged && canConfigure && (
                                  <span className="text-xs text-amber-700">
                                    {t('plugins.permissions_page.pending_policy_change', '未保存：将改为{{value}}', { value: draftAllowed ? t('plugins.permissions_page.allow', '放行') : t('plugins.permissions_page.deny', '拒绝') })}
                                  </span>
                                )}
                                <span className="text-xs text-zinc-500">
                                  {t('plugins.permissions_page.configured_policy_allowed', '配置策略允许')}：{row.configured_policy_allowed ? t('common.yes', '是') : t('common.no', '否')}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className={`font-medium ${row.policy_allowed ? 'text-emerald-700' : 'text-zinc-500'}`}>
                                {t('plugins.permissions_page.current_runtime_profile', '当前运行档位')}{row.policy_allowed ? t('plugins.permissions_page.allowed_short', '允许') : t('plugins.permissions_page.disallowed_short', '不允许')}
                              </div>
                              {configuredButProfileBlocked && (
                                <div className="mt-1 text-xs text-amber-700">
                                  {t('plugins.permissions_page.profile_blocked_note', '配置已放行，但被强制沙箱或当前档位压制。')}
                                </div>
                              )}
                              {row.forced_by_sandbox && (
                                <div className="mt-1 text-xs text-amber-700">
                                  {t('plugins.permissions.force_reason', '被强制沙箱压制')}
                                </div>
                              )}
                              {row.has_runtime_override && (
                                <div className="mt-1 text-xs text-zinc-600">
                                  {translateRuntimeOverrideState(row.runtime_enabled, row.has_runtime_override)}
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`rounded-full border px-2 py-1 text-xs ${row.effective ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-zinc-200 bg-zinc-50 text-zinc-500'}`}>
                                {row.effective ? t('common.yes', '是') : t('common.no', '否')}
                              </span>
                              <div className="text-sm text-zinc-700">{translateDecisionReason(row.decision_reason)}</div>
                              {allowedButSuppressed && (
                                <div className="mt-1 text-xs text-amber-700">
                                  {t('plugins.permissions_page.allowed_but_suppressed', '已放行但未生效，需解除强制沙箱或完成可信放行。')}
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-3 text-zinc-700">
                              <div>{t('plugins.permissions.associated_functions', '{{count}} 个宿主函数', { count: rowHostFunctions.length })}</div>
                              {governedActionDomains.length > 0 && (
                                <div className="mt-1 text-xs text-zinc-500">
                                  {t('plugins.permissions_page.action_domain_count_prefix', '动作域 {{count}} 个：', { count: governedActionDomains.length })}{governedActionDomains.slice(0, 2).map((item) => item.action_domain).join('、')}
                                  {governedActionDomains.length > 2 ? t('plugins.permissions_page.action_domain_count_suffix', ' 等 {{count}} 个', { count: governedActionDomains.length }) : ''}
                                </div>
                              )}
                              {rowHostFunctions.length > 0 ? (
                                <div className="mt-1 text-xs text-zinc-500">
                                  {rowHostFunctions.slice(0, 2).map((hostFn) => hostFn.name).join('、')}
                                  {rowHostFunctions.length > 2 ? t('plugins.permissions_page.host_function_count_suffix', ' 等 {{count}} 个', { count: rowHostFunctions.length }) : ''}
                                </div>
                              ) : (
                                <div className="mt-1 text-xs text-zinc-400">{t('plugins.permissions_page.no_host_function', '无关联宿主函数')}</div>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex flex-col gap-2">
                                <button
                                  type="button"
                                  onClick={() => toggleExpandedPermission(row.permission_key)}
                                  className="rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                                >
                                  {expanded ? t('common.close', '关闭') : t('common.open', '展开')}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => void testPermission(row.permission_key)}
                                  disabled={!selectedVersionId || permissionsBusy}
                                  className="rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:text-zinc-400"
                                >
                                  {t('plugins.permissions.probe_button', '测试权限')}
                                </button>
                              </div>
                            </td>
                          </tr>
                          {expanded && (
                            <tr className="border-t border-zinc-100 bg-zinc-50/60">
                              <td colSpan={8} className="px-4 py-4">
                                {rowHostFunctions.length === 0 && governedActionDomains.length === 0 ? (
                                  <div className="rounded-lg border border-dashed border-zinc-300 bg-white p-4 text-sm text-zinc-500">
                                    {t('plugins.permissions.no_functions', '当前权限没有关联宿主函数。')}
                                  </div>
                                ) : (
                                  <div className="space-y-4">
                                    {governedActionDomains.length > 0 && (
                                      <div className="rounded-lg border border-zinc-200 bg-white p-4">
                                        <div className="text-sm font-semibold text-zinc-800">{t('plugins.permissions_page.action_domain_detail', '动作域治理明细')}</div>
                                        <div className="mt-3 grid gap-3 xl:grid-cols-2">
                                          {governedActionDomains.map((actionDomain) => {
                                            const actionDomainKey = String(actionDomain.action_domain || '').trim().toLowerCase();
                                            const draftItem = actionDomainOverrideDrafts.find((item) => item.action_domain === actionDomainKey);
                                            const persistedMode = resolvePersistedActionDomainRuntimeMode(actionDomain);
                                            const draftMode = draftItem ? resolveActionDomainRuntimeMode(draftItem.runtime_enabled) : persistedMode;
                                            const persistedRuntimeEnabled = resolveGovernedActionDomainRuntimeEnabled(actionDomain);
                                            const draftRuntimeEnabled = !draftAllowed
                                              ? false
                                              : draftMode === 'inherit'
                                                ? persistedRuntimeEnabled
                                                : draftMode === 'enabled';
                                            const actionDomainDirty = draftMode !== persistedMode;
                                            const actionDomainToggleDisabled = permissionsBusy || !draftAllowed || !isActiveGovernedActionDomain(actionDomain);

                                            return (
                                              <div key={`${row.permission_key}-${actionDomain.action_domain}`} className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
                                                <div className="flex items-start justify-between gap-3">
                                                  <div>
                                                    <div className="font-semibold text-zinc-900">{actionDomain.action_domain}</div>
                                                    <div className="mt-1 text-xs text-zinc-500">{translateGrantSource(actionDomain.grant_source)}</div>
                                                  </div>
                                                  {actionDomain.grant_status && (
                                                    <span className={`rounded-full border px-2 py-1 text-xs ${actionDomain.grant_status === 'active' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-zinc-200 bg-white text-zinc-600'}`}>
                                                      {translateGrantStatus(actionDomain.grant_status)}
                                                    </span>
                                                  )}
                                                </div>
                                                <div className="mt-3 space-y-2">
                                                  <div className="flex flex-wrap gap-2">
                                                    {([
                                                      { mode: 'inherit', label: t('plugins.permissions_page.action_mode_inherit', '继承授予') },
                                                      { mode: 'enabled', label: t('plugins.permissions_page.action_mode_enabled', '显式允许') },
                                                      { mode: 'disabled', label: t('plugins.permissions_page.action_mode_disabled', '显式关闭') },
                                                    ] as Array<{ mode: ActionDomainRuntimeMode; label: string }>).map((option) => (
                                                      <button
                                                        key={`${actionDomain.action_domain}-${option.mode}`}
                                                        type="button"
                                                        disabled={actionDomainToggleDisabled}
                                                        onClick={() => toggleActionDomainRuntimeOverride(row.permission_key, actionDomain, option.mode)}
                                                        className={`rounded-lg border px-3 py-2 text-sm font-medium ${
                                                          draftMode === option.mode
                                                            ? 'border-teal-700 bg-teal-700 text-white'
                                                            : 'border-zinc-200 bg-white text-zinc-700'
                                                        } disabled:cursor-not-allowed disabled:border-zinc-200 disabled:bg-zinc-100 disabled:text-zinc-400`}
                                                      >
                                                        {option.label}
                                                      </button>
                                                    ))}
                                                  </div>
                                                  <div className="space-y-1 text-xs text-zinc-600">
                                                    {actionDomain.mirrored_from_legacy && <div>{t('plugins.permissions_page.source_legacy_bridge', '来源：旧策略桥接')}</div>}
                                                    <div>{translateRuntimeOverrideState(actionDomain.runtime_enabled, actionDomain.has_runtime_override)}</div>
                                                    <div>{t('plugins.permissions_page.current_saved', '当前保存')}：{actionDomainRuntimeModeLabel(persistedMode)}</div>
                                                    <div>{t('plugins.permissions_page.current_draft', '当前草稿')}：{actionDomainRuntimeModeLabel(draftMode)}</div>
                                                    <div>{t('plugins.permissions_page.current_effective', '当前生效')}：{persistedRuntimeEnabled ? t('plugins.permissions_page.runtime_allowed', '运行允许') : t('plugins.permissions_page.runtime_disabled', '运行关闭')}</div>
                                                    <div>{t('plugins.permissions_page.effect_after_save', '保存后生效')}：{draftRuntimeEnabled ? t('plugins.permissions_page.runtime_allowed', '运行允许') : t('plugins.permissions_page.runtime_disabled', '运行关闭')}</div>
                                                    {!draftAllowed && (
                                                      <div className="text-amber-700">{t('plugins.permissions_page.parent_permission_first', '请先放行上层权限键，再调整动作域运行状态；上层权限键关闭时，动作域当前不会生效。')}</div>
                                                    )}
                                                    {!isActiveGovernedActionDomain(actionDomain) && (
                                                      <div className="text-zinc-500">{t('plugins.permissions_page.grant_not_active_readonly', '当前动作域授予状态不是“已授予”，这里只展示状态，不允许修改。')}</div>
                                                    )}
                                                    {actionDomainDirty && (
                                                      <div className="text-amber-700">{t('plugins.permissions_page.pending_mode_change', '未保存：将改为{{value}}', { value: actionDomainRuntimeModeLabel(draftMode) })}</div>
                                                    )}
                                                  </div>
                                                </div>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    )}
                                    {rowHostFunctions.length > 0 && (
                                      <div className="grid gap-3 xl:grid-cols-2">
                                        {rowHostFunctions.map((hostFunction) => (
                                      <div key={`${row.permission_key}-${hostFunction.name}`} className="rounded-lg border border-zinc-200 bg-white p-4">
                                        <div className="flex items-start justify-between gap-3">
                                          <div>
                                            <div className="font-semibold text-zinc-900">
                                              {translateHostFunctionLabel(hostFunction.i18n_key, hostFunction.name)}
                                            </div>
                                            <div className="mt-1 text-xs text-zinc-500">{hostFunction.name}</div>
                                          </div>
                                          <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2 py-1 text-xs text-zinc-600">
                                            {translateModule(`permissions.modules.${sanitizeI18nSegment(hostFunction.module)}`)}
                                          </span>
                                        </div>
                                        <div className="mt-2 text-sm text-zinc-600">
                                          {translateHostFunctionDescription(hostFunction.i18n_key, hostFunction.description || '') || hostFunction.description || '-'}
                                        </div>
                                      </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            </div>
          )}
        </section>

        <section className="rounded-xl border border-zinc-200 bg-white p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-zinc-900">宿主映射与诊断</h3>
              <p className="mt-1 text-sm text-zinc-500">
                权限探针、宿主函数映射和原始 JSON 统一放到诊断层，日常治理尽量在上面的总览、动作域和权限族里完成。
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsAdvancedPolicyOpen((current) => !current)}
              className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            >
              {isAdvancedPolicyOpen ? <ChevronUp className="h-4 w-4 text-zinc-500" /> : <ChevronDown className="h-4 w-4 text-zinc-500" />}
              {isAdvancedPolicyOpen ? '收起原始 JSON' : '展开原始 JSON'}
            </button>
          </div>

          <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
              <h4 className="text-sm font-semibold text-zinc-900">{t('plugins.permissions.quick_probe_title', '权限探针')}</h4>
              <p className="mt-1 text-sm text-zinc-500">
                {t(
                  'plugins.permissions.quick_probe_description',
                  '测试运行时最终有效权限，而不是只检查策略 allowed_permissions 是否包含该权限。',
                )}
              </p>
              <div className="mt-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_180px]">
                <select value={permissionProbe} onChange={(event) => setPermissionProbe(event.target.value)} className="h-11 rounded-lg border border-zinc-200 px-3 text-sm outline-none focus:border-teal-500">
                  <option value="">{t('common.select', '请选择')}</option>
                  {probeOptions.map((item) => (
                    <option key={item} value={item}>{translatePermissionKey(item)}</option>
                  ))}
                </select>
                <button type="button" onClick={() => void testPermission()} disabled={permissionsActionDisabled || !permissionProbe} className="rounded-lg bg-zinc-950 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-zinc-300">
                  {t('plugins.permissions.probe_button', '测试权限')}
                </button>
              </div>
              <div className="mt-4">
                <JsonBlock value={permissionProbeResult} empty={t('plugins.permissions.probe_empty', '暂无权限探针结果。')} />
              </div>
            </div>

            <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
              <div className="text-sm font-semibold text-zinc-900">宿主映射摘要</div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div className="rounded-lg border border-zinc-200 bg-white p-3">
                  <div className="text-xs text-zinc-500">宿主函数总数</div>
                  <div className="mt-1 text-xl font-semibold text-zinc-900">{uniqueHostFunctionCount}</div>
                </div>
                <div className="rounded-lg border border-zinc-200 bg-white p-3">
                  <div className="text-xs text-zinc-500">基础宿主权限</div>
                  <div className="mt-1 text-sm font-medium text-zinc-900">
                    {baselinePermissions.length > 0 ? baselinePermissions.map((item) => translatePermissionKey(item)).join('、') : '暂无'}
                  </div>
                </div>
              </div>
              <div className="mt-4 rounded-lg border border-zinc-200 bg-white p-3 text-sm text-zinc-600">
                宿主函数仍然只作为映射说明和诊断对象，不单独成为授权开关；最终治理单位仍然是顶层权限键与动作域。
              </div>
            </div>
          </div>

          {isAdvancedPolicyOpen && (
            <div className="mt-5 grid gap-5 xl:grid-cols-3">
              <div>
                <div className="mb-2 text-sm font-semibold text-zinc-800">{t('plugins.permissions.requested_raw', '请求权限 JSON')}</div>
                <JsonBlock value={requestedPermissions} empty={t('plugins.permissions.requested_raw_empty', '尚未读取请求权限')} />
              </div>
              <div>
                <div className="mb-2 text-sm font-semibold text-zinc-800">{t('plugins.permissions.effective_raw', '有效权限 JSON')}</div>
                <JsonBlock value={effectivePermissions} empty={t('plugins.permissions.effective_raw_empty', '尚未读取有效权限')} />
              </div>
              <div>
                <div className="mb-2 text-sm font-semibold text-zinc-800">{t('plugins.permissions.policy_raw', '策略 JSON')}</div>
                <textarea
                  value={policyJson}
                  onChange={(event) => {
                    const nextValue = event.target.value;
                    setPolicyJson(nextValue);
                    setPolicyDraftDirty(true);
                    try {
                      const nextPolicy = parseObjectJson(nextValue, t('plugins.permissions.policy_raw', '策略 JSON'));
                      setPolicyJsonError('');
                      if (Array.isArray(nextPolicy.allowed_permissions)) {
                        setPolicyDraftPermissions(nextPolicy.allowed_permissions.map((item) => String(item)).sort((a, b) => a.localeCompare(b)));
                      }
                      if (Array.isArray(nextPolicy.action_domain_overrides)) {
                        setActionDomainOverrideDrafts(normalizeActionDomainOverrideDrafts(nextPolicy.action_domain_overrides));
                      }
                    } catch (err) {
                      setPolicyJsonError(t('plugins.permissions.policy_json_invalid', '高级策略 JSON 格式不正确：{{error}}', { error: toErrorMessage(err) }));
                    }
                  }}
                  rows={18}
                  className="w-full rounded-lg border border-zinc-200 px-3 py-2 font-mono text-xs outline-none focus:border-teal-500"
                />
                {policyJsonError && (
                  <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {policyJsonError}
                  </div>
                )}
                <button type="button" onClick={() => void savePolicy({ advanced: true })} disabled={permissionsActionDisabled} className="mt-3 rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-zinc-300">
                  {t('plugins.permissions.save_advanced', '保存高级策略')}
                </button>
              </div>
            </div>
          )}
        </section>
        </div>
      </div>
    );
  }
  function renderAuditTab() {
    const auditBusy = Boolean(auditState.loadingAction);
    const auditActionDisabledReason = selectedVersionIssue || (auditBusy ? t('plugins.audit_page.busy_with_action', '正在{{action}}', { action: auditState.loadingAction }) : '');
    const auditActionDisabled = Boolean(auditActionDisabledReason);
    const sourceAuditError = extractResultError(sourceAudit);
    const conversionError = extractResultError(conversionInfo);
    const diagnosticsError = extractResultError(diagnosticResult);
    const sourceOrigin = typeof sourceAudit?.source_origin === 'string' ? sourceAudit.source_origin : '';
    const sourceArchiveError = typeof sourceAudit?.archive_error === 'string' ? sourceAudit.archive_error : '';
    const sourceReason = typeof sourceAudit?.reason === 'string' ? sourceAudit.reason : '';
    const sourceFallbackReason = typeof sourceAudit?.fallback_reason === 'string' ? sourceAudit.fallback_reason : '';
    const sourceArtifactSummary = sourceAuditError && conversionError
      ? { tone: 'border-rose-200 bg-rose-50 text-rose-700', message: t('plugins.audit_page.source_artifact_both_failed', '源码与产物都读取失败，请先检查归档、转换产物和旧记录兼容链路。') }
      : sourceAuditError
        ? { tone: 'border-amber-200 bg-amber-50 text-amber-900', message: t('plugins.audit_page.source_limited', '已读取产物摘要，但源码受限或缺失。') }
        : conversionError
          ? { tone: 'border-amber-200 bg-amber-50 text-amber-900', message: t('plugins.audit_page.artifact_unavailable', '已读取源码，但产物摘要不可用。') }
          : { tone: 'border-emerald-200 bg-emerald-50 text-emerald-700', message: t('plugins.audit_page.source_artifact_ok', '源码与产物可分别查看，当前没有结构化读取错误。') };

    return (
      <div className="space-y-6">
        <section className="rounded-xl border border-zinc-200 bg-white p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-zinc-900">{t('plugins.audit_page.title', '安全审计')}</h2>
              <p className="mt-1 text-sm text-zinc-500">{t('plugins.audit_page.description', '这里放扫描结果、审核队列、WASM 转换、源码与产物摘要，以及管理员诊断入口。')}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => void loadSourceAndArtifact()} disabled={auditActionDisabled} className="rounded-lg border border-teal-700 px-4 py-2 text-sm font-semibold text-teal-700 disabled:cursor-not-allowed disabled:border-zinc-200 disabled:text-zinc-400">
                {auditState.loadingAction === t('plugins.audit_page.load_source_and_artifact', '读取源码与产物') ? t('common.loading', '加载中...') : t('plugins.audit_page.load_source_and_artifact', '读取源码与产物')}
              </button>
              <button type="button" onClick={() => void loadDiagnostics()} disabled={auditActionDisabled} className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-700 disabled:cursor-not-allowed disabled:text-zinc-400">
                {auditState.loadingAction === t('plugins.audit_page.load_diagnostics', '读取诊断信息') ? t('common.loading', '加载中...') : t('plugins.audit_page.load_diagnostics', '读取诊断信息')}
              </button>
            </div>
          </div>

          <PanelFeedback state={auditState} loadingLabel={t('plugins.audit_page.loading', '正在执行安全审计动作')} />
          <div className="mb-4 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-600">
            {t('plugins.audit_page.request_version', '本次审计请求版本')}：{selectedVersionId ? `#${selectedVersionId}` : t('plugins.audit_page.unselected', '未选择')}
            {auditActionDisabledReason ? `；${t('plugins.audit_page.not_actionable', '当前不可操作')}：${auditActionDisabledReason}` : ''}
          </div>

          <div className={`mt-4 rounded-lg border px-4 py-3 text-sm ${sourceArtifactSummary.tone}`}>
            {sourceArtifactSummary.message}
          </div>

          <div className="mt-5 flex flex-wrap gap-2 text-sm">
            <span className={`rounded-full border px-3 py-1 ${statusTone(currentTrustState)}`}>{t('plugins.audit_page.trust_state', '可信状态')}：{trustLabel(currentTrustState)}</span>
            <span className={`rounded-full border px-3 py-1 ${statusTone(currentVersion?.risk_level)}`}>{t('plugins.audit_page.risk_level', '风险级别')}：{statusLabel(currentVersion?.risk_level || 'pending')}</span>
            <span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-zinc-700">{t('plugins.audit_page.scan_summary', '扫描结论')}：{currentVersion?.scan_summary || t('plugins.audit_page.empty', '暂无')}</span>
            <span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-zinc-700">{t('plugins.audit_page.pending_reviews', '待处理审核')}：{pendingReviewCount}</span>
          </div>

          <div className="mt-5 grid gap-5 xl:grid-cols-2">
            <div>
              <div className="mb-2 text-sm font-semibold text-zinc-800">{t('plugins.audit_page.conversion_info', '转换信息')}</div>
              {conversionError && (
                <div className="mb-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                  {t('plugins.audit_page.conversion_failed', '产物摘要读取失败')}：{conversionError}
                </div>
              )}
              <JsonBlock value={conversionInfo} empty={t('plugins.audit_page.conversion_empty', '暂无转换信息')} />
            </div>
            <div>
              <div className="mb-2 text-sm font-semibold text-zinc-800">{t('plugins.audit_page.source_and_artifact', '源码与产物')}</div>
              {sourceOrigin === 'encrypted_archive' && (
                <div className="mb-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                  {t('plugins.audit_page.source_origin_encrypted', '源码来源：加密归档。')}
                </div>
              )}
              {sourceOrigin === 'raw_fallback' && (
                <div className="mb-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                  {t('plugins.audit_page.source_origin_fallback', '源码来源：原始源码回退。加密归档读取失败后，系统已回退到原始源码或原始上传包。')}
                  {sourceArchiveError ? ` ${t('plugins.audit_page.archive_error', '归档失败原因')}：${sourceArchiveError}` : ''}
                </div>
              )}
              {(sourceReason || sourceFallbackReason) && (
                <div className="mb-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700">
                  {t('plugins.audit_page.structured_reason', '结构化根因')}：{sourceReasonLabel(sourceFallbackReason || sourceReason)}
                </div>
              )}
              {sourceAuditError && (
                <div className="mb-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                  {t('plugins.audit_page.source_read_failed', '源码读取失败')}：{sourceAuditError}
                </div>
              )}
              <JsonBlock value={sourceAudit} empty={t('plugins.audit_page.source_empty', '尚未读取源码与产物')} />
            </div>
            <div>
              <div className="mb-2 text-sm font-semibold text-zinc-800">{t('plugins.audit_page.review_records', '当前版本审核记录')}</div>
              <JsonBlock value={latestReview || reviews} empty={t('plugins.audit_page.review_records_empty', '暂无审核记录')} />
            </div>
            <div>
              <div className="mb-2 text-sm font-semibold text-zinc-800">{t('plugins.audit_page.runtime_pool_and_diagnostics', '运行池与诊断')}</div>
              {diagnosticsError && (
                <div className="mb-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                  {t('plugins.audit_page.diagnostics_failed', '诊断接口返回失败')}：{diagnosticsError}
                </div>
              )}
              {!poolMetrics && !diagnosticResult && (
                <div className="mb-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-600">
                  {t('plugins.audit_page.no_runtime_pool', '暂无运行池数据，可能是当前版本未进入运行态或运行池未启用。')}
                </div>
              )}
              <JsonBlock value={{ pool_metrics: poolMetrics || t('plugins.audit_page.no_runtime_pool', '暂无运行池数据，可能是当前版本未进入运行态或运行池未启用。'), diagnostics: diagnosticResult || t('plugins.audit_page.no_diagnostics', '暂无诊断结果') }} empty={t('plugins.audit_page.no_diagnostics', '暂无诊断结果')} />
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-zinc-200 bg-white p-5">
          <div className="flex items-center gap-2 text-lg font-semibold text-zinc-900">
            <ShieldCheck className="h-5 w-5 text-teal-700" />
            {t('plugins.audit_page.review_and_admin_test', '审核队列与管理员测试')}
          </div>
          <p className="mt-1 text-sm text-zinc-500">{t('plugins.audit_page.review_and_admin_test_desc', '未放行版本默认只能在沙箱内运行。审核动作和管理员测试都留在这里，避免和日常调用混在一起。')}</p>

          <div className="mt-4 grid gap-4 xl:grid-cols-2">
            <div className="rounded-lg border border-zinc-200 p-4">
              <div className="text-sm font-semibold text-zinc-800">{t('plugins.audit_page.review_actions', '审核动作')}</div>
              <div className="mt-2 text-sm text-zinc-500">{t('plugins.audit_page.review_actions_desc', '审核备注 / 原因会复用治理确认输入框内容。')}</div>
              <div className="mt-4 flex flex-wrap gap-3">
                <button type="button" onClick={() => void approveLatestReview()} disabled={!latestReview || auditBusy} className="rounded-lg border border-emerald-200 px-4 py-2 text-sm font-semibold text-emerald-700 disabled:cursor-not-allowed disabled:border-zinc-200 disabled:text-zinc-400">{t('plugins.audit_page.approve_review', '审核通过')}</button>
                <button type="button" onClick={() => void rejectLatestReview()} disabled={!latestReview || auditBusy} className="rounded-lg border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-700 disabled:cursor-not-allowed disabled:border-zinc-200 disabled:text-zinc-400">{t('plugins.audit_page.reject_review', '审核拒绝')}</button>
              </div>
              <div className="mt-4 text-sm text-zinc-600">{t('plugins.audit_page.latest_review_comment', '最近审核意见')}：{currentVersion?.review_comment || latestReview?.review_comment || t('plugins.audit_page.empty', '暂无')}</div>
            </div>

            <div className="rounded-lg border border-zinc-200 p-4">
              <div className="text-sm font-semibold text-zinc-800">{t('plugins.audit_page.admin_sandbox_test', '管理员沙箱测试')}</div>
              <div className="mt-3 grid gap-3 md:grid-cols-3">
                <input value={testInvokeConfig.timeout_ms} onChange={(event) => setTestInvokeConfig((current) => ({ ...current, timeout_ms: event.target.value }))} placeholder="timeout_ms" className="h-11 rounded-lg border border-zinc-200 px-3 text-sm outline-none focus:border-teal-500" />
                <input value={testInvokeConfig.force_target} onChange={(event) => setTestInvokeConfig((current) => ({ ...current, force_target: event.target.value }))} placeholder="force_target" className="h-11 rounded-lg border border-zinc-200 px-3 text-sm outline-none focus:border-teal-500" />
                <input value={testInvokeConfig.force_profile} onChange={(event) => setTestInvokeConfig((current) => ({ ...current, force_profile: event.target.value }))} placeholder="force_profile" className="h-11 rounded-lg border border-zinc-200 px-3 text-sm outline-none focus:border-teal-500" />
              </div>
              <label className="mt-3 flex items-center gap-2 text-sm text-zinc-700">
                <input type="checkbox" checked={testInvokeConfig.enable_trace} onChange={(event) => setTestInvokeConfig((current) => ({ ...current, enable_trace: event.target.checked }))} />
                {t('plugins.audit_page.enable_trace', '开启 trace')}
              </label>
              <button type="button" onClick={() => void runAdminSandboxTest()} disabled={!selectedVersionId || auditBusy} className="mt-4 inline-flex h-11 items-center gap-2 rounded-lg bg-zinc-950 px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-zinc-300">
                <Activity className="h-4 w-4" />
                {t('plugins.audit_page.run_admin_test', '执行管理员测试')}
              </button>
            </div>
          </div>
        </section>
      </div>
    );
  }

  function renderGovernanceTab() {
    const versionConfirmValue = selectedVersionId ? String(selectedVersionId) : '-';
    const pluginConfirmValue = selectedPlugin?.name || '-';
    const governanceBusy = Boolean(governanceState.loadingAction);

    return (
      <div className="space-y-6">
        <section className="rounded-xl border border-zinc-200 bg-white p-5">
          <h2 className="text-lg font-semibold text-zinc-900">{t('plugins.governance_page.title', '治理管理')}</h2>
          <p className="mt-1 text-sm text-zinc-500">{t('plugins.governance_page.description', '删除、禁用、封禁这些高风险动作集中在这里，避免在日常操作页里来回切换。')}</p>

          <PanelFeedback state={governanceState} loadingLabel={t('plugins.governance_page.loading', '正在执行治理动作')} />

          <div className="mt-5 grid gap-5 xl:grid-cols-2">
            <div className="rounded-lg border border-zinc-200 p-4">
              <div className="text-sm font-semibold text-zinc-800">{t('plugins.governance_page.plugin_lifecycle', '插件生命周期')}</div>
              <div className="mt-2 text-sm text-zinc-500">{t('plugins.governance_page.current_status', '当前状态')}：{lifeLabel(currentLifecycle)}</div>
              <div className="mt-4 flex flex-wrap gap-3">
                <button type="button" onClick={() => void disableSelectedPlugin()} disabled={!selectedPluginId || governanceBusy} className="rounded-lg border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-700 disabled:cursor-not-allowed disabled:border-zinc-200 disabled:text-zinc-400">{t('plugins.governance_page.disable_plugin', '禁用插件')}</button>
                <button type="button" onClick={() => void enableSelectedPlugin()} disabled={!selectedPluginId || governanceBusy} className="rounded-lg border border-emerald-200 px-4 py-2 text-sm font-semibold text-emerald-700 disabled:cursor-not-allowed disabled:border-zinc-200 disabled:text-zinc-400">{t('plugins.governance_page.enable_plugin', '恢复插件')}</button>
              </div>
            </div>

            <div className="rounded-lg border border-zinc-200 p-4">
              <div className="text-sm font-semibold text-zinc-800">{t('plugins.governance_page.version_trust_governance', '版本可信治理')}</div>
              <div className="mt-2 text-sm text-zinc-500">{t('plugins.governance_page.current_trust_state', '当前可信状态')}：{trustLabel(currentTrustState)}</div>
              <div className="mt-4 flex flex-wrap gap-3">
                <button type="button" onClick={() => void banSelectedVersion()} disabled={!selectedVersionId || governanceBusy} className="rounded-lg border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-700 disabled:cursor-not-allowed disabled:border-zinc-200 disabled:text-zinc-400">{t('plugins.governance_page.ban_version', '封禁版本')}</button>
                <button type="button" onClick={() => void unbanSelectedVersion()} disabled={!selectedVersionId || governanceBusy} className="rounded-lg border border-emerald-200 px-4 py-2 text-sm font-semibold text-emerald-700 disabled:cursor-not-allowed disabled:border-zinc-200 disabled:text-zinc-400">{t('plugins.governance_page.unban_version', '解封版本')}</button>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-zinc-200 bg-white p-5">
          <div className="flex items-center gap-2 text-lg font-semibold text-zinc-900">
            <Trash2 className="h-5 w-5 text-rose-600" />
            {t('plugins.governance_page.delete_confirmation', '删除确认')}
          </div>
          <p className="mt-1 text-sm text-zinc-500">{t('plugins.governance_page.delete_confirmation_desc', '删除版本前必须先退出运行态。删除版本请输入版本 ID；删除插件请输入插件名称。封禁 / 禁用理由也会复用这个输入框。')}</p>
          {runtimeDeleteBlocked && (
            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              {t('plugins.governance_page.runtime_delete_blocked', '当前版本仍处于 {{status}}，请先回到“状态总览”执行“退出运行态”。', { status: translateStatus(currentStatusSnapshot.runtime_status) })}
            </div>
          )}
          <input
            value={governanceConfirm}
            onChange={(event) => setGovernanceConfirm(event.target.value)}
            placeholder={t('plugins.governance_page.delete_confirmation_placeholder', '删除版本输入 {{versionId}}；删除插件输入 {{pluginName}}', { versionId: versionConfirmValue, pluginName: pluginConfirmValue })}
            className="mt-4 h-11 w-full rounded-lg border border-zinc-200 px-3 text-sm outline-none focus:border-teal-500"
          />

          <div className="mt-5 grid gap-4 xl:grid-cols-2">
            <button type="button" onClick={() => void deleteSelectedVersion()} disabled={!selectedVersionId || governanceBusy || runtimeDeleteBlocked} className="rounded-lg border border-rose-200 px-4 py-3 text-sm font-semibold text-rose-700 disabled:cursor-not-allowed disabled:border-zinc-200 disabled:text-zinc-400">{t('plugins.governance_page.delete_version_button', '删除版本 #{{versionId}}', { versionId: versionConfirmValue })}</button>
            <button type="button" onClick={() => void deleteSelectedPlugin()} disabled={!selectedPluginId || governanceBusy} className="rounded-lg border border-rose-200 px-4 py-3 text-sm font-semibold text-rose-700 disabled:cursor-not-allowed disabled:border-zinc-200 disabled:text-zinc-400">{t('plugins.governance_page.soft_delete_plugin', '软删除插件')}</button>
          </div>
        </section>
      </div>
    );
  }

  function renderTabBody() {
    if (activeTab === 'status') return renderStatusTab();
    if (activeTab === 'invoke') return renderInvokeTab();
    if (activeTab === 'permissions') return renderPermissionsTab();
    if (activeTab === 'audit') return renderAuditTab();
    return renderGovernanceTab();
  }
  return (
    <div className="plugins-console-theme h-[calc(100vh-8rem)] min-h-0 overflow-hidden">
      {showCreatePlugin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/45 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-zinc-900">{t('plugins.modal.title', '创建插件')}</h2>
                <p className="mt-1 text-sm text-zinc-500">
                  {t(
                    'plugins.modal.description',
                    '这里只创建插件元数据；版本草稿、上传创建、准备版本和进入运行态仍在状态总览中处理。',
                  )}
                </p>
              </div>
              <button type="button" onClick={() => setShowCreatePlugin(false)} className="rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-50">{t('common.close', '关闭')}</button>
            </div>
            <div className="mt-4">
              <PanelFeedback state={sidebarState} loadingLabel={t('plugins.modal.title', '创建插件')} />
            </div>
            <div className="mt-5 space-y-4">
              <input value={newPlugin.name} onChange={(event) => setNewPlugin((current) => ({ ...current, name: event.target.value }))} placeholder={t('plugins.modal.name_placeholder', '插件名称')} className="h-11 w-full rounded-lg border border-zinc-200 px-3 text-sm outline-none focus:border-teal-500" />
              <textarea value={newPlugin.description} onChange={(event) => setNewPlugin((current) => ({ ...current, description: event.target.value }))} placeholder={t('plugins.modal.description_placeholder', '插件描述')} rows={5} className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-teal-500" />
            </div>
            <div className="mt-5 flex justify-end gap-3">
              <button type="button" onClick={() => setShowCreatePlugin(false)} className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50">{t('common.cancel', '取消')}</button>
              <button type="button" onClick={() => void createPlugin()} disabled={Boolean(sidebarState.loadingAction)} className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-zinc-300">
                {sidebarState.loadingAction === t('plugins.runtime.create_plugin', '创建插件') ? t('common.loading', '加载中...') : t('plugins.modal.submit', '创建插件')}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid h-full min-h-0 gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="min-h-0 overflow-hidden rounded-2xl border border-zinc-200 bg-white">
          <div className="flex h-full min-h-0 flex-col">
            <div className="shrink-0 border-b border-zinc-200 p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-bold text-zinc-900">{t('plugins.list.title', '插件列表')}</h2>
                  <p className="mt-1 text-sm text-zinc-500">{t('plugins.list.total', '总数：{{count}}', { count: pluginTotal })}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    title={isBatchMode ? t('plugins.list.batch_mode_disable', '退出批量模式') : t('plugins.list.batch_mode_enable', '进入批量模式')}
                    aria-label={isBatchMode ? t('plugins.list.batch_mode_disable', '退出批量模式') : t('plugins.list.batch_mode_enable', '进入批量模式')}
                    onClick={() => setIsBatchMode((current) => !current)}
                    className={`inline-flex h-10 items-center rounded-lg border px-3 text-sm font-medium ${isBatchMode ? 'border-teal-600 bg-teal-50 text-teal-700' : 'border-zinc-200 text-zinc-600 hover:bg-zinc-50'}`}
                  >
                    {t('plugins.list.batch_mode_label', '批量')}
                  </button>
                  <button type="button" title={t('plugins.list.create', '创建插件')} aria-label={t('plugins.list.create', '创建插件')} onClick={() => setShowCreatePlugin(true)} className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-50">
                    <PackagePlus className="h-4 w-4" />
                  </button>
                  <button type="button" title={t('plugins.list.refresh', '刷新插件')} aria-label={t('plugins.list.refresh', '刷新插件')} onClick={() => void loadPlugins()} disabled={Boolean(sidebarState.loadingAction)} className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:text-zinc-300">
                    <RefreshCw className={`h-4 w-4 ${sidebarState.loadingAction === '刷新插件列表' ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t('plugins.list.search_placeholder', '按名称或描述筛选')} className="mt-4 h-11 w-full rounded-lg border border-zinc-200 px-3 text-sm outline-none focus:border-teal-500" />
              {isBatchMode && (
                <div className="mt-3 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-600">
                  {t('plugins.list.batch_mode_selected_summary', '已勾选 {{count}} 个插件。批量保存运行偏好时，会自动展开为这些插件下的全部版本。', { count: batchSelectedPluginIds.length })}
                </div>
              )}
              <PanelFeedback state={sidebarState} loadingLabel={t('plugins.list.title', '插件列表')} />
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              <div className="space-y-3">
                {filteredPlugins.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-6 text-sm text-zinc-500">
                    {t('plugins.list.empty', '没有匹配当前筛选条件的插件。')}
                  </div>
                ) : (
                  filteredPlugins.map((plugin) => {
                    const isActive = plugin.id === selectedPluginId;
                    const batchChecked = batchSelectedPluginIds.includes(plugin.id);
                    const trustSummary = isRecord(plugin.trust_summary) ? plugin.trust_summary : {};
                    return (
                      <div key={plugin.id} className="flex items-start gap-2">
                        {isBatchMode && (
                          <label className="mt-3 inline-flex h-5 w-5 shrink-0 items-center justify-center">
                            <input
                              type="checkbox"
                              checked={batchChecked}
                              onChange={(event) => toggleBatchPlugin(plugin.id, event.target.checked)}
                              aria-label={t('plugins.list.select_plugin_checkbox', '勾选插件 {{name}}', { name: plugin.name })}
                            />
                          </label>
                        )}
                        <button
                          type="button"
                          onClick={() => setSelectedPluginId(plugin.id)}
                          className={`w-full rounded-xl border p-3 text-left transition ${isActive ? 'border-teal-500 bg-teal-50' : 'border-zinc-200 bg-white hover:border-teal-300 hover:bg-zinc-50'}`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="truncate text-base font-semibold text-zinc-900">{plugin.name}</div>
                              <div className="mt-1 truncate text-sm text-zinc-500">{plugin.description || t('plugins.list.no_description', '暂无描述')}</div>
                            </div>
                            <div className="text-xs text-zinc-500">#{plugin.id}</div>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2 text-xs">
                            <span className={`rounded-full border px-2 py-1 ${statusTone(plugin.lifecycle_status)}`}>{translateLifecycle(plugin.lifecycle_status)}</span>
                            <span className="rounded-full border border-zinc-200 bg-white px-2 py-1 text-zinc-600">
                              {t('plugins.list.trusted_summary', '可信 {{trusted}} / 封禁 {{banned}}', {
                                trusted: metric(trustSummary.trusted),
                                banned: metric(trustSummary.banned),
                              })}
                            </span>
                            {isBatchMode && batchChecked && (
                              <span className="rounded-full border border-teal-200 bg-teal-50 px-2 py-1 text-teal-700">{t('plugins.list.batch_selected_badge', '已勾选批量')}</span>
                            )}
                          </div>
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </aside>

        <section className="min-h-0 overflow-hidden">
          <div className="flex h-full min-h-0 flex-col gap-4">
            <div className="shrink-0 overflow-x-auto rounded-2xl border border-zinc-200 bg-white px-3 py-2">
              <div className="flex min-w-max items-center gap-2">
                {pluginTabs.map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={(event) => {
                      event.preventDefault();
                      setActiveTab(tab.key);
                    }}
                    className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${activeTab === tab.key ? 'bg-teal-700 text-white' : 'text-zinc-700 hover:bg-zinc-100'}`}
                  >
                    {tab.label}
                  </button>
                ))}
                <div className="ml-auto flex items-center gap-2">
                  <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2">
                    <div className="text-[11px] text-zinc-500">{t('plugins.context.current_plugin', '当前插件')}</div>
                    <div className="max-w-[220px] truncate text-sm font-semibold text-zinc-900">
                      {selectedPlugin?.name || t('plugins.context.select_plugin', '请选择插件')}
                    </div>
                  </div>
                  <label className="relative rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-right">
                    <div className="text-[11px] text-zinc-500">{t('plugins.context.current_version', '当前版本')}</div>
                    <select
                      value={selectedVersionId ?? ''}
                      onChange={(event) => {
                        const nextValue = Number(event.target.value || 0);
                        setSelectedVersionId(nextValue > 0 ? nextValue : null);
                      }}
                      disabled={!versions.length || Boolean(contextState.loadingAction)}
                      className="mt-1 min-w-[220px] appearance-none bg-transparent pr-8 text-sm font-semibold text-zinc-900 outline-none disabled:cursor-not-allowed disabled:text-zinc-400"
                    >
                      <option value="">{t('plugins.context.select_version', '请选择版本')}</option>
                      {versions.map((item) => (
                        <option key={item.id} value={item.id}>
                          {`${item.version} · #${item.id}`}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 mt-2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                  </label>
                  <button type="button" onClick={() => void refreshSnapshot()} disabled={!selectedVersionId || Boolean(snapshotState.loadingAction)} className="inline-flex h-10 items-center gap-2 rounded-lg border border-teal-700 px-3 text-sm font-semibold text-teal-700 disabled:cursor-not-allowed disabled:border-zinc-200 disabled:text-zinc-400">
                    <RefreshCw className={`h-4 w-4 ${snapshotState.loadingAction ? 'animate-spin' : ''}`} />
                    {snapshotState.loadingAction ? t('common.loading', '加载中...') : t('plugins.runtime.refresh_version_snapshot', '同步快照')}
                  </button>
                </div>
              </div>
            </div>

            <div ref={bodyScrollRef} className="min-h-0 flex-1 overflow-y-auto rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
              <PanelFeedback state={contextState} loadingLabel={t('plugins.runtime.sync_plugin_versions', '正在同步版本列表')} />
              <PanelFeedback state={snapshotState} loadingLabel={t('plugins.runtime.refresh_version_snapshot', '正在同步版本快照')} />
              <div className="mb-4 rounded-xl border border-zinc-200 bg-white px-4 py-3">
                <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                  <div className="flex min-w-0 flex-wrap gap-2">
                    <span className={`rounded-full border px-3 py-1 text-sm ${statusTone(currentStatusSnapshot.package_status)}`}>{t('plugins.context.package_status', '包状态')}：{translateStatus(currentStatusSnapshot.package_status)}</span>
                    <span className={`rounded-full border px-3 py-1 text-sm ${statusTone(currentStatusSnapshot.install_status)}`}>{t('plugins.context.install_status', '准备状态')}：{translateStatus(currentStatusSnapshot.install_status)}</span>
                    <span className={`rounded-full border px-3 py-1 text-sm ${statusTone(currentStatusSnapshot.runtime_status)}`}>{t('plugins.context.runtime_status', '运行状态')}：{translateStatus(currentStatusSnapshot.runtime_status)}</span>
                    <span className={`rounded-full border px-3 py-1 text-sm ${statusTone(currentInvokeLoadPolicy)}`}>{t('plugins.context.invoke_policy', '调用策略')}：{loadPolicyLabel(currentInvokeLoadPolicy)}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsStatusDetailsOpen((current) => !current)}
                    className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                  >
                    {isStatusDetailsOpen ? t('plugins.context.collapse_details', '收起详情') : t('plugins.context.expand_details', '展开详情')}
                    {isStatusDetailsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                </div>
                {isStatusDetailsOpen && (
                  <div className="mt-3 grid gap-2 border-t border-zinc-100 pt-3 text-sm text-zinc-700 md:grid-cols-2 xl:grid-cols-4">
                    <div>{t('plugins.context.trust_state', '可信状态')}：<span className="font-medium">{translateTrust(currentTrustState)}</span></div>
                    <div>{t('plugins.context.lifecycle', '生命周期')}：<span className="font-medium">{translateLifecycle(currentLifecycle)}</span></div>
                    <div>{t('plugins.context.load_mode_summary', '进入方式：请求 {{requested}} / 实际 {{resolved}}', { requested: modeLabel(currentRequestedLoadMode), resolved: modeLabel(currentResolvedLoadMode) })}</div>
                    <div>{t('plugins.context.execution_profile', '执行档位')}：<span className="font-medium">{translateProfile(currentProfile)}</span></div>
                    <div>{t('plugins.context.force_sandbox', '强制沙箱')}：<span className="font-medium">{forceSandbox ? t('common.yes', '是') : t('common.no', '否')}</span></div>
                    <div>{t('plugins.context.last_trigger', '最近触发')}：<span className="font-medium">{currentLoadTrigger ? loadTriggerLabel(currentLoadTrigger) : '-'}</span></div>
                  </div>
                )}
              </div>
              {currentFailedAction && (
                <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {t('plugins.context.last_action_failed', '最近动作：{{action}} 失败', { action: translateStatus(currentFailedAction.name) })}
                  {currentFailedAction.error ? ` · ${currentFailedAction.error}` : ''}
                  {currentFailedAction.at ? <div className="mt-1 text-xs">{t('plugins.ui_runtime.time_label', '时间')}：{formatTime(currentFailedAction.at)}</div> : null}
                </div>
              )}

              {renderTabBody()}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
