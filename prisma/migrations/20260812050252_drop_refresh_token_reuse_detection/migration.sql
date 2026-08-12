-- Bỏ cơ chế phát hiện refresh token bị dùng lại (previous_token_hash/rotated_at):
-- việc thu hồi toàn bộ session khi phát hiện reuse có thể làm sai lệch logic
-- đếm số thiết bị đang hoạt động (tối đa 3) ở luồng login. Quay lại cơ chế
-- đơn giản: mỗi lần refresh chỉ ghi đè token_hash hiện tại (đã băm bằng
-- HMAC-SHA256, giữ nguyên từ migration trước).
DROP INDEX "user_sessions_previous_token_hash_key";

ALTER TABLE "user_sessions" DROP COLUMN "previous_token_hash";
ALTER TABLE "user_sessions" DROP COLUMN "rotated_at";
