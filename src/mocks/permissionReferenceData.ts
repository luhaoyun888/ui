import type {
  EffectivePermissionsResponse,
  PermissionMatrixResponse,
  VersionPolicyResponse,
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

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

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

const baselinePermissions = ['host_log', 'host_config_get'];
const requestedPermissions = ['host_log', 'host_config_get', 'http_client', 'fs:read', 'system_action', 'secret'];
const configuredPolicyAllowedPermissions = ['host_log', 'host_config_get', 'http_client'];
const policyAllowedPermissions = ['host_log', 'host_config_get', 'http_client'];
const effectivePermissions = ['host_log', 'host_config_get', 'http_client'];

const baseMatrix: PermissionMatrixResponse = {
  context: { ...baseContext },
  summary: { ...baseSummary },
  governance_bridge: { ...baseGovernanceBridge },
  baseline_permissions: [...baselinePermissions],
  requested_permissions: [...requestedPermissions],
  requested_permissions_source: 'metadata',
  requested_permissions_hash: 'mock-requested-sha256-happy',
  configured_policy_allowed_permissions: [...configuredPolicyAllowedPermissions],
  policy_allowed_permissions: [...policyAllowedPermissions],
  effective_permissions: [...effectivePermissions],
  rows: [
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
      permission_key: 'host_config_get',
      module_key: 'host',
      i18n_key: 'permissions.keys.host_config_get',
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
      mirrored_from_legacy: false,
      has_runtime_override: false,
      governed_action_domains: [
        {
          action_domain: 'read_public_config',
          top_permission_key: 'host_config_get',
          grant_status: 'active',
          grant_source: 'manual_review',
          mirrored_from_legacy: false,
          has_runtime_override: false,
          effective_runtime_enabled: true,
        },
        {
          action_domain: 'read_plugin_scoped_config',
          top_permission_key: 'host_config_get',
          grant_status: 'active',
          grant_source: 'manual_review',
          mirrored_from_legacy: false,
          has_runtime_override: false,
          effective_runtime_enabled: true,
        },
      ],
      host_functions: [
        {
          name: 'host_config_get',
          module: 'host',
          permission_key: 'host_config_get',
          i18n_key: 'host.functions.host_config_get',
          description: '读取宿主配置',
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
        },
        {
          action_domain: 'private_network_request',
          top_permission_key: 'http_client',
          grant_status: 'active',
          grant_source: 'manual_review',
          mirrored_from_legacy: false,
          has_runtime_override: true,
          runtime_enabled: false,
          effective_runtime_enabled: false,
        },
      ],
      host_functions: [
        {
          name: 'host_http_request',
          module: 'network',
          permission_key: 'http_client',
          i18n_key: 'host.functions.host_http_request',
          description: '发起外部 HTTP 请求',
          enabled: true,
        },
      ],
    },
    {
      permission_key: 'fs:read',
      module_key: 'filesystem',
      i18n_key: 'permissions.keys.fs:read',
      direction: 'active_host_call',
      risk_level: 'high',
      registered: true,
      requested: true,
      request_source: 'metadata',
      configured_policy_allowed: false,
      policy_allowed: false,
      effective: false,
      decision_reason: 'blocked_by_policy',
      forced_by_sandbox: false,
      can_configure: true,
      config_block_reason: 'policy_denied',
      grant_status: 'active',
      grant_source: 'manual_review',
      mirrored_from_legacy: false,
      has_runtime_override: false,
      governed_action_domains: [
        {
          action_domain: 'read_file',
          top_permission_key: 'fs:read',
          grant_status: 'active',
          grant_source: 'manual_review',
          mirrored_from_legacy: false,
          has_runtime_override: false,
          effective_runtime_enabled: false,
        },
        {
          action_domain: 'list_directory',
          top_permission_key: 'fs:read',
          grant_status: 'active',
          grant_source: 'manual_review',
          mirrored_from_legacy: false,
          has_runtime_override: false,
          effective_runtime_enabled: false,
        },
      ],
      host_functions: [
        {
          name: 'host_fs_read_file',
          module: 'filesystem',
          permission_key: 'fs:read',
          i18n_key: 'host.functions.host_fs_read_file',
          description: '读取文件',
          enabled: false,
        },
      ],
    },
    {
      permission_key: 'system_action',
      module_key: 'system',
      i18n_key: 'permissions.keys.system_action',
      direction: 'active_host_call',
      risk_level: 'critical',
      registered: true,
      requested: true,
      request_source: 'metadata',
      configured_policy_allowed: false,
      policy_allowed: false,
      effective: false,
      decision_reason: 'blocked_by_policy',
      forced_by_sandbox: false,
      can_configure: true,
      config_block_reason: 'requires_admin_review',
      grant_status: 'active',
      grant_source: 'dual_review',
      mirrored_from_legacy: false,
      has_runtime_override: true,
      runtime_enabled: false,
      governed_action_domains: [
        {
          action_domain: 'network_scan',
          top_permission_key: 'system_action',
          grant_status: 'active',
          grant_source: 'dual_review',
          mirrored_from_legacy: false,
          has_runtime_override: true,
          runtime_enabled: false,
          effective_runtime_enabled: false,
        },
        {
          action_domain: 'device_probe',
          top_permission_key: 'system_action',
          grant_status: 'active',
          grant_source: 'dual_review',
          mirrored_from_legacy: false,
          has_runtime_override: true,
          runtime_enabled: false,
          effective_runtime_enabled: false,
        },
      ],
      host_functions: [
        {
          name: 'host_system_action',
          module: 'system',
          permission_key: 'system_action',
          i18n_key: 'host.functions.host_system_action',
          description: '执行设备或系统动作',
          enabled: false,
        },
      ],
    },
    {
      permission_key: 'network:scan',
      module_key: 'system',
      i18n_key: 'permissions.keys.network:scan',
      direction: 'active_host_call',
      risk_level: 'critical',
      registered: false,
      requested: true,
      request_source: 'metadata',
      configured_policy_allowed: false,
      policy_allowed: false,
      effective: false,
      decision_reason: 'unknown_permission',
      forced_by_sandbox: false,
      can_configure: false,
      config_block_reason: 'unregistered_permission',
      host_functions: [],
      governed_action_domains: [],
    },
  ],
};

