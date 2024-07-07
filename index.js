const express = require("express")
const path = require("path")
const crypto = require("crypto")
const ws = require("ws")
const fs = require("fs")
const https = require("https")
const words = require("./words")

const dotenv = require('dotenv')
dotenv.config()

const WORD_LENGTH = 5
const PORT = 443
const DEBUG = process.argv.length > 2 && process.argv[2] == "debug"

if (!DEBUG) console.debug = ()=>{}

var games = {}

var app = express()

var privateKey = fs.readFileSync(process.env.PRIVATE_KEY)
var certificate = fs.readFileSync(process.env.CERTIFICATE)

var options = {
    key:privateKey,
    cert:certificate,
}

var app = express()

var httpsServer = https.createServer(options, app).listen(PORT, () => {
    console.log(`Server Listening On Port ${PORT}`)
})


app.use("/", express.static(path.join(__dirname, "client"), {extensions:["html"]}))
app.use("/join/", express.static(path.join(__dirname, "client"), {extensions:["html"]}))

app.get("/*", (req, res) => {
    res.sendFile(path.join(__dirname, "client/index.html"))
})

app.get("/join/*", (req, res) => {
    res.sendFile(path.join(__dirname, "client/index.html"))
})


function setCharAt(str,index,chr) {
    if(index > str.length-1) return str;
    return str.substring(0,index) + chr + str.substring(index+1);
}


var socketServer = new ws.Server({server:httpsServer})

socketServer.on("connection", (client) => {
    console.log("Client Connected")
    client.sendData = (data) => {client.send(JSON.stringify(data))}
    
    client.on("close", (code) => {
        console.log("Disconnect", code)
    })

    client.on("message", (raw) => {

        try {

            let data = JSON.parse(raw)

            if (!data.type) data.type = ""

            switch(data.type) {

                case "createGame":
            
                    console.log("Creatng Game")
                    let game = new Game(client)

                    break;

                case "joinGame":
                    if (("code" in data) && games[data.code]) {
                        let game = games[data.code]
                        if (game.opponent) {
                            client.sendData({type:"error", error:"Game Already Started"})
                            return
                        }
                        game.join(client)
                    } else {
                        client.sendData({type:"error", error:"Game Does Not Exist"})
                    }

                    break;

                default:

                    if (client.player) {
                        client.player.request(data)
                    }

                    break;

            }

    } catch {

        console.log("Invalid Data")

    }

    })

})


class Player {
    constructor(client, game, opponent=null) {
        this.game = game
        this.client = client
        this.canGuess = false
        this.guess = null
        this.opponent = opponent
        this.target = null
    }

    sendData(data) {
        this.client.sendData(data)
    }

    request(data) {
        if (!this.game) return

        switch(data.type) {

            case "submitTarget":

                //!!!!!!!!!!!!!!!

                //Need To Check Target Word

                //!!!!!!!!!!!!!!!
                
                this.target = data.target

                this.opponent.sendData({type:"opponentReady"})

                this.game.checkCanStart()

                break;

            case "submitGuess":
                if (this.canGuess && !this.guess) {
                    if (data.guess.length < WORD_LENGTH) {
                        return
                    }

                    if (!words.dictionary.includes(data.guess.toLowerCase())) {
                        return
                    }

                    this.guess = data.guess.toLowerCase()
                    this.sendData({type:"submittedGuess", guess:data.guess})
                    this.opponent.sendData({type:"opponentReady"})
                    this.game.submittedGuess()
                }
                break;

        }
    }
}

class Game {

    async generateGameCode() {
        let code = crypto.randomBytes(3).toString('hex').toUpperCase()
        if (games[code]) {
            return generateGameCode()
        } else {
            return code
        }
    }

    sendPlayersData(data) {
        this.player1.sendData(data)
        this.player2.sendData(data)
    }

