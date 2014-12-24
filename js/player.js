// Class: PlayerManager
// Input:
//   display: DisplayManager object
//   input: InputManager object
function PlayerManager(display, input) {

  // Player details
  var playerDetails = {
    name: null,
    coordinates: null,
    term: null,
    degree: null,
    abilities: null 
  };

  // for player images
  var tileImages = [];
  var sprites = [];
  var playerBitmap = null;
  var playerLayer = display.playerLayer;

  // Saves player data to local storage
  function savePlayer(saveData) {

    localstorage.setItem("UWGplayer", $.toJSON(saveData));

    return;

  }

  // Loads player data from localstorage
  function loadPlayer() {

    var loadedData;

    if ( loadedData = localstorage.getItem("UWGplayer") ) {
      loadedData = $.secureEvalJSON(loadedData);
    }
    
    playerDetails = loadedData.playerDetails;

    return loadedData;

  }

  // Function will prepare tileset and draw player on the map
  function drawPlayer() {
    
    // create canvas
    var playerCanvas = $.when( createPlayerCanvas() );
    playerCanvas.done( function() {

      // get player images
      var playerImageSets = $.when( makePlayerImageSets() );
      playerImageSets.done( function( tileImages ) {

        // create sprite objects
        var playerSprites = $.when( makePlayerSprites() );
        playerSprites.done( function( sprites ) {
console.log(sprites);
console.log(sprites[0]);
          // Draw the player on the map
          sprites[0].onload = function() {

            playerLayer.add(sprites[0]);
            playerLayer.draw();
          };
        });
      });
    });
  } 

  function createPlayerCanvas() {
    
    var deferred = $.Deferred();

    display.playerLayer.width = 510;
    display.playerLayer.height = 510;

    deferred.resolve();

    return deferred.promise();
  }

  // Separates player images into individual
  function makePlayerImageSets() {
    
    var deferred = $.Deferred();
    var i;
    var totaln = 4;

    playerBitmap = new Image();
    playerBitmap.onload = function() {

      // extracts each image from larger bitmap
      for (i = 0; i < totaln; i++) {
        var rect = {
          left: (i % 2) * 30,
          top: Math.floor(i / 4) * 30,
          width: 60,
          height: 30
        };

        var playerTile = new Image();
        playerTile.src = Pixastic.process( playerBitmap, "crop", rect ).toDataURL();
        tileImages[i] = playerTile;
        if ( i == 3 ) {
          deferred.resolve( tileImages );
        }
      }
    };
    playerBitmap.src = "img/playerBitmap.png";

    return deferred.promise();
  }

  function makePlayerSprites() {
    
    var deferred = $.Deferred();

    // make an animation cycle for the sprite object
    var animations = {
      walk: [{
        x: 1,
        y: 1,
        width: 30,
        height: 30
      },
      {
        x: 30,
        y: 1,
        width: 30,
        height: 30
      }]
    };

    for ( var i = 0; i < 4; i++ ) {
      var playerSpriteImg = new Image();
      playerSpriteImg.onload = function() {
        var playerSprite = new Kinetic.Sprite({
          x: 240,
          y: 240,
          image: playerSpriteImg,
          animation: "walk",
          animations: animations,
          frameRate: 30,
          frameIndex: 1
        });
      };
      playerSpriteImg.src = tileImages[i].src;
      sprites[i] = playerSpriteImg;

      if( i == 3 ) {
        deferred.resolve( sprites );
      }
      
    }

    return deferred.promise();
      
  }




  function movePlayer(direction) {
    if (moving) {
      return;
    }
    moving = true;

    switch (direction) {
      case DIRECTION.UP:
        break;
      case DIRECTION.DOWN:
        break;
      case DIRECTION.LEFT:
        break;
      case DIRECTION.RIGHT:
        break;
    };
  }

  /*============================= INITIALISE ============================*/
  // Directions
  var inputEventHandlers = {};
  inputEventHandlers[INPUT.UP] = function() { movePlayer(DIRECTION.UP) };
  inputEventHandlers[INPUT.DOWN] = function() { movePlayer(DIRECTION.DOWN) };
  inputEventHandlers[INPUT.LEFT] = function() { movePlayer(DIRECTION.LEFT) };
  inputEventHandlers[INPUT.RIGHT] = function() { movePlayer(DIRECTION.RIGHT) };

  return {
    save: savePlayer,
    load: loadPlayer,
    details: playerDetails,
    move: movePlayer,
    draw: drawPlayer
  };

}
