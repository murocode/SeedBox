import PlayerCard from './PlayerCard'
import HorizontalScroller from './HorizontalScroller'

type Player = { username: string; avatarUrl?: string | null; pbTime?: number | null }

type Props = {
  players: Player[]
}

export default function PlayerRow({ players }: Props) {
  return (
    <HorizontalScroller
      items={players.map(player => <PlayerCard key={player.username} player={player} />)}
      itemClassName="w-[240px] shrink-0 sm:w-[260px]"
    />
  )
}
