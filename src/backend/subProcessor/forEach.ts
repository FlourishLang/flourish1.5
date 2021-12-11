import blockExecutor from './block';
import evaluate from '../evaluate';
import {ERROR} from '../evaluate';
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

export default function* forEachProcessorFunction(tree: FNode, environment: Environment, lineConsole: LineConsole): processorType {

    let count = 0;
    let maxCount = 100;
    let identifierRef: FNode = null;
    let expressionNode: FNode = null;
    let keyNode: FNode = null;
    if (tree.children[0].children[0].children.length == 4) {
        identifierRef = tree.children[0].children[0].children[1].children[0];
        if (identifierRef.leafText == "forValue") {
            let err = ERROR.fromAst(identifierRef, `placeholder  <forValue> need to updated`);
            err.suggestions.alternatives = ["elt"];      
            throw   err    
        }
        
        expressionNode = tree.children[0].children[0].children[2];
    }else if(tree.children[0].children[0].children.length == 5){



        keyNode =  tree.children[0].children[0].children[1].children[0];
        identifierRef = tree.children[0].children[0].children[2].children[0];        
        expressionNode = tree.children[0].children[0].children[3];



        if (keyNode.leafText == "forIndex") {
            let err = ERROR.fromAst(keyNode, `placeholder  <forIndex> need to updated`);
            err.suggestions.alternatives = ["k"];      
            throw   err    
        }

        if (identifierRef.leafText == "forValue") {
            let err = ERROR.fromAst(identifierRef, `placeholder  <forValue> need to updated`);
            err.suggestions.alternatives = ["v"];      
            throw   err    
        }


    }
    let endNode = tree.children[0].children[tree.children[0].children.length - 1];
    let elseBody = tree.children[0].children[2].type != "else_clause" ? null : tree.children[0].children[2].children[1]
    let body = tree.children[0].children[1];

    let result = yield* evaluate(expressionNode, environment);

    let array = (result as Environment).getItem("__internalData");
    let iter = array[Symbol.iterator]();


    do {



        lineConsole.log(expressionNode.startPosition.row, "" + (result != false));
        lineConsole.log(endNode.startPosition.row, "");

        markBlockLiveStatus(body, "open");
        if (elseBody)
            markBlockLiveStatus(elseBody, "inactive-else");

        let iterOut = iter.next();
        if (iterOut.done)
            break;
        let local = extendEnvironment(environment);
        local.setItem(identifierRef.leafText, iterOut.value)
        if(keyNode)
            local.setItem(keyNode.leafText, count)

        yield* blockExecutor(body, local, lineConsole)

        count++;
    } while (true);



    if (count == 0) {
        lineConsole.log(expressionNode.startPosition.row, "" + false);


        if (elseBody) {
            markBlockLiveStatus(body, "inactive-while");
            markBlockLiveStatus(elseBody, "open");

            yield* blockExecutor(elseBody, environment, lineConsole)
        } else {
            markBlockLiveStatus(body, "inactive-whileLone");
        }

    }


}


