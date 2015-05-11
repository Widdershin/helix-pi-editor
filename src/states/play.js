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
};

HelixPiEditor.Play.update = function () {
  this.frameText.text = ['Frame: ', this.currentFrame].join('');
};

HelixPiEditor.Play.onPress = function (keyCode) {
  if (keyCode === Kiwi.Input.Keycodes.RIGHT) {
    this.currentFrame += 1;
  }

  if (keyCode === Kiwi.Input.Keycodes.LEFT) {
    this.currentFrame -= 1;
  }
};
