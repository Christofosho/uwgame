function GameManager() {
  var menuActive = false;
  var map = new MapManager(display, input);

  // Send input commands to the map (for now, at least)
  var inputEventHandlers = map.inputEventHandlers;

  // Load the outside map
  map.loadMap("data/UWGmap.json", 272, 160);

  function processInputs(inputQueue) {
    for (var i = 0; i < inputQueue.length; i++) {
      var input = inputQueue[i];
      if (inputEventHandlers[input])
        inputEventHandlers[input]();
    }
    // Clear the array
    inputQueue.length = 0;
  }

  // Update the game state given the amount of elapsed time
  function update(time) {
    map.update(time);
  }

  return {
    menuActive: menuActive,
    map: map,
    processInputs: processInputs,
    update: update
  };
}