const baseEffective: EffectivePermissionsResponse = {
  version_id: 7,
  requested_permissions: [...requestedPermissions],
  requested_permissions_source: 'metadata',
  requested_permissions_hash: 'mock-requested-sha256-happy',
  baseline_permissions: [...baselinePermissions],
  configured_policy_allowed_permissions: [...configuredPolicyAllowedPermissions],
  policy_allowed_permissions: [...policyAllowedPermissions],
  effective_permissions: [...effectivePermissions],
  force_sandbox_mode: false,
  profile: 'python-wasm',
  executor_resolved: 'python-wasm',
  source: 'governance_bridge',
  permission_matrix_summary: { ...baseSummary },
  permission_matrix_context: { ...baseContext },
  permission_matrix_governance_bridge: { ...baseGovernanceBridge },
};

const basePolicy: VersionPolicyResponse = {
  version_id: 7,
  profile: 'python-wasm',
  allowed_permissions: [...configuredPolicyAllowedPermissions],
  enabled: true,
  force_sandbox_mode: false,
  description: 'Mock policy for frontend-only permission testing',
  created_at: '2026-04-24T10:00:00+08:00',
  updated_at: '2026-04-24T10:30:00+08:00',
  executor_resolved: 'python-wasm',
  effective_permissions: [...effectivePermissions],
  policy_allowed_permissions: [...policyAllowedPermissions],
  action_domain_overrides: [
    {
      action_domain: 'public_request',
      top_permission_key: 'http_client',
      runtime_enabled: true,
      effective_runtime_enabled: true,
      grant_status: 'active',
      grant_source: 'manual_review',
      mirrored_from_legacy: true,
      has_runtime_override: true,
    },
    {
      action_domain: 'private_network_request',
      top_permission_key: 'http_client',
      runtime_enabled: false,
      effective_runtime_enabled: false,
      grant_status: 'active',
      grant_source: 'manual_review',
      mirrored_from_legacy: false,
      has_runtime_override: true,
    },
    {
      action_domain: 'network_scan',
      top_permission_key: 'system_action',
      runtime_enabled: false,
      effective_runtime_enabled: false,
      grant_status: 'active',
      grant_source: 'dual_review',
      mirrored_from_legacy: false,
      has_runtime_override: true,
    },
  ],
  permission_matrix_summary: { ...baseSummary },
  permission_matrix_context: { ...baseContext },
  permission_matrix_governance_bridge: { ...baseGovernanceBridge },
  requested_permissions: [...requestedPermissions],
  requested_permissions_source: 'metadata',
  requested_permissions_hash: 'mock-requested-sha256-happy',
  baseline_permissions: [...baselinePermissions],
  configured_policy_allowed_permissions: [...configuredPolicyAllowedPermissions],
  source: 'governance_bridge',
};

