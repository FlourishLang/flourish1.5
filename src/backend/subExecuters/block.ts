// const ifExecutor = require('./ifExecutor');
// const whileExecutor = require('./whileExecutor');
// const fnDefExecutor = require('./fnDefExecutor');
import LineConsole from "../lineConsole";
import FNode from "../FNode";
import Environment, { extendEnvironment } from '../enviroment'
import { executorYield, executorNext } from '../executer'

import ifExecutorFunction from './if'
import whileExecutorFunction from './while'
import fndefExecutorFunction from './fndef'
import evaluate, { ERROR, ExternalMutationERROR } from "../evaluate";



export default function* statementBlockExecutor(body: FNode, environment: Environment, lineConsole: LineConsole)
    : Generator<executorYield, void, executorNext> {

    let caughtError: ERROR | null = null;
    let isRetry = false;
    let result: executorNext | null = null;
    let internalMutation = false;

    do {

        caughtError = null;
        internalMutation = false;

        if (environment && isRetry && environment.getItem("___RETURN___") != null) {
            let env = environment.getMatchingEnv('___RETURN___');
            env?.setItem('___RETURN___', null)

        }



        let localEnvironment = extendEnvironment(environment); //Every new try creates a new enviornment
        try {
            for (let index = 0; index < body.children.length; index++) {
                const mayBeStatement = body.children[index];
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
                            yield* ifExecutorFunction(mayBeStatement, localEnvironment, lineConsole);
                            break;
                        case "whileStatement":
                            yield* whileExecutorFunction(mayBeStatement, localEnvironment, lineConsole);
                            break;

                        case "functionDefStatement":
                            yield* fndefExecutorFunction(mayBeStatement, localEnvironment, lineConsole);
                            break;

                        case "retryStatement":

                            if (isRetry) {
                                let expression = mayBeStatement.children[0].children[1];
                                result = yield* evaluate(expression, localEnvironment);
                                lineConsole.log(mayBeStatement.startPosition.row, result);
                            }

                            break;


                        default:
                            throw "Unhandled statment"
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

        let toYield: executorYield | null = null;
        if (caughtError != null) {
            if (caughtError instanceof ExternalMutationERROR) {
                if (caughtError.mutatedBlock != body)
                    throw caughtError;
            }
            else
                toYield = { type: "ERROR", error: caughtError, activeBlock: body }
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


export function patchErrorToEvent(error: ERROR | null): executorYield {

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


