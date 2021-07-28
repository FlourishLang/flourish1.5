
import './css/doc/docs.css'
import './css/lib/codemirror.css'
import './css/theme/material.css'


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
    }
});


import "./addon/edit/matchbrackets.js"