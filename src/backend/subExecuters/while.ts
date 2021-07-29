import blockExecutor from './block';
import  evaluate  from '../evaluate';
import FNode from "../FNode";
import Environment from '../environment'
import LineConsole from "../lineConsole";
import { executorType } from '../executer'




function markBlockLiveStatus(block: FNode, status: string) {
    block["liveStatus"] = status;
}

// function testBlockLiveStatus(block, status) {
//     let statusExist = block["liveStatus"];
//     if (statusExist == status) {
//         return true;
//     }
//     if (!statusExist && status == "")
//         return true;

//     return false;
// }

export default function* whileExecutorFunction(tree: FNode, environment: Environment, lineConsole: LineConsole): executorType{

    let count = 0;
    let maxCount = 100;
    let expressionNode = tree.children[0].children[0].children[1];
    let endNode = tree.children[0].children[tree.children[0].children.length - 1];
    let elseBody = tree.children[0].children[2].type != "else_clause" ? null : tree.children[0].children[2].children[1]
    let body = tree.children[0].children[1];

    while (count < maxCount) {

        let result = yield* evaluate(expressionNode, environment);        
        if (!(result != false))
            break;
        lineConsole.log(expressionNode.startPosition.row, ""+(result != false));
        lineConsole.log(endNode.startPosition.row, "");

        markBlockLiveStatus(body, "open");
        if (elseBody)
            markBlockLiveStatus(elseBody, "inactive-else");

        yield* blockExecutor(body, environment, lineConsole)

        count++;
    }



    if (count == 0) {
        lineConsole.log(expressionNode.startPosition.row, ""+false);


        if (elseBody) {
            markBlockLiveStatus(body, "inactive-while");
            markBlockLiveStatus(elseBody, "open");

            yield* blockExecutor(elseBody, environment, lineConsole)
        } else {
            markBlockLiveStatus(body, "inactive-whileLone");
        }

    }


}


