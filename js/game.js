function GameManager()
{

}
GameManager.prototype = {
    display: new DisplayManager()
};

var game = new GameManager();