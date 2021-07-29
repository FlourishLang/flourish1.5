import evaluate from '../src/backend/evaluate';
import {createEnvironment} from '../src/backend/environment';
import assert from 'assert';
import Parser from '../src/backend/parser'


describe("Eval", () => {

    it('should eval basic statement', () => {        
        let flourishParser = new Parser(" + 1 2\n");  
        let tree = flourishParser.getTree().root;      
        assert.equal(evaluate(tree.children[0].children[0].children[0],createEnvironment()).next().value,3)
    });

    it('should fail to eval list', () => {        
        let flourishParser = new Parser("1 2 3\n");
        let tree = flourishParser.getTree().root;  
        try {
            evaluate(tree.children[0].children[0].children[0],createEnvironment()).next()    
        } catch (error) {
            assert.ok(error);
        }
        
        
    });

    it('should fail to eval incomplete expression', () => {        

        let flourishParser = new Parser("+ 1 [+ 2 3\n");
        let tree = flourishParser.getTree().root;  
        try {
            evaluate(tree.children[0].children[0].children[0],createEnvironment()).next()        
        } catch (error) {
            assert.strictEqual(error.message , "Syntax error missing ]")

        }
        
    });
    

    
});