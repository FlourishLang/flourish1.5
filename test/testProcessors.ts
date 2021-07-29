
import Executer from '../src/backend/executer';
import LineConsole from '../src/backend/lineConsole';
import assert from 'assert';
import Parser from '../src/backend/parser';

let lineConsole = new LineConsole();


describe("Processor", () => {


    it('should process if statement', function () {


        let code=`
        let a 10
        let result 0
        if (a = (9+1)):
            reset result 1
        end
        print result
        `
        let parser = new Parser(code);
        let lineConsole = new LineConsole();
        let executer = new Executer(parser.getTree(), lineConsole);
        executer.execute({ type: "start" })
        assert.deepStrictEqual(lineConsole.getData()["6"].message,1);



    });

    it('should process if negative statement', function () {


        let code=`
        let a 10
        let result 0
        if (a = (9+12)):
            reset result 1
        end
        print result
        `
        let parser = new Parser(code);
        let lineConsole = new LineConsole();
        let executer = new Executer(parser.getTree(), lineConsole);
        executer.execute({ type: "start" })
        assert.deepStrictEqual(lineConsole.getData()["6"].message,0);



    });

    it('should process if else statement', function () {


        let code=`
        let a 10
        let result 0
        if (a = (9+12)):
            reset result 1
            else:
            reset result 20
        end
        print result
        `
        let parser = new Parser(code);
        let lineConsole = new LineConsole();
        let executer = new Executer(parser.getTree(), lineConsole);
        executer.execute({ type: "start" })
        assert.deepStrictEqual(lineConsole.getData()["8"].message,20);



    });

    

    it('should successfully process if/while/function definition', function () {

        let piLeibnizMethod = `
def [pi count:1 ]:
def [nthOdd count:3 ]:
    return [+ [* 2 count] 1]
end

def [ nthSign count : 2 ] :
    if [= [% count 2] 1] :
    return [- 0 1]
    else:
    return 1
    end
end

let index count
let sum 0
while [> index 0] :
    let denom [* [nthOdd index] [nthSign index]]
    reset sum [+ sum [/ 1 denom]]
    reset index [- index 1]
end
return [* 4 [+ 1 sum]]
end

pi 100
  `

        let parser = new Parser(piLeibnizMethod);
        let lineConsole = new LineConsole();
        let executer = new Executer(parser.getTree(), lineConsole);
        executer.execute({ type: "start" })
        assert.ok(Math.abs(+lineConsole.getData()["24"].message - Math.PI) < 0.09);


    });

});


