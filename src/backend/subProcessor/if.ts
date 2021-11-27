import blockExecutor from './block';
import evaluate, { ERROR } from '../evaluate';
import LineConsole from "../lineConsole";
import FNode from "../FNode";
import Environment from '../environment'
import { processorType } from '../executer'




function markBlockLiveStatus(block: FNode, status: string) {
    block["liveStatus"] = status;
}



export default function* ifProcessorFunction(tree: FNode, environment: Environment, lineConsole: LineConsole): processorType {

    let expressionNode = tree.children[0].children[0].children[1];
    let endNode = tree.children[0].children[tree.children[0].children.length - 1]

    let result = null;
    try {
        result = yield* evaluate(expressionNode, environment);
    } catch (error) {
        if (error.message == "Can't find identifier: condition") {
            let innerError = error as ERROR;
            innerError.message = "Update the placeholder <condition>"
            innerError.placeholder = true;
            innerError.suggestions.alternatives = ["left = right"]

            throw innerError;
        }
        throw error;



    }


    lineConsole.log(expressionNode.startPosition.row, "" + (result != false));
    lineConsole.log(endNode.startPosition.row, "");

    let elseBody = tree.children[0].children[2].type != "else_clause" ? null : tree.children[0].children[2].children[1]

    if (elseBody)
        lineConsole.log(tree.children[0].children[2].startPosition.row, "");

    let body = tree.children[0].children[1];
    if (result != false) {
        markBlockLiveStatus(body, "open");
        yield* blockExecutor(body, environment, lineConsole);
        if (elseBody)
            markBlockLiveStatus(elseBody, "inactive-else");
    } else {


        if (elseBody) {
            markBlockLiveStatus(body, "inactive-if");
            markBlockLiveStatus(elseBody, "open");

            yield* blockExecutor(elseBody, environment, lineConsole)
        } else {
            markBlockLiveStatus(body, "inactive-ifLone");
        }

    }


}


