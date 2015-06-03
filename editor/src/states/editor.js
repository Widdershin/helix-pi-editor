/* global Kiwi, _, helixPi */
'use strict';

var HelixPiEditor = HelixPiEditor || {};

HelixPiEditor.Editor = new Kiwi.State('Editor');

HelixPiEditor.Editor.create = function () {
  this.game.huds.defaultHUD.removeAllWidgets();

  this.entity = new Kiwi.GameObjects.Sprite(
    this,
    this.textures.entity,
    100,
    100,
    true
  );

  this.addChild(this.entity);
  this.entity.input.enableDrag();
  this.entity.input.onDragStopped.add(this.droppedEntity, this);

  this.game.input.keyboard.onKeyDown.add(
    this.onPress,
    this
  );

  this.frameText = new Kiwi.GameObjects.TextField(this, 'test', 10, 10, '#FFF');

  this.addChild(this.frameText);

  this.currentFrame = 0;
  this.currentKeyFrame = 0;

  this.positions = HelixPiEditor.scenarios();
  this.line = {destroy: function () {}};
  this.updatePath();
  this.progressIndicator = {destroy: function () {}};
  this.highestFrame = this.positions.length;

  this.prevKeyFrameButton = HelixPiEditor.buttons.create(
    this,
    'Prev Keyframe',
    this.game.stage.width - 250,
    5
  );

  this.nextKeyFrameButton = HelixPiEditor.buttons.create(
    this,
    'Next Keyframe',
    this.game.stage.width - 130,
    5
  );

  this.playProgramButton = HelixPiEditor.buttons.create(
    this,
    'Play Program',
    this.game.stage.width - 250,
    35
  );

  this.nextKeyFrameButton.input.onDown.add(this.nextKeyFrame, this);
  this.prevKeyFrameButton.input.onDown.add(this.prevKeyFrame, this);
  this.playProgramButton.input.onDown.add(this.playProgram, this);

  this.api = function(entity, getButtonDown) {
    var self = {
      move(coordinates) {
        entity.x += coordinates.x;
        entity.y += coordinates.y;
      },

    }

    function declareApiCall(options, f) {
      f.takes = options.takes;
      f.returns = options.returns;
      return f;
    }

    self.checkButtonDown = declareApiCall({
      takes: ['right', 'left'], 
      returns: [true, false]
    }, getButtonDown);

    self.getPosition = declareApiCall({
      takes: [],
      returns: {x: 0, y: 0},
    }, function () {
      return {
        x: entity.x,
        y: entity.y
      };
    });

    return self;
  };
};

HelixPiEditor.Editor.update = function () {
  Kiwi.State.prototype.update.call(this);

  this.frameText.text = ['Frame: ', this.currentKeyFrame].join('');

};

HelixPiEditor.Editor.displayProgressIndicator = function (progress) {
  var indicatorHeight = 60;
  this.progressIndicator.destroy();

  this.progressIndicator = new Kiwi.Plugins.Primitives.Line({
    state: this,
    points: [
      [this.game.stage.width * progress, this.game.stage.height - indicatorHeight],
      [this.game.stage.width * progress, this.game.stage.height]
    ],
    strokeColor: [1, 1, 1],
    strokeWidth: 4
  });

  this.addChild(this.progressIndicator);
};

HelixPiEditor.Editor.createScenario = function () {
  var startPosition = this.positions[0];
  var expectedPositions = this.positions.slice(1, this.highestFrame + 1);

  return {
    startingPosition: function () {
      return JSON.parse(JSON.stringify(startPosition));
    },

    expectedPositions: expectedPositions.map(function (expectedPosition, index) {
      expectedPosition.frame = index * 60;

      return expectedPosition;
    }),

    input: [],

    fitness: function (expectedPosition, entity) {
      var distance = {
        x: Math.abs(expectedPosition.x - entity.x),
        y: Math.abs(expectedPosition.y - entity.y)
      };

      return 1000 - Math.pow((distance.x + distance.y), 1.4);
    }
  };
};

HelixPiEditor.Editor.savePosition = function () {
  if (this.currentKeyFrame > this.highestFrame) {
    this.highestFrame = this.currentKeyFrame;
  }

  this.positions[this.currentKeyFrame] = {
    x: this.entity.x + this.entity.width / 2,
    y: this.entity.y + this.entity.height / 2
  };

  HelixPiEditor.scenarios(this.positions);
  window.scenario = this.createScenario();

  this.updatePath();
};

HelixPiEditor.Editor.updatePath = function () {
  this.line.destroy();
  this.line = new Kiwi.Plugins.Primitives.Line({
    state: this,
    points: this.positions.slice(0, this.highestFrame + 1)
      .map(function (position) { return [position.x, position.y]; }),

    strokeColor: [1, 1, 1],
    strokeWidth: 4
  });
  this.addChild(this.line);
};

HelixPiEditor.Editor.loadPosition = function () {
  if (!this.positions[this.currentKeyFrame]) {
    return;
  }

  this.entity.x = this.positions[this.currentKeyFrame].x - this.entity.width / 2;
  this.entity.y = this.positions[this.currentKeyFrame].y - this.entity.height / 2;
};

HelixPiEditor.Editor.nextKeyFrame = function () {
  this.savePosition();
  this.currentKeyFrame += 1;
  this.loadPosition();
};

HelixPiEditor.Editor.prevKeyFrame = function () {
  this.savePosition();
  this.currentKeyFrame -= 1;
  this.loadPosition();
};

HelixPiEditor.Editor.onPress = function (keyCode) {
  if (keyCode === Kiwi.Input.Keycodes.RIGHT) {
    this.nextKeyFrame();
  }

  if (keyCode === Kiwi.Input.Keycodes.LEFT) {
    this.prevKeyFrame();
  }

  if (keyCode === Kiwi.Input.Keycodes.R) {
    this.createProgram();
  }
};

HelixPiEditor.Editor.droppedEntity = function () {
  this.savePosition();
};

HelixPiEditor.Editor.createProgram = function () {
  this.results = helixPi(window.scenario, this.api);
};

HelixPiEditor.Editor.playProgram = function () {
  this.createProgram();
  HelixPiEditor.results(this.results.slice(0, 4));
  this.game.states.switchState('Play');
};
