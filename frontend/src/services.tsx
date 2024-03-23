import axios from 'axios'
import { useQuery, useQueries } from '@tanstack/react-query'
const PLAYER_USER_NAMES = ['pinghedm', 'weo_af', 'dabbledthings', 'stinkoperson']

export interface Game {
    white: string // URL of the white player's profile
    black: string // URL of the black player's profile
    url: string // URL of this game
    fen: string // current FEN - one line descr of moves
    pgn: string // current PGN - more human readable descr
    turn: 'black' | 'white' // player to move
    move_by: number // timestamp of when the next move must be made - this is "0" if the player-to-move is on vacation
    draw_offer?: 'black' | 'white' // (optional) player who has made a draw offer
    last_activity: number // timestamp of the last activity on the game
    start_time: number // timestamp of the game start (Daily Chess only)
    time_control: string // PGN-compliant time control
    time_class: string // time-per-move grouping, used for ratings
    rules: string // game variant information (e.g., "chess960")
    tournament?: string //URL pointing to tournament (if available),
    match?: string //URL pointing to team match (if available)
}
const _getGamesForPlayer = async (userName: string) => {
    const res = await axios.get<{ games: Game[] }>(`https://api.chess.com/pub/player/${userName}/games`)
    return res.data.games
}

export const useGames = () => {
    const queries = useQueries({
        queries: PLAYER_USER_NAMES.map(name => ({
            queryKey: ['games_for', name],
            queryFn: () => _getGamesForPlayer(name),
            select: (games: Game[]) =>
                games.filter(
                    (g: Game) =>
                        PLAYER_USER_NAMES.some(n => g.black.includes(n)) &&
                        PLAYER_USER_NAMES.some(n => g.white.includes(n))
                ),
        })),
    })
    return queries.map(q => q.data)
}

export const useGamesForPlayer = (userName: string) => {
    const query = useQuery({ queryKey: ['games_for', userName], queryFn: () => _getGamesForPlayer(userName) })
    return query
}

interface Stats {
    last: {
        // the current stats
        date: number // timestamp of the last rated game finished
        rating: number // most-recent rating
        rd: number // the Glicko "RD" value used to calculate ratings changes.  basically the stdev
    }
    best: {
        // the best rating achieved by a win
        date: number // timestamp of the best-win game
        rating: number // highest rating achieved
        game: string // URL of the best-win game
    }
    record: {
        // summary of all games played
        win: number // number of games won
        loss: number // number of games lost
        draw: number // number of games drawn
        time_per_move: number // integer number of seconds per average move
        timeout_percent: number // timeout percentage in the last 90 days
    }
}

export interface Player {
    '@id': string // the url you used to get this json
    url: string // the chess.com user's profile page (the username is displayed with the original letter case)
    username: string // the username of this player
    player_id: number // the non-changing Chess.com ID of this player
    title?: string // (optional) abbreviation of chess title, if any
    status: 'closed' | 'closed:fair_play_violations' | 'basic' | 'premium' | 'mod' | 'staff' // account status:
    name?: string // (optional) the personal first and last name
    avatar?: string // (optional) URL of a 200x200 image
    location?: string // (optional) the city or location
    country: string // [url] API location of this player's country's profile
    joined: number // timestamp of registration on Chess.com
    last_online: number // timestamp of the most recent login
    followers: number // the number of players tracking this player's activity
    is_streamer: boolean //if the member is a Chess.com streamer
    twitch_url?: string
    fide?: number // FIDE rating
    stats?: Stats
}

export const useUsers = () => {
    const _get = async (userName: string): Promise<Player> => {
        const playerRes = await axios.get<Player>(`https://api.chess.com/pub/player/${userName}`)
        const statsRes = await axios.get<{ chess_daily: Stats }>(`https://api.chess.com/pub/player/${userName}/stats`)
        return { ...playerRes.data, stats: statsRes.data?.['chess_daily'] }
    }
    const queries = useQueries({
        queries: PLAYER_USER_NAMES.map(name => ({ queryKey: ['player', name], queryFn: () => _get(name) })),
    })
    return queries.map(q => q.data)
}
