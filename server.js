
var soundObjects = {},
	idCount = 0;
var app = require('express')()
  , server = require('http').createServer(app)
  , io = require('socket.io').listen(server);

server.listen(8888);

app.get('/', function (req, res) {
  res.sendfile(__dirname + '/demo.html');
});

app.all('*', function(req, res) {
	console.log(req.route.params[0]);
	res.sendfile(__dirname + req.route.params[0]);
});

io.sockets.on('connection', function (socket) {

  soundObjects[socket.id] = {id: socket.id, position: {top: 0, left: 0} };
  socket.emit('setID', socket.id);

  socket.emit('receiveObjects', soundObjects);
  socket.broadcast.emit('receiveObjects', soundObjects);

  socket.on('changePosition', function(data) {
  	soundObjects[socket.id].position.top = data.position.top;
  	soundObjects[socket.id].position.left = data.position.left;

    socket.emit('changePosition', soundObjects[socket.id]);
  	socket.broadcast.emit('changePosition', soundObjects[socket.id]);
  	
  	console.log('emitting' + data);
  });

  socket.on('play', function(data) {
    socket.broadcast.emit('play', data);
  });



  socket.on('disconnect', function() {
    delete soundObjects[socket.id];
    socket.emit('removeObject', socket.id);
    socket.broadcast.emit('removeObject', socket.id);
  });

});

