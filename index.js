const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const uuid = require("uuid/v1");

var queue = [];
var rooms = [];

app.use('/public', express.static(__dirname + '/public'))
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/test.html')
});

io.on('connection', (socket) => {
    socket.uuid = uuid();
    queue.push(socket);
    checkPair()

    console.log(`New player joined! UUID: ${socket.uuid}`);
});

function checkPair() {
    if(queue.length >= 2) {
        var room = new Room(queue[0], queue[1])
        rooms.push(room);
        queue.shift();
        queue.shift();

        console.log(`New Pair Made! Room ID: ${room.uuid}`)
    }
}

class Room {
    constructor(player1, player2) {
        this.uuid = uuid();
        this.player1 = player1;
        this.player2 = player2;

        player1.join(uuid);
        player2.join(uuid);

        this.broadcast("room_joined", {'room': this.uuid})
    }

    broadcast(name, mesage) {
        io.to(this.uuid).emit(name, mesage);
    }
}

console.log("The port passed: " + parseInt(process.argv[2]));
http.listen(parseInt(process.argv[2]), () => console.log(`listening on port ${parseInt(process.argv[2])}`));