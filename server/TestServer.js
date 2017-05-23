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
var defaultUser = {
    id: -1,
    name: "",
    position: {
        x: 0,
        y: 0
    },
    radius:0,
    allMass: defaultUserMass,
    color: 0,
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
            radius: 0,
            mass: 0,
        }]
};

io.on("connection", function (socket) {
    console.log("Somebody connect!");


    socket.on("gotit", function (name) {
        var connectUser = {};
        

    });
    
    socket.on("0", function (target) {
        
    })
});

