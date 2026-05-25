INSERT INTO core.permissions (id, code, description) VALUES
('20000000-0000-0000-0000-000000000022', 'EPS_MEDIA_UPLOAD', 'Upload EPS media files')
ON CONFLICT (code) DO NOTHING;

INSERT INTO core.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM core.roles r
JOIN core.permissions p ON p.code = 'EPS_MEDIA_UPLOAD'
WHERE r.code IN ('SYSTEM_ADMIN', 'EPS_MANAGER')
ON CONFLICT DO NOTHING;
