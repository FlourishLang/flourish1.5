// TreeSitter-CodeMirror addon, copyright (c) by Shakthi Prasad GS and others
// Distributed under an MIT license: https://codemirror.net/LICENSE

let CodeMirror = require('../../lib/codemirror')
CodeMirror.defineOption("autoFormat", false, (cm, isOptionEnabled, oldOptionValue) => {

  if (isOptionEnabled) {
    let autoformatMarks = [];
    let lineStatus = {
      changed: 0, //change
      compiled: 1,//no error, got result
      formatted: 2//compiled, not change
    }


    let linesStatus = new WeakMap();
    let linesTimeout = new WeakMap();

    cm.on('change', function (codeMirror, changeInfo) {

      for (let index = changeInfo.from.line; index < changeInfo.from.line + changeInfo.text.length; index++) {
        let lineHandle = cm.doc.getLineHandle(index);
        if (linesTimeout.has(lineHandle))
          clearTimeout(linesTimeout.get(lineHandle));


        if (changeInfo.origin == "undo" || changeInfo.origin == "autoformat")
          continue;

        linesStatus.set(lineHandle, lineStatus.changed);



      }

    });


    CodeMirror.defineExtension("autoformatLines", function (changes, lineConsole, errors) {

      // console.log(lineConsole);
      for (const iterator of autoformatMarks) {
        iterator.clear();
      }


      for (const key in lineConsole) {
        let lineNumber = +key;
        let lineHandle = cm.doc.getLineHandle(lineNumber);
        if (errors && errors.length && errors[0].startPosition.row == lineNumber) {
          continue
        }

        if (linesStatus.get(lineHandle) == lineStatus.changed) {
          linesTimeout.set(lineHandle, setTimeout(() => {



            let startPosition = CodeMirror.Pos(lineNumber, 0);
            let helperFormat = cm.getHelpers(startPosition, "format")[0];
            let lineFormatted = helperFormat(cm, startPosition);

            let lineHandle = cm.doc.getLineHandle(lineNumber);


            if (lineFormatted == lineHandle.text)
              linesStatus.set(lineHandle, lineStatus.formatted);
            else {

              if (lineFormatted != undefined) {
                if (lineFormatted != "") {
                  cm.doc.replaceRange(lineFormatted, { line: lineNumber, ch: 0 }, { line: lineNumber, ch: lineHandle.text.length }, "autoformat");

                }

              }

              linesStatus.set(lineHandle, lineStatus.formatted);

            }





          }, 2000));
        }

        // iterator.clear();
      }









    });





  }

})

