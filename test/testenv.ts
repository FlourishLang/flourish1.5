import evaluate from '../src/backend/evaluate';
import {createEnvironment,extendEnvironment} from '../src/backend/enviroment';
import assert from 'assert';
import Parser from '../src/backend/parser';


describe("Eval", () => {

  

    it('should eval let  - 3  [add 1 3] 2', () => {   
        let environment = createEnvironment();
        let flourishParser = new Parser("let a  [add 1 3]\n");  
        let tree = flourishParser.getTree().root;
        evaluate(tree.children[0].children[0].children[0],environment).next();
        tree = flourishParser.reParse("+ a 2").root;      
        assert.equal(evaluate(tree.children[0].children[0].children[0],environment).next().value,6);

    });

    it('should fail setting same variable 2nd time', () => {   

        let flourishParser = new Parser("let a  [add 1 3]\n");  
        let environment = createEnvironment();
        let tree = flourishParser.getTree().root;

        evaluate(tree.children[0].children[0].children[0],environment).next();

        tree = flourishParser.reParse("let a  3000\n").root;      
        try {
            evaluate(tree.children[0].children[0].children[0],environment).next()    
        } catch (error) {
            
            assert.strictEqual(error.message,"Can't reset identifier: a");
        }
        

    });


    it('should not fail setting same variable 2nd time on sub environment ', () => {   
        let flourishParser = new Parser("let a  [add 1 3]\n");  
        let environment = createEnvironment();
        let tree = flourishParser.getTree().root;
        evaluate(tree.children[0].children[0].children[0],environment).next();

        let subEnvironment = extendEnvironment(environment);
        tree = flourishParser.reParse("let a  [add a 34]\n").root;      

        assert.strictEqual(evaluate(tree.children[0].children[0].children[0],subEnvironment).next().value,38);

    });



    it('should let result last val', () => {   
        let environment = createEnvironment();
        let flourishParser = new Parser("let b  4\n");  
        let tree = flourishParser.getTree().root;
        assert.equal(evaluate(tree.children[0].children[0].children[0],environment).next().value,4);

    });


    it('should let result last val', () => {   
        let flourishParser = new Parser("let b [let a 4]\n");  
        let environment = createEnvironment();


        let tree = flourishParser.getTree().root

        assert.equal(evaluate(tree.children[0].children[0].children[0],environment).next().value,4);

    });





    
});