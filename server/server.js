/**
 * Created by xuan on 2017/5/23.
 */
var express = require("express");
var app     = express();
var http    = require("http").Server(app);
var io      = require("socket.io")(http);
var SAT = require('sat');

var V = SAT.Vector;
var C = SAT.Circle;
// Import quadtree.
var quadtree = require('simple-quadtree');
var tree = quadtree(0, 0, config.gameWidth, config.gameHeight);

app.use(express.static(__dirname + "/../client"));

var config = {
    gameWidth: 5000,
    gameHeight: 5000,
    defaultUserMass: 30,
    defaultFoodMass: 1,
    gameMass: 20000,
    maxFood: 1000
};

function addFood(toAdd) {
    var radius = massToRadius(config.defaultFoodMass);
    while(toAdd--) {
        var position = randomPosition(radius);
        foods.push({
            id: ((new Date()).getTime() + '' + foods.length) >>> 0,
            mass: Math.random() + 2,
            color: Math.round(Math.random() * 360),
            radius: radius,
            x: position.x,
            y: position.y
        });
    }
}

function removeFood(toRemove) {
    while(toRemove--) {
        foods.pop();
    }
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
        y: randomInRange(radius, config.gameHeight - radius)
    };
}

function getDefaultUser() {
    return {
        id: -1,
        name: "",
        position: randomPosition(config.defaultUserMass),
        allMass: config.defaultUserMass,
        color: Math.round(Math.random() * 360),
        screenWidth: 1920,
        screenHeight: 1080,
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
            speed: 25
        }]
    };
}

var users = [];
var sockets = {};
var foods = [];

