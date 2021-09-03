import FNode from '../FNode';
import LineConsole from '../lineConsole';
import blockExecutor from './block';
import { specialEnv } from '../evaluate';
import Environment, { extendEnvironment, createEmptyEnvironment } from '../environment';

import { processorType } from '../executer'


function markBlockLiveStatus(block: FNode, status: string) {
    block["liveStatus"] = status;
}




// function closureBlock(body, parameters, environment) {
//     this.body = body;
//     this.parameters = parameters;
//     this.environment = environment;
// }

let constructReferenceMap = new WeakMap<any, any>();

function createConstructor(body: FNode, parameters: FNode, environment: Environment, lineConsole: LineConsole) {

    let referenceObject = environment.getItem("___THIS___");
    return function* classConstructor(argumentsArray: any[]) {
        let paramEnvironment = extendEnvironment(environment); //Every new try creates a new environment
        paramEnvironment.setItem("___THIS___", extendEnvironment(referenceObject));
        if (argumentsArray.length != parameters.children.length)
            throw Error(`Mismatching arguments count - expected ${parameters.children.length} received ${argumentsArray.length}`);

        for (let index = 0; index < parameters.children.length; index++) {
            const element = parameters.children[index];
            let paramName = element.children[0].leafText;
            let result = paramEnvironment.setItem(paramName, argumentsArray[index]);
        }

        paramEnvironment.setItem("___RETURN___", null);


        yield* blockExecutor(body, paramEnvironment, lineConsole);

        return paramEnvironment.getItem("___THIS___");

    }
}


export default function* classDefProcessorFunction(tree: FNode, environment: Environment, lineConsole: LineConsole): processorType {

    let outerEnvironment = environment;
    let paramEnvironment = extendEnvironment(environment); //Every new try creates a new environment
    paramEnvironment.setItem("___RETURN___", null);
    paramEnvironment.setItem("___THIS___", createEmptyEnvironment());

    let identifierRef = tree.children[0].children[0].children[2];
    let endNode = tree.children[0].children[tree.children[0].children.length - 1];
    let body = tree.children[0].children[1];
    let parameter = tree.children[0].children[0].children[3];

    for (let index = 0; index < parameter.children.length; index++) {
        const element = parameter.children[index];
        let paramName = element;
        let argumentExpression = element.children[2].children[0];
        let result = yield* specialEnv.let.call(paramEnvironment, [paramName, argumentExpression], paramEnvironment);
    }

    lineConsole.log(endNode.startPosition.row, "");
    yield* blockExecutor(body, paramEnvironment, lineConsole);
    yield* specialEnv.let.call(outerEnvironment, [{ children: [identifierRef] }, { type: "number", leafText: "0" }], outerEnvironment);
    let objectConstructor = createConstructor(body, parameter, paramEnvironment, lineConsole);
    constructReferenceMap.set(objectConstructor, paramEnvironment.getItem("___THIS___"));
    outerEnvironment.setItem(identifierRef.leafText, objectConstructor);
}



function getAttributeBase(list: FNode[]) {
    let end = list[list.length - 1];
    let start: FNode;

    if (list.length <= 3) { start = list[0]; }
    else {
        throw "Not yet handled nested method def";
    }

    return { start, end };

}



function createMethod(body: FNode, parameters: FNode, environment: Environment, lineConsole: LineConsole) {
    return function* method(argumentsArray: any[], outerEnvironment: Environment, callerNode: FNode) {

        let attributeListRef = callerNode.children[0];
        let { start: objectIdentifier, end: identifierRef } = getAttributeBase(attributeListRef.children);

        let paramEnvironment = extendEnvironment(outerEnvironment); //Every new try creates a new environment
        let thisEnvironment = outerEnvironment.getItem(objectIdentifier.leafText);
        paramEnvironment.setItem("___THIS___", thisEnvironment);
        paramEnvironment.setItem("this", thisEnvironment);

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


export function* methodDefProcessorFunction(tree: FNode, environment: Environment, lineConsole: LineConsole): processorType {

    let outerEnvironment = environment;
    let paramEnvironment = extendEnvironment(environment); //Every new try creates a new environment
    paramEnvironment.setItem("___RETURN___", null);


    let attributeListRef = tree.children[0].children[0].children[2];
    let { start: objectIdentifier, end: identifierRef } = getAttributeBase(attributeListRef.children);

    let objectConstructor = environment.getItem(objectIdentifier.leafText)
    let thisEnvironment = constructReferenceMap.get(objectConstructor);
    paramEnvironment.setItem("___THIS___", thisEnvironment);
    paramEnvironment.setItem("this", thisEnvironment);
    let endNode = tree.children[0].children[tree.children[0].children.length - 1];
    let body = tree.children[0].children[1];
    let parameter = tree.children[0].children[0].children[3];

    for (let index = 0; index < parameter.children.length; index++) {
        const element = parameter.children[index];
        let paramName = element;
        let argumentExpression = element.children[2].children[0];
        let result = yield* specialEnv.let.call(paramEnvironment, [paramName, argumentExpression], paramEnvironment);
    }

    lineConsole.log(endNode.startPosition.row, "");
    yield* blockExecutor(body, paramEnvironment, lineConsole);
    // yield* specialEnv.let.call(thisEnvironment, [{ children: [identifierRef] }, { type: "number", leafText: "0" }], outerEnvironment);
    thisEnvironment.setItem(identifierRef.leafText, createMethod(body, parameter, paramEnvironment, lineConsole));

}




