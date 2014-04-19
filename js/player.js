
// Function used to create or load a player
function player {

    function save(player) {
        localstorage.setItem("player", $.toJSON(player));
        return;
    }

    function load() {
        var player;
        if ( player = localstorage.getItem("player") ) {
            player = $.secureEvalJSON(player);
        }
        return player;
    }

    var coordinates = {
        x:200,
        y:200,
        map:0
    };

    var name = name;

    return {
        save: save,
        load: load,
        coordinates: coordinates,
        name: name
    };
}