io.on("connection", function (socket) {
    console.log("Somebody connect!");
    sockets[socket.id] = socket;
    var currentPlayer = {};

    socket.on("gotit", function (name, screenConfig) {
        console.log(name + " connect");
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
        currentPlayer.lastHeartbeat = new Date().getTime();
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
            x: player.position.x - player.cells[i].position.x + player.target.x,
            y: player.position.y - player.cells[i].position.y + player.target.y
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
            player.cells[i].position.y += deltaY;
        }
        if (!isNaN(deltaX)) {
            player.cells[i].position.x += deltaX;
        }

        if(player.cells.length > i) {
            var borderCalc = player.cells[i].radius / 3;
            if (player.cells[i].position.x > config.gameWidth - borderCalc) {
                player.cells[i].position.x = config.gameWidth - borderCalc;
            }
            if (player.cells[i].position.y > config.gameHeight - borderCalc) {
                player.cells[i].position.y = config.gameHeight - borderCalc;
            }
            if (player.cells[i].position.x < borderCalc) {
                player.cells[i].position.x = borderCalc;
            }
            if (player.cells[i].position.y < borderCalc) {
                player.cells[i].position.y = borderCalc;
            }
            x += player.cells[i].position.x;
            y += player.cells[i].position.y;
        }

    }
    player.position.x = x/player.cells.length;
    player.position.y = y/player.cells.length;
    console.log(player.position.x + " " + player.position.y);
}

function moveLoop() {
    users.map(function (f) {
        movePlayer(f);
    });
}


function sendUpdates() {
    users.forEach(function (u) {
        var lxLeft = u.position.x - u.screenWidth/2;
        var lyTop = u.position.y - u.screenHeight/2;
        var lxRight = u.position.x + u.screenWidth/2;
        var lyBelow = u.position.y + u.screenHeight/2;

        var visibleFood = foods.map(function (f) {
            if (f.x > lxLeft && f.x < lxRight && f.y > lyTop && f.y < lyBelow) {
                return f;
            }
        }).filter(function (f) {
            return f;
        });

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

        sockets[u.id].emit("serverTellPlayerMove", visibleCells, visibleFood, [], []);
    });
}

var SAT = require('sat');
var V = SAT.Vector;
var C = SAT.Circle;
var massFood = [];
var virus = [];

function tickPlayer(currentPlayer) {
    // if(currentPlayer.lastHeartbeat < new Date().getTime())
    movePlayer(currentPlayer);

    function funcFood(f) {
        return SAT.pointInCircle(new V(f.x, f.y), playerCircle);
    }
    function deleteFood(f) {
        foods[f] = {};
        foods.splice(f,1);
    }
    function eatMass(m) {
        if(SAT.pointInCircle(new V(m.x, m.y), playerCircle)){
            if(m.id == currentPlayer.id && m.speed > 0 && z == m.num)
                return false;
            if(currentCell.mass > m.masa * 1.1)
                return true;
        }
        return false;
    }

    function check(user) {
        for(var i=0; i<user.cells.length; i++) {
            if(user.cells[i].mass > 10 && user.id !== currentPlayer.id) {
                var response = new SAT.Response();
                var collided = SAT.testCircleCircle(playerCircle,
                    new C(new V(user.cells[i].x, user.cells[i].y), user.cells[i].radius),
                    response);
                if (collided) {
                    response.aUser = currentCell;
                    response.bUser = {
                        id: user.id,
                        name: user.name,
                        x: user.cells[i].x,
                        y: user.cells[i].y,
                        num: i,
                        mass: user.cells[i].mass
                    };
                    playerCollisions.push(response);
                }
            }
        }
        return true;
    }

    function collisionCheck(collision) {
        if (collision.aUser.mass > collision.bUser.mass * 1.1  && collision.aUser.radius > Math.sqrt(Math.pow(collision.aUser.x - collision.bUser.x, 2) + Math.pow(collision.aUser.y - collision.bUser.y, 2))*1.75) {
            console.log('[DEBUG] Killing user: ' + collision.bUser.id);
            console.log('[DEBUG] Collision info:');
            console.log(collision);

            var numUser = util.findIndex(users, collision.bUser.id);
            if (numUser > -1) {
                if(users[numUser].cells.length > 1) {
                    users[numUser].massTotal -= collision.bUser.mass;
                    users[numUser].cells.splice(collision.bUser.num, 1);
                } else {
                    users.splice(numUser, 1);
                    io.emit('playerDied', { name: collision.bUser.name });
                    sockets[collision.bUser.id].emit('RIP');
                }
            }
            currentPlayer.massTotal += collision.bUser.mass;
            collision.aUser.mass += collision.bUser.mass;
        }
    }

    for(var z=0; z<currentPlayer.cells.length; z++) {
        var currentCell = currentPlayer.cells[z];
        var playerCircle = new C(
            new V(currentCell.x, currentCell.y),
            currentCell.radius
        );
        var foodEaten = foods.map(funcFood).reduce(function (a,b,c) {
            return b ? a.concat(c):a;
        },[]);
        var virusCollision = virus.map(funcFood)
            .reduce( function(a, b, c) { return b ? a.concat(c) : a; }, []);
        foodEaten.forEach(deleteFood);
        var massEaten = massFood.map(eatMass)
            .reduce(function (a,b,c) {
                return b ? a.concat(c):a;
            },[]);
        if(virusCollision > 0 && currentCell.mass > virus[virusCollision].mass) {
            sockets[currentPlayer.id].emit('virusSplit', z);
        }

        var masaGanada = 0;
        for(var m=0; m<massEaten.length; m++) {
            masaGanada += massFood[massEaten[m]].masa;
            massFood[massEaten[m]] = {};
            massFood.splice(massEaten[m],1);
            for(var n=0; n<massEaten.length; n++) {
                if(massEaten[m] < massEaten[n]) {
                    massEaten[n]--;
                }
            }
        }

        if(typeof(currentCell.speed) == "undefined")
            currentCell.speed = 6.25;
        masaGanada += (foodEaten.length * c.foodMass);
        currentCell.mass += masaGanada;
        currentPlayer.massTotal += masaGanada;
        currentCell.radius = util.massToRadius(currentCell.mass);
        playerCircle.r = currentCell.radius;

        tree.clear();
        users.forEach(tree.put);
        var playerCollisions = [];

        var otherUsers =  tree.get(currentPlayer, check);

        playerCollisions.forEach(collisionCheck);
    }


}

function balanceMass() {
    var totalMass = foods.length * config.defaultFoodMass +
            users.reduce(function (ans, u) {
                return ans + u.allMass;
            }, 0);
    var massDiff = config.gameMass - totalMass;
    var maxFoodDiff = config.maxFood - foods.length;
    var foodDiff = parseInt(massDiff/config.defaultFoodMass);
    if(massDiff>0) {
        addFood(Math.min(maxFoodDiff, foodDiff));
    }
    else {
        removeFood(-foodDiff);
    }
}

function gameLoop() {
    balanceMass();
}




setInterval(moveLoop, 1000 / 60);
setInterval(gameLoop, 1000);
setInterval(sendUpdates, 1000 / 40);

// Don"t touch, IP configurations.
var ipaddress = "127.0.0.1";
var serverport = "3000";
http.listen( serverport, ipaddress, function() {
    console.log("[DEBUG] Listening on " + ipaddress + ":" + serverport);
});
