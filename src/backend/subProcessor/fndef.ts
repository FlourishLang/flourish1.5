import FNode from '../FNode';
import LineConsole from '../lineConsole';
import blockExecutor from './block';
import  { specialEnv } from '../evaluate';
import Environment, { extendEnvironment } from '../environment';

import { processorType } from '../executer'


function markBlockLiveStatus(block: FNode, status: string) {
    block["liveStatus"] = status;
}




// function closureBlock(body, parameters, environment) {
//     this.body = body;
//     this.parameters = parameters;
//     this.environment = environment;
// }

function createClosure(body: FNode, parameters: FNode, environment: Environment, lineConsole: LineConsole) {
    return function* name(argumentsArray: any[]) {
        let paramEnvironment = extendEnvironment(environment); //Every new try creates a new environment
        if (argumentsArray.length != parameters.children.length)
            throw Error(`Mismatching arguments count - expected ${parameters.children.length} received ${argumentsArray.length}`);

        for (let index = 0; index < parameters.children.length; index++) {
            const element = parameters.children[index];
            let paramName = element.children[0].leafText;
            let result = paramEnvironment.setItem(paramName, argumentsArray[index]);
        }

        paramEnvironment.setItem("___RETURN___", null);


         yield* blockExecutor(body, paramEnvironment, lineConsole);

        return paramEnvironment.getItem("___RETURN___");

    }
}


export default function* fnDefProcessorFunction(tree: FNode, environment: Environment, lineConsole: LineConsole):processorType {

    let outerEnvironment = environment;
    let paramEnvironment = extendEnvironment(environment); //Every new try creates a new environment
    paramEnvironment.setItem("___RETURN___", null);

    let identifierRef = tree.children[0].children[0].children[2];
    let endNode = tree.children[0].children[tree.children[0].children.length - 1];
    let body = tree.children[0].children[1];
    let paramter = tree.children[0].children[0].children[3];
    
    for (let index = 0; index < paramter.children.length; index++) {
        const element = paramter.children[index];
        let paramName = element;
        let argumentExpression = element.children[2].children[0];
        let result = yield* specialEnv.let.call(paramEnvironment, [paramName, argumentExpression], paramEnvironment);
    }
    
    lineConsole.log(endNode.startPosition.row, "");
    yield* blockExecutor(body, paramEnvironment, lineConsole);
    yield* specialEnv.let.call(outerEnvironment, [{ children: [identifierRef] }, { type: "number", leafText: "0" }], outerEnvironment);

    outerEnvironment.setItem(identifierRef.leafText, createClosure(body, paramter, outerEnvironment, lineConsole));
}


