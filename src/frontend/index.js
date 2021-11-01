
import './css/doc/docs.css'
import './css/lib/codemirror.css'
import './css/theme/material.css'

import './css/custom.css'

import CodeMirror from './lib/codemirrorES6'



var editor = new CodeMirror(document.getElementById("code_left"), {
    lineNumbers: true,
    firstLineNumber: 0,
    mode: 'text/x-flourish',
    matchBrackets: true,
    //  theme:"material",
    treeSitter: { preventClosedEditing: true, preventInactiveEditing: true },
    anyKeyCompletion: true,
    lint: { lintOnChange: false },
    styleActiveLine: true,
    activeBlock: true,
    enableChangesMark: false,
    enableAfterErrorMark: true,
    autoCloseBrackets: true,
    autoFormat: true,
    gutters: ["CodeMirror-lint-markers", "activeBlock", "CodeMirror-linenumbers"]

});

var content = localStorage.getItem("edtordata");
if (content) {
    editor.setValue(content);
}



CodeMirror.commands.save = function (editorin) {
    if (editorin == editor)
        localStorage.setItem("edtordata", editor.getValue());
};

var editor2 = new CodeMirror(document.getElementById("code_right"), {
    lineNumbers: false,
    readOnly: true,
    matchBrackets: true,
    mode: 'text',
    syncOther: editor,
    autoScrollSync: editor

});

editor.setOption("lineConsole", editor2);
editor.setOption("extraKeys", {
    Tab: function (cm) {
        var spaces = Array(cm.getOption("indentUnit") + 1).join(" ");
        cm.replaceSelection(spaces);
    },
    'Ctrl-Space': function (cm) {
        CodeMirror.commands.autocomplete(cm);
    },
    }
});


import "./addon/edit/matchbrackets.js"
import "./addon/edit/closebrackets.js"
import "./addon/selection/active-line.js"

import "./addon/hint/show-hint.css"
import "./addon/hint/show-hint.js"

import "./addon/lint/lint.css"
import "./addon/lint/lint.js"

import "./addon/flourish/hint.js"
import "./addon/flourish/zipper.js"
import "./addon/flourish/treeSitterZipper.js"

import "./addon/flourish/flourishMode.js"
import "./addon/flourish/treeSitter.js"
import "./addon/flourish/lint.js"

import "./addon/flourish/anykeyComplete.js"
import "./addon/flourish/activeBlock.js"
import "./addon/flourish/autoformat.js"
import "./addon/flourish/autoscrollsync.js"
import "./addon/flourish/formatFlourish.js"
import "./addon/flourish/showChangesMark.js"

import "./addon/flourish/syncOther.js"