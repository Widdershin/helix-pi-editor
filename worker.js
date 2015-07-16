const helixPi = require('helix-pi');

self.onmessage = function (e) {
  const [scenarios, generation, populationSize, previousResults] = e.data;
  const results = helixPi(scenarios, generation, populationSize, helixPi.deserialize.results(previousResults));
  self.postMessage(helixPi.serialize.results(results));
};

