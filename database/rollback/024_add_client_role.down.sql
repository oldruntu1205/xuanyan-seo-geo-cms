DELETE FROM role_permissions WHERE role_id IN (SELECT id FROM roles WHERE code='client');
DELETE FROM roles WHERE code='client';
