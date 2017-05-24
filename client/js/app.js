/**
 * Created by kanxuan on 2017/5/23.
 */

var io = require("socket.io-client");
var Canvas = require("./canvas");
var global = require("./global");
var socket;

var playerNameInput = document.getElementById("playerNameInput");

window.onload = function () {
    startGame();
};

var foods = [];
var viruses = [];
var fireFood = [];
var users = [];
window.canvas = document.getElementById('cvs');
window.canvas.width = window.innerWidth;
window.canvas.height = window.innerHeight;
window.canvas.addEventListener("mousemove", function (mouse) {
    global.target.x = mouse.clientX - window.canvas.width/ 2;
    global.target.y = mouse.clientY - window.canvas.height / 2;
});
var graph = window.canvas.getContext('2d');


function startGame() {
    // global.playerName = playerNameInput.valueOf().replace(/(<([^>]+)>)/ig, "").substring(0, 25);
    global.playerName = "test";
    var screenSize = {
        sreenWidth: window.innerWidth,
        screenHeight: window.innerHeight
    };
    global.screenSize = screenSize;
    global.target =  {
        x: 0,
        y: 0
    };
    if (!socket) {
        socket = io();
        setupSocket(socket);
    }
    socket.emit('gotit', global.playerName, screenSize);
    animloop();

}

function setupSocket(socket) {
    socket.on('serverTellPlayerMove', function (userData, foodsList, massList, virusList) {
        var playerData = userData[0];
        var offsetx = playerData.position.x - global.screenSize.sreenWidth/2;
        var offsety = playerData.position.y - global.screenSize.screenHeight/2;

        var temp = playerData.cells.map(function (c) {
            return {
                name: playerData.name,
                radius: c.radius,
                color: c.color,
                x: c.position.x - offsetx,
                y: c.position.y - offsety,
                mass: c.mass
            };
        });

        for(var j = 1; j<userData.length;j++) {
            userData[j].x -= offsetx;
            userData[j].y -= offsety;
            temp.push(userData[j]);
        }
        users = temp;
        foods = foodsList;
        viruses = virusList;
        fireFood = massList;
    });
}

var playerConfig = {
    border: 6,
    textColor: '#FFFFFF',
    textBorder: '#000000',
    textBorderSize: 3,
    defaultSize: 30
};

function drawCircle(centerX, centerY, radius, sides, color) {
    var theta = 0;
    var x = 0;
    var y = 0;

    graph.beginPath();

    for (var i = 0; i < sides; i++) {
        theta = (i / sides) * 2 * Math.PI;
        x = centerX + radius * Math.sin(theta);
        y = centerY + radius * Math.cos(theta);
        graph.lineTo(x, y);
    }

    graph.strokeStyle = 'hsl(' + color + ', 100%, 45%)';
    graph.fillStyle = 'hsl(' + color + ', 100%, 50%)';
    graph.lineWidth = playerConfig.border;

    graph.closePath();
    graph.stroke();
    graph.fill();
}


function drawUser() {
    users.forEach(function (u) {
        var points = 30 + ~~(u.mass/5);
        drawCircle(u.x, u.y, u.radius, points, u.color);
    });
}


window.requestAnimFrame = (function() {
    return  window.requestAnimationFrame       ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame    ||
        window.msRequestAnimationFrame     ||
        function( callback ) {
            window.setTimeout(callback, 1000 / 60);
        };
})();

window.cancelAnimFrame = (function(handle) {
    return  window.cancelAnimationFrame     ||
        window.mozCancelAnimationFrame;
})();

function animloop() {
    global.animLoopHandle = window.requestAnimFrame(animloop);
    gameLoop();
}

function gameLoop() {
    drawUser();
    socket.emit('0', global.target);
}