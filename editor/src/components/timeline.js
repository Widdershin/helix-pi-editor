/* global Kiwi, _*/
'use strict';

var HelixPiEditor = HelixPiEditor || {};

(function (exports) {
  exports.timeline = function (state) {
    var self = {};

    var timelineHeight = 60;
    var mouse = state.game.input.mouse;

    var timelineRectangle = new Kiwi.Plugins.Primitives.Rectangle({
      state: state,
      width: state.game.stage.width,
      height: timelineHeight,
      y: state.game.stage.height - timelineHeight,
      color: [ 0.3, 0.3, 0.3 ]
    });

    state.addChild(timelineRectangle);

    self.onClick = function(callback) {
      if (mouse.isDown && mouse.y >= timelineRectangle.y) {
        callback(mouse.x / game.stage.width);
      }
    }

    return self;
  }
}(HelixPiEditor));
