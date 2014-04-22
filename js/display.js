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

  this.stage.add(this.backgroundLayer)
    .add(this.objectLayer)
    .add(this.npcLayer)
    .add(this.playerLayer)
    .add(this.menuLayer);
}

DisplayManager.MOVE_COMPLETE = "move_complete";

DisplayManager.prototype = {

  stageSizePixels: {width: 540, height: 540},

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
  }
};
