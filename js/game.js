var GAME_EVENT = {
  UPDATE: "update",
  MAP_UPDATE: "mapUpdate"
};

function GameManager(display, input) {
  var menuActive = false;
  var gameEvents = new EventDispatcher();
  var map = new MapManager(display, input, gameEvents);
  var mainMenu = null;
  var pauseMenu = null;

  function startGame() {
    // TODO: load a different area based on the saved data
    // Load the outside map, and close the menu when it is done loading.
    // TODO: give some indication that the map is loading?
    map.loadMap("data/UWGmap.json", 272, 160).done(function() {
      menu.openMenu(mainMenu, false);
    });
  }

  // Define commands
  var commands = {
    closeMenu: function() {
      inputEventHandlers = map.inputEventHandlers;
    },
    new: function() {
      // New game
      startGame();
    },
    load: function() {
      // TODO: Pull up load game screen
      startGame();
    },
    save: function() {
    },
    quit: function() {
      // Go back to main menu
      menu.openMenu(mainMenu, true);
    }
  };

  var menu = new MenuManager(display, input, { gameEvents: gameEvents, commands: commands });

  // Inputs can be sent to different modules, depending on what is currently active in the game.
  // During gameplay, the map handles inputs.
  // While the menu is open, the menu handles inputs
  var inputPressEventHandlers = map.inputPressEventHandlers;
  var inputUnpressEventHandlers = map.inputUnpressEventHandlers;
  var inputEventHandlers = menu.inputEventHandlers;
  menu.loadMenus().done(function() {
    mainMenu = menu.menus["main"];
    pauseMenu = menu.menus["pause"];
    menu.openMenu(mainMenu);
  })

  function processInputs(inputQueue) {
    for (var i = 0; i < inputQueue.length; i++) {
      var input = inputQueue[i].input;
      if (inputQueue[i].press) {
        if (inputPressEventHandlers[input]) {
          inputPressEventHandlers[input]();
        }
      } else {
        if (inputUnpressEventHandlers[input]) {
          inputUnpressEventHandlers[input]();
        }
      }
    }
    // Clear the array
    inputQueue.length = 0;
  }

  // Update the game state given the amount of elapsed time
  function update(time) {
    gameEvents.fireEvent(GAME_EVENT.UPDATE, time);
  }

  var game = {
    menuActive: menuActive,
    map: map,
    menu: menu,
    processInputs: processInputs,
    update: update,
    commands: commands,
    gameEvents: gameEvents
  };

  return game;
}
