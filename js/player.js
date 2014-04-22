// Class: PlayerManager
// Input: none
function PlayerManager() {

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
        return loadedData;
    }

    // Returns the details of the current player object
    function playerDetails() {

        return {
            name: player.name,
            coordinates: player.coordinates,
            term: player.term,
            degree: player.degree,
            abilities: player.abilities
        };
    }

    return {
        save: savePlayer,
        load: loadPlayer,
        details: playerDetails
    };
}
