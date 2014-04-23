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

  var eventListeners = {};
  eventListeners[DisplayManager.MOVE_COMPLETE] = [];

  function addEventListener(event, listener) {
    if (this.eventListeners[event]) {
      this.eventListeners[event].push(listener);
    }
  }

  function removeEventListener(event, listener) {
    if (this.eventListeners[event]) {
      var index = eventListeners[event].indexOf(listener);
      if (index != -1) {
        eventListeners[event].splice(index, 1);
      }
    }
  }

  function fireEvent(event) {
    if (eventListeners[event]) {
      for (var i = 0; i < eventListeners[event].length; i++) {
        eventListeners[event][i]();
      }
    }
  }

  // Loads an image from a url specified by attrs.url
  function loadImage(attrs, callback) {
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
    stageSizePixels: stageSizePixels,
    backgroundLayer: backgroundLayer,
    objectLayer: objectLayer,
    npcLayer: npcLayer,
    playerLayer: playerLayer,
    menuLayer: menuLayer,
    background: background
  };
}

DisplayManager.MOVE_COMPLETE = "move_complete";
