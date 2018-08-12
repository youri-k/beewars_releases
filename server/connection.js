const Game = require('./serverGame.js');
const Connection = {};

let io;
let gameInstances;

Connection.start = param => {
	io = param;
	gameInstances = {};
	io.on('connection', socket => {
		socket.on('newplayer', roomName => {
			if(!Connection.roomExists(roomName)) Connection.newGame(roomName)
			socket.join(roomName);

			socket.player = gameInstances[roomName].newPlayer();
			socket.emit('gameObjects', gameInstances[roomName].allObjects());

			socket.on('requestMovement', moveData => {
				const currGameInstance = gameInstances[roomName];
				currGameInstance.handleMovementRequest(socket.player.id, moveData);
				// The server answers with the (updated) bee
			});

			socket.on('disconnect', () => {
				const currGameInstance = gameInstances[roomName];
				if(currGameInstance.removePlayer(socket.player.id) === 0)
					Connection.removeGameInstance(roomName)
			});
		});
	});
};

Connection.updateBee = (updatedBee, roomName) => {
	io.to(roomName).emit('stateOfBee', updatedBee);
};

Connection.moveBeeToOutside = (updatedBee, roomName) => {
	io.to(roomName).emit('moveBeeOut', updatedBee);
};

Connection.moveBee = (updatedBee, roomName) => {
	io.to(roomName).emit('moveBee', updatedBee);
};

Connection.stopBee = (updatedBee, roomName) => {
	io.to(roomName).emit('stopBee', updatedBee);
};

Connection.updateBeehive = (updatedBeehive, roomName) => {
	io.to(roomName).emit('stateOfBeehive', updatedBeehive);
};

Connection.updateFlower = (updatedFlower, roomName) => {
	io.to(roomName).emit('stateOfFlower', updatedFlower);
};

Connection.spawnNewBee = (bee, roomName) => {
	io.to(roomName).emit('newBee', bee);
};

Connection.killBee = (bee, roomName) => {
	io.to(roomName).emit('deadBee', bee);
};

Connection.createWasp = (wasp, roomName) => {
	io.to(roomName).emit('createWasp', wasp);
};

Connection.updateWasp = (wasp, roomName) => {
	io.to(roomName).emit('updateWasp', wasp);
};

Connection.removeWasp = (wasp, roomName) => {
	io.to(roomName).emit('removeWasp', wasp);
};

Connection.updateWeather = (weather, roomName) => {
	io.to(roomName).emit('updateWeather', weather);
};

Connection.advanceDay = (roomName) => {
	io.to(roomName).emit('dayPassed');
};

Connection.sendMessageToClients = (message, clients, roomName) => {
	Object.keys(io.sockets.adapter.rooms[roomName].sockets).forEach(function(socketID){
        const socket = io.sockets.connected[socketID];
        const player = socket.player;
        if(player){
        	if(clients.includes(player.id)) Connection.sendMessageToClient(message, socket);
        }
    });
}

Connection.sendMessageToClient = (message, socket) => {
	socket.emit('showMessage', message);
};

Connection.broadcastMessage = (message, socket, roomName) => {
	io.to(roomName).emit('showMessage', message);
};


Connection.newGame = roomName => {
	if(!Connection.roomExists(roomName)) {
		let game = new Game(roomName);
		game.setConnection(Connection);
		game.start();
		gameInstances[roomName] = game;
		console.log("create room: ", roomName);
	}
};

Connection.roomExists = roomName => {
	return  (!(gameInstances === undefined)) && (!(gameInstances[roomName] === undefined))
};

Connection.game = roomName => {
	gameInstances[roomName]
}

Connection.removeGameInstance = roomName => {
	delete gameInstances[roomName];
}

module.exports = Connection;
