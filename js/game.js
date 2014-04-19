function GameManager() {
  this.menuActive = false;
  this.display = new DisplayManager();
  this.input = new InputManager();
  this.map = new MapManager(this.display, this.input);

  this.input.setInputEventPress(this.map.getInputEventPress());

  this.map.loadMap("data/UWGmap.json", 272, 160);
}

var game = new GameManager();
