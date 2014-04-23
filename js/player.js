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
  var playerBitmap = null;
  var playerLayer = display.playerLayer.getContext("2d");

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
    
    // function to get player images
    var playerImage = $.when( makePlayerImages() );
    playerImage.done( function() {
      
      // function to create canvas
      var playerCanvas = $.when( createPlayerCanvas() );
      playerCanvas.done( function() {
        
        // Draw the player on the map
        playerLayer.drawImage( tileImages[0], 240, 240 );

      });
    });
  } 

  // Separates player images into individual
  function makePlayerImages() {
    
    var deferred = $.Deferred();
    var i;
    var totaln = 14;

    playerBitmap = new Image();
    playerBitmap.onload = function() {

      // extracts each image from larger bitmap
      for (i = 0; i < totaln; i++) {
        var rect = {
          left: (i % 7) * 30,
          top: Math.floor(i / 7) * 30,
          width: 30,
          height: 30
        };

        var playerTile = new Image();
        playerTile.src = Pixastic.process( playerBitmap, "crop", rect ).toDataURL();
        tileImages[i] = playerTile;
      }
    };
    playerBitmap.src = "img/playerBitmap.png";

    return deferred.promise();
  }

  function createPlayerCanvas() {
    
    var deferred = $.Deferred();

    display.playerLayer.width = 510;
    display.playerLayer.height = 510;
    
    return deferred.promise();
  }



  function movePlayer(direction) {
    var player = 0;
  }

  // Directions 

  return {
    save: savePlayer,
    load: loadPlayer,
    details: playerDetails,
    move: movePlayer,
    draw: drawPlayer
  };

}
