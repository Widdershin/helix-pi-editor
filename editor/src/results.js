var HelixPiEditor = HelixPiEditor || {};

(function (exports) {
  var _results = [];

  exports.results = function (newResults) {
    if (newResults !== undefined) {
      _results = newResults;
    }

    return _results;
  };
}(HelixPiEditor));
