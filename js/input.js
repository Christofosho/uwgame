// input.js: User Input Manager
function InputManager() {

  /* ============================== VARIABLES =============================== */

  /* The inputEvent objects are in the form of {INPUT : FUNCTION()}
     When the specified input is pressed (or depressed) the function will be run
     These objects should be set by the game manager
     */
  var inputEventHandlers = {};

  var inputStates = {};
  for (i in INPUT) {
    inputStates[INPUT[i]] = { pressed: false };
  }

  /* Keyboard Map:
     Map the keyboard inputs (from event.which) to the INPUT
     */
  var keyboardMap = {
    // Escape, Q (Back)
    27: INPUT.BACK,
    81: INPUT.BACK,

    // Arrow keys
    37: INPUT.LEFT,
    38: INPUT.UP,
    39: INPUT.RIGHT,
    40: INPUT.DOWN,

    // WASD
    65: INPUT.LEFT,
    87: INPUT.UP,
    68: INPUT.RIGHT,
    83: INPUT.DOWN,

    // E, Enter (Action)
    69: INPUT.ACTION,
    13: INPUT.ACTION,

    // M (Menu)
    77: INPUT.MENU
  };

  /* ============================== FUNCTIONS =============================== */

  function keyDown(event) {
    var input = keyboardMap[event.which];
    if (input) {
      event.preventDefault();
      inputStates[input].pressed = true;
      if (inputEventHandlers[input]) {
        (inputEventHandlers[input])();
      }
    }
  }

  function keyUp(event) {
    var input = keyboardMap[event.which];
    if (input) {
      event.preventDefault();
      inputStates[input].pressed = false;
    }
  }

  function setInputEventHandlers(eventHandlers) {
    inputEventHandlers = eventHandlers;
  }

  // Key up and down listening events
  $(document).keydown(keyDown);
  $(document).keyup(keyUp);

  return {
    inputStates: inputStates,
    setInputEventHandlers: setInputEventHandlers
  };
}
