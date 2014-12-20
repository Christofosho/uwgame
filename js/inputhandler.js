// inputhandler.js: small module to handle batch inputs

function InputHandler() {
  var inputHandler = {
    // Event handlers that are triggered when the input is pressed
    pressEventHandlers: {},
    // Event handlers that are triggered when the input is released
    releaseEventHandlers: {},
    // The state of each input (pressed or released)
    states: {}
  };
  for (var i in INPUT) {
    inputHandler.states[INPUT[i]] = {
      // State of the input
      pressed: false,
      // Time that the input was pressed, in milliseconds
      pressedTime: 0
    };
  }
  return inputHandler;
}
