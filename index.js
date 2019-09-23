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
        this.player1_board = null;
        this.player2_board = null;

        player1.join(this.uuid);
        player2.join(this.uuid);

        this.player1_carrier = 5;
        this.player1_battleship = 4;
        this.player1_submarine = 3;
        this.player1_cruiser = 3;
        this.player1_destroyer = 2;

        this.player2_carrier = 5;
        this.player2_battleship = 4;
        this.player2_submarine = 3;
        this.player2_cruiser = 3;
        this.player2_destroyer = 2;

        this.player1_sink = 0;
        this.player2_sink = 0;

        player1.room = this;
        player2.room = this;

        this.broadcast("room_joined", {'room': this.uuid});
    }

    shutdown(player){
        if(this.player1 = player) {
            this.player2.room = null;
            queue.push(this.player2);

            this.player2.emit("back_to_lobby", {})
        } else {
            this.player1.room = null;
            queue.push(this.player1);

            this.player1.emit("back_to_lobby", {})
        }

        for( var i = 0; i < rooms.length; i++){
            if ( rooms[i].uuid == this.uuid) {
                rooms.splice(i, 1);
                console.log("Removed room from rooms.")
            }
        }

        console.log(`Room(${this.uuid}) closed because Player(${player.uuid}) left.`)
    }

    broadcast(name, message) {
        io.to(this.uuid).emit(name, message);
    }

    saveBoard(player, board) {
        if(player.uuid == this.player1.uuid) {
            this.player1_board = board;
        } else if(player.uuid == this.player2.uuid) {
            this.player2_board = board;
        }

        if(this.player1_board != null && this.player2_board != null) {
            if(Math.random >= 0.51) {
                this.player1.emit("your_turn", {})
            } else {
                this.player2.emit("your_turn", {})
            }
        }
    }

    getBoard(player) {
        if(player.uuid == this.player1.uuid) {
            return this.player1_board;
        } else if(player.uuid == this.player2.uuid) {
            return this.player2_board;
        }
    }

    getOtherPlayer(player) {
        if(player.uuid == this.player1.uuid) {
            return this.player2;
        } else if(player.uuid == this.player2.uuid) {
            return this.player1;
        }
    }

    getPlayerInfo(player) {
        if(player.uuid == this.player1.uuid) {
            return {"C":this.player1_carrier, 
                    "B": this.player1_battleship,
                    "S": this.player1_submarine,
                    "R": this,player1_cruiser,
                    "D": this.player1_destroyer};
        } else if(player.uuid == this.player2.uuid) {
            return {"C":this.player2_carrier, 
                    "B": this.player2_battleship,
                    "S": this.player2_submarine,
                    "R": this,player2_cruiser,
                    "D": this.player2_destroyer};
        }
    }

    hitPlayer(player, type) {
        if(player.uuid == this.player1.uuid) {
            switch(type) {
                case "C":
                    this.player1_carrier--;
                    return this.player1_carrier;
                case "B":
                    this.player1_battleship--;
                    return this.player1_battleship;
                case "S":
                    this.player1_submarine--;
                    return this.player1_submarine;
                case "R":
                    this.player1_cruiser--;
                    return this.player1_cruiser;
                case "D":
                    this.player1_destroyer--;
                    return this.player1_destroyer;
            }

            if(this.player1_carrier <= 0 && this.player1_battleship <= 0 && this.player1_submarine <= 0 && this.player1_cruiser <= 0 && this.player1_destroyer <= 0) {
                this.player1.emit("lose", {})
                this.player2.emit("win", {})
            }
            
        } else if(player.uuid == this.player2.uuid) {
            switch(type) {
                case "C":
                    this.player2_carrier--;
                    return this.player2_carrier;
                case "B":
                    this.player2_battleship--;
                    return this.player2_battleship;
                case "S":
                    this.player2_submarine--;
                    return this.player2_submarine;
                case "R":
                    this.player2_cruiser--;
                    return this.player2_cruiser;
                case "D":
                    this.player2_destroyer--;
                    return this.player2_destroyer;
            }

            if(this.player2_carrier <= 0 && this.player2_battleship <= 0 && this.player2_submarine <= 0 && this.player2_cruiser <= 0 && this.player2_destroyer <= 0) {
                this.player2.emit("lose", {})
                this.player1.emit("win", {})
            }
        }
    }

    playerSink(player) {
        if(player.uuid == this.player1.uuid) {
            this.player1_sink++;
            if(this.player1_sink >= 5) {
                this.player1.emit("lose", {})
                this.player2.emit("win", {})
                return true;
            }
        } else if(player.uuid == this.player2.uuid) {
            this.player2_sink++;
            if(this.player2_sink >= 5) {
                this.player2.emit("lose", {})
                this.player1.emit("win", {})
                return true;
            }
        }

        return false;
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

    socket.on('fire', function(msg){
        console.log(`Player ${socket.uuid} fired at ${msg.x}, ${msg.y}` )

        var otherPlayer = socket.room.getOtherPlayer(socket);
        var board  = socket.room.getBoard(otherPlayer);

        var value = board[msg.x-1][msg.y-1]

        if(value != "_") {
           var result = socket.room.hitPlayer(otherPlayer, value)
           if(result <= 0) {
                if(!socket.room.playerSink(otherPlayer)) {
                    otherPlayer.emit("sunk", {"type":value, "coord":`${msg.x}:${msg.y}`})
                    socket.emit("sunk", {"type":value, "coord":`e${msg.x}:${msg.y}`})
                }
           } else {
                otherPlayer.emit("hit", {"coord":`${msg.x}:${msg.y}`})
                socket.emit("hit", {"coord":`e${msg.x}:${msg.y}`})
           }
        } else {
            otherPlayer.emit("miss", {"coord":`${msg.x}:${msg.y}`})
            socket.emit("miss", {"coord":`e${msg.x}:${msg.y}`})
        }

        otherPlayer.emit("your_turn", {})
    });

    socket.on('board_finished', function(msg){
        socket.room.saveBoard(socket, msg.localBoard)

        console.log(socket.room.player1_board)
    });
});

console.log("The port passed: " + parseInt(process.argv[2]));
http.listen(parseInt(process.argv[2]), () => console.log(`listening on port ${parseInt(process.argv[2])}`));
