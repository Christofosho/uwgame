/* How things work:
 - There are 2 types of coordinates:
    1) Map coordinates: integer values representing the x and y indices of a tile
    2) Screen coordinates: represent pixel locations of the screen, relative to the canvas origin
 - Any time you want to move something on a canvas, you have to redraw the entire canvas
   (KineticJS takes care of this for us)
 - Each layer is drawn on a separate canvas. This means that if we are updating one layer,
   the other layers will not be redrawn
 - Thus, for efficiency purposes, we should try to separate static and dynamic objects into
   separate layers. That way we can cut down on the amount of redrawing that needs to be done.
 - 5 layers (so far) from bottom to top:
    1) Background layer: contains the background image(s)
    2) Object layer:     contains objects that will be on the ground
    3) NPC layer:        contains NPCs, or really anything that will be moving on a regular basis
    4) Player layer:     contains the player. Will mostly stay in the center of the screen.
    5) Menu layer:       main menu, inventory, etc.
*/
function DisplayManager() {

  this.eventListeners[DisplayManager.MOVE_COMPLETE] = [];

  this.stage = new Kinetic.Stage({
    container: 'game',
    width: this.width,
    height: this.height
  });
  // Calculate width and height in map coords
  this.view.width = Math.ceil(this.width / this.tileSize.width);
  this.view.height = Math.ceil(this.height / this.tileSize.height);

  this.backgroundLayer = new Kinetic.Layer();
  this.objectLayer = new Kinetic.Layer();
  this.npcLayer = new Kinetic.Layer();
  this.playerLayer = new Kinetic.Layer();
  this.menuLayer = new Kinetic.Layer();

  // The background will be loaded in smaller chunks
  this.chunkSize = { width: this.view.width, height: this.view.height };
  this.num_chunks_x = Math.ceil(this.gameSize.width / this.chunkSize.width);
  this.num_chunks_y = Math.ceil(this.gameSize.height / this.chunkSize.height);
  // Create the background chunk array
  this.backgroundImages = new Array(this.num_chunks_y);
  for (var i = 0; i < this.backgroundImages.length; i++) {
    this.backgroundImages[i] = new Array(this.num_chunks_x);
  }
  this.background = new Kinetic.Group({ x: 0, y: 0 });
  this.backgroundLayer.add(this.background);

  var center = this.getCenterTile();
  this.player = this.loadImage({
    url: "img/player.png",
    x: center.x,
    y: center.y,
    width: this.tileSize.width,
    height: this.tileSize.height
  });
  this.playerLayer.add(this.player);

  this.stage.add(this.backgroundLayer)
    .add(this.objectLayer)
    .add(this.npcLayer)
    .add(this.playerLayer)
    .add(this.menuLayer);

  this.loadBg();
}

DisplayManager.MOVE_COMPLETE = "move_complete";

