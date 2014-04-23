// game.js: Game Manager
function GameManager() {
  var menuActive = false;
  var display = new DisplayManager();
  var input = new InputManager();
  var map = new MapManager(display, input);
  var player = new PlayerManager(display, input);

  // Send input commands to the map (for now, at least)
  input.setInputEventHandlers(map.inputEventHandlers);

  // Load the outside map
  // TODO: Custom coordinates
  map.loadMap("data/UWGmap.json", 272, 160);

  player.draw();

  return {
    menuActive: menuActive,
    display: display,
    player: player,
    input: input,
    map: map
  };
}

var game = new GameManager();
