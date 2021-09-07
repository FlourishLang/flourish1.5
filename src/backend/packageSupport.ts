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
        env.setItem(packageName, exportedEnv.getItem(packageName))
    } else {
        throw "Failed to import package";
    }

}