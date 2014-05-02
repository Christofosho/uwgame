var GAME_EVENT = {
  UPDATE: "update",
  MOVE_MAP: "moveMap"
};

function GameManager(display, input) {
  var menuActive = false;
  var gameEvents = new EventDispatcher();
  var map = new MapManager(display, input, gameEvents);

  // Define commands
  var commands = {
    closeMenu: function() {
      inputEventHandlers = map.inputEventHandlers;
    },
    new: function() {
      // New game
    },
    load: function() {
      // Pull up load game screen
    },
    save: function() {
    },
    quit: function() {
      // Go back to main menu
    }
  };

  var menu = new MenuManager(display, input, { gameEvents: gameEvents, commands: commands });

  // Inputs can be sent to different modules, depending on what is currently active in the game.
  // During gameplay, the map handles inputs.
  // While the menu is open, the menu handles inputs
  var inputEventHandlers = menu.inputEventHandlers;
  menu.loadMenus().done(function() {
    menu.openMenu("main");
  })

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
    gameEvents.fireEvent(GAME_EVENT.UPDATE, time);
  }

  // Load the outside map
  map.loadMap("data/UWGmap.json", 272, 160);

  var game = {
    menuActive: menuActive,
    map: map,
    processInputs: processInputs,
    update: update,
    commands: commands,
    gameEvents: gameEvents
  };

  return game;
}
