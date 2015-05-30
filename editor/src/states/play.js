/* global Kiwi, _, helixPi */
'use strict';

var HelixPiEditor = HelixPiEditor || {};

HelixPiEditor.Play = new Kiwi.State('Play');

HelixPiEditor.Play.create = function () {
  this.entity = new Kiwi.GameObjects.Sprite(this, this.textures.entity, 100, 100, true);
  this.addChild(this.entity);
  this.entity.input.enableDrag();

  this.game.input.keyboard.onKeyDown.add(
    this.onPress,
    this
  );

  this.frameText = new Kiwi.GameObjects.TextField(this, 'test', 10, 10, '#FFF');

  this.addChild(this.frameText);

  this.currentFrame = 0;
  this.currentKeyFrame = 0;
  this.highestFrame = 0;

  this.positions = [];
  this.line = {destroy: function () {}};
  this.progressIndicator = {destroy: function () {}};

  this.api = function (entity) {
    return {
      move: function (coordinates) {
        entity.x += coordinates.x;
        entity.y += coordinates.y;
      },

      getPosition: function () {
        return {
          x: entity.x,
          y: entity.y
        };
      }
    };
  };

  this.compiledApi = this.api(this.entity);
};

HelixPiEditor.Play.update = function () {
  Kiwi.State.prototype.update.call(this);

  this.frameText.text = ['Frame: ', this.currentKeyFrame].join('');

  if (this.play) {
    var compiledApi = this.compiledApi;
    _.each(this.codeToPlay, function (instruction) {
      instruction(compiledApi);
    });

    this.displayProgressIndicator(this.currentKeyFrame / (this.highestFrame * 60));
    this.currentKeyFrame += 1;
  }
};

HelixPiEditor.Play.displayProgressIndicator = function (progress) {
  var indicatorHeight = 60;
  this.progressIndicator.destroy();

  console.log([
      [this.game.stage.width * progress, this.game.stage.height - indicatorHeight],
      [this.game.stage.width * progress, this.game.stage.height]
  ]);

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

HelixPiEditor.Play.createScenario = function () {
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

    fitness: function (expectedPosition, entity) {
      var distance = {
        x: Math.abs(expectedPosition.x - entity.x),
        y: Math.abs(expectedPosition.y - entity.y)
      };

      return 1000 - Math.pow((distance.x + distance.y), 1.4);
    }
  };
};

HelixPiEditor.Play.savePosition = function () {
  if (this.currentKeyFrame > this.highestFrame) {
    this.highestFrame = this.currentKeyFrame;
  }

  this.positions[this.currentKeyFrame] = {
    x: this.entity.x + this.entity.width / 2,
    y: this.entity.y + this.entity.height / 2
  };

  this.updatePath();
};

HelixPiEditor.Play.updatePath = function () {
  this.line.destroy();
  this.line = new Kiwi.Plugins.Primitives.Line({
    state: this,
    points: this.positions.slice(0, this.highestFrame + 1).map(function (position) { return [position.x, position.y]; }),
    strokeColor: [1, 1, 1],
    strokeWidth: 4
  });
  this.addChild(this.line);
};

HelixPiEditor.Play.loadPosition = function () {
  if (!this.positions[this.currentKeyFrame]) {
    return;
  }

  this.entity.x = this.positions[this.currentKeyFrame].x - this.entity.width / 2;
  this.entity.y = this.positions[this.currentKeyFrame].y - this.entity.height / 2;
};

HelixPiEditor.Play.onPress = function (keyCode) {
  if (keyCode === Kiwi.Input.Keycodes.RIGHT) {
    this.savePosition();
    this.currentKeyFrame += 1;
    this.loadPosition();
  }

  if (keyCode === Kiwi.Input.Keycodes.LEFT) {
    this.savePosition();
    this.currentKeyFrame -= 1;
    this.loadPosition();
  }

  if (keyCode === Kiwi.Input.Keycodes.R) {
    this.results = helixPi(this.createScenario(), this.api);
    this.currentKeyFrame = 0;
    this.currentFrame = 0;
    this.loadPosition();
    this.play = true;
    this.codeToPlay = this.results[0].individual;
    console.log(this.results[0].fitness);
    this.renderCode(this.results[0].individual);
  }
};

HelixPiEditor.Play.renderCode = function (lines) {
  console.log(lines.map(function (f) { return f.toSource(); }).join('\n'));
};
