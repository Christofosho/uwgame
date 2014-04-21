function GameManager() {
  var menuActive = false;
  var display = new DisplayManager();
  var input = new InputManager();
  var map = new MapManager(display, input);

  input.setInputEventPress(map.getInputEventPress());

  map.loadMap("data/UWGmap.json", 272, 160);

  return {
    menuActive: menuActive,
    display: display,
    input: input,
    map: map
  };
}

var game = new GameManager();
