// Menu Manager handles displaying of menus
// (main menu, pause menu, etc.)
function MenuManager(display, input, game) {
  
  var menus = {};
  var activeMenu = null;
  var selectedIndex = -1;
  var redraw = false;

  function loadMenus() {
    var deferred = $.Deferred();
    var jsonDfd = $.getJSON("data/menus.json");
    jsonDfd.done(function(result) {
      menus = result;
      for (var i in menus) {
        var menu = menus[i];
        var itemDef = menu.itemDef;
        menuDfds[i] = loadMenuImages(menu);
        menu.image = new Kinetic.Image({
          x: menu.background.x,
          y: menu.background.y,
          visible: false
        });
        display.menuLayer.add(menu.image);
        for (var j = 0; j < menu.items.length; i++) {
          var item = menu.items[j];
          var x = itemDef.firstX;
          var y = itemDef.firstY + itemDef.itemHeight * j;
          item.image = new Kinetic.Image({
            x: x,
            y: y,
            visible: false
          });
          item.text = new Kinetic.Text({
            text: item.label,
            x: x,
            y: y,
            width: itemWidth,
            height: itemHeight,
            visible: false
          });
          display.menuLayer.add(item.image);
          display.menuLayer.add(item.text);
        }
        menuDfds[i].done(function() {
          menu.image.setImage(menu.background.image);
          if (menu.items.length) {
            menu.items[0].setImage(menu.itemDef.selectedImage);
            for (var i = 1; i < menu.items.length; i++) {
              menu.items[i].setImage(menu.itemDef.image);
            }
          }
          if (menu.isOpen) {
            redraw = true;
          }
        });
      }
      var menuDfds = new Array(menus.length);
      // Resolve once all menus have finished loading
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

  function openMenu(menu, open) {
    if (typeof(menu) == "string") {
      if (!menus[menu]) {
        console.warn("No menu exists with name '" + menu + "'");
        return;
      }
      menu == menus[menu];
    }
    if (open === undefined)
      open = true;

    menu.isOpen = open;
    menu.image.setVisible(open);
    for (var i = 0; i < menu.items.length; i++) {
      menu.items[i].image.setVisible(open);
      menu.items[i].text.setVisible(open);
    }
    if (open) {
      activeMenu = menus[menuName];
      if (activeMenu.items.length > 0) {
        selectedIndex = 0;
        setMenuItemSelected(activeMenu, selectedIndex, true);
      } else {
        selectedIndex = -1;
      }
    } else if (menus[menuMane] == activeMenu) {
      // Closing the active menu. Activate the parent menu.
      if (activeMenu.parentMenu) {
        activeMenu = activeMenu.parentMenu;
        selectedIndex = getSelectedIndex(activeMenu);
      } else {
        // No parent menu. Release control to the game manager.
        game.commands[COMMAND.CLOSE_MENU]();
      }
    }
    redraw = true;
  }

  function setSelectedIndex(index) {
    if (index >= activeMenu.items.length || index < 0)
      return;

    setMenuItemSelected(activeMenu, selectedIndex, false);
    selectedIndex = index;
    setMenuItemSelected(activeMenu, selectedIndex, true);
  }

  function getSelectedIndex(menu) {
    for (var i = 0; i < menu.items.length; i++) {
      if (menu.items[i].selected) {
        return i;
      }
    }
    return -1;
  }

  function setMenuItemSelected(menu, index, selected) {
    var image = (selected ? menu.itemDef.selectedImage : menu.itemDef.image);
    menu.items[index].image.setImage(image);
    redraw = true;
  }

  function executeMenuItem(menuItem) {
    if (game.commands[menuItem.command])
      game.commands[menuItem.command]();
    if (menuItem.subMenu)
      openMenu(menuItem.subMenu);
  }

  function update(time) {
    if (redraw) {
      display.menuLayer.draw();
    }
  }

  var inputEventHandlers = {};
  inputEventHandlers[INPUT.UP] = function() {
    setSelectedIndex(selectedIndex + 1);
  }
  inputEventHandlers[INPUT.DOWN] = function() {
    setSelectedIndex(selectedIndex - 1);
  }
  inputEventHandlers[INPUT.LEFT] = function() {
    if (activeMenu.items[selectedIndex].subMenu)
      executeMenuItem(activeMenu.items[selectedIndex]);
  }
  inputEventHandlers[INPUT.RIGHT] = function() {
    if (activeMenu.parentMenu)
      openMenu(activeMenu, false);
  }
  inputEventHandlers[INPUT.ENTER] = function() {
    executeMenuItem(activeMenu.items[selectedIndex]);
  }

  game.gameEvents.addEventListener(GAME_EVENT.UPDATE, update);

  return {
    openMenu: openMenu,
    update: update
  };
}
