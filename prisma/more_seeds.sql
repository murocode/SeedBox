BEGIN;

-- ユーザー
INSERT INTO "User" ("username","email","bio")
VALUES
  ('sample_user','sample@example.com','サンプルユーザー'),
  ('other_user','other@example.com','別の投稿者'),
  ('alice','alice@example.com','Alice の紹介'),
  ('bob','bob@example.com','Bob の紹介')
ON CONFLICT ("username") DO UPDATE SET email = EXCLUDED.email, bio = COALESCE(EXCLUDED.bio, "User".bio);

-- シード: 同じシードを別ユーザーが投稿（seed-sample-0001）
INSERT INTO "Seed" ("seedValue","title","comment","owTypes","netherEase","fortressDistance","fortressTypes","fortressToNetherDist","portalRoomEase","zeroCycle","authorUsername")
VALUES
  ('seed-sample-0001','サンプルシード','最初の投稿です', ARRAY['村']::text[], 'NORMAL','NEAR', ARRAY['ブリッジ']::text[], 'NEAR','EASY','EASY','sample_user'),
  ('seed-sample-0001','サンプルシード（別ユーザー）','別ユーザーによる同一シード投稿', ARRAY['村']::text[], 'NORMAL','NEAR', ARRAY['ブリッジ']::text[], 'NEAR','EASY','EASY','other_user'),
  ('seed-forest-0002','森のシード','森寄りの良シード', ARRAY['村','森']::text[], 'EASY','FAR', ARRAY['ハウジング']::text[], 'FAR','EASY','EASY','alice'),
  ('seed-desert-0003','砂漠シード','砂漠のピラミッドあり', ARRAY['ピラミッド']::text[], 'NORMAL','NEAR', ARRAY['トレジャー']::text[], 'NEAR','HARD','HARD','bob')
ON CONFLICT ("seedValue","authorUsername") DO NOTHING;

-- likes を追加（既存の seed id を参照）
INSERT INTO "Like" ("userUsername","seedId")
SELECT u."username", s."id"
FROM "User" u, "Seed" s
WHERE (u."username" = 'alice' AND s."seedValue" = 'seed-forest-0002')
   OR (u."username" = 'bob' AND s."seedValue" = 'seed-sample-0001')
ON CONFLICT ("userUsername","seedId") DO NOTHING;

-- favorites を追加
INSERT INTO "Favorite" ("userUsername","seedId")
SELECT u."username", s."id"
FROM "User" u, "Seed" s
WHERE u."username" = 'other_user' AND s."seedValue" = 'seed-sample-0001'
ON CONFLICT ("userUsername","seedId") DO NOTHING;

COMMIT;

-- 確認用
SELECT 'USERS' as tag, * FROM "User" WHERE "username" IN ('sample_user','other_user','alice','bob');
SELECT 'SEEDS' as tag, * FROM "Seed" WHERE "seedValue" LIKE 'seed-%' ORDER BY "id" LIMIT 20;
SELECT 'LIKES' as tag, * FROM "Like" LIMIT 20;
SELECT 'FAVS' as tag, * FROM "Favorite" LIMIT 20;
