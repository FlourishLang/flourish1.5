import FNode from "./FNode";
import Environment from "./environment";
import Parser from "./parser"
import Executer from "./executer";
import LineConsole from "./lineConsole";



export function* defPackage(result: FNode[], env: Environment) {
    if (!result.length)
        throw `Package name missing`;

    let writeToFile = env.getItem("___writeToFile");
    writeToFile(result[0].children[0].leafText);
    return result[0].children[0].leafText;

}

function canonicalizeEnvironment(env: any) {


    function canonicalizeParent(env: Environment) {

        let environment = env as Environment;

        let parentEnvironment = environment.superEnvironment;
        let newParentEnv = {};
        for (const key in parentEnvironment.dict) {
            if (Object.prototype.hasOwnProperty.call(parentEnvironment.dict, key)) {
                const element = parentEnvironment.dict[key];
                if (typeof (element) == 'function' && element.name == 'method') {

                    function* wrapperGeneratorMethod() {
                        let iter = element.apply(null, arguments);
                        let result = iter.next();
                        if (result.done == true && result.value.type != "error") {
                            return canonicalizeParent(result.value);
                        }
                        else throw "Package internal error" + result.value.error.message;

                    }
                    newParentEnv[key] = wrapperGeneratorMethod;

                }
            }
        }
        
        Object.assign(parentEnvironment.dict,newParentEnv);

        return environment;
    }



    function* wrapperGeneratorClassConstructor() {

        let iter = env.apply(null, arguments);
        let result = iter.next();
        if (result.done == true && result.value.type != "error") {
            return canonicalizeParent(result.value);
        }
        else throw "Package internal error" + result.value.error.message;



    }
    if (env.name == "classConstructor") {
        return wrapperGeneratorClassConstructor;
    }


}



function fetchPackage(packageName: string, env: Environment): any {
    let readFromFile = env.getItem("___readFromFile");

    let data = readFromFile(packageName);
    let parser = new Parser(data);
    let lineConsole = new LineConsole();

    let exportedEnv: Environment = null;
    function exportEnv(params: Environment) {
        exportedEnv = params;
    }


    let executer = new Executer(parser.getTree(), lineConsole, {
        "___writeToFile": () => { },
        "___readFromFile": readFromFile,
        "___export_env": exportEnv
    });

    let result = executer.execute({ type: "batch" })
    if (!exportEnv) {
        return null;
    }
    return exportedEnv;
}

let loadedPackages = {}

function getPossibleCachedPackage(packageName: string, env: Environment): any {
    let cached = loadedPackages[packageName];
    if (cached) {
        //TODO: check if out dated
        return cached;
    } else {
        loadedPackages[packageName] = fetchPackage(packageName, env);
        return loadedPackages[packageName];
    }
}


export function* importPackage(args: FNode[], env: Environment) {
    if (!args.length)
        throw `Package name missing`;

    let packageName = args[0].children[0].leafText;


    let exportedEnv = getPossibleCachedPackage(packageName, env);

    if (exportedEnv) {
        env.setItem(packageName, canonicalizeEnvironment(exportedEnv.getItem(packageName)))
    } else {
        throw "Failed to import package";
    }

}