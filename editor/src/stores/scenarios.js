/* globals localStorage */

var HelixPiEditor = HelixPiEditor || {};

(function (exports) {
  if (localStorage.scenarios === undefined) {
    localStorage.scenarios = '[]';
  }

  exports.scenarios = function (newScenarios) {
    if (newScenarios !== undefined) {
      localStorage.scenarios = JSON.stringify(newScenarios);
    }

    return JSON.parse(localStorage.scenarios);
  };
}(HelixPiEditor));
