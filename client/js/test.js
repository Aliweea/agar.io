var c = document.getElementById("canvas");
var graph = c.getContext("2d");

window.onload = function () {

};

var foodSides = 10;


function drawCircle(centerX, centerY, radius, sides) {
    var theta = 0;
    var x=0;
    var y=0;

    graph.beginPath();

    for(let i=0;i<sides;i++){
        theta = 2 * Math.PI * i / sides;
        x = centerX  + Math.cos(theta) * radius;
        y = centerY  + Math.sin(theta) * radius;
        graph.lineTo(x, y);
    }
    graph.closePath();
    graph.stroke();
    graph.fill();
}

function drawFood(food) {
    graph.strokeStyle = "hsl(" + food.hue + ",100%, 45%";
    graph.fillStyle = "hsl(" + food.hue + ",100%, 50%";
    graph.lineWidth = "5px";
    drawCircle(food.x - player.x + global.screenWidth/2,
        food.y - player.y + global.screenHeight/2,
        food.radiius, global.foodSides);

}

