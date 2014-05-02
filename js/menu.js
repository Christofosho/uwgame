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
    var menuDfds = new Array(menus.length);
    jsonDfd.done(function(result) {
      menus = result;
      for (var i in menus) {
        var menu = menus[i];
        var itemDef = menu.itemDef;
        menu.image = new Kinetic.Image({
          x: menu.background.x,
          y: menu.background.y,
          visible: false
        });
        display.menuLayer.add(menu.image);
        for (var j = 0; j < menu.items.length; j++) {
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
            fontFamily: "Arial", // TODO: don't hard-code the menu font here
            fontSize: itemDef.fontSize,
            fill: itemDef.fontColor,
            width: itemDef.itemWidth,
            padding: itemDef.textPadding,
            visible: false
          });
          display.menuLayer.add(item.image);
          display.menuLayer.add(item.text);
        }
        var menuDfd = loadMenuImages(menu);
        menuDfd.done(function(menu) {
          menu.image.setImage(menu.background.image);
          if (menu.items.length) {
            for (var j = 0; j < menu.items.length; j++) {
              menu.items[j].image.setImage(menu.itemDef.image);
            }
          }
        });
        menuDfds.push(menuDfd);
      }
      // Resolve once all menus have finished loading (or failed to load)
      $.when.apply($, menuDfds).done(function() {
        deferred.resolve(menus);
      });
    });
    jsonDfd.fail(function(obj, errorType, error) {
      console.error("Failed to load menu data: " + error.stack);
      deferred.reject();
    })
    return deferred.promise();
  }

  function loadMenuImages(menu) {
    var deferred = $.Deferred();
    $.when(
      loadImage(menu.background, "image"),
      loadImage(menu.itemDef, "image"),
      loadImage(menu.itemDef, "selectedImage")
    ).done(function() {
      deferred.resolve(menu);
    });
    return deferred.promise();
  }
  
  function loadImage(obj, property) {
    var deferred = $.Deferred();
    var src = obj[property];
    var image = new Image();
    obj[property] = image;
    image.onload = function() {
      deferred.resolve();
    };
    // If the image fails to load, we still need to resolve the deferred
    // so the calling code knows when the menus are done loading.
    image.onerror = function() {
      deferred.resolve();
    };
    image.src = src;
    return deferred.promise();
  }

  function openMenu(menu, open) {
    if (typeof(menu) == "string") {
      if (!menus[menu]) {
        console.warn("No menu exists with name '" + menu + "'");
        return;
      }
      menu = menus[menu];
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
      activeMenu = menu;
      if (activeMenu.items.length > 0) {
        selectedIndex = 0;
        setMenuItemSelected(activeMenu, selectedIndex, true);
      } else {
        selectedIndex = -1;
      }
    } else if (menu == activeMenu) {
      // Closing the active menu. Activate the parent menu.
      if (activeMenu.parentMenu) {
        activeMenu = activeMenu.parentMenu;
        selectedIndex = getSelectedIndex(activeMenu);
      } else {
        // No parent menu. Release control to the game manager.
        activeMenu = null;
        game.commands.closeMenu();
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
      //redraw = false;
    }
  }

  var inputEventHandlers = {};
  inputEventHandlers[INPUT.UP] = function() {
    setSelectedIndex(selectedIndex - 1);
  }
  inputEventHandlers[INPUT.DOWN] = function() {
    setSelectedIndex(selectedIndex + 1);
  }
  inputEventHandlers[INPUT.LEFT] = function() {
    if (activeMenu.items[selectedIndex].subMenu)
      executeMenuItem(activeMenu.items[selectedIndex]);
  }
  inputEventHandlers[INPUT.RIGHT] = function() {
    if (activeMenu.parentMenu)
      openMenu(activeMenu, false);
  }
  inputEventHandlers[INPUT.ACTION] = function() {
    executeMenuItem(activeMenu.items[selectedIndex]);
  }
  inputEventHandlers[INPUT.BACK] = function() {
    // Close the current menu
    openMenu(activeMenu, false);
  }
  inputEventHandlers[INPUT.MENU] = function() {
    // Close all menus
    while (activeMenu) {
      openMenu(activeMenu, false);
    }
  }

  game.gameEvents.addEventListener(GAME_EVENT.UPDATE, update);

  return {
    loadMenus: loadMenus,
    openMenu: openMenu,
    update: update,
    inputEventHandlers: inputEventHandlers
  };
}
