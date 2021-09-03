import LineConsole from "../lineConsole";
import FNode from "../FNode";
import Environment from '../environment'
import ifProcessorFunction from './if'
import whileProcessorFunction from './while'
import fnDefProcessorFunction from './fnDef'
import classDefProcessorFunction from './classDef'
import {methodDefProcessorFunction} from './classDef'


import evaluate from "../evaluate";
import { ERROR, ExternalMutationERROR } from "../evaluate";
import { extendEnvironment } from '../environment'
import { processorYield, processorInput } from '../executer'





export default function* statementBlockProcessor(body: FNode, environment: Environment, lineConsole: LineConsole)
    : Generator<processorYield, void, processorInput> {

    let caughtError: ERROR | null = null;
    let isRetry = false;
    let result: processorInput | null = null;
    let internalMutation = false;

    do {

        caughtError = null;
        internalMutation = false;

        if (environment && isRetry && environment.getItem("___RETURN___") != null) {
            let env = environment.getMatchingEnv('___RETURN___');
            env?.setItem('___RETURN___', null)

        }


        let mayBeStatement: FNode;
        let localEnvironment = extendEnvironment(environment); //Every new try creates a new environment
        try {
            for (let index = 0; index < body.children.length; index++) {
                mayBeStatement = body.children[index];
                if (mayBeStatement.type == 'statement') {
                    let result = null;

                    if (localEnvironment.getItem("___RETURN___")) {
                        throw ERROR.fromAst(mayBeStatement, 'Unreachable code')
                    }

                    switch (mayBeStatement.children[0].type) {
                        case "expression":
                            result = yield* evaluate(mayBeStatement.children[0], localEnvironment);
                            lineConsole.log(mayBeStatement.startPosition.row, result);

                            break;
                        case "ifStatement":
                            yield* ifProcessorFunction(mayBeStatement, localEnvironment, lineConsole);
                            break;
                        case "whileStatement":
                            yield* whileProcessorFunction(mayBeStatement, localEnvironment, lineConsole);
                            break;

                        case "functionDefStatement":
                            yield* fnDefProcessorFunction(mayBeStatement, localEnvironment, lineConsole);
                            break;
                        case "classDefStatement":
                            yield* classDefProcessorFunction(mayBeStatement, localEnvironment, lineConsole);
                            break;

                        case "methodDefStatement":
                            yield* methodDefProcessorFunction(mayBeStatement, localEnvironment, lineConsole);
                            break;



                        case "retryStatement":

                            if (isRetry) {
                                let expression = mayBeStatement.children[0].children[1];
                                result = yield* evaluate(expression, localEnvironment);
                                lineConsole.log(mayBeStatement.startPosition.row, result);
                            }

                            break;


                        default:
                            debugger;
                            throw ERROR.fromAst(mayBeStatement, 'Unhandled statement')
                            break;
                    }

                } else if (mayBeStatement.type == "emptylines") {
                    lineConsole.logRange(mayBeStatement.startPosition.row,
                        mayBeStatement.endPosition.row, { message: "", type: "result" });
                }
                else {
                    throw patchError(mayBeStatement, "statementError");
                }

            }

        } catch (error) {
            console.log(error);
            caughtError = error;
        }

        let toYield: processorYield | null = null;
        if (caughtError != null) {
            if (caughtError instanceof ExternalMutationERROR) {
                if (caughtError.mutatedBlock != body)
                    throw caughtError;
            }
            else {
                if (!(caughtError instanceof ERROR)) {
                    caughtError = ERROR.fromAst(mayBeStatement, `Internal error:${(caughtError as any).message}`)
                }
                toYield = { type: "ERROR", error: caughtError, activeBlock: body }
            }

        } else if (body.isDesiredActiveBlock) {
            toYield = { type: "isDesiredActiveBlock", error: null, activeBlock: body }
        }

        if (toYield) {
            result = yield toYield;

            switch (result.type) {
                case "internalMutation":
                    internalMutation = true;
                    break;
                case "externalMutation":
                    throw new ExternalMutationERROR(result.mutatedBlock);

                default:
                    break;
            }

        }



        isRetry = true;
    } while (caughtError != null || body.isDesiredActiveBlock || internalMutation);




}

export function patchError(error: FNode, type: string) {
    // switch (type) {
    //     case "statementError":
    //         return ERROR.fromAst(error, 'Statement expected')

    // }
    return ERROR.fromAst(error, 'Statement expected')

}


export function patchErrorToEvent(error: ERROR | null): processorYield {

    if (!error)
        return {
            type: "EOF",
            error: error,
            activeBlock: null
        }
    else {

        return {
            type: "ERROR",
            error: error,
            activeBlock: null
        }
    }
}


