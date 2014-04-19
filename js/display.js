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
    4) Player layer:     contains the player. Will mostly stay in the centre of the screen.
    5) Menu layer:       main menu, inventory, etc.
*/
function DisplayManager(windowSizePixels) {

  this.eventListeners[DisplayManager.MOVE_COMPLETE] = [];

  this.sizePixels = windowSizePixels;

  this.stage = new Kinetic.Stage({
    container: 'game',
    width: this.stageSizePixels.width,
    height: this.stageSizePixels.height
  });

  this.backgroundLayer = new Kinetic.Layer();
  this.objectLayer = new Kinetic.Layer();
  this.npcLayer = new Kinetic.Layer();
  this.playerLayer = new Kinetic.Layer();
  this.menuLayer = new Kinetic.Layer();

  // Create background group
  this.background = new Kinetic.Group({ x: 0, y: 0 });
  this.backgroundLayer.add(this.background);

  // TODO: move somewhere else - possibly a player manager?
  /*
  var centre = this.getScreenCoords(this.getCentreTile());
  this.player = this.loadImage({
    url: "img/player.png",
    x: centre.x,
    y: centre.y,
    width: this.tileSizePixels.width,
    height: this.tileSizePixels.height
  });
  this.playerLayer.add(this.player);
  */

  // Empty tile image
  this.emptyTileImage = new Image();
  this.emptyTileImage.src = "img/empty.png";

  this.stage.add(this.backgroundLayer)
    .add(this.objectLayer)
    .add(this.npcLayer)
    .add(this.playerLayer)
    .add(this.menuLayer);

  //this.loadBg();
}

DisplayManager.MOVE_COMPLETE = "move_complete";

