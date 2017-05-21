/**
 * Created by kanxuan on 2017/5/10.
 */

var global = require('./global');

class Canvas {
    constructor(params) {
        this.target = global.target;
        this.socket = global.socket;

        this.cv = document.getElementById('cvs');
        this.cv.width = global.screenWidth;
        this.cv.heigth = global.screenHeight;
        this.cv.addEventListener("mousemove", this.onMouseMove, false);
        this.cv.addEventListener("mouseout", this.onMouseOut, false);
        this.cv.parent =  this;
    }

    onMouseMove(mouse) {
        this.parent.target.x = mouse.clientX - this.width/2;
        this.parent.target.y = mouse.clientY - this.height/2;
        global.target = this.target;

    }

    onMouseOut() {

    }




}

module.exports = Canvas;