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