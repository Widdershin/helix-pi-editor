/* global Kiwi, _ */
'use strict';

var HelixPiEditor = HelixPiEditor || {};

HelixPiEditor.Play = new Kiwi.State('Play');

var Actor = function (sprite, genes, api, fitness) {
  var fitnessText = new Kiwi.GameObjects.TextField(
    HelixPiEditor.Play,
    Math.round(fitness),
    sprite.x,
    sprite.y + 15,
    '#FFF',
    15
  );

  fitnessText.textAlign = Kiwi.GameObjects.TextField.TEXT_ALIGN_CENTER;

  HelixPiEditor.Play.addChild(fitnessText);

  return {
    play: function () {
      _.each(genes, function (gene) {
        gene(api);
      });

      fitnessText.x = sprite.x + sprite.width / 2;
      fitnessText.y = sprite.y + 130;
    },

    moveTo: function (x, y) {
      sprite.x = x; // TODO - fix hard coded start position
      sprite.y = y;
    }
  };
};

HelixPiEditor.Play.create = function () {
  this.currentFrame = 0;
  this.game.huds.defaultHUD.removeAllWidgets();
  var backToEditorButton = HelixPiEditor.buttons.create(
    this,
    'Back to Editor',
    this.game.stage.width - 180,
    5
  );

  backToEditorButton.input.onDown.add(this.backToEditor, this);

  var restartButton = HelixPiEditor.buttons.create(
    this,
    'Restart',
    this.game.stage.width - 360,
    5
  );

  restartButton.input.onDown.add(this.restart, this);

  var startingPosition = this.startingPosition();

  var that = this;
  this.actors = HelixPiEditor.results().map(function (result) {
    var sprite = new Kiwi.GameObjects.Sprite(
      that,
      that.textures.paddle,
      startingPosition.x,
      startingPosition.y,
      true
    );

    that.addChild(sprite);

    var compiledApi = HelixPiEditor.Editor.api(sprite, that.checkButtonDown.bind(that));
    return new Actor(sprite, result.individual, compiledApi, result.fitness);
  });

  this.keys = {
    up: this.game.input.keyboard.addKey(Kiwi.Input.Keycodes.W),
    left: this.game.input.keyboard.addKey(Kiwi.Input.Keycodes.A),
    down: this.game.input.keyboard.addKey(Kiwi.Input.Keycodes.S),
    right: this.game.input.keyboard.addKey(Kiwi.Input.Keycodes.D)
  }
};

HelixPiEditor.Play.update = function () {
  _.each(this.actors, function (actor) {
    actor.play();
  });

  // this.displayProgressIndicator(this.currentFrame / (this.highestFrame * 60));
  this.currentFrame += 1;
};

HelixPiEditor.Play.backToEditor = function () {
  this.game.states.switchState('Editor');
}

HelixPiEditor.Play.restart = function () {
  this.currentFrame = 0;

  var startingPosition = this.startingPosition();

  _.each(this.actors, function (actor) {
    actor.moveTo(startingPosition.x, startingPosition.y);
  });
}

HelixPiEditor.Play.startingPosition = function () {
  return HelixPiEditor.scenarios()[0].positions[0];
}

HelixPiEditor.Play.checkButtonDown = function (button) {
  return this.keys[button].isDown;
}
