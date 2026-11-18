-- Cho phép yêu cầu hỗ trợ có mức ưu tiên urgent.
-- Đồng bộ ràng buộc PostgreSQL với backend.

BEGIN;

ALTER TABLE support_requests
DROP CONSTRAINT IF EXISTS support_requests_priority_check;

ALTER TABLE support_requests
ADD CONSTRAINT support_requests_priority_check
CHECK (priority IN ('low', 'normal', 'high', 'urgent'));

COMMIT;
