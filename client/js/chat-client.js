/**
 * Created by kanxuan on 2017/6/5.
 */

var global = require('./global');

class ChatClient {
    constructor(params) {
        this.canvas = global.canvas;
        this.socket = global.socket;
        this.mobile = global.mobile;
        this.player = global.player;
        var self = this;
        var input = document.getElementById('chatInput');
        input.addEventListener('keypress', this.sendChat.bind(this));
        input.addEventListener('keyup', function(key) {
            input = document.getElementById('chatInput');
            key = key.which || key.keyCode;
            if (key === global.KEY_ESC) {
                input.value = '';
                self.canvas.cv.focus();
            }
        });
        global.chatClient = this;
    }

    addChatLine(name, message, me) {
        if (this.mobile) {
            return;
        }
        var newline = document.createElement('li');

        newline.className = (me) ? 'me' : 'friend';
        newline.innerHTML = '<b>' +  name + '</b>: ' + message;

        this.appendMessage(newline);
    }

    addSystemLine(message) {
        if (this.mobile) {
            return;
        }
        var newline = document.createElement('li');

        newline.className = 'system';
        newline.innerHTML = message;
        this.appendMessage(newline);
    }

    appendMessage(node) {
        if (this.mobile) {
            return;
        }
        var chatList = document.getElementById('chatList');
        if (chatList.childNodes.length > 10) {
            chatList.removeChild(chatList.childNodes[0]);
        }
        chatList.appendChild(node);
    }

    sendChat(key) {
        var input = document.getElementById('chatInput');
        key = key.which || key.keyCode;
        if (key === global.KEY_ENTER) {
            var text = input.value;
            if (text !== '') {
                this.socket.emit('playerChat', { sender: this.player.name, message: text });
                this.addChatLine(this.player.name, text, true);
                input.value = '';
                this.canvas.cv.focus();
            }
        }
    }


}

module.exports = ChatClient;