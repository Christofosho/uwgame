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
    stageSizePixels = { width: 540, height: 540 };

  // Load tileset images
  function loadTileSets(tilesets) {
    var tileSetImages = new Array(tilesets.length);
    var tileImages = new Array(tilesets.length);

    // Count the number of images that have been downloaded
    var completeCount = 0;
    var deferred = $.Deferred();
    var tileSetDfds = new Array(tilesets.length);

    for (var i in tilesets) {
      tileSetDfds[i] = $.Deferred();
      tileSetImages[i] = new Image();
      tileSetImages[i].onload = function() {
        // Split the tileset image into several tile images
        makeTileImages(tilesets[i], tileSetImages[i]).done(function(tileImgs) {
          tileImages[i] = tileImgs;
          tileSetDfds[i].resolve(tileImages);
        });
      };
      // TODO: make the path configurable?
      tileSetImages[i].src = "img/" + tilesets[i].image;
    }
    // Resolve the deferred object when all tile sets have loaded.
    $.when.apply($, tileSetDfds).done(function() {
      deferred.resolve(tileImages);
    });

    return deferred.promise();
  }

  // Crop all the tileset images to the individual tile images
  function makeTileImages(tileset, tileSetImage) {
    var deferred = $.Deferred();
    // Store all tile images in one flattened array because that is how they
    // need to be accessed later.
    var numCols = Math.floor(tileset.imagewidth / tileset.tilewidth);
    var numTiles = numCols * Math.floor(tileset.imageheight / tileset.tileheight);
    var tileImages = new Array(numTiles + tileset.firstgid);

    for (var i = 0; i < numTiles; i++) {
      // Define crop rectangle
      var rect = {
        left: (i % numCols) * tileset.tilewidth,
        top: Math.floor(i / numCols) * tileset.tileheight,
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


  var stage = new Kinetic.Stage({
    container: 'game',
    width: stageSizePixels.width,
    height: stageSizePixels.height
  });

  var backgroundLayer = new Kinetic.Layer();
  var objectLayer = new Kinetic.Layer();
  var npcLayer = new Kinetic.Layer();
  var playerLayer = new Kinetic.Layer();
  var menuLayer = new Kinetic.Layer();

  // Create background group
  var background = new Kinetic.Group({ x: 0, y: 0 });
  backgroundLayer.add(background);

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

  stage.add(backgroundLayer)
    .add(objectLayer)
    .add(npcLayer)
    .add(playerLayer)
    .add(menuLayer);

  return {
    loadTileSets: loadTileSets,
    stageSizePixels: stageSizePixels,
    backgroundLayer: backgroundLayer,
    objectLayer: objectLayer,
    npcLayer: npcLayer,
    playerLayer: playerLayer,
    menuLayer: menuLayer,
    background: background
  };
}
