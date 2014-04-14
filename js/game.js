function GameManager() {

}
GameManager.prototype = {
  display: new DisplayManager(),
  input_manager: new InputManager()
};

var game = new GameManager();