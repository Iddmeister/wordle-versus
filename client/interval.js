onmessage = (event) => {
    setInterval(() => {
        postMessage("tick")
    }, event.data)
}