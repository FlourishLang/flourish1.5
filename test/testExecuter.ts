
import Executer from '../src/executer';

import LineConsole from '../src/lineConsole';

import assert from 'assert';
import Parser from '../src/parser';
let lineConsole = new LineConsole();


describe("Executor", () => {

  it('should return error', function () {
    let parser = new Parser('let a  [ 3 1]\n');
    let executer = new Executer(parser.getTree(), lineConsole);
    let result = executer.execute({ type: "start" })

    assert(result!.error?.message, 'Syntax error missing +');

  });


  it('should return error', function () {
    let parser = new Parser("let a  3 1]\n");
    let executer = new Executer(parser.getTree(), lineConsole);
    let result = executer.execute({ type: "start" })

    assert(result!.error?.message, 'Statement expected');

  });



  it('should notfreez on initial if condition', function () {

    let parser = new Parser('i');
    let parser2 = new Parser("if condition:\n\nend\n\n");
    let executer = new Executer(parser.getTree(), lineConsole);
    let result1 = executer.execute({ type: "start" });
    assert.strictEqual(result1!.error?.message, 'Statement expected');
    let { changes: changes1 } = parser.parseIncremental("if",
      {
        "startIndex": 1, "oldEndIndex": 1, "newEndIndex": 2,
        "startPosition": { "row": 0, "column": 1 },
        "oldEndPosition": { "row": 0, "column": 1 }, "newEndPosition": { "row": 0, "column": 2 }
      }
    )

    let result2 = executer.execute({ type: "Mutate", mutatedBlock: changes1.mutatedBlock });
    assert.strictEqual(result2!.error?.message, 'Statement expected');

    let { node: tree2, changes: changes2 } = parser.parseIncremental("if condition:\n\nend\n\n",
      {
        "startIndex": 0, "oldEndIndex": 2, "newEndIndex": 20,
        "startPosition": { "row": 0, "column": 0 },
        "oldEndPosition": { "row": 0, "column": 2 }, "newEndPosition": { "row": 4, "column": 0 }
      }
    )

    let tree3 = parser2.getTree().root
    assert.deepStrictEqual(tree2.root, tree3);
    let executer2 = new Executer(parser2.getTree(), lineConsole);
    let result6 = executer2.execute({ type: "start" });
    assert.strictEqual(result6!.error?.message, "Can't find identifier: condition");


    let result3 = executer.execute({ type: "Mutate", mutatedBlock: changes2.mutatedBlock });
    assert.strictEqual(result3!.error?.message, "Can't find identifier: condition");


  });


  it('incremental parsing should result same output as normal parsing', function () {

    let parser1 = new Parser('let a   3 1]\n');

    let executer1 = new Executer(parser1.getTree(), lineConsole);
    let result1 = executer1.execute({ type: "start" });

    let parser2 = new Parser("let a  [ 3 1]\n");

    let executer2 = new Executer(parser2.getTree(), lineConsole);
    let result2 = executer2.execute({ type: "start" })

    assert.strictEqual(result2!.error?.message, 'Syntax error missing +');


    const newSourceCode = "let a   3 1]\n";
    let { changes: changes } = parser2.parseIncremental(newSourceCode,
      {
        startIndex: 7, oldEndIndex: 8, newEndIndex: 7,
        startPosition: { row: 0, column: 7 },
        oldEndPosition: { row: 0, column: 8 },
        newEndPosition: { row: 0, column: 7 },

      });
    // assert.deepStrictEqual(outTree1, outTree2Modifed); This is okey


    let result3 = executer2.execute({ type: "Mutate", mutatedBlock: changes.mutatedBlock });
    assert.strictEqual(result1!.error?.message, result3!.error?.message);
  });



  describe("Active block", () => {

    it('On loading root blok should active block', () => {
      let code = `print 1
print 2
`
      let parser = new Parser(code);
      let lineConsole = new LineConsole();
      let executer = new Executer(parser.getTree(), lineConsole);
      executer.execute({ type: "start" })
      assert.strictEqual(executer!.activeBlock!.startPosition.row, 0)
      assert.strictEqual(executer!.activeBlock!.endPosition.row, 2)


    });


    it('On loading it should stop at error block', () => {
      let code = `print 1
  print 2
  if [= 1 1] :
    print 
  end
  `
      let parser = new Parser(code);
      let lineConsole = new LineConsole();
      let executer = new Executer(parser.getTree(), lineConsole);
      executer.execute({ type: "start" })
      assert.strictEqual(executer!.activeBlock!.startPosition.row, 3)
      assert.strictEqual(executer!.activeBlock!.endPosition.row, 4)


    });


  });


  describe("Set active line", () => {

    it('it should activate inner block', () => {

      let code = `print 1
print 2
if [= 1 1] :
  print 2
end
  `
      let parser = new Parser(code);
      let lineConsole = new LineConsole();
      let executer = new Executer(parser.getTree(), lineConsole);
      executer.execute({ type: "start" })
      assert.strictEqual(executer!.activeBlock!.startPosition.row, 0)
      assert.strictEqual(executer!.activeBlock!.endPosition.row, 5)

      executer.executeTillLine(3)
      assert.strictEqual(executer.activeBlock!.startPosition.row, 3)
      assert.strictEqual(executer.activeBlock!.endPosition.row, 4)




    });


  });

});



describe("External mutation", () => {

  it('it should change active block  ', () => {

    let code = `print 1
print 2
if [= 1 1] :
print 2
end
`
    let parser = new Parser(code);
    let lineConsole = new LineConsole();
    let executer = new Executer(parser.getTree(), lineConsole);
    executer.execute({ type: "start" })

    assert.strictEqual(executer.activeBlock!.startPosition.row, 0)
    assert.strictEqual(executer.activeBlock!.endPosition.row, 5)
    executer.executeTillLine(3)
    assert.strictEqual(executer.activeBlock!.startPosition.row, 3)
    assert.strictEqual(executer.activeBlock!.endPosition.row, 4)

    code = `print 1
print 3
if [= 1 1] :
print 2
end
`

    let { changes: changes1 } = parser.parseIncremental(code,
      {
        "startIndex": 14, "oldEndIndex": 15, "newEndIndex": 15,
        "startPosition": { "row": 1, "column": 6 },
        "oldEndPosition": { "row": 1, "column": 7 }, "newEndPosition": { "row": 1, "column": 7 }
      }
    )

    executer.execute({ type: "Mutate", mutatedBlock: changes1.mutatedBlock })
    assert.strictEqual(executer.activeBlock!.startPosition.row, 0)
    assert.strictEqual(executer.activeBlock!.endPosition.row, 5)





  });


});


