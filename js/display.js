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

    this.stage.add(this.backgroundLayer)
         .add(this.objectLayer)
         .add(this.npcLayer)
         .add(this.playerLayer)
         .add(this.menuLayer);

    // The background will be loaded in smaller chunks
    this.chunkSize = { width: this.view.width, height: this.view.height };
    this.num_chunks_x = Math.ceil(this.gameSize.width / this.chunkSize.width);
    this.num_chunks_y = Math.ceil(this.gameSize.height / this.chunkSize.height);
    // Create the background chunk array
    this.bg = new Array(this.num_chunks_y);
    for (var i = 0; i < this.bg.length; i++) {
        this.bg[i] = new Array(this.num_chunks_x);
    }

    this.view.x = 10;
    this.view.y = 10;
    this.loadBg();
}
DisplayManager.prototype = {
    // Width of the stage
    width: 800,
    // Height of the stage
    height: 600,
    // Map coordinates of the view. Indicates which tiles are currently in the view.
    view: { x: 0, y: 0, width: null, height: null },
    // The total size of the game, in map coordinates (# of tiles)
    gameSize: { width: 395, height: 235 },
    // Tile size
    tileSize: { width: 20, height: 20 },
    // Background chunk array: bg[row][col]
    bg: null,
    // Converts map coordinaates to screen coordinates
    getScreenCoords: function (mapCoords) {
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
    getMapCoords: function (screenCoords) {
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
    // Gets the (x, y) indices of the chunk that the specified tile belongs to.
    getChunkIndex: function (tile) {
        return {
            x: Math.floor(tile.x / this.chunkSize.width),
            y: Math.floor(tile.y / this.chunkSize.height)
        };
    },
    // Loads any background images, if necessary
    loadBg: function () {
        var chunk = this.getChunkIndex(this.getCenterTile());
        // Make sure the main chunk and all adjacent chunks are loaded.
        for (var i = chunk.y - 1; i <= chunk.y + 1; i++) {
            for (var j = chunk.x - 1; j <= chunk.x + 1; j++) {
                if (i < 0 || j < 0 || i >= this.num_chunks_y || j >= this.num_chunks_x)
                    continue;
                if (!this.bg[i][j]) {
                    // Chunk not loaded. Load it now.
                    this.loadBgChunk(i, j);
                }
            }
        }
    },
    // Loads a background image chunk
    loadBgChunk: function (i, j) {
        var self = this;
        var imageObj = new Image();
        imageObj.onload = function () {
            var rect = self.getScreenCoords({
                x: j * self.chunkSize.width,
                y: i * self.chunkSize.height,
                width: self.chunkSize.width,
                height: self.chunkSize.height
            })
            self.bg[i][j] = new Kinetic.Image({
                x: rect.x,
                y: rect.y,
                width: rect.width,
                height: rect.height,
                image: imageObj
            });
            self.backgroundLayer.add(self.bg[i][j]);
            // TODO: we shouldn't need to call draw() here once animation code is in place
            self.backgroundLayer.draw();
        };
        // Row and column are 1-indexed
        var r = i + 1;
        var c = j + 1;
        imageObj.src = "img/bg/bg_r" + r + "_c" + c + ".png";
    }
};
