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

  CodeMirror.defineOption("enableChangesMark", false, function (cm, val, old) {

    let editmark = null; //TODO move to state
    let changemarks = null;

    if (!val) {
      if (editmark) {
        editmark.clear();
        editmark = null;
      }
      if (changemarks) {
        changemarks.forEach(item => item.clear());
        changemarks = null;
      }
    } else {





      CodeMirror.defineExtension("showChangesMark", function (changes) {
        if (editmark) {
          editmark.clear();
          editmark = null;
        }
        if (changes) {
          editmark = cm.doc.markText({
            line: changes.editedRange.startPosition.row,
            ch: changes.editedRange.startPosition.column
          }, {
            line: changes.editedRange.endPosition.row,
            ch: changes.editedRange.endPosition.column
          }, {
            className: "edited-background"
          });
        }
        //

        if (changemarks) {
          changemarks.forEach(item => item.clear());
          changemarks = null;
        }

        if (changes) {
          changemarks = [];
          changes.changedRange.forEach(item => {
            changemarks.push(cm.doc.markText({
              line: item.startPosition.row,
              ch: item.startPosition.column
            }, {
              line: item.endPosition.row,
              ch: item.endPosition.column
            }, {
              className: "changed-background"
            }));
          });

        }

      })


    }

  })



  CodeMirror.defineOption("enableAfterErrorMark", false, function (cm, val, old) {

    if (val) {
      let afterErrorMark = null; //
      let lastMarkBeginLine = -1;
      let lastMarkEndLine = -1;


      CodeMirror.defineExtension("getAfterErrorMark", function () {
        return afterErrorMark;
      });


      CodeMirror.defineExtension("showAfterErrorMark", function (errorStatements) {





        if (errorStatements.length) {


          let markBeginLine = errorStatements[0].endPosition.row + 1;
          let markEndLine = cm.getDoc().lineCount();



          if (lastMarkBeginLine == markBeginLine && markEndLine == lastMarkEndLine)
            return;

          if (afterErrorMark) {
            afterErrorMark.clear();
          }



          afterErrorMark = cm.doc.markText({
            line: markBeginLine,
            ch: 0
          }, {
            line: markEndLine,
          }, {
            className: "afterError-background"
          });

          afterErrorMark.startLine = lastMarkBeginLine = markBeginLine;
          lastMarkEndLine = markEndLine;
        } else {

          if (afterErrorMark) {
            afterErrorMark.clear();
            afterErrorMark = null;
            lastMarkBeginLine = -1;
            lastMarkEndLine = -1;


          }

        }



      })

    }



  });

});