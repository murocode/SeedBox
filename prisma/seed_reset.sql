-- ============================================================
--  SEED RESET  -  開発用DBを完全リセット → サンプルデータ投入
--  対象DB: .env.local (開発用 Supabase)
-- ============================================================

BEGIN;

-- ① 全データ削除（FK制約順）
DELETE FROM "ModerationLog";
DELETE FROM "Report";
DELETE FROM "Favorite";
DELETE FROM "Like";
DELETE FROM "Follow";
DELETE FROM "Seed";
DELETE FROM "OAuthAccount";
DELETE FROM "User";

-- ② ユーザー作成（スピードランコミュニティらしい名前）
INSERT INTO "User" ("username", "email", "bio", "youtubeUrl", "xUrl")
VALUES
  ('nether_king', 'nether_king@example.com',
   'Java版RSGスピードランナー。AA部門でサブ8を目指して毎日配信中。良シードはみんなで共有しよう！',
   'https://youtube.com/@nether_king', 'https://x.com/nether_king_mc'),

  ('crystal_runner', 'crystal_runner@example.com',
   '旧バージョン1.16.1メインのSSG走者。AAはたまに。良要塞シード大募集。',
   'https://youtube.com/@crystal_runner', NULL),

  ('speedrun_panda', 'speedrun_panda@example.com',
   '走り始めて半年。まだ初心者ですがシード収集が趣味です。フォローよろしく！',
   NULL, 'https://x.com/speedrun_panda'),

  ('ender_nova', 'ender_nova@example.com',
   '1.18以降のモダン環境でのRSGを研究中。ゼロサイクル対応シードを集めています。',
   'https://youtube.com/@ender_nova', 'https://x.com/ender_nova_mc'),

  ('blazemaster99', 'blazemaster99@example.com',
   'ブレイズファームの効率を追求するRSG走者。要塞情報の精度にこだわります。',
   'https://youtube.com/@blazemaster99', NULL),

  ('sakura_rtx', 'sakura_rtx@example.com',
   '日本語コミュニティ向けにシード解説動画を投稿中。初心者にも優しい説明を心がけてます。',
   'https://youtube.com/@sakura_rtx', 'https://x.com/sakura_rtx')
ON CONFLICT ("username") DO UPDATE
  SET bio = EXCLUDED.bio,
      "youtubeUrl" = EXCLUDED."youtubeUrl",
      "xUrl" = EXCLUDED."xUrl";

-- ③ シードデータ 10件（バラバラな内容・タグ・コメント）
INSERT INTO "Seed" (
  "seedValue", "title", "comment",
  "owEase", "owTypes", "villageType", "hasBlacksmith",
  "netherEase", "fortressDistance", "fortressTypes", "fortressToNetherDist",
  "portalRoomEase", "zeroCycle",
  "authorUsername"
)
VALUES

-- 1: 超ハイスペック ゼロサイクル対応シード
(
  '-4530634174564184799',
  '【神シード】ゼロサイクル＋鍛冶屋村スポーン',
  'スポーン目の前に平原村あり、鍛冶屋から鉄装備補充可能。ネザー要塞はブリッジ主体で走りやすく、ポータル部屋はゼロサイクル可能な配置。PBが一気に縮みました。Java 1.16.1確認済み。',
  'EASY', ARRAY['村', '要塞跡']::text[], '平原', TRUE,
  'EASY', 'NEAR', ARRAY['ブリッジ', 'トレジャー']::text[], 'NEAR',
  'EASY', 'EASY',
  'nether_king'
),

-- 2: 砂漠ピラミッド＋村
(
  '8767654563534078415',
  '砂漠スタート 鍛冶屋＋ピラミッド近接',
  'スポーンから200ブロック以内に砂漠村（鍛冶屋あり）とピラミッドが隣接。序盤の物資補充が異常に楽。ネザーはやや遠めだが走路は明確。安定感重視の人におすすめ。',
  'EASY', ARRAY['村', 'ピラミッド']::text[], '砂漠', TRUE,
  'NORMAL', 'FAR', ARRAY['ブリッジ', 'ハウジング']::text[], 'NORMAL',
  'EASY', 'HARD',
  'sakura_rtx'
),

