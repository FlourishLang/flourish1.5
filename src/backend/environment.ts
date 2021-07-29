
// import evaluate from "./evaluate";



function createMethod(fun: any) {
    return function* (args: any[],) {
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
    'add': createMethod(function () {
        return Array.from(arguments).reduce((p, c) => p + c)
    }),
    'multiply': createMethod(function () {
        return Array.from(arguments).reduce((p, c) => p * c)
    }),
    'divide': createMethod(function () {
        return Array.from(arguments).reduce((p, c) => p / c)
    }),
    'mod': createMethod(function () {
        return Array.from(arguments).reduce((p, c) => p % c)
    }),

    'subtract': createMethod(function () {
        return Array.from(arguments).reduce((p, c) => p - c)
    }),
    'equals': createMethod(function () {
        // let array = Array.from(arguments);
        return arguments[0] == arguments[1];
        // return array.reduce((p, c) => p == c?p:false)
    }),
    'isGreater': createMethod(function () {
        // let array =  Array.from(arguments);
        return arguments[0] > arguments[1];
    }),
    'isLesser': createMethod(function () {
        // let array =  Array.from(arguments);
        return arguments[0] < arguments[1];
    }),


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

export function extendEnvironment(base: Environment) {
    let env = new Environment();
    env.setSuperEnvironment(base);
    return env;
}
