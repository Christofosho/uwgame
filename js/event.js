function EventDispatcher() {
  var listeners = {};
  
  function addEventListener(event, listener) {
    if (!listeners[event])
      listeners[event] = [listener];
    else
      listeners[event].push(listener);
  }

  function removeEventListener(event, listener) {
    if (!listeners[event])
      return;
    
    var index = listeners[event].indexOf(listener);
    if (index != -1)
      listeners[event].splice(index, 1);
  }

  function fireEvent(event, data) {
    if (!listeners[event])
      return;

    for (var i in listeners[event]) {
      listeners[event][i](data);
    }
  }

  return {
    addEventListener: addEventListener,
    removeEventListener: removeEventListener,
    fireEvent: fireEvent
  }
}