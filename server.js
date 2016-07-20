/*********************************
 *
 * SOCKET IO ON THE SERVER SIDE
 */

var express = require('express');
var app = express();
var http = require('http').Server(app);
var path = require('path');
var io = require('socket.io')(http);

var userList = []; // user list socket array
var waitingList = []; // waiting list socket array

app.get('/', function(req, res){
    res.sendFile(__dirname + '/index.html');
});

app.use(express.static(path.join(__dirname, 'public')));

// Open http://localhost:3000
http.listen(3000, function(){
    console.log('listening on *:3000');
});

io.on('connection', function(socket){
    // Check whether exists
    if (userList.indexOf(socket) != -1) {
        console.log('User already exists!');
        return;
    } else {
        // Debug
        debugMessageShowingWaitingList();
    }

    // A user is disconnected
    socket.on('disconnect', function(){
        console.log('a user disconnected' + socket.id);
        if (!socket.id) return;
        // Remove from the user list
        if (userList.indexOf(socket) != -1) {
            userList.splice(userList.indexOf(socket), 1);
            if (waitingList.indexOf(socket) != -1) {
                // If the client is still in the waiting list, remove it
                waitingList.splice(waitingList.indexOf(socket), 1);
                // Debug
                debugMessageShowingWaitingList();
            } else {
                // Otherwise, the client was chatting, put his partner to the waiting list
                console.log('His chatting partner is '+socket.partner.id);
                waitingList.push(socket.partner);
                var chatPair = setUserPairs(socket.partner);
                if (chatPair.length != 0) {
                    // There is a chatting pair
                    for (var i = 0; i < 2; i++) {
                        var id = chatPair[i].id;
                        io.to(id).emit('chat pair', chatPair);
                        io.to(id).emit('matching status', 'matched');
                    }
                } else {
                    // There is no chatting pair
                    io.to(socket.partner.id).emit('matching status', 'waiting');
                }
                //emitToUsers(chatPairIds, socket.partner.id);
                // Debug
                debugMessageShowingWaitingList();
            }
        }
    });

    // New user enters the username
    socket.on('new user', function(data){
        console.log('User name: ' + data);
        socket.name = data;
        console.log('a user connected ' + socket.id);
        userList.push(socket);
        waitingList.push(socket);
        var chatPair = setUserPairs(socket);
        if (chatPair.length != 0) {
            // There is a chatting pair
            for (var i = 0; i < 2; i++) {
                var id = chatPair[i].id;
                io.to(id).emit('chat pair', chatPair);
                io.to(id).emit('matching status', 'matched');
            }
        } else {
            // There is no chatting pair
            io.to(socket.id).emit('matching status', 'waiting');
        }
        //emitToUsers(chatPair, socket.id);
        // Debug
        debugMessageShowingWaitingList();
    });

    // Dealing with sending messages
    socket.on('send message', function(data){
        var pair = data.pair;
        data.nickname = socket.name;
        data.id = socket.id;
        console.log('///message sent by ' + data.nickname + ' : ' + data.msg);
        for (var i = 0; i < 2; i++) {
            var user = pair[i].id;
            io.to(user).emit('new message', data);
        }
    });

    // Dealing with typing status
    socket.on('typing status', function(data){
        // Tell his partner that he is typing
        if (socket.partner) {
            io.to(socket.partner.id).emit('new typing status', data);
        }
    });

    function setUserPairs(s) {
        var index = 0, firstUser = {}, secondUser = {}, chatPair = [];
        while (index < waitingList.length) {
            if (waitingList[index] != s) {
                var elem = waitingList.splice(index, 1)[0];
                waitingList.splice(waitingList.indexOf(s), 1);
                s.partner = elem;
                elem.partner = s;
                firstUser = {id: elem.id, name: elem.name};
                secondUser = {id: s.id, name: s.name};
                chatPair = [firstUser, secondUser];
                break;
            }
            index++;
        }
        return chatPair;
    }

    function debugMessageShowingWaitingList() {
        if (waitingList.length != 0) {
            console.log('/********************************/');
            for (var i = 0; i < waitingList.length; i++) {
                console.log(waitingList[i].id);
            }
            console.log('/********************************/');
        }
    }
});
