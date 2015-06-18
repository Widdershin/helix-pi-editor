/* global Kiwi, _*/
'use strict';

var HelixPiEditor = HelixPiEditor || {};

(function (exports) {
  exports.timeline = function (state) {
    var self = {};

    var timelineHeight = 58;
    var mouse = state.game.input.mouse;

    var timelineRectangle = new Kiwi.Plugins.Primitives.Rectangle({
      state: state,
      width: state.game.stage.width,
      height: timelineHeight,
      y: state.game.stage.height - timelineHeight,
      color: [ 0.3, 0.3, 0.3 ]
    });

    state.addChild(timelineRectangle);

    var keyFrameLines = [];
    var draggingFrame;

    function createKeyFrameLine (totalFrames, keyPosition) {
      var width = 16;
      var newX = (state.game.stage.width * keyPosition.frame / totalFrames) - width / 2;
      var keyFrameLine = new Kiwi.Plugins.Primitives.Rectangle({
        state: state,
        width: width,
        height: timelineHeight - 10,
        x: newX,
        y: state.game.stage.height - timelineHeight,
        color: [0.8, 0.8, 0.8],
        enableInput: true,
      });

      keyFrameLine.input.enableDrag();
      keyFrameLine.input.onDragStarted.add(function () {
        draggingFrame = keyFrameLine;
      })

      keyFrameLine.keyPosition = keyPosition;

      keyFrameLine.input.onDragStopped.add(function () {
        draggingFrame = null;
        keyFrameLine.keyPosition.frame = Math.round(totalFrames * keyFrameLine.x / state.game.stage.width);
      });

      state.addChild(keyFrameLine);

      return keyFrameLine;
    }

    function drawKeyFrameLines () {
      var lastPosition = _.last(HelixPiEditor.Editor.positions);
      var totalFrames = (lastPosition && lastPosition.frame);

      // TODO - make wurk for multiple participants
      [].forEach(function (position, index) {
        var newX = (state.game.stage.width * position.frame / totalFrames) - 8;
        var keyFrameLine = keyFrameLines[index];
        if (keyFrameLine === undefined) {
          keyFrameLine = createKeyFrameLine(totalFrames, position);
          keyFrameLines[index] = keyFrameLine;
        } else {
          keyFrameLine.position = position;

          if (draggingFrame != keyFrameLine) {
            keyFrameLine.x = newX;
            keyFrameLine.y = state.game.stage.height - timelineHeight;
          } else {
            keyFrameLine.y = state.game.stage.height - timelineHeight;
          }
        }
      });
    };

    self.tick = function(callback) {
      if (mouse.isDown && mouse.y >= timelineRectangle.y) {
        callback(mouse.x / game.stage.width, !draggingFrame);
      }

      drawKeyFrameLines();
    }

    return self;
  }
}(HelixPiEditor));
