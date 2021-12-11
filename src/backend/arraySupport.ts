
import Environment from "./environment";
import { createEmptyEnvironment, extendEnvironment } from "./environment";
import { ERROR } from "./evaluate";
import { getAttributeBase } from "./subProcessor/classDef";

let __getReferenceArray: Environment = null;
function getReferenceArray(): Environment {
    if (!__getReferenceArray) {
        __getReferenceArray = createEmptyEnvironment();
        __getReferenceArray.setItem('resetAtIndex', arrayResetAtIndex);
        __getReferenceArray.setItem('index', arrayIndex);
        __getReferenceArray.setItem('slice', arraySlice);



    }
    return __getReferenceArray;
}


function* arrayResetAtIndex(argumentsArray: any[], outerEnvironment: Environment, callerNode: any, callerEnvironment: any) {
    let attributeListRef = callerNode.children[0];
    let { start: objectIdentifier, end: identifierRef } = getAttributeBase(attributeListRef.children);
    let thisEnvironment = outerEnvironment.getItem(objectIdentifier.leafText) as Environment;
    let reference = (thisEnvironment as Environment).getItem('__internalReference');

    if (typeof reference != typeof argumentsArray[1])
        throw new ERROR("Mismatching array element");
    let data = (thisEnvironment as Environment).getItem('__internalData');

    data[argumentsArray[0]] = argumentsArray[1];

    return argumentsArray[1];
}


function* arraySlice(argumentsArray: any[], outerEnvironment: Environment, callerNode: any, callerEnvironment: any) {
    let attributeListRef = callerNode.children[0];
    let { start: objectIdentifier, end: identifierRef } = getAttributeBase(attributeListRef.children);
    let thisEnvironment = outerEnvironment.getItem(objectIdentifier.leafText) as Environment;

    let data = (thisEnvironment as Environment).getItem('__internalData');
    let slicedArray = data.slice(argumentsArray[0],argumentsArray[1]);

    let arrayEnv = extendEnvironment(getReferenceArray());
    let length = slicedArray.length;
    arrayEnv.setItem('length', length);
    arrayEnv.setItem('__internalData', slicedArray);
    arrayEnv.setItem('__internalReference', (thisEnvironment as Environment).getItem('__internalReference'));


    return arrayEnv;
}

function* arrayIndex(argumentsArray: any[], outerEnvironment: Environment, callerNode: any, callerEnvironment: any) {

    let attributeListRef = callerNode.children[0];
    let { start: objectIdentifier, end: identifierRef } = getAttributeBase(attributeListRef.children);
    let thisEnvironment = outerEnvironment.getItem(objectIdentifier.leafText) as Environment;
    let data = (thisEnvironment as Environment).getItem('__internalData');
    return data[argumentsArray[0]];
}


export function* arrayCreate(argumentsArray: any[]) {

    if(argumentsArray.length <2)
        throw new ERROR("Two no of parameters expected");
    
    let arrayEnv = extendEnvironment(getReferenceArray());
    let length = argumentsArray[0];
    let reference = argumentsArray[1];
    let ret = new Array(length);
    ret.fill(reference, 0, length);
    arrayEnv.setItem('length', length);
    arrayEnv.setItem('__internalData', ret);
    arrayEnv.setItem('__internalReference', reference);


    return arrayEnv;
}


