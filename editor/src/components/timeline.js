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

    function createKeyFrameLine (totalFrames, scenario) {
      var width = 16;
      var newX = (state.game.stage.width * scenario.frame / totalFrames) - width / 2;
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

      keyFrameLine.scenario = scenario;

      keyFrameLine.input.onDragStopped.add(function () {
        draggingFrame = null;
        keyFrameLine.scenario.frame = Math.round(totalFrames * keyFrameLine.x / state.game.stage.width);
      });

      state.addChild(keyFrameLine);

      return keyFrameLine;
    }

    function drawKeyFrameLines () {
      var lastScenario = _.last(HelixPiEditor.scenarios());
      var totalFrames = (lastScenario && lastScenario.frame);

      HelixPiEditor.scenarios().forEach(function (scenario, index) {
        var newX = (state.game.stage.width * scenario.frame / totalFrames) - 8;
        var keyFrameLine = keyFrameLines[index];
        if (keyFrameLine === undefined) {
          keyFrameLine = createKeyFrameLine(totalFrames, scenario);
          keyFrameLines[index] = keyFrameLine;
        } else {
          keyFrameLine.scenario = scenario;

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
