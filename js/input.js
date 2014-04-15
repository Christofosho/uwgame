function InputManager() {

  /* The inputEvent objects are in the form of {INPUT : FUNCTION()}
     When the specified input is pressed (or depressed) the function will be run
     These objects should be set by the game manager
  */
  this.inputEventPress = {};
  this.inputEventUnpress = {};

  // Initialise the input state object
  this.inputStates = {};
  for (i in INPUT) {
    this.inputStates[INPUT[i]] = {pressed: false};
  }

  // Key up and down listening events
  $(document).keydown($.proxy(this.keyDownFunction, this));
  $(document).keyup($.proxy(this.keyUpFunction, this));
}

InputManager.prototype.keyDownFunction = function(event) {
  var input = this.keyboardMap[event.which];
  if (input) {
    event.preventDefault();
    this.inputStates[input].pressed = true;
    if (this.inputEventPress[input]) {
      (this.inputEventPress[input])();
    }
  }
};

InputManager.prototype.keyUpFunction = function(event) {
  var input = this.keyboardMap[event.which];
  if (input) {
    event.preventDefault();
    this.inputStates[input].pressed = false;
    if (this.inputEventUnpress[input]) {
      (this.inputEventUnpress[input])();
    }
  }
};

/* Keyboard Map:
   Map the keyboard inputs (from event.which) to the INPUT
*/
InputManager.prototype.keyboardMap = {
  // Escape, Q (Back)
  27 : INPUT.BACK,
  81 : INPUT.BACK,

  // Arrow keys
  37 : INPUT.LEFT,
  38 : INPUT.UP,
  39 : INPUT.RIGHT,
  40 : INPUT.DOWN,

  // WASD
  65 : INPUT.LEFT,
  87 : INPUT.UP,
  68 : INPUT.RIGHT,
  83 : INPUT.DOWN,

  // E, Enter (Action)
  69 : INPUT.ACTION,
  13 : INPUT.ACTION,

  // M (Menu)
  77 : INPUT.MENU
};
