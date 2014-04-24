// map.js: Map Manager
function MapManager(display, input) {
  /*============================= VARIABLES ==================================*/
  // Keep track of whether the map is currently moving
  var moving = false;
  var movingIntervalId;

  // Map coordinates of the view. Indicates which tiles are currently in the view.
  var view = { x: 0, y: 0, width: null, height: null };
  var backgroundView = { x: 0, y: 0, width: null, height: null };

  // Array of individual tile images
  var tileImages = null;

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
    var dfd = $.Deferred();
    // Load JSON file
    var jsonDfd = $.getJSON(url);
    jsonDfd.done(function(json) {
      map = json;
      initialiseMap();
      // Load tiles
      var tileDfd = display.loadTileSets(map.tilesets);
      tileDfd.done(function(tiles) {
        tileImages = tiles;
        loadView(x, y);
        dfd.resolve();
      });
      tileDfd.fail(function() {
        alert("Failed to load tile images.");
        dfd.reject();
      });
    });
    jsonDfd.fail(function() {
      // TODO: display the error in a nicer way?
      alert("Failed to load map file '" + url + "'");
      dfd.reject();
    });
    return dfd.promise();
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

    // Resize the hidden canvas to make sure it is big enough
    hiddenBackgroundCanvas.width = backgroundView.width * tileSizePixels.width;
    hiddenBackgroundCanvas.height = backgroundView.height * tileSizePixels.height;
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
    // Draw the necessary background tiles on the hidden canvas
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

  // Load the tile at x, y
  function loadTile(x, y) {
    if (x < 0 || x >= bgLayer.width || y < 0 || y >= bgLayer.height) {
      console.warn("Attempt to create tile out of bounds");
      return;
    }

    // Determine which type of tile to use
    var bgIndex = x + y * bgLayer.width;
    var tileID;
    if (x >= 0 && y >= 0 && bgIndex < bgLayer.data.length) {
      tileID = bgLayer.data[bgIndex];
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

    // Support diagonal movement
    var diagonal = false;
    if (direction == DIRECTION.LEFT || direction == DIRECTION.RIGHT) {
      if (input.inputStates[INPUT.UP].pressed) {
        view.y--;
        var newRowY = view.y;
        diagonal = true;
      } else if (input.inputStates[INPUT.DOWN].pressed) {
        view.y++;
        var newRowY = view.y + view.height - 1;
        diagonal = true;
      }
    } else if (direction == DIRECTION.UP || direction == DIRECTION.DOWN) {
      if (input.inputStates[INPUT.RIGHT].pressed) {
        view.x++;
        var newColX = view.x + view.width - 1;
        diagonal = true;
      } else if (input.inputStates[INPUT.LEFT].pressed) {
        view.x--;
        var newColX = view.x;
        diagonal = true;
      }
    }

    // Reload the background view here ONLY if we have to. This is a slow process so it's
    // better to do this when the player is not moving, if we get a chance.
    // This code should only run if the player runs in the same direction for a while without stopping.
    if ((newColX !== undefined && (newColX < backgroundView.x || newColX >= backgroundView.x + backgroundView.width))
       || (newRowY !== undefined && (newRowY < backgroundView.y || newRowY >= backgroundView.y + backgroundView.height))) {
      loadBackgroundView();
    }

    // TODO: determine duration based on a speed
    var moveTime = 0.3; // seconds
    if (diagonal) {
      moveTime *= 1.414; // about sqrt(2)
    }

    var tween = new Kinetic.Tween({
      node: backgroundGroup,
      duration: moveTime,
      x: -view.x * tileSizePixels.width,
      y: -view.y * tileSizePixels.height,

      onFinish: function() {
        moving = false;

        // Continue moving if a key is pressed
        if (input.inputStates[direction].pressed) {
          shiftView(direction);
        } else if (input.inputStates[INPUT.UP].pressed) {
          shiftView(DIRECTION.UP);
        } else if (input.inputStates[INPUT.DOWN].pressed) {
          shiftView(DIRECTION.DOWN);
        } else if (input.inputStates[INPUT.LEFT].pressed) {
          shiftView(DIRECTION.LEFT);
        } else if (input.inputStates[INPUT.RIGHT].pressed) {
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

  // Insert a delay so that if diagonal movement is desired, 
  // both keys are pressed prior to processing
  var inputHandleDelay = 50; // ms

  var inputEventHandlers = {};
  inputEventHandlers[INPUT.UP] = function() {
    setTimeout( function() { shiftView(DIRECTION.UP) }, inputHandleDelay );
  };
  inputEventHandlers[INPUT.DOWN] = function() {
    setTimeout( function() { shiftView(DIRECTION.DOWN) }, inputHandleDelay );
  };
  inputEventHandlers[INPUT.LEFT] = function() {
    setTimeout( function() { shiftView(DIRECTION.LEFT) }, inputHandleDelay );
  };
  inputEventHandlers[INPUT.RIGHT] = function() {
    setTimeout( function() { shiftView(DIRECTION.RIGHT) }, inputHandleDelay );
  };

  return {
    loadMap: loadMap,
    loadView: loadView,
    inputEventHandlers: inputEventHandlers
  };
}
