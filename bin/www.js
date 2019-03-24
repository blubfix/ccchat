/**
 * Module dependencies.
 */
var app = require('../app');
var debug = require('debug')('ccchat:server');
var http = require('http');

users = [];
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
    users.splice(users.indexOf(socket.username), 1);
    console.log(users);
    updateUsernames;
    connections.splice(connections.indexOf(socket), 1);
    io.emit('chat message', socket.username + " left the chat")
  });


  // Chat Message
  socket.on('chat message', function(msg){
    if(checkForPrivateMessage(msg)) {
      var username = msg.substr(1,msg.indexOf(' '))
      var privateMessage = msg.substr(msg.indexOf(' ')+1);
      var temp;
      for(var i=0; i<users.length;i++)
      {
        console.log(users[i]);
        if(users[i]==username)
          {temp = users[i];
          }
        
      }
      io.sockets[temp].emit("private message", { from: socket.username, to: username, msg: privateMessage });
      // client.emit("private message", { from: client.id, to: data.to, msg: data.msg })
      // io.emit('private message', { msg: privateMessage, to: username});
      
    }
    else if(msg != 0) {
      io.emit('chat message', GetCurrentTime() + '"' + socket.username + '": ' + msg);
    }
  });

  // New User
  socket.on('new user', function(data, callback) {
    callback(true);
    socket.username = data;
    users.push(socket.username);
    updateUsernames();
    io.emit('chat message', socket.username + " joined the chat")
  })

  function updateUsernames() {
    io.sockets.emit('get users', users);
  }
});


function checkForPrivateMessage(message) {
  if(message.charAt(0) == "@") {
    return true;
  }
  return false;
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