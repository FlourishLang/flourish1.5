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
  "use strict";

  function treeSitterParseState(cm, options, hasGutter) {
    this.options = options;
    this.timeout = null;
    this.waitingFor = 0;
    this.lineConsole = {};

  }

  function parseOptions(_cm, opts) {
    if (opts === true) opts = {};
    if (opts.preventClosedEditing)
      opts.preventClosedEditing = true;
    if (opts.preventInactiveEditing)
      opts.preventInactiveEditing = true;

    return opts;

  }

  function calculateFullRange(changed, edited) {

    function editedFix(edited) {
      edited.endPosition.row = Math.min(edited.startPosition.row + 1, edited.endPosition.row);
      return edited;
    }

    let rangeArray = changed.slice();

    rangeArray.push(editedFix(edited));
    return rangeArray.reduce((accumelater, current) => {
      return {
        startPosition: { row: Math.min(accumelater.startPosition.row, current.startPosition.row) },
        endPosition: { row: Math.max(accumelater.endPosition.row, current.endPosition.row) },
      };
    })

  }





  function startTreeSitterParsing(cm) {
    if (!window.io) {
      console.error("Unable to get socket.io, failing");
      return;
    }

    var state = cm.state.treeSitterParse;

    window.onbeforeunload = () => {
      if (state && state.socket) {
        state.socket.disconnect();
      }
    };


    state.socket = io('http://localhost:3000',
      {
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: Infinity
      }
    );
    state.socket.on("disconnect", function () {
      // cm.setOption("mode", "text");
      cm.setOption("theme", "material");

    });
    state.socket.on('connect', function () {
      cm.setOption("theme", "default");
      cm.on("setActiveLine", function (linenumber) {
        state.socket.emit('setActiveLine', linenumber);
      });

      // let activeLine = 0;
      // let updatedActiveLine = false;
      // let timeoutForActiveline = null;
      // cm.on("beforeSelectionChange", function name(cm, sel) {
      //   if (sel.ranges[0].head.line == sel.ranges[0].anchor.line
      //     && sel.ranges[0].head.ch == sel.ranges[0].anchor.ch) {
      //       activeLine = sel.ranges[0].head.line;
      //       updatedActiveLine = true;
      //       // console.log('setActiveLine',sel.ranges[0].head.line);
      //     // state.socket.emit('setActiveLine',sel.ranges[0].head.line);
      //     timeoutForActiveline = setTimeout(() => {
      //       state.socket.emit('setActiveLine',activeLine);  
      //     }, 300);
      //   }
      //   // 
      // });



      state.socket.emit('parse', cm.getValue())
      state.socket.on('parseComplete', function (treeInfo) {

        // if (updatedActiveLine) {
        //   clearTimeout(timeoutForActiveline);
        //   state.socket.emit('setActiveLine',activeLine);  
        //   updatedActiveLine = false;
        // } 


        let treezipper = cm.Zipper(treeInfo.data);



        

        if (treeInfo.activeRange) {
          if (cm.showActiveBlock)
            cm.showActiveBlock(treeInfo.activeRange.startPosition.row, treeInfo.activeRange.endPosition.row)
        }

        if (cm.showChangesMark)
          cm.showChangesMark(treeInfo.changes);



          


        if (cm.getMode().hasOwnProperty("treeSitterTree") && cm.getMode().name!=="null")
          cm.state.treeSitterParse.liveStatusMarks = cm.getMode().getLiveStatusMarks(treezipper);
        cm.getMode().treeSitterTree = treeInfo.data;
        cm.getMode().treeSitterTreeZipper = treezipper;
        cm.getMode().treeSitterErrors = treeInfo.errors;
      


          if (treeInfo.lineConsole ) {

            cm.getMode().treeSitterTree.lineConsole = state.lineConsole;

            cm.showLineConsoleLog(treeInfo.lineConsole);

          }

        if (cm.showAfterErrorMark)
          cm.showAfterErrorMark(treeInfo.errors)



        if (cm.autoformatLines)
          cm.autoformatLines(treeInfo.changes, treeInfo.lineConsole, treeInfo.errors);



        cm.operation(function () {
          cm.performLint();

          if (treeInfo.changes) {

            let finalrange = calculateFullRange(treeInfo.changes.changedRange, treeInfo.changes.editedRange);
            cm.refreshPart(finalrange.startPosition.row, finalrange.endPosition.row);
          } else {
            cm.refreshPart();

          }
        })

        CodeMirror.signal(cm,"parseCompleteHandled");
      
      
      });

    });

  }

  function onChange(cm, change) {
    var state = cm.state.treeSitterParse;
    if (!state) return;

    if (cm.getMode().hasOwnProperty("treeSitterTree") && cm.getMode().treeSitterTree) {

      state.socket.emit('parseIncremental', { change });

    }

  }




  CodeMirror.defineOption("treeSitter", false, function (cm, val, old) {
    if (old && old != CodeMirror.Init) {
      clearMarks(cm);
      if (cm.state.treeSitterParse.options.treeSitterParseOnChange !== false)
        cm.off("change", onChange);
      clearTimeout(cm.state.treeSitterParse.timeout);

      delete cm.state.treeSitterParse;
    }

    if (val) {
      var state = cm.state.treeSitterParse = new treeSitterParseState(cm, parseOptions(cm, val), false);
      if (state.options.treeSitterParseOnChange !== false)
        cm.on("change", onChange);
      let mode = cm.getMode();

      if (state.options.preventClosedEditing || state.options.preventInactiveEditing) {
        cm.on("beforeChange", function (cm, change) {
          if (change.origin === "+indent" || change.origin === "complete")
            return;

          if (!mode.treeSitterTree)
            return;

          let errorMark = null;
          let isCanceled = false;

          if (cm.getAfterErrorMark) {
            errorMark = cm.getAfterErrorMark();
            if (errorMark) {
              let startLine = errorMark.startLine;
              if (change.from.line >= startLine) {
                change.cancel();
                isCanceled = false;
              }
            }

          }

          if (!isCanceled) {
            let ret = state.liveStatusMarks.find((mark) => mark.start <= change.from.line
              && mark.end >= change.to.line);
            if (ret)
              change.cancel();
          }










        });
      }

    }

  });

  CodeMirror.defineExtension("performTreeSitterParse", function () {
    if (this.state.treeSitterParse) startTreeSitterParsing(this);
  });

  CodeMirror.defineInitHook(function (cm) {
    cm.performTreeSitterParse();
  })

});