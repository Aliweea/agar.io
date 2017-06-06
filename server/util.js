/**
 * Created by xuan on 2017/5/23.
 */


// 根据质量确定半径
exports.massToRadius = function (mass) {
    return 4 + Math.sqrt(mass) * 6;
};

// 重写log方法防止底数为0
exports.log = function () {
    var log = Math.log;
    return function (n, base) {
        return log(n) / (base ? log(base) : 1);
    };
}();

// 计算距离
exports.getDistance = function (p1, p2) {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2)) - p1.radius - p2.radius;
};

exports.randomInRange = function (from, to) {
    return Math.floor(Math.random() * (to - from)) + from;
};



exports.findIndex = function (arr, id) {
    var len = arr.length;

    while (len--) {
        if (arr[len].id === id) {
            return len;
        }
    }

    return -1;
};

// 随机产生色彩
exports.randomColor = function () {
    var color = '#' + ('00000' + (Math.random() * (1 << 24) | 0).toString(16)).slice(-6);
    var c = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(color);
    var r = parseInt(c[1], 16) - 32 > 0 ? parseInt(c[1], 16) - 32 : 0;
    var g = parseInt(c[2], 16) - 32 > 0 ? parseInt(c[2], 16) - 32 : 0;
    var b = parseInt(c[3], 16) - 32 > 0 ? parseInt(c[3], 16) - 32 : 0;

    return {
        fill: color,
        border: '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)
    };
};