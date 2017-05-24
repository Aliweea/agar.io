var io = require("socket.io-client");
var Canvas = require("./client/js/canvas");
var global = require("./client/js/global");

var socket;

var screenWidth = window.innerWidth;
var screenHeight = window.innerHeight;

var c = document.getElementById("cvs");
var graph = c.getContext("2d");
var users = [];
c.width = screenWidth;
c.height = screenHeight;


var debug = function (args) {
    if (console && console.log){
        console.log(args);
    }
};

var playConfig = {
    border: 6,
    textColor: "#FFFFFF",
    textBorder: "#000000",
    textBorderSize: 3,
    defaultSize: 30
};

var player = {
    id: -1,
    x: global.screenWidth / 2,
    y: global.screenHeight / 2,
    screenWidth: global.screenWidth,
    screenHeight: global.screenHeight,
    target: {x: global.screenWidth / 2, y: global.screenHeight / 2}
};
global.player = player;
var target = {x: player.x, y: player.y};
global.target = target;

window.canvas = new Canvas();

function startGame() {
    global.screenWidth = window.innerWidth;
    global.screenHeight = window.innerHeight;

    if(!socket) {
        socket = io();
        initSocket(socket);
    }
    player.screenWidth = global.screenWidth;
    player.screenHeight = global.screenHeight;
    player.target = window.canvas.target;
    global.player = player;
    socket.emit("gotit", player);
    global.gameStart = true;
    animloop();
}

window.onload = function() {
   startGame();
};

function initSocket(socket) {
    socket.on("serverTellPlayerMove", function (userData, foodsList, massList, virusList) {
        var playerData;
        for(var i =0; i< userData.length; i++) {
            if(typeof(userData[i].id) == "undefined") {
                playerData = userData[i];
                break;
            }
        }
        if(global.playerType == "player") {
            var xoffset = player.x - playerData.x;
            var yoffset = player.y - playerData.y;

            player.x = playerData.x;
            player.y = playerData.y;
            player.hue = playerData.hue;
            player.massTotal = playerData.massTotal;
            player.cells = playerData.cells;
            player.xoffset = isNaN(xoffset) ? 0 : xoffset;
            player.yoffset = isNaN(yoffset) ? 0 : yoffset;
        }
        drawFood(foodsList);
        users = userData;
        foods = foodsList;
        viruses = virusList;
        fireFood = massList;
    });


}


function drawCircle(circleX, circleY, radius, sides) {
    var theta = 0;
    var x = 0, y = 0;
    graph.beginPath();

    for(let i=0;i<sides;i++) {
        theta = (i / sides) * 2 * Math.PI;
        // 瞎改
        x = circleX + radius * Math.cos(theta);
        y = circleY + radius + Math.sin(theta);
        graph.lineTo(x, y);
    }
    graph.closePath();
    graph.stroke();
    graph.fill();

}

function drawFood(food) {
    graph.strokeStyle = "hsl(" + food.hue + ", 100%, 45%)";
    graph.fillStyle = "hsl(" + food.hue + ", 100%, 50%)";
    graph.lineWidth = global.border;
    drawCircle(food.x - player.x + global.screenWidth / 2,
        food.y - player.y + global.screenHeight / 2,
        food.radius, global.foodSides);
}


function drawgrid() {
    graph.lineWidth = 1;
    graph.strokeStyle = global.lineColor;
    graph.globalAlpha = 0.15;
    graph.beginPath();

    for (var x = global.xoffset - player.x; x < global.screenWidth; x += global.screenHeight / 18) {
        graph.moveTo(x, 0);
        graph.lineTo(x, global.screenHeight);
    }

    for (var y = global.yoffset - player.y ; y < global.screenHeight; y += global.screenHeight / 18) {
        graph.moveTo(0, y);
        graph.lineTo(global.screenWidth, y);
    }

    graph.stroke();
    graph.globalAlpha = 1;
}


