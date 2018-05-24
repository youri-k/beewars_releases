var Beewars = Beewars || {};
Beewars.Game = new function() {
  var Game = this;
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
      Game.deactivateAllOtherShadows({});
      Game.stopAllOtherShadowTweens({});
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
    Game.beehive = new Beewars.Beehive(beehive, Game.beehiveSprite);
  };

  Game.addFlowerObjects = (flowers) => {
    for(i = 0; i < flowers.length ; i++) {
      Game.flowers.push(new Beewars.Flower(flowers[i], Game.flowerSprites.children[i]));
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

    if(!Game.isBeeSelected) return;
    if(object.name == 'beehive'){
      Game.goToHive();
    } else if (['flower-white','flower-red','flower-purple','flower-yellow'].includes(object.name) ){
      var flower = Game.flowers.find( (flower) => {return (flower.sprite === object);});
      Game.getNectar(flower);
    }
  };

  Game.goToHive = () => {
    if (Game.isBeeSelected()) {
        Beewars.Client.goTo({beeID: Game.getSelectedBee().id, action: 'goToHive', target: 'beehive' });
    }
  }

  Game.setBeehivePosition = (x, y) => {
    Game.beehivePosition.x = x;
    Game.beehivePosition.y = y;
  };

  Game.getNectar = flower => {
    if (Game.isBeeSelected()) {
        var moveData = {beeID: Game.getSelectedBee().id, action: 'getNectar', target: 'flower', targetID: flower.id }
        Beewars.Client.goTo(moveData);
    }
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
    var bee = new Beewars.Bee(serverBee, sprite);
    Game.bees.push(bee);
  }
  Game.addNewPlayer = (player) => {
    Game.playerMap[player.id] = player;
  };

  Game.moveBee = (moveData) => {
    var bee = Game.bees[moveData.beeID];
    if(moveData.target == 'beehive') {
      var x = Game.beehivePosition.x;
      var y = Game.beehivePosition.y;
    }
    else {
      var x = Game.flowers[moveData.targetID].sprite.position.x;
      var y = Game.flowers[moveData.targetID].sprite.position.y;
    }

    bee.stopTween(); // In case the bee was flying to another flower (or hive)

    bee.startTween({x: x, y: y});

    if(bee.shadowTween) {
        bee.stopShadowTween();
    }
    if(bee.shadow){
      bee.startShadowTween({x: x,y: y});
    }
  };

  Game.moveCallback = bee => {
    if (bee.x == Game.beehivePosition.x && bee.y == Game.beehivePosition.y) {
        Game.returnNectar();
    }
    else {
        Game.addNectarToBee();
    }
  };

  Game.onUp = (sprite, pointer) => {
    var clickedBee = Game.bees.find(item => item.sprite === sprite);

    Game.stopAllOtherShadowTweens(clickedBee);
    Game.deactivateAllOtherShadows(clickedBee);

    if (clickedBee.shadow) {    // the bee had already a shadow
        clickedBee.deactivateShadow(); 
        return;
    }
    if (!clickedBee.shadow){ // the bee wasn't selected before
        clickedBee.activateShadow();
    }
    if (clickedBee.shadowTween) { // the bee was selected but moving to another (or the same) flower
        clickedBee.startShadowTween(sprite);
    }
    if (clickedBee.tween && clickedBee.tween.isRunning) { // in case the 'new' bee is (already) flying
         clickedBee.startShadowTween({x: clickedBee.tween.properties.x, y: clickedBee.tween.properties.y});
    } 
  };

  Game.onTweenRunning = () => {
    if(Game.isBeeSelected() && Game.getSelectedBee().shadow && Game.getSelectedBee().tween){
        var curBee = Game.getSelectedBee();
        Game.graphics.clear();
        Game.line = new Phaser.Line(curBee.tween.target.x, curBee.tween.target.y, curBee.tween.properties.x, curBee.tween.properties.y);
        Game.graphics.lineStyle(10, 0xffd900, 1);
        Game.graphics.moveTo(Game.line.start.x, Game.line.start.y);
        Game.graphics.lineTo(Game.line.end.x, Game.line.end.y);
        Game.graphics.endFill();
    } else {
       Game.graphics.clear(); 
    }
  }

  Game.removePlayer = id => {
    Game.playerMap[id].destroy();
    delete Game.playerMap[id];
  };

  Game.stopAllOtherShadowTweens = (bee) => {
    for(i = 0; i<Game.bees.length; i++){
        const b = Game.bees[i]
        if(b != bee){
            b.stopShadowTween();
        }
    }
  }

  Game.deactivateAllOtherShadows = (bee) => {
    for(i = 0, b = Game.bees[i]; i<Game.bees.length; i++){
        const b = Game.bees[i]
        if(b != bee){
            b.deactivateShadow();
        }
    }
  }

  Game.isBeeSelected = () => {
    for (var i = 0; i < Game.bees.length; i++) {
        if(Game.bees[i].shadow) return true;
    }
    return false;
  }

  Game.getSelectedBee = () => {
    for (var i = 0; i < Game.bees.length; i++) {
        if(Game.bees[i].shadow) return Game.bees[i];
    }
  }
};
