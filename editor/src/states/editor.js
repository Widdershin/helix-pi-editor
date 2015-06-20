/* global Kiwi, _, helixPi */
'use strict';

var HelixPiEditor = HelixPiEditor || {};

HelixPiEditor.Editor = new Kiwi.State('Editor');

HelixPiEditor.Editor.create = function () {
  this.game.huds.defaultHUD.removeAllWidgets();

  this.events = {};

  this.timeline = HelixPiEditor.timeline(this);

  this.participants = [];

  this.game.input.keyboard.onKeyDown.add(
    this.onPress,
    this
  );

  this.mouse = this.game.input.mouse;
  this.mouse.onDown.add(this.handleClick, this);
  this.mouse.onUp.add(this.handleClickRelease, this);

  if (this.frameText) {
    this.frameText.destroy();
  }

  this.frameText = new Kiwi.GameObjects.TextField(this, 'test', 10, 10, '#FFF');

  this.addChild(this.frameText);

  this.currentFrame = 0;
  this.highestFrame = 0;

  this.scenarios = HelixPiEditor.scenarios();

  this.addScenarioButton = HelixPiEditor.buttons.create(
    this,
    'Add Scenario',
    5,
    55
  );

  this.addScenarioButton.input.onDown.add(this.addScenario, this);

  this.scenarioButtons = [];

  this.progressIndicator = {
    destroy: function () {}
  };

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
    this.participants.forEach(function(participant) { this.moveEntityInTime(participant, ratio) }.bind(this));
  };
}

