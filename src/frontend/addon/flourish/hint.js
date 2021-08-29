(function (mod) {
    if (typeof exports == "object" && typeof module == "object") // CommonJS
        mod(require("../../lib/codemirror"));
    else if (typeof define == "function" && define.amd) // AMD
        define(["../../lib/codemirror"], mod);
    else // Plain browser env
        mod(CodeMirror);
})(function (CodeMirror) {


    function getCompletionFragment(startIndex,lineContent) {
        let index = startIndex;
        let isFirstLoop = true;
        do {
            if (!isFirstLoop && lineContent[index] == ' '||lineContent[index] == '[') {
                index++;
                break;
            }

            isFirstLoop = false;
            index--

        } while (index > 0);
        let fragment = lineContent.substr(index, startIndex - index);
        return {index,fragment}
    }


    let keywordlist = ["let", "reset", "if", "print", "else", "retry","while","def","class","setThis"]
    keywordlist = keywordlist.map(i=>i+' ');

    function flourishHint(codemirror, options) {

        const cursor = codemirror.getCursor()
        const token = codemirror.getTokenAt(cursor)
        //const start = token.start
        const end = cursor.ch
        const line = cursor.line
        // const currentWord= token.string
        let lineContent = codemirror.getDoc().getLine(line);

        let {fragment,index} = getCompletionFragment(end,lineContent);
        let completionList = (token.type=="keyword")?keywordlist:[];

        return {
            list: completionList.filter(s => s.startsWith(fragment)),
            from: CodeMirror.Pos(line, index),
            to: CodeMirror.Pos(line, cursor.ch)
        }




        // let isOnmark = codemirror.state.treeSitterParse.liveStatusMarks.find((mark) => mark.start <= line
        //     && mark.end >= line);
        // if (isOnmark && isOnmark.status === "inactive-ifLone") {
        //     let data = {
        //         list: [{ text: "else:\n  code", displayText: "else:\n  code" }],
        //         from: CodeMirror.Pos(isOnmark.end - 1, 0),
        //         to: CodeMirror.Pos(isOnmark.end - 1, 0)
        //     };

        //     CodeMirror.on(data, "pick", function () {
        //         // codemirror.setCursor({ line: line + 1, ch: 0 })

        //         codemirror.operation(function () {
        //             codemirror.indentLines(isOnmark.end - 1, 2, -2);

        //         })

        //     });
        //     return data;

        // }
        // else if (lineContent.endsWith("if")) {
        //     let data = {
        //         list: [{ text: "if condition:\n  code\nend", displayText: "if condition:\n  code\nend" }],
        //         from: CodeMirror.Pos(line, 0),
        //         to: CodeMirror.Pos(line, lineContent.length)
        //     };

        //     CodeMirror.on(data, "pick", function () {
        //         codemirror.setCursor({ line: line + 1, ch: 0 })

        //         codemirror.operation(function () {
        //             codemirror.indentLines(line, 3);

        //         })



        //     });
        //     return data;
        // }

        return {
            list: [],
            from: CodeMirror.Pos(line, start),
            to: CodeMirror.Pos(line, end)
        };
    }

    CodeMirror.registerHelper("hint", "flourish", flourishHint);


});