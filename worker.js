const helixPi = require('helix-pi');

self.onmessage = function (e) {
  const results = helixPi.apply(this, e.data);
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
