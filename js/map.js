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

  // Number of extra tiles each side of the view to load
  var TILE_BUFFER_SIZE = 18;

  // Number of tiles that the view must be from the edge of the tile buffer
  // before it will try to reload the background
  var BG_RELOAD_THRESHOLD = 9;

  // Tile IDs for the background layer
  var bgLayer = null;

  // Tile size (set by map in initialiseMap)
  var tileSizePixels = { width: null, height: null };

  // Map (loaded from the Tiled JSON file)
  var map = null;

  // A hidden canvas used to draw the current view of the background
  var hiddenBackgroundCanvas = document.createElement("canvas");
  var hiddenBackgroundCtx = hiddenBackgroundCanvas.getContext("2d");

  // Create container for background image.
  // Create a group with a single image inside of it.
  // The purpose of the group is to allow us to shift the image within it in the middle of an animation
  // (This may happen if a new background image is loaded while the player is moving)
  var backgroundGroup = new Kinetic.Group({ x: 0, y: 0 });
  var background = new Kinetic.Image({ x: 0, y: 0 });

  // Set the background "image" to be the hidden canvas
  // (This works since you can pass a canvas object to ctx.drawImage())
  background.setImage(hiddenBackgroundCanvas);

  backgroundGroup.add(background);
  display.backgroundLayer.add(backgroundGroup);

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
    hiddenBackgroundCanvas.width = backgroundView.width * tileSizePixels.width;
    hiddenBackgroundCanvas.height = backgroundView.height * tileSizePixels.height;
  }

  // Load tileset images
  function loadTileSets(onComplete) {
    tileSetImages = new Array(map.tilesets.length);

    // Count the number of images that have been downloaded
    var completeCount = 0;

    for (var i in map.tilesets) {
      tileSetImages[i] = new Image();
      tileSetImages[i].onload = function() {
        // Check if all tilSetImages are loaded:
        completeCount++;
        if (completeCount == map.tilesets.length && onComplete) {
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
        tileImages[tileset.firstgid + i] = Pixastic.process(tileSetImages[tileset_i], "crop", rect);
      }
    }
  }

  // Load all tiles in given view area
  function loadView(x, y) {
    // Set view
    view.x = x;
    view.y = y;
    backgroundGroup.setX(-view.x * tileSizePixels.width);
    backgroundGroup.setY(-view.y * tileSizePixels.height);
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

    background.setX(backgroundView.x * tileSizePixels.width);
    background.setY(backgroundView.y * tileSizePixels.height);
    // Only redraw if the map is not moving.
    // (If it is moving, it will get redrawn automatically)
    if (!moving) {
      display.backgroundLayer.draw();
    }
  }

  // Load the tile at x, y if it hasn't been loaded already
  function loadTile(x, y) {
    if (x < 0 || x >= bgLayer.width || y < 0 || y >= bgLayer.height) {
      console.warn("Attempt to create tile out of bounds");
      return;
    }

    // Determine which type of tile to use
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

    // Draw the tile on a hidden canvas, which will later be drawn on the stage
    hiddenBackgroundCtx.drawImage(tileImage, (x - backgroundView.x) * tileSizePixels.width, (y - backgroundView.y) * tileSizePixels.height);
  }

  // Moves the background by 1 tile in the specified direction. Will also reload the background image if necessary.
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
      node: backgroundGroup,
      duration: 0.3, // seconds
      x: -view.x * tileSizePixels.width,
      y: -view.y * tileSizePixels.height,

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
          // Player has stopped moving. If the view is currently within the
          // reload threshold, update the background image.
          if (view.x - backgroundView.x < BG_RELOAD_THRESHOLD ||
              view.y - backgroundView.y < BG_RELOAD_THRESHOLD ||
              backgroundView.x + backgroundView.width - view.x - view.width < BG_RELOAD_THRESHOLD ||
              backgroundView.y + backgroundView.height - view.y - view.height < BG_RELOAD_THRESHOLD) {
            // Reload the background at a later time, so we don't cause lag for
            // the last animation frame
            setTimeout(loadBackgroundView);
          }
        }
      }
    });
    tween.play();
  }

  /*============================= INITIALISE =================================*/
  // Load an "empty" image for tiles that have no image specified
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