DisplayManager.prototype = {

  stageSizePixels: {width: 360, height: 360},

  // Map coordinates of the view. Indicates which tiles are currently in the view.
  view: { x: 0, y: 0, width: null, height: null },

  // Tile size (set by room map)
  tileSizePixels: { width: null, height: null },

  // Indicates whether the view is moving
  moving: false,

  // Array of tileset images and individual tile images
  tileSetImages: [],
  tileImages: [],

  // Empty tiles image
  emptyTileImage: null,

  // Buffer for tiles on screen, and indexes for positions
  tileBufferArray: null,
  leftColI: null,
  rightColI: null,
  topRowJ: null,
  bottomRowJ: null,

  // Number of tiles each side of the view to load
  TILE_BUFFER: 0,

  // Layer information for background image
  bgLayer: null,

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

  // Converts map coordinates to screen coordinates
  getScreenCoords: function(mapCoords) {
    var screenCoords = {
      x: (mapCoords.x - this.view.x) * this.tileSizePixels.width,
      y: (mapCoords.y - this.view.y) * this.tileSizePixels.height,
      width: 0, height: 0
    };
    if (mapCoords.width)
      screenCoords.width = mapCoords.width * this.tileSizePixels.width;
    if (mapCoords.height)
      screenCoords.height = mapCoords.height * this.tileSizePixels.height;
    return screenCoords;
  },

  // Converts screen coordinates to map coordinaates
  getMapCoords: function(screenCoords) {
    var mapCoords = {
      x: this.view.x + Math.floor(screenCoords.x / this.tileSizePixels.width),
      y: this.view.y + Math.floor(screenCoords.y / this.tileSizePixels.height),
      width: 0, height: 0
    };
    if (screenCoords.width)
      mapCoords.width = screenCoords.width / this.tileSizePixels.width;
    if (screenCoords.height)
      mapCoords.height = screenCoords.height / this.tileSizePixels.height;
    return mapCoords;
  },

  // Gets the map coordinates of the tile that is in the centre of the view
  getCentreTile: function() {
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

  makeNewTile: function(tileNumber, position) {
    var config = {};
    if(this.tileImages[tileNumber]) {
      config.image = this.tileImages[tileNumber];
    } else {
      config.image = this.emptyTileImage;
    }

    // determine size
    config.height = this.tileSizePixels.height;
    config.width = this.tileSizePixels.width;

    // position
    config.x = position.x;
    config.y = position.y;

    return new Kinetic.Image(config);
  },

  reloadTile: function(tile, tileNumber, position) {
    if(this.tileImages[tileNumber]) {
      tile.setImage(this.tileImages[tileNumber]);
    } else {
      tile.setImage(this.emptyTileImage);
    }
    tile.x(position.x);
    tile.y(position.y);
  },

  loadTiles: function() {
    var i, j;

    // Find the bg layer, and extract data
    for(i in this.room.layers) {
      if(this.room.layers[i].name == "bg") {
        this.bgLayer = this.room.layers[i];
        break;
      } else if(i >= this.room.layers.length) {
        console.warning( "No bg layer found for room!" );
        return;
      }
    }

    // Form (or reform) buffer for tiles on screen
    this.tileBufferArray = new Array(this.view.width + this.TILE_BUFFER * 2);
    for(i = 0; i < this.tileBufferArray.length; i++) {
      this.tileBufferArray[i] = new Array(this.view.height + this.TILE_BUFFER * 2);
    }
    this.leftColI = 0;
    this.rightColI = this.view.width + this.TILE_BUFFER * 2;
    this.topRowJ = 0;
    this.bottomRowJ = this.view.height + this.TILE_BUFFER * 2;

    // Iterate through tiles in the view and buffer, add to array and bg
    var data_i;
    var tileNumber;
    var position = { x: 0, y: 0 };
    for(i = 0; i < this.view.width + this.TILE_BUFFER * 2; i++) {
      var x = i - this.TILE_BUFFER + this.view.x;
      for(j = 0; j < this.view.height + this.TILE_BUFFER * 2; j++) {
        var y = j - this.TILE_BUFFER + this.view.y;

        // data_i is the index in the bgLayer array
        data_i = x + y * this.bgLayer.width;
        position.x = x * this.tileSizePixels.width;
        position.y = y * this.tileSizePixels.height;
        // OOB tiles defined by the 'empty' tile (number 0)
        if(x >= 0 && y >= 0 && data_i < this.bgLayer.data.length) {
          tileNumber = this.bgLayer.data[data_i];
        } else {
          tileNumber = 0;
        }
        this.tileBufferArray[i][j] = this.makeNewTile(tileNumber, position);
        this.background.add(this.tileBufferArray[i][j]);
      }
    }
  },

  reloadTilesInRow: function(j, y) {
    var i, x;
    var tileNumber;
    var data_i;
    var position = {};
    position.y = y * this.tileSizePixels.height;

    for(i = 0; i < this.view.width + this.TILE_BUFFER * 2; i++) {
      var x = i - this.TILE_BUFFER + this.view.x;
      // data_i is the index in the bgLayer array
      data_i = x + y * this.bgLayer.width;
      position.x = x * this.tileSizePixels.width;
      // OOB tiles defined by the 'empty' tile (number 0)
      if(x >= 0 && y >= 0 && data_i < this.bgLayer.data.length) {
        tileNumber = this.bgLayer.data[data_i];
      } else {
        tileNumber = 0;
      }
      this.reloadTile(this.tileBufferArray[i][j], tileNumber, position);
    }
    
  },

  reloadTilesInCol: function(i, x) {
    var j, y;
    var tileNumber;
    var data_i;
    var position = {};
    position.x = x * this.tileSizePixels.width;

    for(j = 0; j < this.view.height + this.TILE_BUFFER * 2; j++) {
      var y = j - this.TILE_BUFFER + this.view.y;
      // data_i is the index in the bgLayer array
      data_i = x + y * this.bgLayer.width;
      position.y = y * this.tileSizePixels.height;
      // OOB tiles defined by the 'empty' tile (number 0)
      if(x >= 0 && y >= 0 && data_i < this.bgLayer.data.length) {
        tileNumber = this.bgLayer.data[data_i];
      } else {
        tileNumber = 0;
      }
      this.reloadTile(this.tileBufferArray[i][j],
          tileNumber, position);
    }
    
  },

  loadTileSets: function() {
    var self = this;
    var i;

    // Make tile set array
    this.tileSetImages = new Array(this.room.tilesets.length);

    for(i in this.room.tilesets) {
      this.tileSetImages[i] = new Image();
      this.tileSetImages[i].onload = function(i) {
        // Check if all tilSetImages are loaded:
        var j, complete = true;
        for(j in self.tileSetImages) {
          if(!self.tileSetImages[j].complete) {
            complete = false;
          }
        }
        if(complete) {
          self.makeAllTiles();
          self.loadTiles();
          self.backgroundLayer.draw();
        }
      };
      this.tileSetImages[i].src = "img/" + this.room.tilesets[i].image;
    }
  },

  // Make individual tiles for tile sets
  makeTiles: function(tileset_i) {
    var tileset = this.room.tilesets[tileset_i];
    var nperrow = Math.floor(tileset.imagewidth / tileset.tilewidth);
    var totaln = nperrow * Math.floor(tileset.imageheight / tileset.tileheight);

    var i;
    for(i = 0; i < totaln; i++) {
      //var n = tileset.firstgid;
      var rect = {left: (i % nperrow) * tileset.tilewidth,
                  top: Math.floor(i / nperrow) * tileset.tileheight,
                  width: tileset.tilewidth,
                  height: tileset.tileheight};
      this.tileImages[tileset.firstgid + i] = Pixastic.process(this.tileSetImages[tileset_i], "crop", rect);
    }
  },

  makeAllTiles: function() {
    var i;
    for(i in this.tileSetImages) {
      this.makeTiles(i);
    }
  },

  makeTilesFunction: function(tileset_i) {
    var self = this;
    return function() { self.makeTiles(tileset_i); };
  },

  loadRoom: function(url) {
    var self = this;
    $.getJSON(url, function(json) {
      self.room = json;
      self.initialiseRoom();
      self.loadTileSets();
    });
  },

  initialiseRoom: function() {
    // Remove old tilesets:
    this.tileSetImages = [];
    this.tileImages = [];

    // Set tile size and view size
    this.tileSizePixels.height = this.room.tileheight;
    this.tileSizePixels.width = this.room.tilewidth;
    this.view.width = Math.ceil(this.stageSizePixels.width / this.tileSizePixels.width);
    this.view.height = Math.ceil(this.stageSizePixels.height / this.tileSizePixels.height);
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

  movestop: function() {
    window.clearInterval(this.movefunid);
    this.moving = false;
  },

  // Moves the player in a direction
  move: function(direction) {
    if (this.moving)
      return;

    var self = this;
    this.moving = true;
    // Move the background in the opposite direction to make it look like the player is moving.
    var vector = this.getVector(direction);

    var movefun = function() {
      this.background.setX(this.background.getX() - vector.x * 3);
      this.background.setY(this.background.getY() - vector.y * 3);
      this.backgroundLayer.draw();
    };

    this.movefunid = window.setInterval( $.proxy(movefun, this), 50 );
  }
};
