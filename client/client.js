const WORD_LENGTH = 5
const FLIP_ANIMATION_DURATION = 200
const SLIDE_ANIMATION_DURATION = 200

const tileHTML = '<div class="tile"> </div>'
const rowHTML = '<div class="row"></div>'

var roundTimer
var gameTimer
var canType = true
var gameStarted = false

class Timer {

    constructor(dom, time, timeUp) {
        this.maxTime = time
        this.time = time
        this.object = dom
        this.interval = null
        this.timeUp = timeUp
        this.startTime = null
    }

    update() {
        let passedTime = (new Date()).getTime()-this.startTime
        this.time = Math.max(0, this.maxTime-passedTime)
        this.setTimer(this.time/this.maxTime)
        if (this.time == 0) {
            this.timeUp()
            this.stop()
        }

    }

    start() {
        this.startTime = (new Date()).getTime()
        this.interval = setInterval(() => {this.update()}, 10)
    }

    stop() {
        if (!this.interval) return
        clearInterval(this.interval)
        this.interval = null
    }

    reset() {
        this.stop()
        this.time = this.maxTime
        this.setTimer(this.time/this.maxTime)

    }

    setTimer(amount) {

        $(this.object).css("background-image", `conic-gradient(white ${amount*360}deg, hsl(240, 3%, 7%) 0deg`)
        // $(this.object).children("div").text(Math.ceil(this.time/1000))
        $(this.object).children("div").text(Math.ceil((amount*this.maxTime)/1000))

    
    }
}


function createDOM(text) {
    let t = document.createElement("template")
    t.innerHTML = text.trim()
    return t.content.firstChild
}

const views = ["#menu", "#lobby", "#loading", "#game"]

switchView("#loading")

function switchView(newView) {
    for (let view of views) {
        if (view != newView) $(view).hide()
    }
    $(newView).show()
}

var socket = new WebSocket("ws://"+location.host)

socket.sendData = (data) => {
    socket.send(JSON.stringify(data))
}

socket.onerror = (event) => {

}

socket.onclose = (event) => {

}

socket.onopen = (event) => {

    
    if (location.pathname.startsWith("/join/")) {
        let code = location.pathname.replace("/join/", "")
        code = code.replace("/", "")
        if (!(code.length <= 0)) {
            socket.sendData({type:"joinGame", code:code})
            switchView("#loading")
            return
        }
    }

    switchView("#menu")
    //switchView("#game")

}

socket.onmessage = (raw) => {
    let data = JSON.parse(raw.data)
    switch(data.type) {
        case "gameCreated":
            switchView("#lobby")
            $("#game-link").text(location.origin+"/join/"+data.code)
            break;

        case "gameJoined":

            switchView("#game")
            addRow()

            break;
            
        case "gameStarted":
            $("#waiting").hide()

            gameStarted = true
            addRow()

            roundTimer = new Timer($("#round-timer"), 20000, () => {
                roundTimer.reset()
            })
            roundTimer.start()

            canType = true

            break;

        case "gameEnded":

            roundTimer.stop()

            if (data.winner == "draw") {
                $("#end-game-message").text("Draw!")
            } else if (data.winner == "you") {
                $("#end-game-message").text("You Won!")
            } else {
                $("#end-game-message").text("You Lost :(")
            }
            $("#end-game-message").show()

            break;

        case "error":

            console.log(data.error)
            switchView("#menu")

            break;

        case "revealMyGuess":

            $(currentRow).children(".tile").removeClass("entered")

            if (data.guess == "?????") {
                Array.from(currentRow.children).forEach((tile, index, array) => {
                    tile.innerHTML = "~"
                })
                colourRow(currentRow, "-----")
                return
            }

            colourRow(currentRow, data.colours)

            break;

        case "revealOpponentGuess":

            if (data.guess == "?????") {
                let row = addRow("~~~~~", true)
                colourRow(row, "-----")
                return
            }

            let row = addRow(data.guess, true)
            colourRow(row, data.colours)

            break;

        case "nextRound":
            roundTimer.reset()
            roundTimer.start()
            addRow()
            canType = true
            break;

    }
}


function createGame() {

    socket.sendData({type:"createGame"})

}

