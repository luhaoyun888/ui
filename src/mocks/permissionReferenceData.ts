import type {
  EffectivePermissionsResponse,
  PermissionMatrixResponse,
  VersionPolicyResponse,
  PermissionRow,
} from '../services/api';

export type PermissionReferenceScenario = {
  key: string;
  name: string;
  description: string;
  matrix: PermissionMatrixResponse;
  effective: EffectivePermissionsResponse;
  policy: VersionPolicyResponse;
  requestedPermissionsPayload: Record<string, unknown>;
  probeResult: Record<string, unknown>;
};

// --- New Action Definitions ---
export const actionCategories: Record<string, string[]> = {
  'host_log': ['write_log'],
  'host_config_get': ['read_public_config', 'read_plugin_config', 'read_sensitive_config'],
  'storage:read': ['read_plugin_storage'],
  'storage:write': ['write_plugin_storage', 'delete_plugin_storage'],
  'http_client': ['public_request', 'intranet_request'],
  'fs:read': ['read_file', 'list_dir'],
  'fs:write': ['create_file', 'overwrite_file', 'delete_file_or_dir'],
  'secret': ['use_secret_ref', 'read_masked_secret', 'read_plain_secret'],
  'network': ['scan_device', 'wake_device', 'probe_status'],
  'system_action': ['dispatch_edge_task']
};

export const blockingReasons = [
  { id: 'macro_denied', label: '上层权限未放行', tip: '去 放行大类权限', targetPage: 'macro' },
  { id: 'action_closed', label: '动作被运行覆盖关闭', tip: '去 放行具体动作', targetPage: 'action' },
  { id: 'sandbox_enforced', label: '强制沙箱压制', tip: '去治理或运行模式处理', targetPage: 'diag' },
  { id: 'not_registered', label: '未登记权限', tip: '不能直接放行，要补权限注册', targetPage: 'diag' },
  { id: 'untrust_state', label: '可信状态不足', tip: '核对插件签名与发包环境', targetPage: 'diag' }
];

const baseContext = {
  version_id: 7,
  trust_state: 'review_pending',
  plugin_lifecycle_status: 'loaded',
  configured_profile: 'python-wasm',
  profile: 'python-wasm',
  configured_force_sandbox_mode: false,
  force_sandbox_mode: false,
  enabled: true,
  executor_resolved: 'python-wasm',
  source_type: 'zip',
} as const;

const baseSummary = {
  requested_count: 6,
  configured_policy_allowed_count: 3,
  policy_allowed_count: 3,
  effective_count: 3,
  denied_count: 3,
  unknown_count: 1,
} as const;

const baseGovernanceBridge = {
  enabled: true,
  granted_rule_count: 6,
  override_count: 2,
  mirrored_legacy_count: 2,
  active_grant_rule_count: 5,
} as const;

