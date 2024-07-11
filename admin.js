const prompt = require("prompt-sync")({ sigint: true });
var WebSocket = require('ws');

const DEBUG = process.argv.length > 2 && process.argv[2] == "debug"

const serverPath = DEBUG ? "ws://localhost:8080/" : "wss://wordlewangle.com/"

var pass = null

if (DEBUG) {
    console.log("\nRunning in debug")
}
console.log(`Connecting to ${serverPath}`)
var ws = new WebSocket(serverPath);

ws.sendData = (data) => {
    ws.send(JSON.stringify(data))
}

ws.onmessage = (raw) => {

    let data = JSON.parse(raw.data)
    
    switch(data.type) {

        case "info":

            console.log(`Recieved info: ${data.info}`)

        break;

    }

    acceptCommand()

}


ws.onopen = () => {

    console.log("Connected")

    pass = prompt("Admin Pass: ");
    
    acceptCommand()

};

function acceptCommand() {

    let command = prompt("cmd: ")

    switch(command) {

        case "quit":
            console.log("\nQuitting...\n")
            ws.close()
            break;

        case "num_users":
            ws.sendData({type:"num_users", admin:pass})
            break;

        case "num_games":
            ws.sendData({type:"num_games", admin:pass})
            break;

        case "activate_maintenance":
            ws.sendData({type:"activate_maintenance", admin:pass})
            break;

        case "deactivate_maintenance":
            ws.sendData({type:"deactivate_maintenance", admin:pass})
            break;
    

        default:
            console.log("\nInvalid Command\n")
            acceptCommand()
    }
}

