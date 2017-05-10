/**
 * Created by kanxuan on 2017/5/10.
 */

var global = require('./global');

class Canvas {
    constructor(params) {
        this.directionLock = false;
        this.target = global.target;
        this.reenviar  = true;
        this.socket = global.socket;
        this.directions = [];
        var self = this;
    }

    directionDown(event){
        var key = event.which || event.keyCode;
        var self = this.parent;
        if(self.directional(key)){
            self.directionLock = true;

        }
    }

    directional(key) {
        return this.horizontal(key) || this.vertical(key);
    }

    horizontal(key) {
        return key == global.KEY_LEFT || key == global.KEY_RIGHT;
    }

    vertical(key) {
        return key == global.KEY_DOWN || key == global.KEY_UP;
    }
}