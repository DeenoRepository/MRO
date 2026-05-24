INSERT INTO core.permissions (id, code, description) VALUES
('20000000-0000-0000-0000-000000000023', 'EPS_INTEGRATION_LOG_WRITE', 'Write EPS external integration logs'),
('20000000-0000-0000-0000-000000000024', 'EPS_INTEGRATION_LOG_READ', 'Read EPS external integration logs')
ON CONFLICT (code) DO NOTHING;

INSERT INTO core.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM core.roles r
JOIN core.permissions p ON p.code IN ('EPS_INTEGRATION_LOG_WRITE', 'EPS_INTEGRATION_LOG_READ')
WHERE r.code IN ('SYSTEM_ADMIN', 'EPS_MANAGER')
ON CONFLICT DO NOTHING;
