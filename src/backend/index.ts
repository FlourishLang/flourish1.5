import { Server, Socket } from "socket.io";
import BackBuffer from "./backBuffer";
import LineConsole from "./lineConsole";
import Parser, { FNodeTree } from './parser';
import Executer from './executer';
import FNode from "./FNode";



const io = new Server(3000, {
  pingInterval: 60000,
  pingTimeout: 5000,
  cors: {
    origin: "http://localhost:9000",
    methods: ["GET", "POST"]
  }
});


/**Patch tree for consumption of codemirror  */
function patchTree(tree: FNodeTree, result: any, executor: Executer, changes: any, lineConsole: LineConsole) {

  function indentTree(tree: FNode, indentLevel: number) {
    let ret = Object.assign({}, tree, { indentLevel: indentLevel });
    if (ret.type == "block") {
      ret.children = tree.children.map(element => {
        return indentTree(element, indentLevel + 1)
      });
    } else {
      ret.children = tree.children.map(element => {
        return indentTree(element, indentLevel)
      });
    }

    return ret;
  }



  let errors = [];
  if (result && result.error)
    errors.push(result.error);

  let activeRange = null;
  if (executor.activeBlock) {
    activeRange = {
      startPosition: executor.activeBlock.startPosition,
      endPosition: executor.activeBlock.endPosition
    }
  }



  return {
    data: indentTree(tree.root, 0),
    lineConsole: lineConsole.getData(),
    changes: changes ? {
      changedRange: changes.changedRange,
      editedRange: changes.editedRange
    } : null,
    errors: errors,
    activeRange: activeRange

  }
}

let oldSocket: Socket | null = null;

io.on('connection', socket => {

  //For debugging purpose we have only one connection active at a time
  if (oldSocket) {
    oldSocket.disconnect();
    oldSocket = null;
  }
  oldSocket = socket;


  // descendantForPosition

  let parser: Parser | null = null;
  let executer: Executer | null = null;
  let outTree: FNodeTree | null = null;
  let backBuffer: BackBuffer | null = null;
  let lineConsole: LineConsole | null = null;
  socket.on('parse', sourceCode => {
    parser = new Parser(sourceCode);
    outTree = parser.getTree();
    backBuffer = new BackBuffer(sourceCode);
    lineConsole = new LineConsole();
    executer = new Executer(parser.getTree(), lineConsole);
    let result = executer.execute({ type: "start" })

    let finalOutTree = patchTree(outTree, result, executer, null, lineConsole);
    socket.emit('parseComplete', finalOutTree);





  });

  socket.on('parseIncremental', data => {
    let results = backBuffer!.applyChanges(data.change);
    let { node, changes } = parser!.parseIncremental(results.text, results.posInfo);

    let result = executer!.execute({ type: "Mutate", mutatedBlock: changes.mutatedBlock })
    let finalOutTree = patchTree(node, result, executer!, changes, lineConsole!);

    socket.emit('parseComplete', finalOutTree);
    lineConsole!.clear();

  });


  socket.on('setActiveLine', lineNumber => {

    let tree = parser!.getTree();

    let result = executer!.executeTillLine(lineNumber);
    let finalTree = patchTree(tree, result, executer!, null, lineConsole!);
    socket.emit('parseComplete', finalTree);


  });


  socket.on('requestEnv', () => {

    let tree = parser!.getTree();

    let result = executer!.execute({ type:"queryEnv"})
    let finalTree = patchTree(tree, result, executer!, null, lineConsole!);
    socket.emit('requestEnvGot', finalTree);


  });

});





