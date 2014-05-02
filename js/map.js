// map.js: Map Manager
function MapManager(display, input, gameEvents) {
  /*============================= VARIABLES ==================================*/

  // TODO: make this set by what layer the player is actually on
  var currentLayer = 0;

  // Keep track of whether the map is currently moving
  var moving = false;

  // Map coordinates of the view. Indicates which tiles are currently in the view.
  var view = { x: 0, y: 0, width: null, height: null };
  var backgroundView = { x: 0, y: 0, width: null, height: null };

  // Position of player with respect to view
  var playerViewPos = { x: 0, y: 0 };

  // Position of player on the screen (in tiles)
  var playerScreenPos = { x: 0, y: 0 };

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

  /*===================== LOAD MAP AND DRAW MAP FUNCTIONS ====================*/
  // Load a new map file for a given player position
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
    playerViewPos.x = Math.floor(view.width / 2);
    playerViewPos.y = Math.floor(view.height / 2);
    playerScreenPos.x = playerViewPos.x - TILE_BUFFER_SIZE;
    playerScreenPos.y = playerViewPos.y - TILE_BUFFER_SIZE;

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

  // Load all tiles for a given player position
  function loadView(x, y) {
    // Set view
    view.x = x - playerViewPos.x;
    view.y = y - playerViewPos.y;
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

  function getPlayerPosition() {
    return { x: Math.round(view.x + playerViewPos.x),
             y: Math.round(view.y + playerViewPos.y) };
  }

  /*===================== MOVEMENT COMMANDS HANDLING =========================*/
  // Queue to store movement commands. Handling these is delayed by a time in 
  // order to ensure diagonal commands are handled properly.
  var moveCmdQueue = [];
  var moveCmdDelay = 50; // ms

  // Movement speed
  var tilesPerMs = 5 / 1000;

  // Direction of movement
  var movementVector = { x: 0, y: 0, diagonal: false };

  // Next view position to move to
  var targetViewPos = { x: 0, y: 0 };

  // Receives input commands and stores non-repeated commands onto queue
  function handleMoveCommandInput(receivedInput) {
    // ignore repeats
    if (input.inputStates[receivedInput].repeat) {
      return;
    }
    // only store once
    if (moveCmdQueue.indexOf(receivedInput) > 0) {
      return;
    }
    moveCmdQueue.push(receivedInput);
  }

  // If not moving, checks the command queue, and if the earliest command
  // was received some time ago, process all of the received commands
  function checkMoveCmdQueue() {
    if (moving) {
      return;
    }

    var time = new Date().getTime() - moveCmdDelay;
    for (var i = 0; i < moveCmdQueue.length; i++) {
      if (input.inputStates[moveCmdQueue[i]].pressedTime < time) {
        // at this point ALL commands are processed at once
        handleMoveCmds(moveCmdQueue);
        moveCmdQueue.length = 0;
      }
    }
  }

  // If not moving, process all held commadns AND received commands
  var moveCommands = [INPUT.UP, INPUT.DOWN, INPUT.RIGHT, INPUT.LEFT];
  function checkForHeldMoveCmds() {
    if (moving) {
      return;
    }

    // Add all pressed commands to a queue
    var pressedMoveCmds = [];
    for (var i = 0; i < moveCommands.length; i++) {
      if (input.inputStates[moveCommands[i]].pressed) {
        pressedMoveCmds.push(moveCommands[i]);
      }
    }
    // Process pressed and received commands
    handleMoveCmds(pressedMoveCmds.concat(moveCmdQueue));
    moveCmdQueue.length = 0;
  }

  // Processes an array of movement commands and determines movement direction
  // TODO: check if movement in that direction is possible
  // then issues a command to move in that direction
  function handleMoveCmds(moveCmds) {
    // Determine movement vector and any new rows/cols on screen
    movementVector = { x: 0, y: 0 };
    for (var i = 0; i < moveCmds.length; i++) {
      switch (moveCmds[i]) {
        case INPUT.UP:
          movementVector.y = -1;
          var newRowY = view.y - 1;
          break;
        case INPUT.DOWN:
          var newRowY = view.y + view.height;
          movementVector.y = 1;
          break;
        case INPUT.LEFT:
          var newColX = view.x - 1;
          movementVector.x = -1;
          break;
        case INPUT.RIGHT:
          var newColX = view.x + view.width;
          movementVector.x = 1;
          break;
        default:
          break;
      }
    }

    // Check for an actual movement:
    if (movementVector.x != 0 || movementVector.y != 0) {
      moving = true;
      movementVector.diagonal = (movementVector.x != 0 && movementVector.y != 0);
      targetViewPos.x = view.x + movementVector.x;
      targetViewPos.y = view.y + movementVector.y;

      // Check if backround should be reloaded
      // Hopefully this will not happen too often since it is called when
      // movement finishes
      if ((newColX !== undefined && (newColX < backgroundView.x || newColX >= backgroundView.x + backgroundView.width))
          || (newRowY !== undefined && (newRowY < backgroundView.y || newRowY >= backgroundView.y + backgroundView.height))) {
        loadBackgroundView();
      }
    }
  }

  // Update function
  function update(deltaTime) {
    checkMoveCmdQueue();

    // Update background if moving
    if (moving) {
      view.x += movementVector.x * tilesPerMs * (movementVector.diagonal ? 0.707 : 1)* deltaTime;
      view.y += movementVector.y * tilesPerMs * (movementVector.diagonal ? 0.707 : 1)* deltaTime;

      // If movement is complete:
      if ((targetViewPos.x - view.x) * movementVector.x <= 0 &&
          (targetViewPos.y - view.y) * movementVector.y <= 0) {
        // Set the final location
        view.x = targetViewPos.x;
        view.y = targetViewPos.y;
        moving = false;

        checkForHeldMoveCmds();
        // If there is no continued movement, reload the background
        if (!moving) {
          setTimeout(loadBackgroundView());
        }
      }

      // Update screen
      backgroundGroup.setX(Math.round(-view.x * tileSizePixels.width));
      backgroundGroup.setY(Math.round(-view.y * tileSizePixels.height));
      foregroundGroup.setX(Math.round(-view.x * tileSizePixels.width));
      foregroundGroup.setY(Math.round(-view.y * tileSizePixels.height));
      display.backgroundLayer.draw();
      display.foregroundLayer.draw();
    }
  }

  /*============================= INITIALISE =================================*/
  // Load an "empty" image for tiles that have no image specified
  emptyTileImage = new Image();
  // TODO: make image path part of config?
  emptyTileImage.src = "img/empty.png";

  // Handle input events to trigger map movement.
  var inputEventHandlers = {};
  inputEventHandlers[INPUT.UP] = function() {
    handleMoveCommandInput(INPUT.UP);
  };
  inputEventHandlers[INPUT.DOWN] = function() {
    handleMoveCommandInput(INPUT.DOWN);
  };
  inputEventHandlers[INPUT.LEFT] = function() {
    handleMoveCommandInput(INPUT.LEFT);
  };
  inputEventHandlers[INPUT.RIGHT] = function() {
    handleMoveCommandInput(INPUT.RIGHT);
  };

  //gameEvents.addEventListener(GAME_EVENT.MOVE_MAP, shiftView);
  gameEvents.addEventListener(GAME_EVENT.UPDATE, update);

  return {
    loadMap: loadMap,
    loadView: loadView,
    inputEventHandlers: inputEventHandlers,
    getPlayerPosition: getPlayerPosition,
    update: update
  };
}
