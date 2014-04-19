function InputManager() {

  /* ============================== VARIABLES =============================== */

  /* The inputEvent objects are in the form of {INPUT : FUNCTION()}
     When the specified input is pressed (or depressed) the function will be run
     These objects should be set by the game manager
     */
  var inputEventPress = {};
  var inputEventUnpress = {};

  var inputStates = {};
  for (i in INPUT) {
    inputStates[INPUT[i]] = {pressed: false};
  }

  /* Keyboard Map:
     Map the keyboard inputs (from event.which) to the INPUT
     */
  var keyboardMap = {
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

  /* ============================== FUNCTIONS =============================== */

  function keyDownFunction(event) {
    var input = keyboardMap[event.which];
    if (input) {
      event.preventDefault();
      inputStates[input].pressed = true;
      if (inputEventPress[input]) {
        (inputEventPress[input])();
      }
    }
  };

  function keyUpFunction(event) {
    var input = keyboardMap[event.which];
    if (input) {
      event.preventDefault();
      inputStates[input].pressed = false;
      if (inputEventUnpress[input]) {
        (inputEventUnpress[input])();
      }
    }
  };

  // Key up and down listening events
  $(document).keydown(keyDownFunction);
  $(document).keyup(keyUpFunction);

  /* ======================= GET/SET FUNCTIONS ============================== */

  // Get current state of given input
  function getInputState(input) {return inputStates[input];}
  function setInputEventPress(set) {inputEventPress = set;}
  function setInputEventUnpress(set) {inputEventUnpress = set;}

  return {
    getInputState: getInputState,
    setInputEventPress: setInputEventPress,
    setInputEventUnpress: setInputEventUnpress
  };

} // InputManager
