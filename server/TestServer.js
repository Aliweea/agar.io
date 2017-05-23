/**
 * Created by xuan on 2017/5/23.
 */
var express = require("express");
var app     = express();
var http    = require("http").Server(app);
var io      = require("socket.io")(http);

var config = {
    gameWidth: 5000,
    gameHeight: 5000,
    defaultUserMass: 30
}

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

    socket.on("gotit", function (name) {
        var connectUser = getDefaultUser();
        connectUser.name = name;
        connectUser.cells.position.x = connectUser.position.x;
        connectUser.cells.position.y = connectUser.position.y;
        connectUser.cells.color = connectUser.color;
        users.push(connectUser)
        currentPlayer = connectUser;
    });
    socket.on("0", function (target) {
        if (target.x !== currentPlayer.x || target.y !== currentPlayer.y) {
            currentPlayer.target = target;
        }
    });
});

log = (function () {
    var log = Math.log;
    return function (n, base) {
        return log(n) / (base ? log(base) : 1);
    };
})();

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

    })
}

setInterval(moveloop, 1000 / 60);
// setInterval(gameloop, 1000);
setInterval(sendUpdates, 1000 / c.networkUpdateFactor);

// Don't touch, IP configurations.
var ipaddress = process.env.OPENSHIFT_NODEJS_IP || process.env.IP || c.host;
var serverport = process.env.OPENSHIFT_NODEJS_PORT || process.env.PORT || c.port;
http.listen( serverport, ipaddress, function() {
    console.log('[DEBUG] Listening on ' + ipaddress + ':' + serverport);
});
