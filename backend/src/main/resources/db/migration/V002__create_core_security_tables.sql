CREATE TABLE IF NOT EXISTS core.users (
    id UUID PRIMARY KEY,
    username VARCHAR(128) UNIQUE NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    ldap_dn TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS core.roles (
    id UUID PRIMARY KEY,
    code VARCHAR(64) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT
);

CREATE TABLE IF NOT EXISTS core.permissions (
    id UUID PRIMARY KEY,
    code VARCHAR(128) UNIQUE NOT NULL,
    description TEXT
);

CREATE TABLE IF NOT EXISTS core.role_permissions (
    role_id UUID NOT NULL REFERENCES core.roles(id),
    permission_id UUID NOT NULL REFERENCES core.permissions(id),
    PRIMARY KEY (role_id, permission_id)
);

CREATE INDEX IF NOT EXISTS idx_core_role_permissions_role_id ON core.role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_core_role_permissions_permission_id ON core.role_permissions(permission_id);

CREATE TABLE IF NOT EXISTS core.user_roles (
    user_id UUID NOT NULL REFERENCES core.users(id),
    role_id UUID NOT NULL REFERENCES core.roles(id),
    PRIMARY KEY (user_id, role_id)
);

CREATE INDEX IF NOT EXISTS idx_core_user_roles_user_id ON core.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_core_user_roles_role_id ON core.user_roles(role_id);

CREATE TABLE IF NOT EXISTS core.ldap_group_mappings (
    id UUID PRIMARY KEY,
    ldap_group_dn TEXT NOT NULL,
    role_id UUID NOT NULL REFERENCES core.roles(id)
);

CREATE INDEX IF NOT EXISTS idx_core_ldap_group_mappings_role_id ON core.ldap_group_mappings(role_id);

