import { useMemo } from 'react'
import { Game, Player, useGames, useUsers } from './services'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Layout, Table, Typography } from 'antd'
import { ColumnsType } from 'antd/es/table'
import { DateTime } from 'luxon'
import humanizeDuration from 'humanize-duration'

const PlayersTable = () => {
  const users = useUsers()
  const columns: ColumnsType<Player> = [
    {
      key: 'name',
      title: 'Player',
      render: (p: Player) => (
        <a href={p.url} target="_blank" rel="noreferer">
          {p.username}
        </a>
      ),
      sorter: true,
    },
    {
      key: 'rating',
      title: 'Rating',
      render: p => (
        <Typography.Text>
          {p?.stats?.last?.rating ?? '-'}{' '}
          <Typography.Text type="secondary">(+/- {p?.stats?.last?.rd ?? 0})</Typography.Text>
        </Typography.Text>
      ),
      sorter: (a, b) => ((a?.stats?.last?.rating ?? 0) < (b?.stats?.last?.rating ?? 0) ? -1 : 1),
      defaultSortOrder: 'descend',
    },
    {
      key: 'bestRating',
      title: 'PB Rating',
      render: p => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {p?.stats?.best?.rating ?? '-'}
          {p?.stats?.best?.date ? (
            <a href={p?.stats?.best?.game ?? ''} target="_blank" rel="noreferer">
              <Typography.Text type="secondary">
                {DateTime.fromSeconds(p?.stats?.best?.date).toLocaleString(DateTime.DATE_SHORT)}
              </Typography.Text>
            </a>
          ) : null}
        </div>
      ),
      sorter: (a, b) => ((a?.stats?.best?.rating ?? 0) < (b?.stats?.best?.rating ?? 0) ? -1 : 1),
    },
    {
      key: 'wins',
      title: 'W',
      align: 'right',
      width: 100,
      sorter: (a, b) => ((a?.stats?.record?.win ?? 0) < (b?.stats?.record?.win ?? 0) ? -1 : 1),
      render: p => <Typography.Text>{p?.stats?.record?.win ?? 0}</Typography.Text>,
    },
    {
      key: 'losses',
      title: 'L',
      align: 'right',
      width: 100,
      sorter: (a, b) => ((a?.stats?.record?.loss ?? 0) < (b?.stats?.record?.loss ?? 0) ? -1 : 1),
      render: p => <Typography.Text>{p?.stats?.record?.loss ?? 0}</Typography.Text>,
    },
    {
      key: 'draws',
      title: 'D',
      align: 'right',
      width: 100,
      sorter: (a, b) => ((a?.stats?.record?.draw ?? 0) < (b?.stats?.record?.draw ?? 0) ? -1 : 1),
      render: p => <Typography.Text>{p?.stats?.record?.draw ?? 0}</Typography.Text>,
    },
    {
      key: 'timePerMove',
      title: 'Avg Time Per Move',
      render: p =>
        p?.stats?.record?.time_per_move
          ? humanizeDuration(p.stats.record.time_per_move * 1000, {
              units: ['m', 's'],
              round: true,
            })
          : Infinity,
    },
  ]

  return (
    <>
      <Typography.Title level={4}>People</Typography.Title>
      <Table
        dataSource={(users.filter(u => !!u) ?? []).map(u => ({ ...u, key: u?.player_id }))}
        //@ts-ignore
        columns={columns}
        pagination={false}
        size="large"
        scroll={{ x: 'max-content' }}
      />
    </>
  )
}

const GamesTable = () => {
  const usersGames = useGames()

  const gamesByUrl = useMemo(
    () => Object.fromEntries((usersGames ?? []).flatMap(games => (games ?? []).map(g => [g.url, g]))),
    [usersGames]
  )

  const columns: ColumnsType<Game> = [
    {
      key: 'view',
      title: '',
      render: g => (
        <a href={g.url} target="_blank" rel="noreferer">
          👁
        </a>
      ),
      width: 50,
    },
    { key: 'white', title: 'White', render: g => g.white.split('/').at('-1') },
    { key: 'black', title: 'Black', render: g => g.black.split('/').at('-1') },
    { key: 'turn', title: 'Next Move', render: g => g[g.turn].split('/').at('-1') },
    {
      key: 'length',
      title: 'Length',
      render: g => {
        const start = DateTime.fromSeconds(g.start_time)
        const now = DateTime.now()
        const ms = now.diff(start).toMillis()
        return humanizeDuration(ms, {
          units: ['d', 'h', 'm', 's'],
          round: true,
          largest: 2,
        })
      },
    },
  ]

  return (
    <>
      <Typography.Title level={4}>Current Games</Typography.Title>
      <Table
        pagination={false}
        size="large"
        scroll={{ x: 'max-content' }}
        dataSource={Object.values(gamesByUrl).map(g => ({ ...g, key: g.url }))}
        columns={columns}
      />
    </>
  )
}

const ActualApp = () => {
  return (
    <Layout style={{ height: '100vh', width: '100vw' }}>
      <Layout.Header style={{ color: 'white' }}>Chess.com, but less</Layout.Header>
      <Layout.Content style={{ height: '100%', width: '100%', padding: '24px', overflowY: 'auto' }}>
        <PlayersTable />
        <GamesTable />
      </Layout.Content>
    </Layout>
  )
}

const baseQueryClient = new QueryClient()
baseQueryClient.setDefaultOptions({
  queries: {
    staleTime: 10000,
  },
})
const App = () => {
  return (
    <QueryClientProvider client={baseQueryClient}>
      <ActualApp />
    </QueryClientProvider>
  )
}

export default App
