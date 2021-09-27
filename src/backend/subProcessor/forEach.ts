import blockExecutor from './block';
import  evaluate  from '../evaluate';
import FNode from "../FNode";
import Environment, { createEnvironment, extendEnvironment } from '../environment'
import LineConsole from "../lineConsole";
import { processorType } from '../executer'




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

export default function* forEachProcessorFunction(tree: FNode, environment: Environment, lineConsole: LineConsole): processorType{

    let count = 0;
    let maxCount = 100;
    let identifierRef = tree.children[0].children[0].children[1].children[0];
    let expressionNode = tree.children[0].children[0].children[2];
    let endNode = tree.children[0].children[tree.children[0].children.length - 1];
    let elseBody = tree.children[0].children[2].type != "else_clause" ? null : tree.children[0].children[2].children[1]
    let body = tree.children[0].children[1];

    let result = yield* evaluate(expressionNode, environment);  
    
    let array = (result as Environment).getItem("internalData");
    let iter = array[Symbol.iterator]();

    do  {

        
        
        lineConsole.log(expressionNode.startPosition.row, ""+(result != false));
        lineConsole.log(endNode.startPosition.row, "");

        markBlockLiveStatus(body, "open");
        if (elseBody)
            markBlockLiveStatus(elseBody, "inactive-else");

        let iterOut = iter.next();
        if(iterOut.done)
            break;
        let local = extendEnvironment(environment);
        local.setItem(identifierRef.leafText,iterOut.value)

        yield* blockExecutor(body, local, lineConsole)

        count++;
    }while(true);



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


