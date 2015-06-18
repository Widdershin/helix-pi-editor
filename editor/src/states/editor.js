/* global Kiwi, _, helixPi */
'use strict';

var HelixPiEditor = HelixPiEditor || {};

HelixPiEditor.Editor = new Kiwi.State('Editor');

HelixPiEditor.Editor.create = function () {
  this.game.huds.defaultHUD.removeAllWidgets();

  this.timeline = HelixPiEditor.timeline(this);

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

  this.mouse = this.game.input.mouse;
  this.mouse.onDown.add(this.handleClick, this);
  this.mouse.onUp.add(this.handleClickRelease, this);

  this.frameText = new Kiwi.GameObjects.TextField(this, 'test', 10, 10, '#FFF');

  this.addChild(this.frameText);

  this.currentFrame = 0;
  this.currentKeyFrame = 0;

  this.scenarios = HelixPiEditor.scenarios();

  this.addScenarioButton = HelixPiEditor.buttons.create(
    this,
    'Add Scenario',
    5,
    55
  );

  this.addScenarioButton.input.onDown.add(this.addScenario, this);

  this.scenarioButtons = [];

  this.progressIndicator = new Kiwi.Plugins.Primitives.Line({
    state: this,
    points: [
      [0, this.game.stage.height - 60],
      [0, this.game.stage.height]
    ],
    strokeColor: [1, 1, 1],
    strokeWidth: 4
  });

  this.addChild(this.progressIndicator);

  this.line = new Kiwi.Plugins.Primitives.Line({
    state: this,
    points: [],

    strokeColor: [1, 1, 1],
    strokeWidth: 4
  });
  this.addChild(this.line);

  if (this.scenarios.length === 0) {
    this.addScenario();
  } else {
    this.scenarios.forEach(function (scenario, index) {
      this.createScenarioButton(index);
    }.bind(this));

    this.loadScenario(0);
  };

  this.progressIndicator = {destroy: function () {}};
  this.highestFrame = this.positions.length;

  this.addKeyFrameButton = HelixPiEditor.buttons.create(
    this,
    'Add 60 frames',
    this.game.stage.width - 130,
    5
  );

  this.playProgramButton = HelixPiEditor.buttons.create(
    this,
    'Play Program',
    this.game.stage.width - 130,
    45
  );

  this.addInputButton = HelixPiEditor.buttons.create(
    this,
    'Add input',
    5,
    this.game.stage.height - 130
  );

  this.addKeyFrameButton.input.onDown.add(this.addKeyFrame, this);
  this.playProgramButton.input.onDown.add(this.playProgram, this);
  this.addInputButton.input.onDown.add(this.addInput, this);


  this.addingInput = false;
  this.input = this.input || [];
  this.input.forEach(this.renderInput.bind(this));

  this.api = function (entity, getButtonDown) {
    var self = {};

    function declareApiCall(options, f) {
      f.takes = options.takes;
      f.returns = options.returns;
      return f;
    }

    self.move = declareApiCall({
      takes: {x: 0, y: 0},
      returns: null
    }, function (coordinates) {
      entity.x += coordinates.x;
      entity.y += coordinates.y;
    });

    self.checkButtonDown = declareApiCall({
      takes: ['right', 'left', 'up', 'down'],
      returns: [true, false]
    }, getButtonDown);

    self.getPosition = declareApiCall({
      takes: [],
      returns: {x: 0, y: 0}
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

  this.frameText.text = ['Frame: ', this.currentFrame].join('');

  this.timeline.tick(this.handleTimelineTick.bind(this));
};

HelixPiEditor.Editor.handleTimelineTick = function (ratio, updateCharacterPosition) {
  this.currentFrame = Math.round(this.lastFrame() * ratio);
  this.displayProgressIndicator(ratio);
  if (updateCharacterPosition) {
    this.moveEntityInTime(ratio);
  };
}

HelixPiEditor.Editor.lastFrame = function () {
  var lastPosition = _.last(this.positions);

  return lastPosition && lastPosition.frame;
}

HelixPiEditor.Editor.displayProgressIndicator = function (progress) {
  var indicatorHeight = 60;

  this.progressIndicator.points = [
    [this.game.stage.width * progress, this.game.stage.height - indicatorHeight],
    [this.game.stage.width * progress, this.game.stage.height]
  ];

};

HelixPiEditor.Editor.createScenario = function () {
  return {
    scenarios: this.scenarios.map(function (scenario) {
      var positions = scenario.positions;
      var startPosition = positions[0];
      var expectedPositions = positions.slice(1);
      var input = scenario.input;

      return {
        startingPosition: function () {
          return JSON.parse(JSON.stringify(startPosition));
        },

        expectedPositions: expectedPositions,
        input: input
      };
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
  this.createPosition({
    x: this.entity.x + this.entity.width / 2,
    y: this.entity.y + this.entity.height / 2,
    frame: this.currentFrame,
  });
};

HelixPiEditor.Editor.createPosition = function (position) {
  var existingPositionForFrameIndex = this.positions.findIndex(function (existingPosition) {
    return existingPosition.frame == position.frame;
  });

  if (existingPositionForFrameIndex != -1) {
    this.positions.splice(existingPositionForFrameIndex, 1);
  }

  this.positions.push(position);
  this.positions = this.positions.sort(function (a, b) {
    return a.frame > b.frame;
  });

  this.updatePath();
};

HelixPiEditor.Editor.updatePath = function () {
  this.line.destroy();
  this.line = new Kiwi.Plugins.Primitives.Line({
    state: this,
    points: this.positions
      .map(function (position) { return [position.x, position.y]; }),

    strokeColor: [1, 1, 1],
    strokeWidth: 4
  });
  this.addChild(this.line);
};

HelixPiEditor.Editor.addKeyFrame = function () {
  this.currentFrame += 60;
};

HelixPiEditor.Editor.onPress = function (keyCode) {
  if (keyCode === Kiwi.Input.Keycodes.R) {
    this.createProgram();
  }
};

HelixPiEditor.Editor.droppedEntity = function () {
  this.savePosition();
};

HelixPiEditor.Editor.createProgram = function () {
  this.results = helixPi(this.createScenario(), this.api, 500, 32, HelixPiEditor.results().map(function(entity) {
    return entity.individual;
  }));
};

HelixPiEditor.Editor.playProgram = function () {
  this.createProgram();
  HelixPiEditor.results(this.results.slice(0, 8));
  this.game.states.switchState('Play');
};

HelixPiEditor.Editor.moveEntityInTime = function (ratio) {
  var lerp = function (startPosition, endPosition, ratio) {
    return {
      x: startPosition.x + (endPosition.x - startPosition.x) * ratio,
      y: startPosition.y + (endPosition.y - startPosition.y) * ratio
    };
  };

  var firstPosition = _.first(this.positions); 
  if (ratio === 0 && firstPosition) {
    this.entity.x = firstPosition.x - this.entity.width / 2;
    this.entity.y = firstPosition.y - this.entity.height / 2;
  }

  var getPositionAt = function (positions, ratio) {
    var totalFrames = _.last(positions).frame;
    var frameToFind = totalFrames * ratio;

    if (frameToFind > totalFrames) {
      return false;
    }

    // ugh a for loop
    // TODO - make this functional and nice
    for (var positionIndex = 0; positionIndex < positions.length; positionIndex++) {
      var position = positions[positionIndex];
      var nextPosition = positions[positionIndex + 1];

      if (nextPosition === undefined) {
        continue;
      }

      if (frameToFind >= position.frame && frameToFind < nextPosition.frame) {
        // if you read this code I am a bit sorry
        var startPositionRatio = position.frame / totalFrames;
        var nextPositionRatio = nextPosition.frame / totalFrames;

        var duration = nextPositionRatio - startPositionRatio;

        return lerp(position, nextPosition, (ratio - startPositionRatio) / duration);
      }
    }

    return false;
  };

  var newPosition = getPositionAt(this.positions, ratio);

  // TODO - make entity centered
  if (newPosition) {
    this.entity.x = newPosition.x - this.entity.width / 2;
    this.entity.y = newPosition.y - this.entity.height / 2;
  }
};

HelixPiEditor.Editor.addInput = function () {
  this.addingInput = true;
  this.firstClickAfterAddingInput = true; // TODO - WOW SUC HACK
}

HelixPiEditor.Editor.handleClick = function () {
  if (this.addingInput && !this.firstClickAfterAddingInput) {
    this.inputStartX = this.mouse.x;
  }
}

HelixPiEditor.Editor.handleClickRelease = function () {
  if (this.addingInput) {
    if (this.firstClickAfterAddingInput) {
      this.firstClickAfterAddingInput = false;
      return;
    }

    this.addingInput = false;
    this.createInput(
      this.inputStartX,
      this.mouse.x,
      prompt('Key?')
    );
  }
}

HelixPiEditor.Editor.createInput = function (startX, endX, key) {
  var totalFrames = this.lastFrame();

  var input = {
    startFrame: totalFrames * startX / this.game.stage.width,
    endFrame: totalFrames * endX / this.game.stage.width,
    key: key,
    startX: startX,
    endX: endX
  };

  this.input.push(input);
  this.renderInput(input);
}

HelixPiEditor.Editor.renderInput = function(input) {
  var newInput = new Kiwi.Plugins.Primitives.Rectangle({
    state: this,
    x: input.startX,
    y: this.game.stage.height - 100,
    width: input.endX - input.startX,
    height: 30,
    color: [0.5, 0.5, 0.5],
  })

  this.frameText = new Kiwi.GameObjects.TextField(this, 'test', 10, 10, '#FFF');
  this.addChild(newInput);
  var text = new Kiwi.GameObjects.TextField(this, input.key, newInput.x + 5, newInput.y + 5, '#FFF');
  this.addChild(text);
}

HelixPiEditor.Editor.addScenario = function () {
  var newScenario = {
    positions: [
      {
        x: 200,
        y: 200,
        frame: 0
      }
    ],

    input: [
    ],
  }

  this.scenarios.push(newScenario);
  HelixPiEditor.scenarios(this.scenarios);

  var scenarioIndex = this.scenarios.length - 1;

  this.createScenarioButton(scenarioIndex);

  this.loadScenario(scenarioIndex);
};

HelixPiEditor.Editor.loadScenario = function (scenarioIndex) {
  this.positions = this.scenarios[scenarioIndex].positions;
  this.input = this.scenarios[scenarioIndex].input;
  this.handleTimelineTick(0, true);
  this.reflowScenarioButtons();
  this.updatePath();
}

HelixPiEditor.Editor.reflowScenarioButtons = function () {
  var yOffset = 55;
  var yDistance = 40;

  this.scenarioButtons.forEach(function (button, index) {
    button.x = 5;
    button.y = index + yOffset + index * yDistance;
  });

  if (this.scenarioButtons.length === 0) {
    this.addScenarioButton.y = yOffset;
  } else {
    this.addScenarioButton.y = _.last(this.scenarioButtons).y + yDistance;
  }
}

HelixPiEditor.Editor.createScenarioButton = function (scenarioIndex) {
  var newScenarioButton = HelixPiEditor.buttons.create(
    this,
    'Scenario #' + (scenarioIndex + 1),
    5,
    55
  );

  newScenarioButton.input.onDown.add(function () {
    this.loadScenario(scenarioIndex); // Oh yeah sweet potential off by one error
  }.bind(this));

  this.scenarioButtons.push(newScenarioButton);
};
