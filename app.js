const express = require('express')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')

const app = express()

const path = require('path')
const dbPath = path.join(__dirname, 'cricketMatchDetails.db')

let db = null
const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Running at http://localhost:3000/')
    })
  } catch (e) {
    console.log(`Db Error ${e.message}`)
  }
}

initializeDbAndServer()
app.use(express.json())

const player_details_to_playerDetails = dataObject => {
  return {
    playerId: dataObject.player_id,
    playerName: dataObject.player_name,
  }
}

// get player details from player details table

app.get('/players', async (request, response) => {
  const getQuery = `SELECT * FROM player_details;`
  const getQueryResponse = await db.all(getQuery)
  response.send(
    getQueryResponse.map(eachDetails =>
      player_details_to_playerDetails(eachDetails),
    ),
  )
})

//get specific player details from player details table

app.get('/players/:playerId/', async (request, response) => {
  const {playerId} = request.params
  const getSpecificQuery = `SELECT * FROM player_details WHERE player_id = ${playerId};`
  const getSpecificQueryResponse = await db.get(getSpecificQuery)
  response.send(player_details_to_playerDetails(getSpecificQueryResponse))
})

// update player_details with specified Id

app.put('/players/:playerId/', async (request, response) => {
  const {playerId} = request.params
  const updateDetails = request.body
  const {playerName} = updateDetails
  const putSpecificQuery = `UPDATE player_details SET player_name = '${playerName}' WHERE player_id = ${playerId}; `
  const updateRespone = await db.run(putSpecificQuery)
  response.send('Player Details Updated')
})

const match_details_to_matchDetails = dataObject => {
  return {
    matchId: dataObject.match_id,
    match: dataObject.match,
    year: dataObject.year,
  }
}
// get a specific match from the match_details table

app.get('/matches/:matchId/', async (request, response) => {
  const {matchId} = request.params
  const matchSpecificQuery = `SELECT * FROM match_details WHERE match_id = ${matchId};`
  const matchSpecificQueryResponse = await db.get(matchSpecificQuery)
  response.send(match_details_to_matchDetails(matchSpecificQueryResponse))
})

// get the list of all matches of a player

app.get('/players/:playerId/matches/', async (request, response) => {
  const {playerId} = request.params
  const getPlayerIdQuery = `SELECT match_id, match, year FROM match_details natural join player_match_score  WHERE player_match_score.player_id = ${playerId};`
  const getPlayerIdQueryResponse = await db.all(getPlayerIdQuery)
  response.send(
    getPlayerIdQueryResponse.map(eachData =>
      match_details_to_matchDetails(eachData),
    ),
  )
})

const match_id_to_matchId = dataObject => {
  return {
    playerId: dataObject.player_id,
    playerName: dataObject.player_name,
  }
}

// get list of players of specific match

app.get('/matches/:matchId/players/', async (request, response) => {
  const {matchId} = request.params
  const getMatchIdQuery = `SELECT player_id, player_name FROM player_details natural join player_match_score WHERE player_match_score.match_id = ${matchId};`
  const getMatchIdQueryResponse = await db.all(getMatchIdQuery)
  response.send(
    getMatchIdQueryResponse.map(eachData => match_id_to_matchId(eachData)),
  )
})

const player_details_stats_to_playerDetails = dataObject => {
  return {
    playerId: dataObject.player_id,
    playerName: dataObject.player_name,
    totalScore: dataObject.sum_scores,
    totalFours: dataObject.count_fours,
    totalSixes: dataObject.count_sixes,
  }
}

// get the stats of a given specific player by using player_id

app.get('/players/:playerId/playerScores/', async (request, response) => {
  const {playerId} = request.params
  const getStatsQuery = `SELECT player_details.player_id, player_details.player_name, sum(player_match_score.score) as sum_scores, sum(player_match_score.fours) as count_fours, sum(player_match_score.sixes) as count_sixes FROM player_details inner join player_match_score on player_match_score.player_id = player_details.player_id WHERE player_details.player_id = ${playerId};`
  const getStatsQueryResponse = await db.get(getStatsQuery)
  response.send(player_details_stats_to_playerDetails(getStatsQueryResponse))
})
module.exports = app
