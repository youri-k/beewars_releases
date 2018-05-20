var Beewars = Beewars || {};
Beewars.Game = new function() {
  var Game = this;
  Game.tween;
  Game.playerMap;
  Game.beehiveSprite; //A Sprite
  Game.flowerSprites; //A Group of sprites
  Game.beehive;
  Game.flowers = [];
  Game.bees = [];
  Game.ressourceLabel;
  Game.beeLabel;
  Game.beeNectar = 0;
  Game.beehivePosition = {
    x: 0,
    y: 0
  }
  Game.line;
  Game.graphics;
  Game.shadow;
  Game.shadowTween;

  Game.init = () => Beewars.game.stage.disableVisibilityChange = true;

  Game.preload = () => {
    Beewars.game.load.tilemap('map', 'assets/map/outside_map.json', null, Phaser.Tilemap.TILED_JSON);
    Beewars.game.load.spritesheet('grass', 'assets/map/grass.png',32,32);
    Beewars.game.load.spritesheet('flowers', 'assets/map/flowers.png',64,64);
    Beewars.game.load.spritesheet('beehive', 'assets/map/beehive.png',128,160);
    Beewars.game.load.image('sprite','assets/sprites/bees64px-version2.png');
  };

  Game.create = () => {
    Game.playerMap = [];
    var map = Beewars.game.add.tilemap('map');
    Game.addBackground(map);
    Game.addFlowers(map);
    Game.addBeehive(map);
    Game.ressourceLabel = Beewars.game.add.text(5, 0, '');
    Game.printRessource(0);

    Game.graphics = Beewars.game.add.graphics(0,0);

    //just for testing purposes. delete later on
    Game.beeLabel = Beewars.game.add.text(5, 30, '');
    Game.printBee(0);
    Beewars.Client.askNewPlayer({flowers: Game.flowerSprites.length});
  };

  Game.addBackground = map => {
    map.addTilesetImage('grass'); // tilesheet is the key of the tileset in map's JSON file
    var layer = map.createLayer('Background');
    layer.resizeWorld();
    layer.inputEnabled = true;
    layer.events.onInputUp.add((object, pointer) => {
      if(Game.shadow) Game.shadow.destroy();
      Game.shadow = null;
      if(Game.shadowTween) Game.shadowTween.stop();
      Game.graphics.clear();
    }, this)
  };

  Game.addFlowers = map => {
    map.addTilesetImage('flowers');
    Game.flowerSprites = Beewars.game.add.group();
    map.createFromObjects('Flowers', 'flower-white', 'flowers', 0, true, false, Game.flowerSprites);
    map.createFromObjects('Flowers', 'flower-purple', 'flowers', 1, true, false, Game.flowerSprites);
    map.createFromObjects('Flowers', 'flower-red', 'flowers', 2, true, false, Game.flowerSprites);
    map.createFromObjects('Flowers', 'flower-yellow', 'flowers', 3, true, false, Game.flowerSprites);
    Game.flowerSprites.children.forEach(object => {
      object.anchor.setTo(0.5);
      object.inputEnabled = true;
      object.events.onInputUp.add(Game.getCoordinates, this);
    });
  };

  Game.addBeehive = (map) => {
    map.addTilesetImage('beehive');
    var beehiveGroup = Beewars.game.add.group();
    map.createFromObjects('Beehive', 'beehive', 'beehive', 0, true, false, beehiveGroup);
    Game.beehiveSprite = beehiveGroup.getAt(0);
    Game.beehiveSprite.inputEnabled = true;
    Game.beehiveSprite.events.onInputUp.add(Game.getCoordinates, this);
    Game.setBeehivePosition(Game.beehiveSprite.centerX + 30, Game.beehiveSprite.centerY + 50 )
  };

  Game.addBeehiveObject = (beehive) => {
    Game.beehive = new Beehive(beehive, Game.beehiveSprite);
  };

  Game.addFlowerObjects = (flowers) => {
    console.log(Flower);
    for(i = 0; i < flowers.length ; i++) {
      Game.flowers.push(new Flower(flowers[i], Game.flowerSprites.children[i]));
    }
  };

  Game.addProperties = (data) => {
    Game.addFlowerObjects(data.flowers);
    Game.addBeehiveObject(data.beehive);
    for(var i = 0; i < data.players.length; i++){
      Game.addNewPlayer(data.players[i]);
    }
    for(var i = 0; i < data.bees.length; i++) {
      Game.addNewBee(data.bees[i]);
    }
  };

  Game.getCoordinates = (object,pointer) => {
    console.log("clicked");
    if(!Game.shadow) return;
    if(object.name == 'beehive'){
      Game.goToHive();
    } else if (['flower-white','flower-red','flower-purple','flower-yellow'].includes(object.name) ){
      console.log(object);
      console.log(Game.flowers);
      var flower = Game.flowers.find( (flower) => {return (flower.sprite === object);});
      Game.getNectar(flower);
    }
  };

  Game.goToHive = () => Beewars.Client.goTo({beeID: Game.shadow.followId, action: 'goToHive', target: 'beehive' });

  Game.setBeehivePosition = (x, y) => {
    Game.beehivePosition.x = x;
    Game.beehivePosition.y = y;
  };

  Game.getNectar = flower => {
    console.log(flower.id)
    var moveData = {beeID: Game.shadow.followId, action: 'getNectar', target: 'flower', targetID: flower.id }
    Beewars.Client.goTo(moveData);
  };

  Game.printRessource = value => Game.ressourceLabel.setText('Nectar at Hive: ' + value);

  Game.printBee = value => Game.beeLabel.setText('Nectar on Bee: ' + value);

  Game.updateTimer = (value, label) => label.setText(value);

  Game.countDown = seconds => {
      //make a counter so bee wait for some time before it gets the nectar. use callback
  };
  Game.returnNectar = () => {
    Beewars.Client.addRessource(Game.beeNectar);
    Game.beeNectar = 0;
    Game.printBee(Game.beeNectar);
  };

  Game.addNectarToBee = () => {
    Game.countDown(10);
    Game.beeNectar += 10;
    //just for testing purposes. delete later on
    Game.printBee(Game.beeNectar);
  };

  Game.addNewBee = (serverBee) => {
    var sprite = Beewars.game.add.sprite(serverBee.x,serverBee.y, 'sprite');
    sprite.anchor.setTo(0.5);
    sprite.inputEnabled = true;
    sprite.events.onInputUp.add(Game.onUp, this);
    console.log(serverBee);
    var bee = new Bee(serverBee, sprite);
    Game.bees.push(bee);
  }
  Game.addNewPlayer = (player) => {
    Game.playerMap[player.id] = player;
  };

  Game.moveBee = (moveData) => {
    console.log(Game.bees);
    console.log(moveData.beeID);
    var player = Game.bees[moveData.beeID];
    console.log(player);
    console.log(moveData);
    if(moveData.target == 'beehive') {
      var x = Game.beehivePosition.x;
      var y = Game.beehivePosition.y;
    }
    else {
      var x = Game.flowers[moveData.targetID].sprite.position.x;
      var y = Game.flowers[moveData.targetID].sprite.position.y;
    }
    var distance = Phaser.Math.distance(player.sprite.position.x, player.sprite.position.y, x, y);
    var duration = distance * 10;

    if(Game.tween && Game.tween.target === player.sprite) Game.tween.stop();
    Game.tween = Beewars.game.add.tween(player.sprite);
    Game.tween.to({x: x, y: y}, duration);
    Game.tween.onComplete.add(Game.moveCallback, this);

    if(Game.shadowTween) Game.shadowTween.stop();
    if(Game.shadow){
      Game.shadowTween = Beewars.game.add.tween(Game.shadow);
      Game.shadowTween.to({x: x,y: y}, duration);
      Game.shadowTween.start();
    }

    Game.tween.start();
    if(Game.shadow) Game.drawCurrentActions();
    Game.tween.onUpdateCallback(Game.onTweenRunning, this);
    console.log(Game.tween)
  };

  Game.moveCallback = player => {
    if (player.x == Game.beehivePosition.x && player.y == Game.beehivePosition.y) {
        Game.returnNectar();
    }
    else {
        Game.addNectarToBee();
    }
  };

  Game.onUp = (sprite, pointer) => {
    var clickedId = Game.bees.findIndex(item => item.sprite === sprite);

    if(Game.shadow) {
      if(Game.shadow.followId === clickedId) {
        Game.shadow.destroy();
        Game.shadow = null;
        Game.graphics.clear();
        return;
      }
      Game.shadow.destroy();
    }

    Game.drawCurrentActions();

    Game.shadow = Beewars.game.add.sprite(sprite.x, sprite.y, 'sprite');
    Game.shadow.anchor.set(0.5);
    Game.shadow.tint = 0x000000;
    Game.shadow.alpha = 0.6;
    Game.shadow.scale.setTo(1.1, 1.1);
    Game.shadow.followId = clickedId;
    sprite.bringToTop();

    if(Game.tween && Game.tween.isRunning){
      Game.shadowTween = Beewars.game.add.tween(Game.shadow);
      Game.shadowTween.to({x: Game.tween.properties.x, y: Game.tween.properties.y}, Game.tween.timeline[0].duration - Game.tween.timeline[0].dt);
      Game.shadowTween.start();
    }
  };

  Game.drawCurrentActions = () => {
    if(Game.shadow && Game.tween && Game.tween.isRunning){
      Game.line = new Phaser.Line(Game.tween.target.x, Game.tween.target.y, Game.tween.properties.x, Game.tween.properties.y);
      Game.graphics.lineStyle(10, 0xffd900, 1);
      Game.graphics.moveTo(Game.line.start.x, Game.line.start.y);
      Game.graphics.lineTo(Game.line.end.x, Game.line.end.y);
      Game.graphics.endFill();
    }
  };

  Game.onTweenRunning = () => {
    if(!Game.shadow) return;
    Game.graphics.clear();
    Game.line = new Phaser.Line(Game.tween.target.x, Game.tween.target.y, Game.tween.properties.x, Game.tween.properties.y);
    Game.graphics.lineStyle(10, 0xffd900, 1);
    Game.graphics.moveTo(Game.line.start.x, Game.line.start.y);
    Game.graphics.lineTo(Game.line.end.x, Game.line.end.y);
    Game.graphics.endFill();
  }

  Game.removePlayer = id => {
    Game.playerMap[id].destroy();
    delete Game.playerMap[id];
  };

  //Object constructors: Bitte auslagern!
  function Bee(serverBee, sprite) {
    this.id = serverBee.id;
    this.age = serverBee.age;
    this.status = serverBee.status;
    this.health = serverBee.health;
    this.energy = serverBee.energy;
    this.pollen = serverBee.pollen;
    this.nectar = serverBee.nectar;
    this.capacity = serverBee.capacity;
    this.sprite = sprite;
  }

  Flower = function(serverFlower, flowerSprite) {
    this.id = serverFlower.id;
    this.pollen = serverFlower.pollen;
    this.nectar = serverFlower.nectar;
    this.sprite = flowerSprite;
  }

  Flower.prototype.collectPollen = function (amount){
    this.pollen -= amount;
    if (this.pollen < 0) {
      var actualAmount = amount + this.pollen;
      this.pollen = 0;
      return actualAmount;
    }
    else {
      return amount;
    }
  }
  Flower.prototype.collectNectar = function (amount){
    this.pollen -= amount;
    if (this.pollen < 0) {
      var actualAmount = amount + this.pollen;
      this.pollen = 0;
      return actualAmount;
    }
    else {
      return amount;
    }
  }

  function Beehive(serverBeehive, sprite) {
    this.pollen = serverBeehive.pollen;
    this.honey = serverBeehive.honey;
    this.honeycombs = serverBeehive.honeycombs
    this.sprite = sprite
  }
};
