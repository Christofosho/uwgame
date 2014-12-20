// application.js: handles the frames and managers

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

  // We use a variable-time game loop because requestAnimationFrame will call
  // it at variable intervals.
  function gameLoop() {
    // Process any inputs that have been received since the last frame
    input.processInputs();
    // Tell the game to advance time
    var time = new Date().getTime();
    game.update(time - lastTime);
    lastTime = time;
    // Redraw any layers that have changed
    display.draw();
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
