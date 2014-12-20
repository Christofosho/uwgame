// event.js: Event Manager

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

  function fireEvent(event) {
    if (!listeners[event])
      return;

    // Retrieve all arguments after the 1st
    var args = Array.prototype.slice.call(arguments, 1);

    // Call each listener with the arguments
    for (var i in listeners[event]) {
      listeners[event][i].apply(window, args);
    }
  }

  return {
    addEventListener: addEventListener,
    removeEventListener: removeEventListener,
    fireEvent: fireEvent
  }
}
