/**
 * Module dependencies.
 */
var app = require('../app');
var debug = require('debug')('ccchat:server');
var http = require('http');

users = {};
connections = [];

/**
 * Get port from environment and store in Express.
 */

var port = normalizePort(process.env.PORT || '3000');
app.set('port', port);

/**
 * Create HTTP server.
 */

//https://stackoverflow.com/questions/3653065/get-local-ip-address-in-node-js
var server = http.createServer(app);
require('dns').lookup(require('os').hostname(), function (err, add, fam) {
  process.stdout.write("Server started on "+ add+ ":" +port+ "\n");
})

/**
 * Listen on provided port, on all network interfaces.
 */

server.listen(port);
server.on('error', onError);
server.on('listening', onListening);

/**
 * Create socket.io instance.
 */

var io = require('socket.io')(server);

io.on('connection', function(socket){
  
  // Connection
  connections.push(socket);

  // Disconnect
  socket.on('disconnect', function() {
    if(!socket.username) return;
    delete users[socket.username];
    updateUsernames;
    connections.splice(connections.indexOf(socket), 1);
    io.emit('notification', socket.username + " left the chat");
  });


  // Chat Message
  socket.on('chat message', function(data){
    if(socket.username == null) {
      // do nothing
    }
    else {
      if(checkForCommand(data)) {
        commandFactory(data, socket.username);
      }
      else {
        if(checkForPrivateMessage(data)) {
          var username = data.substr(1, data.indexOf(' '));
          var privateMessage = data.substr(data.indexOf(' ') + 1);
          username = username.trim();
          if(username in users) {
            users[username].emit('private message', {msg: privateMessage, to: username, from: socket.username, time: GetCurrentTime()});
            users[socket.username].emit('private message', {msg: privateMessage, to: username, from: socket.username, time: GetCurrentTime()});
          }
          else {
            users[socket.username].emit('notification', "Invalid Username!");
          }
        }
        else if(data != 0) {
          io.emit('chat message', {msg: data, to: socket.username, time: GetCurrentTime()});
        }
      }    
    }   
  });

  // New User
  socket.on('new user', function(data, callback) {
    if(data in users) {
      callback(false);
    }
    else {
      callback(true);
      socket.username = data;
      users[socket.username] = socket;
      updateUsernames();
      io.emit('notification', socket.username + " joined the chat");
    }
  })

  function updateUsernames() {
    io.sockets.emit('get users', Object.keys(users));
  }
});

function checkForPrivateMessage(message) {
  if(message.charAt(0) == "@") {
    return true;
  }
  return false;
}

function checkForCommand(message) {
  if(message.charAt(0) == "/") {
    return true;
  }
  return false;
}

/**
 * Handles different commands.
 */
function commandFactory(data, user) {
  var command = null;
  if(data.includes(' ')) {
    command = data.substr(1, data.indexOf(' '));
  }
  else {
    command = data.substr(1, data.length);
  }
  command = command.trim();

  if(command == "warning") {
    var message = data.substr(data.indexOf(' ') + 1);
    io.emit('warning', {msg: message, time: GetCurrentTime()});
  }

  if(command == "shutdown") {
    shutdown();
  };

  if(command == "help") {
    users[user].emit('notification', "@username message -> Sends a private message");
    users[user].emit('notification', "/g user1 user2 message -> Sends a message to a defined subset of unlimited users");
    users[user].emit('notification', "/warning -> Sends a global warning message");
    users[user].emit('notification', "/shutdown -> Shuts down the server");
  }

  if(command == "g") {
    recipients = [];
    var message = "";

    var usersAndMessage = data.substr(3, data.length);
    var usersAndMessageSplitted = usersAndMessage.split(" ");
    usersAndMessageSplitted.forEach(element => {
      if(element in users) {
        recipients.push(element);
      }
      else {
        message += " " + element;
      }
    });
    recipients.sort();
    message = message.trim();

    var recipientsString = "";
    recipients.forEach(element => {
      recipientsString += " " + element + ",";
    });
    recipientsString = recipientsString.substr(0, recipientsString.length - 1);
    recipientsString = recipientsString.trim();
    
    recipients.forEach(element => {
      users[element].emit('private message', {msg: message, to: recipientsString, from: user, time: GetCurrentTime()});
    });   
    users[user].emit('private message', {msg: message, to: recipientsString, from: user, time: GetCurrentTime()});
  }
}

/**
 * Handles the server shutdown.
 */
async function shutdown() {
  io.emit('warning', {msg: "This server will be shutdown in:", time: GetCurrentTime()});
  for(var i = 3; i >= 1; i--) {
    await sleep(1000);
    io.emit('warning', {msg: i, time: GetCurrentTime()});
  }
  io.emit('warning', {msg: "Server shutdown!", time: GetCurrentTime()});
  await sleep(100);
  process.exit(0);
}

/**
 * Sleep function.
 */
function sleep(milliseconds) {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
 }

/**
 * Gets the current time.
 */

function GetCurrentTime() {
  var date = new Date();
  var currentHour = date.getHours();
  var currentMinute = date.getMinutes();
  var currentSecond = date.getSeconds();
  if(currentHour.toString().length < 2) {
    var currentHourString = "0" + currentHour.toString();
  }
  else {
    var currentHourString = currentHour.toString();
  }
  if(currentMinute.toString().length < 2) {
    currentMinuteString = "0" + currentMinute.toString();
  }
  else {
    var currentMinuteString = currentMinute.toString();
  }
  if(currentSecond.toString().length < 2) {
    currentSecondString = "0" + currentSecond.toString();
  }
  else {
    var currentSecondString = currentSecond.toString();
  }
  var time = '<' + currentHourString + ":" + currentMinuteString + ":" + currentSecondString + '> ';
  return time;
}

/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val) {
  var port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  var bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
  var addr = server.address();
  var bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;
  debug('Listening on ' + bind);
}