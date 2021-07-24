<div align="center">
<img src="images/flourish.png" alt="drawing" width="150"/>
</div align>

## Introduction 
Flourish is an interactive programming environment that support incremental develop and deployee the web application. Flourish brings a new way of programming with help of the programming language, editor, debugging mechanism, unit testing suite which tightly are coupled each other for seemless experience of coding.

The core concept arround flourish is that you can code only during run time. This concept is similiar to the lisp like programming language; where distiction between compile time and runtime blurred. However with flourish we have additional restriction in place which avoids any programing that happanse ahead of runtime.

## Rationale

Significance shift in computer programing happned in 1940's when stored programing concept was introduced, where result can be achived without human intervention. Without that computer can be reduced to calulucater where each insttrcution had to be executed by operator just like a driver driving a bus. However new breed of people were require to run this machine the programmer. Unlike operater they had the capacity of simulate moste of the execution in there mind itself which there will write convert a instruction set to be the computer. Earliest pioneer like von neumann had incredeble memory and analytical capacity.

However as the computers got more and more complex complete simulation required additional layer abstraction and use of additional tools such as debugger. The descripancy in the mentally simulated model and computer executed flow result in bugs. Infact moste of the time in software development goes for perfecting mentally simulated flow to that of computers. Gap between the mental simulation and seeying result of excution increases the time required to minimise the this discepacny. Tools like interpreter, debugge, unit tests actually reduce the this time between the silaution and the result by progragrammer to align their mental model in the level of abstraction.

With flourish we plan to avoid mental simulation requred to write te program work rather the see the instantanious result and refine as we go. So the wont be single instance of wehere we write the code and wait to see if executed perfectly. This means lot of our favourite means of programming need to revisited. Functions; core componet of stored programs. Every language two destinct entry for function/procedure 1.definition 2.calling. With flourish we need to merge this two entries. Don't worry this problem has been solved.
