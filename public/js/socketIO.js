/**
 * CC Chat by Laurin Obermaier and Felix Welker, 762582 and 762600
 */

$(function () {
    var socket = io();
    var $loginForm = $('#loginForm');
    var $loginFormArea = $('#divLogin');
    var $messageFormArea = $('#divChat');
    var $users = $('#users');
    var $username = $('#inputUsername');
    var $image = $('#file-upload');

    $('#messageForm').submit(function () {
        socket.emit('chat message', $('#messageInput').val());
        $('#messageInput').val('');
        window.scrollTo(0, document.body.scrollHeight);
        return false;
    });

    socket.on('chat message', function (data) {
        $('#messages').append('<li>' + data.time + '<strong>' + data.to + '</strong>: ' + data.msg + '</li>');
        window.scrollTo(0, document.body.scrollHeight);
    });

    socket.on('notification', function (data) {
        $('#messages').append($('<li>').text(data));
        window.scrollTo(0, document.body.scrollHeight);
    });

    socket.on('private message', function (data) {
        $('#messages').append('<li><em>' + data.time + '<strong>' + data.from + ' -> ' + data.to + '</strong>: </em>' + data.msg + '</li>');
        window.scrollTo(0, document.body.scrollHeight);
    });

    socket.on('warning', function (data) {
        $('#messages').append('<li><strong><font color="red">' + data.time + data.msg + '</font></strong></li>');
        window.scrollTo(0, document.body.scrollHeight);
    });

    $loginForm.submit(function (e) {
        e.preventDefault();
        var username = $username.val().trim();
        socket.emit('new user', username, function (data) {
            if (data) {
                $loginFormArea.hide();
                $messageFormArea.show();
                $("body").css("background-color", "white");
                document.title = "CC Chat - " + username;
            }
            else {
                $('#dupUser').show();
            }
        });
        $username.val('');
    });

    socket.on('get users', function (data) {
        var html = '';
        for (i = 0; i < data.length; i++) {
            html += '<li>' + data[i] + '</li>';
        }
        $users.html(html);
    });

    socket.on('addImage', function (data) {
        $('#messages').append('<li>' + data.time + '<strong>' + data.to + '</strong>: ' + '<img src="' + data.image + '" style="max-width: 400px; max-height: 400px;">' + '</li>');
    });

    socket.on('addImagePrivate', function (data) {
        $('#messages').append('<li><em>' + data.time + '<strong>' + data.from + ' -> ' + data.to + '</strong>: </em>' + '<img src="' + data.image + '" style="max-width: 400px; max-height: 400px;">' + '</li>');
    });

    $image.on('change', function (e) {
        console.log($('#messageInput').val())
        var file = e.originalEvent.target.files[0];
        var reader = new FileReader();
        reader.onload = function (evt) {
            socket.emit('user image', {image: evt.target.result, msg: $('#messageInput').val()});
        };
        reader.readAsDataURL(file);
    })
});