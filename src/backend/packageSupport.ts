import FNode from "./FNode";
import Environment from "./environment";
import Parser from "./parser"
import Executer from "./executer";
import LineConsole from "./lineConsole";
import { ERROR } from "./evaluate";
import { throwPlaceHolder } from "./suggestionSupport";



export function* defPackage(result: FNode[], env: Environment) {
    if (!result.length)
        throw `Package name missing`;

    

    throwPlaceHolder(result[0].children[0],'aPackage')


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

        Object.assign(parentEnvironment.dict, newParentEnv);

        return environment;
    }



    function* wrapperGeneratorClassConstructor() {

        let iter = env.apply(null, arguments);
        let result = iter.next();
        if (result.done == true && (!result.value || result.value.type != "error")) {
            return canonicalizeParent(result.value);
        }
        else throw "Package internal error" + result.value.error.message;



    }

    function* wrapperGeneratorFunction() {
        let iter = env.apply(null, arguments);
        let result = iter.next();
        if (result.done == true && (!result.value || result.value.type != "error")) {
            return result.value;
        }
        else throw "Package internal error" + result.value.error.message;
    }

    if (env.name == "classConstructor") {
        return [wrapperGeneratorClassConstructor, "class"];
    } else {
        return [wrapperGeneratorFunction, "function"];
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
/** 
 * Adds packages name for completion. (stub for now)
 * TODO: iterate the directory for files
 * @param hint 
 * @returns 
 */

function getAllPackageNameForCompletion(hint: string) {
    return ['vector', 'sortArray'];
}

export function* importPackage(args: FNode[], env: Environment) {
    if (!args.length) {
        let err = new ERROR('Package name missing');
        err.suggestions.alternatives = getAllPackageNameForCompletion('').map(i => ' ' + i);
        throw err;

    }


    let packageName = args[0].children[0].leafText;

    let exportedEnv = null;
    try {
        exportedEnv = getPossibleCachedPackage(packageName, env);
    } catch (error) {
        if (error?.code == "ENOENT")
            exportedEnv = null;
        else throw error;

    }


    if (exportedEnv) {

        let [packageContent, packageType] = canonicalizeEnvironment(exportedEnv.getItem(packageName))

        env.setItem(packageName, packageContent)
        return packageType;

    } else {
        let err = new ERROR('Failed to import package');
        err.appendAst(args[0]);
        err.suggestions.alternatives = getAllPackageNameForCompletion(packageName);
        err.suggestions.keyword = packageName;
        throw err;

    }

}