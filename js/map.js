function MapManager(display) {
  /*============================= VARIABLES ==================================*/
  // Link to the display manager
  var display = display;

  // Map coordinates of the view. Indicates which tiles are currently in the view.
  var view = { x: 0, y: 0, width: null, height: null };

  // Array of tileset images and individual tile images
  var tileSetImages = [];
  var tileImages = [];

  // Empty tiles image
  var emptyTileImage = null;

  // Buffer for tiles on screen, and indexes for positions
  var tileBufferArray = null;
  var leftColI = null;
  var rightColI = null;
  var topRowJ = null;
  var bottomRowJ = null;

  // Number of tiles each side of the view to load
  var TILE_BUFFER = 1;

  // Layer information for background image
  var bgLayer = null;

  // Tile size (set by map in initialiseMap)
  var tileSizePixels = { width: null, height: null };

  // Map (loaded from the Tiled JSON file)
  var map = null;

  /*============================= FUNCTIONS ==================================*/
  // Load a new map file
  function loadMap(url) {
    // Remove old tilesets:
    tileSetImages = [];
    tileImages = [];

    // Load JSON file
    $.getJSON(url, function(json) {
      map = json;
      initialiseMap();
      loadTileSets(function() {
          makeTileImages();
          loadTiles();
          display.backgroundLayer.draw();
      });
    });
  }

  // Misc setup functions after JSON file has been loaded
  function initialiseMap() {
    // Set tile size and view size
    tileSizePixels.height = map.tileheight;
    tileSizePixels.width = map.tilewidth;
    view.width = Math.ceil(display.stageSizePixels.width / tileSizePixels.width);
    view.height = Math.ceil(display.stageSizePixels.height / tileSizePixels.height);

    // TODO: reload player image if tilesize changed?
  }

  // Load tileset images
  function loadTileSets(nextFun) {
    tileSetImages = new Array(map.tilesets.length);

    var i;
    for(i in map.tilesets) {
      tileSetImages[i] = new Image();
      tileSetImages[i].onload = function() {
        // Check if all tilSetImages are loaded:
        var j, complete = true;
        for(j in tileSetImages) {
          if(!tileSetImages[j].complete) {
            complete = false;
          }
        }
        if(complete && nextFun) {
          nextFun();
        }
      };
      // TODO: make the path configurable?
      tileSetImages[i].src = "img/" + map.tilesets[i].image;
    }
  }

  // Crop all the tileset images to the individual tile images
  function makeTileImages() {
    var tileset_i;
    for(tileset_i in tileSetImages) {
      var tileset = map.tilesets[tileset_i];
      var nperrow = Math.floor(tileset.imagewidth / tileset.tilewidth);
      var totaln = nperrow * Math.floor(tileset.imageheight / tileset.tileheight);

      var i;
      for(i = 0; i < totaln; i++) {
        // Define crop rectangle
        var rect = {left: (i % nperrow) * tileset.tilewidth,
                    top: Math.floor(i / nperrow) * tileset.tileheight,
                    width: tileset.tilewidth,
                    height: tileset.tileheight};
        tileImages[tileset.firstgid + i] = Pixastic.process(tileSetImages[tileset_i], "crop", rect);
      }
    }
  }

  // During initial setup, load all tiles in screen area
  function loadTiles() {
    var i, j;

    // Find the bg layer, and extract data
    for(i in map.layers) {
      if(map.layers[i].name == "bg") {
        bgLayer = map.layers[i];
        break;
      } else if(i >= map.layers.length) {
        console.warning( "No bg layer found for map!" );
        return;
      }
    }

    // Form (or reform) buffer for tiles on screen
    tileBufferArray = new Array(view.width + TILE_BUFFER * 2);
    for(i = 0; i < tileBufferArray.length; i++) {
      tileBufferArray[i] = new Array(view.height + TILE_BUFFER * 2);
    }
    leftColI = 0;
    leftColX = view.x - TILE_BUFFER;
    //rightColI = view.width + TILE_BUFFER * 2;
    topRowJ = 0;
    topRowY = view.y - TILE_BUFFER;
    //bottomRowJ = view.height + TILE_BUFFER * 2;

    // Iterate through tiles in the view and buffer, add to array and bg
    var bg_index;
    var tileNumber;
    var position = { x: 0, y: 0 };
    for(i = 0; i < view.width + TILE_BUFFER * 2; i++) {
      var x = i - TILE_BUFFER + view.x;
      for(j = 0; j < view.height + TILE_BUFFER * 2; j++) {
        var y = j - TILE_BUFFER + view.y;
        bg_index = x + y * bgLayer.width;
        position.x = x * tileSizePixels.width;
        position.y = y * tileSizePixels.height;
        // OOB tiles defined by the 'empty' tile (number 0)
        if(x >= 0 && y >= 0 && bg_index < bgLayer.data.length) {
          tileNumber = bgLayer.data[bg_index];
        } else {
          tileNumber = 0;
        }
        //tileBufferArray[i][j] = makeNewTile(tileNumber, position);
        //display.background.add(tileBufferArray[i][j]);
        newTile(x, y);
      }
    }
  }

  // Make a new Kinetic Image tile
  function makeNewTile(tileNumber, position) {
    var config = {};
    if(tileImages[tileNumber]) {
      config.image = tileImages[tileNumber];
    } else {
      config.image = emptyTileImage;
    }
    config.height = tileSizePixels.height;
    config.width = tileSizePixels.width;
    config.x = position.x;
    config.y = position.y;

    return new Kinetic.Image(config);
  }

  // Create new tile at map coords x, y
  function newTile(x, y) {
    if(x < leftColX || x >= leftColX + tileBufferArray.length ||
       y < topRowY || y >= topRowY + tileBufferArray[0].length)
    {
      console.warning("Attempt to create tile OOB of tileBufferArray");
      return;
    }

    // tileBufferArray indexes
    var i = (x - leftColX) % tileBufferArray.length + leftColI;
    var j = (y - topRowY) % tileBufferArray[0].length + topRowJ;

    // tileNumber
    var bg_index = x + y * bgLayer.width;
    var tileNumber
    if(x >= 0 && y >= 0 && bg_index < bgLayer.data.length) {
      tileNumber = bgLayer.data[bg_index];
    } else {
      // OOB x and y - show empty tile
      tileNumber = 0;
    }

    var config = {};
    if(tileImages[tileNumber]) {
      config.image = tileImages[tileNumber];
    } else {
      config.image = emptyTileImage;
    }
    config.height = tileSizePixels.height;
    config.width = tileSizePixels.width;
    config.x = x * tileSizePixels.width;
    config.y = y * tileSizePixels.height;

    tileBufferArray[i][j] = new Kinetic.Image(config);
    display.background.add(tileBufferArray[i][j]);
  }

  // Assign a new tile to an existing Kinetic Image tile
  function reloadTile(tile, tileNumber, position) {
    if(tileImages[tileNumber]) {
      tile.setImage(tileImages[tileNumber]);
    } else {
      tile.setImage(emptyTileImage);
    }
    tile.x(position.x);
    tile.y(position.y);
  }

  function reloadTilesInRow(j, y) {
    var i, x;
    var tileNumber;
    var bg_index;
    var position = {};
    position.y = y * tileSizePixels.height;

    for(i = 0; i < view.width + TILE_BUFFER * 2; i++) {
      var x = i - TILE_BUFFER + view.x;
      bg_index = x + y * bgLayer.width;
      position.x = x * tileSizePixels.width;
      // OOB tiles defined by the 'empty' tile (number 0)
      if(x >= 0 && y >= 0 && bg_index < bgLayer.data.length) {
        tileNumber = bgLayer.data[bg_index];
      } else {
        tileNumber = 0;
      }
      reloadTile(tileBufferArray[i][j], tileNumber, position);
    }
  }

  function reloadTilesInCol(i, x) {
    var j, y;
    var tileNumber;
    var bg_index;
    var position = {};
    position.x = x * tileSizePixels.width;

    for(j = 0; j < view.height + TILE_BUFFER * 2; j++) {
      var y = j - TILE_BUFFER + view.y;
      bg_index = x + y * bgLayer.width;
      position.y = y * tileSizePixels.height;
      // OOB tiles defined by the 'empty' tile (number 0)
      if(x >= 0 && y >= 0 && bg_index < bgLayer.data.length) {
        tileNumber = bgLayer.data[bg_index];
      } else {
        tileNumber = 0;
      }
      reloadTile(tileBufferArray[i][j], tileNumber, position);
    }
  }

  /*============================= INITIALISE =================================*/
  // Load empty image
  emptyTileImage = new Image();
  emptyTileImage.src = "img/empty.png";

  return {
    loadMap: loadMap
  };
}
