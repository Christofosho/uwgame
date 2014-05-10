// Menu Manager handles displaying of menus
// (main menu, pause menu, etc.)
function MenuManager(display, input, game) {
  
  var menus = {};
  var activeMenu = null;
  var selectedIndex = -1;

  function loadMenus() {
    var deferred = $.Deferred();
    var jsonDfd = $.getJSON("data/menus.json");
    var menuDfds = new Array(menus.length);
    jsonDfd.done(function(result) {
      for (var i in result) {
        var menu = result[i];
        menus[i] = menu;
        if (menu.closable === undefined) {
          // Default to true
          menu.closable = true;
        }
        menu.group = new Kinetic.Group({
          visible: false
        });
        var itemDef = menu.itemDef;
        menu.image = new Kinetic.Image({
          x: menu.background.x,
          y: menu.background.y
        });
        menu.group.add(menu.image);
        for (var j = 0; j < menu.items.length; j++) {
          createMenuItem(menu, menu.items[j], itemDef, j);
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
        display.menuLayer.add(menu.group);
      }
      // Resolve once all menus have finished loading (or failed to load)
      $.when.apply($, menuDfds).done(function() {
        deferred.resolve(menus);
      });
    });
    jsonDfd.fail(function(obj, errorType, error) {
      console.error("Failed to load menu data: " + error.stack);
      deferred.reject();
    });
    return deferred.promise();
  }

  function createMenuItem(menu, item, itemDef, index) {
    var x = itemDef.firstX;
    var y = itemDef.firstY + itemDef.itemHeight * index;
    item.image = new Kinetic.Image({
      x: x,
      y: y
    });
    item.text = new Kinetic.Text({
      text: item.label,
      x: x,
      y: y,
      fontFamily: "Arial", // TODO: don't hard-code the menu font here
      fontSize: itemDef.fontSize,
      fill: itemDef.fontColor,
      align: itemDef.textAlign,
      width: itemDef.itemWidth,
      height: itemDef.itemHeight,
      padding: itemDef.textPadding
    });
    item.text.on("mouseover", function(e) {
      setSelectedIndex(index);
    });
    item.text.on("click", function(e) {
      executeMenuItem(item);
    });
    item.text.on("tap", function(e) {
      executeMenuItem(item);
    });
    menu.group.add(item.image);
    menu.group.add(item.text);
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
    menu.group.setVisible(open);
    if (open) {
      activateMenu(menu, true);
      if (activeMenu.items.length > 0) {
        selectedIndex = 0;
        setMenuItemSelected(activeMenu, selectedIndex, true);
      } else {
        selectedIndex = -1;
      }
    } else if (menu == activateMenu) {
      // Closing the active menu. Activate the parent menu.
      var currentMenu = activateMenu;
      activateMenu(menu, false);
      if (currentMenu.parentMenu) {
        activateMenu(currentMenu.parentMenu);
      } else {
        // No parent menu. Release control to the game manager.
        game.commands.closeMenu();
      }
    }
    display.layersToUpdate.menuLayer = true;
  }

  function activateMenu(menu, activate) {
    if (activate === undefined) {
      activate = true;
    }
    // Tell the menu items to listen / stop listening to mouse events
    for (var i = 0; i < menu.items.length; i++) {
      menu.items[i].text.setListening(activate);
    }
    if (activate) {
      activeMenu = menu;
    } else {
      activeMenu = null;
    }
    selectedIndex = getSelectedIndex(activeMenu);
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
    display.layersToUpdate.menuLayer = true;
  }

  function executeMenuItem(menuItem) {
    if (game.commands[menuItem.command])
      game.commands[menuItem.command]();
    if (menuItem.subMenu)
      openMenu(menuItem.subMenu);
  }

  var inputPressEventHandlers = {};
  inputPressEventHandlers[INPUT.UP] = function() {
    setSelectedIndex(selectedIndex - 1);
  }
  inputPressEventHandlers[INPUT.DOWN] = function() {
    setSelectedIndex(selectedIndex + 1);
  }
  inputPressEventHandlers[INPUT.LEFT] = function() {
    if (activeMenu.items[selectedIndex].subMenu)
      executeMenuItem(activeMenu.items[selectedIndex]);
  }
  inputPressEventHandlers[INPUT.RIGHT] = function() {
    if (activeMenu.parentMenu)
      openMenu(activeMenu, false);
  }
  inputPressEventHandlers[INPUT.ACTION] = function() {
    executeMenuItem(activeMenu.items[selectedIndex]);
  }
  inputPressEventHandlers[INPUT.BACK] = function() {
    // Close the current menu
    if (activeMenu.closable)
      openMenu(activeMenu, false);
  }
  inputPressEventHandlers[INPUT.MENU] = function() {
    // Close all menus
    while (activeMenu) {
      if (activeMenu.closable)
        openMenu(activeMenu, false);
      else
        break;
    }
  }

  var inputUnpressEventHandlers = {};

  return {
    menus: menus,
    loadMenus: loadMenus,
    openMenu: openMenu,
    inputPressEventHandlers: inputPressEventHandlers,
    inputUnpressEventHandlers: inputUnpressEventHandlers
  };
}