-- 3: ネザー特化シード
(
  '3257840888576068086',
  '要塞スポーン直結シード【ネザー最速級】',
  'ネザーゲートを抜けた瞬間に要塞内部。ブリッジ2本とスポナー3箇所が密集していてブレイズ収集がとにかく速い。オーバーワールドはやや微妙だが総合タイムは十分狙える。',
  'NORMAL', ARRAY['村']::text[], 'タイガ', FALSE,
  'EASY', 'NEAR', ARRAY['ブリッジ', 'スポナー']::text[], 'NEAR',
  'HARD', 'HARD',
  'blazemaster99'
),

-- 4: サバンナ村シード
(
  '-1240247508937808636',
  'サバンナ村＋廃坑あり 中級者向けシード',
  'サバンナバイオームの大型村にスポーン。近くに廃坑があり鉄と食料の調達が安定。ネザーは普通程度だが要塞ルートが分かりやすく練習にも最適。初心者卒業シードとして使えます。',
  'EASY', ARRAY['村', '廃坑']::text[], 'サバンナ', TRUE,
  'NORMAL', 'NEAR', ARRAY['ハウジング', 'トレジャー']::text[], 'NEAR',
  'EASY', 'EASY',
  'speedrun_panda'
),

-- 5: 上級者向けハードシード
(
  '4638485363588607565',
  'ゼロサイクルHARD 上達用シード【苦行】',
  'ポータル部屋配置はゼロサイクルHARDで難易度高め。しかし決まった時のタイムが異常に速い。地形把握の練習にちょうどよく、マスターすれば世界記録ペースのルートが組める。腕に自信がある人向け。',
  'NORMAL', ARRAY['村']::text[], '平原', FALSE,
  'EASY', 'NEAR', ARRAY['ブリッジ']::text[], 'NEAR',
  'HARD', 'HARD',
  'ender_nova'
),

-- 6: 雪原バイオーム珍しいシード
(
  '-6239583758102719921',
  '雪原村スタート 珍しいスノーバイオーム',
  'スノープレインズのレア村にスポーン。見た目が映えるので動画映えする。雪原ならではの地形でルートが少し変わるが要塞は近め。配信映えや動画ネタとして使うのにもおすすめ。',
  'NORMAL', ARRAY['村']::text[], '雪原', TRUE,
  'NORMAL', 'NEAR', ARRAY['スポナー', 'ハウジング']::text[], 'NORMAL',
  'EASY', 'EASY',
  'crystal_runner'
),

-- 7: 要塞＋村密集シード
(
  '5170914847070024670',
  '要塞跡とメサ村が同時に見えるシード',
  'スポーン付近にメサ（バッドランズ）バイオームの村と廃坑要塞跡が密集。視覚的にも面白く、黄金が豊富に手に入る。ネザー要塞は距離やや遠いが走れる範囲。動画映え最高。',
  'EASY', ARRAY['村', '要塞跡', '廃坑']::text[], 'サバンナ', TRUE,
  'NORMAL', 'FAR', ARRAY['トレジャー', 'ブリッジ']::text[], 'FAR',
  'EASY', 'EASY',
  'nether_king'
),

-- 8: 完全な初心者向け安定シード
(
  '2585966022894393070',
  '初心者にやさしい超安定シード【練習用】',
  'すべての要素がほどよく揃った初心者練習用シード。村はすぐ見つかり、鍛冶屋あり。要塞も近く、ポータル部屋も見つけやすい配置。初めてスピードランを走る人はまずこれを試してみてください。',
  'EASY', ARRAY['村']::text[], '平原', TRUE,
  'EASY', 'NEAR', ARRAY['ブリッジ', 'ハウジング', 'トレジャー']::text[], 'NEAR',
  'EASY', 'EASY',
  'sakura_rtx'
),

-- 9: ジャングル特殊シード
(
  '-3814854760587474104',
  'ジャングル神殿＋村隣接 珍しい構成',
  'ジャングル神殿と村が隣接するレア構成。神殿内のトラップから序盤装備を調達しつつ鍛冶屋でも補充できる。ルート最適化が面白く研究しがいがある。ネザーは標準的。',
  'NORMAL', ARRAY['村', 'ジャングル神殿']::text[], '平原', TRUE,
  'NORMAL', 'NORMAL', ARRAY['ブリッジ', 'スポナー']::text[], 'NORMAL',
  'EASY', 'HARD',
  'ender_nova'
),

