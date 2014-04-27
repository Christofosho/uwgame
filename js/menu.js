// Menu Manager handles displaying of menus
// (main menu, pause menu, etc.)
function MenuManager() {
  
  var menus = {};
  var activeMenu = null;
  var selectedIndex = -1;

  function loadMenus() {
    var deferred = $.Deferred();
    var jsonDfd = $.getJSON("data/menus.json");
    jsonDfd.done(function(result) {
      menus = result;
      var menuDfds = new Array(menus.length);
      for (var i in menus) {
        menuDfds[i] = loadMenuImages(menus[i]);
      }
      $.when.apply($, menuDfds).done(function() {
        deferred.resolve(menus);
      });
    });
    return deferred.promise();
  }

  function loadMenuImages(menu) {
    return $.when(
      loadImage(menu.background, "image"),
      loadImage(menu.itemDef, "image"),
      loadImage(menu.itemDef, "selectedImage")
    );
  }
  
  function loadImage(obj, property) {
    var deferred = $.Deferred();
    var src = obj[property];
    var image = new Image();
    image.onload = function() {
      deferred.resolve();
    };
    obj[property] = image;
    image.src = src;
    return deferred.promise();
  }

  function openMenu(menuName) {
    if (!menus[menuName]) {
      console.warn("No menu exists with name '" + menuName + "'");
      return;
    }
    activeMenu = menus[menuName];
    activeMenu.isOpen = true;
  }

  var inputEventHandlers = {};
  inputEventHandlers[INPUT.UP] = function() {
  }
  inputEventHandlers[INPUT.DOWN] = function() {
  }
  inputEventHandlers[INPUT.LEFT] = function() {
    // TODO: enter sub-menu if it exists
  }
  inputEventHandlers[INPUT.RIGHT] = function() {
    // TODO: leave sub-menu if parent menu exists
  }
  inputEventHandlers[INPUT.ENTER] = function() {
  }

  return {
    openMenu: openMenu
  };
}

