<div align="center">
<img src="images/flourish.png" alt="drawing" width="400"/>
</div align>

Flourish will be an interactive programming environment that aims to develop applications ONLY in runtime. 
Flourish brings a new way of programming, consists of the language, editor, debugging mechanism, a unit testing suite, that are tightly coupled with each other for a seamless experience of coding.

The core concept around Flourish is that you can code only during run time. This concept is similar to the lisp like a programming language; where the distinction between compile-time and runtime is blurred. However, with Flourish, we have additional restrictions in place, which avoids any programing that happens ahead of runtime.


## Rationale

The significant shift in computer programing happened in the 1940s when the stored programming concept was introduced, where the result can be achieved without human intervention. Without stored programming concept, a computer can be reduced to a calculator, where each instruction had to be executed by the operator just like a driver driving a bus. However, a new breed of people was required to run this machine are Programmers. Unlike operators, they could simulate most of the execution in their mind itself which there will write convert an instruction set to be the computer. 
However, as the computers got more and more complex complete simulation required additional layers of abstraction and the use of additional tools such as a debugger. The discrepancy in the mentally simulated model and computer-executed flow results in bugs. Most of the time in software development goes for perfecting mentally simulated flow to that of computers. The gap between the mental stimulation and the seeing result of execution increases the time required to minimize this discrepancy. Tools like an interpreter, debugger, unit tests reduce the discrepancy and help programmer to align their mental model.
With Flourish we plan to avoid the simulation required to write the programs, rather see the instantaneous result and refine as we go. So the won't be a single instance of where we write the code and wait to see if executed perfectly. This means a lot of our favorite means of programming need to be revisited...
