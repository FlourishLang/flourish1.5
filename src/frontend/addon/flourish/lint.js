// TreeSitter-CodeMirror addon, copyright (c) by Shakthi Prasad GS and others
// Distributed under an MIT license: https://codemirror.net/LICENSE

(function (mod) {
    if (typeof exports == "object" && typeof module == "object") // CommonJS
        mod(require("../../lib/codemirror"));
    else if (typeof define == "function" && define.amd) // AMD
        define(["../../lib/codemirror"], mod);
    else // Plain browser env
        mod(CodeMirror);
})(function (CodeMirror) {



  let lintProvider = function (text, options, cm) {
    if (!cm.getDoc().getMode().treeSitterTree)
      return [];

    return cm.getDoc().getMode().treeSitterErrors.map(e => ({
      from: CodeMirror.Pos(e.startPosition.row, e.startPosition.column),
      to: CodeMirror.Pos(e.endPosition.row, e.endPosition.column),
      message: e.message,
      severity: "error"
    }))

  }




    CodeMirror.registerHelper("lint", "flourish", lintProvider)


});