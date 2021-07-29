import Parser from '../src/backend/parser';

var assert = require('assert');

describe("Parser", () => {
    describe("Normal parsing", () => {
        it('should parse statement', () => {
            let flourishParser = new Parser("print [+1 2]");
            let tree = flourishParser.getTree().root;
            assert.equal(tree.children[0].type, "block");
            assert.equal(tree.children[0].children[0].type, "statement");
        });

        // it('should parse root node even in case of error', () => {
        //     let flourishParser = new Parser();
        //     let tree = flourishParser.parse("(")
        //     assert.equal(tree.type, "source_file");
        // });

        it('should detect empty lines', () => {
            let flourishParser = new Parser("print [+ 1] \n\n print [+ 1]");
            let tree = flourishParser.getTree().root
            assert.equal(tree.children[0].children[0].type, "statement");
            assert.equal(tree.children[0].children[1].type, "emptylines");
            assert.equal(tree.children[0].children[2].type, "statement");
        });

        it('should detect empty lines with template strings', () => {
            let text =
                `print [+ 1] 

print [+ 1]
`;
            let flourishParser = new Parser(text);

            let tree = flourishParser.getTree().root
            assert.equal(tree.children[0].children[0].type, "statement");
            assert.equal(tree.children[0].children[1].type, "emptylines");
            assert.equal(tree.children[0].children[2].type, "statement");
        });


    });




    describe("Incremental  parsing", () => {


        it("Should mutate properly", () => {
            let text =
                `

if = 1 12:
  set a 4  
end


`;
            let flourishParser = new Parser(text);
            let tree = flourishParser.getTree().root;
            let updatedText =
                `
s
if = 1 12:
    set a 4  
end


`;

            let edit = {
                newEndIndex: 2,
                newEndPosition: { row: 1, column: 1 },
                oldEndIndex: 1,
                oldEndPosition: { row: 1, column: 0 },
                startIndex: 1,
                startPosition: { row: 1, column: 0 }
            }
            let { node: newTree } = flourishParser.parseIncremental(updatedText, edit);


            assert.strictEqual(newTree.root.children[0].children[2].children[0].type, "if")
            assert.strictEqual(newTree.root.children[0].children[2].isMutated, false);


        });



        it('Restore original tree after undoing', () => {
            let text =
                'set a [+ 1]\n';
            let flourishParser = new Parser(text);
            let tree = flourishParser.getTree().root;
            let treeString = JSON.stringify(tree);
            let updatedText = 'set a + 1]\n';
            let edit = {
                startIndex: 6,
                oldEndIndex: 7,
                newEndIndex: 6,
                startPosition: { row: 0, column: 6 },
                oldEndPosition: { row: 0, column: 7 },
                newEndPosition: { row: 0, column: 6 }
            }

            let treeChildren = tree.children.slice();
            let { node: newTree } = flourishParser.parseIncremental(updatedText, edit);


            let reverseEdit = {
                startIndex: 6,
                oldEndIndex: 6,
                newEndIndex: 7,
                startPosition: { row: 0, column: 6 },
                oldEndPosition: { row: 0, column: 6 },
                newEndPosition: { row: 0, column: 7 }
            }

            let { node: newTree2 } = flourishParser.parseIncremental(text, reverseEdit);

            let treeString2 = JSON.stringify(newTree2.root);
            assert.strictEqual(treeString2, treeString);
            // assert.strictEqual(changes.mutatedRoot,newTree2);
        });








    });

})
