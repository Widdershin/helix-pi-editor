/* global Kiwi, _*/
'use strict';

var HelixPiEditor = HelixPiEditor || {};

(function (exports) {
  var buttons = [];
  var style = function (button) {
    _.assign(
      button.style,
      {
        color: 'white',
        backgroundColor: 'gray',
        padding: '5px',
        'border-radius': '3px',
        'font-family': 'Arial'
      }
    );
  };
  exports.buttons = {
    create: function (state, name, x, y) {
      var newButton = new Kiwi.HUD.Widget.Button(state.game, name, x, y);
      state.game.huds.defaultHUD.addWidget(newButton);
      style(newButton);

      return newButton;
    },

    cleanUp: function () {
      _.each(buttons, function (button) {
        button.destroy();
      });

      buttons = [];
    }

  };
}(HelixPiEditor));
