// TreeSitter-CodeMirror addon, copyright (c) by Shakthi Prasad GS and others
// Distributed under an MIT license: https://codemirror.net/LICENSE

import { Pos, registerHelper, commands } from "../../lib/codemirror";



//TODO move to appropriate place
let lastPlaceHolder = null;

commands.gotoNextPlaceholder = function (cm) {
  if (lastPlaceHolder) {
    cm.getDoc().setSelection(Pos(lastPlaceHolder.startPosition.row, lastPlaceHolder.startPosition.column),
      Pos(lastPlaceHolder.endPosition.row, lastPlaceHolder.endPosition.column));
    return true;
  }
  return false;

};


commands.gotoNextError = function (cm) {
  let error = cm.getDoc().getMode().treeSitterErrors[0];
  if (error) {

   let  endPosition = { row: error.endPosition.row, column: error.endPosition.column }
    if (endPosition.row == error.startPosition.row + 1 && endPosition.column == 0) {
      let line = cm.getDoc().getLine(error.startPosition.row);
      endPosition.row = error.startPosition.row;
      endPosition.column = line.length;

    }



    cm.getDoc().setSelection(Pos(error.startPosition.row, error.startPosition.column),
      Pos(endPosition.row, endPosition.column));
  }
};





let lintProvider = function (text, options, cm) {

  if (!cm.getDoc().getMode().treeSitterTree)
    return [];

  if (cm.getDoc().getMode().treeSitterErrors.length) {
    let error = cm.getDoc().getMode().treeSitterErrors[0];
    if (error.placeholder) {
      lastPlaceHolder = error;
      cm.getDoc().markText(
        Pos(error.startPosition.row, error.startPosition.column),
        Pos(error.endPosition.row, error.endPosition.column),
        { clearOnEnter: true, className: "formated-background" }

      )
    } else {
      lastPlaceHolder = null;
    }
  }

  return cm.getDoc().getMode().treeSitterErrors.map(e => ({
    from: Pos(e.startPosition.row, e.startPosition.column),
    to: Pos(e.endPosition.row, e.endPosition.column),
    message: e.message,
    severity: "error"
  }))

}




registerHelper("lint", "flourish", lintProvider)


