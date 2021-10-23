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

  function _comparePos(pos1, pos2) {
    if (pos1.row != pos2.row)
      return pos1.row - pos2.row;

    return pos1.column - pos2.column;

  }

  let oldTreeZipper;
  let currentTreeCursor;


  function treeZipperInit(newTreeZipper) {
    if (newTreeZipper != oldTreeZipper) {

      currentTreeCursor = newTreeZipper;

      oldTreeZipper = newTreeZipper;
      return true;
    }

    return false;

  }

  function treeZipperAdjustPosition(startPos, endPos) {

    while (currentTreeCursor) {
      if (_comparePos(endPos, currentTreeCursor.node.startPosition) < 0) {
        currentTreeCursor = currentTreeCursor.prevSibling;
      }
      else if (_comparePos(startPos, currentTreeCursor.node.startPosition) < 0 && currentTreeCursor.prev)
        currentTreeCursor = currentTreeCursor.prev;
      else
        break;

    }


    while (currentTreeCursor) {
      if (_comparePos(currentTreeCursor.node.endPosition, startPos) < 0) {
        currentTreeCursor = currentTreeCursor.nextSibling;
      }
      else if (_comparePos(currentTreeCursor.node.startPosition, startPos) >= 0) {
        break;
      }
      else {
        if (currentTreeCursor.next)
          currentTreeCursor = currentTreeCursor.next;
        else {
          break;
        }


      }

    }

    // 


  }


  function treeZipperAdjustPositionExclusive(startPos, endPos) {

    while (currentTreeCursor) {
      if (_comparePos(endPos, currentTreeCursor.node.startPosition) < 0) {
        currentTreeCursor = currentTreeCursor.prevSibling;
      }
      else if (_comparePos(startPos, currentTreeCursor.node.startPosition) < 0 && currentTreeCursor.prev)
        currentTreeCursor = currentTreeCursor.prev;
      else if (currentTreeCursor.prev && _comparePos(startPos, currentTreeCursor.prev.node.startPosition) == 0)
        currentTreeCursor = currentTreeCursor.prev;
      else 
        break;

    }




    while (currentTreeCursor) {
      if (_comparePos(currentTreeCursor.node.endPosition, startPos) < 0) {
        currentTreeCursor = currentTreeCursor.nextSibling;
      }
      else if (_comparePos(currentTreeCursor.node.startPosition, startPos) >= 0) {
        break;
      }
      else {
        if (currentTreeCursor.next)
          currentTreeCursor = currentTreeCursor.next;
        else {
          break;
        }


      }

    }

    // 


  }



  CodeMirror["treeZipperInit"] = treeZipperInit;
  CodeMirror["treeZipperAdjustPosition"] = treeZipperAdjustPosition;
  CodeMirror["treeZipperAdjustPositionExclusive"] = treeZipperAdjustPositionExclusive;

  CodeMirror["treeZipperGetNode"] = () => currentTreeCursor ? currentTreeCursor.node : null;
  CodeMirror["treeZipperMoveNext"] = () => {
    if (currentTreeCursor.next)
      currentTreeCursor = currentTreeCursor.next
  };

  CodeMirror["treeZipperHasNext"] = () => currentTreeCursor.next ? true : false;


  CodeMirror["treeZipperAdjustPositionAndMoveUp"] = (startPos, endPos,expectedtype) => {
    if (currentTreeCursor.up) {
      if (_comparePos(currentTreeCursor.up.node.startPosition, startPos) == 0
        && _comparePos(currentTreeCursor.up.node.endPosition, endPos) == 0 &&
        currentTreeCursor.up.node.type==expectedtype) {
        currentTreeCursor = currentTreeCursor.up;
        return true;
      }

      return false;
    }
  }


});