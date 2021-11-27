
import { ERROR, specialEnv } from "./evaluate";
import Environment, { listEnvironmentBelowTop } from './environment'
import FNode from "./FNode";



function hasSuggestionEmbedded(err: ERROR): boolean {
    return err?.suggestions?.alternatives.length > 1
}


function getSuggestionForPlaceHolderStatement(key: string) {


    let suggestions = [{
        displayText: "[if]",
        text: `
if (condition) :
  statement
end`,
        key: 'if'
    },
    {
        displayText: "[ifElse]",
        text: `
if (condition) :
  statement
else:
  statement
end`,
        key: 'ife'
    },
    {
        displayText: "[let]",
        text: 'let anIdentifier value',
        key: 'let'
    },
    {
        displayText: "[reset]",
        text: 'reset anIdentifier value',
        key: 'reset'
    },
    {
        displayText: "[print]",
        text: 'print argument',
        key: 'print'
    },{
        displayText: "[import]",
        text: 'import aPackage',
        key: 'import'
    },
    {
        displayText: "[defPackage]",
        text: 'defPackage aPackage',
        key: 'defPackage'
    }
    ];


    suggestions.forEach(i => {
        if (i.text.startsWith('\n')) {
            i.text = i.text.slice(1);
        }
    });

    return suggestions

}


export function suggestFixForError(err: ERROR, env: Environment, mayBeStatement: FNode) {

    if (hasSuggestionEmbedded(err)) // No further suggestion is needed.
        return err;


    if (err.message == "Cannot find command : statement") {
        err.placeholder = true;
        err.message = "Update the placeholder  <statement>"
        err.suggestions.alternatives = getSuggestionForPlaceHolderStatement("");
        return err;
    }


    if (err.message?.startsWith('Cannot find command')) {
        err.suggestions.alternatives = getSuggestionForPlaceHolderStatement("");
        return err;
    }

    if (err.message?.startsWith("Can't find identifier")||
    err.message?.startsWith("Undefined  identifier:")) {
        let list = listEnvironmentBelowTop(env).filter(i => !i.startsWith('_'));
        let suggestionObjects = list.map(i => ({
            displayText: `${i}`,
            text: `${i} `,
            key: null
        }))

        err.suggestions.alternatives = suggestionObjects;
        return err;
    }




    // err.message?.startsWith('Cannot find')



    //     if ( err.message?.startsWith('Cannot find') || err.message?.startsWith("Can't find identifier")) {

    //         if (err.message == "Cannot find command : statement") {
    //             err.placeholder = true;
    //             return err;
    //         }

    //         let list = Object.keys(specialEnv).concat(listEnvironment(env).concat(['if', 'def', 'class']))
    //         let identifier = err.message.substr(err.message.search(":") + 2)
    //         let suggestion = list.filter(i => i.startsWith(identifier));
    //         let suggestionObject = suggestion.map(i => ({
    //             displayText: `${i}`,
    //             text: `${i} `,
    //             key: null
    //         }))

    //         suggestionObject.push({
    //             displayText: "[if]",
    //             text:
    //                 `if (condition) :
    //   statement
    // end `,
    //             key: 'if'
    //         })

    //         //@ts-ignore
    //         err.suggestions.alternatives = suggestionObject;
    //         err.suggestions.keyword = identifier;
    //     }

    return err;

}


