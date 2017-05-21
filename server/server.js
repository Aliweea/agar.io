var express = require("express");
var app     = express();
var http    = require("http").Server(app);
var io      = require("socket.io")(http);

var config  = require("./config.json");
var SAT = require("sat");
var V = SAT.Vector;
var C = SAT.Circle;

app.use(express.static(__dirname + "/../client"));

var users = [];
var sockets = {};
var food = [];

var defaultMass = 30;

function massToRadius(mass) {
    return 4 + Math.sqrt(mass) * 6;
}

function randomInrange(from, to) {
    return Math.floor(Math.random() * (to - from) + from);
}

function randomPosition(radius) {
    return {
        x: randomInrange(radius, config.gameWidth-radius),
        y: randomInrange(radius, config.gameHeight)
    };
}

function getDistance(point1, point2) {
    return Math.sqrt(Math.pow(point1.x - point2.x, 2) + Math.pow(point1.y - point2.y,2)) - point1.radius - point2.radius;
}

function uniformPosition(points, radius) {
    if(points.length===0) {
        return randomPosition(radius);
    }

    var bestPosition;
    var maxDistance = -1;
    var numOfCandidates = 10;

    for(let i = 0; i < numOfCandidates; i++) {
        let minDistance = Infinity;
        let candidate = randomPosition(radius);
        candidate.radius = radius;

        for (let j = 0; j < points.length; j++) {
            let dis = getDistance(points[j], candidate);
            if (dis < minDistance)
                minDistance = dis;
        }

        if (minDistance > maxDistance) {
            bestPosition = candidate;
            maxDistance = minDistance;
        }
        else {
            return randomPosition(radius);
        }
    }
    return bestPosition;

}


io.on("connection", function (socket) {
  console.log("Somebody connected!");

  var type = socket.handshake.query.type;

  var radius = massToRadius(defaultMass);
  var position = uniformPosition(users, radius);

  var cells = [{
      mass: defaultMass,
      x: position.x,
      y: position.y,
      radius: radius
  }]


  var currentPlayer = {
      id: socket.id,
      x: position.x,
      y: position.y,
      massTotal: defaultMass,
      cells: cells,
      W: defaultMass,
      h: defaultMass,
      hue: Math.round(Math.random() * 360),
      target: {
          x: 0,
          y: 0
      },
      lastHeartbeat: new Date().getTime(),
  };

  socket.on("0", function (target) {
      currentPlayer.lastHeartbeat = new Date().getTime();
      if(target.x !== currentPlayer.x || target.y !== currentPlayer.y) {
          currentPlayer.target = target;
      }
  })



});


function movePlayer(player) {
    var x = 0, y = 0;
    for(var i=0; i<player.cells.length; i++) {
        var target = {
            x: player.x - player.cells[i].x + player.target.x,
            y: player.y - player.cells[i].y + player.target.y
        };

        var  dist = Math.sqrt(Math.pow(target.x, 2) + Math.pow(target.y, 2));
        var deg = Math.atan2(target.y, target.x);
        var slowDown = 1;
        if(player.cells[i].speed <= 6.25) {
            slowDown = util.log(player.cells[i].mass, c.slowBase) - initMassLog + 1;
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
            if (player.cells[i].x > c.gameWidth - borderCalc) {
                player.cells[i].x = c.gameWidth - borderCalc;
            }
            if (player.cells[i].y > c.gameHeight - borderCalc) {
                player.cells[i].y = c.gameHeight - borderCalc;
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

function sendUpdate() {
    users.forEach(function (u) {
        u.x = u.x || config.gameWidth/2;
        u.y = u.y || config.gameHeight/2;

        var visibleFood = food.map(function (f) {
            if ( f.x > u.x - u.screenWidth/2 - 20 &&
                f.x < u.x + u.screenWidth/2 + 20 &&
                f.y > u.y - u.screenHeight/2 - 20 &&
                f.y < u.y + u.screenHeight/2 + 20) {
                return f;
            }
        }).filter((f)=>f);

        var visibleCells = users.map(function (f) {
            for (let i = 0; i < f.cells.length; i++) {
                // 调整参数
                if(f.cells[i].x + f.cells[i].radius - u.x > -u.screenWidth/2 &&
                f.cells[i].x - f.cells[i].radius -u.x < u.screenWidth/2 &&
                f.cells[i].y + f.cells[i].radius - u.y > -u.screenHeight/2 &&
                f.cells[i].y - f.cells[i].radius - u.x < u.screenHeight/2) {
                    if(f.id !== u.id) {
                        return {
                            id: f.id,
                                x: f.x,
                                y: f.y,
                                cells: f.cells,
                                massTotal: Math.round(f.massTotal),
                                hue: f.hue,
                                name: f.name
                        }
                    }
                    else {
                        return {
                            x: f.x,
                            y: f.y,
                            cells: f.cells,
                            massTotal: Math.round(f.massTotal),
                            hue: f.hue,
                        };
                    }


                }
            }

        })
        sockets[u.id].emit("serverTellPlayerMove", visibleCells,[],[],[]);

    });
}

function tickPlayer(currentPlayer) {
    movePlayer(currentPlayer);

    for(let i=0; i<currentPlayer.cells.length; i++) {
        var currentCell = currentPlayer.cells[i];
        var playerCircle = new C(
            new V(currentCell.x, currentCell.y),
            currentCell.radius
        );
    }


}

// function gameLoop() {
//
// }

function moveLoop() {
    for(let i=0; i < users.length; i++) {
        tickPlayer(users[i]);
    }
}

setInterval(moveLoop, 1000 / 60);
// setInterval(gameLoop, 1000);
setInterval(sendUpdate, 1000 / 40);

var ipaddress = "0.0.0.0";
var serverport = config.port;
http.listen( serverport, ipaddress, function() {
    console.log("[DEBUG] Listening on " + ipaddress + ":" + serverport);
});
