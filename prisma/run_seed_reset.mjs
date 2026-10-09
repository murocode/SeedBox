/**
 * 開発DBを全リセットして、リアルなサンプルデータを投入
 * Usage: node prisma/run_seed_reset.mjs
 */
import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';
import { join } from 'path';

// .env.local を手動パース
const envContent = readFileSync(join(process.cwd(), '.env.local'), 'utf-8');
for (const line of envContent.split(/\r?\n/)) {
  const match = line.match(/^([^#=\s][^=]*)=(.*)$/);
  if (match) {
    const key = match[1].trim();
    const val = match[2].trim().replace(/^"(.*)"$/, '$1');
    process.env[key] = val;
  }
}

const prisma = new PrismaClient({ log: ['warn', 'error'] });

async function main() {
  console.log('🗑️  全データを削除中...');

  // FK制約の順番に削除
  await prisma.moderationLog.deleteMany();
  await prisma.report.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.like.deleteMany();
  await prisma.follow.deleteMany();
  await prisma.seed.deleteMany();
  await prisma.oAuthAccount.deleteMany();
  await prisma.user.deleteMany();

  console.log('✅ 全テーブル削除完了\n');

  // ── ユーザー作成 ──────────────────────────────────────────
  console.log('👤 ユーザーを作成中...');
  await prisma.user.createMany({
    data: [
      {
        username: 'nether_king',
        email: 'nether_king@example.com',
        bio: 'Java版RSGスピードランナー。AA部門でサブ8を目指して毎日配信中。良シードはみんなで共有しよう！',
        youtubeUrl: 'https://youtube.com/@nether_king',
        xUrl: 'https://x.com/nether_king_mc',
      },
      {
        username: 'crystal_runner',
        email: 'crystal_runner@example.com',
        bio: '旧バージョン1.16.1メインのSSG走者。AAはたまに。良要塞シード大募集。',
        youtubeUrl: 'https://youtube.com/@crystal_runner',
      },
      {
        username: 'speedrun_panda',
        email: 'speedrun_panda@example.com',
        bio: '走り始めて半年。まだ初心者ですがシード収集が趣味です。フォローよろしく！',
        xUrl: 'https://x.com/speedrun_panda',
      },
      {
        username: 'ender_nova',
        email: 'ender_nova@example.com',
        bio: '1.18以降のモダン環境でのRSGを研究中。ゼロサイクル対応シードを集めています。',
        youtubeUrl: 'https://youtube.com/@ender_nova',
        xUrl: 'https://x.com/ender_nova_mc',
      },
      {
        username: 'blazemaster99',
        email: 'blazemaster99@example.com',
        bio: 'ブレイズファームの効率を追求するRSG走者。要塞情報の精度にこだわります。',
        youtubeUrl: 'https://youtube.com/@blazemaster99',
      },
      {
        username: 'sakura_rtx',
        email: 'sakura_rtx@example.com',
        bio: '日本語コミュニティ向けにシード解説動画を投稿中。初心者にも優しい説明を心がけてます。',
        youtubeUrl: 'https://youtube.com/@sakura_rtx',
        xUrl: 'https://x.com/sakura_rtx',
      },
    ],
    skipDuplicates: true,
  });
  console.log('✅ ユーザー作成完了\n');

  // ── シードデータ 10件 ──────────────────────────────────────
  console.log('🌱 シードデータを投入中...');

  const seeds = [
    {
      seedValue: '-4530634174564184799',
      title: '【神シード】ゼロサイクル＋鍛冶屋村スポーン',
      comment:
        'スポーン目の前に平原村あり、鍛冶屋から鉄装備補充可能。ネザー要塞はブリッジ主体で走りやすく、ポータル部屋はゼロサイクル可能な配置。PBが一気に縮みました。Java 1.16.1確認済み。',
      owEase: 'EASY',
      owTypes: ['村', '要塞跡'],
      villageType: '平原',
      hasBlacksmith: true,
      netherEase: 'EASY',
      fortressDistance: 'NEAR',
      fortressTypes: ['ブリッジ', 'トレジャー'],
      fortressToNetherDist: 'NEAR',
      portalRoomEase: 'EASY',
      zeroCycle: 'EASY',
      authorUsername: 'nether_king',
    },
    {
      seedValue: '8767654563534078415',
      title: '砂漠スタート 鍛冶屋＋ピラミッド近接',
      comment:
        'スポーンから200ブロック以内に砂漠村（鍛冶屋あり）とピラミッドが隣接。序盤の物資補充が異常に楽。ネザーはやや遠めだが走路は明確。安定感重視の人におすすめ。',
      owEase: 'EASY',
      owTypes: ['村', 'ピラミッド'],
      villageType: '砂漠',
      hasBlacksmith: true,
      netherEase: 'NORMAL',
      fortressDistance: 'FAR',
      fortressTypes: ['ブリッジ', 'ハウジング'],
      fortressToNetherDist: 'NORMAL',
      portalRoomEase: 'EASY',
      zeroCycle: 'HARD',
      authorUsername: 'sakura_rtx',
    },
    {
      seedValue: '3257840888576068086',
      title: '要塞スポーン直結シード【ネザー最速級】',
      comment:
        'ネザーゲートを抜けた瞬間に要塞内部。ブリッジ2本とスポナー3箇所が密集していてブレイズ収集がとにかく速い。オーバーワールドはやや微妙だが総合タイムは十分狙える。',
      owEase: 'NORMAL',
      owTypes: ['村'],
      villageType: 'タイガ',
      hasBlacksmith: false,
      netherEase: 'EASY',
      fortressDistance: 'NEAR',
      fortressTypes: ['ブリッジ', 'スポナー'],
      fortressToNetherDist: 'NEAR',
      portalRoomEase: 'HARD',
      zeroCycle: 'HARD',
      authorUsername: 'blazemaster99',
    },
    {
      seedValue: '-1240247508937808636',
      title: 'サバンナ村＋廃坑あり 中級者向けシード',
      comment:
        'サバンナバイオームの大型村にスポーン。近くに廃坑があり鉄と食料の調達が安定。ネザーは普通程度だが要塞ルートが分かりやすく練習にも最適。初心者卒業シードとして使えます。',
      owEase: 'EASY',
      owTypes: ['村', '廃坑'],
      villageType: 'サバンナ',
      hasBlacksmith: true,
      netherEase: 'NORMAL',
      fortressDistance: 'NEAR',
      fortressTypes: ['ハウジング', 'トレジャー'],
      fortressToNetherDist: 'NEAR',
      portalRoomEase: 'EASY',
      zeroCycle: 'EASY',
      authorUsername: 'speedrun_panda',
    },
    {
      seedValue: '4638485363588607565',
      title: 'ゼロサイクルHARD 上達用シード【苦行】',
      comment:
        'ポータル部屋配置はゼロサイクルHARDで難易度高め。しかし決まった時のタイムが異常に速い。地形把握の練習にちょうどよく、マスターすれば世界記録ペースのルートが組める。腕に自信がある人向け。',
      owEase: 'NORMAL',
      owTypes: ['村'],
      villageType: '平原',
      hasBlacksmith: false,
      netherEase: 'EASY',
      fortressDistance: 'NEAR',
      fortressTypes: ['ブリッジ'],
      fortressToNetherDist: 'NEAR',
      portalRoomEase: 'HARD',
      zeroCycle: 'HARD',
      authorUsername: 'ender_nova',
    },
    {
      seedValue: '-6239583758102719921',
      title: '雪原村スタート 珍しいスノーバイオーム',
      comment:
        'スノープレインズのレア村にスポーン。見た目が映えるので動画映えする。雪原ならではの地形でルートが少し変わるが要塞は近め。配信映えや動画ネタとして使うのにもおすすめ。',
      owEase: 'NORMAL',
      owTypes: ['村'],
      villageType: '雪原',
      hasBlacksmith: true,
      netherEase: 'NORMAL',
      fortressDistance: 'NEAR',
      fortressTypes: ['スポナー', 'ハウジング'],
      fortressToNetherDist: 'NORMAL',
      portalRoomEase: 'EASY',
      zeroCycle: 'EASY',
      authorUsername: 'crystal_runner',
    },
    {
      seedValue: '5170914847070024670',
      title: '要塞跡とメサ村が同時に見えるシード',
      comment:
        'スポーン付近にメサ（バッドランズ）バイオームの村と廃坑要塞跡が密集。視覚的にも面白く、黄金が豊富に手に入る。ネザー要塞は距離やや遠いが走れる範囲。動画映え最高。',
      owEase: 'EASY',
      owTypes: ['村', '要塞跡', '廃坑'],
      villageType: 'サバンナ',
      hasBlacksmith: true,
      netherEase: 'NORMAL',
      fortressDistance: 'FAR',
      fortressTypes: ['トレジャー', 'ブリッジ'],
      fortressToNetherDist: 'FAR',
      portalRoomEase: 'EASY',
      zeroCycle: 'EASY',
      authorUsername: 'nether_king',
    },
    {
      seedValue: '2585966022894393070',
      title: '初心者にやさしい超安定シード【練習用】',
      comment:
        'すべての要素がほどよく揃った初心者練習用シード。村はすぐ見つかり、鍛冶屋あり。要塞も近く、ポータル部屋も見つけやすい配置。初めてスピードランを走る人はまずこれを試してみてください。',
      owEase: 'EASY',
      owTypes: ['村'],
      villageType: '平原',
      hasBlacksmith: true,
      netherEase: 'EASY',
      fortressDistance: 'NEAR',
      fortressTypes: ['ブリッジ', 'ハウジング', 'トレジャー'],
      fortressToNetherDist: 'NEAR',
      portalRoomEase: 'EASY',
      zeroCycle: 'EASY',
      authorUsername: 'sakura_rtx',
    },
    {
      seedValue: '-3814854760587474104',
      title: 'ジャングル神殿＋村隣接 珍しい構成',
      comment:
        'ジャングル神殿と村が隣接するレア構成。神殿内のトラップから序盤装備を調達しつつ鍛冶屋でも補充できる。ルート最適化が面白く研究しがいがある。ネザーは標準的。',
      owEase: 'NORMAL',
      owTypes: ['村', 'ジャングル神殿'],
      villageType: '平原',
      hasBlacksmith: true,
      netherEase: 'NORMAL',
      fortressDistance: 'NORMAL',
      fortressTypes: ['ブリッジ', 'スポナー'],
      fortressToNetherDist: 'NORMAL',
      portalRoomEase: 'EASY',
      zeroCycle: 'HARD',
      authorUsername: 'ender_nova',
    },
    {
      seedValue: '1156391694',
      title: '1.16.1 SSG 要塞密集シード【タイム狙い】',
      comment:
        '1.16.1 SSGカテゴリ用。ネザー要塞が複数密集しており、ブレイズロッド収集ルートを複数組める。コミュニティ内でも使用者多め。ポータル部屋はEASYなので詰まらない。PB更新率が高いシードです。',
      owEase: 'NORMAL',
      owTypes: ['村'],
      villageType: 'タイガ',
      hasBlacksmith: false,
      netherEase: 'EASY',
      fortressDistance: 'NEAR',
      fortressTypes: ['ブリッジ', 'トレジャー'],
      fortressToNetherDist: 'NEAR',
      portalRoomEase: 'EASY',
      zeroCycle: 'EASY',
      authorUsername: 'blazemaster99',
    },
  ];

  const createdSeeds = [];
  for (const seed of seeds) {
    const created = await prisma.seed.create({ data: seed });
    console.log(`  ✅ シード投入: [${created.id}] ${seed.seedValue} - ${seed.title}`);
    createdSeeds.push(created);
  }
  console.log('');

  // ── いいね ────────────────────────────────────────────────
  console.log('❤️  いいねを追加中...');
  const seedMap = Object.fromEntries(createdSeeds.map(s => [s.seedValue, s.id]));

  await prisma.like.createMany({
    data: [
      { userUsername: 'crystal_runner',  seedId: seedMap['-4530634174564184799'] },
      { userUsername: 'speedrun_panda',  seedId: seedMap['-4530634174564184799'] },
      { userUsername: 'ender_nova',      seedId: seedMap['-4530634174564184799'] },
      { userUsername: 'blazemaster99',   seedId: seedMap['5170914847070024670'] },
      { userUsername: 'speedrun_panda',  seedId: seedMap['8767654563534078415'] },
      { userUsername: 'crystal_runner',  seedId: seedMap['2585966022894393070'] },
      { userUsername: 'nether_king',     seedId: seedMap['2585966022894393070'] },
      { userUsername: 'ender_nova',      seedId: seedMap['1156391694'] },
      { userUsername: 'crystal_runner',  seedId: seedMap['1156391694'] },
      { userUsername: 'nether_king',     seedId: seedMap['3257840888576068086'] },
    ],
    skipDuplicates: true,
  });
  console.log('✅ いいね追加完了\n');

  // ── お気に入り ────────────────────────────────────────────
  console.log('⭐ お気に入りを追加中...');
  await prisma.favorite.createMany({
    data: [
      { userUsername: 'speedrun_panda', seedId: seedMap['-4530634174564184799'] },
      { userUsername: 'crystal_runner', seedId: seedMap['1156391694'] },
      { userUsername: 'sakura_rtx',     seedId: seedMap['-4530634174564184799'] },
      { userUsername: 'ender_nova',     seedId: seedMap['4638485363588607565'] },
    ],
    skipDuplicates: true,
  });
  console.log('✅ お気に入り追加完了\n');

  // ── フォロー ──────────────────────────────────────────────
  console.log('👥 フォロー関係を追加中...');
  await prisma.follow.createMany({
    data: [
      { followerUsername: 'speedrun_panda', followingUsername: 'nether_king' },
      { followerUsername: 'speedrun_panda', followingUsername: 'sakura_rtx' },
      { followerUsername: 'crystal_runner', followingUsername: 'nether_king' },
      { followerUsername: 'ender_nova',     followingUsername: 'blazemaster99' },
      { followerUsername: 'sakura_rtx',     followingUsername: 'ender_nova' },
    ],
    skipDuplicates: true,
  });
  console.log('✅ フォロー追加完了\n');

  // ── 確認 ──────────────────────────────────────────────────
  const [userCount, seedCount, likeCount, favCount, followCount] = await Promise.all([
    prisma.user.count(),
    prisma.seed.count(),
    prisma.like.count(),
    prisma.favorite.count(),
    prisma.follow.count(),
  ]);

  console.log('══════════════════════════════════');
  console.log('🎉 シードリセット完了！');
  console.log(`  Users:     ${userCount}`);
  console.log(`  Seeds:     ${seedCount}`);
  console.log(`  Likes:     ${likeCount}`);
  console.log(`  Favorites: ${favCount}`);
  console.log(`  Follows:   ${followCount}`);
  console.log('══════════════════════════════════');
}

main()
  .catch(e => { console.error('❌ 致命的エラー:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
