
import statementBlockProcessor, { patchError, patchErrorToEvent } from "./subProcessor/block";
import { FNodeTree } from './parser'
import FNode, { fNodeSearchByLineNumber } from './FNode'
import LineConsole from './lineConsole'
import { ERROR, ExternalMutationERROR } from './evaluate'
import { createEnvironment } from './environment'

export interface processorYield {
    type: "ERROR" | "isDesiredActiveBlock" | "EOF";
    error: ERROR | null
    activeBlock: FNode | null;
}


export interface executorInput {
    type: "start" | "Mutate" | "switchActiveLine" | "queryEnv"|"batch"
    mutatedBlock?: FNode | null;
}



export interface processorInput {
    mutatedBlock: FNode,
    type: "internalMutation" | "externalMutation" | "sameBlockMutation"
}

export type processorType = Generator<processorYield, void, processorInput>;

type ExternalEnvironment = { [name:string]:any};

export default class Executer {

    needToReset: boolean;
    activeBlock: FNode | null;
    desiredActiveBlock: FNode | null;
    processor: processorType;

    constructor(private tree: FNodeTree, private lineConsole: LineConsole,readonly externalEnvironment?:ExternalEnvironment) {
        this.desiredActiveBlock = null; //Block where execution cycle supposed to run
        this.activeBlock = null;
        this.needToReset = false;
        this.processor = this.reset();
    }

    switchDesiredActiveBlock(newBlock: FNode) {
        if (this.desiredActiveBlock)
            this.desiredActiveBlock.isDesiredActiveBlock = false;
        this.desiredActiveBlock = null

        this.desiredActiveBlock = newBlock;
        if (this.desiredActiveBlock)
            this.desiredActiveBlock.isDesiredActiveBlock = true;
    }




    execute(input: executorInput) {


        let command: processorInput = {
            mutatedBlock: input.mutatedBlock!,
            type: "sameBlockMutation"
        }

        switch (input.type) {
            case "batch":
                    this.switchDesiredActiveBlock(null);
                break;
            case "start":
                if (this.tree.root.children[0]) {
                    this.switchDesiredActiveBlock(this.tree.root.children[0])
                }
                break;
            case "Mutate":
                if (this.activeBlock) {
                    if (isBlockContainsOther(this.activeBlock, input.mutatedBlock!)) {
                        command.type = "internalMutation"
                        command.mutatedBlock = input.mutatedBlock as FNode;

                    } else {
                        try {
                            command.mutatedBlock = this.tree.leastCommonAncestor(input.mutatedBlock, this.activeBlock)
                        } catch (error) {
                            command.mutatedBlock = input.mutatedBlock as FNode;
                        }

                        if (command.mutatedBlock != this.activeBlock) {
                            command.type = "externalMutation"
                        }

                    }

                }
                this.switchDesiredActiveBlock(command.mutatedBlock!)
                break;

            case "switchActiveLine":

                break;
        }


        if (this.needToReset) {
            this.processor = this.reset();
            this.needToReset = false;
        }



        let result = this.processor.next(command);

        if (result.done == true) {
            this.needToReset = true;
        }

        if (result.value) {


            switch (result.value.type) {
                case "isDesiredActiveBlock":
                    this.activeBlock = this.desiredActiveBlock;
                    return null;
                case "ERROR":
                    this.activeBlock = result.value.activeBlock;
                    return result.value;
                case "EOF":
                    return null;
                default:
                    throw "Should not come here"
            }


        }






    }



    reset() {
        return mainProcessorFunction(this.tree.root, this.lineConsole,this.externalEnvironment);

    }




    setActiveLine(lineNumber: number) {

        let expectedActiveBlock = fNodeSearchByLineNumber(this.tree.root, lineNumber);
        if (expectedActiveBlock) {
            this.switchDesiredActiveBlock(expectedActiveBlock)
            return true;
        }

        return false;
    }


    executeTillLine(lineNumber: number) {

        let gotLine = this.setActiveLine(lineNumber);
        if (!gotLine)
            return false;


        let result = this.execute({ type: "switchActiveLine" })
        if (result == null) {
            if (this.activeBlock != this.desiredActiveBlock)
                this.execute({ type: "switchActiveLine" })
        }

        return this.activeBlock == this.desiredActiveBlock;

    }






}





function* mainProcessorFunction(tree: FNode, lineConsole: LineConsole,externalEnvironment:ExternalEnvironment): Generator<processorYield, any, processorInput> {

    do {


        try {
            if (tree.type == "ERROR") {
                return patchErrorToEvent(patchError(tree, "statementError"))
            };
            let baseEnvironment= createEnvironment();
            if (externalEnvironment) {
                for (const key in externalEnvironment) {
                    baseEnvironment.setItem(key,externalEnvironment[key]);
                }    
            }
            

            yield* statementBlockProcessor(tree.children[0],baseEnvironment , lineConsole);
            if (tree.children.length == 2 && tree.children[1].type == "ERROR")
                return patchErrorToEvent(patchError(tree.children[1], "statementError"));
        } catch (error) {
            if (error instanceof ExternalMutationERROR)
                continue;
            else throw(error);
        }

        break;
    }
    while (true)

    return patchErrorToEvent(null);

}

function isBlockContainsOther(bigBlock: FNode, smallBlock: FNode) {
    function bfs(bigBlock: FNode, smallBlock: FNode) {

        let q = [bigBlock];

        while (q.length) {
            let next = q.shift() as FNode;


            for (let index = 0; index < next.children.length; index++) {
                const child = next.children[index];
                if (child !== smallBlock) {
                    q.push(child);
                }
                else {
                    return true;
                }

            }
        }


    }

    if (bigBlock === smallBlock)
        return false;

    return bfs(bigBlock, smallBlock);

}