    //This might work properly :)
    colourWord(guess, target) {

        let tWord = target
        let cWord = guess
    
        for (let letter = 0; letter < guess.length; letter++) {
    
            if (guess[letter] == target[letter]) {
                cWord = setCharAt(cWord, letter, "@")
                tWord = setCharAt(tWord, letter, "@")
            }
    
        }
    
        for (let letter = 0; letter < guess.length; letter++) {
    
            if (!(cWord[letter] == "@")) {
    
                let index = tWord.indexOf(guess[letter])
                if (index != -1) {
                    cWord = setCharAt(cWord, letter, "/")
                    tWord = setCharAt(tWord, index, "/")
                } else {
                    cWord = setCharAt(cWord, letter, "-")
                }
            }
    
        }
    
        return cWord
    }

    constructor(player1) {

        this.roundTime = 60000
        this.gameTime = 120000

        this.player1 = new Player(player1, this)
        player1.player = this.player1
        this.player2 = null
        let code = this.generateGameCode().then(code => {
            this.code = code
            games[code] = this
            this.player1.sendData({type:"gameCreated", code:code})
        })
    }

    join(player2) {
        this.player2 = new Player(player2, this, this.player1)
        player2.player = this.player2
        this.player1.opponent = this.player2
        
        this.sendPlayersData({type:"gameJoined"})

        this.checkCanStart()

    }

    checkCanStart() {
        if (this.player1.target && this.player2.target) {
            this.startGame()
        }
    }

    startGame() {
        this.roundTimeout = setTimeout(() => {
            this.roundTimeOver()
        }, this.roundTime)

        console.log("Game Started")

        this.player1.canGuess = true
        this.player2.canGuess = true

        this.sendPlayersData({type:"gameStarted"})

    }

    roundTimeOver() {
        this.nextRound()
    }

    gameTimeOver() {
        console.log("Game Over")
        this.destroyGame()

    }

    destroyGame() {
        clearInterval(this.roundTimeout)
        console.log(`Removing Game ${this.code}`)
        delete games[this.code]
    }

    submittedGuess() {

        if (this.player1.guess && this.player2.guess) {
            this.nextRound()
        }

    }

    nextRound() {

        clearTimeout(this.roundTimeout)
        this.roundTimeout = setTimeout(() => {
            this.roundTimeOver()
        }, this.roundTime)

        if (!this.player1.guess) {
            this.player1.guess = "?????"
        }

        if (!this.player2.guess) {
            this.player2.guess = "?????"
        }
    
        this.player1.sendData({
            type:"revealMyGuess", 
            guess:this.player1.guess, 
            colours:this.colourWord(this.player1.guess, this.player2.target)
        })

        this.player1.sendData({
            type:"revealOpponentGuess", 
            guess:this.player2.guess, 
            colours:this.colourWord(this.player2.guess, this.player2.target)
        })


        this.player2.sendData({
            type:"revealMyGuess", 
            guess:this.player2.guess, 
            colours:this.colourWord(this.player2.guess, this.player1.target)
        })

        this.player2.sendData({
            type:"revealOpponentGuess", 
            guess:this.player1.guess, 
            colours:this.colourWord(this.player1.guess, this.player1.target)
        })

        if (this.player1.guess === this.player2.target && this.player2.guess === this.player1.target) {
            this.endGame(null)
        } else if (this.player1.guess === this.player2.target) {
            this.endGame(this.player1)
        } else if (this.player2.guess === this.player1.target) {
            this.endGame(this.player2)
        } else {

            this.player1.canGuess = true
            this.player2.canGuess = true
            this.player1.guess = null
            this.player2.guess = null
            
            this.sendPlayersData({type:"nextRound"})

        }

    }

    endGame(winner) {
        if (!winner) {
            this.sendPlayersData({type:"gameEnded", winner:"draw"})
        } else if (winner == this.player1) {
            this.player1.sendData({type:"gameEnded", winner:"you"})
            this.player2.sendData({type:"gameEnded", winner:"opponent"})
        } else {
            this.player2.sendData({type:"gameEnded", winner:"you"})
            this.player1.sendData({type:"gameEnded", winner:"opponent"})
        }
        this.destroyGame()
    }

}

