const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const uuid = require("uuid/v1");

class Queue {
    constructor() {
        this.list = [];
    }

    push(player) {
        console.log(`Player added to Queue: ${player.uuid}`)
        this.list.push(player);
        this.checkPair()
    }

    pop() {
        return this.list.shift();
    }

    remove(player) {
        for( var i = 0; i < this.list.length; i++){
            if ( this.list[i].uuid == player.uuid) {
              this.list.splice(i, 1);
              console.log("Removed player from queue.")
            }
         }
    }

    checkPair() {
        if(this.list.length >= 2) {
            var room = new Room(this.pop(), this.pop())
            rooms.push(room);

            console.log(`New Pair Made! Room ID: ${room.uuid}`)
        }
    }
}

class Room {
    constructor(player1, player2) {
        this.uuid = uuid();
        this.player1 = player1;
        this.player2 = player2;

        player1.join(uuid);
        player2.join(uuid);

        player1.room = this;
        player2.room = this;

        this.broadcast("room_joined", {'room': this.uuid})
    }

    shutdown(player){
        if(this.player1 = player) {
            this.player2.room = null;
            queue.push(this.player2);
        } else {
            this.player1.room = null;
            queue.push(this.player1);
        }

        for( var i = 0; i < rooms.length; i++){
            if ( rooms[i].uuid == this.uuid) {
              rooms.splice(i, 1);
              console.log("Removed room from rooms.")
            }
         }

        console.log(`Room(${this.uuid}) closed because Player(${player.uuid}) left.`)
    }

    broadcast(name, mesage) {
        io.to(this.uuid).emit(name, mesage);
    }
}

var queue = new Queue();
var rooms = [];

app.use('/public', express.static(__dirname + '/public'))
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html')
});

io.on('connection', (socket) => {
    socket.uuid = uuid();
    console.log(`New player joined! UUID: ${socket.uuid}`);
    queue.push(socket);
    queue.checkPair()

    socket.on('disconnect', function(){
        queue.remove(socket);

        if(socket.room != null) {
            socket.room.shutdown(socket)
        }

        console.log(`Player left: ${socket.uuid}`)
    })
});

console.log("The port passed: " + parseInt(process.argv[2]));
http.listen(parseInt(process.argv[2]), () => console.log(`listening on port ${parseInt(process.argv[2])}`));
