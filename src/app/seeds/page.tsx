import SiteShell from '../../components/SiteShell'
import SeedSearchBoard from '../../components/SeedSearchBoard'

export default function SeedsPage() {
  return (
    <SiteShell
      title="シード検索"
      subtitle="自分の練習したい地形のシード値を探してみましょう。"
      icon="fa-magnifying-glass"
    >
      <SeedSearchBoard />
    </SiteShell>
  )
}
