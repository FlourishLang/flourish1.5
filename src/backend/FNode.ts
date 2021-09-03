import { SyntaxNode as TSTree, Point, Tree as TSRootTree } from 'tree-sitter'
const bs = require("binary-search");


let parentMap = new WeakMap();
export type FNodePoint = Point;

export default class FNode {
    public children: FNode[];
    public leafText: string;
    public liveStatus: string = "";
    public isMissingNode: boolean;
    public hasError: boolean;
    public isMutated: boolean;
    public type: string = "";
    public isDesiredActiveBlock: boolean = false;
    public startPosition: FNodePoint = { row: 0, column: 0 };
    public endPosition: FNodePoint = { row: 0, column: 0 };;


    constructor(newTsTree: TSTree) {
        this.children = [];
        this.leafText = "";
        this.isMissingNode = false;
        this.hasError = false;
        this.isMutated = true;
        this.apply(newTsTree);

    }


    apply(newTsTree: TSTree) {
        let data = { startPosition: newTsTree.startPosition, type: newTsTree.type, endPosition: newTsTree.endPosition };
        this.isMissingNode = newTsTree.isMissing();
        this.hasError = newTsTree.hasError();
        if (newTsTree.childCount == 0)
            this.leafText = newTsTree.text;

        Object.assign(this, data);
    }

    applyTree(newTsTree: TSTree) {
        this.apply(newTsTree);
        this.children.forEach((child, index) => { child.applyTree(newTsTree.children[index]) });
    }

    get Text(): string {
        if (this.leafText)
            return this.leafText;
        else
            return this.children.map(i => i.Text).join('');
    }



    getParent() {
        return parentMap.get(this);
    }



};

let mapMemorization = new Map()
function isEqualNodeMemory(first: TSTree, next: TSTree, fNode: FNode) {
    let key = "" + (first as any)["0"] as string + "" + (next as any)["0"];
    if (mapMemorization.has(key))
        return mapMemorization.get(key);
    let result = isEqualNode(first, next, fNode);
    mapMemorization.set(key, result);
    return result
}


function isTypesEqual(first: TSTree, next: TSTree): boolean {
    if (first.type != next.type)
        return false;

    if (first.type == "statement") {
        return isTypesEqual(first.children[0], next.children[0]);
    }

    return true;

}


function isEqualNode(first: TSTree, next: TSTree, fNode: FNode): boolean {

    if ((first as any)["0"] === (next as any)["0"])
        return true;

    if (!isTypesEqual(first, next)) {
        return false;
    }


    if (first.childCount != next.childCount) {
        // console.log("Same child count mismatch");
        return false;
    }

    if (first.childCount == 0 && next.text == fNode.leafText && !fNode.isMissingNode == !next.isMissing()) {
        return true;
    }


    if (first.childCount == 0) {
        return false;
    }

    let mismatch = first.children.find((child, index) => {
        return !isEqualNodeMemory(child, next.children[index], fNode.children[index]);
    })



    return !mismatch;

}

function forcedReConciliationNode(newTsTree: TSTree): FNode {
    let fNode = new FNode(newTsTree)
    fNode.children = newTsTree.children.map((child) => forcedReConciliationNode(child))
    fNode.children.forEach(child => { parentMap.set(child, fNode) });
    return fNode;
}

