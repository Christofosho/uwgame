// map.js: Map Manager
function MapManager(display, input) {
  /*============================= VARIABLES ==================================*/
  // Keep track of whether the map is currently moving
  var moving = false;
  var movingIntervalId;

  // Map coordinates of the view. Indicates which tiles are currently in the view.
  var view = { x: 0, y: 0, width: null, height: null };
  var backgroundView = { x: 0, y: 0, width: null, height: null };

  // Array of tileset images and individual tile images
  var tileSetImages = [];
  var tileImages = [];

  // Empty tiles image
  var emptyTileImage = null;

  // A boolean array that indicates which tiles have been loaded on the hidden background canvas
  var tilesLoaded = null;

  // Number of extra tiles each side of the view to load
  var TILE_BUFFER_SIZE = 18;

  // Tile IDs for the background layer
  var bgLayer = null;

  // Tile size (set by map in initialiseMap)
  var tileSizePixels = { width: null, height: null };

  // Map (loaded from the Tiled JSON file)
  var map = null;

  // A hidden canvas used to store the entire background
  var hiddenBackgroundCanvas = document.createElement("canvas");
  var hiddenBackgroundCtx = hiddenBackgroundCanvas.getContext("2d");

  // A hidden canvas used to draw the current view of the background
  var hiddenViewCanvas = document.createElement("canvas");
  var hiddenViewCtx = hiddenViewCanvas.getContext("2d");

  // Background image
  var backgroundImage = new Image();
  backgroundImage.onload = function() {
    display.background.setImage(backgroundImage);
    display.backgroundLayer.draw();
  };

  /*============================= FUNCTIONS ==================================*/
  // Load a new map file
  function loadMap(url, x, y) {
    // Remove old tilesets:
    tileSetImages = [];
    tileImages = [];

    // Load JSON file
    $.getJSON(url, function(json) {
      map = json;
      initialiseMap();
      loadTileSets(function() {
        makeTileImages();
        loadView(x, y);
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

    backgroundView.x = view.x - TILE_BUFFER_SIZE;
    backgroundView.y = view.y - TILE_BUFFER_SIZE;
    backgroundView.width = view.width + TILE_BUFFER_SIZE * 2;
    backgroundView.height = view.height + TILE_BUFFER_SIZE * 2;

    // Find the bg layer, and extract data
    for (var i in map.layers) {
      if (map.layers[i].name == "bg") {
        bgLayer = map.layers[i];
        break;
      } else if (i >= map.layers.length) {
        console.error("No bg layer found for map!");
        return;
      }
    }

    // Resize the hidden canvasses to make sure they are big enough
    hiddenBackgroundCanvas.width = bgLayer.width * tileSizePixels.width;
    hiddenBackgroundCanvas.height = bgLayer.height * tileSizePixels.height;
    hiddenViewCanvas.width = backgroundView.width * tileSizePixels.width;
    hiddenViewCanvas.height = backgroundView.height * tileSizePixels.height;

    // Create an empty tile image array
    tilesLoaded = new Array(bgLayer.width);
    for (var i = 0; i < tilesLoaded.length; i++) {
      tilesLoaded[i] = new Array(bgLayer.height);
    }
  }

  // Load tileset images
  function loadTileSets(onComplete) {
    tileSetImages = new Array(map.tilesets.length);

    for (var i in map.tilesets) {
      tileSetImages[i] = new Image();
      tileSetImages[i].onload = function() {
        // Check if all tilSetImages are loaded:
        var complete = true;
        for (var j in tileSetImages) {
          if (!tileSetImages[j].complete) {
            complete = false;
          }
        }
        if (complete && onComplete) {
          onComplete();
        }
      };
      // TODO: make the path configurable?
      tileSetImages[i].src = "img/" + map.tilesets[i].image;
    }
  }

  // Crop all the tileset images to the individual tile images
  function makeTileImages() {
    for (var tileset_i in tileSetImages) {
      var tileset = map.tilesets[tileset_i];
      var nperrow = Math.floor(tileset.imagewidth / tileset.tilewidth);
      var totaln = nperrow * Math.floor(tileset.imageheight / tileset.tileheight);

      for (var i = 0; i < totaln; i++) {
        // Define crop rectangle
        var rect = {
          left: (i % nperrow) * tileset.tilewidth,
          top: Math.floor(i / nperrow) * tileset.tileheight,
          width: tileset.tilewidth,
          height: tileset.tileheight
        };
        var tileImage = new Image();
        tileImage.src = Pixastic.process(tileSetImages[tileset_i], "crop", rect).toDataURL();
        tileImages[tileset.firstgid + i] = tileImage;
      }
    }
  }

  // Load all tiles in given view area
  function loadView(x, y) {
    // Set view
    view.x = x;
    view.y = y;
    loadBackgroundView();
  }

  function loadBackgroundView() {
    // Ensure that the necessary background images have loaded
    backgroundView.x = view.x - TILE_BUFFER_SIZE;
    backgroundView.y = view.y - TILE_BUFFER_SIZE;
    for (var x = backgroundView.x; x < backgroundView.x + backgroundView.width; x++) {
      for (var y = backgroundView.y; y < backgroundView.y + backgroundView.height; y++) {
        loadTile(x, y);
      }
    }
    // Extract the image data from the hidden canvas to recreate the background image.
    var imageData = hiddenBackgroundCtx.getImageData(
      backgroundView.x * tileSizePixels.width,
      backgroundView.y * tileSizePixels.height,
      backgroundView.width * tileSizePixels.width,
      backgroundView.height * tileSizePixels.height);
    hiddenViewCtx.putImageData(imageData, 0, 0);
    backgroundImage.src = hiddenViewCanvas.toDataURL();
    display.background.setX(-TILE_BUFFER_SIZE * tileSizePixels.width);
    display.background.setY(-TILE_BUFFER_SIZE * tileSizePixels.height);
  }

  // Reload the tile at x, y - create if necessary
  function loadTile(x, y) {
    if (x < 0 || x >= bgLayer.width || y < 0 || y >= bgLayer.height) {
      console.warn("Attempt to create tile out of bounds");
      return;
    }

    if (!tilesLoaded[x][y]) {
      var bg_index = x + y * bgLayer.width;
      var tileID;
      if (x >= 0 && y >= 0 && bg_index < bgLayer.data.length) {
        tileID = bgLayer.data[bg_index];
      } else {
        // OOB x and y - show empty tile
        tileID = 0;
      }

      // Grab the image using the tile ID
      var tileImage;
      if (tileImages[tileID]) {
        tileImage = tileImages[tileID];
      } else {
        tileImage = emptyTileImage;
      }

      // Draw the image
      hiddenBackgroundCtx.drawImage(tileImage, x * tileSizePixels.width, y * tileSizePixels.height);

      tilesLoaded[x][y] = true;
    }
  }

  /* Shift buffer to tiles one over, reload the new tiles
     Does not move the screen
     Does now redraw the screen
   */
  function shiftView(direction) {
    if (moving) {
      return;
    }
    moving = true;
    switch (direction) {
      case DIRECTION.LEFT:
        view.x--;
        var newColX = view.x;
        break;
      case DIRECTION.RIGHT:
        view.x++;
        var newColX = view.x + view.width - 1;
        break;
      case DIRECTION.DOWN:
        view.y++;
        var newRowY = view.y + view.height - 1;
        break;
      case DIRECTION.UP:
        view.y--;
        var newRowY = view.y;
        break;
      default:
        return;
    }

    // Reload the background view here ONLY if we have to. This is a slow process so it's
    // better to do this when the player is not moving, if we get a chance.
    // This code should only run if the player runs in the same direction for a while without stopping.
    if ((newColX !== undefined && (newColX < backgroundView.x || newColX >= backgroundView.x + backgroundView.width))
       || (newRowY !== undefined && (newRowY < backgroundView.y || newRowY >= backgroundView.y + backgroundView.height))) {
      loadBackgroundView();
    }

    var tween = new Kinetic.Tween({
      node: display.background,
      duration: 0.3, // seconds
      x: (backgroundView.x - view.x) * tileSizePixels.width,
      y: (backgroundView.y - view.y) * tileSizePixels.height,

      onFinish: function() {
        moving = false;

        // Continue moving if a key is pressed
        if (input.getInputState(direction).pressed) {
          shiftView(direction);
        } else if (input.getInputState(INPUT.UP).pressed) {
          shiftView(DIRECTION.UP);
        } else if (input.getInputState(INPUT.DOWN).pressed) {
          shiftView(DIRECTION.DOWN);
        } else if (input.getInputState(INPUT.LEFT).pressed) {
          shiftView(DIRECTION.LEFT);
        } else if (input.getInputState(INPUT.RIGHT).pressed) {
          shiftView(DIRECTION.RIGHT);
        } else {
          // Player has stopped moving.
          // Update the tile buffer (at a later time, so we don't cause lag for the last frame)
          setTimeout(function() {
            loadBackgroundView();
          }, 50);
        }
      }
    });
    tween.play();
  }

  /*============================= INITIALISE =================================*/
  // Load empty image
  emptyTileImage = new Image();
  // TODO: make image path part of config?
  emptyTileImage.src = "img/empty.png";

  var inputEventPress = {};
  inputEventPress[INPUT.UP] = function() { shiftView(DIRECTION.UP) };
  inputEventPress[INPUT.DOWN] = function() { shiftView(DIRECTION.DOWN) };
  inputEventPress[INPUT.LEFT] = function() { shiftView(DIRECTION.LEFT) };
  inputEventPress[INPUT.RIGHT] = function() { shiftView(DIRECTION.RIGHT) };

  /*=========================== GET/SET FUNCTIONS ============================*/
  function getInputEventPress() { return inputEventPress; }

  return {
    loadMap: loadMap,
    loadView: loadView,
    getInputEventPress: getInputEventPress
  };
}
