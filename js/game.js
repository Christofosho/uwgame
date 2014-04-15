function GameManager() {
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

  this.input.inputEventPress = this.gameEvents;

  this.display.addEventListener(DisplayManager.MOVE_COMPLETE, function() {
    if (self.menuActive)
      return;

    // Continue moving if the key is still pressed
    if (self.input.inputStates[INPUT.UP].pressed) {
      self.gameEvents[INPUT.UP]();
    } else if (self.input.inputStates[INPUT.RIGHT].pressed) {
      self.gameEvents[INPUT.RIGHT]();
    } else if (self.input.inputStates[INPUT.DOWN].pressed) {
      self.gameEvents[INPUT.DOWN]();
    } else if (self.input.inputStates[INPUT.LEFT].pressed) {
      self.gameEvents[INPUT.LEFT]();
    }
  });
}
GameManager.prototype = {
  menuActive: false,
  display: new DisplayManager(),
  input: new InputManager()
};

var game = new GameManager();