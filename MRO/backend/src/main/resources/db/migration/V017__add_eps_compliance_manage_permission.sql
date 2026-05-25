INSERT INTO core.permissions (id, code, description) VALUES
('20000000-0000-0000-0000-000000000020', 'EPS_COMPLIANCE_MANAGE', 'Manage EPS compliance records')
ON CONFLICT (code) DO NOTHING;

INSERT INTO core.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM core.roles r
JOIN core.permissions p ON p.code = 'EPS_COMPLIANCE_MANAGE'
WHERE r.code IN ('SYSTEM_ADMIN', 'EPS_MANAGER')
ON CONFLICT DO NOTHING;
