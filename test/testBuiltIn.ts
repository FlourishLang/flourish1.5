import evaluate from '../src/backend/evaluate';
import environment,{createEnvironment} from '../src/backend/enviroment';
import assert from 'assert';
import Parser from '../src/backend/parser';


describe("builtIn", () => {

    it('should have add', () => {   
        let flourishParser = new Parser("add  1 2\n");  
        let tree = flourishParser.getTree().root;
        assert.equal(evaluate(tree.children[0].children[0].children[0],createEnvironment()).next().value,3)
    });

    // it('should return error while trying to add undefined', () => {   
    //     let flourishParser = new Parser();  
    //     let tree = flourishParser.parse("add  a 2\n");   
    //     assert.equal(evaluate(tree.children[0].children[0],createEnvironment()).constructor.name,"ERROR")
    // });


    it('should have subtract add', () => {   
        let flourishParser = new Parser("subtract  1 2\n");  
        let tree = flourishParser.getTree().root;
        assert.equal(evaluate(tree.children[0].children[0].children[0],createEnvironment()).next().value,-1)
    });

    it('should eval add  [+2 1] 2', () => {   
        let flourishParser = new Parser('add  [+ 2 1] 2\n');  
        let tree = flourishParser.getTree().root;
        assert.equal(evaluate(tree.children[0].children[0].children[0],createEnvironment()).next().value,5)
    });


    it('should eval   - 3  [add 1 3] 2', () => {   
        let flourishParser = new Parser("- 3  [add 1 3] 2\n");  
        let tree = flourishParser.getTree().root;
        assert.equal(evaluate(tree.children[0].children[0].children[0],createEnvironment()).next().value,-3)
    });


    
});