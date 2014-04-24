﻿// game.js: Game Manager
function GameManager() {
  var menuActive = false;
  var display = new DisplayManager();
  var input = new InputManager();
  var map = new MapManager(display, input);
  var menu = new MenuManager(display, input);

  // Send input commands to the map (for now, at least)
  input.setInputEventHandlers(map.inputEventHandlers);

  // Load the outside map
  map.loadMap("data/UWGmap.json", 272, 160);

  return {
    menuActive: menuActive,
    display: display,
    input: input,
    map: map
  };
}

var game = new GameManager();