function reConciliationNode(oldFNodeTree: FNode, oldTsTree: TSTree, newTsTree: TSTree): FNode | null {
    if (isEqualNodeMemory(oldTsTree, newTsTree, oldFNodeTree)) {
        // console.log("reusing", oldFNodeTree.type, newTsTree.text);
        oldFNodeTree.isMutated = false;
        oldFNodeTree.applyTree(newTsTree);
        return oldFNodeTree;

    } else if (isTypesEqual(oldTsTree, newTsTree)) {
        oldFNodeTree.isMutated = true;//Children changed
        oldFNodeTree.apply(newTsTree);
        let indexOffSet = 0;
        for (let index = 0; index < newTsTree.childCount; index++) {
            let child = newTsTree.children[index];
            if (oldFNodeTree.children.length == newTsTree.childCount) {

                let newFNodeChild = reConciliationNode(oldFNodeTree.children[index], oldTsTree.children[index + indexOffSet], child);
                if (newFNodeChild != null) {
                    oldFNodeTree.children[index] = newFNodeChild;
                    parentMap.set(newFNodeChild, oldFNodeTree);
                }
                else {
                    let newFNodeChild = forcedReConciliationNode(child);
                    oldFNodeTree.children[index] = newFNodeChild;
                    parentMap.set(newFNodeChild, oldFNodeTree);
                }


            }

            else if (oldFNodeTree.children.length > newTsTree.childCount) {

                let newFNodeChild = reConciliationNode(oldFNodeTree.children[index], oldTsTree.children[index + indexOffSet], child);
                if (newFNodeChild != null) {
                    oldFNodeTree.children[index] = newFNodeChild;
                    parentMap.set(newFNodeChild, oldFNodeTree);
                }
                else {

                    oldFNodeTree.children.splice(index, 1);
                    indexOffSet += 1;
                    index--;
                }

            } else if (oldFNodeTree.children.length < newTsTree.childCount) {
                if (oldFNodeTree.children.length <= index) {
                    let newFNodeChild = forcedReConciliationNode(child);
                    oldFNodeTree.children.push(newFNodeChild);
                    parentMap.set(newFNodeChild, oldFNodeTree);
                } else {
                    let newFNodeChild = reConciliationNode(oldFNodeTree.children[index], oldTsTree.children[index + indexOffSet], child);
                    if (newFNodeChild != null) {
                        oldFNodeTree.children[index] = newFNodeChild;
                        parentMap.set(newFNodeChild, oldFNodeTree);
                    } else {
                        let newFNodeChild = forcedReConciliationNode(child);
                        oldFNodeTree.children.splice(index, 0, newFNodeChild);
                        indexOffSet -= 1;
                    }
                }

            }




        }

        if (oldFNodeTree.children.length > newTsTree.childCount) {
            for (let index = newTsTree.childCount; index < oldFNodeTree.children.length; index++) {
            }
            oldFNodeTree.children.splice(newTsTree.childCount, oldFNodeTree.children.length - newTsTree.childCount);

        }


        return oldFNodeTree;
    } else {

        return null;

    }

}


function clearNonMutation(fNode: FNode) {
    if (!fNode)
        return;
    fNode.isMutated = false;
    if (fNode.children)
        fNode.children.forEach(element => clearNonMutation(element));
}

function accumulateMutatedLeafInternal(fNode: FNode, resultArray: FNode[]) {

    if (fNode.isMutated == false)
        return;
    if (fNode.children.length == 0)
        resultArray.push(fNode);
    else {
        let beforeLength = resultArray.length;
        fNode.children.forEach(element => {
            accumulateMutatedLeafInternal(element, resultArray);
        });
        let afterLength = resultArray.length;
        if (beforeLength == afterLength)
            resultArray.push(fNode);

    }

}


export function accumulateMutatedLeaf(node: FNode) {
    let array: FNode[] = [];
    accumulateMutatedLeafInternal(node, array);
    return array;
}

export function forcedReconciliationTree(newTsTree: TSRootTree) {
    return forcedReConciliationNode(newTsTree.rootNode)
}


export function reconciliationTree(oldFNodeTree: FNode, oldTsTree: TSRootTree, newTsTree: TSRootTree) {
    mapMemorization.clear();
    clearNonMutation(oldFNodeTree);

    let node = reConciliationNode(
        oldFNodeTree,
        oldTsTree.rootNode,
        newTsTree.rootNode);

    if (node)
        return node;
    else
        return forcedReConciliationNode(newTsTree.rootNode)



}



export function fNodeSearchByLineNumber(tree: FNode, lineNumber: number) {
    function adjustedEndPosition(end: FNodePoint) {
        if (end.column == 0 && end.row > 0) {
            return { row: end.row - 1, column: end.column };
        }
        return end;
    }

    let cursor: FNode | null = tree;
    // Traverse until root reaches to dead end 
    let lastBlock = null;


    while (cursor != null) {
        if (cursor.type == "block")
            lastBlock = cursor;

        let result = bs(cursor.children, lineNumber, (element: FNode, needle: number) => {

            if (adjustedEndPosition(element.endPosition).row < needle) {
                return -1;
            } else if (element.startPosition.row > needle) {
                return 1;
            } else if (element.startPosition.row <= needle
                && adjustedEndPosition(element.endPosition).row >= needle) {

                return 0;
            }
            throw "should not come here"

        });

        let resultNode: FNode = cursor.children[result];
        if (resultNode) {
            cursor = resultNode;
        } else {
            cursor = null;
        }

    }

    return lastBlock;


}