-- 10: ネザー要塞密集 SSGスタイル
(
  '1156391694',
  '1.16.1 SSG 要塞密集シード【タイム狙い】',
  '1.16.1 SSGカテゴリ用。ネザー要塞が複数密集しており、ブレイズロッド収集ルートを複数組める。コミュニティ内でも使用者多め。ポータル部屋はEASYなので詰まらない。PB更新率が高いシードです。',
  'NORMAL', ARRAY['村']::text[], 'タイガ', FALSE,
  'EASY', 'NEAR', ARRAY['ブリッジ', 'ブリッジ', 'トレジャー']::text[], 'NEAR',
  'EASY', 'EASY',
  'blazemaster99'
)
ON CONFLICT ("seedValue", "authorUsername") DO NOTHING;

-- ④ いくつかのいいね・お気に入りを追加（自然なアクティビティ）
INSERT INTO "Like" ("userUsername", "seedId")
SELECT u."username", s."id"
FROM "User" u
CROSS JOIN "Seed" s
WHERE
  -- nether_king の2シードに他ユーザーがいいね
  (u."username" = 'crystal_runner'   AND s."seedValue" = '-4530634174564184799') OR
  (u."username" = 'speedrun_panda'   AND s."seedValue" = '-4530634174564184799') OR
  (u."username" = 'ender_nova'       AND s."seedValue" = '-4530634174564184799') OR
  (u."username" = 'blazemaster99'    AND s."seedValue" = '5170914847070024670') OR
  -- sakura_rtx の初心者シードにいいね
  (u."username" = 'speedrun_panda'   AND s."seedValue" = '8767654563534078415') OR
  (u."username" = 'crystal_runner'   AND s."seedValue" = '2585966022894393070') OR
  (u."username" = 'nether_king'      AND s."seedValue" = '2585966022894393070') OR
  -- SSGシードにいいね
  (u."username" = 'ender_nova'       AND s."seedValue" = '1156391694') OR
  (u."username" = 'crystal_runner'   AND s."seedValue" = '1156391694') OR
  (u."username" = 'nether_king'      AND s."seedValue" = '3257840888576068086')
ON CONFLICT ("userUsername", "seedId") DO NOTHING;

INSERT INTO "Favorite" ("userUsername", "seedId")
SELECT u."username", s."id"
FROM "User" u
CROSS JOIN "Seed" s
WHERE
  (u."username" = 'speedrun_panda' AND s."seedValue" = '-4530634174564184799') OR
  (u."username" = 'crystal_runner' AND s."seedValue" = '1156391694')           OR
  (u."username" = 'sakura_rtx'     AND s."seedValue" = '-4530634174564184799') OR
  (u."username" = 'ender_nova'     AND s."seedValue" = '4638485363588607565')
ON CONFLICT ("userUsername", "seedId") DO NOTHING;

-- ⑤ フォロー関係
INSERT INTO "Follow" ("followerUsername", "followingUsername")
VALUES
  ('speedrun_panda', 'nether_king'),
  ('speedrun_panda', 'sakura_rtx'),
  ('crystal_runner', 'nether_king'),
  ('ender_nova',     'blazemaster99'),
  ('sakura_rtx',     'ender_nova')
ON CONFLICT ("followerUsername", "followingUsername") DO NOTHING;

COMMIT;

-- 確認クエリ
SELECT 'USERS'     AS tag, "username", "bio" FROM "User";
SELECT 'SEEDS'     AS tag, "id", "seedValue", "title", "authorUsername", "owTypes", "zeroCycle" FROM "Seed" ORDER BY "id";
SELECT 'LIKES'     AS tag, COUNT(*) FROM "Like";
SELECT 'FAVORITES' AS tag, COUNT(*) FROM "Favorite";
SELECT 'FOLLOWS'   AS tag, COUNT(*) FROM "Follow";
