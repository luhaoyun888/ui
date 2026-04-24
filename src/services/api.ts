export type ActionState = 'default' | 'force_allow' | 'force_deny';

export interface PermissionActionDomain {
  action_domain: string;
  top_permission_key: string;
  grant_status: 'active' | 'denied' | 'pending';
  grant_source: string;
  mirrored_from_legacy: boolean;
  has_runtime_override: boolean;
  runtime_enabled?: boolean;
  effective_runtime_enabled: boolean;
  setting_mode: ActionState; // Added three-state setting
}

export interface HostFunction {
  name: string;
  module: string;
  permission_key: string;
  i18n_key: string;
  description: string;
  enabled: boolean;
}

export interface PermissionRow {
  permission_key: string;
  module_key: string;
  i18n_key: string;
  direction: 'active_host_call' | 'passive_callback';
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  registered: boolean;
  requested: boolean;
  request_source: 'baseline' | 'metadata' | 'runtime';
  configured_policy_allowed: boolean;
  policy_allowed: boolean;
  effective: boolean;
  decision_reason: string;
  forced_by_sandbox: boolean;
  can_configure: boolean;
  grant_status: 'active' | 'denied' | 'pending';
  grant_source: string;
  mirrored_from_legacy: boolean;
  has_runtime_override: boolean;
  runtime_enabled?: boolean;
  governed_action_domains: PermissionActionDomain[];
  host_functions?: HostFunction[];
}

export interface PermissionMatrixResponse {
  context: {
    version_id: number;
    trust_state: string;
    plugin_lifecycle_status: string;
    configured_profile: string;
    profile: string;
    configured_force_sandbox_mode: boolean;
    force_sandbox_mode: boolean;
    enabled: boolean;
    executor_resolved: string;
    source_type: string;
  };
  summary: {
    requested_count: number;
    configured_policy_allowed_count: number;
    policy_allowed_count: number;
    effective_count: number;
    denied_count: number;
    unknown_count: number;
  };
  governance_bridge: {
    enabled: boolean;
    granted_rule_count: number;
    override_count: number;
    mirrored_legacy_count: number;
    active_grant_rule_count: number;
  };
  baseline_permissions: string[];
  requested_permissions: string[];
  requested_permissions_source: string;
  requested_permissions_hash: string;
  configured_policy_allowed_permissions: string[];
  policy_allowed_permissions: string[];
  effective_permissions: string[];
  rows: PermissionRow[];
}

export interface EffectivePermissionsResponse {
  version_id: number;
  effective_permissions: string[];
  overrides: Record<string, boolean>;
}

export interface VersionPolicyResponse {
  version_id: number;
  policy_name: string;
  last_updated: string;
}
