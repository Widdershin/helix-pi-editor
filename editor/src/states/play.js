/* global Kiwi, _ */
'use strict';

var HelixPiEditor = HelixPiEditor || {};

HelixPiEditor.Play = new Kiwi.State('Play');

var Actor = function (sprite, genes, api, fitness) {
  return {
    play: function () {
      _.each(genes, function (gene) {
        gene(api);
      });
    }
  };
};

HelixPiEditor.Play.create = function () {
  this.currentKeyFrame = 0;
  this.currentFrame = 0;
  this.play = true;
  this.compiledApi = HelixPiEditor.Editor.api(this.entity);

  this.game.huds.defaultHUD.removeAllWidgets();
  var backToEditorButton = HelixPiEditor.buttons.create(
    this,
    'Back to Editor',
    180,
    5
  )

  backToEditorButton.input.onDown.add(this.backToEditor, this);

  var that = this;
  this.actors = HelixPiEditor.results().map(function (result) {
    var sprite = new Kiwi.GameObjects.Sprite(
      that,
      that.textures.entity,
      100, // TODO - fix origin
      100,
      true
    );

    that.addChild(sprite);

    var compiledApi = HelixPiEditor.Editor.api(sprite);
    return new Actor(sprite, result.individual, compiledApi, result.fitness);
  });
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
