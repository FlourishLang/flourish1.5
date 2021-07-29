import blockExecutor from './block';
import evaluate, { specialEnv, ERROR } from '../evaluate';
import Environment, { extendEnvironment } from '../enviroment';
import FNode from '../FNode';
import LineConsole from '../lineConsole';

import { executorType } from '../executer'


function markBlockLiveStatus(block: FNode, status: string) {
    block["liveStatus"] = status;
}




// function closureBlock(body, parameters, enviornment) {
//     this.body = body;
//     this.parameters = parameters;
//     this.enviornment = enviornment;
// }

function createClosure(body: FNode, parameters: FNode, enviornment: Environment, lineConsole: LineConsole) {
    return function* name(argumentsArray: any[]) {
        let paramEnvironment = extendEnvironment(enviornment); //Every new try creates a new enviornment
        if (argumentsArray.length != parameters.children.length)
            throw Error(`Mismatching arguments count - expected ${parameters.children.length} recieved ${argumentsArray.length}`);

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


export default function* fnDefExecutorFunction(tree: FNode, environment: Environment, lineConsole: LineConsole):executorType {

    let outerEnvironment = environment;
    let paramEnvironment = extendEnvironment(environment); //Every new try creates a new enviornment
    paramEnvironment.setItem("___RETURN___", null);

    let identifierRef = tree.children[0].children[0].children[2];
    let endNode = tree.children[0].children[tree.children[0].children.length - 1];
    let body = tree.children[0].children[1];
    let paramters = tree.children[0].children[0].children[3];
    for (let index = 0; index < paramters.children.length; index++) {
        const element = paramters.children[index];
        let paramName = element;
        let argumentExpression = element.children[2].children[0];
        let result = yield* specialEnv.let.call(paramEnvironment, [paramName, argumentExpression], paramEnvironment);

    }
    lineConsole.log(endNode.startPosition.row, "");


    yield* blockExecutor(body, paramEnvironment, lineConsole);


    yield* specialEnv.let.call(outerEnvironment, [{ children: [identifierRef] }, { type: "number", leafText: "0" }], outerEnvironment);

    outerEnvironment.setItem(identifierRef.leafText, createClosure(body, paramters, outerEnvironment, lineConsole));


}


