import Parser, { Edit } from 'tree-sitter';
import { SyntaxNode as TSTree, Tree as TSTreeBase } from 'tree-sitter';
const Flourish = require('tree-sitter-flourish');
const leastCommonAncestorFunctionGenerator = require("least-common-ancestor");

import FNode, { reconciliationTree, forcedReconciliationTree, accumulateMutatedLeaf } from './FNode';


export default class FlourishParser {

    private tsTree!: TSTreeBase;
    private parser: Parser;
    private fNodeTree!: FNodeTree;


    constructor(sourceCode: string) {
        this.parser = new Parser();
        this.parser.setLanguage(Flourish);

        this.reParse(sourceCode);

        // this.lca = null;

    }


    getTree() {
        return this.fNodeTree;
    }

    reParse(sourceCode: string) {
        this.tsTree = this.parser.parse(sourceCode);;
        this.fNodeTree = new FNodeTree(forcedReconciliationTree(this.tsTree));
        return this.fNodeTree;
    }



    parseIncremental(newSourceCode: string, treeEditInfo: Edit) {
        const tree = this.tsTree;
        tree.edit(treeEditInfo);

        let newTree = this.parser.parse(newSourceCode, tree);
        let changedRange = tree.getChangedRanges(newTree);


        let editedRange = tree.getEditedRange(newTree)
        this.fNodeTree.update(reconciliationTree(this.fNodeTree.root, tree, newTree));

        let mutatedChildren = accumulateMutatedLeaf(this.fNodeTree.root);
        let mutatedRoot = null
        if (mutatedChildren.length) {
            mutatedRoot = leastCommonAncestorArray(mutatedChildren, this.fNodeTree.leastCommonAncestor);

        }



        const changes = { changedRange, editedRange, mutatedBlock: FNodeTree.getBlockNode(mutatedRoot) };
        this.tsTree = newTree;
        return { node: this.fNodeTree, changes: changes };

    }






}

function leastCommonAncestorArray(list: FNode[], leastCommonAncesestor: any) {

    return list.reduce((p, c) => leastCommonAncesestor(p, c));
    ;
    //TODO investicate optimized way;

    // if(list.length==1)
    //     return  list[0];

    // if(list.length==2)
    //     return this.leastCommonAncesestor(list[0],list[1]);

    // let center = Math.ceil(list.length/2);
    // let first = list.slice(0,center)
    // let second = list.slice(center);

    // return this._leastCommonAncestorArray(first,second);

}


export class FNodeTree {
    public leastCommonAncestor: any

    constructor(public root: FNode) {
        this.leastCommonAncestor = leastCommonAncestorFunctionGenerator(root, (node: FNode) => node.children);
    }

    update(root: FNode){
        this.root = root;
        this.leastCommonAncestor = leastCommonAncestorFunctionGenerator(root, (node: FNode) => node.children);
    }


    static getBlockNode(input: FNode | null) {
        let output = input;
        if (output == null)
            return null;
        else {
            while (output!.getParent() && output!.type != "block") {
                output = output!.getParent();
            }
            return output;
        }


    }
}

