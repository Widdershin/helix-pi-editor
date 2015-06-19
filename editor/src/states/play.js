/* global Kiwi, _ */
'use strict';

var HelixPiEditor = HelixPiEditor || {};

HelixPiEditor.Play = new Kiwi.State('Play');

var Actor = function (sprite, genes, api, fitness, name) {
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
    },
    name: name,
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

  var that = this;
  var spriteToUse = {
    'Eevee': this.textures.paddle,
    'Greg': this.textures.ball,
    'Stan': this.textures.paddle
  }

  this.actors = _.map(HelixPiEditor.results(), function (individuals, participant) {
    var startingPosition = that.startingPosition(participant);

    var sprite = new Kiwi.GameObjects.Sprite(
      that,
      spriteToUse[participant],
      startingPosition.x,
      startingPosition.y,
      true
    );

    that.addChild(sprite);

    var compiledApi = HelixPiEditor.Editor.api(sprite, that.checkButtonDown.bind(that));
    return new Actor(sprite, individuals[0], compiledApi, individuals[0].fitness, participant);
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

  var that = this;
  _.each(this.actors, function (actor) {
    var startingPosition = that.startingPosition(actor.name);
    actor.moveTo(startingPosition.x, startingPosition.y);
  });
}

HelixPiEditor.Play.startingPosition = function (participant) {
  return HelixPiEditor.scenarios()[0].positions[participant][0];
}

HelixPiEditor.Play.checkButtonDown = function (button) {
  return this.keys[button].isDown;
}
