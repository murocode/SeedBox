BEGIN;

-- 100 人のユーザーを作成
INSERT INTO "User" ("username","email","bio")
SELECT 'dupe_user_' || gs::text, 'dupe' || gs::text || '@example.com', '自動生成ユーザー ' || gs::text
FROM generate_series(1,100) AS gs
ON CONFLICT ("username") DO NOTHING;

-- 同じシードを各ユーザーが投稿
INSERT INTO "Seed" ("seedValue","title","comment","owTypes","netherEase","fortressDistance","fortressTypes","fortressToNetherDist","portalRoomEase","zeroCycle","authorUsername")
SELECT 'seed-duplicated-9999', '重複シード', '多数ユーザーによる同一シード投稿', ARRAY['村']::text[], 'NORMAL', 'NEAR', ARRAY['ブリッジ']::text[], 'NEAR', 'EASY', 'EASY', 'dupe_user_' || gs::text
FROM generate_series(1,100) AS gs
ON CONFLICT ("seedValue","authorUsername") DO NOTHING;

COMMIT;

-- 確認
SELECT count(*) AS cnt FROM "Seed" WHERE "seedValue" = 'seed-duplicated-9999';
SELECT id, "seedValue", "authorUsername" FROM "Seed" WHERE "seedValue" = 'seed-duplicated-9999' ORDER BY id LIMIT 20;
