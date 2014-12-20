// input.js: User Input Manager
// handles all keyboard input and mouse input states

function InputManager() {

  /* ============================== VARIABLES =============================== */

  // Contains the state of each input (pressed or released)
  var activeInputStates = new InputHandler().states;
  // A set of blank input states that always say that each input is released.
  // These are used to ensure that only the input target has access to the
  // correct states.
  var blankInputStates = new InputHandler().states;

  // A queue that contains inputs that have been received but not processed
  // Inputs will be added by the ImputManager and removed by the application
  var inputQueue = [];

  // Inputs can be sent to different modules, depending on what is currently active in the game.
  // During gameplay, the map handles inputs.
  // While the menu is open, the menu handles inputs.
  var target = null;

  function setInputTarget(value) {
    if (target != null) {
      target.states = blankInputStates;
    }
    target = value;
    if (target != null) {
      target.states = activeInputStates;
    }
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
      // Prevent the default key behaviour in the browser
      event.preventDefault();

      if (!activeInputStates[input].pressed) {
        activeInputStates[input].pressedTime = new Date().getTime();
      }
      inputQueue.push({ input: input, press: true, repeat: activeInputStates[input].pressed });
      activeInputStates[input].pressed = true;
    }
  }

  function keyUp(event) {
    var input = keyboardMap[event.which];
    if (input) {
      event.preventDefault();
      activeInputStates[input].pressed = false;
      inputQueue.push({ input: input, press: false, repeat: false });
    }
  }

  // Key up and down listening events
  $(document).keydown(keyDown);
  $(document).keyup(keyUp);

  function processInputs() {
    if (!target) {
      // No module is ready to handle events.
      inputQueue.length = 0;
      return;
    }
    for (var i = 0; i < inputQueue.length; i++) {
      var event = inputQueue[i];
      var input = event.input;
      if (inputQueue[i].press) {
        if (target.pressEventHandlers[input]) {
          target.pressEventHandlers[input](event);
        }
      } else {
        if (target.releaseEventHandlers[input]) {
          target.releaseEventHandlers[input](event);
        }
      }
    }
    // Clear the array
    inputQueue.length = 0;
  }

  return {
    setInputTarget: setInputTarget,
    processInputs: processInputs
  };
}
