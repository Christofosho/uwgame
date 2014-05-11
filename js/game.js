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
  map.loadMap("data/UWGmap.json", 272, 160);

  return {
    map: map,
    update: update,
    gameEvents: gameEvents
  };
}
