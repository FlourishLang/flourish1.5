
const CodeMirror = require("../../lib/codemirror");
/**
 * Gets component of line that needs the suggestion
 * @param {number} startIndex 
 * @param {string} lineContent 
 * @returns suggestion component
 */
function getCompletionFragment(startIndex, lineContent) {
    let index = startIndex;
    let isFirstLoop = true;
    do {
        if (!isFirstLoop && lineContent[index] == ' ' || lineContent[index] == '['||lineContent[index] == '(') {
            index++;
            break;
        }

        isFirstLoop = false;
        index--

    } while (index > 0);
    let fragment = lineContent.substr(index, startIndex - index);
    return { index, fragment }
}




function flourishHint(codemirror, options) {


    let errors = codemirror.getMode().treeSitterErrors;
    const cursor = codemirror.getCursor()
    // const token = codemirror.getTokenAt(cursor)
    //const start = token.start
    const end = cursor.ch
    const line = cursor.line
    let lineContent = codemirror.getDoc().getLine(line);

    let { fragment, index } = getCompletionFragment(end, lineContent);


    function convertSimpleSuggestionToSmartSuggestion(completionList){
        if (typeof (completionList[0]) == 'string') {

            completionList = completionList.map(i => ({
                displayText: i,
                key: null,
                text: `${i} `
            }))
        }

        return completionList;
    }



    let completionList = [];
    if (errors && errors.length) {
        console.log(errors[0], fragment)

        let error1 = errors[0];
        if (error1.suggestions.alternatives.length && error1.suggestions.keyword == fragment) {
            completionList = convertSimpleSuggestionToSmartSuggestion(error1.suggestions.alternatives);
        }
    }



    filterCompletion = ()=>{
        let filtered = completionList.filter(s => s.key ? s.key.startsWith(fragment) : s.text.startsWith(fragment))
        if (filtered.length == 0) // return all the alternative in case none matching 
            return completionList;
        else
            return filtered;
            
    }




    let data = {
        list: filterCompletion(),
        from: CodeMirror.Pos(line, index),
        to: CodeMirror.Pos(line, cursor.ch)
    };

    CodeMirror.on(data, "pick", function (a) {
        if (a.text.includes('\n')) {
            codemirror.indentLines(line, a.text.split('\n').length);
        }
    });
    return data;

}

CodeMirror.registerHelper("hint", "flourish", flourishHint);

