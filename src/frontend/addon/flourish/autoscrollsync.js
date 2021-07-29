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

  CodeMirror.defineOption("autoScrollSync", false, function (cm, val, old) {

    if (!val) {

    } else {

      let sourceCodeMirror = val;

      sourceCodeMirror.on('scroll',function (item) {
        cm.scrollTo(undefined,sourceCodeMirror.getScrollInfo().top);
        
        
      });



    }

  })

});