const baseRows: PermissionRow[] = [
  {
    permission_key: 'host_log',
    module_key: 'host',
    i18n_key: 'permissions.keys.host_log',
    direction: 'active_host_call',
    risk_level: 'low',
    registered: true,
    requested: true,
    request_source: 'baseline',
    configured_policy_allowed: true,
    policy_allowed: true,
    effective: true,
    decision_reason: 'baseline_default',
    forced_by_sandbox: false,
    can_configure: true,
    grant_status: 'active',
    grant_source: 'manual_review',
    mirrored_from_legacy: true,
    has_runtime_override: false,
    governed_action_domains: [
      {
        action_domain: 'write_log',
        top_permission_key: 'host_log',
        grant_status: 'active',
        grant_source: 'manual_review',
        mirrored_from_legacy: true,
        has_runtime_override: false,
        effective_runtime_enabled: true,
        setting_mode: 'default',
      },
    ],
    host_functions: [
      {
        name: 'host_log',
        module: 'host',
        permission_key: 'host_log',
        i18n_key: 'host.functions.host_log',
        description: '写入宿主日志',
        enabled: true,
      },
    ],
  },
  {
    permission_key: 'http_client',
    module_key: 'network',
    i18n_key: 'permissions.keys.http_client',
    direction: 'active_host_call',
    risk_level: 'medium',
    registered: true,
    requested: true,
    request_source: 'metadata',
    configured_policy_allowed: true,
    policy_allowed: true,
    effective: true,
    decision_reason: 'allowed_by_policy',
    forced_by_sandbox: false,
    can_configure: true,
    grant_status: 'active',
    grant_source: 'manual_review',
    mirrored_from_legacy: true,
    has_runtime_override: true,
    runtime_enabled: true,
    governed_action_domains: [
      {
        action_domain: 'public_request',
        top_permission_key: 'http_client',
        grant_status: 'active',
        grant_source: 'manual_review',
        mirrored_from_legacy: true,
        has_runtime_override: true,
        runtime_enabled: true,
        effective_runtime_enabled: true,
        setting_mode: 'default',
      },
    ],
  },
  {
    permission_key: 'fs_read',
    module_key: 'fs',
    i18n_key: 'permissions.keys.fs_read',
    direction: 'active_host_call',
    risk_level: 'high',
    registered: true,
    requested: true,
    request_source: 'runtime',
    configured_policy_allowed: false,
    policy_allowed: false,
    effective: false,
    decision_reason: 'policy_denied',
    forced_by_sandbox: true,
    can_configure: true,
    grant_status: 'denied',
    grant_source: 'security_policy',
    mirrored_from_legacy: false,
    has_runtime_override: false,
    governed_action_domains: [],
  }
];

export const scenarios: Record<string, PermissionReferenceScenario> = {
  'happy-mixed': {
    key: 'happy-mixed',
    name: 'Happy Mixed (默认)',
    description: '标准混合场景，包含已授权和未授权权限。',
    matrix: {
      context: { ...baseContext },
      summary: { ...baseSummary },
      governance_bridge: { ...baseGovernanceBridge },
      baseline_permissions: ['host_log'],
      requested_permissions: ['host_log', 'http_client', 'fs_read'],
      requested_permissions_source: 'metadata',
      requested_permissions_hash: 'hash-happy',
      configured_policy_allowed_permissions: ['host_log', 'http_client'],
      policy_allowed_permissions: ['host_log', 'http_client'],
      effective_permissions: ['host_log', 'http_client'],
      rows: [...baseRows],
    },
    effective: {
      version_id: 7,
      effective_permissions: ['host_log', 'http_client'],
      overrides: { 'http_client': true },
    },
    policy: {
      version_id: 7,
      policy_name: 'Standard Output Policy',
      last_updated: '2024-03-24T10:00:00Z',
    },
    requestedPermissionsPayload: { permissions: ['host_log', 'http_client', 'fs_read'] },
    probeResult: { status: 'check_completed', risk: 'low' },
  },
  'sandbox-blocked': {
    key: 'sandbox-blocked',
    name: 'Sandbox Blocked',
    description: '测试沙箱强制压制场景。',
    matrix: {
      context: { ...baseContext, force_sandbox_mode: true },
      summary: { ...baseSummary, effective_count: 1, denied_count: 5 },
      governance_bridge: { ...baseGovernanceBridge },
      baseline_permissions: ['host_log'],
      requested_permissions: ['host_log', 'http_client', 'fs_read'],
      requested_permissions_source: 'metadata',
      requested_permissions_hash: 'hash-blocked',
      configured_policy_allowed_permissions: ['host_log'],
      policy_allowed_permissions: ['host_log'],
      effective_permissions: ['host_log'],
      rows: baseRows.map(r => r.permission_key === 'host_log' ? r : { ...r, effective: false, decision_reason: 'sandbox_enforced' }),
    },
    effective: {
      version_id: 7,
      effective_permissions: ['host_log'],
      overrides: {},
    },
    policy: {
      version_id: 7,
      policy_name: 'Strict Sandbox Policy',
      last_updated: '2024-03-24T12:00:00Z',
    },
    requestedPermissionsPayload: { permissions: ['host_log', 'http_client', 'fs_read'] },
    probeResult: { status: 'blocked', reason: 'sandbox_violation' },
  },
};

export const getPermissionReferenceScenario = (key: string) => scenarios[key] || scenarios['happy-mixed'];
export const defaultPermissionReferenceScenario = scenarios['happy-mixed'];
