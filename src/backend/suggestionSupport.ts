
import { ERROR, specialEnv } from "./evaluate";
import Environment, { listEnvironmentBelowTop } from './environment'
import FNode from "./FNode";



function hasSuggestionEmbedded(err: ERROR): boolean {
    return err?.suggestions?.alternatives.length > 1
}


function getSuggestionForPlaceHolderStatement(env: Environment, key: string) {


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
    }, {
        displayText: "[import]",
        text: 'import aPackage',
        key: 'import'
    },
    {
        displayText: "return",
        text: 'return ',
        key: 'return'
    },
    {
        displayText: "this",
        text: 'this ',
        key: 'this'
    },
    {
        displayText: "setThis",
        key: 'setThis',
        text: 'setThis ',
    },
    {
        displayText: "[while loop]",
        text: `
while (aCondition):
  statement
end`,
        key: 'while'
    },
    {
        displayText: "[forEach loop]",
        text: `
forEach forIndex forValue iter:
  statement
end`,
        key: 'forEach'
    },
    {
        displayText: "[define function]",
        text: `
def [ anIdentifier anArgument : aValue ] :
  statement
end`,
        key: 'defPackage'
    }, {
        displayText: "[defPackage]",
        text: 'defPackage aPackage',
        key: 'defPackage'
    },
    {
        displayText: "[class]",
        text: `
class [ aClassName anArgument:value ] :
  setThis aProperty anArgument
end
`,
        key: 'class'
    },
    {
        displayText: "[defMethod]",
        text: `
defMethod [ aClassName . aMethodName anArgument : value ] :
    print this.aProperty
end
      
`,
        key: 'defMethod'
    },



    ];


    suggestions.forEach(i => {
        if (i.text.startsWith('\n')) {
            i.text = i.text.slice(1);
        }
    });

    let list = getEnvironmentStatementSuggestion(env, key);
    return list.concat(suggestions);

}


function getEnvironmentStatementSuggestion(env: Environment, keyword: string = "") {
    return getAllIdentifier(env, keyword);
}


function getAllIdentifier(env: Environment, keyword: string = "") {
    let list = listEnvironmentBelowTop(env).filter(i => !i.startsWith('_'));
    let suggestionObjects = list.map(i => ({
        displayText: `${i}`,
        text: `${i} `,
        key: null
    }))

    if (keyword != "") {
        return suggestionObjects.filter(i => i.text.startsWith(keyword))
    } else {
        return suggestionObjects;
    }


}


export function throwPlaceHolder(fNode: FNode, placeholder: string = "anIdentifier") {

    if (fNode.leafText == placeholder) {
        let err = ERROR.fromAst(fNode, `placeholder  <${fNode.leafText}> need to updated`)
        throw err;
    }

}

export function suggestFixForError(err: ERROR, env: Environment, mayBeStatement: FNode) {

    if (hasSuggestionEmbedded(err)) // No further suggestion is needed.
        return err;


    if (err.message == "Cannot find command : statement") {
        err.placeholder = true;
        err.message = "Update the placeholder  <statement>"
        err.suggestions.alternatives = getSuggestionForPlaceHolderStatement(env, "");
        return err;
    }


    if (err.message?.startsWith('Cannot find command')) {
        err.suggestions.alternatives = getSuggestionForPlaceHolderStatement(env, err.suggestions.keyword);
        return err;
    }

    if (err.message?.startsWith("Can't find identifier") ||
        err.message?.startsWith("Undefined  identifier:")) {
        err.suggestions.alternatives = getAllIdentifier(env);
        return err;
    }

    if (err.message?.startsWith("Can't find identifier") ||
        err.message?.startsWith("Undefined  identifier:")) {
        err.suggestions.alternatives = getAllIdentifier(env);
        return err;
    }
    if (err.message?.startsWith("Syntax error missing identifier")) {
        if (err.suggestions.keyword.endsWith('.'))
            err.suggestions.alternatives = [err.suggestions.keyword + 'aProperty']
        return err;
    }





    return err;

}


