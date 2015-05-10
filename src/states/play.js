/* global Kiwi */
'use strict';
var HelixPiEditor = HelixPiEditor || {};

HelixPiEditor.Play = new Kiwi.State('Play');

HelixPiEditor.Play.create = function () {
  this.entity = new Kiwi.GameObjects.Sprite(this, this.textures.entity);
  this.entity.y = this.game.stage.height * 0.5 - this.entity.height * 0.5;
  this.entity.x = this.game.stage.width * 0.5 - this.entity.width * 0.5;
  this.addChild(this.entity);
};

