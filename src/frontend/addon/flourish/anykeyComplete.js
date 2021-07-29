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

    CodeMirror.defineOption("anyKeyCompletion", false, function (cm, val, old) {

        cm.state.completionWaitforParsingSequece = 0;
        function popupCompletion() {
            cm.state.completionWaitforParsingSequece--
            if (cm.state.completionWaitforParsingSequece == 0) {
                CodeMirror.commands.autocomplete(cm);
            }


        }

        cm.on("parseCompleteHandled", popupCompletion)

        cm.on("inputRead", function (cm, changeObj) {

            if (cm.state.completionWaitforParsingSequece < 0) {
                cm.state.completionWaitforParsingSequece = 0;
            }
            cm.state.completionWaitforParsingSequece++;

            if (cm.state.completionActive) {
                return;
            }





        })



    })




})