/*********************************
 *
 * SOCKET IO ON THE CLIENT SIDE
 */

$(document).ready(function(){
    var socket = io();
    var isMatched = false;

    var $chatForm = $('#chat_container form');
    var $chatMessage = $('#chat_container #chat_message');
    var $partnerStatus = $('#chat_container #partner_status');
    var $messageContainer = $('#chat_container #messages');

    var $usernameForm = $('#username_container #username_box form');
    var $nickname = $('#nickname');

    var $usernameContainer = $('#username_container');
    var $waitingContainer = $('#waiting_container');
    var $chatContainer = $('#chat_container');

    var $chatPair = [];
    var $partnerName;

    $usernameContainer.show();
    $waitingContainer.hide();
    $chatContainer.hide();

    // Handle the submit event
    // Submit the username
    $usernameForm.submit(function(){
        if ($nickname.val() != '') {
            socket.emit('new user', $nickname.val());
            if (isMatched == false) {
                $waitingContainer.fadeIn(500);
                $usernameContainer.hide();
                $chatContainer.hide();
            } else {
                $chatContainer.fadeIn(500);
                $waitingContainer.hide();
                $usernameContainer.hide();
            }
            $nickname.val('');
        } else {
            alert('请输入正确昵称!');
        }
        return false;
    });

    // Submit the chatting messages
    $chatForm.submit(function(){
        if ($chatMessage.val() != '') {
            if ($chatPair != null) {
                var dataArray = {msg: $chatMessage.val(), nickname: $nickname, pair: $chatPair};
                socket.emit('send message', dataArray);
                $chatMessage.val('');
            }
        } else {
            alert('请输入正确聊天信息!');
        }
        return false;
    });

    // Handle the typing status of user
    $chatMessage.focus(function(){
        socket.emit('typing status', 'typing');
    });

    // Get the typing status from the partner
    socket.on('new typing status', function(){
        if ($partnerName != null) {
            $partnerStatus.text($partnerName + ' 正在输入');
        }
    });

    // Get the message from server
    socket.on('new message', function(data){
        if (('/#'+socket.id) == data.id) {
            $('#messages').append('<li><div class = "right_bubble"><b>'+data.nickname+': </b>'+data.msg+'</div></li>');
        } else {
            $('#messages').append('<li><div class = "left_bubble"><b>'+data.nickname+': </b>'+data.msg+'</div></li>');
        }

        var chatListHeight = $messageContainer.height();
        var formHeight = $chatForm.height();
        var statusHeight = $partnerStatus.height();
        var winHeight = $(window).height();
        var margin = 10 * 2;

        // Scroll to see the last message
        if (chatListHeight + formHeight + statusHeight + margin > winHeight) {
            var scrollVal = chatListHeight + formHeight + statusHeight + margin - winHeight;
            $('html, body').animate({scrollTop: scrollVal}, 1000);
        }
    });

    socket.on('chat pair', function(data){
        if (data) {
            $chatPair = data;
            if (('/#'+socket.id) == $chatPair[0].id) {
                $partnerName = $chatPair[1].name;
            } else if (('/#'+socket.id) == $chatPair[1].id) {
                $partnerName = $chatPair[0].name;
            }
        }
    });

    socket.on('matching status', function(data){
        if (data) {
            $messageContainer.empty();
            if (data == 'waiting') {
                console.log('waiting');
                $partnerName = null;
                isMatched = false;
            } else if (data == 'matched') {
                console.log('matched');
                if ($partnerStatus != null) {
                    $partnerStatus.text($partnerName + ' 进入聊天室');
                }
                isMatched = true;
            }

            if (isMatched == false) {
                $waitingContainer.fadeIn(500);
                $chatContainer.hide();
                $usernameContainer.hide();
            } else {
                $chatContainer.fadeIn(500);
                $waitingContainer.hide();
                $usernameContainer.hide();
            }
        }
    });
});