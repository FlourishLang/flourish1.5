import FNode, { FNodePoint } from "./FNode";
import Environment from "./environment";




export class ERROR {
    constructor(readonly message: string,
        readonly startPosition: FNodePoint = { column: 0, row: 0 },
        readonly endPosition: FNodePoint = { column: 0, row: 0 }) {
        this.message = message;
        this.startPosition = startPosition;
        this.endPosition = endPosition;
    }

    hasValidPosition() {
        return !(this.startPosition.row == this.endPosition.row &&
            this.startPosition.column == this.endPosition.column)
    }

    static fromAst(ast: FNode, message: string) {
        return new ERROR(message, ast.startPosition, ast.endPosition);
    }
}

export class ExternalMutationERROR extends ERROR {

    constructor(readonly mutatedBlock: FNode) {
        super("External mutation")
    }
}



export let specialEnv: { [name: string]: any } = {

    'print': function* (args: FNode[], env: Environment): any {

        if (args.length != 1) {
            if (args.length) {
                throw new ERROR(`Mismatching no of argument for set, got ${args.length} expected 1`,
                    args[0].startPosition, args[args.length - 1].endPosition);
            } else {
                throw new ERROR(`Mismatching no of argument for set, got ${args.length} expected 1`)
            }
        }



        let res = yield* evaluate(args[0], env);
        return res;

    },

    'let': function* (args: FNode[], env: Environment): any {

        if (args.length != 2) {
            if (args.length) {
                throw new ERROR(`Mismatching no of argument for set, got ${args.length} expected 2`,
                    args[0].startPosition, args[args.length - 1].endPosition);
            } else {
                throw new ERROR(`Mismatching no of argument for set, got ${args.length} expected 2`)
            }
        }



        let identifier = args[0].children[0].leafText;
        if (args[0].children[0].type !== "identifier") {
            throw ERROR.fromAst(args[0].children[0], `identifier expected found ${args[0].children[0].type}`);
        }

        if (!env.hasItem(identifier)) {
            let res = yield* evaluate(args[1], env);
            if (res == null)
                throw ERROR.fromAst(args[1], `Cannot set null value from expression `);
            env.setItem(identifier, res);

            return res;

        } else {
            throw ERROR.fromAst(args[0].children[0], `Can't reset identifier: ${identifier}`);
        }

    },
    'setThis': function* (args: FNode[], env: Environment): any {

        if (args.length != 2) {
            if (args.length) {
                throw new ERROR(`Mismatching no of argument for set, got ${args.length} expected 2`,
                    args[0].startPosition, args[args.length - 1].endPosition);
            } else {
                throw new ERROR(`Mismatching no of argument for set, got ${args.length} expected 2`)
            }
        }



        let identifier = args[0].children[0].leafText;
        if (args[0].children[0].type !== "identifier") {
            throw ERROR.fromAst(args[0].children[0], `identifier expected found ${args[0].children[0].type}`);
        }

        if (env.getItem('___THIS___')) {
            let thisEnv = env.getItem('___THIS___') as Environment;
            let res = yield* evaluate(args[1], env);
            thisEnv.setItem(identifier, res);
            return res;
        } else {
            throw ERROR.fromAst(args[0], `Undefined this environment`);
        }

        // if (!env.hasItem(identifier)) {
        //     let res = yield* evaluate(args[1], env);
        //     env.setItem(identifier, res);
        //     return res;

        // } else {
        //     throw ERROR.fromAst(args[0].children[0], `Can't reset identifier: ${identifier}`);
        // }

    },

    'reset': function* (args: FNode[], env: Environment): any {
        if (args.length != 2) {
            if (args.length) {
                throw new ERROR(`Mismatching no of argument for reset(${args.length}) expected 2`,
                    args[0].startPosition, args[args.length - 1].endPosition);
            } else {
                throw new ERROR(`Mismatching no of argument for reset(${args.length}) expected 2`)
            }
        }

        let identifier = args[0].children[0].leafText;
        if (args[0].children[0].type !== "identifier") {
            throw ERROR.fromAst(args[0].children[0], `identifier expected found ${args[0].children[0].type}`);
        }



        let matchingEnv = env.getMatchingEnv(identifier);

        if (matchingEnv == undefined) {
            throw ERROR.fromAst(args[0].children[0], `Undefined  identifier: ${identifier}`);

        } else {

            let res = yield* evaluate(args[1], env);
            matchingEnv.setItem(identifier, res);
            return res;

        }

    },
    'get': function get(arg: FNode, env: Environment): any {

        if (arg.type == "identifier") {


            let identifier = arg.leafText;
            let value = env.getItem(identifier);


            if (value === undefined) {
                throw ERROR.fromAst(arg, `Can't find identifier: ${identifier}`);

            } else {
                return value;
            }
        } else {

            if (!arg.children)
                throw ERROR.fromAst(arg, `Can't find children`);


            let object = env.getItem(arg.children[0].leafText);
            if (object === undefined) {
                throw ERROR.fromAst(arg, `Can't find object: ${arg.children[0].leafText}`);

            } else {
                let objectEnv = object as Environment;
                return get(arg.children[2], objectEnv);
            }
        }

    },

    'has': function get(arg: FNode, env: Environment) {
        let identifier = arg.leafText;
        let value = env.getItem(identifier);

        if (value != undefined) {
            return true;
        }
        else {
            return false;
        }

    },
    'return': function* (result: any, env: Environment) {
        if (!result.length)
            return null;

        let matchingEnv = env.getMatchingEnv("___RETURN___");

        if (matchingEnv == undefined) {
            throw `Unable to handle return`;

        } else {
            let res = yield* evaluate(result[0], env);
            matchingEnv.setItem("___RETURN___", res);
            return res;

        }

    },

    'defPackage': function* (result: FNode[], env: Environment) {
        if (!result.length)
            throw `Package name missing`;

            let writeToFile = env.getItem("___writeToFile");
            writeToFile(result[0].children[0].leafText);

    },




}


