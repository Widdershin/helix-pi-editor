/* global Kiwi */
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

  this.positions = {};
};

HelixPiEditor.Play.update = function () {
  Kiwi.State.prototype.update.call(this);

  this.frameText.text = ['Frame: ', this.currentFrame].join('');
};

HelixPiEditor.Play.createScenario = function () {
  var startPosition = this.positions[0];

  return {
    startingPosition: function () {
      return JSON.parse(JSON.stringify(startPosition));
    },

    expectedEndPosition: this.positions[1],

    duration: 60,

    fitness: function (entity) {
      var distance = {
        x: Math.abs(this.expectedEndPosition.x - entity.position.x),
        y: Math.abs(this.expectedEndPosition.y - entity.position.y)
      };

      return 1000 - (distance.x + distance.y);
    }
  };
};

HelixPiEditor.Play.savePosition = function () {
  this.positions[this.currentFrame] = {
    x: this.entity.x,
    y: this.entity.y
  };
};

HelixPiEditor.Play.loadPosition = function () {
  if (!this.positions[this.currentFrame]) {
    return;
  };

  this.entity.x = this.positions[this.currentFrame].x;
  this.entity.y = this.positions[this.currentFrame].y;
};

HelixPiEditor.Play.onPress = function (keyCode) {
  if (keyCode === Kiwi.Input.Keycodes.RIGHT) {
    this.savePosition();
    this.currentFrame += 1;
    this.loadPosition();
  }

  if (keyCode === Kiwi.Input.Keycodes.LEFT) {
    this.savePosition();
    this.currentFrame -= 1;
    this.loadPosition();
  }

  if (keyCode === Kiwi.Input.Keycodes.R) {
    this.results = helixPi(this.createScenario());
    this.renderCode(this.results[0].entity.individual);
  }
};

HelixPiEditor.Play.renderCode = function (lines) {
  console.log(lines.map(function(f) { return f.toSource(); }).join('\n'));
};
