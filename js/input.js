// input.js: User Input Manager
function InputManager() {

  /* ============================== VARIABLES =============================== */

  // Contains the state of each input (pressed or unpressed)
  var inputStates = {};
  for (i in INPUT) {
    inputStates[INPUT[i]] = {
      pressed: false,
      pressedTime: 0,
      repeat: false };
  }

  // A queue that contains inputs that have been received but not processed
  // Inputs will be added by the ImputManager and removed by the application
  var inputQueue = [];

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
      if (!inputStates[input].pressed) {
        inputStates[input].pressedTime = new Date().getTime();
        inputStates[input].repeat = false;
      } else {
        inputStates[input].repeat = true;
      }
      inputStates[input].pressed = true;
      inputQueue.push(input);
    }
  }

  function keyUp(event) {
    var input = keyboardMap[event.which];
    if (input) {
      event.preventDefault();
      inputStates[input].pressed = false;
    }
  }

  // Key up and down listening events
  $(document).keydown(keyDown);
  $(document).keyup(keyUp);

  return {
    inputStates: inputStates,
    inputQueue: inputQueue
  };
}
