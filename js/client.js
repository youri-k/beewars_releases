import Game from './game.js';

class Client {
	startConnection() {
		this.room = document.getElementById('game').dataset.room;
		this.socket = io.connect();

		console.log(this.room);

		this.socket.on('gameObjects', data => {
			Game.addProperties(data);

			this.socket.on('stateOfBee', bee => {
				// This includes updating the player actions
				Game.updateBee(bee);
			});

			this.socket.on('moveBee', bee => {
				const updatedBee = Game.updateBee(bee);
				if (bee.playerActions.length > 0) Game.moveBee(updatedBee);
			});

			this.socket.on('moveBeeOut', bee => {
				Game.moveBeeFormInsideToOutside(bee);
			});

			this.socket.on('stopBee', bee => {
				const updatedBee = Game.updateBee(bee);
				Game.stopBee(updatedBee);
			});

			this.socket.on('stateOfFlower', flower => {
				Game.outsideState.updateFlower(flower);
			});

			this.socket.on('stateOfBeehive', beehive => {
				Game.updateBeehive(beehive);
			});

			this.socket.on('newBee', bee => {
				Game.insideState.addNewBee(bee);
			});

			this.socket.on('deadBee', bee => {
				Game.removeBee(bee);
			});

			this.socket.on('createWasp', wasp => {
				Game.outsideState.createWasp(wasp);
			});

			this.socket.on('updateWasp', wasp => {
				Game.outsideState.updateWasp(wasp);
			});

			this.socket.on('removeWasp', wasp => {
				Game.outsideState.removeWasp(wasp);
			});

			this.socket.on('updateWeather', weather => {
				Game.updateWeater(weather);
			});

			this.socket.on('dayPassed', day => {
				Game.dayPassed(day);
			});

			this.socket.on('showMessage', message => {
				Game.showMessage(message);
			});

			this.socket.on('gameOver', scores => {
				// This.socket.emit('leaveGame');
				this.socket.disconnect();
				Game.state.start(
					'GameOver',
					true,
					true,
					scores.score,
					scores.highscore
				);
			});
		});
	}

	registerNewPlayer() {
		this.socket.emit('newplayer', this.room);
	}

	requestMovement(moveData) {
		moveData.timestamp = Date.now();
		this.socket.emit('requestMovement', moveData); // Movedata is a light version of playerAction and it must have 'target', 'timespan' and 'beeId'
	}
}

export default new Client();
