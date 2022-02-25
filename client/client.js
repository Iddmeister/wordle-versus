// GET AWAY!!!!

//Stole keyboard code from https://github.com/WebDevSimplified/wordle-clone

const letters = "abcdefghijklmnopqrstuvwxyz"

const url = new URL(window.location)
var urlCode = url.pathname.substring(1)

const socket = io()

if (urlCode.length > 0) {
    joinGame(urlCode)
}

function joinGame(code) {

    socket.emit("join", {code:code})

}

function createGame() {
    socket.emit("create")
}

socket.on("error", data => {
    alert(data.message)
})

socket.on("gameCreated", data => {
    console.log(data.code)
})


//Letter Logic


class Tile {
    static BLANK = "Blank Tile";
    static INCORRECT = "Grey Letter";
    static MISPLACED = "Yellow Letter";
    static CORRECT = "Green Letter";

    constructor(letter, state) {
        this.letter = letter
        this.dom = document.createElement("div", )
        this.dom.className = "tile"
        this.dom.appendChild(document.createTextNode(this.letter))
        this.setState(state)
    }

    setState(state) {

        self.state = state

        switch(self.state) {

            case Tile.BLANK:
                break

            case Tile.INCORRECT:
                break

            case Tile.MISPLACED:
                break
            
            case Tile.CORRECT:
                break

        }

    }
}



function letterEntered(letter) {

/*

            Need to redo tiles with creation ability
            to allow scrolling rows and a better way of selecting
             -- create tile from template HTML string
             -- create new line of tiles when needed,  no original grid



*/



    //var tile = guessGrid.querySelector(":not([data-letter])")

}

function enter() {

    console.log("Enter!!")

}

function back() {

    console.log("BackSpace!!")

}

$(()=> {

    for (let i=0; i<50; i++) {
    let tile = new Tile("A", Tile.CORRECT)
    $(".guess-grid").append(tile.dom)
    }

    console.log("working...")

    $(".key").click((event) => {
        letterEntered(event.target.dataset.key)
    })
    $("#enter").click(enter)
    $("#back").click(back)
    document.addEventListener("keydown", (event) => {
        if (event.key == "Enter") {
            enter()
        } else if (event.key == "Backspace") {
            back()
        } else if (letters.includes(event.key)) {
            letterEntered(event.key)
        }
    })



})