/* global Kiwi, _, helixPi */
'use strict';

var HelixPiEditor = HelixPiEditor || {};

HelixPiEditor.Editor = new Kiwi.State('Editor');

HelixPiEditor.Editor.create = function () {
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
  this.highestFrame = 0;

  this.positions = [];
  this.line = {destroy: function () {}};
  this.progressIndicator = {destroy: function () {}};

  this.nextKeyFrameButton = new Kiwi.HUD.Widget.Button(
    this.game,
    'Next Keyframe',
    this.game.stage.width - 130,
    5
  );
  this.game.huds.defaultHUD.addWidget(this.nextKeyFrameButton);
  styleButton(this.nextKeyFrameButton);

  this.prevKeyFrameButton = new Kiwi.HUD.Widget.Button(
    this.game,
    'Prev Keyframe',
    this.game.stage.width - 250,
    5
  );
  this.game.huds.defaultHUD.addWidget(this.prevKeyFrameButton);
  styleButton(this.prevKeyFrameButton);

  this.createProgramButton = new Kiwi.HUD.Widget.Button(
    this.game,
    'Create Program',
    this.game.stage.width - 250,
    40
  );
  this.game.huds.defaultHUD.addWidget(this.createProgramButton);
  styleButton(this.createProgramButton);

  this.nextKeyFrameButton.input.onDown.add(this.nextKeyFrame, this);
  this.prevKeyFrameButton.input.onDown.add(this.prevKeyFrame, this);

  function styleButton (button) {
    _.assign(
      button.style,
      {
        color: 'white',
        backgroundColor: 'gray',
        padding: '5px',
        'border-radius': '3px',
        'font-family': 'Arial'
      }
    )
  }

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

HelixPiEditor.Editor.update = function () {
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
}

HelixPiEditor.Editor.prevKeyFrame = function () {
  this.savePosition();
  this.currentKeyFrame -= 1;
  this.loadPosition();
}

HelixPiEditor.Editor.onPress = function (keyCode) {
  if (keyCode === Kiwi.Input.Keycodes.RIGHT) {
    this.nextKeyFrame();
  }

  if (keyCode === Kiwi.Input.Keycodes.LEFT) {
    this.prevKeyFrame();
  }

  if (keyCode === Kiwi.Input.Keycodes.R) {
    this.results = helixPi(this.createScenario(), this.api);
    this.currentKeyFrame = 0;
    this.currentFrame = 0;
    this.loadPosition();
    this.play = true;
    this.codeToPlay = this.results[0].individual;
    console.log(this.results[0].fitness);
  }
};

HelixPiEditor.Editor.droppedEntity = function ()  {
  this.savePosition();
}
