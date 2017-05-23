/**
 * Created by xuan on 2017/5/23.
 */
var express = require("express");
var app     = express();
var http    = require("http").Server(app);
var io      = require("socket.io")(http);
var config  = require("./config.json");


function massToRadius(mass) {
    return 4 + Math.sqrt(mass) * 6;
}

function randomInRange(from, to) {
    return Math.floor(Math.random() * (to - from) + from);
}

function randomPosition(radius) {
    return {
        x: randomInRange(radius, config.gameWidth-radius),
        y: randomInRange(radius, config.gameHeight)
    };
}


var defaultUserMass = 30;

function getDefaultUser() {
    return {
        id: -1,
        name: "",
        position: randomPosition(defaultUserMass),
        allMass: defaultUserMass,
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
            radius: massToRadius(defaultUserMass),
            mass: defaultUserMass,
        }]
    };
}

var users = [];
var sockets = {};

io.on("connection", function (socket) {
    console.log("Somebody connect!");
    sockets[socket.id] = socket;

    socket.on("gotit", function (name) {
        var connectUser = getDefaultUser();
        connectUser.name = name;
        connectUser.cells.position.x = connectUser.position.x;
        connectUser.cells.position.y = connectUser.position.y;
        connectUser.cells.color = connectUser.color;
        users.push(connectUser)
    });
    
    socket.on("0", function (target) {
        
    })
});

