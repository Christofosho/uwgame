// game.js: handles the game events

var GAME_EVENT = {
  UPDATE: "update",
  MAP_UPDATE: "mapUpdate"
};

function GameManager(display, input) {
  var gameEvents = new EventDispatcher();

  // Update the game state given the amount of elapsed time
  function update(time) {
    gameEvents.fireEvent(GAME_EVENT.UPDATE, time);
  }

  var map = new MapManager(display, input, gameEvents);
  input.setInputTarget(map.inputHandler);

  // Load the outside map
  // TODO: Custom coordinates
  map.loadMap("data/UWGmap.json", 272, 160);

  player.draw();

  return {
    map: map,
    update: update,
    gameEvents: gameEvents
  };
}
