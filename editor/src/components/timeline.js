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

    function drawKeyFrameLines () {
      var lastScenario = _.last(HelixPiEditor.scenarios());
      var totalFrames = (lastScenario && lastScenario.frame);
      HelixPiEditor.scenarios().forEach(function (scenario, index) {
        var keyFrameLine = keyFrameLines[index];

        var newX = (state.game.stage.width * scenario.frame / totalFrames) - 2;

        if (keyFrameLine === undefined) {
          keyFrameLine = new Kiwi.Plugins.Primitives.Rectangle({
            state: state,
            width: 5,
            height: timelineHeight - 10,
            x: newX,
            y: state.game.stage.height - timelineHeight,
            color: [0.8, 0.8, 0.8],
            enableInput: true,
          });

          keyFrameLine.input.onDragStopped.add(function () {
            alert('clicked a keyframe');
          })

          state.addChild(keyFrameLine);

          keyFrameLines[index] = keyFrameLine;
        } else {
          keyFrameLine.x = newX;
        }
      });
    };

    self.onClick = function(callback) {
      if (mouse.isDown && mouse.y >= timelineRectangle.y) {
        callback(mouse.x / game.stage.width);
      }

      drawKeyFrameLines();
    }

    return self;
  }
}(HelixPiEditor));
