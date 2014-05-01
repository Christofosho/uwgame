// display.js: Display Manager
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
function DisplayManager(stageSizePixels) {

  if (!stageSizePixels)
    stageSizePixels = { width: 510, height: 510 };

  function getTilesetSize(tileset) {
    var numRows = Math.floor(tileset.imageheight / tileset.tileheight);
    var numCols = Math.floor(tileset.imagewidth / tileset.tilewidth);
    return {
      numRows: numRows,
      numCols: numCols,
      numTiles: numCols * numRows
    };
  }

  // Load tileset images
  function loadTileSets(tilesets) {
    var deferred = $.Deferred();
    var tileSetDfds = new Array(tilesets.length);

    // Calculate the size required for the tile array
    var numImages = 0;
    for (var i in tilesets) {
      var size = getTilesetSize(tilesets[i]);
      numImages = Math.max(numImages, tilesets[i].firstgid + size.numTiles);
    }
    // The tileImages array is a flat array of all images from all tilesets
    var tileImages = new Array(numImages);
    for (var i in tilesets) {
      tileSetDfds[i] = $.Deferred();
      var tileSetImage = new Image();
      tileSetImage.onload = function() {
        // Split the tileset image into several tile images
        makeTileImages(tilesets[i], tileSetImage, tileImages).done(function() {
          tileSetDfds[i].resolve();
        });
      };
      // TODO: make the path configurable?
      tileSetImage.src = "img/" + tilesets[i].image;
    }
    // Resolve the deferred object when all tile sets have loaded.
    $.when.apply($, tileSetDfds).done(function() {
      deferred.resolve(tileImages);
    });

    return deferred.promise();
  }

  // Crop all the tileset images to the individual tile images
  function makeTileImages(tileset, tileSetImage, tileImages) {
    var deferred = $.Deferred();
    var size = getTilesetSize(tileset);

    for (var i = 0; i < size.numTiles; i++) {
      // Define crop rectangle
      var rect = {
        left: (i % size.numCols) * tileset.tilewidth,
        top: Math.floor(i / size.numCols) * tileset.tileheight,
        width: tileset.tilewidth,
        height: tileset.tileheight
      };
      tileImages[tileset.firstgid + i] = Pixastic.process(tileSetImage, "crop", rect);
    }
    // We don't really need a deferred object here, since we're just resolving
    // it synchronously. We're only using it in case we need to go
    // asynchronous in the future.
    deferred.resolve(tileImages);
    return deferred;
  }

  function update() {
    // TODO: ensure that the correct section of the map is loaded?
  }

  var stage = new Kinetic.Stage({
    container: 'game',
    width: stageSizePixels.width,
    height: stageSizePixels.height
  });

  var backgroundLayer = new Kinetic.Layer();
  var objectLayer = new Kinetic.Layer();
  var npcLayer = new Kinetic.Layer();
  var playerLayer = new Kinetic.Layer();
  var foregroundLayer = new Kinetic.Layer();
  var menuLayer = new Kinetic.Layer();

  // TODO: put a real player in the layer
  var rect = new Kinetic.Rect({
    width: 30,
    height: 30,
    fill: 'red',
    stroke: 'black',
    strokeWidth: 1,
    x: 240,
    y: 240
  });
  playerLayer.add( rect );

  stage.add(backgroundLayer)
    .add(objectLayer)
    .add(npcLayer)
    .add(playerLayer)
    .add(foregroundLayer)
    .add(menuLayer);

  return {
    loadTileSets: loadTileSets,
    stageSizePixels: stageSizePixels,
    backgroundLayer: backgroundLayer,
    objectLayer: objectLayer,
    npcLayer: npcLayer,
    playerLayer: playerLayer,
    menuLayer: menuLayer,
    update: update,
    foregroundLayer: foregroundLayer,
  };
}