function drawPlayers(order) {
    var startUserPosition = {
        x: player.x - global.screenWidth/2,
        y: player.y - global.screenHeight/2
    };

    for(let i=0; i<order.length; i++) {
        var userCurrent = users[order[i].nCell];
        var cellCurrent = users[order[i].nCell].cells[order[i].nDiv];

        var x = 0;
        var y = 0;

        var points = 30 + ~~(cellCurrent.mass/5);
        var increase = Math.PI * 2 / points;

        graph.strokeStyle = "hsl(" + userCurrent.hue + ", 100%, 45%)";
        graph.fillStyle = "hsl(" + userCurrent.hue + ", 100%, 50%)";
        graph.lineWidth = playConfig.border;

        var xstore = [];
        var ystore = [];

        global.spin += 0.0;
        for (let j=0; j<points; j++) {
            x = cellCurrent.radius * Math.cos(global.spin) + cellCurrent.x - startUserPosition.x;
            y = cellCurrent.radius * Math.sin(global.spin) + cellCurrent.y - startUserPosition.y;

            // if(typeof(userCurrent.id) == "undefined") {
            //     x = valueInRange(-userCurrent.x + global.screenWidth / 2,
            //         global.gameWidth - userCurrent.x + global.screenWidth / 2, x);
            //     y = valueInRange(-userCurrent.y + global.screenHeight / 2,
            //         global.gameHeight - userCurrent.y + global.screenHeight / 2, y);
            // } else {
            //     x = valueInRange(-cellCurrent.x - player.x + global.screenWidth / 2 + (cellCurrent.radius/3),
            //         global.gameWidth - cellCurrent.x + global.gameWidth - player.x + global.screenWidth / 2 - (cellCurrent.radius/3), x);
            //     y = valueInRange(-cellCurrent.y - player.y + global.screenHeight / 2 + (cellCurrent.radius/3),
            //         global.gameHeight - cellCurrent.y + global.gameHeight - player.y + global.screenHeight / 2 - (cellCurrent.radius/3) , y);
            // }
            global.spin += increase;
            xstore[j] = x;
            ystore[j] = y;

        }

        for (i = 0;i<points;i++) {
            if (i === 0) {
                graph.beginPath();
                graph.moveTo(xstore[i], ystore[i]);
            } else if (i > 0 && i < points - 1) {
                graph.lineTo(xstore[i], ystore[i]);
            } else {
                graph.lineTo(xstore[i], ystore[i]);
                graph.lineTo(xstore[0], ystore[0]);
            }
        }

        graph.lineJoin = "round";
        graph.lineCap = "round";
        graph.fill();
        graph.stroke();

        var nameCell = "";
        if(typeof(userCurrent.id) == "undefined")
            nameCell = player.name;
        else
            nameCell = userCurrent.name;

        var fontSize = Math.max(cellCurrent.radius / 3, 12);
        graph.lineWidth = playConfig.textBorderSize;
        graph.fillStyle = playConfig.textColor;
        graph.strokeStyle = playConfig.textBorder;
        graph.miterLimit = 1;
        graph.lineJoin = "round";
        graph.textAlign = "center";
        graph.textBaseline = "middle";
        graph.font = "bold " + fontSize + "px sans-serif";

        // if (global.toggleMassState === 0) {
        //     graph.strokeText(nameCell, circle.x, circle.y);
        //     graph.fillText(nameCell, circle.x, circle.y);
        // } else {
        //     graph.strokeText(nameCell, circle.x, circle.y);
        //     graph.fillText(nameCell, circle.x, circle.y);
        //     graph.font = "bold " + Math.max(fontSize / 3 * 2, 10) + "px sans-serif";
        //     if(nameCell.length === 0) fontSize = 0;
        //     graph.strokeText(Math.round(cellCurrent.mass), circle.x, circle.y+fontSize);
        //     graph.fillText(Math.round(cellCurrent.mass), circle.x, circle.y+fontSize);
        // }


    }

}

function valueInRange(min, max, value) {
    return Math.min(max, Math.max(min, value));
}

window.requestAnimFrame = (function(){
    return  window.requestAnimationFrame       ||
            window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame    ||
            function( callback ){
                window.setTimeout(callback, 1000 / 60);
            };
})();

window.cancelAnimFrame = (function(handle) {
    return  window.cancelAnimationFrame     ||
        window.mozCancelAnimationFrame;
})();

function animloop(){
    global.animLoopHandle = window.requestAnimFrame(animloop);
    drawgrid();
    gameLoop();
}

function gameLoop() {
    graph.fillStyle = global.backgroundColor;
    graph.fillRect(0, 0, global.screenWidth, global.screenHeight);

    var orderMass = [];
    for(var i=0; i<users.length; i++) {
        for(var j=0; j<users[i].cells.length; j++) {
            orderMass.push({
                nCell: i,
                nDiv: j,
                mass: users[i].cells[j].mass
            });
        }
    }
    orderMass.sort(function(obj1, obj2) {
        return obj1.mass - obj2.mass;
    });

    drawPlayers(orderMass);
    socket.emit("0", window.canvas.target); // playerSendTarget "Heartbeat".
}


