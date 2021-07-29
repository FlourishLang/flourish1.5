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

  CodeMirror.defineOption("autoFormat", false, function (cm, val, old) {

    if (!val) {

    } else {
      let autoformatMarks = [];
      let lineStatus = {
        changed: 0, //change
        executed: 1,//no error, got result
        formated: 2//excuted, not change
      }


      let linesStatus = new WeakMap();



      CodeMirror.defineExtension("autoformatLines", function (changes, lineConsole, errors) {

        for (const iterator of autoformatMarks) {
          iterator.clear();
        }

        cm.on('change', function (cMirror, changeobject) {

          if (changeobject.origin == "undo" || changeobject.origin == "autoformat")
            return;


          for (let index = changeobject.from.line; index < changeobject.from.line + changeobject.text.length; index++) {
            let line = cm.doc.getLineHandle(index);
            linesStatus.set(line, lineStatus.changed);
          }

        });





        for (var key in lineConsole) {
          let keynum = +key;
          let lineHandle = cm.doc.getLineHandle(keynum);
          if (linesStatus.get(lineHandle) === lineStatus.changed) {
            // console.log(` ${keynum} has exuted`)
            linesStatus.set(lineHandle, lineStatus.executed)
          } else if (linesStatus.get(lineHandle) === lineStatus.executed) {

            // console.log(` ${keynum} has formated`)
            autoformatMarks.push(cm.doc.markText({
              line: keynum,
              ch: 0
            }, {
              line: keynum,
              ch: lineHandle.text.length
            }, {
              className: "formated-background"
            }));

            let startPosition = CodeMirror.Pos(+keynum, 0);
            let helperFormat = cm.getHelpers(startPosition, "format")[0];
            let lineFormated = helperFormat(cm, startPosition);



            if (lineFormated == lineHandle.text)
              linesStatus.set(lineHandle, lineStatus.formated);
            else

              if (lineFormated != undefined) {
                if(lineFormated != ""){
                    cm.doc.replaceRange(lineFormated , { line: +keynum, ch: 0 }, { line: +keynum , ch: lineHandle.text.length }, "autoformat");

                }

                linesStatus.set(lineHandle, lineStatus.formated);
              }





          }

        }
     
      });





    }

  })

});