// TreeSitter-CodeMirror addon, copyright (c) by Shakthi Prasad GS and others
// Distributed under an MIT license: https://codemirror.net/LICENSE

let CodeMirror = require('../../lib/codemirror')
CodeMirror.defineOption("autoFormat", false, function (cm, val, old) {

  if (val) {
    let autoformatMarks = [];
    let lineStatus = {
      changed: 0, //change
      executed: 1,//no error, got result
      formatted: 2//excuted, not change
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

          // console.log(` ${keynum} has formatted`)
          autoformatMarks.push(cm.doc.markText({
            line: keynum,
            ch: 0
          }, {
            line: keynum,
            ch: lineHandle.text.length
          }, {
            className: "formatted-background"
          }));

          let startPosition = CodeMirror.Pos(+keynum, 0);
          let helperFormat = cm.getHelpers(startPosition, "format")[0];
          let lineformatted = helperFormat(cm, startPosition);



          if (lineformatted == lineHandle.text)
            linesStatus.set(lineHandle, lineStatus.formatted);
          else

            if (lineformatted != undefined) {
              if (lineformatted != "") {
                cm.doc.replaceRange(lineformatted, { line: +keynum, ch: 0 }, { line: +keynum, ch: lineHandle.text.length }, "autoformat");

              }

              linesStatus.set(lineHandle, lineStatus.formatted);
            }





        }

      }

    });





  }

})

