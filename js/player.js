// Class: PlayerManager
// Input:
//   display: DisplayManager object
//   input: InputManager object
function PlayerManager(display, input) {

  // Player details
  var playerDetails = {
    name: null,
    coordinates: null,
    term: null,
    degree: null,
    abilities: null 
  };


  // Saves the player object to local storage
  function savePlayer(saveData) {

    localstorage.setItem("UWGplayer", $.toJSON(saveData));

    return;

  }

  // Loads the player object from localstorage
  function loadPlayer() {

    var loadedData;

    if ( loadedData = localstorage.getItem("UWGplayer") ) {
      loadedData = $.secureEvalJSON(loadedData);
    }
    
    playerDetails = loadedData.playerDetails;

    return loadedData;

  }

  function movePlayer(direction) {
        
  }

  return {
    save: savePlayer,
    load: loadPlayer,
    details: playerDetails,
    move: movePlayer
  };

}
