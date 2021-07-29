import blockExecutor from './block';
import  evaluate  from '../evaluate';
import LineConsole from "../lineConsole";
import FNode from "../FNode";
import Environment from '../enviroment'
import { executorType } from '../executer'




function markBlockLiveStatus(block: FNode, status: string) {
    block["liveStatus"] = status;
}



export default function* ifExecutorFunction(tree: FNode, environment: Environment, lineConsole: LineConsole): executorType {

    let expressionNode = tree.children[0].children[0].children[1];
    let endNode = tree.children[0].children[tree.children[0].children.length - 1]
    let result = yield* evaluate(expressionNode, environment);

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
            markBlockLiveStatus(body, "inactive-iflone");
        }

    }


}


