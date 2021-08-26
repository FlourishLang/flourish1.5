// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/LICENSE

(function (mod) {
  if (typeof exports == "object" && typeof module == "object") // CommonJS
    mod(require("../../lib/codemirror"));
  else if (typeof define == "function" && define.amd) // AMD
    define(["../../lib/codemirror"], mod);
  else // Plain browser env
    mod(CodeMirror);
})(function (CodeMirror) {
  "use strict";







  /* This is the quick and dirty way of adding treesitter support codemirror. 
  The goal for now is only for get the system working; no efforts for optimisation being 
  done here.
  */



  let isStart =false;


  function _comparePos(pos1, pos2) {
    if (pos1.row != pos2.row)
      return pos1.row - pos2.row;

    return pos1.column - pos2.column;

  }



  function getTreeToken(treeZipper, startPos, endPos, state) {

    

    isStart = CodeMirror.treeZipperInit(treeZipper);
    // move backword
    if(endPos && startPos){
      CodeMirror.treeZipperAdjustPosition(startPos, endPos)
    }




    do {
      let tree = CodeMirror.treeZipperGetNode();
      if(!tree)
        break;
      let type = tree.type;


      if (endPos && _comparePos(tree.startPosition, endPos) > 0) {
        return undefined;
      }


      if (endPos && state.specialBlockblockInfo) {
        if (_comparePos(state.specialBlockblockInfo.endPosition, endPos) >= 0) {
          return {
            type: state.specialBlockblockInfo.type, end: endPos,
            specialBlockblockInfo: state.specialBlockblockInfo
          };
        }
      }

      type = tree.isMissingNode ? "MissingNodeERROR" : type;


      switch (type) {
        case "block":
          if (tree.liveStatus && tree.liveStatus.startsWith("closed")) {
            CodeMirror.treeZipperMoveNext();
            return {
              type: "closed", end: endPos,
              specialBlockblockInfo: { type: "closed", endPosition: tree.endPosition }
            };
          } else if (tree.liveStatus && tree.liveStatus.startsWith("inactive")) {
            CodeMirror.treeZipperMoveNext();
            return {
              type: "inactive", end: endPos,
              specialBlockblockInfo: { type: "inactive", endPosition: tree.endPosition }
            };
          } {
            CodeMirror.treeZipperMoveNext();

          }
          break;

        case "end":
        case "def":
        case "class":
        case "if":case "while":case "else":
        case ":":
          CodeMirror.treeZipperMoveNext();
          return { type: "keyword", end: tree.endPosition };
        case "cmd":
          CodeMirror.treeZipperMoveNext();
          return { type: "keyword", end: tree.endPosition };

        case "identifier":
          if(CodeMirror.treeZipperAdjustPositionAndMoveUp(tree.startPosition, tree.endPosition,"cmd"))
            break;

          CodeMirror.treeZipperMoveNext();
          return { type: "variable", end: tree.endPosition };

        case "[": case "]":case "(": case ")":
          CodeMirror.treeZipperMoveNext();
          return { type: "bracket", end: tree.endPosition };

        case "string":
          CodeMirror.treeZipperMoveNext();
          return { type: "string", end: tree.endPosition };

        case "number":
          CodeMirror.treeZipperMoveNext();
          return { type: "number", end: tree.endPosition };

        case "emptylines":
          CodeMirror.treeZipperMoveNext();
          return { type: "emptylines", end: tree.endPosition };

        case "ERROR":
          CodeMirror.treeZipperMoveNext();
          return { type: "error", end: tree.endPosition };

        case "MissingNodeERROR":
          CodeMirror.treeZipperMoveNext();
          break;


        default:
          CodeMirror.treeZipperMoveNext();

          break;
      }

    }while(CodeMirror.treeZipperHasNext())




  }








  CodeMirror.defineMode("flourish", function (config) {

    let flourishMode = {

      getLiveStatusMarks: function (treeCursor) {
        let root = treeCursor;
        let marksOut = [];
        let current = root;

        while (current) {
          if (current.node.type == "block" && current.node.liveStatus &&
            (current.node.liveStatus.startsWith("closed") || current.node.liveStatus.startsWith("inactive"))) {
            marksOut.push({ start: current.node.startPosition.row, end: current.node.endPosition.row, status: current.node.liveStatus })
            current = current.right;
          } else {
            current = current.next;
          }

        }

        return marksOut;

      },
      blankLine: function (state) {
        let res = getTreeToken(this.treeSitterTreeZipper,
          null, null
          , state)
        if (res) {
          state.specialBlockblockInfo = res.specialBlockblockInfo;
        }

      },


      token: function (stream, state) {

        if (this.treeSitterTree == null) { //Not ready skip
          stream.next();
          return null;
        }
        else {
          let res = getTreeToken(this.treeSitterTreeZipper,
            { column: stream.pos, row: stream.lineOracle.line }, { column: stream.string.length, row: stream.lineOracle.line }
            , state)


          if (res !== undefined) {
            // console.log("res",res.type);

            state.specialBlockblockInfo = res.specialBlockblockInfo;


            if (stream.lineOracle.line == res.end.row) {
              while (stream.pos < res.end.column) {
                stream.next();
                if (stream.eol())
                  break;
              }

              if(stream.pos == stream.start &&stream.string.length>stream.pos)
                stream.skipToEnd();



            } else {
              stream.skipToEnd();
            }

            return res.type;
          }
          stream.next();
          return null;

        }


      },
      startState: function () {
        return {
          tree: this.treeSitterTree,
          specialBlockblockInfo: null

        };
      },
      getFormatedLine: function name(linenum, column) {
        return getFormatedLineHelper(this.treeSitterTreeZipper, linenum)
        
      },


      treeSitterTree: null,
      treeSitterErrors: null,
      treeSitterTreeZipper: null,
      treeSitterErrors: null,

      closeBrackets: { pairs: "[]\"\"()" },
      // lineComment: ";;",
      // blockCommentStart: "#|",
      // blockCommentEnd: "|#",




    };


    return flourishMode;

  });



  CodeMirror.defineMIME("text/x-flourish", "flourish");



});