DisplayManager.prototype = {
  // Width of the stage
  width: 800,

  // Height of the stage
  height: 600,

  // Map coordinates of the view. Indicates which tiles are currently in the view.
  view: { x: 0, y: 0, width: null, height: null },

  // The total size of the game, in map coordinates (# of tiles)
  gameSize: { width: 297, height: 147 },

  // Tile size
  tileSize: { width: 40, height: 40 },

  // Indicates whether the view is moving
  moving: false,

  // The time it takes to move 1 tile, in seconds
  moveTime: 0.3,

  // Background chunk array: backgroundImages[row][col]
  backgroundImages: null,

  // Background chunk array: backgroundImages[row][col]
  eventListeners: {},

  addEventListener: function(event, listener) {
    if (this.eventListeners[event])
      this.eventListeners[event].push(listener);
  },

  removeEventListener: function(event, listener) {
    if (this.eventListeners[event])
    {
      var index = this.eventListeners[event].indexOf(listener);
      if (index != -1) {
        this.this.eventListeners[event].splice(index, 1);
      }
    }
  },

  fireEvent: function(event) {
    if (this.eventListeners[event])
    {
      for (var i = 0; i < this.eventListeners[event].length; i++) {
        this.eventListeners[event][i]();
      }
    }
  },

  // Converts map coordinaates to screen coordinates
  getScreenCoords: function(mapCoords) {
    var screenCoords = {
      x: (mapCoords.x - this.view.x) * this.tileSize.width,
      y: (mapCoords.y - this.view.y) * this.tileSize.height,
      width: 0, height: 0
    };
    if (mapCoords.width)
      screenCoords.width = mapCoords.width * this.tileSize.width;
    if (mapCoords.height)
      screenCoords.height = mapCoords.height * this.tileSize.height;
    return screenCoords;
  },

  // Converts screen coordinates to map coordinaates
  getMapCoords: function(screenCoords) {
    var mapCoords = {
      x: this.view.x + Math.floor(screenCoords.x / this.tileSize.width),
      y: this.view.y + Math.floor(screenCoords.y / this.tileSize.height),
      width: 0, height: 0
    };
    if (screenCoords.width)
      mapCoords.width = screenCoords.width / this.tileSize.width;
    if (screenCoords.height)
      mapCoords.height = screenCoords.height / this.tileSize.height;
    return mapCoords;
  },

  // Gets the coordinates of the tile that is in the center of the view
  getCenterTile: function() {
    return {
      x: this.view.x + Math.floor(this.view.width / 2),
      y: this.view.y + Math.floor(this.view.height / 2)
    };
  },

  // Gets the map coordinates of the tile that the player is currently standing on.
  getPlayerTile: function() {
    return this.getMapCoords({
      x: this.player.getX(),
      y: this.player.getY()
    })
  },

  // Gets the (x, y) indices of the chunk that the specified tile belongs to.
  getChunkIndex: function(tile) {
    return {
      x: Math.floor(tile.x / this.chunkSize.width),
      y: Math.floor(tile.y / this.chunkSize.height)
    };
  },

  // Loads an image from a url specified by attrs.url
  loadImage: function(attrs, callback) {
    var img = new Kinetic.Image(attrs);
    var imageObj = new Image();
    imageObj.onload = function() {
      img.setImage(imageObj);
      if (callback) {
        callback();
      }
    };
    imageObj.src = attrs.url;

    return img;
  },

  // Loads any background images, if necessary
  loadBg: function() {
    var chunk = this.getChunkIndex(this.getCenterTile());
    // Make sure the main chunk and all adjacent chunks are loaded and added to the stage.
    this.background.removeChildren();
    for (var i = chunk.y - 1; i <= chunk.y + 1; i++) {
      for (var j = chunk.x - 1; j <= chunk.x + 1; j++) {
        if (i < 0 || j < 0 || i >= this.num_chunks_y || j >= this.num_chunks_x) {
          continue;
        }
        if (!this.backgroundImages[i][j]) {
          // Chunk not loaded. Load it now.
          this.loadBgChunk(i, j);
        }
        this.background.add(this.backgroundImages[i][j]);
      }
    }
  },

  // Loads a background image chunk
  loadBgChunk: function(i, j) {
    var self = this;
    var attrs = {
      x: j * this.chunkSize.width * this.tileSize.width,
      y: i * this.chunkSize.height * this.tileSize.height,
      width: this.chunkSize.width * this.tileSize.width,
      height: this.chunkSize.height * this.tileSize.height
    };

    // Row and column are 1-indexed
    var r = i + 1;
    var c = j + 1;

    attrs.url = "img/bg/bg_r" + r + "_c" + c + ".png";
    this.backgroundImages[i][j] = this.loadImage(attrs,
        function() {
          // Redraw the background layer
          self.backgroundLayer.draw();
        });
  },

  // Get a vector that corresponds to a direction
  getVector: function(direction) {
    switch (direction) {
      case DIRECTION.UP:
        return { x: 0, y: -1 };
      case DIRECTION.DOWN:
        return { x: 0, y: 1 };
      case DIRECTION.LEFT:
        return { x: -1, y: 0 };
      case DIRECTION.RIGHT:
        return { x: 1, y: 0 };
    }
    return null;
  },

  // Moves the player in a direction
  move: function(direction) {
    if (this.moving)
      return;

    var self = this;
    this.moving = true;
    // Move the background in the opposite direction to make it look like the player is moving.
    var vector = this.getVector(direction);
    // Move the background, objects, and NPCs
    var tween1 = new Kinetic.Tween({
      node: this.background,
      duration: this.moveTime,
      x: this.background.getX() - this.tileSize.width * vector.x,
      y: this.background.getY() - this.tileSize.height * vector.y,
      onFinish: function() {
        self.moving = false;
        self.view.x += vector.x;
        self.view.y += vector.y;
        // Ensure the correct chunks are loaded
        self.loadBg();
        self.fireEvent(DisplayManager.MOVE_COMPLETE);
      }
    });
    tween1.play();
  }
};