export const permissionReferenceScenarios: PermissionReferenceScenario[] = [
  {
    key: 'happy-mixed',
    name: '混合常态场景',
    description: '同时包含 baseline 权限、已放行公网访问、未放行文件读取、未登记权限和动作域运行覆盖，适合大多数 UI 评审与 mock 联调。',
    matrix: clone(baseMatrix),
    effective: clone(baseEffective),
    policy: clone(basePolicy),
    requestedPermissionsPayload: {
      version_id: 7,
      source: 'metadata',
      requested_permissions: [...requestedPermissions],
      normalized_permissions: [...requestedPermissions],
      unknown_permissions: ['network:scan'],
    },
    probeResult: {
      permission: 'http_client',
      requested: true,
      policy_allowed: true,
      effective: true,
      blocked_by_force_sandbox: false,
      decision_reason: 'allowed_by_policy',
    },
  },
  {
    key: 'sandbox-blocked',
    name: '强制沙箱压制场景',
    description: '上层权限看起来已经放开，但最终被强制沙箱压住，适合测试“为什么还不能用”面板。',
    matrix: (() => {
      const matrix = clone(baseMatrix);
      matrix.context.trust_state = 'pending_review';
      matrix.context.configured_force_sandbox_mode = true;
      matrix.context.force_sandbox_mode = true;
      matrix.summary.effective_count = 2;
      matrix.summary.denied_count = 4;
      matrix.policy_allowed_permissions = ['host_log', 'host_config_get', 'http_client', 'system_action'];
      matrix.configured_policy_allowed_permissions = ['host_log', 'host_config_get', 'http_client', 'system_action'];
      matrix.effective_permissions = ['host_log', 'host_config_get'];
      matrix.rows = matrix.rows.map((row) => {
        if (row.permission_key === 'http_client' || row.permission_key === 'system_action') {
          return {
            ...row,
            configured_policy_allowed: true,
            policy_allowed: true,
            effective: false,
            forced_by_sandbox: true,
            decision_reason: 'blocked_by_force_sandbox',
          };
        }
        return row;
      });
      return matrix;
    })(),
    effective: (() => {
      const effective = clone(baseEffective);
      effective.force_sandbox_mode = true;
      effective.profile = 'strict-wasm';
      effective.policy_allowed_permissions = ['host_log', 'host_config_get', 'http_client', 'system_action'];
      effective.configured_policy_allowed_permissions = ['host_log', 'host_config_get', 'http_client', 'system_action'];
      effective.effective_permissions = ['host_log', 'host_config_get'];
      effective.permission_matrix_summary = {
        ...effective.permission_matrix_summary!,
        effective_count: 2,
        denied_count: 4,
      };
      effective.permission_matrix_context = {
        ...effective.permission_matrix_context!,
        configured_profile: 'strict-wasm',
        profile: 'strict-wasm',
        configured_force_sandbox_mode: true,
        force_sandbox_mode: true,
      };
      return effective;
    })(),
    policy: (() => {
      const policy = clone(basePolicy);
      policy.profile = 'strict-wasm';
      policy.force_sandbox_mode = true;
      policy.allowed_permissions = ['host_log', 'host_config_get', 'http_client', 'system_action'];
      policy.policy_allowed_permissions = ['host_log', 'host_config_get', 'http_client', 'system_action'];
      policy.effective_permissions = ['host_log', 'host_config_get'];
      return policy;
    })(),
    requestedPermissionsPayload: {
      version_id: 7,
      source: 'metadata',
      requested_permissions: [...requestedPermissions],
      unknown_permissions: ['network:scan'],
      note: 'policy 允许，但最终被 force_sandbox_mode 压制',
    },
    probeResult: {
      permission: 'system_action',
      requested: true,
      policy_allowed: true,
      effective: false,
      blocked_by_force_sandbox: true,
      decision_reason: 'blocked_by_force_sandbox',
    },
  },
  {
    key: 'legacy-bridge-review',
    name: '旧策略桥接复核场景',
    description: '模拟权限族来自旧 allowed_permissions 镜像，动作域只部分授予，适合测试桥接标签、授予来源和管理员回收老策略。',
    matrix: (() => {
      const matrix = clone(baseMatrix);
      matrix.context.trust_state = 'trusted';
      matrix.governance_bridge = {
        enabled: true,
        granted_rule_count: 4,
        override_count: 1,
        mirrored_legacy_count: 3,
        active_grant_rule_count: 3,
      };
      matrix.summary.requested_count = 4;
      matrix.summary.configured_policy_allowed_count = 2;
      matrix.summary.policy_allowed_count = 2;
      matrix.summary.effective_count = 2;
      matrix.summary.denied_count = 2;
      matrix.summary.unknown_count = 0;
      matrix.requested_permissions = ['host_log', 'host_config_get', 'http_client', 'system_action'];
      matrix.configured_policy_allowed_permissions = ['host_log', 'http_client'];
      matrix.policy_allowed_permissions = ['host_log', 'http_client'];
      matrix.effective_permissions = ['host_log', 'http_client'];
      matrix.rows = matrix.rows.filter((row) => ['host_log', 'http_client', 'system_action', 'host_config_get'].includes(row.permission_key)).map((row) => {
        if (row.permission_key === 'system_action') {
          return {
            ...row,
            configured_policy_allowed: false,
            policy_allowed: false,
            effective: false,
            decision_reason: 'blocked_by_policy',
            mirrored_from_legacy: true,
            governed_action_domains: [
              {
                action_domain: 'network_scan',
                top_permission_key: 'system_action',
                grant_status: 'pending_review',
                grant_source: 'legacy_bridge',
                mirrored_from_legacy: true,
                has_runtime_override: false,
                effective_runtime_enabled: false,
              },
            ],
          };
        }
        if (row.permission_key === 'http_client') {
          return {
            ...row,
            mirrored_from_legacy: true,
            governed_action_domains: [
              {
                action_domain: 'public_request',
                top_permission_key: 'http_client',
                grant_status: 'active',
                grant_source: 'legacy_bridge',
                mirrored_from_legacy: true,
                has_runtime_override: false,
                effective_runtime_enabled: true,
              },
            ],
          };
        }
        return row;
      });
      return matrix;
    })(),
    effective: (() => {
      const effective = clone(baseEffective);
      effective.requested_permissions = ['host_log', 'host_config_get', 'http_client', 'system_action'];
      effective.configured_policy_allowed_permissions = ['host_log', 'http_client'];
      effective.policy_allowed_permissions = ['host_log', 'http_client'];
      effective.effective_permissions = ['host_log', 'http_client'];
      effective.permission_matrix_summary = {
        requested_count: 4,
        configured_policy_allowed_count: 2,
        policy_allowed_count: 2,
        effective_count: 2,
        denied_count: 2,
        unknown_count: 0,
      };
      effective.permission_matrix_governance_bridge = {
        enabled: true,
        granted_rule_count: 4,
        override_count: 1,
        mirrored_legacy_count: 3,
        active_grant_rule_count: 3,
      };
      return effective;
    })(),
    policy: (() => {
      const policy = clone(basePolicy);
      policy.allowed_permissions = ['host_log', 'http_client'];
      policy.policy_allowed_permissions = ['host_log', 'http_client'];
      policy.effective_permissions = ['host_log', 'http_client'];
      policy.action_domain_overrides = [
        {
          action_domain: 'public_request',
          top_permission_key: 'http_client',
          runtime_enabled: true,
          effective_runtime_enabled: true,
          grant_status: 'active',
          grant_source: 'legacy_bridge',
          mirrored_from_legacy: true,
          has_runtime_override: false,
        },
      ];
      policy.permission_matrix_governance_bridge = {
        enabled: true,
        granted_rule_count: 4,
        override_count: 1,
        mirrored_legacy_count: 3,
        active_grant_rule_count: 3,
      };
      return policy;
    })(),
    requestedPermissionsPayload: {
      version_id: 7,
      source: 'metadata',
      requested_permissions: ['host_log', 'host_config_get', 'http_client', 'system_action'],
      unknown_permissions: [],
      note: '来自旧策略桥接，system_action 仍待复核',
    },
    probeResult: {
      permission: 'system_action',
      requested: true,
      policy_allowed: false,
      effective: false,
      blocked_by_force_sandbox: false,
      decision_reason: 'blocked_by_policy',
    },
  },
];

export const defaultPermissionReferenceScenario = permissionReferenceScenarios[0];

export function getPermissionReferenceScenario(key: string) {
  return permissionReferenceScenarios.find((item) => item.key === key) || defaultPermissionReferenceScenario;
}

