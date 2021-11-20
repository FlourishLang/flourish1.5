// TreeSitter-CodeMirror addon, copyright (c) by Shakthi Prasad GS and others
// Distributed under an MIT license: https://codemirror.net/LICENSE

import { Pos, registerHelper, commands } from "../../lib/codemirror";



//TODO move to appropriate place
let lastPlaceHolder = null;

commands.gotoNextPlaceholder = function (cm) {
  if (lastPlaceHolder) {
    cm.getDoc().setSelection(Pos(lastPlaceHolder.startPosition.row, lastPlaceHolder.startPosition.column),
      Pos(lastPlaceHolder.endPosition.row, lastPlaceHolder.endPosition.column));
    lastPlaceHolder = null;
    return true;
  }
  return false;

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


