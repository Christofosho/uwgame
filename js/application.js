window.requestAnimFrame = 
  window.requestAnimationFrame       ||
  window.webkitRequestAnimationFrame ||
  window.mozRequestAnimationFrame    ||
  function (callback) {
    return window.setTimeout(callback, 1000 / 60);
  };

window.cancelAnimFrame = 
  window.cancelAnimationFrame       ||
  window.webkitCancelAnimationFrame ||
  window.mozCancelAnimationFrame    ||
  function (id) {
    window.clearTimeout(id);
  };

function UWGApplication() {
  var input = new InputManager();
  var display = new DisplayManager();
  var game = new GameManager(display, input);

  var lastTime = new Date().getTime();

  function gameLoop() {
    // Process any inputs that have been received since the last frame
    game.processInputs(input.inputQueue);
    // Tell the game to advance time
    var time = new Date().getTime();
    game.update(time - lastTime);
    lastTime = time;
    // Prepare everything to be drawn on the screen
    display.update();
    // Run this function again on the next frame
    requestAnimFrame(gameLoop);
  }

  requestAnimFrame(gameLoop);

  return {
    display: display,
    input: input,
    game: game
  };
}

var app = new UWGApplication();
