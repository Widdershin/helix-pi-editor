
var HelixPiEditor = HelixPiEditor || {};

(function (exports) {
  var _scenarios = [];

  exports.scenarios = function (newScenarios) {
    if (newScenarios !== undefined) {
      _scenarios = newScenarios;
    }

    return _scenarios;
  };
}(HelixPiEditor));
