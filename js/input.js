function InputManager() {
  this.keyDownFunction( { which: 20 } );
  $( document ).keydown( $.proxy( this.keyDownFunction, this ) );
}

/* Keyboard Events:
   defines a list of events, based on the keyCode / charCode
   When a key event is detected, this list is checked for an event for that key
*/
InputManager.prototype.keyboardEvents = {
  // Escape (menu?)
  27 : textChangeFun( "#inputTest", "Esc" ),
  // Directions
  37 : textChangeFun( "#inputTest", "left" ),
  38 : textChangeFun( "#inputTest", "up" ),
  39 : textChangeFun( "#inputTest", "right" ),
  40 : textChangeFun( "#inputTest", "down" )
};

InputManager.prototype.keyDownFunction = function ( event ) {
  if( this.keyboardEvents[event.which] ) {
    (this.keyboardEvents[event.which])();
  }
};

// Just used to test out things for the moment...
function textChangeFun ( id, text ) {
  return function() { $(id).text( text ) };
}

var input = new InputManager();
