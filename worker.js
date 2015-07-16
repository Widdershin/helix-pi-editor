const helixPi = require('helix-pi');

self.onmessage = function (e) {
  const [scenarios, generation, populationSize, previousResults] = e.data;
  const results = helixPi(scenarios, generation, populationSize, deserializeResults(previousResults));
  self.postMessage(serializeResults(results));
};

function serializeResults (results) {
  return JSON.stringify(Object.keys(results).map(participant => {
    return serializeResult(participant, results[participant]);
  }).reduce((serializedResults, result) => Object.assign(serializedResults, result), {}));
}

function serializeResult (participant, individuals) {
  return {[participant]: individuals.map(helixPi.serialize)};
}

function deserializeResults (str) {
  const results = JSON.parse(str);

  return Object.keys(results).map(participant => {
    const individuals = results[participant];

    return {[participant]: individuals.map(helixPi.deserialize)};
  }).reduce((deserializedResults, result) => Object.assign(deserializedResults, result), {});
}

