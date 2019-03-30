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

const SocketAntiSpam  = require('socket-anti-spam')
const io = require('socket.io')(server);

const socketAntiSpam = new SocketAntiSpam({
  banTime:            3,          // Ban time in minutes
  kickThreshold:      5,          // User gets kicked after this many spam score
  kickTimesBeforeBan: 5,          // User gets banned after this many kicks
  banning:            false,      // Uses temp IP banning after kickTimesBeforeBan
  io:                 io          // Bind the socket.io variable
})

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
    
    if(data.length === 0) {
      return;
    }
    if(socket.username == null) {
      // do nothing
    }
    else {
      if(checkForCommand(data)) {
        commandFactory(data, socket.username);     
      }
      else {
        io.emit('chat message', {msg: data, to: socket.username, time: GetCurrentTime()});  
      }
    }   
  });

  
socketAntiSpam.event.on('kick', (socket, data) => {
  users[socket.username].emit('warning', {msg: "You have been kicked for spamming", time: GetCurrentTime()});
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

  if(command === "warning") {
    var message = data.substr(data.indexOf(' ') + 1);
    io.emit('warning', {msg: message, time: GetCurrentTime()});
  }

  else if(command === "shutdown") {
    shutdown();
  }
  else if(command === "help") {
    users[user].emit('notification', "/p user1 user2 message -> Sends a private message to a defined subset of unlimited users");
    users[user].emit('notification', "/warning -> Sends a global warning message");
    users[user].emit('notification', "/shutdown -> Shuts down the server");
  }
  else if(command === "p") {
    recipients = [];
    var message = "";

    var usersAndMessage = data.substr(3, data.length);
    var usersAndMessageSplitted = usersAndMessage.split(" ");
    var userEndFlag = false;
    usersAndMessageSplitted.forEach(element => {
      if(element in users) {
        if(!userEndFlag) {
          recipients.push(element);
        }
        else {
          message += " " + element;
        }
      }
      else {
        userEndFlag = true;
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
    
    if (recipients.length === 0) {
      users[user].emit('notification', "The selected users could not be found");
      return;
    }

    recipients.forEach(element => {
      users[element].emit('private message', {msg: message, to: recipientsString, from: user, time: GetCurrentTime()});
    });   
    users[user].emit('private message', {msg: message, to: recipientsString, from: user, time: GetCurrentTime()});
  }
  else {
    users[user].emit('notification', "Unknown command type /help for help");
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