function joinGame() {

}


var currentRow = null

function addRow(text="", opponent=false) {

    let row = createDOM(rowHTML)
    for (let t = 0; t < WORD_LENGTH; t++) {
        let tile = createDOM(tileHTML)
        if (opponent) {tile.classList.add("opponent")}
        if (text.length > 0) tile.innerHTML = text[t]
        row.appendChild(tile)
    }
    $("#guess-grid").append(row)
    if (text.length <= 0) {
        currentRow = row
    }

    $("#guess-grid")[0].scrollTop = $("#guess-grid")[0].scrollHeight

    return row

}

function getWordFromRow(row) {
    return Array(row.children).map(tile => {
        return $(tile).text()
    }).join()
}

function enterRow(row) {
    if (!row) return

    if (!canType) return

    let word = getWordFromRow(row).replace(" ", "")

    if (word.length < WORD_LENGTH) {
        //showAlert("Not enough letters")
        console.log("Not enough letters")
        return
    }

    if (!gameStarted) {
        if (!targetWords.includes(word.toLowerCase())) {
            console.log("Not in target word list")
            return
        }

        socket.sendData({type:"submitTarget", target:word.toLowerCase()})

        $("#target-word").text(word.toUpperCase())

        canType = false

        $(currentRow).remove()
        $("#word-prompt").hide()
        $("#waiting").show()
        currentRow = null

        console.log("Submitted Target Word")
        return
    }

    if (!dictionary.includes(word.toLowerCase())) {
        //showAlert("Not in word list")
        console.log("Not in word list")
        return
    }

    socket.sendData({type:"submitGuess", guess:word.toLowerCase()})

    canType = false

    $(currentRow).children(".tile").addClass("entered")

    console.log("Submitted Guess")
}

function setCharAt(str,index,chr) {
    if(index > str.length-1) return str;
    return str.substring(0,index) + chr + str.substring(index+1);
}


function colourRow(row, colours) {

    let colouredWord = colours

    Array.from(row.children).forEach((tile, index, array) => {
        // let key = document.getElementById("keyboard").querySelector(`[data-key="${tile.innerHTML.toUpperCase()}"i]`)
        // key.classList.add("wrong")
    
        switch(colouredWord[index]) {
          case "/":
            flipTile(tile, index, array, "wrong-location")
            break;
          case "@":
            flipTile(tile, index, array, "correct")
            break;
          default:
            flipTile(tile, index, array, "wrong")
        }
    
    
      })

}

function flipTile(tile, index, array, state) {
    tile.dataset.state = "flipping"
    setTimeout(() => {
        tile.classList.add("flip")
    }, (index * FLIP_ANIMATION_DURATION) / 2)
  
    tile.addEventListener("transitionend", ()=>{
      tile.classList.remove("flip")
      tile.style.color = "white"
      tile.dataset.state = state
      tile.style.color = "--font-colour"
      if (index === array.length - 1) {
          tile.addEventListener(
            "transitionend",
            () => {
              //startInteraction()
            }, {once:true}
          )  
        }
      }
    )
}

function removeLetter() {
    if (!currentRow) return

    if (!canType) return

    let tile = undefined

    for (child of currentRow.children) {
        if (!($(child).text() === " " || $(child).text() === "")) {
            tile = child
        }
    }

    if (tile) {
        $(tile).text(" ")
    } else {
        //Display error - no letters to delete
    }
}

function addLetter(letter) {
    if (!currentRow) return

    if (!canType) return

    let tile = undefined

    for (child of currentRow.children) {
        if ($(child).text() === " " || $(child).text() === "") {
            tile = child
            break
        }
    }

    if (tile) {
        $(tile).text(letter)
    } else {
        //Display Error
        console.log("Out of space")
    }

}

function physicalKeyPressed(event) {

    if (event.key === "Enter") {
        enterRow(currentRow)
        return
      }
    
      if (event.key === "Backspace" || event.key === "Delete") {
        removeLetter()
        return
      }


    if (event.key.match(/^[a-z]$/) || event.key.match(/^[A-Z]$/)) {
        addLetter(event.key.toUpperCase())
        return
      }
}



$(()=> {
    $(document).on("keydown", physicalKeyPressed)
})

