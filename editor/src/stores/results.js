/* globals localStorage, helixPi */

var HelixPiEditor = HelixPiEditor || {};

(function (exports) {
  if (localStorage.results === undefined) {
    localStorage.results = '{}';
  }

  exports.results = function (newResults) {
    if (newResults !== undefined) {
      localStorage.results = newResults;
    }

    return helixPi.deserialize.results(localStorage.results);
  };

  exports.rawResults = function () {
    return localStorage.results;
  };
}(HelixPiEditor));
