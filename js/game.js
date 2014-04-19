function GameManager() {
  this.menuActive = false;
  this.display = new DisplayManager();
  this.input = new InputManager();
  this.map = new MapManager(this.display, this.input);

  this.input.setInputEventPress(this.map.getInputEventPress());

  /*
  var self = this;
  this.gameEvents = {};
  this.gameEvents[INPUT.UP] = function() {
    self.display.move(DIRECTION.UP);
  };
  this.gameEvents[INPUT.LEFT] = function() {
    self.display.move(DIRECTION.LEFT);
  };
  this.gameEvents[INPUT.DOWN] = function() {
    self.display.move(DIRECTION.DOWN);
  };
  this.gameEvents[INPUT.RIGHT] = function() {
    self.display.move(DIRECTION.RIGHT);
  };
  this.gameEventsUp = {};
  this.gameEventsUp[INPUT.UP] = function() {
    self.display.movestop();
  };
  this.gameEventsUp[INPUT.LEFT] = function() {
    self.display.movestop();
  };
  this.gameEventsUp[INPUT.DOWN] = function() {
    self.display.movestop();
  };
  this.gameEventsUp[INPUT.RIGHT] = function() {
    self.display.movestop();
  };

  this.input.setInputEventPress(this.gameEvents);
  this.input.setInputEventUnpress(this.gameEventsUp);

  this.display.addEventListener(DisplayManager.MOVE_COMPLETE, function() {
    if (self.menuActive)
      return;

    // Continue moving if the key is still pressed
    if (self.input.getInputState(INPUT.UP).pressed) {
      self.gameEvents[INPUT.UP]();
    } else if (self.input.getInputState(INPUT.RIGHT).pressed) {
      self.gameEvents[INPUT.RIGHT]();
    } else if (self.input.getInputState(INPUT.DOWN).pressed) {
      self.gameEvents[INPUT.DOWN]();
    } else if (self.input.getInputState(INPUT.LEFT).pressed) {
      self.gameEvents[INPUT.LEFT]();
    }
  });
  */

  this.map.loadMap("data/UWGmap.json", 0, 0);
}

var game = new GameManager();
