BEGIN;

INSERT INTO "User" ("username","email","bio")
VALUES ('sample_user','sample@example.com','サンプルユーザー')
ON CONFLICT ("username") DO UPDATE SET email = EXCLUDED.email, bio = COALESCE(EXCLUDED.bio, "User".bio);

INSERT INTO "Seed" ("seedValue","title","comment","owTypes","netherEase","fortressDistance","fortressTypes","fortressToNetherDist","portalRoomEase","zeroCycle","authorUsername")
VALUES (
  'seed-sample-0001',
  'サンプルシード',
  '自動挿入されたサンプルデータです',
  ARRAY['村','ピラミッド']::text[],
  'NORMAL',
  'NEAR',
  ARRAY['ブリッジ']::text[],
  'NEAR',
  'EASY',
  'EASY',
  'sample_user'
)
ON CONFLICT ("seedValue","authorUsername") DO NOTHING;

COMMIT;

-- 確認用SELECT
SELECT * FROM "User" WHERE "username" = 'sample_user';
SELECT * FROM "Seed" WHERE "seedValue" = 'seed-sample-0001';
