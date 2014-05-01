// map.js: Map Manager
function MapManager(display, input, gameEvents) {
  /*============================= VARIABLES ==================================*/

  // TODO: make this set by what layer the player is actually on
  var currentLayer = 0;

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

  // Tile IDs for the background layer(s)
  var bgLayers = [];
  var bgLayerWidth = 0;
  var bgLayerHeight = 0;

  // Tile size (set by map in initialiseMap)
  var tileSizePixels = { width: null, height: null };

  // Map (loaded from the Tiled JSON file)
  var map = null;

  // A hidden canvas used to draw the current view of the background
  var hiddenBackgroundCanvas = document.createElement("canvas");
  var hiddenBackgroundCtx = hiddenBackgroundCanvas.getContext("2d");

  var hiddenForegroundCanvas = document.createElement("canvas");
  var hiddenForegroundCtx = hiddenForegroundCanvas.getContext("2d");

  // Create container for background image.
  // Create a group with a single image inside of it.
  // The purpose of the group is to allow us to shift the image within it in the middle of an animation
  // (This may happen if a new background image is loaded while the player is moving)
  var backgroundGroup = new Kinetic.Group({ x: 0, y: 0 });
  var background = new Kinetic.Image({ x: 0, y: 0 });
  var foregroundGroup = new Kinetic.Group({ x: 0, y: 0 });
  var foreground = new Kinetic.Image({ x: 0, y: 0 });

  // Set the background "image" to be the hidden canvas
  // (This works since you can pass a canvas object to ctx.drawImage())
  background.setImage(hiddenBackgroundCanvas);
  foreground.setImage(hiddenForegroundCanvas);

  backgroundGroup.add(background);
  display.backgroundLayer.add(backgroundGroup);
  foregroundGroup.add(foreground);
  display.foregroundLayer.add(foregroundGroup);

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
    bgLayers = [];
    for (var i in map.layers) {
      if (map.layers[i].name.substring(0, 5) == "layer") {
        var layerIndex = parseInt(map.layers[i].name.substring(5, 6));
        bgLayers[layerIndex] = map.layers[i];
        bgLayerWidth = map.layers[i].width;
        bgLayerHeight = map.layers[i].height;
      }
    }
    if (!bgLayers[0]) {
      console.error("No layer0 found for map!");
      return;
    }

    // Resize the hidden canvas to make sure it is big enough
    hiddenBackgroundCanvas.width = backgroundView.width * tileSizePixels.width;
    hiddenBackgroundCanvas.height = backgroundView.height * tileSizePixels.height;
    hiddenForegroundCanvas.width = backgroundView.width * tileSizePixels.width;
    hiddenForegroundCanvas.height = backgroundView.height * tileSizePixels.height;
  }

  // Load all tiles in given view area
  function loadView(x, y) {
    // Set view
    view.x = x;
    view.y = y;
    backgroundGroup.setX(-view.x * tileSizePixels.width);
    backgroundGroup.setY(-view.y * tileSizePixels.height);
    foregroundGroup.setX(-view.x * tileSizePixels.width);
    foregroundGroup.setY(-view.y * tileSizePixels.height);
    loadBackgroundView();
  }

  function loadBackgroundView() {
    // Clear the canvases for redraw
    hiddenBackgroundCtx.clearRect(0, 0, hiddenBackgroundCanvas.width, hiddenBackgroundCanvas.height);
    hiddenForegroundCtx.clearRect(0, 0, hiddenForegroundCanvas.width, hiddenForegroundCanvas.height);

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
    foreground.setX(backgroundView.x * tileSizePixels.width);
    foreground.setY(backgroundView.y * tileSizePixels.height);
    // Only redraw if the map is not moving.
    // (If it is moving, it will get redrawn automatically)
    if (!moving) {
      display.backgroundLayer.draw();
      display.foregroundLayer.draw();
    }
  }

  // Load the tile at x, y
  function loadTile(x, y) {
    // Determine the tile index
    var bgIndex = x + y * bgLayerWidth;
    var tileID;
    var foreground = false;
    if (x >= 0 && y >= 0 && x < bgLayerWidth && y < bgLayerHeight) {
      // find top layer:
      var layerI;
      for (layerI = bgLayers.length - 1; layerI > 0; layerI--) {
        if (!bgLayers[layerI]) {
          continue;
        }
        if (bgLayers[layerI].data[bgIndex] != 0) {
          break;
        }
      }
      tileID = bgLayers[layerI].data[bgIndex];
      foreground = (layerI > currentLayer);
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
    if (foreground) {
      hiddenForegroundCtx.drawImage(tileImage, (x - backgroundView.x) * tileSizePixels.width, (y - backgroundView.y) * tileSizePixels.height);
    } else {
      hiddenBackgroundCtx.drawImage(tileImage, (x - backgroundView.x) * tileSizePixels.width, (y - backgroundView.y) * tileSizePixels.height);
    }
  }

  function attemptMove() {
    if (moving) {
      return;
    }

    var distance = { x: 0, y: 0 };
    if (input.inputStates[INPUT.UP].pressed)
      distance.y--;
    if (input.inputStates[INPUT.DOWN].pressed)
      distance.y++;
    if (input.inputStates[INPUT.RIGHT].pressed)
      distance.x++;
    if (input.inputStates[INPUT.LEFT].pressed)
      distance.x--;

    // TODO: run collision and bounds checks

    gameEvents.fireEvent(GAME_EVENT.MOVE_MAP, distance);
  }

  // Moves the background by 1 tile in the specified direction(s). Will also reload the background image if necessary.
  function shiftView(distance) {
    moving = true;

    // Record the current view
    var oldView = {};
    oldView.x = view.x;
    oldView.y = view.y;

    // Determine movement direction
    // TODO: use distance parameter instead of looking at inputs
    var nDirections = 0;
    if (input.inputStates[INPUT.UP].pressed) {
      view.y--;
      var newRowY = view.y;
      nDirections++;
    } else if (input.inputStates[INPUT.DOWN].pressed) {
      view.y++;
      var newRowY = view.y + view.height - 1;
      nDirections++;
    }
    if (input.inputStates[INPUT.RIGHT].pressed) {
      view.x++;
      var newColX = view.x + view.width - 1;
      nDirections++;
    } else if (input.inputStates[INPUT.LEFT].pressed) {
      view.x--;
      var newColX = view.x;
      nDirections++;
    }

    // check that there is actually a move operation
    if (nDirections == 0) {
      moving = false;
      return;
    }
    // Determine if movement is diagonal
    var diagonal = (nDirections == 2);

    // Reload the background view here ONLY if we have to. This is a slow process so it's
    // better to do this when the player is not moving, if we get a chance.
    // This code should only run if the player runs in the same direction for a while without stopping.
    if ((newColX !== undefined && (newColX < backgroundView.x || newColX >= backgroundView.x + backgroundView.width))
       || (newRowY !== undefined && (newRowY < backgroundView.y || newRowY >= backgroundView.y + backgroundView.height))) {
      loadBackgroundView();
    }

    // TODO: determine duration based on a speed
    var duration = 100; // milliseconds
    if (diagonal) {
      duration *= 1.414; // about sqrt(2)
    }
    // TODO: make frameRate configurable?
    var frameRate = 30; // frames per second (fps)
    var totalFrames = Math.round(frameRate * duration / 1000);
    var currentFrame = 0;
    
    // Use a custom tween function to move the background, since the KineticJS tween causes problems due to
    // placing images on 1/2 pixels and multiple layers need to be moved in unison
    function moveBackground() {
      // During each frame, update the background position
      currentFrame++;
      var pixelsX = -Math.round(((view.x - oldView.x) * currentFrame / totalFrames + oldView.x) * tileSizePixels.width);
      var pixelsY = -Math.round(((view.y - oldView.y) * currentFrame / totalFrames + oldView.y) * tileSizePixels.height);
      backgroundGroup.setX(pixelsX);
      backgroundGroup.setY(pixelsY);
      foregroundGroup.setX(pixelsX);
      foregroundGroup.setY(pixelsY);
      display.backgroundLayer.draw();
      display.foregroundLayer.draw();

      if (currentFrame == totalFrames) {
        // Last frame
        clearInterval(movingIntervalId);
        moving = false;
        // Continue moving if a key is pressed
        if (input.inputStates[INPUT.UP].pressed ||
            input.inputStates[INPUT.DOWN].pressed ||
            input.inputStates[INPUT.RIGHT].pressed ||
            input.inputStates[INPUT.LEFT].pressed) {
          shiftView();
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
    };

    movingIntervalId = setInterval(moveBackground, 1000 / frameRate);
  }

  /*============================= INITIALISE =================================*/
  // Load an "empty" image for tiles that have no image specified
  emptyTileImage = new Image();
  // TODO: make image path part of config?
  emptyTileImage.src = "img/empty.png";

  // Handle input events to trigger map movement.
  // Insert a delay so that if diagonal movement is desired, 
  // both keys are pressed prior to processing
  // TODO: make delay configurable?
  var inputHandleDelay = 50; // ms

  var inputEventHandlers = {};
  inputEventHandlers[INPUT.UP] = function() {
    setTimeout( attemptMove, inputHandleDelay );
  };
  inputEventHandlers[INPUT.DOWN] = function() {
    setTimeout( attemptMove, inputHandleDelay);
  };
  inputEventHandlers[INPUT.LEFT] = function() {
    setTimeout( attemptMove, inputHandleDelay);
  };
  inputEventHandlers[INPUT.RIGHT] = function() {
    setTimeout( attemptMove, inputHandleDelay);
  };

  gameEvents.addEventListener(GAME_EVENT.MOVE_MAP, shiftView);
  gameEvents.addEventListener(GAME_EVENT.UPDATE, update);

  return {
    loadMap: loadMap,
    loadView: loadView,
    inputEventHandlers: inputEventHandlers
  };
}
