/**
 * Created by kanxuan on 2017/5/10.
 */

var global = require('./global');

class Canvas {
    constructor(params) {
        this.directionLock = false;
        this.target = global.target;
        this.socket = global.socket;
        var self = this;

        this.cv = document.getElementById('cvs');
        this.cv.width = global.screenWidth;
        this.cv.height = global.screenHeight;
        this.cv.addEventListener('mousemove', this.gameInput, false);
        this.cv.addEventListener('mouseout', this.outOfBounds, false);
        this.cv.addEventListener('keypress', this.keyInput, false);

        this.cv.addEventListener('touchstart', this.touchInput, false);
        this.cv.addEventListener('touchmove', this.touchInput, false);
        this.cv.parent = self;
        global.canvas = this;
    }


    // 鼠标超出浏览器的操作
    outOfBounds() {
        if (!global.continuity) {
            this.parent.target = { x : 0, y: 0 };
            global.target = this.parent.target;
        }
    }

    gameInput(mouse) {
        if (!this.directionLock) {
            this.parent.target.x = mouse.clientX - this.width / 2;
            this.parent.target.y = mouse.clientY - this.height / 2;
            global.target = this.parent.target;
        }
    }

    touchInput(touch) {
        // 阻止默认的行为
        touch.preventDefault();
        //阻止冒泡传递
        touch.stopPropagation();
        if (!this.directionLock) {
            this.parent.target.x = touch.touches[0].clientX - this.width / 2;
            this.parent.target.y = touch.touches[0].clientY - this.height / 2;
            global.target = this.parent.target;
        }
    }

    // 特殊命令
    keyInput(event) {
        var key = event.which || event.keyCode;
        if (key === global.KEY_FIREFOOD) {
            this.parent.socket.emit('1');
        }
        else if (key === global.KEY_SPLIT) {
            this.parent.socket.emit('2');
        }
        else if (key === global.KEY_CHAT) {
            document.getElementById('chatInput').focus();
        }
    }
}

module.exports = Canvas;
