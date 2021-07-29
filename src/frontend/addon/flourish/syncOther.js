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

    CodeMirror.defineOption("syncOther", false, function (cm, val, old) {

        function multch(ch, count) {
            let str = "";
            for (let index = 0; index < count; index++) {
                str = str + ch;
            }
            return str;
        }

        if (val) {
            let otherEditor = val;
            let linediff = otherEditor.lineCount() - cm.lineCount();
            if (linediff > 0) {
                cm.replaceRange(multch('\n', linediff), CodeMirror.Pos(otherEditor.lineCount() - 1, 0));
            }
            otherEditor.on("change", function name(params) {
                let linediff = otherEditor.lineCount() - cm.lineCount();
                if (linediff > 0) {
                    cm.replaceRange(multch('\n', linediff), CodeMirror.Pos(otherEditor.lineCount() - 1, 0), CodeMirror.Pos(otherEditor.lineCount() - 1));
                }

                if (linediff < 0) {
                    cm.replaceRange("", CodeMirror.Pos(cm.lineCount() - 1 + linediff), CodeMirror.Pos(cm.lineCount() - 1));
                }


            })


        }


    })

    CodeMirror.defineOption("lineConsole", false, function (cm, val, old) {


        if (val) {

            let otherEditor = val;
            CodeMirror.defineExtension("showLineConsoleLog", function (linedata) {
                for (const key in linedata) {
                    if (Object.hasOwnProperty.call(linedata, key)) {
                        const element = linedata[key];
                        if (parseInt(key) < otherEditor.lineCount())
                            otherEditor.replaceRange("" + element.message, CodeMirror.Pos(parseInt(key), 0), CodeMirror.Pos(parseInt(key)));
                    }
                }
            })




        }


    })



});