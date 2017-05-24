/**
 * Created by xuan on 2017/5/23.
 */
var express = require("express");
var app     = express();
var http    = require("http").Server(app);
var io      = require("socket.io")(http);

app.use(express.static(__dirname + "/../client"));

var config = {
    gameWidth: 5000,
    gameHeight: 5000,
    defaultUserMass: 30,
};

function massToRadius(mass) {
    return 4 + Math.sqrt(mass) * 6;
}

function randomInRange(from, to) {
    return Math.floor(Math.random() * (to - from) + from);
}

function randomPosition(radius) {
    return {
        x: randomInRange(radius, config.gameWidth - radius),
        y: randomInRange(radius, config.gameHeight)
    };
}

function getDefaultUser() {
    return {
        id: -1,
        name: "",
        position: randomPosition(config.defaultUserMass),
        allMass: config.defaultUserMass,
        color: Math.round(Math.random() * 360),
        screenWidth: 1080,
        screenHeight: 1920,
        target: {
            x: 0,
            y: 0
        },
        cells: [{
            position: {
                x: 0,
                y: 0
            },
            color: 0,
            radius: massToRadius(config.defaultUserMass),
            mass: config.defaultUserMass,
            speed: 0
        }]
    };
}

var users = [];
var sockets = {};

io.on("connection", function (socket) {
    console.log("Somebody connect!");
    sockets[socket.id] = socket;
    var currentPlayer = {};

    socket.on("gotit", function (name, screenConfig) {
        var connectUser = getDefaultUser();
        connectUser.id = socket.id;
        connectUser.name = name;
        connectUser.cells[0].position.x = connectUser.position.x;
        connectUser.cells[0].position.y = connectUser.position.y;
        connectUser.cells[0].color = connectUser.color;
        users.push(connectUser);
        currentPlayer = connectUser;
    });
    socket.on("0", function (target) {
        if(typeof currentPlayer.position === "undefined")return;
        if (target.x !== currentPlayer.position.x || target.y !== currentPlayer.position.y) {
            currentPlayer.target = target;
            console.log(target.x + " " + target.y);
        }
    });
});

var log = (function () {
    var log = Math.log;
    return function (n, base) {
        return log(n) / (base ? log(base) : 1);
    };
})();

var initMassLog = log(config.defaultUserMass, 4.5);

function movePlayer(player) {
    var x = 0;
    var y = 0;
    for(let i = 0; i < player.cells.length; i++) {
        var target = {
            x: player.x - player.cells[i].x + player.target.x,
            y: player.y - player.cells[i].y + player.target.y
        };
        var  dist = Math.sqrt(Math.pow(target.x, 2) + Math.pow(target.y, 2));
        var deg = Math.atan2(target.y, target.x);
        var slowDown = 1;
        if(player.cells[i].speed <= 6.25) {
            slowDown = log(player.cells[i].mass, 4.5) - initMassLog + 1;
        }

        var deltaY = player.cells[i].speed * Math.sin(deg)/ slowDown;
        var deltaX = player.cells[i].speed * Math.cos(deg)/ slowDown;

        if(player.cells[i].speed > 6.25) {
            player.cells[i].speed -= 0.5;
        }
        if (dist < (50 + player.cells[i].radius)) {
            deltaY *= dist / (50 + player.cells[i].radius);
            deltaX *= dist / (50 + player.cells[i].radius);
        }
        if (!isNaN(deltaY)) {
            player.cells[i].y += deltaY;
        }
        if (!isNaN(deltaX)) {
            player.cells[i].x += deltaX;
        }

        if(player.cells.length > i) {
            var borderCalc = player.cells[i].radius / 3;
            if (player.cells[i].x > config.gameWidth - borderCalc) {
                player.cells[i].x = config.gameWidth - borderCalc;
            }
            if (player.cells[i].y > config.gameHeight - borderCalc) {
                player.cells[i].y = config.gameHeight - borderCalc;
            }
            if (player.cells[i].x < borderCalc) {
                player.cells[i].x = borderCalc;
            }
            if (player.cells[i].y < borderCalc) {
                player.cells[i].y = borderCalc;
            }
            x += player.cells[i].x;
            y += player.cells[i].y;
        }

    }
    player.x = x/player.cells.length;
    player.y = y/player.cells.length;
}

function moveLoop() {
    users.map(function (f) {
        movePlayer(f);
    });
}


function sendUpdates() {
    users.forEach(function (u) {
        var lxLeft = u.x - u.screenWidth/2;
        var lyTop = u.y - u.screenHeight/2;
        var lxRight = u.x + u.screenWidth/2;
        var lyBelow = u.y + u.screenHeight/2;

        var visibleCells = [u];
        visibleCells.concat(users.map(function (f) {
            if(u.id!==f.id){
                for(let k = 0; k<f.cells.length; k++) {
                    if(f.cells[k].position.x + f.cells[k].radius > lxLeft &&
                        f.cells[k].position.x - f.cells[k].radius < lxRight &&
                        f.cells[k].position.y + f.cells[k].radius > lyTop &&
                        f.cells[k].position.y - f.cells[k].radius < lyBelow) {
                        return {
                            id: f.id,
                            name: f.name,
                            radius: f.radius,
                            x: f.cells[k].position.x,
                            y: f.cells[k].position.y,
                            color: f.color,
                            mass: f.cells[k].mass
                        };
                    }
                }
            }
        }).filter(function (f) {
            return f;
        }));
        sockets[u.id].emit("serverTellPlayerMove", visibleCells, [], [], []);
    });
}



setInterval(moveLoop, 1000 / 60);
// setInterval(gameloop, 1000);
setInterval(sendUpdates, 1000 / 40);

// Don"t touch, IP configurations.
var ipaddress = "127.0.0.1";
var serverport = "3000";
http.listen( serverport, ipaddress, function() {
    console.log("[DEBUG] Listening on " + ipaddress + ":" + serverport);
});