HelixPiEditor.Editor.lastFrame = function () {
  return this.highestFrame;
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
  // TODO - support multiple participants
  return {
    participants: _.map(this.participants, 'name'),

    scenarios: this.scenarios.map(function (scenario) {
      var positions = scenario.positions;

      var initialPositions = _.chain(positions)
        .map(function (participantPositions, participant) {
          return [participant, participantPositions[0]];
      }).object()
        .value();

      var expectedPositions = _.chain(positions)
        .map(function (participantPositions, participant) {
          return [participant, participantPositions.slice(1)];
      }).object()
        .value();

      var input = scenario.input;

      return {
        participants: _.uniq(Object.keys(positions)),

        initialPositions: initialPositions,

        startPosition: function (name) {
          return initialPositions[name];
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

HelixPiEditor.Editor.savePosition = function (participant) {
  var participantGameObject = this.findParticipant(participant.name).gameObject;

  this.createPosition({
    participant: participant,
    x: participantGameObject.x + participantGameObject.width / 2,
    y: participantGameObject.y + participantGameObject.height / 2,
    frame: this.currentFrame,
  });
};

HelixPiEditor.Editor.createPosition = function (position) {
  var participantPositions = this.positions[position.participant.name];
  var existingPositionForFrameIndex = participantPositions.findIndex(function (existingPosition) {
    return existingPosition.frame == position.frame;
  });

  if (existingPositionForFrameIndex != -1) {
    participantPositions.splice(existingPositionForFrameIndex, 1);
  }

  participantPositions.push(position);
  participantPositions = participantPositions.sort(function (a, b) {
    return a.frame > b.frame;
  });

  this.updatePath(position.participant);
};

HelixPiEditor.Editor.updatePath = function (participant) {
  this.line.destroy();
  this.line = new Kiwi.Plugins.Primitives.Line({
    state: this,
    points: this.positions[participant.name]
      .map(function (position) { return [position.x, position.y]; }),

    strokeColor: [1, 1, 1],
    strokeWidth: 4
  });
  this.addChild(this.line);
};

HelixPiEditor.Editor.addKeyFrame = function () {
  this.currentFrame += 60;
  this.highestFrame = _.max([this.currentFrame, this.highestFrame]);
};

HelixPiEditor.Editor.onPress = function (keyCode) {
  if (keyCode === Kiwi.Input.Keycodes.R) {
    this.createProgram();
  }
};

HelixPiEditor.Editor.droppedEntity = function (participant) {
  this.savePosition(participant);
  this.updatePath(participant);
};

HelixPiEditor.Editor.createProgram = function () {
  this.results = helixPi(this.createScenario(), this.api, 500, 32, HelixPiEditor.results());

  HelixPiEditor.results(this.results);
};

HelixPiEditor.Editor.playProgram = function () {
  this.createProgram();
  HelixPiEditor.results(this.results);
  this.game.states.switchState('Play');
};

HelixPiEditor.Editor.moveEntityInTime = function (participant, ratio) {
  // TODO - fix stuff being moved to top left for some reason
  var participantGameObject = this.findParticipant(participant.name).gameObject;
  var lerp = function (startPosition, endPosition, ratio) {
    return {
      x: startPosition.x + (endPosition.x - startPosition.x) * ratio,
      y: startPosition.y + (endPosition.y - startPosition.y) * ratio
    };
  };

  var firstPosition = _.first(this.positions[participant.name]);

  if (ratio === 0 && firstPosition) {
    participantGameObject.x = firstPosition.x - participantGameObject.width / 2;
    participantGameObject.y = firstPosition.y - participantGameObject.height / 2;
    return;
  }

  var that = this;
  var getPositionAt = function (positions, ratio) {
    var totalFrames = that.lastFrame();
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

  var newPosition = getPositionAt(this.positions[participant.name], ratio);

  // TODO - make entity centered
  if (newPosition) {
    participantGameObject.x = newPosition.x - participantGameObject.width / 2;
    participantGameObject.y = newPosition.y - participantGameObject.height / 2;
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

  this.addChild(newInput);
  var text = new Kiwi.GameObjects.TextField(this, input.key, newInput.x + 5, newInput.y + 5, '#FFF');
  this.addChild(text);

  this.on('changeScenario', function () {
    newInput.destroy();
    text.destroy();
  });
}

HelixPiEditor.Editor.addScenario = function () {
  var newScenario = {
    participants: [
      {
        name: 'Eevee',
        sprite: this.textures.paddle
      },

      {
        name: 'Greg',
        sprite: this.textures.ball
      },

      {
        name: 'Stan',
        sprite: this.textures.paddle
      }
    ],
    positions: {
      'Eevee': [
        {
          x: 200,
          y: 250,
          frame: 0
        }
      ],
      'Greg': [
        {
          x: 400,
          y: 270,
          frame: 0
        }
      ],
      'Stan': [
        {
          x: 600,
          y: 250,
          frame: 0
        }
      ],
    },

    input: [
    ]
  };

  this.scenarios.push(newScenario);
  HelixPiEditor.scenarios(this.scenarios);

  var scenarioIndex = this.scenarios.length - 1;

  this.createScenarioButton(scenarioIndex);

  this.loadScenario(scenarioIndex);
};

HelixPiEditor.Editor.loadScenario = function (scenarioIndex) {
  this.line.destroy();
  this.line = {destroy: function () {}};

  this.participants.forEach(function (participant) {
    participant.gameObject.destroy();
  });

  this.participants = [];

  this.trigger('changeScenario');

  var scenario = this.scenarios[scenarioIndex];
  this.positions = scenario.positions;
  this.input = scenario.input;
  this.input.forEach(this.renderInput.bind(this));
  scenario.participants.forEach(this.addParticipant.bind(this));
  this.handleTimelineTick(0, true);
  this.reflowScenarioButtons();
};

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
};

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

HelixPiEditor.Editor.findParticipant = function (participantName) {
  return this.participants.find(function(participant) {
    return participant.name == participantName;
  });
}

HelixPiEditor.Editor.addParticipant = function (participant) {
  // TODO - start at the initial position

  // TODO - handle having no positions
  var startPosition = _.first(this.positions[participant.name]);
  if (startPosition === undefined) {
    startPosition = {x: 250, y: 250};
  }

  participant.gameObject = new Kiwi.GameObjects.Sprite(
    this,
    participant.sprite,
    startPosition.x,
    startPosition.y,
    true
  );

  this.addChild(participant.gameObject);
  this.participants.push(participant);

  participant.gameObject.input.enableDrag();
  participant.gameObject.input.onDragStopped.add(function () { this.droppedEntity(participant) }.bind(this));
};

HelixPiEditor.Editor.eventHandlers = function (eventName) {
  if (this.events[eventName] === undefined) {
    this.events[eventName] = [];
  }

  return this.events[eventName];
};

HelixPiEditor.Editor.on = function (eventName, callback) {
  this.eventHandlers(eventName).push(callback.bind(this));
};

HelixPiEditor.Editor.trigger = function (eventName) {
  this.eventHandlers(eventName).forEach(function (handler) {
    handler();
  });
};

