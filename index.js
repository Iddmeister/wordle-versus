const express = require("express")
const app = express()
app.use(express.static('client'))
const server = require('http').Server(app)
const io = require("socket.io")(server)

const PORT = 8080

class Game {
    constructor(code, player1, player2) {
        this.code = code
        this.player1 = player1
        this.player2 = player2
    }

    isFull() {
        return this.player1 && this.player2
    }

    start() {
        if (!this.isFull()) {
            return
        }
        console.log("Start")
        //Start Game

    }

}

var games = {}

function generateCode() {

    let code = Math.random() * 100000 | 0
    if (code in games) {
        return generateCode()
    } else {
        return code
    }

}

function createGame(player1, player2) {

    let code = generateCode()
    var game = new Game(code, player1, player2)
    games[code] = game
    return game

}

function joinGame(player, code) {

    try {
        let game = games[code]

        if (game.isFull()) {
            player.emit("error", {"message":"Game Full"})
            return
        }

        game.player2 = player
        game.start()

    } catch(err) {
        player.emit("error", {"message":"Game Not Found"})
        //player.emit("error", {"message":err.message})

    }
}

io.on("connection", socket => {

    socket.on("join", data => {

        joinGame(socket, data.code)


    })

    socket.on("create", data => {
        let game = createGame(socket, null)
        socket.emit("gameCreated", {code:game.code})
    })

})

app.get("/*", (req, res) => {
    
    res.sendFile(__dirname+"/client/client.html")

})

server.listen(PORT, () => {
    console.log("Listening on " + String(PORT))
})