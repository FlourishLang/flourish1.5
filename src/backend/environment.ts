
// import evaluate from "./evaluate";



function commutativeMethod(fun: any, name: string) {
    return function* (args: any[], outEnv: Environment, node: any) {
        if (args.find(item => typeof (item) != "number")) {
            if (args[0].constructor.name == 'Environment') {
                let method = args[0].getItem(name)
                if (method) {
                    let accumulator = args[0];
                    for (let index = 1; index < args.length; index++) {
                        const element = args[index];
                        accumulator = yield* method([accumulator, element], outEnv, node, accumulator);
                    }

                    return accumulator;
                }

            }
            throw new Error("Invalid type for operator")
        }
        return args.reduce(fun)
    }
}




function translativeMethod(fun: any, name: string) {
    return function* (args: any[], outEnv: Environment, node: any) {
        if (args.length<2) {
            throw new Error("More than one argument expected")

        }
        if (args.find(item => typeof (item) != "number")) {
            if (args[0].constructor.name == 'Environment') {
                let method = args[0].getItem(name)
                if (method) {
                    let first = args[0];
                    for (let index = 1; index < args.length; index++) {
                        const element = args[index];
                        let result = yield* method([first, element], outEnv, node, first);
                        if (result === false)
                            return false;
                        first = args[index];
                    }
                    return true;
                }

            }
            throw new Error("Invalid type for operator")
        }

        let first = args[0];
        for ( let index= 1;  index< args.length; index++){
             if(fun(first,args[index]) == false)
               return false; 
            first = args[index];
        }

        return true;
    }
}




function createMethod(fun: any, name: string) {
    return function* (args: any[], outEnv: Environment, node: any) {
        if (args.find(item => typeof (item) != "number")) {
            if (args[0].constructor.name == 'Environment') {
                let method = args[0].getItem(name)
                if (method) {
                    return yield* method(args, outEnv, node, args[0]);
                }

            }
            throw new Error("Invalid type for operator")
        }

        let result = fun.apply(null, args);
        return result;
    }
}



export default class Environment {
    dict: { [name: string]: any } = {};
    superEnvironment: Environment | null = null;
    constructor() {

    }


    public setItem(v: string, value: any) {
        this.dict[v] = value
    }

    public hasItem(v: string): boolean {
        if (this.dict[v] !== undefined)
            return true;
        else return false;
    }

    public getItem(identifier: string): any {

        if (!this.hasItem(identifier)) {
            if (this.superEnvironment)
                return this.superEnvironment.getItem(identifier);

            return undefined;

        } else {
            return this.dict[identifier]
        }

    }


    public setSuperEnvironment(anEnvironment: Environment) {
        this.superEnvironment = anEnvironment;
    }

    public getMatchingEnv(identifier: string): Environment | null {
        if (this.hasItem(identifier))
            return this;

        if (this.superEnvironment != null)
            return this.superEnvironment.getMatchingEnv(identifier);
        else
            return null;

    }



}




let builtInEnvDict = {
    'add': commutativeMethod((p: any, c: any) => p + c, 'add'),
    'multiply': commutativeMethod((p: any, c: any) => p * c, 'multiply'),
    'divide': commutativeMethod((p: any, c: any) => p / c, 'divide'),
    'mod': commutativeMethod((p: any, c: any) => p % c, 'mod'),
    'subtract': commutativeMethod((p: any, c: any) => p - c, 'subtract'),
    'equals': translativeMethod(function () {
        return arguments[0] == arguments[1];
    }, 'equals'),
    'isGreater': translativeMethod(function () {
        return arguments[0] > arguments[1];
    }, 'isGreater'),
    'isLesser': translativeMethod(function () {
        return arguments[0] < arguments[1];
    }, 'isLesser'),


};


let builtInEnv: Environment | null = null;
function getBuiltInEnv() {
    if (builtInEnv == null) {
        let base = new Environment();
        base.dict = builtInEnvDict;
        builtInEnv = base;
    }
    return builtInEnv;
}


export function createEnvironment() {
    return extendEnvironment(getBuiltInEnv());
}


export function createEmptyEnvironment() {
    return extendEnvironment(null);
}


export function extendEnvironment(base: Environment) {
    let env = new Environment();
    env.setSuperEnvironment(base);
    return env;
}

export function printEnvironment(environment: Environment): string {
    let ret = "{"
    Object.keys(environment.dict).forEach(key => {
        ret += key;
        ret += ":";
        ret += environment.dict[key];
        ret += " ";
    });
    ret += "}";
    return ret;
}
