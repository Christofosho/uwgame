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
        width: this.w,
        height: this.h
    });
    this.backgroundLayer = new Kinetic.Layer();
    this.objectLayer = new Kinetic.Layer();
    this.npcLayer = new Kinetic.Layer();
    this.playerLayer = new Kinetic.Layer();
    this.menuLayer = new Kinetic.Layer();

    stage.add(this.backgroundLayer)
         .add(this.objectLayer)
         .add(this.npcLayer)
         .add(this.playerLayer)
         .add(this.menuLayer);
}
DisplayManager.prototype = {
    // The (x, y) position, in map coordinates, of the top-left corner of the screen
    view: { x: 0, y: 0 },
    // View width (screen coordinates)
    w: 800,
    // View height (screen coordinates)
    h: 600,
    // Tile size
    tileSize: { w: 20, h: 20 }
};