function getSpecialCmd(cmd: FNode): any {
    if (cmd.type == "cmd")
        return specialEnv[cmd.children[0].leafText];
    return null;
}


export default function* evaluate(ast: FNode, env: Environment): any {
    if (ast.hasError) {
        function subject(ast: FNode) {
            if (ast.type == "ERROR") {
                return ast.children[0].leafText;
            } else if ("" === ast.leafText) {
                return ast.type;
            } else if (ast.type === ast.leafText) {
                return ast.leafText;
            } else {
                return `${ast.type}(${ast.leafText})`
            }
        }
        let error = ast.children.find(i => i.isMissingNode || i.type === "ERROR");
        if (error) {
            if (error.isMissingNode) {
                throw new ERROR(`Syntax error missing ${subject(error)}`, error.startPosition, error.endPosition);
            } else {
                throw new ERROR(`Syntax error unexpected ${subject(error)}`, error.startPosition, error.endPosition);
            }
        }
    }




    switch (ast.type) {
        case "expression":
            {
                let specialCmd = getSpecialCmd(ast.children[0]); //Like macro
                if (specialCmd) {
                    let cmdArguments = ast.children.slice(1);
                    try {
                        return yield* specialCmd(cmdArguments, env);
                    } catch (error) {
                        if (error.hasValidPosition && !error.hasValidPosition()) {

                            error = ERROR.fromAst(ast, error.message);
                        }
                        throw error;
                    }

                } else {

                    //Non special forms -  arguments evaluated
                    let cmd = null;

                    try {
                        cmd = yield* evaluate(ast.children[0], env);
                    } catch (error) {
                        if (error.message.includes("Can't find identifier")) {
                            throw ERROR.fromAst(ast, `Cannot find command : ${ast.children[0].children[0].leafText}`);
                        } else {
                            throw error;
                        }
                    }

                    let cmdArguments = ast.children.slice(1);

                    let evaluatedArguments = [];
                    for (let index = 0; index < cmdArguments.length; index++) {
                        let argEvalResult = yield* evaluate(cmdArguments[index], env);
                        evaluatedArguments.push(argEvalResult);
                    }
                    try {
                        return yield* cmd.call(null, evaluatedArguments, env,ast.children[0])
                    } catch (error) {
                        throw ERROR.fromAst(ast, `Internal Exception: ${error.message}`);

                    }


                }

            }
            break;
        case "compoundExpression":
            {
                let actualChildren = ast.children.slice(1);
                actualChildren.pop();
                let result = yield* evaluate(actualChildren[0], env);
                return result;
            }
            break;

        case "inifixexpression": {

            let operator = yield* evaluate(ast.children[2], env);
            let left = yield* evaluate(ast.children[1], env);
            let right = yield* evaluate(ast.children[3], env);
            try {
                return yield* operator.call(null, [left, right], env)
            } catch (error) {
                throw ERROR.fromAst(ast, `Internal Exception: ${error.message}`);

            }

            break;
        }

        case "identifier":
        case "attributelist":
            if (specialEnv[ast.leafText])
                return specialEnv[ast.leafText];
            return specialEnv.get(ast, env);

        case "cmd": case "operator": case 'argument':
            return yield* evaluate(ast.children[0], env);

        case "+":
            return specialEnv.get({ leafText: "add", type: "identifier" }, env);
        case "-":
            return specialEnv.get({ leafText: "subtract", type: "identifier" }, env);
        case "*":
            return specialEnv.get({ leafText: "multiply", type: "identifier" }, env);
        case "%":
            return specialEnv.get({ leafText: "mod", type: "identifier" }, env);
        case "/":
            return specialEnv.get({ leafText: "divide", type: "identifier" }, env);
        case "=":
            return specialEnv.get({ leafText: "equals", type: "identifier" }, env);
        case "<":
            return specialEnv.get({ leafText: "isLesser", type: "identifier" }, env);
        case ">":
            return specialEnv.get({ leafText: "isGreater", type: "identifier" }, env);

        case "number":
            return parseInt(ast.leafText);

        case "ERROR":
            return ERROR.fromAst(ast, "Syntax error");



        default:

            throw ERROR.fromAst(ast, "Cannot evaluate:" + ast.type);
            break;
    }
}
